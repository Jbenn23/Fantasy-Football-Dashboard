#!/bin/bash
# One-time: push this dashboard to a PRIVATE GitHub repo you created (empty, no README).
# Usage: bash ~/Claude/ff-dashboard/scripts/connect_github.sh https://github.com/<you>/ff-dashboard.git
set -euo pipefail
URL="${1:?Pass the GitHub repo URL}"
cd "$(dirname "$0")/.."
command -v git >/dev/null || { echo "git missing: run 'xcode-select --install' first"; exit 1; }
[[ -d .git ]] || git init -b main
git add -A
git commit -m "Initial dashboard" || true
git remote remove origin 2>/dev/null || true
git remote add origin "$URL"
git push -u origin main
echo
echo "Pushed. Next: vercel.com > Add New > Project > import this repo > add env var DASHBOARD_PASSWORD > Deploy."
echo "Then set FF_PUBLISH_DIR=$(pwd)/data in ~/Claude/ff-pipeline/.env so each pipeline run pushes fresh data."
