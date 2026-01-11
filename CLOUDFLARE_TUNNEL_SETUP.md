# Cloudflare Tunnel Setup for HTTPS Backend

This guide sets up Cloudflare Tunnel to provide proper HTTPS for your backend without needing ports 80/443.

## Prerequisites

- Cloudflare account (free)
- Domain managed by Cloudflare (or you can use the free tunnel subdomain)

## Step 1: Stop Caddy (if running)

```bash
sudo systemctl stop caddy
sudo systemctl disable caddy
```

## Step 2: Install cloudflared on Raspberry Pi

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
# If you get dependency errors:
sudo apt-get install -f
```

If you're on a 32-bit Raspberry Pi (older models), use:

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm -o cloudflared.deb
sudo dpkg -i cloudflared.deb
sudo apt-get install -f
```

## Step 3: Quick Start (No Authentication Needed)

**Skip authentication for now - use the temporary tunnel URL method:**

```bash
cloudflared tunnel --url http://localhost:3001
```

This will give you a URL like `https://abc-def-ghi-123.trycloudflare.com` - use this as your backend URL!

**Note:** This URL changes each time you restart the tunnel, but it works immediately without authentication. See Step 7 for setting it up as a service.

**OR - For Permanent Tunnel (Requires Authentication):**

You need to authenticate first. Create a Cloudflare account (free) at https://dash.cloudflare.com/

Then run:
```bash
cloudflared tunnel login
```

**Important:** When the browser opens, you MUST complete the OAuth flow:
1. Log in to Cloudflare
2. Click "Authorize" (even if no zones are shown)
3. The browser should redirect and show "Success" - then close it

If you can't complete authentication (no zones), use Option A above instead.

## Step 4: Create a Tunnel

```bash
cloudflared tunnel create yewon-backend
```

This creates a tunnel named "yewon-backend". Note the tunnel ID (UUID) from the output.

## Step 5: Configure the Tunnel

Create the config file:

```bash
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Add this content (replace `YOUR_TUNNEL_ID` with the UUID from Step 4):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/hws/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: banhannah.duckdns.org
    service: http://localhost:3001
  - service: http_status:404
```

Save (Ctrl+X, Y, Enter)

**Important:** The `credentials-file` path should match where the tunnel credentials were saved. Usually it's `~/.cloudflared/TUNNEL_ID.json`.

## Step 6: Route DNS (if using your own domain)

If you want to use your Cloudflare-managed domain instead of DuckDNS:

In Cloudflare Dashboard:
1. Go to your domain → DNS → Records
2. Add a CNAME record:
   - Name: `api` (or `backend`, or whatever you want)
   - Target: `YOUR_TUNNEL_ID.cfargotunnel.com`
   - Proxy status: Proxied (orange cloud)

Then update the config.yml `hostname` to match (e.g., `api.yourdomain.com`).

**OR** use the free tunnel subdomain (no DNS setup needed - see Step 7).

## Step 7: Set Up Tunnel as Service (Temporary URL - No Auth Needed)

For the temporary URL approach (no authentication required), set it up as a service:

1. **Test the tunnel first:**
```bash
cloudflared tunnel --url http://localhost:3001
```

Note the URL it gives you (e.g., `https://abc-def-ghi.trycloudflare.com`). Press Ctrl+C to stop.

2. **Create systemd service:**
```bash
sudo nano /etc/systemd/system/cloudflared-tunnel.service
```

Add this content:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/cloudflared tunnel --url http://localhost:3001
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

**Note:** Find the cloudflared path with: `which cloudflared` (might be `/usr/bin/cloudflared` or `/usr/local/bin/cloudflared`)

3. **Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-tunnel
sudo systemctl start cloudflared-tunnel
sudo systemctl status cloudflared-tunnel
```

4. **Check the logs to get your URL:**
```bash
sudo journalctl -u cloudflared-tunnel -n 20
```

Look for a line like: `https://abc-def-ghi.trycloudflare.com`

**Note:** This URL will change if the service restarts, but it will work for your backend!

## Step 7B: Create Persistent Tunnel (Requires Authentication)

For a permanent tunnel that won't expire, create a named tunnel:

1. **Create the tunnel:**
```bash
cloudflared tunnel create yewon-backend
```

You'll see output with a tunnel ID (UUID). Save this ID.

2. **Get your tunnel ID (if you need it later):**
```bash
cloudflared tunnel list
```

3. **Authenticate with Cloudflare (required for persistent tunnels):**

You need a Cloudflare account (free). Go to https://dash.cloudflare.com/ and sign up if needed.

Then run:
```bash
cloudflared tunnel login
```

**Important:** Even though DuckDNS domains can't be added to Cloudflare, you can still authenticate. When the browser opens:
- If you see zones: Select any zone (or just close the browser - authentication will still work)
- If you see no zones: Just close the browser - the authentication will still complete

