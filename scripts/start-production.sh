#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-0.0.0.0}"
PORT_VALUE="${PORT:-3000}"

if [[ -n "${RAILWAY_VOLUME_MOUNT_PATH:-}" ]]; then
  mkdir -p "${RAILWAY_VOLUME_MOUNT_PATH}/meal-photos"
fi

npx prisma db push
exec npx next start --hostname "$HOST" --port "$PORT_VALUE"
