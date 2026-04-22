#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="${PM2_APP_NAME:-alexpress}"
APP_PORT="${PORT:-3000}"

echo "==> Opening project: ${APP_DIR}"
cd "${APP_DIR}"

if [ ! -f "package.json" ]; then
  echo "ERROR: package.json not found in ${APP_DIR}"
  exit 1
fi

if [ ! -f "server.js" ]; then
  echo "ERROR: server.js not found in ${APP_DIR}"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "ERROR: .env not found in ${APP_DIR}"
  exit 1
fi

echo "==> Installing dependencies"
npm install --production

echo "==> Validating server.js"
node --check server.js

echo "==> Starting or reloading PM2"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${APP_NAME}" --update-env
else
  pm2 start ecosystem.config.cjs --env production
fi

echo "==> Saving PM2 process list"
pm2 save

echo "==> Waiting for app boot"
sleep 3

echo "==> Health check"
curl -fsS "http://127.0.0.1:${APP_PORT}/api/health"
echo
echo "==> Product route example"
echo "curl \"http://127.0.0.1:${APP_PORT}/api/product?url=https://www.aliexpress.com/item/1005000000000000.html\""
echo
echo "Done."
