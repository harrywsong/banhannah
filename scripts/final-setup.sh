#!/bin/bash
# ============================================
# Final Database Setup - Simple Approach
# ============================================

set -e

echo "🔧 Final database setup with known credentials..."

# Set simple, known credentials
DB_NAME="banhannah_prod"
DB_USER="banhannah"
DB_PASSWORD="banhannah2024"

echo "📝 Setting known password for database user..."
sudo -u postgres psql -c "ALTER USER banhannah PASSWORD '$DB_PASSWORD';"

# Create the DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

echo "🔗 Testing connection with new credentials..."
if psql "${DATABASE_URL}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Still failing, let's check what's wrong..."
    psql "${DATABASE_URL}" -c "SELECT 1;"
    exit 1
fi

# Update .env.production
echo "📝 Updating .env.production..."
sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env.production
sed -i 's|EMAIL_FROM=".*"|EMAIL_FROM=info.banhannah@gmail.com|' .env.production

# Set environment variables
export DATABASE_URL="${DATABASE_URL}"
export NODE_ENV=production

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🚀 Running migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run prisma:seed

echo ""
echo "============================================"
echo "✅ Setup complete!"
echo "============================================"
echo ""
echo "Database credentials:"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo "  URL: ${DATABASE_URL}"
echo ""
echo "🚀 Start your server:"
echo "  npm start"