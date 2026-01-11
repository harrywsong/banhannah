# Backend Server for Yewon Platform

Express.js server that handles file uploads/downloads. Runs on Raspberry Pi.

## Quick Setup

1. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update CORS in `server.js`:**
   - Replace `https://your-site.netlify.app` with your actual Netlify URL

4. **Start server:**
   ```bash
   npm start
   ```

5. **Production (PM2):**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name yewon-backend
   pm2 save
   pm2 startup
   ```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/files/upload` - Upload a file
- `GET /api/files/download/:filename` - Download a file

## Configuration

- **Port:** 3001 (change via `PORT` environment variable)
- **Upload directory:** `./uploads/`
- **File size limit:** 50MB
