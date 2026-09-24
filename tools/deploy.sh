#!/usr/bin/env bash
# Deploy the site to arzaroth.com.
#
# Caddy serves /srv/www/arzaroth.com/htdocs as is, and --delete keeps it an exact
# copy of dist/. Shared downloads live in /srv/www/arzaroth.com/files, served under
# /files/, so nothing else belongs in the web root.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=${PORTFOLIO_DEPLOY_HOST:-zemmourz0zz}
ROOT=${PORTFOLIO_DEPLOY_ROOT:-/srv/www/arzaroth.com/htdocs}
URL=${PORTFOLIO_URL:-https://arzaroth.com}

npm run build
[ -f dist/index.html ] || { echo "No dist/index.html after the build." >&2; exit 1; }

echo "== dist/ -> $HOST:$ROOT"
rsync -a --delete dist/ "$HOST:$ROOT/"

echo "== live check"
code=$(curl -sS -o /dev/null -w '%{http_code}' "$URL/")
echo "   $URL/ HTTP $code"
[ "$code" = 200 ] || exit 1
