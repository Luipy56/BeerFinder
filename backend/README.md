# BeerFinder Backend

This is the backend API for BeerFinder, built with Django and Django REST Framework.

## What is Django?

Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. Think of it as a toolkit that provides everything you need to build a web application - from handling database operations to creating APIs (Application Programming Interfaces).

## What is Django REST Framework (DRF)?

Django REST Framework is a powerful toolkit for building Web APIs (Application Programming Interfaces) in Django. An API is like a menu in a restaurant - it tells other applications (like our frontend) what data they can request and how to request it.

## What is PostgreSQL with PostGIS?

- **PostgreSQL**: A powerful, open-source relational database system. Think of it as a highly organized filing cabinet for your data.
- **PostGIS**: An extension that adds support for geographic objects to PostgreSQL. This allows us to store and query location data (like coordinates on a map) efficiently.

## Project Structure

```
backend/
├── beerfinder/          # Main Django project settings
│   ├── settings.py      # Configuration for the entire project
│   ├── urls.py          # Main URL routing (like a table of contents)
│   └── wsgi.py          # Web Server Gateway Interface (for deployment)
├── api/                 # Main application
│   ├── models.py        # Database models (defines data structure)
│   ├── views.py         # API endpoints (handles requests)
│   ├── serializers.py   # Converts data to/from JSON format
│   ├── urls.py          # API URL routing
│   └── admin.py         # Admin panel configuration
├── manage.py            # Django's command-line utility
└── requirements.txt     # Python package dependencies
```

## Key Concepts

### Models
Models define the structure of your data. They're like blueprints for database tables. For example:
- **POI (Point of Interest)**: Stores information about locations on the map
- **Item**: Stores items that can be associated with POIs
- **ItemRequest**: Stores requests from users to add new items

### Views
Views handle incoming requests and return responses. They're like waiters in a restaurant - they take your order (request) and bring you your food (response).

### Serializers
Serializers convert complex data types (like Django models) into JSON format that can be easily transmitted over the internet, and vice versa. Think of them as translators between your database and the frontend.

### URLs
URLs map web addresses to views. They're like street addresses - they tell Django which view to use when someone visits a particular URL.

## API Endpoints

Our API provides the following endpoints:

### POIs (Points of Interest)
- `GET /api/v1/pois/` - Get all POIs
- `GET /api/v1/pois/{id}/` - Get a specific POI
- `POST /api/v1/pois/` - Create a new POI
- `PATCH /api/v1/pois/{id}/` - Update a POI
- `DELETE /api/v1/pois/{id}/` - Delete a POI
- `POST /api/v1/pois/{id}/add_item/` - Add an item to a POI
- `POST /api/v1/pois/{id}/remove_item/` - Remove an item from a POI

### Items
- `GET /api/v1/items/` - Get all items
- `GET /api/v1/items/{id}/` - Get a specific item
- `POST /api/v1/items/` - Create a new item (requires permission)
- `PATCH /api/v1/items/{id}/` - Update an item (requires permission)
- `DELETE /api/v1/items/{id}/` - Delete an item (requires permission)

### Item Requests
- `GET /api/v1/item-requests/` - Get all item requests
- `POST /api/v1/item-requests/` - Submit a request to add a new item

## Setting Up the Backend

### Prerequisites
- Python 3.11 or higher
- PostgreSQL with PostGIS extension
- pip (Python package installer)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables in `.env` file (in project root):
```env
POSTGRES_DB=beerfinder
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```

5. Run database migrations:
```bash
python manage.py migrate
```

6. Create a superuser (admin account):
```bash
python manage.py createsuperuser
```

7. Run the development server:
```bash
python manage.py runserver
```

The API will be available at http://localhost:8000

## Using Docker

If you're using Docker (recommended), the backend will start automatically when you run:
```bash
docker-compose up
```

The `entrypoint-dev.sh` script automatically handles:
1. **Database readiness check**: Waits for PostgreSQL to be ready
2. **Migrations**: Runs `python manage.py migrate` automatically
3. **Superuser creation**: Creates admin user (admin/admin123) if it doesn't exist
4. **Server startup**: Starts Django development server on 0.0.0.0:8000

This means you don't need to run migrations or create a superuser manually!

## Database Models Explained

### POI (Point of Interest)
- **name**: The name of the location
- **description**: Additional information about the location
- **location**: Geographic coordinates (latitude/longitude) stored as a PostGIS Point
- **price**: Optional price information
- **created_by**: The user who created this POI
- **items**: Many-to-many relationship with Item model
- **created_at/updated_at**: Timestamps

### Item
- **name**: Name of the item
- **description**: Description of the item
- **price**: Price of the item
- **created_at/updated_at**: Timestamps

### ItemRequest
- **name**: Name of the requested item
- **description**: Description of the requested item
- **price**: Price of the requested item
- **requested_by**: User who made the request
- **status**: pending, approved, or rejected
- **created_at/updated_at**: Timestamps

## Making API Requests

### Example: Get all POIs
```bash
curl http://localhost:8000/api/v1/pois/
```

### Example: Create a new POI
```bash
curl -X POST http://localhost:8000/api/v1/pois/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cool Bar",
    "description": "A great place to hang out",
    "latitude": 51.505,
    "longitude": -0.09,
    "price": 10.50
  }'
```

## Admin Panel

Django provides a built-in admin panel for managing data. Access it at:
http://localhost:8000/admin

You'll need to create a superuser first (see installation steps above).

## Common Tasks

### Creating Database Migrations
When you change models, create migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Running Tests
```bash
python manage.py test
```

### Accessing Django Shell
```bash
python manage.py shell
```

## Troubleshooting

### Database Connection Error
Make sure PostgreSQL is running and the connection details in `.env` are correct.
- When using Docker, the database host is `db` (service name)
- Port inside Docker is 5432, but host port is 5433 (to avoid conflicts)

### PostGIS Extension Error
Make sure PostGIS is installed in your PostgreSQL database:
```sql
CREATE EXTENSION postgis;
```
- When using Docker, PostGIS is automatically enabled in the postgis/postgis image

### Port Already in Use
Change the port:
```bash
python manage.py runserver 8001
```

### DisallowedHost Error
If you see "DisallowedHost" errors when accessing from network:
- In development, `ALLOWED_HOSTS` is set to `['*']` to allow all hosts
- Check `settings.py` to ensure `DEBUG=True` and `ALLOWED_HOSTS = ['*']`

### CORS Errors
If you see CORS errors when accessing from network:
- In development, `CORS_ALLOW_ALL_ORIGINS = True` is enabled
- Check `settings.py` to ensure CORS is configured for development

### OSMGeoAdmin Error (Django 5.0)
If you see "cannot import name 'OSMGeoAdmin'":
- This was fixed by using `GISModelAdmin` instead
- See `api/admin.py` for the correct implementation
