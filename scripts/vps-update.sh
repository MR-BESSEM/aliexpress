#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Updating project in ${APP_DIR}"
cd "${APP_DIR}"

echo "==> Fetching latest code"
git fetch origin
git pull --ff-only origin main

echo "==> Installing Node dependencies"
npm ci

echo "==> Installing Playwright browsers"
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium chromium-headless-shell

echo "==> Reloading PM2"
if pm2 describe alexpress >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
fi

echo "==> Saving PM2 process list"
pm2 save

echo "==> Health check"
curl -fsS "http://127.0.0.1:${PORT:-3000}/api/health"
echo
echo "Done."
