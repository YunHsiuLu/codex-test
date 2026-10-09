#!/usr/bin/env python3
"""Create a local macOS launcher; game/runtime data stays in the project."""
from pathlib import Path
import plistlib
import shlex
import sys

root = Path(__file__).resolve().parent.parent
if len(sys.argv) != 2:
    raise SystemExit('Usage: package-x4.py <output-directory>')
out = Path(sys.argv[1]).expanduser().resolve()
out.mkdir(parents=True, exist_ok=True)
launcher = root / 'scripts/Play-X4.command'
app = out / 'WinMac X4.app'
macos = app / 'Contents/MacOS'
macos.mkdir(parents=True, exist_ok=True)
info = {
    'CFBundleIdentifier': 'local.winmac.rockman-x4',
    'CFBundleName': 'WinMac X4',
    'CFBundleDisplayName': '洛克人 X4',
    'CFBundleExecutable': 'WinMac-X4',
    'CFBundlePackageType': 'APPL',
    'CFBundleVersion': '1',
    'CFBundleShortVersionString': '0.1.0',
    'NSHighResolutionCapable': True,
}
(app / 'Contents/Info.plist').write_bytes(plistlib.dumps(info))
script = '#!/bin/sh\nexec ' + shlex.quote(str(launcher)) + '\n'
for path in [macos / 'WinMac-X4', out / 'Play-X4.command']:
    path.write_text(script)
    path.chmod(0o755)
print(app)
