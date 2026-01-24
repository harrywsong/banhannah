#!/bin/bash
# ============================================
# scripts/prod.sh
# ============================================
#!/bin/bash

set -e

echo "🚀 Deploying Educational Platform to Production..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with production values."
    exit 1
fi

# Load environment variables
export $(cat .env | xargs)

# Build and start services
echo "📦 Building and starting production services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database
echo "⏳ Waiting for database..."
sleep 10

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "Services are running:"
echo "  - Frontend & Backend: http://your-domain.com"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""
