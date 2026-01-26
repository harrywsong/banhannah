#!/bin/bash
# ============================================
# Run Database Migrations with Production Env
# ============================================

set -e

echo "🗄️  Running database migrations with production environment..."

# Load environment variables from .env.production
if [ -f ".env.production" ]; then
    echo "📋 Loading environment from .env.production..."
    export $(grep -v '^#' .env.production | xargs)
    echo "✅ Environment loaded"
else
    echo "❌ .env.production not found!"
    exit 1
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment"
    exit 1
fi

echo "🔗 Using database: $DATABASE_URL"

# Run migrations
echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed!"

# Generate Prisma client (in case it's needed)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Setup complete!"