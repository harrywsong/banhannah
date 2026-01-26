#!/bin/bash
# ============================================
# Environment Configuration Helper
# ============================================

set -e

echo "🔧 Configuring environment variables..."

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "YOUR_SERVER_IP")

echo ""
echo "============================================"
echo "Environment Configuration"
echo "============================================"
echo ""

# Read current values or set defaults
read -p "Enter your Cloudflare Pages domain (e.g., myapp.pages.dev): " FRONTEND_DOMAIN
read -p "Enter your backend domain or IP (default: ${SERVER_IP}): " BACKEND_DOMAIN
BACKEND_DOMAIN=${BACKEND_DOMAIN:-$SERVER_IP}

read -p "Enter backend port (default: 3002): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3002}

read -p "Enter admin email: " ADMIN_EMAIL
read -s -p "Enter admin password: " ADMIN_PASSWORD
echo ""

# Update .env.production
echo "📝 Updating .env.production..."

sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://${FRONTEND_DOMAIN}|" .env.production
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://${FRONTEND_DOMAIN}|" .env.production
sed -i "s|SERVER_URL=.*|SERVER_URL=http://${BACKEND_DOMAIN}:${BACKEND_PORT}|" .env.production
sed -i "s|PORT=.*|PORT=${BACKEND_PORT}|" .env.production
sed -i "s|ADMIN_EMAIL=.*|ADMIN_EMAIL=${ADMIN_EMAIL}|" .env.production
sed -i "s|ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PASSWORD}|" .env.production

echo "✅ Environment configured!"
echo ""
echo "📋 Configuration Summary:"
echo "  Frontend: https://${FRONTEND_DOMAIN}"
echo "  Backend: http://${BACKEND_DOMAIN}:${BACKEND_PORT}"
echo "  Admin Email: ${ADMIN_EMAIL}"
echo ""
echo "🔥 Don't forget to update your Cloudflare Pages environment variables:"
echo "  VITE_API_URL=http://${BACKEND_DOMAIN}:${BACKEND_PORT}"