#!/usr/bin/with-contenv bashio
# NOTE: Do NOT use 'set -e' here.
# bashio helpers return non-zero on missing/unset config keys which would
# kill the script before Node ever starts.

cd /app

export NODE_ENV=production
export PORT=5000
export CABINET_DATA_DIR="${CABINET_DATA_DIR:-/data}"

# Read the upload limit from add-on options with a safe fallback.
CABINET_MAX_UPLOAD_MB="$(bashio::config 'max_upload_mb' 8192 2>/dev/null || echo 8192)"
if [ -z "$CABINET_MAX_UPLOAD_MB" ] || [ "$CABINET_MAX_UPLOAD_MB" = "null" ]; then
  CABINET_MAX_UPLOAD_MB=8192
fi
export CABINET_MAX_UPLOAD_MB

mkdir -p "$CABINET_DATA_DIR"

bashio::log.info "Starting HomeArcade v$(bashio::addon.version) on port $PORT"
bashio::log.info "Data dir: $CABINET_DATA_DIR | Max upload: ${CABINET_MAX_UPLOAD_MB}mb"

# Quick sanity-check: verify the native SQLite module loaded correctly.
# If this fails, the error prints to the HA add-on log before we exit.
if ! node -e "require('better-sqlite3'); process.exit(0);" 2>&1; then
  bashio::log.error "FATAL: better-sqlite3 failed to load. The native module may not be built for this Node version."
  exit 1
fi

# Start the app. stderr is merged into stdout so all output appears in the HA log.
exec node dist/index.cjs 2>&1
