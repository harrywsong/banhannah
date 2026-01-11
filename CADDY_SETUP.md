# Caddy Setup for HTTPS Backend

## Step 1: Install Caddy on Raspberry Pi

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

## Step 2: Create Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

Add this content (replace with your DuckDNS domain and email):

```
banhannah.duckdns.org {
    reverse_proxy localhost:3001
    tls your-email@example.com
}
```

Save: Ctrl+X, Y, Enter

## Step 3: Start Caddy

```bash
sudo systemctl start caddy
sudo systemctl enable caddy
sudo systemctl status caddy
```

## Step 4: Update Firewall (if using UFW)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Step 5: Update Router Port Forwarding

Update your router:
- Port 80 → Raspberry Pi IP:80
- Port 443 → Raspberry Pi IP:443

(You can remove the 3001 port forwarding once Caddy is working)

## Step 6: Update Netlify Environment Variable

In Netlify, update `VITE_API_URL` to:
```
https://banhannah.duckdns.org
```

(Note: HTTPS, no port number - Caddy handles it)

## Step 7: Update Backend server.js

Update the serverUrl in your backend (on Raspberry Pi):

```javascript
const serverUrl = process.env.SERVER_URL || `https://banhannah.duckdns.org`;
```

## Step 8: Restart Backend

```bash
pm2 restart yewon-backend
```

## Step 9: Test

Visit: https://banhannah.duckdns.org/api/health

Should return JSON response.

Then test file upload from Netlify frontend.
