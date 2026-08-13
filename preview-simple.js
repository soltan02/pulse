const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', preview: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Pulse Preview Server Running!`);
  console.log(`\n📱 Open these URLs in your browser:`);
  console.log(`   Admin Dashboard: http://localhost:${PORT}/`);
  console.log(`   Public Status:   http://localhost:${PORT}/status`);
  console.log(`   Health Check:    http://localhost:${PORT}/health`);
  console.log(`\n⚠️  Note: This is a static preview without backend functionality.`);
  console.log(`   For full features (monitoring, alerts, database), deploy to Render.`);
  console.log(`\n💡 To test the UI, just open http://localhost:${PORT}/ in your browser!`);
});
