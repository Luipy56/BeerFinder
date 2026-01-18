-- Database initialization SQL script for BeerFinder
-- This script sets up the PostgreSQL database with PostGIS extension

-- Create database (if not exists)
-- Note: This should be run as a superuser
-- CREATE DATABASE beerfinder;

-- Connect to the database
\c beerfinder;

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS installation
SELECT PostGIS_version();
