#!/bin/bash
# ============================================
# Database Setup Script for Oracle Cloud
# ============================================

set -e

echo "🗄️  Setting up PostgreSQL database..."

# Colors for output
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

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_info "Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    print_status "PostgreSQL installed"
else
    print_status "PostgreSQL is already installed"
fi

# Start PostgreSQL service
print_info "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_status "PostgreSQL service started"

# Create database and user
print_info "Setting up database and user..."

# Generate random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_NAME="banhannah_prod"
DB_USER="banhannah_user"

# Create database and user
sudo -u postgres psql << EOF
-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

\q
EOF

print_status "Database and user created"

# Update .env.production with database URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

print_info "Updating .env.production with database configuration..."

# Create or update .env.production
if [ -f ".env.production" ]; then
    # Update existing file
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env.production
else
    # Create from template
    cp .env.example .env.production
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env.production
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-32)
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env.production

print_status "Environment file updated"

echo ""
echo "============================================"
print_status "Database setup complete!"
echo "============================================"
echo ""
print_info "Database Details:"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo ""
print_warning "IMPORTANT: Save these credentials securely!"
echo ""
print_info "Next steps:"
echo "1. Update remaining values in .env.production"
echo "2. Run: npx prisma migrate deploy"
echo "3. Run: npm run prisma:seed"
echo "4. Start the server: npm start"