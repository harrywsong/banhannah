#!/bin/bash
# ============================================
# Start Server with Available Port
# ============================================

set -e

echo "🚀 Starting BanHannah backend server..."

# Check if port 3002 is in use
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3002 is in use. Checking what's running..."
    echo "Processes using port 3002:"
    sudo lsof -i :3002
    echo ""
    
    read -p "Kill existing process on port 3002? (y/n): " kill_process
    if [ "$kill_process" = "y" ]; then
        echo "🔪 Killing processes on port 3002..."
        sudo fuser -k 3002/tcp
        sleep 2
        PORT=3002
    else
        echo "📝 Using port 3003 instead..."
        PORT=3003
        # Update .env.production with new port
        sed -i "s|PORT=.*|PORT=${PORT}|" .env.production
        sed -i "s|:3002|:${PORT}|g" .env.production
    fi
else
    echo "✅ Port 3002 is available"
    PORT=3002
fi

# Load environment
export $(grep -v '^#' .env.production | grep -v EMAIL_FROM | xargs)
export EMAIL_FROM="info.banhannah@gmail.com"
export PORT=${PORT}

echo "🌐 Starting server on port ${PORT}..."
echo "📍 Server will be available at: http://40.233.73.106:${PORT}"
echo ""

# Start the server
npm start