#!/bin/bash

echo "🚀 Deploying preview image fixes..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Summary of fixes:${NC}"
echo "  ✅ Fixed frontend preview image URLs to use full API URL"
echo "  ✅ Added comprehensive CORS headers for images"
echo "  ✅ Fixed buildFileUrl to return absolute URLs in production"
echo "  ✅ Updated SERVER_URL to use https://api.banhannah.dpdns.org"
echo "  ✅ Added OPTIONS handler for preflight requests"
echo ""

echo -e "${YELLOW}🔧 Backend deployment (Oracle Cloud):${NC}"
echo "1. SSH to your Oracle Cloud instance"
echo "2. Navigate to your backend directory"
echo "3. Pull the latest changes:"
echo "   git pull origin main"
echo "4. Restart the backend service:"
echo "   pm2 restart all  # or your process manager"
echo ""

echo -e "${YELLOW}🌐 Frontend deployment (Vercel):${NC}"
cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    
    if command -v vercel &> /dev/null; then
        echo "🚀 Deploying to Vercel..."
        vercel --prod
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Deployment successful!${NC}"
            echo ""
            echo -e "${GREEN}🎉 All fixes deployed!${NC}"
            echo "🌐 Frontend: https://banhannah.vercel.app"
            echo "🔗 Backend: https://api.banhannah.dpdns.org"
            echo ""
            echo -e "${YELLOW}🧪 Test the preview images:${NC}"
            echo "  - Visit https://banhannah.vercel.app/courses"
            echo "  - Check if course preview images load correctly"
            echo "  - Visit https://banhannah.vercel.app/files"
            echo "  - Check if file preview images load correctly"
        else
            echo -e "${RED}❌ Vercel deployment failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Vercel CLI not found${NC}"
        echo "Please install it with: npm i -g vercel"
        echo "Or push changes to main branch for automatic deployment"
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Please check the error messages above"
fi

echo ""
echo -e "${YELLOW}🔍 If images still don't load:${NC}"
echo "1. Check browser console for CORS errors"
echo "2. Verify backend is running with updated code"
echo "3. Test preview endpoint directly:"
echo "   curl -I https://api.banhannah.dpdns.org/api/files/preview/[filename]"
echo "4. Check that files exist in backend/storage/previews/"