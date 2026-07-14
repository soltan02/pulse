import { config } from "../config";

export async function sendTelegramAlert(text: string): Promise<void> {
  if (!config.telegramBotToken || !config.telegramChatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.telegramChatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      console.error(`Telegram alert failed: HTTP ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("Telegram alert threw:", err);
  }
}
