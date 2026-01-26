#!/bin/bash
# ============================================
# Debug Server Issues
# ============================================

echo "🔍 Debugging server issues..."

# 1. Check if server is running
echo "📋 Server processes:"
ps aux | grep "node.*server.js"

# 2. Check server logs
echo ""
echo "📄 Recent server logs:"
tail -n 20 logs/combined.log

# 3. Test API endpoints
echo ""
echo "🔗 Testing API endpoints:"

echo "Health check:"
curl -s https://api.banhannah.dpdns.org/api/health | jq '.' 2>/dev/null || curl -s https://api.banhannah.dpdns.org/api/health

echo ""
echo "API info:"
curl -s https://api.banhannah.dpdns.org/api/ | jq '.' 2>/dev/null || curl -s https://api.banhannah.dpdns.org/api/

echo ""
echo "Admin files endpoint:"
curl -s https://api.banhannah.dpdns.org/api/admin/files/all | jq '.' 2>/dev/null || curl -s https://api.banhannah.dpdns.org/api/admin/files/all

# 4. Check environment variables
echo ""
echo "🔧 Environment check:"
if [ -f ".env.production" ]; then
    echo "✅ .env.production exists"
    echo "DATABASE_URL configured: $(grep -q DATABASE_URL .env.production && echo 'Yes' || echo 'No')"
    echo "NODE_ENV: $(grep NODE_ENV .env.production | cut -d'=' -f2)"
else
    echo "❌ .env.production missing"
fi

# 5. Test database connection
echo ""
echo "🗄️  Database connection test:"
export $(grep DATABASE_URL .env.production | xargs)
if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "SELECT COUNT(*) as user_count FROM \"User\";" 2>/dev/null || echo "❌ Database connection failed"
else
    echo "❌ DATABASE_URL not found"
fi