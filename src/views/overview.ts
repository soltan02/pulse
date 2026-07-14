import { layout } from "./layout";
import { escapeHtml } from "./escape";
import { OverviewStats, SiteCard, SiteLayerTile } from "../server/data";

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function formatMs(value: number | null): string {
  return value === null ? "—" : `${value}ms`;
}

function renderTile(tile: SiteLayerTile): string {
  const latency = tile.latencyMs !== null ? `<div class="tile-meta">${tile.latencyMs}ms</div>` : "";
  const error = tile.errorMessage ? `<div class="tile-error mono">${escapeHtml(tile.errorMessage)}</div>` : "";
  return `<div class="tile">
    <div class="tile-head"><span class="status-dot ${tile.status}"></span>${tile.layer}</div>
    ${latency}
    ${error}
  </div>`;
}

function renderSiteCard(card: SiteCard): string {
  const cardClass = card.hasActiveIncident ? "card site-card incident" : "card site-card";
  const tiles = card.layers.map(renderTile).join("");
  return `<div class="${cardClass}">
    <div class="site-card-header">
      <h3>${escapeHtml(card.site.name)}</h3>
      <a href="/site/${card.site.id}">${escapeHtml(card.site.url)} →</a>
    </div>
    <div class="tiles">${tiles || '<div class="empty">No checks recorded yet.</div>'}</div>
  </div>`;
}

function renderStatsRow(stats: OverviewStats): string {
  return `<div class="stats-row" id="stats-row">
    <div class="card"><div class="stat-label">Sites monitored</div><div class="stat-value">${stats.sitesMonitored}</div></div>
    <div class="card"><div class="stat-label">30-day uptime</div><div class="stat-value">${formatPercent(stats.uptime30dPercent)}</div></div>
    <div class="card"><div class="stat-label">Avg response</div><div class="stat-value">${formatMs(stats.avgResponseMs)}</div></div>
    <div class="card"><div class="stat-label">Active incidents</div><div class="stat-value">${stats.activeIncidents}</div></div>
  </div>`;
}

const CLIENT_SCRIPT = `
<script>
function escapeHtml(v) {
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function renderStats(stats) {
  var el = document.getElementById('stats-row');
  if (!el) return;
  var pct = stats.uptime30dPercent === null ? "—" : stats.uptime30dPercent + "%";
  var ms = stats.avgResponseMs === null ? "—" : stats.avgResponseMs + "ms";
  el.innerHTML =
    '<div class="card"><div class="stat-label">Sites monitored</div><div class="stat-value">' + stats.sitesMonitored + '</div></div>' +
    '<div class="card"><div class="stat-label">30-day uptime</div><div class="stat-value">' + pct + '</div></div>' +
    '<div class="card"><div class="stat-label">Avg response</div><div class="stat-value">' + ms + '</div></div>' +
    '<div class="card"><div class="stat-label">Active incidents</div><div class="stat-value">' + stats.activeIncidents + '</div></div>';
}
function renderTile(tile) {
  var latency = tile.latencyMs !== null ? '<div class="tile-meta">' + tile.latencyMs + 'ms</div>' : '';
  var error = tile.errorMessage ? '<div class="tile-error mono">' + escapeHtml(tile.errorMessage) + '</div>' : '';
  return '<div class="tile"><div class="tile-head"><span class="status-dot ' + tile.status + '"></span>' + tile.layer + '</div>' + latency + error + '</div>';
}
function renderSites(sites) {
  var el = document.getElementById('site-cards');
  if (!el) return;
  el.innerHTML = sites.map(function (card) {
    var cls = card.hasActiveIncident ? 'card site-card incident' : 'card site-card';
    var tiles = card.layers.map(renderTile).join('') || '<div class="empty">No checks recorded yet.</div>';
    return '<div class="' + cls + '"><div class="site-card-header"><h3>' + escapeHtml(card.name) + '</h3>' +
      '<a href="/site/' + card.id + '">' + escapeHtml(card.url) + ' →</a></div>' +
      '<div class="tiles">' + tiles + '</div></div>';
  }).join('');
}
function refresh() {
  fetch('/api/overview').then(function (r) { return r.json(); }).then(function (data) {
    renderStats(data.stats);
    renderSites(data.sites);
  }).catch(function () { /* silent: keep showing last known state */ });
}
setInterval(refresh, 30000);
</script>`;

export function renderOverviewPage(stats: OverviewStats, cards: SiteCard[]): string {
  const cardsHtml = cards.map(renderSiteCard).join("");
  const body = `
${renderStatsRow(stats)}
<div id="site-cards">${cardsHtml || '<div class="card empty">No sites yet. Add one in Settings.</div>'}</div>
${CLIENT_SCRIPT}`;
  return layout("Overview", body);
}
