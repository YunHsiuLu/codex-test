#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p work/wine-runtime
archive=work/wine-stable.tar.xz
if [ ! -f "$archive" ]; then
  curl --proto '=https' --tlsv1.2 -fL --retry 2 \
    https://github.com/Gcenx/macOS_Wine_builds/releases/download/11.0_1/wine-stable-11.0_1-osx64.tar.xz \
    -o "$archive.download"
  mv "$archive.download" "$archive"
fi
printf '%s\n' "b50dc50ec7f41d58b115a6b685d4d1315ba3c797bd3aa0f49213f2703cb82388  $archive" | shasum -a 256 -c -
tar -xf "$archive" -C work/wine-runtime
"$PWD/work/wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine" --version
