# Environment Setup Guide

## Backend Setup

1. **Copy environment template:**
```bash
   cd backend
   cp .env.example .env.development
   cp .env.example .env.production
```

2. **Configure development environment:**
   - Edit `.env.development`
   - Set database URL to local PostgreSQL
   - Use simple passwords for dev
   - SMTP is optional (emails will be simulated)

3. **Configure production environment:**
   - Edit `.env.production`
   - **CRITICAL**: Change all passwords
   - Configure production database
   - Set up SMTP for real emails
   - Set production domain URLs

4. **Run development:**
```bash
   npm run dev
```

5. **Run production:**
```bash
   npm start
```

## Frontend Setup

1. **Copy environment template:**
```bash
   cd frontend
   cp .env.example .env.development
   cp .env.example .env.production
```

2. **Configure development:**
   - `.env.development` should point to `http://localhost:3002`

3. **Configure production:**
   - `.env.production` should point to your production API URL

4. **Run development:**
```bash
   npm run dev
```

5. **Build for production:**
```bash
   npm run build
```

## Database Migration

**Development:**
```bash
cd backend
npm run prisma:migrate:dev
```

**Production:**
```bash
cd backend
npm run prisma:migrate:prod
```

## Security Checklist

- [ ] Change all passwords in `.env.production`
- [ ] Generate new JWT_SECRET for production
- [ ] Configure SMTP with production credentials
- [ ] Set correct ALLOWED_ORIGINS
- [ ] Never commit `.env` files to git
- [ ] Use strong admin password
- [ ] Review all API URLs