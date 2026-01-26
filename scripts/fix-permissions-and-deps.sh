#!/bin/bash
# ============================================
# Quick Fix for Permissions and Dependencies
# ============================================

set -e

echo "🔧 Fixing permissions and dependency issues..."

# Fix ownership and permissions
echo "📁 Fixing directory permissions..."
sudo chown -R $USER:$USER .
sudo chmod -R 755 .

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "📋 Node.js version: $(node -v)"

if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js 18 detected. Updating package.json for compatibility..."
    
    # Backup original package.json
    if [ ! -f "package.json.backup" ]; then
        cp package.json package.json.backup
        echo "✅ Created package.json backup"
    fi
    
    # Update cross-env to compatible version
    sed -i 's/"cross-env": "^10.1.0"/"cross-env": "^7.0.3"/' package.json
    echo "✅ Updated cross-env to Node.js 18 compatible version"
fi

# Clean npm cache and install
echo "🧹 Cleaning npm cache..."
npm cache clean --force

echo "📦 Installing dependencies..."
npm install

echo "✅ Dependencies installed successfully!"
echo ""
echo "Now you can continue with the setup:"
echo "  bash ../scripts/deploy-oracle-setup.sh"