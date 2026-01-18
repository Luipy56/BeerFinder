# BeerFinder Database

This directory contains database-related scripts and documentation for the BeerFinder application.

## Database System

We use **PostgreSQL** with the **PostGIS** extension for storing geographic data.

### What is PostgreSQL?

PostgreSQL (often called "Postgres") is a powerful, open-source relational database management system. Think of it as a highly organized filing cabinet that can store and retrieve data very efficiently. It's like Excel, but much more powerful and designed for applications.

### What is PostGIS?

PostGIS is an extension for PostgreSQL that adds support for geographic objects. It allows the database to understand and work with location data (like coordinates on a map). This is essential for our application because we need to store and query points of interest (POIs) with their exact locations.

## Database Structure

The database structure is defined in Django models (see `backend/api/models.py`). The main tables are:

### POI (Points of Interest)
Stores information about locations on the map:
- **id**: Unique identifier
- **name**: Name of the location
- **description**: Additional information
- **location**: Geographic coordinates (PostGIS Point field)
- **price**: Optional price information
- **created_by**: User who created this POI
- **created_at/updated_at**: Timestamps
- **items**: Many-to-many relationship with Item table

### Item
Stores items that can be associated with POIs:
- **id**: Unique identifier
- **name**: Name of the item
- **description**: Description
- **price**: Price of the item
- **created_at/updated_at**: Timestamps

### ItemRequest
Stores requests from users to add new items:
- **id**: Unique identifier
- **name**: Name of the requested item
- **description**: Description
- **price**: Price
- **requested_by**: User who made the request
- **status**: pending, approved, or rejected
- **created_at/updated_at**: Timestamps

## How Database Communication Works

### Overview

The communication between the application and the database follows this flow:

1. **User Action** → User interacts with the frontend (e.g., clicks on map)
2. **Frontend Request** → Frontend sends HTTP request to backend API
3. **Backend Processing** → Django receives the request
4. **Database Query** → Django converts the request into a SQL query
5. **Database Response** → PostgreSQL executes the query and returns data
6. **Backend Response** → Django formats the data as JSON
7. **Frontend Display** → Frontend receives and displays the data

### Detailed Flow Example: Creating a POI

1. **User clicks on map** → Frontend captures latitude/longitude
2. **Frontend sends POST request** → `POST /api/v1/pois/` with POI data
3. **Django receives request** → `POIViewSet.create()` method is called
4. **Django validates data** → Checks if data is valid
5. **Django creates database record** → Executes SQL: `INSERT INTO api_poi ...`
6. **PostgreSQL stores data** → Saves POI with PostGIS Point location
7. **Django returns response** → Sends JSON with created POI data
8. **Frontend updates map** → Displays new POI marker

### Database Connection

The connection settings are configured in `backend/beerfinder/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'beerfinder',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'db',  # Docker service name
        'PORT': '5432',
    }
}
```

### Using Docker

When using Docker Compose, the database is automatically set up:
- Container name: `beerfinder_db`
- Image: `postgis/postgis:15-3.3`
- PostGIS extension is automatically enabled
- Database is initialized on first startup

## Initialization

### Using Docker (Recommended)

The database is automatically initialized when you run:
```bash
docker-compose up
```

### Manual Initialization

1. **Start PostgreSQL with PostGIS**:
```bash
# Using Docker
docker run -d \
  --name beerfinder_db \
  -e POSTGRES_DB=beerfinder \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgis/postgis:15-3.3
```

2. **Run initialization script**:
```bash
# Using SQL script
psql -U postgres -f database/scripts/init_db.sql

# Or using shell script
bash database/scripts/init_db.sh
```

3. **Run Django migrations**:
```bash
cd backend
python manage.py migrate
```

## Database Migrations

Django uses migrations to manage database schema changes. When you modify models:

1. **Create migration**:
```bash
python manage.py makemigrations
```

2. **Apply migration**:
```bash
python manage.py migrate
```

Migrations are stored in `backend/api/migrations/` and are version-controlled.

## Accessing the Database

### Using psql (Command Line)

```bash
# Connect to database
psql -h localhost -U postgres -d beerfinder

# Or using Docker
docker exec -it beerfinder_db psql -U postgres -d beerfinder
```

### Using Django Admin

Access the admin panel at: http://localhost:8000/admin

### Using Django Shell

```bash
cd backend
python manage.py shell
```

Then you can query the database:
```python
from api.models import POI, Item
pois = POI.objects.all()
print(pois)
```

## Common Queries

### Get all POIs
```sql
SELECT * FROM api_poi;
```

### Get POIs within a radius (using PostGIS)
```sql
SELECT * FROM api_poi
WHERE ST_DWithin(
  location,
  ST_MakePoint(-0.09, 51.505)::geography,
  1000  -- 1000 meters
);
```

### Get POIs with their items
```sql
SELECT p.name, i.name as item_name
FROM api_poi p
JOIN api_poi_items pi ON p.id = pi.poi_id
JOIN api_item i ON pi.item_id = i.id;
```

## Backup and Restore

### Backup
```bash
pg_dump -U postgres beerfinder > backup.sql
```

### Restore
```bash
psql -U postgres beerfinder < backup.sql
```

## Troubleshooting

### Connection Refused
- Check if PostgreSQL is running
- Verify connection settings in `.env` file
- Check firewall settings

### PostGIS Extension Error
Make sure PostGIS is installed:
```sql
CREATE EXTENSION postgis;
```

### Migration Errors
Reset migrations (careful - this deletes data):
```bash
python manage.py migrate api zero
python manage.py migrate
```

## Security Notes

- Never commit database passwords to version control
- Use environment variables for sensitive data
- Regularly backup your database
- Use strong passwords in production
