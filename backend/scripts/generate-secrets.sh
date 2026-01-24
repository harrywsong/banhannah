# ============================================
# backend/scripts/generate-secrets.sh
# ============================================
#!/bin/bash

echo "Generating secure secrets..."

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

echo ""
echo "Generated Secrets:"
echo "=================="
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "Copy these to your .env.local file"
echo ""