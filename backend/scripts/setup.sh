#!/bin/bash
# ============================================
# backend/scripts/setup.sh
# ============================================
#!/bin/bash

set -e

echo "🚀 Setting up Educational Platform Backend..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev

# Seed database
echo "🌱 Seeding database..."
npm run prisma:seed

# Create storage directories
echo "📁 Creating storage directories..."
mkdir -p storage/uploads
mkdir -p storage/previews
mkdir -p storage/profile-pictures
mkdir -p storage/videos
mkdir -p storage/videos/hls
mkdir -p logs

echo ""
echo "✅ Setup complete!"
echo ""
echo "Default admin account:"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
echo "To start the server:"
echo "  npm run dev"
echo ""
