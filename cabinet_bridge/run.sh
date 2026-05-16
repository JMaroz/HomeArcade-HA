#!/usr/bin/with-contenv bashio
# Don't use set -e — bashio helpers return non-zero on missing/unset keys
# which would silently kill the script before Node starts.

cd /app

export NODE_ENV=production
export PORT=5000
export CABINET_DATA_DIR="${CABINET_DATA_DIR:-/data}"

# Pull the user-configurable upload ceiling out of the add-on options.
# Use bashio::config directly with a fallback; suppress errors so a missing
# or out-of-range value never prevents Node from starting.
CABINET_MAX_UPLOAD_MB="$(bashio::config 'max_upload_mb' 8192 2>/dev/null || true)"
if [ -z "$CABINET_MAX_UPLOAD_MB" ] || [ "$CABINET_MAX_UPLOAD_MB" = "null" ]; then
  CABINET_MAX_UPLOAD_MB=8192
fi
export CABINET_MAX_UPLOAD_MB

mkdir -p "$CABINET_DATA_DIR"

bashio::log.info "Starting HomeArcade on port $PORT"
bashio::log.info "Data dir: $CABINET_DATA_DIR | Max upload: ${CABINET_MAX_UPLOAD_MB}mb"

# Run Node and capture any crash output so it shows in the HA add-on log.
exec node dist/index.cjs 2>&1
