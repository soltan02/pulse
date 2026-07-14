import { Check, Layer } from "@prisma/client";
import { layout } from "./layout";
import { escapeHtml } from "./escape";
import { formatDuration, formatDateTime } from "./format";
import { SiteDetail } from "../server/data";

function renderSparkline(checks: Check[], width = 600, height = 60): string {
  if (checks.length < 2) return '<div class="empty">Not enough data in the last 24h.</div>';

  const latencies = checks.map((c) => c.latencyMs ?? 0);
  const max = Math.max(...latencies, 1);
  const stepX = width / (checks.length - 1);

  const yFor = (latencyMs: number | null) => height - ((latencyMs ?? 0) / max) * height;

  const coords = checks.map((c, i) => `${(i * stepX).toFixed(1)},${yFor(c.latencyMs).toFixed(1)}`).join(" ");

  const downDots = checks
    .map((c, i) => (c.status === "DOWN" ? { x: i * stepX, y: yFor(c.latencyMs) } : null))
    .filter((v): v is { x: number; y: number } => v !== null)
    .map((m) => `<circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="3" fill="var(--down)" />`)
    .join("");

  return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
    <polyline fill="none" stroke="var(--up)" stroke-width="1.5" points="${coords}" />
    ${downDots}
  </svg>`;
}

function renderLayerSection(layer: Layer, checks: Check[]): string {
  if (checks.length === 0) return "";
  const latest = checks[checks.length - 1];
  return `<div class="card" style="margin-bottom:16px;">
    <div class="tile-head" style="margin-bottom:10px;"><span class="status-dot ${latest?.status}"></span>${layer}</div>
    ${renderSparkline(checks)}
    ${latest?.errorMessage ? `<div class="tile-error mono" style="margin-top:8px;">${escapeHtml(latest.errorMessage)}</div>` : ""}
  </div>`;
}

function renderIncidentRow(incident: SiteDetail["incidents"][number]): string {
  const statusBadge = incident.resolvedAt
    ? `<span class="badge resolved">resolved</span>`
    : `<span class="badge open">open</span>`;
  return `<tr id="${incident.id}">
    <td>${incident.layer}</td>
    <td>${statusBadge}</td>
    <td>${formatDateTime(incident.startedAt)}</td>
    <td>${formatDuration(incident.startedAt, incident.resolvedAt)}</td>
    <td class="mono">${escapeHtml(incident.firstError)}</td>
  </tr>`;
}

export function renderSiteDetailPage(detail: SiteDetail): string {
  const { site, history, incidents } = detail;
  const layerSections = (Object.keys(history) as Layer[]).map((layer) => renderLayerSection(layer, history[layer])).join("");

  const incidentRows = incidents.map(renderIncidentRow).join("");
  const incidentsTable = incidents.length
    ? `<table><thead><tr><th>Layer</th><th>Status</th><th>Started</th><th>Duration</th><th>First error</th></tr></thead><tbody>${incidentRows}</tbody></table>`
    : `<div class="empty">No incidents recorded for this site.</div>`;

  const body = `
<h2 style="margin-top:0;">${escapeHtml(site.name)}</h2>
<p><a href="${escapeHtml(site.url)}" target="_blank" rel="noopener">${escapeHtml(site.url)}</a></p>

<h3>Last 24 hours</h3>
${layerSections || '<div class="card empty">No checks recorded yet.</div>'}

<h3>Incident history</h3>
<div class="card" style="margin-bottom:16px;">${incidentsTable}</div>

<h3>Configuration</h3>
<div class="card">
  <table>
    <tr><th>Health URL</th><td>${site.healthUrl ? escapeHtml(site.healthUrl) : "—"}</td></tr>
    <tr><th>Check interval</th><td>${site.checkIntervalSeconds}s</td></tr>
    <tr><th>Active</th><td>${site.active ? "yes" : "paused"}</td></tr>
  </table>
</div>`;

  return layout(site.name, body);
}
