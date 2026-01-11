# Yewon Educational Platform

A modern, feature-rich educational platform built with React, Vite, and Tailwind CSS.

## Setup Instructions

### Frontend (Netlify)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Set Environment Variables:**
   - Go to Site settings → Environment variables
   - Add: `VITE_API_URL` = `http://YOUR_RASPBERRY_PI_IP:3001`
     - Or if using domain: `VITE_API_URL` = `https://yourdomain.com`
   - Add: `SECRETS_SCAN_OMIT_KEYS` = `VITE_API_URL` (prevents build error - this URL is meant to be public)
   - Trigger a new deploy (Deploys → Trigger deploy → Deploy site)

4. **Update CORS in backend** (see Backend section below)

### Backend (Raspberry Pi)

1. **Transfer backend folder to Raspberry Pi:**
   ```bash
   # On your computer
   scp -r backend/ pi@YOUR_RASPBERRY_PI_IP:/home/pi/yewonwebsite/
   ```

2. **SSH into Raspberry Pi:**
   ```bash
   ssh pi@YOUR_RASPBERRY_PI_IP
   ```

3. **Install Node.js (if needed):**
   ```bash
   node --version
   # If not installed:
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install dependencies:**
   ```bash
   cd /home/pi/yewonwebsite/backend
   npm install
   ```

5. **Configure CORS:**
   Edit `backend/server.js` and update the `corsOptions.origin` array:
   ```javascript
   const corsOptions = {
     origin: [
       'http://localhost:5173', // Dev
       'https://your-site.netlify.app', // Replace with your Netlify URL
     ],
     // ... rest of config
   };
   ```

6. **Start the server:**
   ```bash
   # Test run
   npm start
   
   # Production (using PM2)
   sudo npm install -g pm2
   pm2 start server.js --name yewon-backend
   pm2 save
   pm2 startup
   ```

7. **Configure firewall:**
   ```bash
   sudo ufw allow 3001/tcp
   sudo ufw enable
   ```

### Making Backend Accessible from Internet

**Option 1: Local Network Only (Simplest)**
- Use Raspberry Pi's local IP (e.g., `192.168.1.100:3001`)
- Frontend must be accessed from same network
- Set `VITE_API_URL=http://YOUR_RASPBERRY_PI_IP:3001` in Netlify

**Option 2: Dynamic DNS (Recommended)**
1. Get free domain from [duckdns.org](https://duckdns.org)
2. Set up DuckDNS script on Raspberry Pi to update IP
3. Configure router port forwarding: external port 3001 → Raspberry Pi port 3001
4. Set `VITE_API_URL=http://yourname.duckdns.org:3001` in Netlify

**Option 3: Domain with HTTPS (Most Professional)**
1. Get a domain
2. Install nginx on Raspberry Pi
3. Set up reverse proxy and SSL with Let's Encrypt
4. Set `VITE_API_URL=https://yourdomain.com` in Netlify

### Testing

1. **Test backend:**
   ```bash
   curl http://YOUR_RASPBERRY_PI_IP:3001/api/health
   ```

2. **Test frontend:**
   - Visit your Netlify URL
   - Try uploading a file in the admin panel
   - Check browser console for errors

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
├── backend/          # Backend server (runs on Raspberry Pi)
│   ├── server.js     # Express server
│   ├── uploads/      # File storage directory
│   └── package.json
├── src/
│   ├── config/       # API configuration
│   ├── components/   # React components
│   ├── contexts/     # React contexts
│   └── pages/        # Page components
└── dist/             # Build output (deployed to Netlify)
```

## Features

- 🎨 Modern, Responsive UI
- 📚 Resource Library with file upload/download
- 💰 Free & Paid Resources
- 📊 Student Dashboard
- 🔍 Advanced Search & Filtering
- 🎥 Live Classes
- 👨‍💼 Admin Panel
- 🔐 User Authentication
- 📱 Mobile-First Design

## Troubleshooting

**CORS Errors:**
- Make sure your Netlify URL is in `corsOptions.origin` in `backend/server.js`
- Restart backend server after changes

**Cannot Connect to Backend:**
- Check firewall: `sudo ufw allow 3001/tcp`
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check API URL in Netlify environment variables

**File Upload Fails:**
- Check backend logs
- Verify uploads directory has write permissions
- Check file size limits (default: 50MB)
