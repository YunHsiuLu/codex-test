#!/bin/sh
set -eu
repository=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$repository/scripts/Play-X4.command"
