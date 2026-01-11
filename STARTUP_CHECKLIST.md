# Startup Checklist - After Raspberry Pi Restart

This guide shows what you need to do after restarting your Raspberry Pi to get your site working again.

## What Needs to Run

1. **Backend Server (Node.js/Express)** - Port 3001
2. **Ngrok Tunnel** - Exposes backend via HTTPS

## Quick Check (After Restart)

Run these commands to check if everything is running:

```bash
# Check if backend is running
pm2 status

# Check if ngrok is running
sudo systemctl status ngrok

# Check if backend is accessible locally
curl http://localhost:3001/api/health
```

## If Services Are NOT Running

### 1. Start Backend Server

```bash
cd ~/banhannah/backend
pm2 start server.js --name yewon-backend
pm2 save  # Save PM2 process list (only needed once)
```

### 2. Start Ngrok Tunnel

```bash
sudo systemctl start ngrok
sudo systemctl enable ngrok  # Enable auto-start (only needed once)
```

## Ensure Auto-Start (One-Time Setup)

If services don't auto-start on reboot, set them up:

### Backend (PM2) - Should auto-start by default

```bash
# Make sure PM2 auto-starts on boot (run once)
pm2 startup
# Follow the command it outputs (usually involves sudo)

# Save current process list
pm2 save
```

### Ngrok (Systemd Service) - Should auto-start if enabled

```bash
# Enable ngrok to start on boot (run once)
sudo systemctl enable ngrok

# Verify it's enabled
sudo systemctl is-enabled ngrok
# Should output: enabled
```

## Full Startup Sequence (If Everything is Stopped)

```bash
# 1. Navigate to backend directory
cd ~/banhannah/backend

# 2. Start backend with PM2
pm2 start server.js --name yewon-backend
pm2 save

# 3. Start ngrok
sudo systemctl start ngrok

# 4. Verify everything is running
pm2 status
sudo systemctl status ngrok
```

## Verify Everything Works

1. **Check backend locally:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","message":"Backend server is running",...}`

2. **Check ngrok tunnel:**
   ```bash
   sudo journalctl -u ngrok -n 20 | grep "started tunnel"
   ```
   Or visit: `http://localhost:4040` (ngrok web interface)

3. **Test from Netlify:**
   - Visit your Netlify site
   - Try uploading a file in the admin panel
   - Should work if everything is running!

## Troubleshooting

### Backend not running?
```bash
pm2 logs yewon-backend  # Check logs
pm2 restart yewon-backend  # Restart
```

### Ngrok not running?
```bash
sudo journalctl -u ngrok -f  # Check logs
sudo systemctl restart ngrok  # Restart
```

### Check if ports are in use:
```bash
sudo netstat -tulpn | grep :3001  # Backend port
sudo netstat -tulpn | grep :4040  # Ngrok web interface
```

## Notes

- **PM2**: Once `pm2 startup` and `pm2 save` are run, PM2 will auto-start on boot
- **Ngrok**: Once `systemctl enable ngrok` is run, ngrok will auto-start on boot
- **Ngrok URL**: Should remain the same if using a static domain (free tier), or check logs for dynamic URL
- **No port forwarding needed**: Ngrok handles the connection, so router settings aren't needed

## Quick Reference

**Check status:**
- Backend: `pm2 status`
- Ngrok: `sudo systemctl status ngrok`

**Start if stopped:**
- Backend: `pm2 start yewon-backend`
- Ngrok: `sudo systemctl start ngrok`

**View logs:**
- Backend: `pm2 logs yewon-backend`
- Ngrok: `sudo journalctl -u ngrok -f`
