import { Pool } from "pg";
import cron from "node-cron";

const DATABASE_URL = process.env.DATABASE_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runChecks() {
  console.log("[runChecks] Starting...");

  const sites = await pool.query("SELECT * FROM site WHERE active = true ORDER BY created_at ASC");
  console.log(`[runChecks] Found ${sites.rows.length} active sites`);

  for (const site of sites.rows) {
    const layers = ["FRONTEND", "BACKEND", "DATABASE", "SSL"] as const;

    for (const layer of layers) {
      const startTime = Date.now();
      let status: "UP" | "DEGRADED" | "DOWN" = "UP";
      let latencyMs: number | null = null;
      let httpStatus: number | null = null;
      let errorMessage: string | null = null;

      try {
        let url = site.url;
        if (layer === "FRONTEND") {
          url = site.url;
        } else if (layer === "BACKEND") {
          url = site.healthUrl || site.url;
        } else if (layer === "DATABASE") {
          url = site.healthUrl || site.url;
        } else if (layer === "SSL") {
          url = site.url;
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

      // Persist check result
      await pool.query(
        "INSERT INTO check (site_id, layer, timestamp, status, latency_ms, http_status, error_message) VALUES ($1, $2, NOW(), $3, $4, $5, $6)",
        [site.id, layer, status, latencyMs, httpStatus, errorMessage],
      );

      console.log(`[runChecks] ${site.name} / ${layer}: ${status} (${latencyMs}ms)`);

      // Evaluate incident
      if (status === "DOWN" || status === "DEGRADED") {
        const openIncident = await pool.query(
          "SELECT id FROM incident WHERE site_id = $1 AND layer = $2 AND resolved_at IS NULL ORDER BY started_at DESC LIMIT 1",
          [site.id, layer],
        );

        if (openIncident.rows.length === 0) {
          // Open new incident
          const aiDiagnosis = GEMINI_API_KEY ? await diagnoseIncident(layer, errorMessage, site.name) : null;
          await pool.query(
            "INSERT INTO incident (site_id, layer, started_at, first_error, ai_diagnosis) VALUES ($1, $2, NOW(), $3, $4)",
            [site.id, layer, errorMessage, aiDiagnosis],
          );
          console.log(`[runChecks] ⚠️ Incident opened: ${site.name} / ${layer}`);
          await sendAlerts({ kind: "opened", site, layer, firstError: errorMessage!, incidentId: "pending", startedAt: new Date(), aiDiagnosis });
        }
      }
    }
  }

  // Resolve incidents for sites that are back up
  const allChecks = await pool.query(
    "SELECT site_id, layer, status FROM check WHERE timestamp >= NOW() - INTERVAL '5 minutes' ORDER BY timestamp DESC",
  );
  const recentChecks: Record<string, Record<string, string>> = {};
  for (const row of allChecks.rows) {
    const key = `${row.site_id}:${row.layer}`;
    if (!recentChecks[key]) recentChecks[key] = {};
    recentChecks[key][row.layer] = row.status;
  }

  const openIncidents = await pool.query(
    "SELECT i.*, s.name as site_name FROM incident i JOIN site s ON i.site_id = s.id WHERE i.resolved_at IS NULL",
  );
  for (const inc of openIncidents.rows) {
    const key = `${inc.site_id}:${inc.layer}`;
    // If no recent checks or all recent checks are UP, resolve
    const recent = allChecks.rows.filter((c: any) => c.site_id === inc.site_id && c.layer === inc.layer);
    if (recent.length === 0 || recent.every((c: any) => c.status === "UP")) {
      await pool.query("UPDATE incident SET resolved_at = NOW() WHERE id = $1", [inc.id]);
      console.log(`[runChecks] ✅ Incident resolved: ${inc.site_name} / ${inc.layer}`);
      await sendAlerts({ kind: "resolved", site: { id: inc.site_id, name: inc.site_name }, layer: inc.layer, firstError: "", incidentId: inc.id, startedAt: inc.started_at, aiDiagnosis: inc.ai_diagnosis });
    }
  }

  await pool.end();
  console.log("[runChecks] Done");
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
    const data = await res.json();
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

  // Telegram
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
      });
    } catch (e) { console.error("Telegram alert failed:", e); }
  }

  // Slack
  if (SLACK_WEBHOOK_URL) {
    try {
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (e) { console.error("Slack alert failed:", e); }
  }

  // Discord
  if (DISCORD_WEBHOOK_URL) {
    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{ title: `Pulse: ${event.site.name} — ${verb}`, description: `**${event.layer}** — ${event.firstError}`, color: event.kind === "opened" ? 0xef4444 : 0x22c55e }] }),
      });
    } catch (e) { console.error("Discord alert failed:", e); }
  }

  // Webhook
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

// Run once and exit (for GitHub Actions)
runChecks().catch((err) => {
  console.error("[runChecks] Fatal error:", err);
  process.exit(1);
});
