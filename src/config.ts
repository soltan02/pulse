import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  // Dashboard-only — deliberately NOT required() here so the standalone
  // check-runner script (scripts/run-checks.ts, e.g. run from a GitHub
  // Actions schedule) can import shared modules (alerts, incidents) without
  // needing these set. The dashboard server enforces them itself at
  // startup — see src/server/app.ts.
  dashboardPassword: process.env.DASHBOARD_PASSWORD,
  sessionSecret: process.env.SESSION_SECRET,
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  webhookUrl: process.env.WEBHOOK_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
};
