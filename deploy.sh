#!/bin/bash

# Pulse Deployment Script
# This script deploys Pulse to Render.com

set -e

echo "🚀 Starting Pulse Deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Running git init..."
    git init
fi

# Add all changes
echo "📝 Staging changes..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "feat: Complete Phase 1-3 improvements with design system, skeleton loaders, uptime heatmap, and performance charts"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "🎯 Next Steps:"
echo "1. Go to https://render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Select your repository"
echo "4. Use these settings:"
echo "   - Name: pulse-monitor"
echo "   - Build Command: npm install && npx prisma generate && npm run build"
echo "   - Start Command: node dist/src/server.js"
echo "   - Environment: Node"
echo "   - Region: Frankfurt (or closest to you)"
echo "   - Plan: Free (or Starter for always-on)"
echo ""
echo "5. Add Environment Variables:"
echo "   - DATABASE_URL (from Render PostgreSQL add-on)"
echo "   - DASHBOARD_PASSWORD (your chosen password)"
echo "   - SESSION_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
echo "   - PUBLIC_BASE_URL (will be your Render URL after deploy)"
echo "   - GEMINI_API_KEY (optional, for AI diagnosis)"
echo ""
echo "6. Click 'Create Web Service'"
echo "7. Wait 2-3 minutes for deployment"
echo "8. Access your app at: https://pulse-monitor.onrender.com"
echo ""
echo "📊 Your app will be available at:"
echo "   - Admin: https://pulse-monitor.onrender.com"
echo "   - Public Status: https://pulse-monitor.onrender.com/status"
echo "   - Health: https://pulse-monitor.onrender.com/health"
echo ""
echo "✨ Deployment complete!"
