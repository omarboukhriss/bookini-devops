#!/bin/sh

set -e

CONTAINER_NAME="bookini-smoke"
IMAGE_NAME="$1"

echo "Starting container..."

docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

docker run -d \
  --name "$CONTAINER_NAME" \
  -p 8080:80 \
  "$IMAGE_NAME"

echo "Waiting for application..."

sleep 3

echo "Testing Bookini..."

STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)

echo "HTTP status: $STATUS"

if [ "$STATUS" = "200" ]; then
    echo "DOCKER SMOKE TEST: PASSED"
else
    echo "DOCKER SMOKE TEST: FAILED"
    docker logs "$CONTAINER_NAME"
    exit 1
fi