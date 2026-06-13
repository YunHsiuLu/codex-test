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
import unicodedata
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


@dataclass
class TimelineEntry:
    timestamp: str
    speaker: str
    message: str


def clean_text(value: str) -> str:
    return " ".join(value.split())


def format_timestamp(timestamp: str, fallback_path: Path | None = None, seconds: bool = False) -> str:
    try:
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        pattern = "%Y-%m-%d %H:%M:%S" if seconds else "%Y-%m-%d %H:%M"
        return parsed.astimezone().strftime(pattern)
    except (ValueError, AttributeError):
        if fallback_path is None:
            return "時間不明"
        return datetime.fromtimestamp(fallback_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")


def load_timeline(path: Path) -> list[TimelineEntry]:
    entries = []
    try:
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if item.get("type") != "event_msg":
                    continue
                payload = item.get("payload", {})
                event_type = payload.get("type")
                if event_type not in ("user_message", "agent_message"):
                    continue

                message = clean_text(payload.get("message", ""))
                if not message:
                    continue
                entries.append(
                    TimelineEntry(
                        timestamp=format_timestamp(item.get("timestamp", ""), seconds=True),
                        speaker="你" if event_type == "user_message" else "Codex",
                        message=message,
                    )
                )
    except (OSError, UnicodeError):
        return []
    return entries


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
        timestamp=format_timestamp(metadata.get("timestamp", ""), path),
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


def truncate_terminal(value: str, width: int) -> str:
    if width <= 0:
        return ""

    result = []
    used = 0
    for character in value:
        character_width = (
            0
            if unicodedata.combining(character)
            else 2
            if unicodedata.east_asian_width(character) in ("F", "W")
            else 1
        )
        if used + character_width > width:
            break
        result.append(character)
        used += character_width
    return "".join(result)


def add_text(
    screen: curses.window,
    row: int,
    column: int,
    value: str,
    width: int,
    attribute: int = curses.A_NORMAL,
) -> None:
    height, screen_width = screen.getmaxyx()
    if row < 0 or row >= height or column < 0 or column >= screen_width:
        return

    available = min(width, screen_width - column - 1)
    if available <= 0:
        return

    try:
        screen.addstr(
            row,
            column,
            truncate_terminal(value, available),
            attribute,
        )
    except curses.error:
        pass


class HistoryUI:
    MIN_WIDTH = 20
    MIN_HEIGHT = 4

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
        self.timeline_cache: dict[Path, list[TimelineEntry]] = {}

    def refresh(self) -> None:
        self.sessions = load_sessions(self.codex_home, self.show_archived)
        self.timeline_cache.clear()
        query = self.query.lower()
        self.filtered = [
            session for session in self.sessions if not query or query in session.searchable
        ]
        self.selected = min(self.selected, max(0, len(self.filtered) - 1))

    def get_timeline(self, session: Session) -> list[TimelineEntry]:
        if session.path not in self.timeline_cache:
            self.timeline_cache[session.path] = load_timeline(session.path)
        return self.timeline_cache[session.path]

    def preview_lines(self, session: Session, width: int, height: int) -> list[str]:
        if height <= 0:
            return []

        entries = self.get_timeline(session)
        if not entries:
            return ["（沒有可預覽的對話內容）"]

        lines = []
        content_width = max(10, width - 4)
        for entry in entries[-3:]:
            prefix = f"{entry.speaker}："
            wrapped = textwrap.wrap(
                entry.message,
                width=max(1, content_width - len(prefix)),
                replace_whitespace=True,
                drop_whitespace=True,
            ) or [""]
            lines.append(f"{prefix}{wrapped[0]}")
            lines.extend(f"  {line}" for line in wrapped[1:])

        if len(lines) > height:
            lines = lines[-height:]
            lines[0] = f"…{lines[0]}" if lines[0] else "…"
        return lines

    def prompt(self, label: str) -> str:
        height, width = self.screen.getmaxyx()
        curses.echo()
        curses.curs_set(1)
        self.screen.move(height - 1, 0)
        self.screen.clrtoeol()
        add_text(self.screen, height - 1, 0, label, max(1, width - 2))
        input_row, input_column = self.screen.getyx()
        try:
            value = self.screen.getstr(
                input_row,
                input_column,
                max(1, width - input_column - 1),
            )
            return value.decode("utf-8", errors="replace")
        finally:
            curses.noecho()
            curses.curs_set(0)

    def confirm(self, label: str) -> bool:
        return self.prompt(f"{label}（輸入 y 確認；其餘按鍵取消）：").strip().lower() == "y"

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

    def show_timeline(self, session: Session) -> None:
        entries = self.get_timeline(session)
        offset = 0

        while True:
            self.screen.erase()
            height, width = self.screen.getmaxyx()
            if height < self.MIN_HEIGHT or width < self.MIN_WIDTH:
                add_text(
                    self.screen,
                    0,
                    0,
                    f"視窗太小（至少 {self.MIN_WIDTH}x{self.MIN_HEIGHT}）",
                    max(1, width - 1),
                )
                self.screen.refresh()
                key = self.screen.getch()
                if key in (ord("q"), 27, ord("t"), curses.KEY_BACKSPACE, 127):
                    return
                continue

            full_layout = height >= 8 and width >= 50
            content_top = 3 if full_layout else 1
            footer_row = height - 1

            add_text(
                self.screen,
                0,
                0,
                "對話時間軸",
                width - 1,
                curses.A_BOLD,
            )
            if full_layout:
                add_text(
                    self.screen,
                    1,
                    0,
                    shorten(session.title, width - 1),
                    width - 1,
                )
                self.screen.hline(2, 0, curses.ACS_HLINE, width - 1)

            lines = []
            content_width = max(1, width - 4)
            for entry in entries:
                heading = (
                    f"{entry.timestamp}  {entry.speaker}"
                    if width >= 30
                    else f"{entry.speaker} {entry.timestamp[11:]}"
                )
                lines.append((heading, curses.A_BOLD))
                wrapped = textwrap.wrap(
                    entry.message,
                    width=content_width,
                    replace_whitespace=True,
                    drop_whitespace=True,
                ) or [""]
                lines.extend((f"  {line}", curses.A_NORMAL) for line in wrapped)
                lines.append(("", curses.A_NORMAL))

            visible_height = max(1, footer_row - content_top)
            max_offset = max(0, len(lines) - visible_height)
            offset = min(offset, max_offset)
            if not lines:
                add_text(
                    self.screen,
                    content_top,
                    0,
                    "沒有可顯示的對話訊息。",
                    width - 1,
                )
            else:
                for row, (line, attribute) in enumerate(
                    lines[offset : offset + visible_height], start=content_top
                ):
                    add_text(self.screen, row, 0, line, width - 1, attribute)

            status = (
                f"訊息 {len(entries)} 則｜↑↓ 捲動｜PgUp/PgDn 翻頁｜t / q / Esc 返回"
                if width >= 50
                else f"{len(entries)} 則｜↑↓｜q / Esc 返回"
            )
            add_text(self.screen, footer_row, 0, status, width - 1)
            self.screen.refresh()

            key = self.screen.getch()
            if key in (ord("q"), 27, ord("t"), curses.KEY_BACKSPACE, 127):
                return
            if key in (curses.KEY_UP, ord("k")):
                offset = max(0, offset - 1)
            elif key in (curses.KEY_DOWN, ord("j")):
                offset = min(max_offset, offset + 1)
            elif key == curses.KEY_PPAGE:
                offset = max(0, offset - visible_height)
            elif key == curses.KEY_NPAGE:
                offset = min(max_offset, offset + visible_height)
            elif key == curses.KEY_HOME:
                offset = 0
            elif key == curses.KEY_END:
                offset = max_offset

    def draw(self) -> None:
        self.screen.erase()
        height, width = self.screen.getmaxyx()
        if height < self.MIN_HEIGHT or width < self.MIN_WIDTH:
            add_text(
                self.screen,
                0,
                0,
                f"視窗太小（至少 {self.MIN_WIDTH}x{self.MIN_HEIGHT}）",
                max(1, width - 1),
            )
            self.screen.refresh()
            return

        section = "封存紀錄" if self.show_archived else "歷史對話"
        add_text(
            self.screen,
            0,
            0,
            f"Codex {section}",
            width - 1,
            curses.A_BOLD,
        )

        show_status = height >= 6
        show_details = height >= 12 and width >= 50
        list_top = 3 if show_status else 1
        footer_row = height - 1
        if show_status:
            status = f"共 {len(self.filtered)} 筆"
            if self.query:
                status += f"｜搜尋：{self.query}"
            add_text(self.screen, 1, 0, status, width - 1)
            self.screen.hline(2, 0, curses.ACS_HLINE, width - 1)

        if show_details:
            detail_height = min(7, max(4, height // 3))
            detail_row = footer_row - detail_height
            list_bottom = detail_row
        else:
            detail_row = None
            list_bottom = footer_row
        list_height = max(1, list_bottom - list_top)
        if self.selected < self.offset:
            self.offset = self.selected
        if self.selected >= self.offset + list_height:
            self.offset = self.selected - list_height + 1

        if not self.filtered:
            add_text(
                self.screen,
                list_top + 1,
                2,
                "找不到符合的對話紀錄。",
                width - 4,
            )
        else:
            for row, session in enumerate(
                self.filtered[self.offset : self.offset + list_height], start=list_top
            ):
                index = self.offset + row - list_top
                marker = "›" if index == self.selected else " "
                cwd_name = Path(session.cwd).name if session.cwd else "未知目錄"
                if width >= 50:
                    prefix = f"{marker} {session.timestamp}  [{cwd_name}] "
                elif width >= 34:
                    prefix = f"{marker} {session.timestamp[5:]} "
                else:
                    prefix = f"{marker} "
                line = prefix + shorten(session.title, width - len(prefix) - 1)
                attribute = curses.A_REVERSE if index == self.selected else curses.A_NORMAL
                add_text(
                    self.screen,
                    row,
                    0,
                    line.ljust(width - 1),
                    width - 1,
                    attribute,
                )

        if detail_row is not None:
            self.screen.hline(detail_row, 0, curses.ACS_HLINE, width - 1)
        if detail_row is not None and self.filtered:
            session = self.filtered[self.selected]
            details = f"目錄：{session.cwd}｜ID：{session.session_id}"
            add_text(self.screen, detail_row + 1, 0, details, width - 1)
            add_text(
                self.screen,
                detail_row + 2,
                0,
                "預覽（最近對話）：",
                width - 1,
                curses.A_BOLD,
            )
            preview_height = max(0, height - detail_row - 4)
            for row, line in enumerate(
                self.preview_lines(session, width, preview_height),
                start=detail_row + 3,
            ):
                add_text(self.screen, row, 2, line, width - 3)

        if self.show_archived:
            help_text = "↑↓ 選擇｜t 時間軸｜u 還原｜a 返回歷史對話｜/ 搜尋｜q / Esc 離開"
        else:
            help_text = "Enter 恢復｜t 時間軸｜n 新對話｜d 封存｜a 封存紀錄｜/ 搜尋｜q / Esc 離開"
        footer = self.message or help_text
        add_text(self.screen, footer_row, 0, footer, width - 1)
        self.screen.refresh()

    def run(self) -> tuple[str, Session | None] | None:
        curses.set_escdelay(10)
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
            elif key == ord("t") and self.filtered:
                self.show_timeline(self.filtered[self.selected])
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
