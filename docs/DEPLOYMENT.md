# ============================================
# docs/DEPLOYMENT.md
# ============================================
# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Domain name
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL database (or use Docker)

## Environment Setup

1. Create production environment file:
```bash
cp backend/.env.example .env
```

2. Update `.env` with production values:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<generate-secure-secret>
FRONTEND_URL=https://yourdomain.com
SERVER_URL=https://yourdomain.com/api
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Docker Deployment

1. Build images:
```bash
docker-compose -f docker-compose.prod.yml build
```

2. Start services:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. Run migrations:
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

4. Check logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## SSL Setup

1. Get SSL certificate (Let's Encrypt):
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

2. Update nginx.conf with SSL:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # ... rest of config
}
```

## Manual Deployment (VPS)

1. Install dependencies:
```bash
# Backend
cd backend
npm ci --production
npx prisma generate
npx prisma migrate deploy

# Frontend
cd frontend
npm ci
npm run build
```

2. Setup PM2:
```bash
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name edu-backend

# Serve frontend with nginx or PM2
pm2 serve frontend/dist 5173 --name edu-frontend
```

3. Setup nginx as reverse proxy:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
    }

    location /api {
        proxy_pass http://localhost:3002;
    }
}
```

## Database Backup

```bash
# Backup
pg_dump -U user dbname > backup.sql

# Restore
psql -U user dbname < backup.sql
```

## Monitoring

1. View logs:
```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs
```

2. Monitor resources:
```bash
# Docker
docker stats

# PM2
pm2 monit
```

## Security Checklist

- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Use environment variables
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs