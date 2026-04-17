#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-0.0.0.0}"
PORT_VALUE="${PORT:-3000}"

if [[ "${DATABASE_URL:-}" == file:* ]] && [[ -n "${RAILWAY_VOLUME_MOUNT_PATH:-}" ]]; then
  expected_prefix="file:${RAILWAY_VOLUME_MOUNT_PATH}/"

  if [[ "${DATABASE_URL}" != ${expected_prefix}* ]]; then
    echo "Error: DATABASE_URL must point inside ${RAILWAY_VOLUME_MOUNT_PATH} on Railway when using SQLite."
    echo "Current DATABASE_URL=${DATABASE_URL}"
    exit 1
  fi
fi

if [[ -n "${RAILWAY_VOLUME_MOUNT_PATH:-}" ]]; then
  mkdir -p "${RAILWAY_VOLUME_MOUNT_PATH}/meal-photos"
fi

npx prisma db push
exec npx next start --hostname "$HOST" --port "$PORT_VALUE"
