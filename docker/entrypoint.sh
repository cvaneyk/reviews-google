#!/bin/sh
set -e

echo "Running database migrations..."
cd /app
npx prisma db push --schema=./packages/database/prisma/schema.prisma --skip-generate

echo "Starting application..."
exec node apps/web/server.js
