#!/bin/bash
# ============================================
# scripts/dev.sh
# ============================================
#!/bin/bash

set -e

echo "🚀 Starting Educational Platform in Development Mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
echo "📦 Starting services with Docker Compose..."
docker-compose up -d postgres

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 5

# Start backend
echo "🔧 Starting backend..."
cd backend
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "⚠️  Created .env.local - please configure it"
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    npm install
fi

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start backend in background
npm run dev &
BACKEND_PID=$!

cd ..

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
if [ ! -f .env.local ]; then
    echo "VITE_API_URL=http://localhost:3002/api" > .env.local
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    npm install
fi

# Start frontend
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Development servers started!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT
wait
