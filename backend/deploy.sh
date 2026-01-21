#!/bin/bash
# Production deployment script

echo "🚀 Starting production deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Run database migrations
npm run prisma:migrate:prod

# Restart application (adjust based on your process manager)
pm2 restart banhannah-backend || pm2 start npm --name "banhannah-backend" -- start

echo "✅ Deployment complete!"