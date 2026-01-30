#!/bin/bash
set -e

echo "Starting BeerFinder application..."

# Run database migrations (SQLite/SpatiaLite - no wait needed)
echo "Running database migrations..."
cd /app/backend
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start nginx in background
echo "Starting nginx..."
nginx

# Start Django development server (in production, use gunicorn)
echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8000 &

# Keep container running
wait
