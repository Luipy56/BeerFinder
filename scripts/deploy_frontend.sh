#!/bin/sh
set -e

# Evitar timeout en build (por defecto 60s)
export COMPOSE_HTTP_TIMEOUT=200

echo "Building frontend…"
docker-compose -f docker-compose.prod.yml build frontend

echo "Extracting build…"
docker-compose -f docker-compose.prod.yml run --rm frontend \
  sh -c "cp -r /app/frontend/build/* /frontend_build"

echo "Copying to Apache…"
rm -rf /var/www/html/beerfinder/frontend/*
docker run --rm \
  -v beerfinder_frontend_build:/src \
  -v /var/www/html/beerfinder/frontend:/dst \
  alpine sh -c "cp -r /src/* /dst/"

echo "Frontend deployed"
