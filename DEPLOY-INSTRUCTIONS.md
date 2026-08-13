# 🚀 Pulse Deployment Instructions

## ✅ Code Pushed to GitHub
**Repository:** https://github.com/soltan02/pulse  
**Latest Commit:** d5e43de  
**Status:** Ready for deployment!

---

## 🎯 Deploy to Render (Recommended - 5 Minutes)

### Step 1: Go to Render
1. Open: https://render.com
2. Sign in with GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Choose repository: **soltan02/pulse**
3. Click **"Create Web Service"**

### Step 3: Configure Service
Settings are auto-detected from `render.yaml`:

| Setting | Value |
|---------|-------|
| **Name** | pulse |
| **Region** | Frankfurt |
| **Plan** | Free |
| **Build** | `npm install && npx prisma generate && npm run build` |
| **Start** | `node dist/src/server.js` |
| **Health** | `/health` |

### Step 4: Add Environment Variables
Add these in Render dashboard:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
DASHBOARD_PASSWORD=your_secure_password
SESSION_SECRET=generate_with_node_crypto
PUBLIC_BASE_URL=https://pulse-xxx.onrender.com
GEMINI_API_KEY=your_gemini_key
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_CHAT_ID=your_chat_id
```

**Get DATABASE_URL:**
1. In Render, click blue "+" → "PostgreSQL"
2. Create database
3. Copy connection string

**Generate SESSION_SECRET:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 2-3 minutes
3. Access your app!

### Step 6: URLs
- **Admin:** https://pulse-xxx.onrender.com
- **Status:** https://pulse-xxx.onrender.com/status
- **Health:** https://pulse-xxx.onrender.com/health

---

## 🐳 Docker Deployment

### Local Testing
```powershell
cd D:\Projects\pulse
docker-compose up -d --build
# Access: http://localhost:3000
```

### Production
```powershell
git clone https://github.com/soltan02/pulse.git
cd pulse
docker-compose up -d --build
```

---

## 🧪 Test Your Deployment

### Checklist
- [ ] Login with your password
- [ ] View overview page
- [ ] Check skeleton loaders
- [ ] View site cards
- [ ] Check incidents page
- [ ] View uptime heatmap
- [ ] Check performance charts
- [ ] Test settings page
- [ ] Add test site
- [ ] Check public status page

### Health Check
```bash
curl https://your-app.onrender.com/health
```

Expected:
```json
{"status":"ok","db":"ok"}
```

---

## 🔧 Troubleshooting

### Build Fails
- Check Render logs
- Verify DATABASE_URL format
- Ensure all env vars are set

### Database Error
- Create PostgreSQL in Render
- Copy connection string
- Add as DATABASE_URL

### 502 Error
- Wait 2-3 minutes for cold start
- Check /health endpoint
- Verify DB connection

---

## 🎉 You're Done!

Your Pulse app is live with:
- ✅ Skeleton loaders
- ✅ Uptime heatmap
- ✅ Performance charts
- ✅ Incident timeline
- ✅ Error boundaries
- ✅ Accessibility features

**Next:** Add websites to monitor!

---

## 📚 More Docs
- `QUICKSTART.md` - Quick start
- `DEPLOY.md` - Detailed guide
- `PHASE2-3-SUMMARY.md` - What was built
- `CLAUDE.md` - AI guidelines
- `DESIGN.md` - Design system
