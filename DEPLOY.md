# Pulse Deployment Guide

## Quick Deploy to Render (Recommended)

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 2. Deploy from GitHub
```bash
# Push your code
git add .
git commit -m "feat: Add Phase 2-3 improvements"
git push origin main
```

### 3. Render Configuration
- **Service Type:** Web Service
- **Name:** pulse-monitor
- **Region:** Choose closest to your users
- **Branch:** main
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Instance Type:** Free (or paid for production)

### 4. Environment Variables
Add these in Render dashboard:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
DASHBOARD_PASSWORD=your_secure_password
SESSION_SECRET=random_secret_32_chars
GEMINI_API_KEY=your_gemini_key_optional
PUBLIC_BASE_URL=https://your-app.onrender.com
```

### 5. Database Setup
Render provides PostgreSQL:
- Click "New PostgreSQL"
- Copy connection string
- Paste as `DATABASE_URL`
- Run migrations: `npx prisma migrate deploy`

### 6. Deploy
- Click "Create Web Service"
- Wait for build (2-3 minutes)
- Access: `https://pulse-monitor.onrender.com`

---

## Alternative: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd D:\Projects\pulse
vercel

# Follow prompts:
# - Set up and deploy? YES
# - Which scope? (your account)
# - Link to existing project? NO
# - Project name? pulse
# - In which directory is your code? .
# - Want to override settings? NO

# Production deploy
vercel --prod
```

**Note:** Vercel is frontend-only. For full-stack with cron jobs, use Render.

---

## Alternative: Docker Deployment

### Local Testing
```bash
cd D:\Projects\pulse
docker build -t pulse-monitor .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e DASHBOARD_PASSWORD=test123 \
  -e SESSION_SECRET=testsecret12345678901234567890 \
  pulse-monitor
```

### Docker Hub
```bash
# Login
docker login

# Tag and push
docker tag pulse-monitor yourusername/pulse-monitor:latest
docker push yourusername/pulse-monitor:latest

# Run on server
docker pull yourusername/pulse-monitor:latest
docker run -p 3000:3000 -e DATABASE_URL=... pulse-monitor
```

---

## Manual VPS Deployment (Ubuntu)

### 1. SSH into Server
```bash
ssh user@your-server.com
```

### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 3. Clone and Configure
```bash
# Clone repository
git clone https://github.com/yourusername/pulse.git
cd pulse

# Copy environment
cp .env.example .env
nano .env  # Edit configuration
```

### 4. Create docker-compose.yml
```yaml
version: '3.8'
services:
  pulse:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
      - SESSION_SECRET=${SESSION_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=pulse
      - POSTGRES_USER=pulse
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

volumes:
  postgres_data:
```

### 5. Deploy
```bash
# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec pulse npx prisma migrate deploy

# Check logs
docker-compose logs -f pulse
```

### 6. Setup Reverse Proxy (Caddy)
```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Edit `/etc/caddy/Caddyfile`:
```
pulse.yourdomain.com {
    reverse_proxy localhost:3000
}
```

Restart Caddy:
```bash
sudo systemctl restart caddy
```

---

## Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Access admin dashboard: `https://your-domain.com`
- [ ] Login with DASHBOARD_PASSWORD
- [ ] Check overview page loads
- [ ] Verify sites are monitored
- [ ] Check incidents page
- [ ] Test public status page: `/status`

### 2. Configure Monitoring
- [ ] Add your first site in Settings
- [ ] Set check interval (recommended: 60s)
- [ ] Configure health URL if available
- [ ] Add auth token for backend checks
- [ ] Test manual check

### 3. Setup Alerts
- [ ] Configure Telegram bot (optional)
- [ ] Add Slack webhook (optional)
- [ ] Add Discord webhook (optional)
- [ ] Test alert delivery

### 4. Security
- [ ] Change default password
- [ ] Generate strong SESSION_SECRET
- [ ] Enable HTTPS (if using custom domain)
- [ ] Set up firewall rules
- [ ] Regular backups

### 5. Monitoring
- [ ] Monitor Pulse itself (iron!)
- [ ] Set up uptime checks
- [ ] Configure log rotation
- [ ] Set up alerts for failures

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Database Connection Issues
```bash
# Test connection
npx prisma db pull
npx prisma migrate dev
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Memory Issues (Free Tier)
```bash
# Reduce check frequency
# Set checkIntervalSeconds to 120 or 180
```

---

## Support

### Logs
```bash
# Render
render service logs pulse-monitor

# Docker
docker-compose logs -f pulse

# Systemd (if using PM2)
pm2 logs pulse
```

### Health Check
```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "ok"
}
```

---

## Cost Estimation

### Render Free Tier
- ✅ 750 hours/month (enough for 1 full-time service)
- ⚠️ Wakes after 15 min inactivity
- ⚠️ 512MB RAM
- 💰 $0/month

### Render Starter ($7/month)
- ✅ Always on
- ✅ 2GB RAM
- ✅ Better performance
- 💰 $7/month

### VPS (DigitalOcean/Linode)
- ✅ Full control
- ✅ Scalable
- ✅ $4-6/month
- 💰 $4-6/month

### Database
- ✅ Render includes free PostgreSQL
- ✅ Supabase free tier available
- 💰 $0/month (free tiers)

---

## Next Steps After Deployment

1. **Add Sites** - Configure all your monitored websites
2. **Test Alerts** - Verify notification delivery
3. **Monitor** - Watch for incidents in first 24h
4. **Optimize** - Adjust check intervals based on needs
5. **Share** - Publish public status page URL

---

## Need Help?

- Check `README.md` for detailed setup
- Review `CLAUDE.md` for development guidelines
- See `IMPROVEMENTS.md` for future enhancements
- Review `PHASE2-3-SUMMARY.md` for what was added
