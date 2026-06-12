#!/bin/sh

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BIN_DIR="${HOME}/.local/bin"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/tmux-guide"
TMUX_CONF="${HOME}/.tmux.conf"
START_MARKER="# >>> tmux-guide >>>"
END_MARKER="# <<< tmux-guide <<<"

mkdir -p "$BIN_DIR" "$DATA_DIR"
cp "$PROJECT_DIR/bin/tmux-help" "$BIN_DIR/tmux-help"
cp "$PROJECT_DIR/bin/tmux-tree" "$BIN_DIR/tmux-tree"
cp "$PROJECT_DIR/bin/tmux-tree-viewer.py" "$BIN_DIR/tmux-tree-viewer.py"
cp "$PROJECT_DIR/docs/cheatsheet.txt" "$DATA_DIR/cheatsheet.txt"
chmod +x \
    "$BIN_DIR/tmux-help" \
    "$BIN_DIR/tmux-tree" \
    "$BIN_DIR/tmux-tree-viewer.py"

if grep -Fq "$START_MARKER" "$TMUX_CONF" 2>/dev/null; then
    TEMP_CONF="${TMUX_CONF}.tmux-guide.$$"
    awk -v start="$START_MARKER" -v end="$END_MARKER" '
        $0 == start { skip = 1; next }
        $0 == end { skip = 0; next }
        !skip { print }
    ' "$TMUX_CONF" > "$TEMP_CONF"
    mv "$TEMP_CONF" "$TMUX_CONF"
fi

{
    printf '\n%s\n' "$START_MARKER"
    cat "$PROJECT_DIR/tmux-guide.conf"
    printf '%s\n' "$END_MARKER"
} >> "$TMUX_CONF"

if [ -n "${TMUX:-}" ]; then
    tmux source-file "$TMUX_CONF"
    "$BIN_DIR/tmux-tree" --rebuild-all
fi

printf '%s\n' "安裝完成："
printf '  %s\n' "指令：tmux-help"
printf '  %s\n' "右側完整說明：Prefix H"
printf '  %s\n' "右上角 popup：Prefix P"
printf '  %s\n' "滑鼠：已在 ~/.tmux.conf 啟用"
printf '  %s\n' "Codex 通知：已啟用焦點事件與 bell 轉送"
printf '  %s\n' "檔案樹：每個 tmux 視窗最左側自動建立"

case ":${PATH}:" in
    *":${BIN_DIR}:"*) ;;
    *)
        printf '\n%s\n' "提醒：${BIN_DIR} 尚未包含在 PATH 中。"
        printf '%s\n' "請在 ~/.zshrc 加入：export PATH=\"\$HOME/.local/bin:\$PATH\""
        ;;
esac
