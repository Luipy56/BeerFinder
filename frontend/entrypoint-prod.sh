#!/bin/sh
set -e

echo "Copying frontend build to shared volume..."

# Copy build files to the shared volume
cp -r /app/frontend/build/* /app/frontend/build_volume/ || true

# Keep container running (the build is already done, we just need to maintain the volume)
echo "Frontend build copied. Container will keep running to maintain volume."
tail -f /dev/null
