#!/bin/bash

# Setup systemd service for BanHannah backend
echo "🔧 Setting up BanHannah Backend systemd service..."

# Stop any existing processes on port 3002
echo "📋 Checking for existing processes on port 3002..."
EXISTING_PID=$(sudo lsof -t -i:3002 2>/dev/null)
if [ ! -z "$EXISTING_PID" ]; then
    echo "⚠️  Found existing process (PID: $EXISTING_PID), stopping it..."
    sudo kill $EXISTING_PID
    sleep 2
    
    # Force kill if still running
    if sudo lsof -t -i:3002 >/dev/null 2>&1; then
        echo "🔥 Force killing stubborn process..."
        sudo kill -9 $EXISTING_PID
        sleep 1
    fi
    echo "✅ Existing process stopped"
else
    echo "✅ No existing processes found on port 3002"
fi

# Stop existing systemd service if running
echo "🛑 Stopping existing systemd service (if any)..."
sudo systemctl stop banhannah-backend 2>/dev/null || true

# Copy service file to systemd directory
echo "📁 Installing systemd service file..."
sudo cp /home/ubuntu/banhannah/backend/banhannah-backend.service /etc/systemd/system/

# Set proper permissions
sudo chmod 644 /etc/systemd/system/banhannah-backend.service

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service to start on boot
echo "🚀 Enabling service for auto-start..."
sudo systemctl enable banhannah-backend

# Start the service
echo "▶️  Starting BanHannah backend service..."
sudo systemctl start banhannah-backend

# Wait a moment for startup
sleep 3

# Check service status
echo "📊 Checking service status..."
sudo systemctl status banhannah-backend --no-pager -l

# Check if port is now in use
echo "🔍 Verifying port 3002 is in use..."
if sudo lsof -i :3002 >/dev/null 2>&1; then
    echo "✅ Service is running on port 3002"
    
    # Show recent logs
    echo "📝 Recent service logs:"
    sudo journalctl -u banhannah-backend --no-pager -n 10
else
    echo "❌ Service is not running on port 3002"
    echo "📝 Service logs for debugging:"
    sudo journalctl -u banhannah-backend --no-pager -n 20
    exit 1
fi

echo ""
echo "🎉 Systemd service setup complete!"
echo ""
echo "📋 Useful commands:"
echo "   sudo systemctl status banhannah-backend    # Check status"
echo "   sudo systemctl restart banhannah-backend   # Restart service"
echo "   sudo systemctl stop banhannah-backend      # Stop service"
echo "   sudo systemctl start banhannah-backend     # Start service"
echo "   sudo journalctl -u banhannah-backend -f    # Follow logs"
echo "   sudo journalctl -u banhannah-backend -n 50 # Show last 50 log entries"