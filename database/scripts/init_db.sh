#!/bin/bash
# Database initialization script for BeerFinder
# This script sets up the PostgreSQL database with PostGIS extension

set -e

echo "Initializing BeerFinder database..."

# Wait for PostgreSQL to be ready
until pg_isready -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER:-postgres}"; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Create database if it doesn't exist
psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER:-postgres}" -tc "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB:-beerfinder}'" | grep -q 1 || \
psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER:-postgres}" -c "CREATE DATABASE ${POSTGRES_DB:-beerfinder};"

# Enable PostGIS extension
psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-beerfinder}" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -h "${POSTGRES_HOST:-db}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-beerfinder}" -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"

echo "Database initialized successfully!"
