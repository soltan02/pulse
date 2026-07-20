import { config } from "../config";

export async function sendDiscordAlert(embed: { title: string; description: string; color: number; fields?: Array<{ name: string; value: string; inline?: boolean }> }): Promise<void> {
  if (!config.discordWebhookUrl) return;
  try {
    const res = await fetch(config.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      console.error(`Discord alert failed: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("Discord alert threw:", err);
  }
}
