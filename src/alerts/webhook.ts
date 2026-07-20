import { config } from "../config";

export interface WebhookAlertPayload {
  event: "opened" | "resolved";
  site: string;
  siteId: string;
  layer: string;
  error: string;
  startedAt: string;
  incidentId: string;
  aiDiagnosis: string | null;
  dashboardLink: string;
}

export async function sendWebhookAlert(payload: WebhookAlertPayload): Promise<void> {
  if (!config.webhookUrl) return;
  try {
    const res = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Webhook alert failed: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("Webhook alert threw:", err);
  }
}
