import { config } from "../config";

export interface SlackAlertPayload {
  text: string;
  blocks?: Array<{ type: string; text?: { type: string; text: string }; fields?: Array<{ type: string; text: string }> }>;
}

export async function sendSlackAlert(text: string): Promise<void> {
  if (!config.slackWebhookUrl) return;
  try {
    const res = await fetch(config.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error(`Slack alert failed: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("Slack alert threw:", err);
  }
}
