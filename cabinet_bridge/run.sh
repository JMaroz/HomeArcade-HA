#!/usr/bin/with-contenv sh
set -e

cd /app

export NODE_ENV=production
export PORT=5000
export CABINET_DATA_DIR="${CABINET_DATA_DIR:-/data}"

# Pull the user-configurable upload ceiling out of the add-on options.
# We use a simple grep/sed to avoid bashio dependency issues if the environment is unstable.
if [ -f /data/options.json ]; then
  MAX_UPLOAD="$(grep -o '"max_upload_mb":[^,]*' /data/options.json | cut -d: -f2 | tr -d ' ')"
  if [ ! -z "$MAX_UPLOAD" ]; then
    export CABINET_MAX_UPLOAD_MB="$MAX_UPLOAD"
  fi
fi

export CABINET_MAX_UPLOAD_MB="${CABINET_MAX_UPLOAD_MB:-8192}"

mkdir -p "$CABINET_DATA_DIR"

echo "[HomeArcade] starting on port $PORT (data dir: $CABINET_DATA_DIR, max upload: ${CABINET_MAX_UPLOAD_MB}mb)"
exec node dist/index.cjs
