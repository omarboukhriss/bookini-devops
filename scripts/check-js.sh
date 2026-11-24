#!/bin/sh

set -e

echo "Checking JavaScript syntax..."

for file in js/*.js
do
    echo "Checking $file"
    node --check "$file"
done

echo "JavaScript syntax check: PASSED"