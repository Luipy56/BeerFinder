#!/bin/sh
set -e

echo "Starting BeerFinder frontend (development mode)..."

# Use exec to replace shell process with npm start
# tini (installed in Dockerfile) will handle signal forwarding properly
exec npm start
