#!/bin/sh
# Plain sh - the HA base image does not include bashio or with-contenv.
set -e

export NODE_ENV=production
export PORT=5000
if [ -f /data/options.json ]; then
  ADDON_DATA_DIR="$(node -e "try{const o=require('/data/options.json'); process.stdout.write(o.data_dir || '')}catch{}")"
  ADDON_ROM_WATCH_DIR="$(node -e "try{const o=require('/data/options.json'); process.stdout.write(o.rom_watch_dir || '')}catch{}")"
  ADDON_MAX_UPLOAD_MB="$(node -e "try{const o=require('/data/options.json'); process.stdout.write(String(o.max_upload_mb || ''))}catch{}")"
  ADDON_STEAMGRIDDB_KEY="$(node -e "try{const o=require('/data/options.json'); process.stdout.write(o.steamgriddb_api_key || '')}catch{}")"
fi

export CABINET_DATA_DIR="${CABINET_DATA_DIR:-${ADDON_DATA_DIR:-/data}}"
export CABINET_ROM_WATCH_DIR="${CABINET_ROM_WATCH_DIR:-${ADDON_ROM_WATCH_DIR:-}}"
export CABINET_MAX_UPLOAD_MB="${CABINET_MAX_UPLOAD_MB:-${ADDON_MAX_UPLOAD_MB:-8192}}"
export CABINET_STEAMGRIDDB_KEY="${CABINET_STEAMGRIDDB_KEY:-${ADDON_STEAMGRIDDB_KEY:-}}"

mkdir -p "$CABINET_DATA_DIR"
cd /app

echo "[boot] HomeArcade 1.8.1 starting on port $PORT"
echo "[boot] Data: $CABINET_DATA_DIR | Max upload: ${CABINET_MAX_UPLOAD_MB}MB"

exec node dist/index.cjs