The authentication is just to link your Cloudflare account to the tunnel.

4. **Set up a public hostname (persistent URL):**

For a persistent URL, you can use Cloudflare's free subdomain format. First, configure the tunnel:

```bash
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Add this content (replace `YOUR_TUNNEL_ID` with the UUID from step 1):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/hws/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: yewon-backend-$(hostname).trycloudflare.com
    service: http://localhost:3001
  - service: http_status:404
```

**OR** set up a public hostname via command (simpler):

```bash
cloudflared tunnel route dns yewon-backend yewon-backend.trycloudflare.com
```

However, the `.trycloudflare.com` subdomain is meant for temporary use. For a truly permanent solution, you'll need to either:
- Use your own domain (add it to Cloudflare), OR
- The tunnel will be persistent, but you'll configure it with a config file (see Step 8)

## Step 8: Configure Persistent Tunnel

1. **Create config file:**
```bash
sudo nano /etc/cloudflared/config.yml
```

Add this content (replace `YOUR_TUNNEL_ID` with your actual tunnel ID):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/hws/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - service: http://localhost:3001
```

Save (Ctrl+X, Y, Enter)

**Note:** For a truly persistent custom domain, you'd need to add a hostname here and set up DNS. For now, this will work with Cloudflare's automatic routing.

2. **Set up public hostname (persistent URL):**

For a persistent URL, you can use Cloudflare Zero Trust (free):

```bash
# This will prompt you to authenticate if you haven't already
cloudflared tunnel route dns yewon-backend api.yourdomain.com
```

But since you're using DuckDNS, the easiest approach is to set up the tunnel service and use the tunnel ID URL pattern, OR use Cloudflare's dashboard to create a persistent hostname.

**Simpler approach - Install as service first:**

```bash
sudo cloudflared service install
```

This uses the config file at `/etc/cloudflared/config.yml`.

3. **Start the service:**
```bash
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
sudo systemctl status cloudflared
```

4. **Get your persistent tunnel URL:**

The tunnel will be accessible via: `https://YOUR_TUNNEL_ID.cfargotunnel.com`

You can also check in Cloudflare Dashboard: Zero Trust → Networks → Tunnels → yewon-backend → Configure

**Alternative: Set up via Cloudflare Dashboard (Recommended for persistent URL)**

1. Go to https://one.dash.cloudflare.com/
2. Zero Trust → Networks → Tunnels
3. Click on your tunnel (yewon-backend)
4. Click "Configure" → "Public Hostnames"
5. Add a hostname (you can use any subdomain pattern, or use the tunnel ID URL)

The tunnel itself is permanent - it won't expire. The URL depends on how you configure it.

## Step 10: Update Router Port Forwarding

You can now remove port forwarding for 8443. The tunnel doesn't need it!

(Optional: You can also remove port 3001 forwarding if you want, since Cloudflare Tunnel handles the connection)

## Step 11: Update Netlify Environment Variable

In Netlify dashboard:
- Key: `VITE_API_URL`
- Value: Your tunnel URL (e.g., `https://YOUR_TUNNEL_ID.cfargotunnel.com` or the hostname you configured)

(No port number needed - Cloudflare handles HTTPS on standard port 443)

**To find your tunnel URL:**
- Check Cloudflare Dashboard: Zero Trust → Networks → Tunnels → yewon-backend
- Or use: `https://YOUR_TUNNEL_ID.cfargotunnel.com` (replace with your actual tunnel ID)

## Step 12: Update Backend server.js

On Raspberry Pi:

```bash
cd ~/banhannah/backend
nano server.js
```

Update line 65 to use HTTPS without port:

```javascript
const serverUrl = process.env.SERVER_URL || `https://banhannah.duckdns.org`;
```

Save and restart:
```bash
pm2 restart yewon-backend
```

## Step 13: Update CORS in backend server.js

Make sure CORS includes your Cloudflare domain. If using DuckDNS, keep it as is. If using a Cloudflare domain, add it:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://banhannah.netlify.app',
    'https://banhannah.duckdns.org', // Add if using DuckDNS
    // 'https://api.yourdomain.com', // Add if using Cloudflare domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## Step 14: Test

1. Visit: `https://banhannah.duckdns.org/api/health`
   - Should return JSON response
   - Should have a valid SSL certificate (no warnings!)

2. Test file upload from Netlify frontend

## Troubleshooting

- Check tunnel logs: `sudo journalctl -u cloudflared -f`
- Test tunnel manually: `sudo cloudflared tunnel --config /etc/cloudflared/config.yml run yewon-backend`
- Verify DNS (if using your own domain): `dig banhannah.duckdns.org` or check Cloudflare dashboard
- Check tunnel status: `cloudflared tunnel list`
