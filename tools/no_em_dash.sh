#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

dash=$(printf '\342\200\224')

if hits=$(git grep -n "$dash" -- . ':!package-lock.json'); then
  echo "Em dashes found. Use a hyphen, a comma, or rephrase:" >&2
  echo "$hits" >&2
  exit 1
fi
echo "no em dash"
