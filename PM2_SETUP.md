# PM2 Setup Guide for Backend Server

This guide shows how to set up your backend server with PM2 so it runs automatically and restarts if it crashes.

## What is PM2?

PM2 is a process manager for Node.js applications. It:
- Keeps your app running in the background
- Automatically restarts if it crashes
- Auto-starts on system reboot
- Provides logs and monitoring

## Step 1: Install PM2

On your Raspberry Pi:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 2: Navigate to Backend Directory

```bash
cd ~/banhannah/backend
```

## Step 3: Start Backend with PM2

```bash
# Start the server with PM2
pm2 start server.js --name yewon-backend

# You should see output like:
# ┌─────┬─────────────────┬─────────────┬─────────┬─────────┬──────────┐
# │ id  │ name            │ mode        │ ↺       │ status  │ cpu      │
# ├─────┼─────────────────┼─────────────┼─────────┼─────────┼──────────┤
# │ 0   │ yewon-backend   │ fork        │ 0       │ online  │ 0%       │
# └─────┴─────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

## Step 4: Save PM2 Process List

```bash
# Save the current process list
pm2 save

# This saves the configuration so PM2 remembers what to start
```

## Step 5: Set Up PM2 to Auto-Start on Boot

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u hws --hp /home/hws

# Copy and run the command it shows you
# Example (your command will be different):
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u hws --hp /home/hws

# After running the command, save again
pm2 save
```

**Important:** Replace `hws` with your actual username if it's different.

## Step 6: Verify Everything is Running

```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs yewon-backend

# Test the backend endpoint
curl http://localhost:3001/api/health
```

You should see:
- PM2 status shows `yewon-backend` as `online`
- Logs show "Backend server running on http://localhost:3001"
- curl returns JSON: `{"status":"ok","message":"Backend server is running",...}`

## Step 7: Verify Auto-Start is Configured

```bash
# Check if startup script was installed
systemctl status pm2-hws.service
# (replace hws with your username)

# Should show: active (exited)
```

## Common PM2 Commands

### View Status
```bash
pm2 status                    # Show all processes
pm2 info yewon-backend       # Detailed info about your app
```

### Manage the Process
```bash
pm2 restart yewon-backend    # Restart the app
pm2 stop yewon-backend       # Stop the app
pm2 start yewon-backend      # Start the app
pm2 delete yewon-backend     # Remove from PM2 (doesn't delete files)
```

### View Logs
```bash
pm2 logs yewon-backend       # View logs (press Ctrl+C to exit)
pm2 logs yewon-backend --lines 50  # Show last 50 lines
pm2 flush                    # Clear all logs
```

### Monitoring
```bash
pm2 monit                    # Real-time monitoring dashboard
pm2 describe yewon-backend   # Show detailed information
```

## Troubleshooting

### Backend not starting?
```bash
# Check logs for errors
pm2 logs yewon-backend

# Check if Node.js dependencies are installed
cd ~/banhannah/backend
npm install
```

### PM2 not auto-starting on boot?
```bash
# Re-run startup command
pm2 startup

# Make sure you saved the process list
pm2 save

# Check if the systemd service exists
systemctl status pm2-$(whoami).service
```

### Port 3001 already in use?
```bash
# Check what's using port 3001
sudo netstat -tulpn | grep :3001

# Stop PM2 process
pm2 stop yewon-backend

# Kill the process using the port (if needed)
sudo kill -9 <PID>
```

### Want to update the code?
```bash
# After making changes to server.js, restart:
cd ~/banhannah/backend
pm2 restart yewon-backend

# Or reload (zero-downtime restart):
pm2 reload yewon-backend
```

## Quick Reference

**Essential Commands:**
```bash
pm2 start server.js --name yewon-backend  # Start
pm2 save                                   # Save configuration
pm2 startup                                # Enable auto-start
pm2 status                                 # Check status
pm2 logs yewon-backend                     # View logs
pm2 restart yewon-backend                  # Restart
```

## Notes

- PM2 keeps your app running even if you close the SSH session
- If the app crashes, PM2 will automatically restart it
- After running `pm2 startup` and `pm2 save`, the backend will auto-start on reboot
- Logs are persistent and can be viewed anytime with `pm2 logs`
