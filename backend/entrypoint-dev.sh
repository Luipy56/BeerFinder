#!/bin/bash
set -e

echo "Starting BeerFinder backend (development mode)..."

# Wait for database to be ready
echo "Waiting for database..."
until pg_isready -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER:-postgres}" -p 5432; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist (non-interactive)
echo "Checking for superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
EOF

# Start Django development server
echo "Starting Django development server..."
exec python manage.py runserver 0.0.0.0:8000
