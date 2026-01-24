# ============================================
# docs/SETUP.md
# ============================================
# Setup Guide

## Development Setup

### 1. Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn
- Git

### 2. Clone Repository

```bash
git clone <repository-url>
cd educational-platform
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Update .env.local with your values:
# - DATABASE_URL
# - JWT_SECRET
# - SMTP credentials (optional for development)

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run prisma:seed

# Start development server
npm run dev
```

Backend will be running at http://localhost:3002

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3002/api" > .env.local

# Start development server
npm run dev
```

Frontend will be running at http://localhost:5173

### 5. Database Setup

Using Docker (recommended):
```bash
docker-compose up -d postgres
```

Manual PostgreSQL:
```bash
createdb educational_platform_dev
```

### 6. Test Accounts

After seeding, you can use:

**Admin Account:**
- Email: admin@example.com
- Password: admin123

**Student Accounts:**
- Email: student1@example.com
- Password: student123

## Quick Start Script

```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x backend/scripts/*.sh

# Run setup
./backend/scripts/setup.sh

# Start development servers
./scripts/dev.sh
```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string in .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Port Already in Use

```bash
# Find and kill process on port 3002
lsof -ti:3002 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Prisma Migration Issues

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate client
npx prisma generate
```

### File Upload Issues

```bash
# Ensure storage directories exist
mkdir -p backend/storage/{uploads,previews,profile-pictures,videos}

# Set permissions
chmod -R 755 backend/storage
```

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense

Settings (.vscode/settings.json):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Next Steps

1. Read [API Documentation](API.md)
2. Explore the codebase
3. Make your first contribution
4. Check [Deployment Guide](DEPLOYMENT.md) for production setup