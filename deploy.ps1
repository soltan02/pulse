# Pulse Deployment Script for Windows
# This script deploys Pulse to Render.com

Write-Host "🚀 Starting Pulse Deployment..." -ForegroundColor Cyan

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git not initialized. Running git init..." -ForegroundColor Red
    git init
}

# Add all changes
Write-Host "📝 Staging changes..." -ForegroundColor Yellow
git add .

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "feat: Complete Phase 1-3 improvements with design system, skeleton loaders, uptime heatmap, and performance charts"

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://render.com"
Write-Host "2. Click 'New +' → 'Web Service'"
Write-Host "3. Select your repository"
Write-Host "4. Use these settings:"
Write-Host "   - Name: pulse-monitor"
Write-Host "   - Build Command: npm install && npx prisma generate && npm run build"
Write-Host "   - Start Command: node dist/src/server.js"
Write-Host "   - Environment: Node"
Write-Host "   - Region: Frankfurt (or closest to you)"
Write-Host "   - Plan: Free (or Starter for always-on)"
Write-Host ""
Write-Host "5. Add Environment Variables:"
Write-Host "   - DATABASE_URL (from Render PostgreSQL add-on)"
Write-Host "   - DASHBOARD_PASSWORD (your chosen password)"
Write-Host "   - SESSION_SECRET (generate with: node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`")"
Write-Host "   - PUBLIC_BASE_URL (will be your Render URL after deploy)"
Write-Host "   - GEMINI_API_KEY (optional, for AI diagnosis)"
Write-Host ""
Write-Host "6. Click 'Create Web Service'"
Write-Host "7. Wait 2-3 minutes for deployment"
Write-Host "8. Access your app at: https://pulse-monitor.onrender.com"
Write-Host ""
Write-Host "📊 Your app will be available at:"
Write-Host "   - Admin: https://pulse-monitor.onrender.com"
Write-Host "   - Public Status: https://pulse-monitor.onrender.com/status"
Write-Host "   - Health: https://pulse-monitor.onrender.com/health"
Write-Host ""
Write-Host "✨ Deployment complete!" -ForegroundColor Green
