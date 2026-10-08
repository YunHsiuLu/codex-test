#!/bin/sh
# Build a relocatable local package without touching the tracked target folder.
set -eu
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <output-directory>" >&2
    exit 2
fi
if [ "$(uname -s)" != Darwin ]; then
    echo "The native GUI package currently requires macOS." >&2
    exit 2
fi
mkdir -p "$1"
destination=$(CDPATH= cd -- "$1" && pwd)
repository=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repository"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-${TMPDIR:-/tmp}/winmac-target}"
cargo build --release -p winmac-cli
cargo run -p winmac-runtime --example make_demo -- "$destination/hello.exe"
cargo run -p winmac-runtime --example make_gui_demo -- "$destination/physics-quiz.exe"
cp "$CARGO_TARGET_DIR/release/winmac-cli" "$destination/winmac-cli"
cp scripts/Play-Quiz.command "$destination/Play-Quiz.command"
cp docs/task-011.md "$destination/README.md"
chmod +x "$destination/winmac-cli" "$destination/Play-Quiz.command"
echo "Package ready: $destination"
