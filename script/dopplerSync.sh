#!/bin/bash
set -euo pipefail

# Download secrets into a temp file and move it over .env only on success —
# a failed download must never truncate an existing .env.
tmp="$(mktemp)"
cleanup() {
  rm -f "$tmp"
  doppler configure unset config >/dev/null 2>&1 || true
}
trap cleanup EXIT

doppler setup -p "euler-verifier" --config "prd"
doppler secrets download --no-file --format env > "$tmp"

if [ ! -s "$tmp" ]; then
  echo "dopplerSync: secrets download produced no output; keeping existing .env" >&2
  exit 1
fi

mv "$tmp" .env
echo "dopplerSync: wrote .env"
