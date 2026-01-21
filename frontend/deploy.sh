#!/bin/bash
# Frontend deployment script

echo "🚀 Building for production..."

# Install dependencies
npm install

# Build
npm run build

# Deploy to Cloudflare Pages (or your hosting)
# wrangler pages publish dist

echo "✅ Build complete! Deploy the 'dist' folder to your hosting."