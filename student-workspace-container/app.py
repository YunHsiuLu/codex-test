import argparse
import os
import secrets
import shutil
import sqlite3
import tempfile
import zipfile
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path, PurePosixPath

from flask import (
    Flask,
    abort,
    flash,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    send_file,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = BASE_DIR / "data"
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
MAX_PREVIEW_BYTES = 2 * 1024 * 1024


def create_app(test_config=None):
    data_dir = Path(os.environ.get("STUDENT_WORKSPACE_DATA_DIR", DEFAULT_DATA_DIR))
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("STUDENT_WORKSPACE_SECRET") or secrets.token_hex(32),
        DATABASE=str(data_dir / "accounts.db"),
        STORAGE_ROOT=str(data_dir / "storage"),
        MAX_CONTENT_LENGTH=MAX_UPLOAD_BYTES,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
    )
    if test_config:
        app.config.update(test_config)

    Path(app.config["DATABASE"]).parent.mkdir(parents=True, exist_ok=True)
    Path(app.config["STORAGE_ROOT"]).mkdir(parents=True, exist_ok=True)

    app.teardown_appcontext(close_db)
    app.jinja_env.filters["filesize"] = format_filesize
    register_routes(app)

    with app.app_context():
        init_db()

    return app


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            g.get("database_path") or current_app_config("DATABASE"),
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
    return g.db


def current_app_config(key):
    from flask import current_app

    return current_app.config[key]


def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            storage_id TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        )
        """
    )
    db.commit()


def create_user(username, display_name, password):
    username = username.strip()
    display_name = display_name.strip()
    validate_account_fields(username, display_name, password)
    storage_id = username
    storage_path = user_root(storage_id)
    if storage_path.exists():
        raise ValueError("學生儲存資料夾已存在。")

    storage_path.mkdir(parents=True)
    db = get_db()
    try:
        db.execute(
            """
            INSERT INTO users
                (username, display_name, password_hash, storage_id, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                username,
                display_name,
                generate_password_hash(password),
                storage_id,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        db.commit()
    except sqlite3.IntegrityError as exc:
        storage_path.rmdir()
        raise ValueError("帳號已存在。") from exc


def validate_account_fields(username, display_name, password):
    if not username or len(username) > 50:
        raise ValueError("帳號長度必須介於 1 到 50 個字元。")
    if any(char.isspace() for char in username):
        raise ValueError("帳號不可包含空白。")
    if "/" in username or "\\" in username or username in (".", ".."):
        raise ValueError("帳號不可包含路徑符號。")
    if not display_name or len(display_name) > 80:
        raise ValueError("姓名長度必須介於 1 到 80 個字元。")
    if len(password) < 8:
        raise ValueError("密碼至少需要 8 個字元。")


def user_root(storage_id):
    return Path(current_app_config("STORAGE_ROOT")) / storage_id


def migrate_storage_names():
    users = get_db().execute(
        "SELECT id, username, storage_id FROM users ORDER BY username"
    ).fetchall()
    migrations = []

    for user in users:
        source = user_root(user["storage_id"])
        destination = user_root(user["username"])
        if source == destination:
            destination.mkdir(parents=True, exist_ok=True)
            continue
        if destination.exists():
            raise ValueError(f"目的資料夾已存在，停止遷移：{destination}")
        if not source.exists():
            raise ValueError(f"找不到原始資料夾，停止遷移：{source}")
        migrations.append((user, source, destination))

    db = get_db()
    completed = []
    try:
        for user, source, destination in migrations:
            source.rename(destination)
            completed.append((source, destination))
            db.execute(
                "UPDATE users SET storage_id = ? WHERE id = ?",
                (user["username"], user["id"]),
            )
        db.commit()
    except Exception:
        db.rollback()
        for source, destination in reversed(completed):
            if destination.exists() and not source.exists():
                destination.rename(source)
        raise
    return len(migrations)


def find_user(username):
    return get_db().execute(
        "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
        (username.strip(),),
    ).fetchone()


def current_user_root():
    root = user_root(g.user["storage_id"])
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()


def safe_path(relative_path="", *, must_exist=True):
    relative_path = (relative_path or "").replace("\\", "/").strip("/")
    parts = PurePosixPath(relative_path).parts if relative_path else ()
    if any(part in ("", ".", "..") for part in parts):
        abort(400, "路徑格式錯誤。")

    root = current_user_root()
    candidate = root.joinpath(*parts)
    if must_exist:
        try:
            resolved = candidate.resolve(strict=True)
        except FileNotFoundError:
            abort(404, "找不到指定的檔案或資料夾。")
    else:
        resolved = candidate.resolve(strict=False)

    if resolved != root and root not in resolved.parents:
        abort(403, "禁止存取個人儲存空間以外的位置。")
    if candidate.is_symlink() or any(parent.is_symlink() for parent in candidate.parents if parent != root):
        abort(403, "不允許使用符號連結。")
    return resolved


def validate_name(name):
    name = (name or "").strip()
    if (
        not name
        or name in (".", "..")
        or "/" in name
        or "\\" in name
        or "\x00" in name
        or len(name) > 255
    ):
        abort(400, "名稱格式錯誤。")
    return name


def safe_upload_parts(filename):
    normalized = (filename or "").replace("\\", "/").strip("/")
    parts = PurePosixPath(normalized).parts
    if not parts or any(part in ("", ".", "..") for part in parts):
        abort(400, "上傳檔案的路徑格式錯誤。")
    return [validate_name(part) for part in parts]


def login_required(view):
    @wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for("login"))
        return view(**kwargs)

    return wrapped_view


