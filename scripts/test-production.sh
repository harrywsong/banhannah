#!/bin/bash

echo "🔍 Testing Production Setup"
echo "=========================="
echo ""

# Test frontend
echo "1. Testing Frontend (Vercel):"
echo "   URL: https://banhannah.vercel.app"
curl -I https://banhannah.vercel.app 2>/dev/null | head -5
echo ""

# Test backend API
echo "2. Testing Backend API:"
echo "   Health: https://api.banhannah.dpdns.org/health"
curl -s https://api.banhannah.dpdns.org/health | jq '.' 2>/dev/null || curl -s https://api.banhannah.dpdns.org/health
echo ""

echo "   CORS Test: https://api.banhannah.dpdns.org/api/test-cors"
curl -s -H "Origin: https://banhannah.vercel.app" https://api.banhannah.dpdns.org/api/test-cors | jq '.' 2>/dev/null || curl -s -H "Origin: https://banhannah.vercel.app" https://api.banhannah.dpdns.org/api/test-cors
echo ""

# Test specific API endpoints
echo "3. Testing API Endpoints:"
echo "   Courses: https://api.banhannah.dpdns.org/api/courses"
curl -s -H "Origin: https://banhannah.vercel.app" https://api.banhannah.dpdns.org/api/courses | head -200
echo ""

echo "   Files: https://api.banhannah.dpdns.org/api/files"
curl -s -H "Origin: https://banhannah.vercel.app" https://api.banhannah.dpdns.org/api/files | head -200
echo ""

# Test preview image
echo "4. Testing Preview Image:"
echo "   https://api.banhannah.dpdns.org/api/files/preview/1769304398900_btkeyb_unnamed__2_.jpg"
curl -I -H "Origin: https://banhannah.vercel.app" https://api.banhannah.dpdns.org/api/files/preview/1769304398900_btkeyb_unnamed__2_.jpg 2>/dev/null | head -5
echo ""

echo "✅ Test complete. Check responses above for issues."
echo ""
echo "🔧 Common issues:"
echo "  - 404 errors: Backend routes not working"
echo "  - CORS errors: Check Access-Control-Allow-Origin headers"
echo "  - 502/503 errors: Backend server down or tunnel issues"
echo "  - No response: DNS or network issues"