#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Detect docker compose or docker-compose command
if command -v docker compose &> /dev/null; then
  DOCKER_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_CMD="docker-compose"
else
  echo "Error: Neither 'docker compose' nor 'docker-compose' could be found."
  exit 1
fi

echo "=== Stopping current Tailscale Funnel ==="
sudo pkill -f "tailscale funnel" || true

echo "=== Pulling latest changes from git ==="
git pull

echo "=== Stopping current docker containers ==="
$DOCKER_CMD down

echo "=== Removing stopped docker containers ==="
$DOCKER_CMD rm -f

echo "=== Pruning old build cache ==="
docker builder prune -f

echo "=== Building and starting docker containers ==="
$DOCKER_CMD up -d --build

echo "=== Waiting for MongoDB to start ==="
sleep 5

echo "=== Initializing MongoDB Replica Set ==="
docker exec tinyschedule-mongo mongo --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})" || true

echo "=== Starting Tailscale Funnel on Port 3000 ==="
nohup sudo tailscale funnel 3000 > tailscale_funnel.log 2>&1 &
echo "Tailscale Funnel is running in background. Logs saved to tailscale_funnel.log https://tinyschedule.taile459d4.ts.net/"

echo "=== Done ==="
