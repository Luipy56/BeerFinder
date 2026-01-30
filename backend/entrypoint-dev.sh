#!/bin/bash
set -e

echo "Starting BeerFinder backend (development mode)..."

# Run database migrations (SQLite/SpatiaLite - no wait needed)
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
