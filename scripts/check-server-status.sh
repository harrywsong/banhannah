#!/bin/bash

echo "🔍 Checking Server Status on Oracle Cloud"
echo "========================================="
echo ""

echo "Run these commands on your Oracle Cloud instance:"
echo ""

echo "1. Check current directory and git status:"
echo "   pwd"
echo "   git status"
echo "   git log --oneline -5"
echo ""

echo "2. Check what Node.js processes are running:"
echo "   ps aux | grep node"
echo ""

echo "3. Check if PM2 is being used:"
echo "   pm2 list 2>/dev/null || echo 'PM2 not found'"
echo ""

echo "4. Check if systemd service exists:"
echo "   sudo systemctl status banhannah* 2>/dev/null || echo 'No systemd service found'"
echo "   sudo systemctl status node* 2>/dev/null || echo 'No node systemd service found'"
echo ""

echo "5. Check if there's a startup script:"
echo "   ls -la *.sh"
echo "   cat package.json | grep scripts -A 5"
echo ""

echo "6. Check current server response:"
echo "   curl -s https://api.banhannah.dpdns.org/health | jq . || curl -s https://api.banhannah.dpdns.org/health"
echo ""

echo "7. Check server logs:"
echo "   tail -20 app.log 2>/dev/null || tail -20 nohup.out 2>/dev/null || echo 'No log files found'"
echo ""

echo "📝 This will help identify how to restart the server after pulling changes."