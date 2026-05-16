#!/bin/sh
# Plain sh - the HA base image does not include bashio or with-contenv.
set -e

export NODE_ENV=production
export PORT=5000
export CABINET_DATA_DIR="${CABINET_DATA_DIR:-/data}"
export CABINET_MAX_UPLOAD_MB="${CABINET_MAX_UPLOAD_MB:-8192}"

mkdir -p "$CABINET_DATA_DIR"
cd /app

echo "[boot] HomeArcade 1.7.9 starting on port $PORT"
echo "[boot] Data: $CABINET_DATA_DIR | Max upload: ${CABINET_MAX_UPLOAD_MB}MB"

# Verify native module loads correctly before starting the full app
if ! node -e "require('better-sqlite3'); console.log('[boot] better-sqlite3 OK');"; then
  echo "[boot] FATAL: better-sqlite3 failed to load"
  exit 1
fi

echo "[boot] Launching Node..."
exec node \
  --unhandled-rejections=throw \
  --enable-source-maps \
  dist/index.cjs
