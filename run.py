#!/usr/bin/env python3
"""A small terminal UI for browsing and managing Codex CLI sessions."""

from __future__ import annotations

import argparse
import curses
import json
import os
import shutil
import subprocess
import sys
import textwrap
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class Session:
    session_id: str
    title: str
    cwd: str
    timestamp: str
    source: str
    path: Path
    archived: bool

    @property
    def searchable(self) -> str:
        return f"{self.title} {self.cwd} {self.session_id}".lower()


def clean_text(value: str) -> str:
    return " ".join(value.split())


def display_time(timestamp: str, path: Path) -> str:
    try:
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        return parsed.astimezone().strftime("%Y-%m-%d %H:%M")
    except (ValueError, AttributeError):
        return datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")


def parse_session(path: Path, archived: bool = False) -> Session | None:
    metadata: dict = {}
    title = ""

    try:
        with path.open("r", encoding="utf-8") as handle:
            for line_number, line in enumerate(handle):
                if line_number > 300 and metadata and title:
                    break
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue

                payload = item.get("payload", {})
                if item.get("type") == "session_meta":
                    metadata = payload

                if (
                    not title
                    and item.get("type") == "event_msg"
                    and payload.get("type") == "user_message"
                ):
                    title = clean_text(payload.get("message", ""))

                if (
                    not title
                    and item.get("type") == "response_item"
                    and payload.get("type") == "message"
                    and payload.get("role") == "user"
                ):
                    parts = [
                        part.get("text", "")
                        for part in payload.get("content", [])
                        if part.get("type") == "input_text"
                    ]
                    candidate = clean_text(" ".join(parts))
                    if candidate and not candidate.startswith("# AGENTS.md instructions"):
                        title = candidate
    except (OSError, UnicodeError):
        return None

    session_id = metadata.get("id")
    if not session_id:
        return None

    if not title:
        title = "（無標題對話）"

    return Session(
        session_id=session_id,
        title=title,
        cwd=metadata.get("cwd", ""),
        timestamp=display_time(metadata.get("timestamp", ""), path),
        source=str(metadata.get("source", "")),
        path=path,
        archived=archived,
    )


def load_sessions(codex_home: Path, archived: bool = False) -> list[Session]:
    folder = codex_home / ("archived_sessions" if archived else "sessions")
    if not folder.exists():
        return []

    sessions = []
    for path in folder.rglob("*.jsonl"):
        session = parse_session(path, archived)
        if session:
            sessions.append(session)
    return sorted(sessions, key=lambda session: session.timestamp, reverse=True)


def shorten(value: str, width: int) -> str:
    if width <= 0:
        return ""
    return textwrap.shorten(value, width=width, placeholder="…")


