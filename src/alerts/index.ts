import { Layer } from "@prisma/client";
import { config } from "../config";
import { sendTelegramAlert } from "./telegram";
import { sendWebhookAlert } from "./webhook";

export interface AlertEvent {
  kind: "opened" | "resolved";
  site: { id: string; name: string };
  layer: Layer;
  firstError: string;
  incidentId: string;
  startedAt: Date;
}

export async function sendAlerts(event: AlertEvent): Promise<void> {
  const dashboardLink = `${config.publicBaseUrl}/incidents#${event.incidentId}`;
  const verb = event.kind === "opened" ? "DOWN" : "RECOVERED";
  const text = [
    `<b>${escapeHtml(event.site.name)}</b> — ${event.layer} is ${verb}`,
    `Error: ${escapeHtml(event.firstError)}`,
    `Started: ${event.startedAt.toISOString()}`,
    dashboardLink,
  ].join("\n");

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
      dashboardLink,
    }),
  ]);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
