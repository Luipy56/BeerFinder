# Multi-stage build for BeerFinder application
# Stage 1: Backend (Django) - Used for both development and production
FROM python:3.11-slim as backend

WORKDIR /app/backend

# Install system dependencies including build tools for development
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gdal-bin \
    libgdal-dev \
    python3-gdal \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Make entrypoint script executable
RUN chmod +x /app/backend/entrypoint-dev.sh

# Stage 2: Frontend (React) - Development
FROM node:18-alpine as frontend-dev

# Install tini for proper signal handling
RUN apk add --no-cache tini

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
# Use npm install for first-time setup (npm ci requires package-lock.json)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy frontend code
COPY frontend/ .

# Make entrypoint script executable
RUN chmod +x /app/frontend/entrypoint-dev.sh

# Set default API URL for build (can be overridden by environment variable)
ARG REACT_APP_API_URL=http://localhost:8000/api/v1
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Stage 2b: Frontend (React) - Production Build
FROM frontend-dev as frontend

# Build frontend for production
# ARG and ENV need to be set before the build
ARG REACT_APP_API_URL=http://localhost:8000/api/v1
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Stage 3: Production
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gdal-bin \
    libgdal-dev \
    python3-gdal \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy backend from stage 1
COPY --from=backend /app/backend /app/backend

# Copy frontend build from stage 2
COPY --from=frontend /app/frontend/build /app/frontend/build

# Copy nginx configuration
COPY deployment/nginx.conf /etc/nginx/sites-available/default

# Expose port
EXPOSE 80

# Start services
COPY deployment/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
