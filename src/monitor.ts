import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

const pool = new Pool({ connectionString: DATABASE_URL });

const LAYERS = ["FRONTEND", "BACKEND", "DATABASE", "SSL"] as const;

function genId(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

export async function runChecks(): Promise<void> {
  console.log("[monitor] Starting checks...");

  const sites = await pool.query('SELECT * FROM "Site" WHERE active = true ORDER BY "createdAt" ASC');
  console.log(`[monitor] Found ${sites.rows.length} active sites`);

  for (const site of sites.rows) {
    for (const layer of LAYERS) {
      const startTime = Date.now();
      let status: "UP" | "DEGRADED" | "DOWN" = "UP";
      let latencyMs: number | null = null;
      let httpStatus: number | null = null;
      let errorMessage: string | null = null;

      try {
        let url = site.url;
        if (layer === "BACKEND" || layer === "DATABASE") {
          url = site.healthUrl || site.url;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: site.authToken ? { Authorization: `Bearer ${site.authToken}` } : {},
        });

        clearTimeout(timeout);
        httpStatus = res.status;
        latencyMs = Date.now() - startTime;

        if (res.status >= 500) {
          status = "DOWN";
          errorMessage = `HTTP ${res.status}`;
        } else if (res.status >= 400) {
          status = "DEGRADED";
          errorMessage = `HTTP ${res.status}`;
        }
      } catch (err: any) {
        latencyMs = Date.now() - startTime;
        status = "DOWN";
        errorMessage = err.message || "Unknown error";
      }

      await pool.query(
        'INSERT INTO "Check" (id, "siteId", layer, timestamp, status, "latencyMs", "httpStatus", "errorMessage") VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)',
        [genId(), site.id, layer, status, latencyMs, httpStatus, errorMessage],
      );

      console.log(`[monitor] ${site.name} / ${layer}: ${status} (${latencyMs}ms)`);

      if (status === "DOWN" || status === "DEGRADED") {
        const openIncident = await pool.query(
          'SELECT id FROM "Incident" WHERE "siteId" = $1 AND layer = $2 AND "resolvedAt" IS NULL ORDER BY "startedAt" DESC LIMIT 1',
          [site.id, layer],
        );

        if (openIncident.rows.length === 0) {
          const aiDiagnosis = GEMINI_API_KEY ? await diagnoseIncident(layer, errorMessage ?? "", site.name) : null;
          const inserted = await pool.query(
            'INSERT INTO "Incident" (id, "siteId", layer, "startedAt", "firstError", "aiDiagnosis") VALUES ($1, $2, $3, NOW(), $4, $5) RETURNING id',
            [genId(), site.id, layer, errorMessage, aiDiagnosis],
          );
          console.log(`[monitor] Incident opened: ${site.name} / ${layer}`);
          await sendAlerts({
            kind: "opened", site: { id: site.id, name: site.name }, layer,
            firstError: errorMessage!, incidentId: inserted.rows[0].id, startedAt: new Date(), aiDiagnosis,
          });
        }
      }
    }
  }

  // Resolve incidents once their layer is back up
  const openIncidents = await pool.query(
    'SELECT i.*, s.name as site_name FROM "Incident" i JOIN "Site" s ON i."siteId" = s.id WHERE i."resolvedAt" IS NULL',
  );
  for (const inc of openIncidents.rows) {
    const recent = await pool.query(
      'SELECT status FROM "Check" WHERE "siteId" = $1 AND layer = $2 AND timestamp >= NOW() - INTERVAL \'5 minutes\'',
      [inc.siteId, inc.layer],
    );
    if (recent.rows.length > 0 && recent.rows.every((c: any) => c.status === "UP")) {
      await pool.query('UPDATE "Incident" SET "resolvedAt" = NOW() WHERE id = $1', [inc.id]);
      console.log(`[monitor] Incident resolved: ${inc.site_name} / ${inc.layer}`);
      await sendAlerts({
        kind: "resolved", site: { id: inc.siteId, name: inc.site_name }, layer: inc.layer,
        firstError: "", incidentId: inc.id, startedAt: inc.startedAt, aiDiagnosis: inc.aiDiagnosis,
      });
    }
  }

  console.log("[monitor] Done");
}

async function diagnoseIncident(layer: string, error: string, siteName: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are a website monitoring assistant. A site "${siteName}" has a ${layer} layer issue.\nError: ${error}\nProvide a brief root cause analysis and suggested fix in 2-3 sentences.` }] }],
      }),
    });
    const data: any = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

interface AlertEvent {
  kind: "opened" | "resolved";
  site: { id: string; name: string };
  layer: string;
  firstError: string;
  incidentId: string;
  startedAt: Date;
  aiDiagnosis: string | null;
}

async function sendAlerts(event: AlertEvent) {
  const verb = event.kind === "opened" ? "DOWN" : "RECOVERED";
  const emoji = event.kind === "opened" ? "🔴" : "🟢";
  const text = `${emoji} ${event.site.name} — ${event.layer} is ${verb}\nError: ${event.firstError}\nDashboard: ${PUBLIC_BASE_URL}/incidents`;

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
      });
    } catch (e) { console.error("Telegram alert failed:", e); }
  }

  if (SLACK_WEBHOOK_URL) {
    try {
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (e) { console.error("Slack alert failed:", e); }
  }

  if (DISCORD_WEBHOOK_URL) {
    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{ title: `Pulse: ${event.site.name} — ${verb}`, description: `**${event.layer}** — ${event.firstError}`, color: event.kind === "opened" ? 0xef4444 : 0x22c55e }] }),
      });
    } catch (e) { console.error("Discord alert failed:", e); }
  }

  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: event.kind, site: event.site.name, layer: event.layer, error: event.firstError, startedAt: event.startedAt.toISOString(), incidentId: event.incidentId, aiDiagnosis: event.aiDiagnosis }),
      });
    } catch (e) { console.error("Webhook alert failed:", e); }
  }
}
