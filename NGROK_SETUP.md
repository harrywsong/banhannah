# Ngrok Setup for HTTPS Backend

This guide sets up ngrok to provide permanent HTTPS for your backend.

## Prerequisites

- Ngrok account (free) - you already have this!
- Your ngrok auth token (get from https://dashboard.ngrok.com/get-started/your-authtoken)

## Step 1: Stop Caddy (if running)

```bash
sudo systemctl stop caddy
sudo systemctl disable caddy
```

## Step 2: Install ngrok on Raspberry Pi

```bash
# Download ngrok for ARM (works on Raspberry Pi)
curl -L https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm.tgz -o ngrok.tgz

# Extract
tar xvzf ngrok.tgz

# Move to a system location
sudo mv ngrok /usr/local/bin/

# Make it executable
sudo chmod +x /usr/local/bin/ngrok

# Verify installation
ngrok version
```

## Step 3: Get Your Auth Token

1. Go to https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your auth token (it looks like: `2abc123def456ghi789jkl012mno345pq_6rSTUVwxyz7ABCD8EFGH`)

## Step 4: Authenticate ngrok

On your Raspberry Pi:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

Replace `YOUR_AUTH_TOKEN` with the token from Step 3.

## Step 5: Test the Tunnel

```bash
ngrok http 3001
```

You should see output with:
- Forwarding URL: `https://abc123def456.ngrok-free.app` (this is your permanent URL!)
- Web Interface: `http://127.0.0.1:4040`

**Note the URL** - this is your permanent backend URL! It won't change.

Press Ctrl+C to stop.

## Step 6: Set Up Permanent Tunnel (Free Tier)

With a free ngrok account, you get one free permanent URL. To use it:

1. **Get your domain** (free tier gives you one):
   - Go to https://dashboard.ngrok.com/cloud-edge/domains
   - You should see a free domain like `abc123.ngrok-free.app` or similar
   - Note this domain

2. **Start tunnel with your domain:**
```bash
ngrok http 3001 --domain=YOUR_DOMAIN.ngrok-free.app
```

Replace `YOUR_DOMAIN.ngrok-free.app` with your actual domain from step 1.

You should see it forwarding. Press Ctrl+C to stop.

## Step 7: Set Up ngrok as a Service

Create a systemd service so ngrok runs automatically:

```bash
sudo nano /etc/systemd/system/ngrok.service
```

Add this content (replace `YOUR_DOMAIN.ngrok-free.app` with your actual domain):

```ini
[Unit]
Description=Ngrok Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/ngrok http 3001 --domain=YOUR_DOMAIN.ngrok-free.app
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

**Alternative (if you don't have a free domain yet, use dynamic URL):**

```ini
[Unit]
Description=Ngrok Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/ngrok http 3001
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Save (Ctrl+X, Y, Enter)

## Step 8: Enable and Start the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable ngrok
sudo systemctl start ngrok
sudo systemctl status ngrok
```

## Step 9: Get Your Tunnel URL

**If using permanent domain:**
- Your URL is: `https://YOUR_DOMAIN.ngrok-free.app` (from Step 6)

**If using dynamic URL:**
```bash
# Check logs to get the URL
sudo journalctl -u ngrok -n 30 | grep "started tunnel"
# Or visit: http://localhost:4040 in a browser to see the ngrok web interface
```

## Step 10: Update Netlify Environment Variable

In Netlify dashboard:
- Key: `VITE_API_URL`
- Value: Your ngrok URL (e.g., `https://YOUR_DOMAIN.ngrok-free.app`)

(No port number needed - ngrok handles HTTPS on standard port 443)

## Step 11: Update Backend server.js

On Raspberry Pi:

```bash
cd ~/banhannah/backend
nano server.js
```

Update line 65 to use your ngrok URL:

```javascript
const serverUrl = process.env.SERVER_URL || `https://YOUR_DOMAIN.ngrok-free.app`;
```

Save and restart:
```bash
pm2 restart yewon-backend
```

## Step 12: Update CORS in backend server.js

Add your ngrok URL to CORS:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://banhannah.netlify.app',
    'https://YOUR_DOMAIN.ngrok-free.app', // Add your ngrok URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

Save and restart:
```bash
pm2 restart yewon-backend
```

## Step 13: Test

1. Visit: `https://YOUR_DOMAIN.ngrok-free.app/api/health`
   - Should return JSON response
   - Should have a valid SSL certificate (no warnings!)

2. Test file upload from Netlify frontend

## Troubleshooting

- Check ngrok logs: `sudo journalctl -u ngrok -f`
- Check ngrok web interface: `http://localhost:4040` (if tunnel is running)
- Verify tunnel is running: `sudo systemctl status ngrok`
- Test manually: `ngrok http 3001` (to see if it works outside of service)

## Notes

- Free tier: 1 static domain, unlimited dynamic URLs
- The static domain is permanent and won't change
- ngrok handles HTTPS automatically with valid certificates
- No authentication needed for the tunnel (unlike Cloudflare)
