#!/bin/sh
package=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1
"$package/winmac-cli" run "${1:-$package/physics-quiz.exe}"
result=$?
if [ "$result" -ne 0 ] && [ -t 0 ]; then
    printf '\nWinMac stopped with exit code %s. Press Enter to close.\n' "$result"
    read -r answer
fi
exit "$result"
