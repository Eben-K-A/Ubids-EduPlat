#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

mkdir -p recordings

echo "Starting LiveKit + Egress..."
docker compose -f docker-compose.livekit.yml up -d

echo "Done. Containers:" 
docker compose -f docker-compose.livekit.yml ps
