#!/bin/bash
# ============================================
# Seed Database with Production Environment
# ============================================

set -e

echo "🌱 Seeding database with production environment..."

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

# Run seed
echo "🚀 Seeding database..."
npm run prisma:seed

echo "✅ Database seeded!"