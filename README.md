# BeerFinder

A web application for creating, viewing, and editing points of interest (POIs) on an interactive map.

## What is a POI?

POI stands for **Point of Interest**. It's a specific location on a map that has some significance - like a restaurant, bar, park, or any place you want to mark and share with others.

## Description

BeerFinder allows users to:
- View a real-time map of any part of the world
- Create points of interest (POIs) by clicking directly on the map
- View their own POIs as well as those created by other users
- Edit any existing POI, regardless of who created it
- Access detailed information about each POI (name, description, price, etc.)
- Manage items with permission-based access
- Submit requests to add new items if they don't have permission

## Technologies Explained

### Frontend: React with TypeScript
- **React**: A JavaScript library for building user interfaces (the parts of a website users see and interact with)
- **TypeScript**: A programming language that adds types to JavaScript, making code more reliable

### Backend: Django with Django REST Framework
- **Django**: A Python web framework that handles server-side logic and database operations
- **Django REST Framework**: A toolkit for building APIs (Application Programming Interfaces) that allow the frontend to communicate with the backend

### Database: PostgreSQL with PostGIS
- **PostgreSQL**: A powerful database system for storing data
- **PostGIS**: An extension that adds geographic capabilities, allowing us to store and query location data efficiently

### Containerization: Docker
- **Docker**: A platform that packages applications and their dependencies into containers, making deployment easier and more consistent

## Getting Started

### Prerequisites

Before you begin, make sure you have:
- **Docker** and **Docker Compose** installed (tools for running the application in containers)
- **Git** installed (for version control)

### Installation

1. **Clone the repository** (download the project):
```bash
git clone <repository-url>
cd BeerFinder
```

2. **Create a `.env` file** (configuration file with settings):
```bash
# The .env file is already created with default values
# Edit it if you need to change database passwords or other settings
```

3. **Start the services** (start all parts of the application):
```bash
docker compose -f docker-compose.dev.yml up -d
```
The `-d` flag runs services in the background (detached mode).

**Note:** The dev compose includes only backend and frontend. The database is external: set `MARIADB_*` in `.env`. The backend runs migrations and creates a superuser (admin/admin123) on startup when the DB is reachable.

### Accessing the Application

**From localhost:**
- **Frontend** (main application): http://localhost:3000
- **Backend API** (for developers): http://localhost:8000/api/v1/
- **Admin Panel** (manage data): http://localhost:8000/admin
  - Username: `admin`
  - Password: `admin123`

**From network (other devices on your LAN):**
- Find your server's IP address:
  ```bash
  hostname -I | awk '{print $1}'
  ```
- Access from any device on your network:
  - **Frontend**: http://[your-server-ip]:3000
  - **Backend API**: http://[your-server-ip]:8000/api/v1/
  - **Admin Panel**: http://[your-server-ip]:8000/admin

The application automatically detects the hostname and adjusts API URLs accordingly.

## Project Structure

```
BeerFinder/
├── backend/          # Django backend application (server-side)
│   ├── api/          # API endpoints and business logic
│   └── beerfinder/   # Django project settings
├── frontend/         # React frontend application (client-side)
│   ├── src/          # Source code
│   └── public/       # Static files
├── database/         # Database scripts and documentation
│   └── scripts/      # Database initialization scripts
├── deployment/       # Deployment configurations
│   ├── nginx.conf    # Web server configuration
│   └── docker-compose.prod.yml  # Production setup
├── tests/            # Test files
│   ├── backend/      # Backend tests
│   ├── frontend/     # Frontend tests
│   └── integration/  # Integration tests
├── docker-compose.dev.yml   # Desarrollo (backend + frontend)
├── docker-compose.prod.yml  # Producción (servidor real)
├── Dockerfile        # Instructions for building Docker images
└── README.md        # This file
```

## Development

### Running in Development Mode

Start all services and see logs in real-time:
```bash
docker compose -f docker-compose.dev.yml up
```

Stop services:
```bash
docker compose -f docker-compose.dev.yml down
```

### Running Tests

**Backend tests:**
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py test
```

**Frontend tests:**
```bash
docker compose -f docker-compose.dev.yml exec frontend npm test
```

**All tests:**
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py test
docker compose -f docker-compose.dev.yml exec frontend npm test
```

### Making Changes

1. **Edit code** in your preferred editor
2. **Changes are automatically reflected** (hot reloading)
3. **For database changes**, create and run migrations:
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

## API Documentation

### Endpoints