def csrf_token():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)
    return session["csrf_token"]


def require_csrf():
    submitted = request.form.get("csrf_token") or request.headers.get("X-CSRF-Token")
    if not submitted or not secrets.compare_digest(submitted, session.get("csrf_token", "")):
        abort(400, "安全驗證失敗，請重新整理頁面後再試。")


def register_routes(app):
    app.jinja_env.globals["csrf_token"] = csrf_token

    @app.before_request
    def load_logged_in_user():
        user_id = session.get("user_id")
        g.user = (
            get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if user_id
            else None
        )

    @app.get("/")
    def index():
        return redirect(url_for("workspace") if g.user else url_for("login"))

    @app.get("/healthz")
    def healthz():
        get_db().execute("SELECT 1").fetchone()
        return {"status": "ok"}

    @app.route("/login", methods=("GET", "POST"))
    def login():
        if g.user:
            return redirect(url_for("workspace"))
        if request.method == "POST":
            require_csrf()
            username = request.form.get("username", "").strip()
            password = request.form.get("password", "")
            user = get_db().execute(
                "SELECT * FROM users WHERE username = ? COLLATE NOCASE", (username,)
            ).fetchone()
            if user is None or not check_password_hash(user["password_hash"], password):
                flash("帳號或密碼錯誤。", "error")
            else:
                session.clear()
                session["user_id"] = user["id"]
                csrf_token()
                return redirect(url_for("workspace"))
        return render_template("login.html")

    @app.post("/logout")
    @login_required
    def logout():
        require_csrf()
        session.clear()
        return redirect(url_for("login"))

    @app.get("/workspace")
    @login_required
    def workspace():
        relative_path = request.args.get("path", "")
        directory = safe_path(relative_path)
        if not directory.is_dir():
            abort(400, "指定路徑不是資料夾。")

        items = []
        for item in directory.iterdir():
            if item.is_symlink():
                continue
            stat = item.stat()
            items.append(
                {
                    "name": item.name,
                    "is_dir": item.is_dir(),
                    "size": stat.st_size,
                    "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime(
                        "%Y-%m-%d %H:%M"
                    ),
                }
            )
        items.sort(key=lambda item: (not item["is_dir"], item["name"].casefold()))
        breadcrumbs = breadcrumb_items(relative_path)
        return render_template(
            "workspace.html",
            items=items,
            current_path=relative_path.strip("/"),
            breadcrumbs=breadcrumbs,
        )

    @app.post("/folders")
    @login_required
    def create_folder():
        require_csrf()
        parent = safe_path(request.form.get("path", ""))
        if not parent.is_dir():
            abort(400, "指定路徑不是資料夾。")
        destination = safe_path(
            join_relative(request.form.get("path", ""), validate_name(request.form.get("name"))),
            must_exist=False,
        )
        try:
            destination.mkdir()
        except FileExistsError:
            flash("已有同名檔案或資料夾。", "error")
        return redirect(url_for("workspace", path=request.form.get("path", "")))

    @app.post("/upload")
    @login_required
    def upload():
        require_csrf()
        current_path = request.form.get("path", "")
        target_dir = safe_path(current_path)
        if not target_dir.is_dir():
            abort(400, "指定路徑不是資料夾。")

        uploaded_files = request.files.getlist("files")
        saved_count = 0
        for uploaded in uploaded_files:
            if not uploaded.filename:
                continue
            parts = safe_upload_parts(uploaded.filename)
            destination = safe_path(
                join_relative(current_path, *parts), must_exist=False
            )
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.exists() and destination.is_dir():
                abort(409, "同名資料夾已存在，無法覆蓋。")
            uploaded.save(destination)
            saved_count += 1

        if saved_count:
            flash(f"已上傳 {saved_count} 個檔案。", "success")
        else:
            flash("沒有選取可上傳的檔案。", "error")
        return jsonify({"redirect": url_for("workspace", path=current_path)})

    @app.post("/delete")
    @login_required
    def delete_item():
        require_csrf()
        current_path = request.form.get("path", "")
        name = validate_name(request.form.get("name"))
        target = safe_path(join_relative(current_path, name))
        if target == current_user_root():
            abort(403)
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
        flash(f"已刪除「{name}」。", "success")
        return redirect(url_for("workspace", path=current_path))

    @app.get("/download")
    @login_required
    def download():
        target = safe_path(request.args.get("path", ""))
        if target.is_file():
            return send_file(target, as_attachment=True, download_name=target.name)
        if not target.is_dir():
            abort(400, "只能下載檔案或資料夾。")

        archive = build_directory_archive(target)
        response = send_file(
            archive,
            as_attachment=True,
            download_name=f"{target.name}.zip",
            mimetype="application/zip",
        )
        response.call_on_close(lambda: archive.unlink(missing_ok=True))
        return response

    @app.get("/preview")
    @login_required
    def preview():
        relative_path = request.args.get("path", "")
        target = safe_path(relative_path)
        if not target.is_file():
            abort(400, "只能預覽檔案。")

        file_size = target.stat().st_size
        preview_error = None
        content = None
        if file_size > MAX_PREVIEW_BYTES:
            preview_error = "檔案超過 2 MB，請使用下載功能查看。"
        else:
            raw_content = target.read_bytes()
            if b"\x00" in raw_content:
                preview_error = "這是二進位檔案，無法在瀏覽器中預覽。"
            else:
                content = raw_content.decode("utf-8-sig", errors="replace")

        parent_path = str(PurePosixPath(relative_path).parent)
        if parent_path == ".":
            parent_path = ""
        return render_template(
            "preview.html",
            filename=target.name,
            relative_path=relative_path.strip("/"),
            parent_path=parent_path,
            file_size=file_size,
            content=content,
            preview_error=preview_error,
        )

    @app.errorhandler(413)
    def file_too_large(_error):
        return "單次上傳總量不可超過 100 MB。", 413


