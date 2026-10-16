#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"
npm run build
printf '%s\n' '{"type":"commonjs"}' > dist/package.json

mkdir -p releases
archive=$(mktemp "$repo_root/releases/.commerce.XXXXXX")
trap 'rm -f "$archive"' 0
tar -czf "$archive" dist docs/deployment.md deploy/README.md
mv "$archive" releases/commerce.tar.gz
printf '%s\n' "$repo_root/releases/commerce.tar.gz"
