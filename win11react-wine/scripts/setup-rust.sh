#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p work
curl --proto '=https' --tlsv1.2 -fsSL https://sh.rustup.rs -o work/rustup-init.sh
CARGO_HOME="$PWD/work/cargo" RUSTUP_HOME="$PWD/work/rustup" \
  sh work/rustup-init.sh -y --profile minimal --no-modify-path --default-toolchain 1.98.1
