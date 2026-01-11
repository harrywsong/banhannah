# Deployment Guide: Frontend (GitHub Pages/Netlify) + Backend (Raspberry Pi)

This guide shows you how to deploy the frontend to GitHub Pages or Netlify while running the backend on your Raspberry Pi.

## Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────┐
│  Frontend           │         │  Backend             │
│  (GitHub Pages/     │────────▶│  (Raspberry Pi)      │
│   Netlify)          │  HTTP   │  Port 3001           │
│  Static Files       │         │  Node.js/Express     │
└─────────────────────┘         └──────────────────────┘
```

The frontend makes API calls to your Raspberry Pi's backend server.

---

## Part 1: Backend Setup on Raspberry Pi

### Step 1: Transfer Backend Code to Raspberry Pi

```bash
# On your computer
scp -r backend/ pi@YOUR_RASPBERRY_PI_IP:/home/pi/yewonwebsite/

# Or use git
# On Raspberry Pi
cd /home/pi
git clone YOUR_REPO_URL
cd yewonwebsite/backend
```

### Step 2: Install Node.js (if needed)

```bash
# Check if Node.js is installed
node --version

# If not, install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Install Dependencies

```bash
cd /home/pi/yewonwebsite/backend
npm install
```

### Step 4: Configure CORS

Edit `backend/server.js` and update the `corsOptions.origin` array with your frontend URLs:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173', // Dev
    'https://your-username.github.io', // GitHub Pages
    'https://your-site.netlify.app', // Netlify
    // Add your production domain here
  ],
  // ...
};
```

### Step 5: Start the Server

```bash
# Test run
npm start

# Or use PM2 for production
sudo npm install -g pm2
pm2 start server.js --name yewon-backend
pm2 save
pm2 startup
```

---

## Part 2: Make Backend Accessible

You have several options:

### Option A: Local Network Only (Simplest)

1. Find your Raspberry Pi's IP address:
```bash
hostname -I
```

2. Update frontend config:
   - Set `VITE_API_URL=http://YOUR_RASPBERRY_PI_IP:3001` in `.env`
   - Or edit `src/config/api.js` and set the production URL

3. Make sure both devices are on the same network

**Pros:** Simple, secure (local only)  
**Cons:** Frontend must be accessed from same network

### Option B: Dynamic DNS (Recommended)

1. **Set up DuckDNS (free):**
   - Go to https://www.duckdns.org/
   - Create account and get a subdomain (e.g., `yourname.duckdns.org`)
   - Install DuckDNS on Raspberry Pi:

```bash
# Install DuckDNS script
mkdir -p duckdns
cd duckdns
echo '#!/bin/bash
echo url="https://www.duckdns.org/update?domains=yourname&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duckdns.log -K -
' > duckdns.sh
chmod 700 duckdns.sh

# Add to crontab (runs every 5 minutes)
crontab -e
# Add: */5 * * * * ~/duckdns/duckdns.sh >/dev/null 2>&1
```

2. **Configure Router Port Forwarding:**
   - Forward external port 3001 → Raspberry Pi port 3001
   - Or use port 80/443 with nginx reverse proxy

3. **Update backend `SERVER_URL`:**
   - In `server.js` or `.env`: `SERVER_URL=http://yourname.duckdns.org:3001`

### Option C: Domain with HTTPS (Most Professional)

1. Get a domain (e.g., from Namecheap, Google Domains)

2. **Set up nginx reverse proxy:**
```bash
# Install nginx
sudo apt update
sudo apt install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/yewon-backend

# Add:
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/yewon-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

3. **Set up SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

4. **Update backend `SERVER_URL`:**
   - `SERVER_URL=https://yourdomain.com`

---

## Part 3: Frontend Configuration

### Step 1: Create Environment Files

Create `.env.production` in the project root:

```env
# .env.production
VITE_API_URL=http://YOUR_RASPBERRY_PI_IP:3001
# Or if using domain:
# VITE_API_URL=https://yourdomain.com
```

### Step 2: Update Frontend Code

The frontend code is already set up to use `src/config/api.js`. Just update the production URL in that file or use the environment variable.

### Step 3: Update AdminPanel File Upload

The file upload handler will need to call your backend API. Update `src/pages/AdminPanel.jsx`:

```javascript
import { apiEndpoint } from '../config/api';

// In the file upload handler:
const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(apiEndpoint('files/upload'), {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      setFileFormData({ ...fileFormData, fileUrl: data.fileUrl });
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('파일 업로드에 실패했습니다.');
  }
};
```

---

## Part 4: Deploy Frontend

### Option A: GitHub Pages

1. **Update `vite.config.js`:**
```javascript
export default {
  base: '/yewonwebsite/', // Your repo name
  // ...
}
```

2. **Install gh-pages:**
```bash
npm install --save-dev gh-pages
```

3. **Add deploy script to `package.json`:**
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

4. **Deploy:**
```bash
npm run deploy
```

5. **Enable GitHub Pages:**
   - Go to repo Settings → Pages
   - Source: `gh-pages` branch
   - Your site: `https://your-username.github.io/yewonwebsite/`

### Option B: Netlify (Easier)

1. **Push code to GitHub**

2. **Connect to Netlify:**
   - Go to https://netlify.com
   - New site from Git
   - Connect GitHub repo
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Add Environment Variable:**
   - Site settings → Environment variables
   - Add: `VITE_API_URL` = `http://YOUR_RASPBERRY_PI_IP:3001`

4. **Deploy!**

---

## Part 5: Testing

1. **Test backend health:**
```bash
curl http://YOUR_RASPBERRY_PI_IP:3001/api/health
```

2. **Test from frontend:**
   - Open browser console
   - Check network tab for API calls
   - Try uploading a file

3. **Check CORS errors:**
   - If you see CORS errors, make sure your frontend URL is in the `corsOptions.origin` array

---

## Troubleshooting

### CORS Errors

**Problem:** `Access-Control-Allow-Origin` error

**Solution:**
- Add your frontend URL to `corsOptions.origin` in `server.js`
- Restart backend server

### Cannot Connect to Backend

**Problem:** Frontend can't reach backend

**Solutions:**
- Check Raspberry Pi firewall: `sudo ufw allow 3001/tcp`
- Check router port forwarding (if using dynamic DNS)
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check backend URL in frontend config

### File Upload Fails

**Problem:** Files not uploading

**Solutions:**
- Check backend logs
- Verify uploads directory exists and has write permissions
- Check file size limits (default: 50MB)

---

## Security Considerations

1. **Use HTTPS in production** (Let's Encrypt is free)
2. **Add authentication** to backend endpoints
3. **Rate limiting** to prevent abuse
4. **File validation** (check file types, sizes)
5. **Regular backups** of uploaded files

---

## Summary

✅ **Backend on Raspberry Pi:**
- Node.js server on port 3001
- Handles file uploads/downloads
- CORS configured for your frontend

✅ **Frontend on GitHub Pages/Netlify:**
- Static files hosted
- Makes API calls to Raspberry Pi
- Environment variable for API URL

✅ **Networking:**
- Local network: Use Raspberry Pi IP
- Internet: Use dynamic DNS or domain
- HTTPS recommended for production

Need help with any step? Let me know!
