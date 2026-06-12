#!/usr/bin/env python3

import curses
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path


IGNORED_NAMES = {
    ".DS_Store",
    ".git",
    ".venv",
    "__pycache__",
    "node_modules",
    "venv",
}
BUTTON5_PRESSED = getattr(curses, "BUTTON5_PRESSED", 0x2000000)
DIRECTORY_COLOR = 1


@dataclass(frozen=True)
class Entry:
    name: str
    path: Path
    is_directory: bool


def tmux(*args: str) -> str:
    result = subprocess.run(
        ["tmux", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def pane_option(pane_id: str, option: str) -> str:
    result = subprocess.run(
        ["tmux", "show-options", "-pv", "-t", pane_id, option],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def set_root(window_id: str, root: Path) -> None:
    tmux("set-option", "-w", "-t", window_id, "@tmux_tree_root", str(root))


def tracked_root(window_id: str, current: Path, force: bool = False) -> Path:
    active_pane = tmux("display-message", "-p", "-t", window_id, "#{pane_id}")
    if pane_option(active_pane, "@tmux_tree") == "1":
        if not force:
            return current
        panes = tmux(
            "list-panes",
            "-t",
            window_id,
            "-F",
            "#{pane_id}:#{pane_last}:#{@tmux_tree}",
        ).splitlines()
        candidates = [line.split(":") for line in panes]
        active_pane = next(
            (
                pane_id
                for pane_id, pane_last, is_tree in candidates
                if pane_last == "1" and is_tree != "1"
            ),
            next(
                (
                    pane_id
                    for pane_id, _, is_tree in candidates
                    if is_tree != "1"
                ),
                active_pane,
            ),
        )

    root = Path(
        tmux(
            "display-message",
            "-p",
            "-t",
            active_pane,
            "#{pane_current_path}",
        )
    )
    set_root(window_id, root)
    return root


def directory_entries(root: Path) -> list[Entry]:
    parent = root.parent if root.parent != root else root
    entries = [Entry("..", parent, True)]

    try:
        children = [item for item in root.iterdir() if item.name not in IGNORED_NAMES]
    except OSError:
        return entries

    children.sort(key=lambda item: (not item.is_dir(), item.name.lower()))
    entries.extend(
        Entry(
            f"{item.name}/" if item.is_dir() else item.name,
            item,
            item.is_dir(),
        )
        for item in children
    )
    return entries


def clamp_view(
    selected: int,
    offset: int,
    item_count: int,
    visible_rows: int,
) -> tuple[int, int]:
    selected = max(0, min(selected, max(0, item_count - 1)))
    max_offset = max(0, item_count - visible_rows)
    offset = max(0, min(offset, max_offset))
    if selected < offset:
        offset = selected
    elif selected >= offset + visible_rows:
        offset = selected - visible_rows + 1
    return selected, offset


def draw(
    screen: curses.window,
    root: Path,
    entries: list[Entry],
    selected: int,
    offset: int,
) -> tuple[int, int]:
    screen.erase()
    height, width = screen.getmaxyx()
    visible_rows = max(1, height - 3)
    selected, offset = clamp_view(selected, offset, len(entries), visible_rows)

    root_label = str(root).replace(os.path.expanduser("~"), "~", 1)
    header = f" FILE TREE  {selected + 1}/{len(entries)}"
    for row, text in enumerate((header, f" {root_label}", "-" * max(1, width - 1))):
        try:
            screen.addnstr(row, 0, text, max(1, width - 1), curses.A_BOLD)
        except curses.error:
            pass

    visible_entries = entries[offset : offset + visible_rows]
    for row, entry in enumerate(visible_entries, start=3):
        entry_index = offset + row - 3
        style = curses.color_pair(DIRECTORY_COLOR) if entry.is_directory else 0
        if entry.is_directory:
            style |= curses.A_BOLD
        if entry_index == selected:
            style |= curses.A_REVERSE
        try:
            screen.addnstr(row, 0, f" {entry.name}", max(1, width - 1), style)
        except curses.error:
            pass

    screen.refresh()
    return selected, offset


def enter_directory(
    window_id: str,
    entry: Entry,
) -> Path | None:
    if not entry.is_directory:
        return None
    try:
        root = entry.path.resolve()
    except OSError:
        return None
    set_root(window_id, root)
    return root


def run(screen: curses.window, window_id: str) -> None:
    curses.curs_set(0)
    curses.use_default_colors()
    curses.init_pair(DIRECTORY_COLOR, curses.COLOR_BLUE, -1)
    screen.keypad(True)
    screen.timeout(200)
    curses.mousemask(curses.ALL_MOUSE_EVENTS | curses.REPORT_MOUSE_POSITION)

    root = Path(tmux("show-options", "-wv", "-t", window_id, "@tmux_tree_root"))
    entries = directory_entries(root)
    selected = 0
    offset = 0
    last_refresh = 0.0
    manual_browsing = False

    while True:
        now = time.monotonic()
        if now - last_refresh >= 1:
            try:
                new_root = root if manual_browsing else tracked_root(window_id, root)
            except subprocess.CalledProcessError:
                return
            new_entries = directory_entries(new_root)
            if new_root != root:
                selected = 0
                offset = 0
            else:
                selected_name = entries[selected].name if entries else None
                if selected_name:
                    selected = next(
                        (
                            index
                            for index, entry in enumerate(new_entries)
                            if entry.name == selected_name
                        ),
                        selected,
                    )
            root, entries = new_root, new_entries
            last_refresh = now

        selected, offset = draw(screen, root, entries, selected, offset)
        height, _ = screen.getmaxyx()
        visible_rows = max(1, height - 3)
        key = screen.getch()

        if key in (ord("q"), ord("Q")):
            return
        if key in (curses.KEY_UP, ord("k")):
            selected -= 1
        elif key in (curses.KEY_DOWN, ord("j")):
            selected += 1
        elif key == curses.KEY_PPAGE:
            selected -= visible_rows
        elif key == curses.KEY_NPAGE:
            selected += visible_rows
        elif key in (curses.KEY_HOME, ord("g")):
            selected = 0
        elif key in (curses.KEY_END, ord("G")):
            selected = len(entries) - 1
        elif key in (curses.KEY_ENTER, 10, 13, curses.KEY_RIGHT, ord("l")):
            new_root = enter_directory(window_id, entries[selected])
            if new_root is not None:
                root = new_root
                manual_browsing = True
                entries = directory_entries(root)
                selected = 0
                offset = 0
        elif key in (curses.KEY_LEFT, curses.KEY_BACKSPACE, 127, ord("h")):
            new_root = enter_directory(window_id, entries[0])
            if new_root is not None:
                root = new_root
                manual_browsing = True
                entries = directory_entries(root)
                selected = 0
                offset = 0
        elif key in (ord("r"), ord("R")):
            try:
                root = tracked_root(window_id, root, force=True)
            except subprocess.CalledProcessError:
                return
            manual_browsing = False
            entries = directory_entries(root)
            selected = 0
            offset = 0
        elif key == curses.KEY_MOUSE:
            try:
                _, mouse_x, mouse_y, _, state = curses.getmouse()
            except curses.error:
                continue

            if state & curses.BUTTON4_PRESSED:
                selected -= 3
                offset -= 3
            elif state & BUTTON5_PRESSED:
                selected += 3
                offset += 3
            elif mouse_x >= 0 and mouse_y >= 3:
                clicked = offset + mouse_y - 3
                if 0 <= clicked < len(entries):
                    selected = clicked
                    if state & curses.BUTTON1_DOUBLE_CLICKED:
                        new_root = enter_directory(window_id, entries[selected])
                        if new_root is not None:
                            root = new_root
                            manual_browsing = True
                            entries = directory_entries(root)
                            selected = 0
                            offset = 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: tmux-tree-viewer.py WINDOW_ID")
    curses.wrapper(run, sys.argv[1])