class HistoryUI:
    def __init__(self, screen: curses.window, codex_home: Path):
        self.screen = screen
        self.codex_home = codex_home
        self.sessions: list[Session] = []
        self.filtered: list[Session] = []
        self.selected = 0
        self.offset = 0
        self.query = ""
        self.show_archived = False
        self.message = ""
        self.action: tuple[str, Session | None] | None = None

    def refresh(self) -> None:
        self.sessions = load_sessions(self.codex_home, self.show_archived)
        query = self.query.lower()
        self.filtered = [
            session for session in self.sessions if not query or query in session.searchable
        ]
        self.selected = min(self.selected, max(0, len(self.filtered) - 1))

    def prompt(self, label: str) -> str:
        height, width = self.screen.getmaxyx()
        curses.echo()
        curses.curs_set(1)
        self.screen.move(height - 1, 0)
        self.screen.clrtoeol()
        self.screen.addnstr(height - 1, 0, label, width - 1)
        try:
            value = self.screen.getstr(height - 1, len(label), max(1, width - len(label) - 1))
            return value.decode("utf-8", errors="replace")
        finally:
            curses.noecho()
            curses.curs_set(0)

    def confirm(self, label: str) -> bool:
        return self.prompt(f"{label}（輸入 y 確認）：").strip().lower() == "y"

    def manage_session(self, command: str, session: Session) -> None:
        verb = "還原" if command == "unarchive" else "封存"
        if not self.confirm(f"確定要{verb}「{shorten(session.title, 36)}」嗎？"):
            self.message = "已取消。"
            return
        result = subprocess.run(
            ["codex", command, session.session_id],
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode == 0:
            self.message = f"已{verb}對話。"
            self.refresh()
        else:
            error = clean_text(result.stderr or result.stdout)
            self.message = f"{verb}失敗：{shorten(error, 70)}"

    def draw(self) -> None:
        self.screen.erase()
        height, width = self.screen.getmaxyx()
        if height < 10 or width < 50:
            self.screen.addstr(0, 0, "終端視窗太小，請放大至至少 50x10。")
            self.screen.refresh()
            return

        section = "封存紀錄" if self.show_archived else "歷史對話"
        self.screen.attron(curses.A_BOLD)
        self.screen.addnstr(0, 0, f"Codex {section}", width - 1)
        self.screen.attroff(curses.A_BOLD)
        status = f"共 {len(self.filtered)} 筆"
        if self.query:
            status += f"｜搜尋：{self.query}"
        self.screen.addnstr(1, 0, status, width - 1)
        self.screen.hline(2, 0, curses.ACS_HLINE, width - 1)

        list_top = 3
        list_height = max(1, height - 8)
        if self.selected < self.offset:
            self.offset = self.selected
        if self.selected >= self.offset + list_height:
            self.offset = self.selected - list_height + 1

        if not self.filtered:
            self.screen.addnstr(list_top + 1, 2, "找不到符合的對話紀錄。", width - 4)
        else:
            for row, session in enumerate(
                self.filtered[self.offset : self.offset + list_height], start=list_top
            ):
                index = self.offset + row - list_top
                marker = "›" if index == self.selected else " "
                cwd_name = Path(session.cwd).name if session.cwd else "未知目錄"
                prefix = f"{marker} {session.timestamp}  [{cwd_name}] "
                line = prefix + shorten(session.title, width - len(prefix) - 1)
                attribute = curses.A_REVERSE if index == self.selected else curses.A_NORMAL
                self.screen.addnstr(row, 0, line.ljust(width - 1), width - 1, attribute)

        detail_row = height - 5
        self.screen.hline(detail_row, 0, curses.ACS_HLINE, width - 1)
        if self.filtered:
            session = self.filtered[self.selected]
            self.screen.addnstr(detail_row + 1, 0, f"目錄：{session.cwd}", width - 1)
            self.screen.addnstr(detail_row + 2, 0, f"ID：{session.session_id}", width - 1)

        if self.show_archived:
            help_text = "↑↓ 選擇｜u 還原｜a 返回歷史｜/ 搜尋｜q 離開"
        else:
            help_text = "Enter 恢復｜n 新對話｜d 封存｜a 封存紀錄｜/ 搜尋｜q 離開"
        footer = self.message or help_text
        self.screen.addnstr(height - 1, 0, footer, width - 1)
        self.screen.refresh()

    def run(self) -> tuple[str, Session | None] | None:
        curses.curs_set(0)
        self.screen.keypad(True)
        self.refresh()

        while True:
            self.draw()
            self.message = ""
            key = self.screen.getch()

            if key in (ord("q"), 27):
                return None
            if key in (curses.KEY_UP, ord("k")) and self.filtered:
                self.selected = max(0, self.selected - 1)
            elif key in (curses.KEY_DOWN, ord("j")) and self.filtered:
                self.selected = min(len(self.filtered) - 1, self.selected + 1)
            elif key in (curses.KEY_ENTER, 10, 13) and self.filtered:
                if self.show_archived:
                    self.message = "請先按 u 還原封存的對話。"
                else:
                    return ("resume", self.filtered[self.selected])
            elif key == ord("n") and not self.show_archived:
                return ("new", None)
            elif key == ord("d") and self.filtered and not self.show_archived:
                self.manage_session("archive", self.filtered[self.selected])
            elif key == ord("u") and self.filtered and self.show_archived:
                self.manage_session("unarchive", self.filtered[self.selected])
            elif key == ord("a"):
                self.show_archived = not self.show_archived
                self.selected = 0
                self.offset = 0
                self.query = ""
                self.refresh()
            elif key == ord("/"):
                self.query = self.prompt("搜尋：").strip()
                self.selected = 0
                self.offset = 0
                self.refresh()
            elif key in (ord("c"), curses.KEY_BACKSPACE, 127) and self.query:
                self.query = ""
                self.selected = 0
                self.refresh()


def launch(action: tuple[str, Session | None] | None) -> int:
    if action is None:
        return 0

    command, session = action
    if command == "new":
        os.execvp("codex", ["codex"])

    if session is None:
        return 1

    cwd = Path(session.cwd).expanduser()
    if cwd.is_dir():
        os.chdir(cwd)
    os.execvp("codex", ["codex", "resume", session.session_id])
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Browse and manage Codex CLI sessions.")
    parser.add_argument(
        "--codex-home",
        type=Path,
        default=Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")),
        help="Codex data directory (default: $CODEX_HOME or ~/.codex)",
    )
    args = parser.parse_args()

    if not shutil.which("codex"):
        print("找不到 codex 指令，請先確認 Codex CLI 已安裝並位於 PATH 中。", file=sys.stderr)
        return 1
    if not args.codex_home.exists():
        print(f"找不到 Codex 資料目錄：{args.codex_home}", file=sys.stderr)
        return 1
    if not sys.stdin.isatty() or not sys.stdout.isatty():
        print("此程式需要在互動式終端機中執行。", file=sys.stderr)
        return 1

    action = curses.wrapper(lambda screen: HistoryUI(screen, args.codex_home).run())
    return launch(action)


if __name__ == "__main__":
    raise SystemExit(main())
