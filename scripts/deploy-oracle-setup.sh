#!/bin/bash
# ============================================
# Oracle Cloud Instance Setup Script
# ============================================
# This script sets up the backend on a fresh Oracle Cloud instance
# Run this after cloning the repository

set -e

echo "🚀 Setting up Educational Platform Backend on Oracle Cloud..."
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the backend directory"
    exit 1
fi

# 1. Check Node.js version and fix permissions
print_info "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_warning "Node.js version $NODE_VERSION detected. Some packages require Node.js 20+"
    print_info "Updating package.json to use compatible versions..."
    
    # Create a temporary package.json with compatible versions
    if [ -f "package.json.backup" ]; then
        print_info "Backup already exists, using original"
    else
        cp package.json package.json.backup
    fi
    
    # Replace cross-env version for Node 18 compatibility
    sed -i 's/"cross-env": "^10.1.0"/"cross-env": "^7.0.3"/' package.json
fi

# Fix ownership of the directory
print_info "Fixing directory permissions..."
sudo chown -R $USER:$USER .
sudo chmod -R 755 .

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
npm install
print_status "Dependencies installed"

# 2. Create storage directories
print_info "Creating storage directories..."
node create-storage-dirs.js
print_status "Storage directories created"

# 3. Check for environment file
if [ ! -f ".env.production" ]; then
    print_warning "Creating .env.production from .env.example..."
    cp .env.example .env.production
    print_warning "IMPORTANT: Please update .env.production with your actual values!"
    print_warning "Especially: DATABASE_URL, JWT_SECRET, ALLOWED_ORIGINS, FRONTEND_URL"
else
    print_status ".env.production already exists"
fi

# 4. Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
print_status "Prisma client generated"

# 5. Run database migrations
print_info "Running database migrations..."
if npx prisma migrate deploy; then
    print_status "Database migrations completed"
else
    print_error "Database migrations failed. Please check your DATABASE_URL in .env.production"
    exit 1
fi

# 6. Seed the database
print_info "Seeding database with initial data..."
if npm run prisma:seed; then
    print_status "Database seeded successfully"
else
    print_warning "Database seeding failed or already seeded"
fi

# 7. Set proper permissions for storage directories
print_info "Setting storage directory permissions..."
chmod -R 755 storage/
chmod -R 755 logs/
print_status "Permissions set"

# 8. Create systemd service file (optional)
print_info "Creating systemd service file..."
cat > banhannah-backend.service << EOF
[Unit]
Description=BanHannah Educational Platform Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

print_status "Systemd service file created: banhannah-backend.service"
print_info "To install the service, run:"
print_info "  sudo cp banhannah-backend.service /etc/systemd/system/"
print_info "  sudo systemctl daemon-reload"
print_info "  sudo systemctl enable banhannah-backend"
print_info "  sudo systemctl start banhannah-backend"

echo ""
echo "============================================"
print_status "Oracle Cloud setup complete!"
echo "============================================"
echo ""
print_info "Next steps:"
echo "1. Update .env.production with your actual values"
echo "2. Make sure your PostgreSQL database is running and accessible"
echo "3. Update ALLOWED_ORIGINS to include your Cloudflare Pages domain"
echo "4. Start the server with: npm start"
echo ""
print_info "Default admin account (if seeded):"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
print_warning "Remember to:"
echo "- Change the default admin password"
echo "- Set up SSL/TLS certificates"
echo "- Configure your firewall to allow traffic on your chosen port"
echo "- Update your Cloudflare Pages environment variables to point to this backend"