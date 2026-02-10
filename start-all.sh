#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

# LiveKit + Egress
"$ROOT_DIR/start-livekit.sh" > "$LOG_DIR/livekit.log" 2>&1 || true

# Backend
( cd "$ROOT_DIR/backend-simple" && nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 & )

# Caddy
( cd "$ROOT_DIR" && nohup caddy run --config Caddyfile > "$LOG_DIR/caddy.log" 2>&1 & )

# Frontend
( cd "$ROOT_DIR" && nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 & )

echo "Started all services. Logs in $LOG_DIR"
