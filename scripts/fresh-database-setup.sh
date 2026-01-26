#!/bin/bash
# ============================================
# Fresh Database Setup - Clean Start
# ============================================

set -e

echo "🗑️  Starting fresh database setup..."

# Colors
RED='\033[0;31m'
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

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Stop any running PostgreSQL connections
print_info "Stopping PostgreSQL connections..."
sudo systemctl stop postgresql || true

# Start PostgreSQL
print_info "Starting PostgreSQL..."
sudo systemctl start postgresql

# Drop all existing databases and users
print_info "Cleaning up existing databases and users..."
sudo -u postgres psql << 'EOF'
-- Drop databases if they exist
DROP DATABASE IF EXISTS banhannah;
DROP DATABASE IF EXISTS banhannah_dev;
DROP DATABASE IF EXISTS banhannah_prod;
DROP DATABASE IF EXISTS banhannah_test;

-- Drop users if they exist
DROP USER IF EXISTS hws;
DROP USER IF EXISTS banhannah_user;
DROP USER IF EXISTS banhannah;

-- List remaining databases (for verification)
\l
EOF

print_status "All databases and users removed"

# Create new database and user
print_info "Creating fresh database setup..."

DB_NAME="banhannah_prod"
DB_USER="banhannah"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-20)

sudo -u postgres psql << EOF
-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Grant all privileges
ALTER USER ${DB_USER} CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to the database and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- Verify connection
SELECT 'Database setup successful!' as status;
\q
EOF

print_status "Fresh database created"

# Create new .env.production
print_info "Creating fresh .env.production..."

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-32)

cat > .env.production << EOF
# ============================================
# PRODUCTION ENVIRONMENT - FRESH SETUP
# ============================================

# Environment
NODE_ENV=production

# Server
PORT=3002
HOST=0.0.0.0

# Database
DATABASE_URL=${DATABASE_URL}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS - Update with your actual domains
ALLOWED_ORIGINS=https://banhannah.pages.dev

# File Upload Limits (in bytes)
MAX_FILE_SIZE=52428800
MAX_VIDEO_SIZE=2147483648

# Admin Account
ADMIN_EMAIL=admin@banhannah.com
ADMIN_PASSWORD=ChangeThisPassword123!
ADMIN_NAME=Admin User

# Email (SMTP) - Update with your actual SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="BanHannah <noreply@banhannah.com>"

# URLs - Update with your actual domains
FRONTEND_URL=https://banhannah.pages.dev
SERVER_URL=http://40.233.73.106:3002

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOF

print_status ".env.production created"

# Test database connection
print_info "Testing database connection..."
if psql "${DATABASE_URL}" -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_error "Database connection failed"
    exit 1
fi

# Load environment and run migrations
print_info "Loading environment and running migrations..."
export $(grep -v '^#' .env.production | xargs)

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

print_status "Migrations completed"

# Seed database
print_info "Seeding database..."
npm run prisma:seed

print_status "Database seeded"

echo ""
echo "============================================"
print_status "Fresh database setup complete!"
echo "============================================"
echo ""
print_info "Database Details:"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo "  URL: ${DATABASE_URL}"
echo ""
print_info "Admin Account:"
echo "  Email: admin@banhannah.com"
echo "  Password: ChangeThisPassword123!"
echo ""
print_warning "IMPORTANT:"
echo "1. Save the database credentials securely"
echo "2. Update SMTP settings in .env.production"
echo "3. Update SERVER_URL if using a domain"
echo "4. Change the admin password after first login"
echo ""
print_info "Start the server with: npm start"
EOF