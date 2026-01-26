#!/bin/bash
# ============================================
# Complete the Database Setup
# ============================================

set -e

echo "🔧 Completing database setup..."

# Get the new database credentials from the fresh setup
DB_NAME="banhannah_prod"
DB_USER="banhannah"

# We need to get the password that was created
echo "Getting database password..."
DB_PASSWORD=$(sudo -u postgres psql -t -c "SELECT rolpassword FROM pg_authid WHERE rolname='banhannah';" | tr -d ' ')

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Could not retrieve password. Let's create a new one..."
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-20)
    sudo -u postgres psql -c "ALTER USER banhannah PASSWORD '$DB_PASSWORD';"
    echo "✅ New password set: $DB_PASSWORD"
fi

# Create the correct DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# Update the .env.production file with the correct database URL
echo "📝 Updating .env.production with fresh database URL..."
cp .env.production .env.production.backup

# Fix the EMAIL_FROM issue and update DATABASE_URL
sed -i 's|DATABASE_URL=.*|DATABASE_URL='${DATABASE_URL}'|' .env.production
sed -i 's|EMAIL_FROM=".*"|EMAIL_FROM=info.banhannah@gmail.com|' .env.production

echo "✅ Environment file updated"

# Test the connection
echo "🔗 Testing database connection..."
if psql "${DATABASE_URL}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "DATABASE_URL: ${DATABASE_URL}"
    exit 1
fi

# Load environment variables properly (avoiding the EMAIL_FROM issue)
echo "📋 Loading environment variables..."
export NODE_ENV=production
export DATABASE_URL="${DATABASE_URL}"
export $(grep -v '^#' .env.production | grep -v EMAIL_FROM | xargs)
export EMAIL_FROM="info.banhannah@gmail.com"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🚀 Running database migrations..."
npx prisma migrate deploy

# Seed database
echo "🌱 Seeding database..."
npm run prisma:seed

echo ""
echo "============================================"
echo "✅ Database setup complete!"
echo "============================================"
echo ""
echo "Database Details:"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo "  URL: ${DATABASE_URL}"
echo ""
echo "🚀 Start the server with:"
echo "  npm start"
echo ""
echo "🔗 Your backend will be available at:"
echo "  http://40.233.73.106:3002"