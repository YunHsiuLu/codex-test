#!/usr/bin/env python3
"""Local coordinator for a Codex + AGY project collaboration loop."""

from __future__ import annotations

import json
import os
import re
import shutil
import signal
import subprocess
import threading
import time
import uuid
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


APP_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = APP_DIR.parent.resolve()
RUNS_DIR = APP_DIR / ".runs"
STATE_FILE = RUNS_DIR / "tasks.json"
MAX_TASK_LENGTH = 8_000
MAX_CONTEXT_LENGTH = 24_000
CLI_TIMEOUT_SECONDS = 600
DEFAULT_MAX_ROUNDS = 8
MAX_ROUNDS = 16
MAX_TOTAL_ROUNDS = 40
TASKS: dict[str, dict[str, Any]] = {}
TASKS_LOCK = threading.RLock()
PROCESSES: dict[str, subprocess.Popen[str]] = {}


def now() -> str:
    return time.strftime("%H:%M:%S")


def clip(value: str, limit: int = MAX_CONTEXT_LENGTH) -> str:
    value = value.strip()
    return value if len(value) <= limit else "…（較早內容已省略）\n" + value[-limit:]


def clean_text(value: str) -> str:
    return re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", value).strip()


def normalise_task(task: dict[str, Any]) -> dict[str, Any]:
    task["messages"] = [message for message in task.get("messages", []) if message.get("kind") != "thinking"]
    task.setdefault("mode", "discussion")
    task.setdefault("build_round", 0)
    task.setdefault("max_rounds", DEFAULT_MAX_ROUNDS)
    task.setdefault("stop_requested", False)
    task.setdefault("project_message_start", None)
    task.setdefault("agy_disabled", False)
    if any("quota" in str(message.get("content", "")).lower() for message in task["messages"]):
        task["agy_disabled"] = True
    if task.get("status") in {"queued", "running"}:
        task["status"] = "ready"
        task["messages"].append(
            {"id": str(uuid.uuid4()), "speaker": "系統", "kind": "system", "content": "伺服器重新啟動；此任務已安全暫停，可繼續執行。", "time": now()}
        )
    return task


def save_tasks() -> None:
    RUNS_DIR.mkdir(exist_ok=True)
    snapshot = list(TASKS.values())
    temporary = RUNS_DIR / "tasks.pending.json"
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(STATE_FILE)


def load_tasks() -> None:
    candidates = [STATE_FILE, *sorted(RUNS_DIR.glob("recovery-*.json"))]
    for candidate in candidates:
        if not candidate.exists():
            continue
        try:
            payload = json.loads(candidate.read_text(encoding="utf-8"))
            items = payload if isinstance(payload, list) else [payload]
            for item in items:
                if isinstance(item, dict) and item.get("id"):
                    TASKS[item["id"]] = normalise_task(item)
            if TASKS:
                break
        except (OSError, json.JSONDecodeError):
            continue
    if TASKS:
        save_tasks()


def project_directory(name: str, task_id: str) -> Path:
    """Create a dedicated project directory, always beneath Collaboration."""
    folder_name = name.strip() or f"project-{task_id}"
    candidate = (APP_DIR / folder_name).resolve()
    if candidate.parent != APP_DIR or folder_name.startswith(".") or len(folder_name) > 80:
        raise ValueError("專案資料夾名稱只能是 Collaboration 底下的一層資料夾。")
    if candidate.exists():
        raise ValueError("這個專案資料夾已存在，請換一個名稱。")
    candidate.mkdir()
    return candidate


def ensure_project_directory(task: dict[str, Any]) -> None:
    """Migrate a legacy root-level task before granting Codex write access."""
    current = Path(task["workspace"]).resolve()
    if current != APP_DIR:
        if APP_DIR not in current.parents:
            raise ValueError("專案資料夾必須位於 Collaboration 之內。")
        return
    directory = APP_DIR / f"project-{task['id']}"
    directory.mkdir(exist_ok=True)
    with TASKS_LOCK:
        task["workspace"] = str(directory)
        save_tasks()
    append_message(task, "系統", "system", f"已建立專屬專案資料夾：{directory.name}。代理只會在此資料夾內進行實作。")


def append_message(task: dict[str, Any], speaker: str, kind: str, content: str) -> None:
    with TASKS_LOCK:
        task["messages"].append(
            {"id": str(uuid.uuid4()), "speaker": speaker, "kind": kind, "content": content, "time": now()}
        )
        task["updated_at"] = time.time()
        save_tasks()


def set_status(task: dict[str, Any], status: str) -> None:
    with TASKS_LOCK:
        task["status"] = status
        task["updated_at"] = time.time()
        save_tasks()


