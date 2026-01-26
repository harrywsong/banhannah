#!/bin/bash
# ============================================
# PM2 Setup Script for Auto-Restart
# ============================================

set -e

echo "🚀 Setting up PM2 for automatic restart..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Install PM2 globally
print_info "Installing PM2 globally..."
sudo npm install -g pm2
print_status "PM2 installed"

# Create PM2 ecosystem file
print_info "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'banhannah-backend',
    script: 'server.js',
    cwd: '/home/ubuntu/banhannah/backend',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    
    // Process management
    instances: 1,
    exec_mode: 'fork',
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Restart policy
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Logging
    log_file: './logs/pm2-combined.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Advanced restart conditions
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health monitoring
    health_check_grace_period: 3000
  }]
};
EOF

print_status "PM2 ecosystem file created"

# Stop any existing PM2 processes
print_info "Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start the application with PM2
print_info "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
print_info "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
print_info "Setting up PM2 startup script..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

print_status "PM2 startup script configured"

# Show PM2 status
print_info "Current PM2 status:"
pm2 status

echo ""
echo "============================================"
print_status "PM2 setup complete!"
echo "============================================"
echo ""
print_info "PM2 Commands:"
echo "  pm2 status           - Show process status"
echo "  pm2 logs             - Show logs"
echo "  pm2 restart all      - Restart all processes"
echo "  pm2 stop all         - Stop all processes"
echo "  pm2 monit            - Monitor processes"
echo ""
print_info "Your backend will now:"
echo "  ✓ Auto-restart on crashes"
echo "  ✓ Auto-restart on high memory usage (>1GB)"
echo "  ✓ Restart with exponential backoff"
echo "  ✓ Start automatically on server boot"
echo "  ✓ Log all output to files"