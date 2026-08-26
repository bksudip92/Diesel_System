#!/usr/bin/env bash
# Manual deploy script — Stage 3 of the DevOps learning path.
#
# Run this ON the EC2 instance from ~/Diesel_System/backend:
#   ./deploy/deploy.sh
#
# Before this works, one-time server setup is required (see docs/EC2_SETUP.md).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Pulling latest code"
git fetch origin
git reset --hard origin/main

echo "==> Building new images"
docker compose -f docker-compose.prod.yml --env-file deploy/.env build

echo "==> Starting services (migrations run inside the api container)"
docker compose -f docker-compose.prod.yml --env-file deploy/.env up -d

echo "==> Waiting for health check"
for i in $(seq 1 30); do
  if curl -fsS http://localhost/health > /dev/null 2>&1; then
    echo "==> Deploy successful — healthy after ${i} attempt(s)"
    docker image prune -f > /dev/null
    exit 0
  fi
  sleep 2
done

echo "!!! Health check failed after 60s — recent logs:"
docker compose -f docker-compose.prod.yml logs --tail 50 api
echo "!!! Roll back manually with:"
echo "!!!   git reset --hard <previous-commit> && docker compose -f docker-compose.prod.yml --env-file deploy/.env up -d --build"
exit 1
