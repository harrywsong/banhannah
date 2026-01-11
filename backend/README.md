# Yewon Backend Server

Backend API server for file upload/download functionality.

## Setup on Raspberry Pi

### 1. Install Node.js (if not already installed)

```bash
# Check if Node.js is installed
node --version

# If not installed, install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables (Optional)

Create a `.env` file:

```env
PORT=3001
HOST=0.0.0.0
SERVER_URL=http://your-raspberry-pi-ip:3001
# Or if you have a domain:
# SERVER_URL=https://yourdomain.com
```

### 4. Start the Server

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

### 5. Make Server Accessible

#### Option A: Local Network Only
- Server runs on `http://YOUR_RASPBERRY_PI_IP:3001`
- Update CORS origins in `server.js` to include your frontend URL
- Frontend calls `http://YOUR_RASPBERRY_PI_IP:3001/api/...`

#### Option B: Internet Access (Recommended)
1. **Set up port forwarding on your router:**
   - Forward external port (e.g., 3001) to Raspberry Pi port 3001
   - Or use a reverse proxy (nginx) on port 80/443

2. **Use Dynamic DNS (e.g., DuckDNS, No-IP):**
   - Get a free domain like `yourname.duckdns.org`
   - Update `SERVER_URL` to use this domain

3. **Use HTTPS (Recommended):**
   - Set up nginx reverse proxy with SSL (Let's Encrypt)
   - Update `SERVER_URL` to `https://yourdomain.com`

### 6. Firewall Configuration

```bash
# Allow port 3001 (or your chosen port)
sudo ufw allow 3001/tcp
sudo ufw enable
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/files/upload` - Upload a file
- `GET /api/files/download/:filename` - Download a file
- `GET /api/files` - List all files (optional)
- `DELETE /api/files/:filename` - Delete a file (optional)

## Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Upload file
curl -X POST -F "file=@test.pdf" http://localhost:3001/api/files/upload
```

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
sudo npm install -g pm2

# Start server with PM2
pm2 start server.js --name yewon-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using systemd

Create `/etc/systemd/system/yewon-backend.service`:

```ini
[Unit]
Description=Yewon Backend Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/yewonwebsite/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable yewon-backend
sudo systemctl start yewon-backend
```