def join_relative(*parts):
    values = [str(part).strip("/") for part in parts if str(part).strip("/")]
    return "/".join(values)


def breadcrumb_items(relative_path):
    crumbs = [{"name": "我的空間", "path": ""}]
    accumulated = []
    for part in PurePosixPath(relative_path.strip("/")).parts if relative_path.strip("/") else ():
        accumulated.append(part)
        crumbs.append({"name": part, "path": "/".join(accumulated)})
    return crumbs


def format_filesize(size):
    value = float(size)
    for unit in ("B", "KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            return f"{int(value)} {unit}" if unit == "B" else f"{value:.1f} {unit}"
        value /= 1024


def build_directory_archive(directory):
    temporary = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
    archive_path = Path(temporary.name)
    temporary.close()

    try:
        with zipfile.ZipFile(
            archive_path, "w", compression=zipfile.ZIP_DEFLATED
        ) as archive:
            for root, directory_names, file_names in os.walk(
                directory, followlinks=False
            ):
                root_path = Path(root)
                directory_names[:] = [
                    name
                    for name in directory_names
                    if not (root_path / name).is_symlink()
                ]
                relative_root = root_path.relative_to(directory.parent)
                if not directory_names and not file_names:
                    archive.writestr(f"{relative_root.as_posix()}/", "")
                for filename in file_names:
                    source = root_path / filename
                    if source.is_symlink():
                        continue
                    archive.write(
                        source,
                        arcname=(relative_root / filename).as_posix(),
                    )
    except Exception:
        archive_path.unlink(missing_ok=True)
        raise
    return archive_path


def main():
    parser = argparse.ArgumentParser(description="學生程式碼儲存空間")
    subparsers = parser.add_subparsers(dest="command")
    create_parser = subparsers.add_parser("create-user", help="建立學生帳號")
    create_parser.add_argument("username")
    create_parser.add_argument("display_name")
    create_parser.add_argument("password")
    subparsers.add_parser("list-users", help="列出學生帳號")
    path_parser = subparsers.add_parser(
        "student-path", help="顯示指定學生儲存空間的絕對路徑"
    )
    path_parser.add_argument("username")
    subparsers.add_parser(
        "migrate-storage-names", help="將既有儲存資料夾改為學生帳號"
    )
    args = parser.parse_args()

    app = create_app()
    if args.command == "create-user":
        with app.app_context():
            try:
                create_user(args.username, args.display_name, args.password)
            except ValueError as exc:
                parser.error(str(exc))
        print(f"已建立帳號：{args.username}（{args.display_name}）")
        return
    if args.command == "list-users":
        with app.app_context():
            users = get_db().execute(
                "SELECT username, display_name, created_at FROM users ORDER BY username"
            ).fetchall()
        for user in users:
            print(f"{user['username']}\t{user['display_name']}\t{user['created_at']}")
        return
    if args.command == "student-path":
        with app.app_context():
            user = find_user(args.username)
            if user is None:
                parser.error(f"找不到帳號：{args.username}")
            print(user_root(user["storage_id"]).resolve())
        return
    if args.command == "migrate-storage-names":
        with app.app_context():
            try:
                count = migrate_storage_names()
            except ValueError as exc:
                parser.error(str(exc))
            print(f"已遷移 {count} 位學生的儲存資料夾。")
        return

    app.run(host="0.0.0.0", port=5002, debug=False)


if __name__ == "__main__":
    main()
