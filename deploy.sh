#!/bin/sh
set -e

# Evitar timeout en build del frontend en prod (por defecto 60s)
export COMPOSE_HTTP_TIMEOUT=200

#git pull

docker-compose -f docker-compose.prod.yml up -d --build backend

./scripts/deploy_frontend.sh

systemctl reload apache2

echo "Deploy completo"
