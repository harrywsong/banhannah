# Oracle Cloud Deployment Guide

This guide will help you deploy the backend to Oracle Cloud and connect it with your Cloudflare Pages frontend.

## Prerequisites

- Oracle Cloud instance with Ubuntu/Linux
- PostgreSQL database (can be on the same instance or separate)
- Node.js 18+ installed on the instance
- Git installed

## Step-by-Step Deployment

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-repo-name>

# Run the Oracle Cloud setup script
cd backend
bash ../scripts/deploy-oracle-setup.sh
```

### 2. Configure Environment

```bash
# Copy the production template
cp .env.production.template .env.production

# Edit with your actual values
nano .env.production
```

**Critical values to update:**
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Generate a strong 32+ character secret
- `ALLOWED_ORIGINS`: Your Cloudflare Pages domain(s)
- `FRONTEND_URL`: Your Cloudflare Pages URL
- `SERVER_URL`: Your Oracle Cloud backend URL
- `ADMIN_EMAIL`: Your admin email
- `ADMIN_PASSWORD`: Strong admin password

### 3. Database Setup

If using PostgreSQL on the same instance:

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE banhannah_prod;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE banhannah_prod TO your_user;
\q
```

### 4. Start the Backend

```bash
# Test run
npm start

# Or install as a system service
sudo cp banhannah-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable banhannah-backend
sudo systemctl start banhannah-backend
```

### 5. Configure Firewall

```bash
# Allow your backend port (default 3002)
sudo ufw allow 3002

# Or if using nginx as reverse proxy
sudo ufw allow 80
sudo ufw allow 443
```

### 6. Verify Deployment

```bash
# Run verification script
node ../scripts/verify-deployment.js

# Test API endpoint
curl http://localhost:3002/api/health
```

### 7. Update Cloudflare Pages

In your Cloudflare Pages dashboard, update environment variables:

- `VITE_API_URL`: `https://your-oracle-backend-domain.com`
- Any other frontend environment variables

## File Structure After Setup

```
backend/
├── storage/
│   ├── uploads/           # User uploaded files
│   ├── previews/          # Generated preview images
│   ├── profile-pictures/  # User profile pictures
│   ├── videos/           # Video files
│   └── videos/hls/       # Processed video streams
├── logs/                 # Application logs
├── .env.production       # Production configuration
└── node_modules/         # Dependencies
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U your_user -d banhannah_prod
```

### Storage Permission Issues
```bash
# Fix storage permissions
chmod -R 755 storage/
chmod -R 755 logs/
```

### Service Issues
```bash
# Check service status
sudo systemctl status banhannah-backend

# View logs
sudo journalctl -u banhannah-backend -f
```

### CORS Issues
- Ensure `ALLOWED_ORIGINS` in `.env.production` includes your Cloudflare Pages domain
- Check that your frontend is making requests to the correct backend URL

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Configure firewall properly
- [ ] Set up SSL/TLS certificates
- [ ] Regularly update dependencies
- [ ] Monitor logs for suspicious activity

## Maintenance

```bash
# Update dependencies
npm update

# Backup database
pg_dump banhannah_prod > backup_$(date +%Y%m%d).sql

# View application logs
tail -f logs/combined.log
```