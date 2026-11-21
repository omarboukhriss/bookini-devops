#!/bin/sh

set -e

URL="${1:-http://localhost:8080}"

echo "Running smoke test against: $URL"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

echo "HTTP status: $STATUS"

if [ "$STATUS" = "200" ]; then
    echo "SMOKE TEST: PASSED"
    exit 0
else
    echo "SMOKE TEST: FAILED"
    exit 1
fi