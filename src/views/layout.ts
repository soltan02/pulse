const STYLES = `
:root {
  --bg: #f7f7f8;
  --card: #ffffff;
  --border: rgba(0,0,0,0.5);
  --text: #1a1a1a;
  --text-muted: #6b7280;
  --up: #16a34a;
  --degraded: #d97706;
  --down: #dc2626;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
}
a { color: inherit; }
header.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--card);
  border-bottom: 0.5px solid var(--border);
}
header.top .brand { font-weight: 700; font-size: 18px; text-decoration: none; }
header.top nav { display: flex; gap: 20px; align-items: center; }
header.top nav a { text-decoration: none; font-size: 14px; color: var(--text-muted); }
header.top nav a:hover { color: var(--text); }
main { max-width: 1100px; margin: 0 auto; padding: 24px; }
.card {
  background: var(--card);
  border: 0.5px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { font-size: 28px; font-weight: 700; margin-top: 6px; }
.site-card { margin-bottom: 16px; }
.site-card.incident { border-color: var(--down); border-width: 1px; }
.site-card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.site-card-header h3 { margin: 0; font-size: 16px; }
.site-card-header a { font-size: 13px; color: var(--text-muted); text-decoration: none; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.tile { border: 0.5px solid var(--border); border-radius: 8px; padding: 10px 12px; }
.tile-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.tile-meta { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.tile-error { font-family: "SF Mono", Consolas, monospace; font-size: 12px; color: var(--down); margin-top: 6px; word-break: break-all; }
.status-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.status-dot.UP { background: var(--up); }
.status-dot.DEGRADED { background: var(--degraded); }
.status-dot.DOWN { background: var(--down); }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { text-align: left; padding: 10px 8px; border-bottom: 0.5px solid var(--border); }
th { color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.badge.open { background: #fee2e2; color: var(--down); }
.badge.resolved { background: #dcfce7; color: var(--up); }
.mono { font-family: "SF Mono", Consolas, monospace; }
.ai-diagnosis { font-size: 13px; color: var(--text-muted); padding: 10px 4px; line-height: 1.5; white-space: pre-wrap; }
.ai-diagnosis strong { color: var(--text); }
form.stacked { display: flex; flex-direction: column; gap: 12px; max-width: 420px; }
form.stacked label { font-size: 13px; font-weight: 600; }
form.stacked input { padding: 8px 10px; border: 0.5px solid var(--border); border-radius: 6px; font-size: 14px; }
button, .btn {
  padding: 8px 14px; border-radius: 6px; border: 0.5px solid var(--border);
  background: var(--text); color: #fff; font-size: 14px; cursor: pointer;
  text-decoration: none; display: inline-block;
}
button.secondary, .btn.secondary { background: var(--card); color: var(--text); }
button.danger { background: var(--down); border-color: var(--down); }
.row { display: flex; gap: 8px; align-items: center; }
.empty { color: var(--text-muted); padding: 24px; text-align: center; }
.login-wrap { display: flex; align-items: center; justify-content: center; min-height: 90vh; }
.sparkline { display: block; }
`;

export function layout(title: string, bodyHtml: string, opts: { authed: boolean } = { authed: true }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — Pulse</title>
<style>${STYLES}</style>
</head>
<body>
${opts.authed
      ? `<header class="top">
  <a class="brand" href="/">Pulse</a>
  <nav>
    <a href="/">Overview</a>
    <a href="/incidents">Incidents</a>
    <a href="/settings">Settings</a>
    <a href="/logout">Logout</a>
  </nav>
</header>`
      : ""
    }
<main>
${bodyHtml}
</main>
</body>
</html>`;
}
