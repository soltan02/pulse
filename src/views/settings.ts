import { Site } from "@prisma/client";
import { layout } from "./layout";
import { escapeHtml } from "./escape";

function renderSiteRow(site: Site): string {
  const toggleLabel = site.active ? "Pause" : "Resume";
  return `<tr>
    <td>${escapeHtml(site.name)}</td>
    <td>${escapeHtml(site.url)}</td>
    <td>${site.healthUrl ? escapeHtml(site.healthUrl) : "—"}</td>
    <td>${site.checkIntervalSeconds}s</td>
    <td>${site.active ? "active" : "paused"}</td>
    <td class="row">
      <a class="btn secondary" href="/settings/sites/${site.id}/edit">Edit</a>
      <form method="post" action="/settings/sites/${site.id}/toggle">
        <button class="secondary" type="submit">${toggleLabel}</button>
      </form>
      <form method="post" action="/settings/sites/${site.id}/delete" onsubmit="return confirm('Delete ${escapeHtml(site.name)}? This removes all its history.');">
        <button class="danger" type="submit">Delete</button>
      </form>
    </td>
  </tr>`;
}

function siteForm(action: string, site?: Site): string {
  return `<form class="stacked" method="post" action="${action}">
    <label>Name<input type="text" name="name" required value="${site ? escapeHtml(site.name) : ""}" /></label>
    <label>Frontend URL<input type="url" name="url" required value="${site ? escapeHtml(site.url) : ""}" placeholder="https://example.com" /></label>
    <label>Health URL (optional)<input type="url" name="healthUrl" value="${site?.healthUrl ? escapeHtml(site.healthUrl) : ""}" placeholder="https://example.com/health" /></label>
    <label>Auth token (optional)<input type="text" name="authToken" value="${site?.authToken ? escapeHtml(site.authToken) : ""}" /></label>
    <label>Check interval (seconds)<input type="number" name="checkIntervalSeconds" min="10" value="${site?.checkIntervalSeconds ?? 60}" /></label>
    <button type="submit">${site ? "Save changes" : "Add site"}</button>
  </form>`;
}

export function renderSettingsPage(sites: Site[]): string {
  const rows = sites.map(renderSiteRow).join("");
  const table = sites.length
    ? `<table><thead><tr><th>Name</th><th>URL</th><th>Health URL</th><th>Interval</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
    : `<div class="empty">No sites yet — add your first one below.</div>`;

  const body = `
<h2 style="margin-top:0;">Settings</h2>
<div class="card" style="margin-bottom:24px;">${table}</div>
<h3>Add a site</h3>
<div class="card">${siteForm("/settings/sites")}</div>`;

  return layout("Settings", body);
}

export function renderEditSitePage(site: Site): string {
  const body = `
<h2 style="margin-top:0;">Edit ${escapeHtml(site.name)}</h2>
<div class="card">${siteForm(`/settings/sites/${site.id}`, site)}</div>
<p><a href="/settings">← Back to settings</a></p>`;

  return layout("Edit site", body);
}
