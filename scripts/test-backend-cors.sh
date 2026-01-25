#!/bin/bash

API_BASE="https://api.banhannah.dpdns.org"
ORIGIN="https://banhannah.vercel.app"

echo "🧪 Testing Backend CORS Configuration"
echo "====================================="
echo ""

echo "1. Testing health endpoint..."
curl -s "$API_BASE/health" | jq '.' 2>/dev/null || curl -s "$API_BASE/health"
echo ""

echo "2. Testing CORS test endpoint..."
curl -s -H "Origin: $ORIGIN" "$API_BASE/api/test-cors" | jq '.' 2>/dev/null || curl -s -H "Origin: $ORIGIN" "$API_BASE/api/test-cors"
echo ""

echo "3. Testing OPTIONS preflight request..."
curl -X OPTIONS -H "Origin: $ORIGIN" -H "Access-Control-Request-Method: GET" -I "$API_BASE/api/test-cors" 2>/dev/null | head -10
echo ""

echo "4. Testing preview image CORS headers..."
curl -I -H "Origin: $ORIGIN" "$API_BASE/api/files/preview/1769304398900_btkeyb_unnamed__2_.jpg" 2>/dev/null | grep -i "access-control"
echo ""

echo "5. Testing preview image OPTIONS..."
curl -X OPTIONS -H "Origin: $ORIGIN" -I "$API_BASE/api/files/preview/test.jpg" 2>/dev/null | head -5
echo ""

echo "✅ Check the responses above:"
echo "  - Health should return JSON with status 'ok'"
echo "  - CORS test should return success message"
echo "  - OPTIONS requests should return 200 OK"
echo "  - Preview requests should have Access-Control-Allow-Origin header"
echo ""

echo "🔧 If any test fails, the backend needs to be restarted with the new code."