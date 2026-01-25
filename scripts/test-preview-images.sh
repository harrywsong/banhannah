#!/bin/bash

echo "🧪 Testing preview image endpoints..."

API_BASE="https://api.banhannah.dpdns.org/api"

echo "1. Testing health endpoint..."
curl -s "$API_BASE/../health" | jq '.' || echo "Health check failed"

echo ""
echo "2. Testing CORS headers on preview endpoint..."
curl -I -H "Origin: https://banhannah.vercel.app" "$API_BASE/files/preview/test.jpg" 2>/dev/null | grep -i "access-control"

echo ""
echo "3. Testing OPTIONS request (preflight)..."
curl -X OPTIONS -H "Origin: https://banhannah.vercel.app" -I "$API_BASE/files/preview/test.jpg" 2>/dev/null | head -10

echo ""
echo "4. Listing available preview images..."
echo "Available preview files on backend:"
echo "  - 1769304398900_btkeyb_unnamed__2_.jpg"
echo "  - 1769304897505_wr7zz3_2222.png"

echo ""
echo "5. Testing actual preview image..."
curl -I "$API_BASE/files/preview/1769304398900_btkeyb_unnamed__2_.jpg" 2>/dev/null | head -5

echo ""
echo "✅ Test complete. Check the responses above for any errors."