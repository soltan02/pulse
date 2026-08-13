const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Preview server running at http://localhost:${PORT}`);
  console.log(`📱 Open this URL in your browser to see the Pulse application`);
  console.log(`\nAvailable pages:`);
  console.log(`  - http://localhost:${PORT}/ (Admin Dashboard)`);
  console.log(`  - http://localhost:${PORT}/status (Public Status Page)`);
  console.log(`  - http://localhost:${PORT}/login (Login Page)`);
  console.log(`  - http://localhost:${PORT}/health (Health Check)`);
  console.log(`\nNote: This is a static preview. For full functionality, deploy to Render.`);
});
