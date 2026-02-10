#!/usr/bin/env bash
set -euo pipefail

pkill -f "npm run dev" || true
pkill -f "caddy run --config Caddyfile" || true

docker compose -f docker-compose.livekit.yml down || true

echo "Stopped all services."