#### POIs (Points of Interest)
- `GET /api/v1/pois/` - Get all POIs
- `GET /api/v1/pois/{id}/` - Get a specific POI
- `POST /api/v1/pois/` - Create a new POI
- `PATCH /api/v1/pois/{id}/` - Update a POI
- `DELETE /api/v1/pois/{id}/` - Delete a POI

#### Items
- `GET /api/v1/items/` - Get all items
- `POST /api/v1/items/` - Create a new item (requires permission)

#### Item Requests
- `GET /api/v1/item-requests/` - Get all item requests
- `POST /api/v1/item-requests/` - Submit a request to add a new item

### Example API Request

Create a new POI:
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

## Common Tasks

### View Logs
```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f backend
```

### Database (external)
The dev compose does not include a database container. The backend uses MariaDB/MySQL from `.env` (`MARIADB_HOST`, `MARIADB_USER`, etc.). Backups and access depend on your DB setup.

## Troubleshooting

### Services Won't Start
- Check if ports 3000 and 8000 are available
- Check Docker is running: `docker ps`
- View logs: `docker compose -f docker-compose.dev.yml logs`

### Database Connection Errors
- The dev compose has no DB container; the backend uses MariaDB/MySQL from `.env`
- Verify `MARIADB_HOST`, `MARIADB_USER`, `MARIADB_PASSWORD`, `MARIADB_DB` in `.env`
- Ensure the database server is reachable from the host/container

### Frontend Not Loading
- Check frontend container: `docker compose -f docker-compose.dev.yml ps frontend`
- Rebuild frontend: `docker compose -f docker-compose.dev.yml up -d --build frontend`
- Check browser console (F12) for errors

### Backend API Errors
- Check backend logs: `docker compose -f docker-compose.dev.yml logs backend`
- Migrations run automatically on startup (see entrypoint-dev.sh)
- Ensure the external database is reachable and credentials in `.env` are correct

### Cannot Access from Network
- Ensure backend is listening on 0.0.0.0 (configured in entrypoint-dev.sh)
- Check ALLOWED_HOSTS in settings.py (allows all hosts in development)
- Verify CORS settings (allows all origins in development)
- Check firewall: `sudo ufw status`
- Frontend automatically detects hostname and adjusts API URL

### POI Creation Not Working
- Check browser console (F12) for errors
- Verify API URL in console log: should show correct hostname
- Check backend logs for errors: `docker-compose logs backend`
- Ensure CORS is configured correctly (allows all origins in development)

## Features Implemented

### Core Functionality
- ✅ Interactive map using Leaflet (OpenStreetMap)
- ✅ Click on map to create POIs
- ✅ View all POIs on the map
- ✅ POI details (name, description, price)
- ✅ Automatic initialization (migrations and superuser)
- ✅ Network access support (works from any device on LAN)

### Technical Features
- ✅ Automatic API URL detection (works from localhost or network IP)
- ✅ CORS configured for development (allows all origins)
- ✅ ALLOWED_HOSTS configured for network access
- ✅ GeoJSON support for geographic data
- ✅ PostGIS for spatial queries
- ✅ Hot reloading in development
- ✅ Health check endpoints

## Known Issues and Solutions

### Fixed Issues
1. **GDAL compilation error**: Resolved by using system package `python3-gdal` instead of pip package
2. **npm ci without package-lock.json**: Fixed by using `npm install` when lock file doesn't exist
3. **TypeScript version conflict**: Resolved by using TypeScript 4.9.5 (compatible with react-scripts 5.0.1)
4. **ajv module not found**: Fixed by adding `ajv` explicitly to package.json
5. **Leaflet icon import error**: Fixed by using `require()` instead of `import` for images
6. **OSMGeoAdmin removed in Django 5.0**: Replaced with `GISModelAdmin`
7. **Port 5432 conflict**: Changed to port 5433 for host mapping
8. **Network access issues**: Fixed by configuring ALLOWED_HOSTS and CORS for development
9. **API URL hardcoded to localhost**: Implemented automatic hostname detection

## Additional Documentation

For more detailed information, see:
- [Frontend Documentation](frontend/README.md) - React and TypeScript guide
- [Backend Documentation](backend/README.md) - Django and API guide
- [Database Documentation](database/README.md) - Database setup and usage
- [Deployment Documentation](deployment/README.md) - Deployment guide
- [Testing Documentation](tests/README.md) - Testing guide

## Contributing

1. Create a new branch for your changes
2. Make your changes
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

[Add your license here]
