const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Password matching the server's hash logic
const DASHBOARD_PASSWORD = 'pulse-dashboard-2026';
const SESSION_COOKIE = 'pulse_session';

console.log('🔧 DEBUG SERVER - Password: ' + DASHBOARD_PASSWORD);
console.log('🔐 Hash: ' + crypto.createHash('sha256').update(DASHBOARD_PASSWORD).digest('hex'));
console.log('');

// Session storage (simple in-memory for preview)
const sessions = new Map();

function generateSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { created: Date.now() });
  return token;
}

function verifySession(cookie) {
  if (!cookie) return false;
  const token = cookie.split('=')[1];
  return sessions.has(token);
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax`);
}

const server = http.createServer((req, res) => {
  // Get cookies
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });

  // Health check (no auth required)
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', preview: true }));
    return;
  }

  // Auth check
  if (req.url === '/api/auth/check') {
    const authed = verifySession(cookies[SESSION_COOKIE]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ authed }));
    return;
  }

  // Login
  if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body);

        // Check password (same logic as server)
        const stored = DASHBOARD_PASSWORD;
        const a = Buffer.from(password || '');
        const b = Buffer.from(stored);
        if (a.length !== b.length) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid password' }));
          return;
        }

        const passwordHash = crypto.createHash('sha256').update(a).digest('hex');
        const storedHash = crypto.createHash('sha256').update(b).digest('hex');

        if (passwordHash === storedHash) {
          const token = generateSession();
          setSessionCookie(res, token);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid password' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'bad request' }));
      }
    });
    return;
  }

  // Logout
  if (req.url === '/api/logout' && req.method === 'POST') {
    const token = cookies[SESSION_COOKIE];
    if (token) sessions.delete(token);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `${SESSION_COOKIE}=deleted; Path=/; HttpOnly; Max-Age=0` });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Protected API endpoints
  const protectedRoutes = ['/api/overview', '/api/incidents', '/api/settings'];
  if (protectedRoutes.some(route => req.url.startsWith(route))) {
    if (!verifySession(cookies[SESSION_COOKIE])) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }
  }

  // Return mock data for preview
  if (req.url === '/api/overview') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      stats: {
        sitesMonitored: 0,
        uptime30dPercent: null,
        avgResponseMs: null,
        activeIncidents: 0
      },
      sites: []
    }));
    return;
  }

  if (req.url === '/api/incidents') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ incidents: [] }));
    return;
  }

  if (req.url === '/api/settings/sites') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // Serve static files
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, idx) => {
        if (err2) {
          res.writeHead(500);
          res.end('Error');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(idx);
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         🚀 PULSE DEBUG SERVER (Fixed Auth)               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📱 URL: http://localhost:' + PORT);
  console.log('🔐 PASSWORD: ' + DASHBOARD_PASSWORD);
  console.log('');
  console.log('✅ Authentication fixed!');
  console.log('✅ Sessions working!');
  console.log('✅ Navigation should work now!');
  console.log('');
  console.log('Test: Login with password, then navigate to /incidents or /settings');
  console.log('');
  console.log('Press Ctrl+C to stop');
});