def clear_thinking(task: dict[str, Any]) -> None:
    with TASKS_LOCK:
        task["messages"] = [message for message in task["messages"] if message["kind"] != "thinking"]
        save_tasks()


def transcript(task: dict[str, Any]) -> str:
    start = task.get("project_message_start") if task.get("mode") == "project" else None
    messages = task["messages"][start:] if isinstance(start, int) else task["messages"]
    messages = messages[-8:]
    lines = []
    for message in messages:
        if message["kind"] in {"agent", "user"}:
            lines.append(f"【{message['speaker']}】\n{message['content']}")
    return clip("\n\n".join(lines))


def terminate_process_group(process: subprocess.Popen[str]) -> None:
    if process.poll() is not None:
        return
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass


def run_command(task: dict[str, Any], command: list[str], cwd: Path, timeout: int = CLI_TIMEOUT_SECONDS) -> str:
    process = subprocess.Popen(
        command,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, "NO_COLOR": "1"},
        start_new_session=True,
    )
    with TASKS_LOCK:
        PROCESSES[task["id"]] = process
    try:
        try:
            output, _ = process.communicate(timeout=timeout)
        except subprocess.TimeoutExpired:
            terminate_process_group(process)
            process.communicate()
            raise
    finally:
        with TASKS_LOCK:
            PROCESSES.pop(task["id"], None)
    output = clean_text(output or "")
    if task.get("stop_requested"):
        raise InterruptedError("已由使用者停止協作。")
    if process.returncode != 0:
        raise RuntimeError(output or f"指令以狀態碼 {process.returncode} 結束。")
    return output


def ask_codex(task: dict[str, Any], prompt: str, writable: bool) -> str:
    executable = shutil.which("codex")
    if not executable:
        raise RuntimeError("找不到 codex CLI。請先確認它已安裝在 PATH 中。")
    RUNS_DIR.mkdir(exist_ok=True)
    output_file = RUNS_DIR / f"{task['id']}-codex.txt"
    command = [
        executable,
        "--ask-for-approval", "never",
        "exec",
        "--sandbox", "workspace-write" if writable else "read-only",
        "--output-last-message", str(output_file),
        "-C", task["workspace"],
        prompt,
    ]
    output = run_command(task, command, Path(task["workspace"]))
    if output_file.exists():
        answer = clean_text(output_file.read_text(encoding="utf-8", errors="replace"))
        if answer:
            return answer
    return output


def ask_agy(task: dict[str, Any], prompt: str) -> str:
    executable = shutil.which("agy")
    if not executable:
        raise RuntimeError("找不到 agy CLI。請先確認它已安裝在 PATH 中。")
    return run_command(task, [executable, "--new-project", "--sandbox", "--print", "--mode", "plan", "--prompt", prompt], Path(task["workspace"]))


def implementation_prompt(task: dict[str, Any]) -> str:
    return f"""你是 Codex，這個專案的主要實作代理。使用者目標如下：

{task['goal']}

工作資料夾：{task['workspace']}
目前是第 {task['build_round']}／{task['max_rounds']} 個實作循環。

你的任務不是只提出建議：請先檢查現有專案與討論紀錄，選擇目前最重要、可驗證的一小段工作，直接在工作資料夾內完成實作，並執行適當測試或實際驗證。

規範：
1. 可以建立與修改此工作資料夾內的專案檔案，但不要刪除既有使用者資料、不要存取正式帳號／資料庫、不要部署到外部服務、不要 git commit。
2. 讀取 AGY 的意見並實際處理可行的問題；若意見不合理，說明原因。
3. 每輪應產生可運作的進展，而非只寫計畫。
4. 回覆請使用繁體中文，列出：本輪完成項目、驗證結果、仍待完成項目、下一輪建議。
5. 最後獨立一行輸出 `STATE: COMPLETE`，僅當整個使用者目標已完成且已驗證；否則輸出 `STATE: CONTINUE`。若無法安全繼續，輸出 `STATE: BLOCKED`。

近期共用討論紀錄：
{transcript(task)}
"""


def review_prompt(task: dict[str, Any]) -> str:
    return f"""你是 AGY，這個專案的唯讀技術審查代理。

使用者目標：{task['goal']}
工作資料夾：{task['workspace']}

Codex 剛完成一輪實作。請唯讀檢查實際檔案、變更與可執行驗證，不要修改任何檔案。你的檢查範圍只能是上述工作資料夾；不要檢查 scratch、設定檔、其他專案或網路資料。請優先檢查：功能是否符合目標、明顯缺陷、資料或安全風險、測試不足、下一個最重要的改進。

以繁體中文回答，包含：審查結果、必要修正、可選改善、給 Codex 的具體下一步。
第一行必須精確輸出 `TASK_ID: {task['id']}`。最後獨立一行輸出：如果整個使用者目標已真正完成且可接受，輸出 `VERDICT: APPROVE`；否則輸出 `VERDICT: CHANGES_REQUIRED`。不可只因程式能執行就批准。

近期共用討論紀錄：
{transcript(task)}
"""


