import io
import tempfile
import unittest
import zipfile
from pathlib import Path

from app import (
    create_app,
    create_user,
    find_user,
    get_db,
    migrate_storage_names,
    user_root,
)


class WorkspaceTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        root = Path(self.temp_dir.name)
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "DATABASE": str(root / "accounts.db"),
                "STORAGE_ROOT": str(root / "storage"),
            }
        )
        with self.app.app_context():
            create_user("student1", "學生一", "password1")
            create_user("student2", "學生二", "password2")
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def csrf(self):
        with self.client.session_transaction() as session:
            return session["csrf_token"]

    def login(self, username="student1", password="password1"):
        self.client.get("/login")
        return self.client.post(
            "/login",
            data={"username": username, "password": password, "csrf_token": self.csrf()},
            follow_redirects=True,
        )

    def test_login_and_logout(self):
        response = self.login()
        self.assertIn("學生一".encode(), response.data)
        response = self.client.post(
            "/logout", data={"csrf_token": self.csrf()}, follow_redirects=True
        )
        self.assertIn("登入我的空間".encode(), response.data)

    def test_health_check(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})

    def test_folder_upload_download_and_delete(self):
        self.login()
        response = self.client.post(
            "/folders",
            data={"path": "", "name": "作業一", "csrf_token": self.csrf()},
            follow_redirects=True,
        )
        self.assertIn("作業一".encode(), response.data)

        response = self.client.post(
            "/upload",
            data={
                "path": "作業一",
                "csrf_token": self.csrf(),
                "files": (io.BytesIO(b"print('hello')"), "main.py"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.get("/workspace?path=作業一")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"main.py", response.data)
        self.assertIn(b"14 B", response.data)
        self.assertIn(b"/preview?path=", response.data)
        self.assertIn(b'target="_blank"', response.data)
        self.assertIn(b'rel="noopener"', response.data)
        self.assertIn(b"Download", response.data)

        response = self.client.get("/preview?path=作業一/main.py")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"print(&#39;hello&#39;)", response.data)
        self.assertIn("不會執行程式碼".encode(), response.data)

        response = self.client.get("/download?path=作業一/main.py")
        self.assertEqual(response.data, b"print('hello')")
        response.close()

        response = self.client.get("/download?path=作業一")
        try:
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.mimetype, "application/zip")
            self.assertIn("filename*=UTF-8''", response.headers["Content-Disposition"])
            with zipfile.ZipFile(io.BytesIO(response.data)) as archive:
                self.assertEqual(archive.namelist(), ["作業一/main.py"])
                self.assertEqual(archive.read("作業一/main.py"), b"print('hello')")
        finally:
            response.close()

        response = self.client.post(
            "/delete",
            data={"path": "作業一", "name": "main.py", "csrf_token": self.csrf()},
        )
        self.assertEqual(response.status_code, 302)

    def test_binary_and_large_files_are_not_rendered(self):
        self.login()
        with self.app.app_context():
            root = user_root("student1")
            (root / "binary.bin").write_bytes(b"\x00\x01\x02")
            (root / "large.py").write_bytes(b"a" * (2 * 1024 * 1024 + 1))

        binary = self.client.get("/preview?path=binary.bin")
        self.assertIn("二進位檔案".encode(), binary.data)
        self.assertNotIn(b"\x00\x01\x02", binary.data)

        large = self.client.get("/preview?path=large.py")
        self.assertIn("超過 2 MB".encode(), large.data)

    def test_users_are_isolated(self):
        self.login()
        self.client.post(
            "/upload",
            data={
                "path": "",
                "csrf_token": self.csrf(),
                "files": (io.BytesIO(b"private"), "secret.py"),
            },
            content_type="multipart/form-data",
        )
        self.client.post("/logout", data={"csrf_token": self.csrf()})
        self.login("student2", "password2")
        response = self.client.get("/workspace")
        self.assertNotIn(b"secret.py", response.data)

    def test_path_traversal_is_blocked(self):
        self.login()
        response = self.client.get("/workspace?path=..")
        self.assertEqual(response.status_code, 400)
        response = self.client.post(
            "/upload",
            data={
                "path": "",
                "csrf_token": self.csrf(),
                "files": (io.BytesIO(b"bad"), "../escape.py"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 400)

    def test_passwords_are_hashed(self):
        with self.app.app_context():
            user = get_db().execute(
                "SELECT password_hash FROM users WHERE username = ?", ("student1",)
            ).fetchone()
            self.assertNotEqual(user["password_hash"], "password1")
            self.assertTrue(user["password_hash"].startswith("scrypt:"))

    def test_student_storage_folder_uses_account_name(self):
        with self.app.app_context():
            user = find_user("student1")
            self.assertEqual(user["storage_id"], "student1")
            self.assertTrue(user_root("student1").is_dir())

    def test_legacy_storage_folder_can_be_migrated(self):
        with self.app.app_context():
            original = user_root("student1")
            legacy = user_root("legacy-storage-id")
            original.rename(legacy)
            get_db().execute(
                "UPDATE users SET storage_id = ? WHERE username = ?",
                ("legacy-storage-id", "student1"),
            )
            get_db().commit()

            self.assertEqual(migrate_storage_names(), 1)
            self.assertTrue(original.is_dir())
            self.assertFalse(legacy.exists())
            self.assertEqual(find_user("student1")["storage_id"], "student1")


if __name__ == "__main__":
    unittest.main()
