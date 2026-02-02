#!/bin/bash

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
while ! pg_isready -h db -U playto_user; do
  sleep 1
done

echo "PostgreSQL started"

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Start server
echo "Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000