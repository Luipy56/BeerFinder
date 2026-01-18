# Changelog

All notable changes to the BeerFinder project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure
- Frontend React application with TypeScript
- Backend Django REST API
- PostgreSQL database with PostGIS extension
- Docker containerization
- Interactive map using Leaflet
- POI (Point of Interest) creation, viewing, and editing
- Item management system
- Item request system for users without permissions
- Comprehensive documentation
- Testing structure for backend and frontend
- Deployment configuration
- Automatic initialization script (migrations and superuser)
- CreatePOIModal component for POI creation
- Automatic API URL detection for network access
- Network access support (LAN access from any device)

### Changed
- Database port changed from 5432 to 5433 to avoid conflicts
- TypeScript version downgraded to 4.9.5 for react-scripts compatibility
- Backend command path corrected (python manage.py instead of python backend/manage.py)
- Frontend API URL detection now uses window.location.hostname

### Deprecated
- N/A

### Removed
- gdal package from requirements.txt (using system package python3-gdal instead)
- --legacy-peer-deps flag from npm install (resolved dependency conflicts)

### Fixed
- GDAL compilation error by using system package
- npm ci error when package-lock.json doesn't exist
- TypeScript version conflict with react-scripts
- ajv module not found error
- Leaflet icon import errors
- OSMGeoAdmin removed in Django 5.0 (replaced with GISModelAdmin)
- Database port conflict (changed to 5433)
- Backend command path error
- ALLOWED_HOSTS restriction preventing network access
- CORS blocking requests from network IPs
- API URL hardcoded to localhost (now auto-detects)
- POI creation functionality (modal and API integration)
- Serializer accepting latitude/longitude directly

### Security
- ALLOWED_HOSTS set to '*' in development (should be restricted in production)
- CORS_ALLOW_ALL_ORIGINS enabled in development (should be restricted in production)

## [0.1.0] - 2026-Jan-18

### Added
- Initial release
- Basic POI functionality
- Map integration
- User authentication framework
- Admin panel
