#!/usr/bin/env python3
"""Prepare a dedicated Wine environment for the user's Rockman X4 archive."""
import hashlib
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'work'
WINE_ARCHIVE = WORK / 'wine-stable-11.0_1.tar.xz'
WINE_SHA256 = 'b50dc50ec7f41d58b115a6b685d4d1315ba3c797bd3aa0f49213f2703cb82388'
WINE_URL = 'https://github.com/Gcenx/macOS_Wine_builds/releases/download/11.0_1/wine-stable-11.0_1-osx64.tar.xz'
WINE = WORK / 'wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine'
GAME = WORK / 'x4/game'
PREFIX = WORK / 'x4/prefix'


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def prepare_files():
    WORK.mkdir(parents=True, exist_ok=True)
    if not WINE.exists():
        if not WINE_ARCHIVE.exists():
            partial = WINE_ARCHIVE.with_suffix('.download')
            print('Downloading Wine 11.0_1...', flush=True)
            with urllib.request.urlopen(WINE_URL, timeout=60) as source, partial.open('wb') as target:
                shutil.copyfileobj(source, target)
            partial.replace(WINE_ARCHIVE)
        if sha256(WINE_ARCHIVE) != WINE_SHA256:
            raise RuntimeError('Wine archive SHA-256 mismatch; archive was not executed.')
        (WORK / 'wine-runtime').mkdir(parents=True, exist_ok=True)
        subprocess.run(['/usr/bin/tar', '-xf', str(WINE_ARCHIVE), '-C', str(WORK / 'wine-runtime')], check=True)
    if not (GAME / 'rmx4.exe').exists():
        archive = ROOT / '洛克人 X4.rar'
        listing = subprocess.check_output(['/usr/bin/bsdtar', '-tf', str(archive)], text=True).splitlines()
        prefix = '洛克人 X4/RMX4/'
        for entry in listing:
            path = PurePosixPath(entry)
            if path.is_absolute() or '..' in path.parts:
                raise RuntimeError('Unsafe archive path')
        if prefix + 'rmx4.exe' not in listing:
            raise RuntimeError('The archive does not contain RMX4/rmx4.exe')
        GAME.mkdir(parents=True, exist_ok=True)
        subprocess.run(['/usr/bin/bsdtar', '-xf', str(archive), '-C', str(GAME), '--strip-components', '2',
                        '--exclude', '*修改程式.exe', '洛克人 X4/RMX4'], check=True)
    for name in ['rmx4.exe', 'Arc', 'Bgm', 'Se', 'Str']:
        if not (GAME / name).exists():
            raise RuntimeError('Missing X4 asset: ' + name)


def wine_env():
    env = os.environ.copy()
    env.update(WINEPREFIX=str(PREFIX), WINEDEBUG='-all', WINEDLLOVERRIDES='mscoree,mshtml=', LANG='zh_TW.UTF-8')
    return env


def configure():
    env = wine_env()
    PREFIX.mkdir(parents=True, exist_ok=True)
    log = WORK / 'x4/setup.log'
    with log.open('ab') as output:
        subprocess.run([str(WINE), 'wineboot', '-u'], env=env, stdout=output, stderr=output, check=True, timeout=180)
        games = PREFIX / 'drive_c/Games'
        games.mkdir(exist_ok=True)
        destination = games / 'RMX4'
        if not destination.exists():
            destination.symlink_to(GAME, target_is_directory=True)
        elif destination.resolve() != GAME.resolve():
            raise RuntimeError('Existing C:\\Games\\RMX4 points somewhere else')
        # Scope all registry changes to this prefix. Import only the inspected CAPCOM keys.
        settings = WORK / 'x4/settings.reg'
        settings.write_text('''REGEDIT4

[HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\CAPCOM\\ROCKMAN X4]
"Install Directory"="C:\\\\Games\\\\RMX4"
"CD Drive"="C:\\\\Games\\\\RMX4\\\\"
"Install Program"="True"
"Install Resource"="True"
"DataPath"="C:\\\\Games\\\\RMX4\\\\Arc\\\\"
"Install BGM"="True"
"BgmPath"="C:\\\\Games\\\\RMX4\\\\Bgm\\\\"
"Install Movie"="True"
"MoviePath"="C:\\\\Games\\\\RMX4\\\\Str\\\\"
"Install SE"="True"
"SePath"="C:\\\\Games\\\\RMX4\\\\Se\\\\"

[HKEY_LOCAL_MACHINE\\Software\\Wow6432Node\\CAPCOM\\ROCKMAN X4\\1.0]

[HKEY_CURRENT_USER\\Software\\Wine\\AppDefaults\\rmx4.exe]
"Version"="winxp"

[HKEY_CURRENT_USER\\Software\\Wine\\Direct3D]
"renderer"="gl"
''', encoding='ascii')
        subprocess.run([str(WINE), 'regedit', '/S', str(settings)], env=env, cwd=GAME,
                       stdout=output, stderr=output, check=True, timeout=60)
    (WORK / 'x4/.configured').write_text('wine-11.0_1\n', encoding='ascii')
    print('X4 prepared. Launch with scripts/Play-X4.command')


if __name__ == '__main__':
    try:
        if sys.platform != 'darwin':
            raise RuntimeError('This launcher targets macOS')
        prepare_files()
        configure()
    except (OSError, subprocess.SubprocessError, RuntimeError) as error:
        print(f'Setup failed: {error}', file=sys.stderr)
        sys.exit(1)
