#!/bin/bash
# ============================================
# Fix Database URL in .env.production
# ============================================

set -e

echo "🔧 Fixing DATABASE_URL in .env.production..."

# The database was created with these credentials from the script
DB_NAME="banhannah_prod"
DB_USER="banhannah_user"

# Get the password that was generated (it should be in the previous output)
echo "The database setup script created:"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo ""

# Check if we can connect with the existing URL first
echo "Testing existing DATABASE_URL..."
if grep -q "postgresql://hws:winternight@localhost:5432/banhannah" .env.production; then
    echo "Found existing database configuration."
    echo "Let's test if it works..."
    
    # Test the existing connection
    export $(grep DATABASE_URL .env.production | xargs)
    if psql "$DATABASE_URL" -c "SELECT 1;" 2>/dev/null; then
        echo "✅ Existing database connection works!"
        echo "No changes needed to DATABASE_URL"
        exit 0
    else
        echo "❌ Existing database connection failed"
    fi
fi

# If we get here, we need to fix the DATABASE_URL
echo ""
echo "We need to update the DATABASE_URL. Choose an option:"
echo "1. Use the newly created database (banhannah_prod/banhannah_user)"
echo "2. Use the existing database (banhannah/hws)"
echo "3. Create a new database with custom settings"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        # We need the password from the previous script run
        echo "We need the password that was generated for banhannah_user."
        echo "Check the output above for the password, or we can reset it."
        read -p "Enter the password for banhannah_user (or press Enter to reset): " DB_PASSWORD
        
        if [ -z "$DB_PASSWORD" ]; then
            echo "Resetting password for banhannah_user..."
            DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            sudo -u postgres psql -c "ALTER USER banhannah_user PASSWORD '$DB_PASSWORD';"
            echo "New password set: $DB_PASSWORD"
        fi
        
        NEW_DATABASE_URL="postgresql://banhannah_user:${DB_PASSWORD}@localhost:5432/banhannah_prod"
        ;;
    2)
        echo "Keeping existing database configuration..."
        NEW_DATABASE_URL="postgresql://hws:winternight@localhost:5432/banhannah"
        ;;
    3)
        read -p "Enter database name: " DB_NAME
        read -p "Enter username: " DB_USER
        read -p "Enter password: " DB_PASSWORD
        NEW_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
        ;;
esac

# Update the .env.production file
echo "Updating .env.production with new DATABASE_URL..."
cp .env.production .env.production.backup

# Use a different delimiter for sed to avoid issues with special characters
sed "s|DATABASE_URL=.*|DATABASE_URL=${NEW_DATABASE_URL}|" .env.production.backup > .env.production

echo "✅ DATABASE_URL updated!"
echo "New DATABASE_URL: ${NEW_DATABASE_URL}"