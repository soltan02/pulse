import { Layer } from "@prisma/client";
import { config } from "../config";
import { sendTelegramAlert } from "./telegram";
import { sendWebhookAlert } from "./webhook";
import { sendSlackAlert } from "./slack";
import { sendDiscordAlert } from "./discord";
import { sendEmailAlert } from "./email";

export interface AlertEvent {
  kind: "opened" | "resolved";
  site: { id: string; name: string };
  layer: Layer;
  firstError: string;
  incidentId: string;
  startedAt: Date;
  aiDiagnosis: string | null;
}

export async function sendAlerts(event: AlertEvent): Promise<void> {
  const dashboardLink = `${config.publicBaseUrl}/incidents#${event.incidentId}`;
  const verb = event.kind === "opened" ? "DOWN" : "RECOVERED";
  const emoji = event.kind === "opened" ? "🔴" : "🟢";
  const textLines = [
    `${emoji} <b>${escapeHtml(event.site.name)}</b> — ${event.layer} is ${verb}`,
    `Error: ${escapeHtml(event.firstError)}`,
    `Started: ${event.startedAt.toISOString()}`,
  ];
  if (event.aiDiagnosis) {
    textLines.push("", `<b>AI diagnosis:</b>\n${escapeHtml(event.aiDiagnosis)}`);
  }
  textLines.push("", dashboardLink);
  const text = textLines.join("\n");

  // Color codes for Discord
  const color = event.kind === "opened" ? 0xef4444 : 0x22c55e;

  await Promise.all([
    sendTelegramAlert(text),
    sendWebhookAlert({
      event: event.kind,
      site: event.site.name,
      siteId: event.site.id,
      layer: event.layer,
      error: event.firstError,
      startedAt: event.startedAt.toISOString(),
      incidentId: event.incidentId,
      aiDiagnosis: event.aiDiagnosis,
      dashboardLink,
    }),
    sendSlackAlert(text),
    sendDiscordAlert({
      title: `Pulse: ${event.site.name} — ${verb}`,
      description: `**${event.layer}** — ${event.firstError}`,
      color,
      fields: [
        { name: "Site", value: event.site.name, inline: true },
        { name: "Layer", value: event.layer, inline: true },
        { name: "Started", value: event.startedAt.toISOString(), inline: false },
        ...(event.aiDiagnosis ? [{ name: "AI Diagnosis", value: event.aiDiagnosis, inline: false }] : []),
        { name: "Dashboard", value: dashboardLink, inline: false },
      ],
    }),
    sendEmailAlert({
      event: event.kind,
      site: event.site.name,
      layer: event.layer,
      error: event.firstError,
      startedAt: event.startedAt.toISOString(),
      incidentId: event.incidentId,
      aiDiagnosis: event.aiDiagnosis,
      dashboardLink,
    }),
  ]);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