def self_review_prompt(task: dict[str, Any]) -> str:
    return f"""你是 Codex，現在進入唯讀自我審查階段。AGY 的額度暫時不可用，因此這不是雙代理驗收。

使用者目標：{task['goal']}
工作資料夾：{task['workspace']}

請不要修改檔案。請檢查剛才的實作、差異與測試結果，特別找出：功能缺口、權限或資料安全問題、無法驗證的主張、下一個最重要的修正。以繁體中文輸出：自我審查、必要修正、可選改善、下一輪方向。

最後獨立一行：若整個目標已完整完成且有足夠驗證，輸出 `SELF_REVIEW: APPROVE`；否則輸出 `SELF_REVIEW: CHANGES_REQUIRED`。

近期共用討論紀錄：
{transcript(task)}
"""


def is_agy_quota_error(error: Exception) -> bool:
    text = str(error).lower()
    return "quota" in text or "subscription" in text or "limit" in text and "reset" in text


def project_loop(task: dict[str, Any], instruction: str | None = None) -> None:
    try:
        with TASKS_LOCK:
            task["mode"] = "project"
            task["stop_requested"] = False
            task["project_message_start"] = len(task["messages"])
            save_tasks()
        set_status(task, "running")
        if instruction:
            append_message(task, "你", "user", instruction)
        append_message(task, "系統", "system", "專案協作開始：Codex 實作與驗證，AGY 唯讀審查，再由 Codex 繼續修正。")

        while True:
            if task.get("stop_requested"):
                raise InterruptedError("已由使用者停止協作。")
            if task["build_round"] >= task["max_rounds"]:
                if task["max_rounds"] >= MAX_TOTAL_ROUNDS:
                    append_message(task, "系統", "system", "已達 40 個協作循環的安全上限。請檢視目前成果後補充更具體的方向，再繼續執行。")
                    set_status(task, "ready")
                    return
                with TASKS_LOCK:
                    task["max_rounds"] = min(task["max_rounds"] + DEFAULT_MAX_ROUNDS, MAX_TOTAL_ROUNDS)
                    save_tasks()
                append_message(task, "系統", "system", f"已完成一個協作檢查點，將自動延長至第 {task['max_rounds']} 輪並繼續。")
                continue
            with TASKS_LOCK:
                task["build_round"] += 1
                save_tasks()
            append_message(task, "系統", "system", f"第 {task['build_round']}／{task['max_rounds']} 輪：開始實作與審查。")
            append_message(task, "Codex", "thinking", "正在檢查專案、實作下一個可驗證項目……")
            codex = ask_codex(task, implementation_prompt(task), writable=True)
            clear_thinking(task)
            append_message(task, "Codex", "agent", codex)

            if "STATE: BLOCKED" in codex.upper():
                append_message(task, "系統", "system", "Codex 回報無法安全繼續；請閱讀阻礙原因後補充指示。")
                set_status(task, "blocked")
                return

            review_valid = False
            approved = False
            if not task.get("agy_disabled"):
                append_message(task, "AGY", "thinking", "正在唯讀檢查本輪實作與驗證結果……")
                try:
                    agy = ask_agy(task, review_prompt(task))
                    clear_thinking(task)
                    review_valid = f"TASK_ID: {task['id']}" in agy
                    append_message(task, "AGY", "agent" if review_valid else "off_task", agy)
                    if not review_valid:
                        append_message(task, "系統", "system", "AGY 未回傳此任務的識別碼，已標記為離題審查；Codex 不會採用這份意見，將依實際專案狀態繼續。")
                    approved = review_valid and "VERDICT: APPROVE" in agy.upper()
                except RuntimeError as error:
                    clear_thinking(task)
                    if not is_agy_quota_error(error):
                        raise
                    with TASKS_LOCK:
                        task["agy_disabled"] = True
                        save_tasks()
                    append_message(task, "系統", "system", "AGY 額度暫時不可用；已切換為 Codex 唯讀自我審查。這段期間不會標示為雙代理驗收。")

            if task.get("agy_disabled"):
                append_message(task, "Codex", "thinking", "正在以唯讀模式自我審查本輪成果……")
                self_review = ask_codex(task, self_review_prompt(task), writable=False)
                clear_thinking(task)
                append_message(task, "Codex", "self_review", self_review)
                approved = "SELF_REVIEW: APPROVE" in self_review.upper()

            complete = "STATE: COMPLETE" in codex.upper()
            if complete and approved:
                conclusion = "Codex 自我審查通過；專案暫以單代理模式完成，等待 AGY 恢復後建議再做一次外部審查。" if task.get("agy_disabled") else "AGY 已批准 Codex 的完成判斷；專案協作完成。"
                append_message(task, "系統", "system", conclusion)
                set_status(task, "completed")
                return
            append_message(task, "系統", "system", "審查尚未批准完成；Codex 會帶著審查意見進入下一輪。")

    except InterruptedError:
        clear_thinking(task)
        append_message(task, "系統", "system", "專案協作已停止；已完成的檔案會保留，沒有進行自動回復。")
        set_status(task, "stopped")
    except subprocess.TimeoutExpired:
        clear_thinking(task)
        append_message(task, "系統", "error", "其中一個 CLI 超過 15 分鐘未完成；本輪已停止。")
        set_status(task, "error")
    except Exception as error:
        clear_thinking(task)
        append_message(task, "系統", "error", f"執行失敗：{clean_text(str(error))}")
        set_status(task, "error")


