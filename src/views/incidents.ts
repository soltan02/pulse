import { layout } from "./layout";
import { escapeHtml } from "./escape";
import { formatDuration, formatDateTime } from "./format";
import { IncidentRow } from "../server/data";

function renderRow(incident: IncidentRow): string {
  const statusBadge = incident.resolvedAt
    ? `<span class="badge resolved">resolved</span>`
    : `<span class="badge open">open</span>`;
  return `<tr id="${incident.id}">
    <td>${escapeHtml(incident.siteName)}</td>
    <td>${incident.layer}</td>
    <td>${statusBadge}</td>
    <td>${formatDateTime(incident.startedAt)}</td>
    <td>${formatDuration(incident.startedAt, incident.resolvedAt)}</td>
    <td class="mono">${escapeHtml(incident.firstError)}</td>
  </tr>`;
}

export function renderIncidentsPage(incidents: IncidentRow[]): string {
  const rows = incidents.map(renderRow).join("");
  const table = incidents.length
    ? `<table><thead><tr><th>Site</th><th>Layer</th><th>Status</th><th>Started</th><th>Duration</th><th>First error</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<div class="empty">No incidents recorded yet.</div>`;

  const body = `
<h2 style="margin-top:0;">Incidents</h2>
<div class="card">${table}</div>`;

  return layout("Incidents", body);
}
