#!/bin/bash
set -e

echo "Starting BeerFinder application..."

# Wait for database to be ready
echo "Waiting for database..."
until pg_isready -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER:-postgres}"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Run database migrations
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