def start_project(task: dict[str, Any], instruction: str | None = None) -> None:
    if task["status"] == "running":
        raise ValueError("此任務正在執行中。")
    ensure_project_directory(task)
    threading.Thread(target=project_loop, args=(task, instruction), daemon=True).start()


def stop_project(task: dict[str, Any]) -> None:
    with TASKS_LOCK:
        task["stop_requested"] = True
        process = PROCESSES.get(task["id"])
        save_tasks()
    if process and process.poll() is None:
        terminate_process_group(process)


class CollaborationHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        print(f"[{now()}] {format % args}")

    def send_json(self, payload: Any, status: int = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def task_or_404(self, task_id: str) -> dict[str, Any] | None:
        with TASKS_LOCK:
            return TASKS.get(task_id)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/health":
            self.send_json({"codex": bool(shutil.which("codex")), "agy": bool(shutil.which("agy"))})
            return
        if path.startswith("/api/tasks/"):
            task = self.task_or_404(path.rsplit("/", 1)[-1])
            if not task:
                self.send_json({"error": "找不到任務。"}, HTTPStatus.NOT_FOUND)
            else:
                self.send_json(task)
            return
        if path == "/api/tasks":
            with TASKS_LOCK:
                tasks = [{key: value for key, value in task.items() if key != "messages"} for task in TASKS.values()]
            self.send_json({"tasks": sorted(tasks, key=lambda item: item["updated_at"], reverse=True)})
            return
        return super().do_GET()

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            body = self.read_json()
            if path == "/api/tasks":
                goal = str(body.get("goal", "")).strip()
                if not goal or len(goal) > MAX_TASK_LENGTH:
                    raise ValueError("請輸入 1 至 8,000 字的任務說明。")
                task_id = uuid.uuid4().hex[:10]
                workspace = project_directory(str(body.get("project_name", "")), task_id)
                max_rounds = int(body.get("max_rounds", DEFAULT_MAX_ROUNDS))
                if not 1 <= max_rounds <= MAX_ROUNDS:
                    raise ValueError(f"協作循環需介於 1 至 {MAX_ROUNDS}。")
                task = {
                    "id": task_id, "goal": goal, "workspace": str(workspace),
                    "status": "ready", "mode": "project", "build_round": 0, "max_rounds": max_rounds,
                    "stop_requested": False, "created_at": time.time(), "updated_at": time.time(), "messages": [],
                }
                with TASKS_LOCK:
                    TASKS[task["id"]] = task
                    save_tasks()
                self.send_json(task, HTTPStatus.CREATED)
                return
            parts = path.split("/")
            if len(parts) == 5 and parts[1:3] == ["api", "tasks"]:
                task = self.task_or_404(parts[3])
                if not task:
                    self.send_json({"error": "找不到任務。"}, HTTPStatus.NOT_FOUND)
                    return
                action = parts[4]
                if action == "build":
                    start_project(task, str(body.get("instruction", "")).strip() or None)
                    self.send_json({"ok": True})
                    return
                if action == "stop":
                    stop_project(task)
                    self.send_json({"ok": True})
                    return
            self.send_json({"error": "找不到 API。"}, HTTPStatus.NOT_FOUND)
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)


def main() -> None:
    load_tasks()
    port = int(os.environ.get("COLLABORATION_PORT", "8765"))
    os.chdir(APP_DIR)
    server = ThreadingHTTPServer(("127.0.0.1", port), CollaborationHandler)
    print(f"Collaboration Console 已啟動：http://127.0.0.1:{port}")
    print("按 Control-C 可停止伺服器。")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止 Collaboration Console。")


if __name__ == "__main__":
    main()
