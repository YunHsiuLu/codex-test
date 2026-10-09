#!/bin/sh
set -eu
repository=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
wine="$repository/work/wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine"
game="$repository/work/x4/game"
export WINEPREFIX="$repository/work/x4/prefix"
export WINEDEBUG=-all,err+all
export MVK_CONFIG_LOG_LEVEL=0
export WINEDLLOVERRIDES='mscoree,mshtml='
export LANG=zh_TW.UTF-8
if [ ! -x "$wine" ] || [ ! -f "$game/rmx4.exe" ] || [ ! -f "$repository/work/x4/.configured" ]; then
    /usr/bin/python3 "$repository/scripts/setup-x4.py"
fi
mkdir -p "$repository/work/x4"
cd "$game"
exec "$wine" explorer /desktop=WinMac-X4,800x600 'C:\Games\RMX4\rmx4.exe' >> "$repository/work/x4/game.log" 2>&1
