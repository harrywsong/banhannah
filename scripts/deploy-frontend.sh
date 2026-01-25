#!/bin/bash

# Frontend deployment script for Vercel
echo "🚀 Deploying frontend fixes for preview images..."

# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building frontend..."
npm run build

# Deploy to Vercel (if vercel CLI is installed)
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
else
    echo "⚠️  Vercel CLI not found. Please install it with: npm i -g vercel"
    echo "📝 Or push changes to main branch for automatic deployment"
fi

echo "✅ Frontend deployment process completed!"
echo ""
echo "🔧 Changes made:"
echo "  - Fixed preview image URLs to use full API URL"
echo "  - Added error handling for broken images"
echo "  - Fixed hardcoded /api/ paths in components"
echo ""
echo "🌐 Frontend URL: https://banhannah.vercel.app"
echo "🔗 Backend URL: https://api.banhannah.dpdns.org"