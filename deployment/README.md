# BeerFinder Deployment

This directory contains deployment configurations and documentation for the BeerFinder application.

## What is Deployment?

Deployment is the process of making your application available to users on the internet. Think of it like opening a restaurant - you've built everything (the kitchen, menu, staff), and now you need to open the doors so customers can come in.

## Deployment Options

### 1. Docker Compose (Development)

This is the easiest way to run the application locally for development and testing.

**Start the application:**
```bash
docker-compose up
```

**Stop the application:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

### 2. Docker Compose (Production)

For production deployment, use the production configuration:

```bash
docker-compose -f deployment/docker-compose.prod.yml up -d
```

### 3. Manual Deployment

You can also deploy each component manually (not recommended for beginners).

## How Deployment Works

### Overview

When you deploy the application, several things happen:

1. **Containers are built** - Docker creates images of your application
2. **Services start** - Database, backend, and frontend start in order
3. **Database initializes** - PostGIS extension is enabled, migrations run
4. **Application becomes available** - Users can access it via web browser

### Component Communication

```
User's Browser
    ↓
Nginx (Web Server) - Port 80
    ↓
    ├─→ Frontend (React App) - Port 3000
    └─→ Backend (Django API) - Port 8000
            ↓
        Database (PostgreSQL + PostGIS) - Port 5432
```

### What is Nginx?

Nginx (pronounced "engine-x") is a web server that:
- Serves your frontend files (HTML, CSS, JavaScript)
- Routes API requests to the backend
- Handles multiple requests efficiently
- Can serve as a reverse proxy (forwards requests to other services)

Think of it as a receptionist who:
- Directs visitors to the right department
- Handles multiple visitors at once
- Makes sure everything runs smoothly

## File Structure

```
deployment/
├── nginx.conf              # Nginx web server configuration
├── entrypoint.sh           # Script that runs when container starts
├── docker-compose.prod.yml # Production Docker Compose configuration
└── README.md              # This file
```

## Configuration Files Explained

### nginx.conf

This file tells Nginx how to handle requests:
- **Frontend requests** (`/`) → Serves React app files
- **API requests** (`/api/`) → Forwards to Django backend
- **Admin requests** (`/admin/`) → Forwards to Django admin panel
- **Static files** (`/static/`) → Serves CSS, JavaScript, images
- **Media files** (`/media/`) → Serves user-uploaded files

### entrypoint.sh

This script runs when the Docker container starts:
1. Waits for database to be ready
2. Runs database migrations
3. Collects static files
4. Starts Nginx
5. Starts Django server

### docker-compose.prod.yml

Production configuration with:
- Better security settings
- Production-ready web server (Gunicorn instead of Django dev server)
- Volume management for data persistence
- Automatic restarts if services crash

## Deployment Steps

### Development Deployment

1. **Make sure Docker is running:**
```bash
docker --version
docker-compose --version
```

2. **Navigate to project directory:**
```bash
cd /path/to/BeerFinder
```

3. **Create .env file** (if not exists):
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Start services:**
```bash
docker-compose up -d
```

5. **Check if services are running:**
```bash
docker-compose ps
```

6. **View logs:**
```bash
docker-compose logs -f
```

7. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin: http://localhost:8000/admin

### Production Deployment

1. **Update environment variables:**
```bash
# Edit .env file with production values
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-strong-secret-key-here
POSTGRES_PASSWORD=strong-password-here
```

2. **Build and start:**
```bash
docker-compose -f deployment/docker-compose.prod.yml up -d --build
```

3. **Create superuser:**
```bash
docker-compose -f deployment/docker-compose.prod.yml exec backend python manage.py createsuperuser
```

4. **Access the application:**
- Application: http://your-server-ip
- Admin: http://your-server-ip/admin

## Common Deployment Tasks

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stopping Services

```bash
# Stop but keep containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (deletes data!)
docker-compose down -v
```

### Updating the Application

1. **Pull latest code:**
```bash
git pull
```

2. **Rebuild and restart:**
```bash
docker-compose up -d --build
```

3. **Run migrations:**
```bash
docker-compose exec backend python manage.py migrate
```

### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U postgres beerfinder > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres beerfinder < backup.sql
```

## Troubleshooting

### Services Won't Start

1. **Check if ports are available:**
```bash
# Check if port 80, 3000, 8000, 5432 are in use
netstat -tulpn | grep -E ':(80|3000|8000|5432)'
```

2. **Check Docker logs:**
```bash
docker-compose logs
```

3. **Check if database is ready:**
```bash
docker-compose exec db pg_isready -U postgres
```

### Database Connection Errors

1. **Check database is running:**
```bash
docker-compose ps db
```

2. **Check database logs:**
```bash
docker-compose logs db
```

3. **Verify connection settings in .env:**
```bash
cat .env | grep POSTGRES
```

### Frontend Not Loading

1. **Check if frontend container is running:**
```bash
docker-compose ps frontend
```

2. **Check frontend logs:**
```bash
docker-compose logs frontend
```

3. **Rebuild frontend:**
```bash
docker-compose up -d --build frontend
```

### Backend API Not Responding

1. **Check backend logs:**
```bash
docker-compose logs backend
```

2. **Check if migrations ran:**
```bash
docker-compose exec backend python manage.py showmigrations
```

3. **Run migrations manually:**
```bash
docker-compose exec backend python manage.py migrate
```

## Security Considerations

### For Production:

1. **Change default passwords** in `.env`
2. **Set `DJANGO_DEBUG=False`**
3. **Use strong `DJANGO_SECRET_KEY`**
4. **Configure `ALLOWED_HOSTS`** properly
5. **Use HTTPS** (SSL/TLS certificates)
6. **Set up firewall** rules
7. **Regular backups** of database
8. **Keep dependencies updated**

## Monitoring

### Check Service Health

```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose exec backend curl http://localhost:8000/health/
```

### Resource Usage

```bash
# View resource usage
docker stats
```

## Next Steps

After deployment:
1. Create admin user
2. Configure domain name (if needed)
3. Set up SSL certificate (for HTTPS)
4. Configure backup strategy
5. Set up monitoring and logging
6. Document your deployment process
