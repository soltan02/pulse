import { Pool } from "pg";
import { createHash } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SESSION_COOKIE = "pulse_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function checkAuth(req: VercelRequest): boolean {
  const cookie = req.headers.cookie || "";
  return cookie.includes(`${SESSION_COOKIE}=authenticated`);
}

function setAuthCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=authenticated; Path=/; HttpOnly; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax`);
}

function clearAuthCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0`);
}

function checkPassword(password: string): boolean {
  const stored = process.env.DASHBOARD_PASSWORD || "";
  if (!stored) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return createHash("sha256").update(a).digest("hex") === createHash("sha256").update(b).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || "GET";
  const url = req.url || "/";
  const pathname = url.split("?")[0];

  // ─── Auth ───────────────────────────────────────────────
  if (pathname === "/api/login" && method === "POST") {
    const { password } = (req.body as { password?: string }) || {};
    if (checkPassword(password ?? "")) {
      setAuthCookie(res);
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: "invalid password" });
  }

  if (pathname === "/api/logout" && method === "POST") {
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (pathname === "/api/auth/check" && method === "GET") {
    return res.status(200).json({ authed: checkAuth(req) });
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // ─── Overview ───────────────────────────────────────────
  if (pathname === "/api/overview" && method === "GET") {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [sitesResult, frontendResult, incidentsResult] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM site WHERE active = true"),
      pool.query("SELECT status, latency_ms FROM check WHERE layer = $1 AND timestamp >= $2", ["FRONTEND", since]),
      pool.query("SELECT COUNT(*) FROM incident WHERE resolved_at IS NULL"),
    ]);

    const sitesMonitored = Number(sitesResult.rows[0].count);
    const activeIncidents = Number(incidentsResult.rows[0].count);
    const frontendChecks = frontendResult.rows;

    const uptime30dPercent = frontendChecks.length > 0
      ? Math.round((frontendChecks.filter((c: any) => c.status === "UP").length / frontendChecks.length) * 1000) / 10
      : null;

    const latencies = frontendChecks.map((c: any) => c.latency_ms).filter((v: number | null) => v !== null);
    const avgResponseMs = latencies.length > 0
      ? Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length)
      : null;

    const sites = await pool.query("SELECT * FROM site ORDER BY created_at ASC");
    const siteCards = await Promise.all(sites.rows.map(async (site: any) => {
      const layers = await Promise.all(
        ["FRONTEND", "BACKEND", "DATABASE", "SSL"].map(async (layer: string) => {
          const r = await pool.query("SELECT * FROM check WHERE site_id = $1 AND layer = $2 ORDER BY timestamp DESC LIMIT 1", [site.id, layer]);
          const c = r.rows[0];
          return c ? { layer: c.layer, status: c.status, latencyMs: c.latency_ms, errorMessage: c.error_message, timestamp: c.timestamp } : null;
        })
      );
      const inc = await pool.query("SELECT COUNT(*) FROM incident WHERE site_id = $1 AND resolved_at IS NULL", [site.id]);
      return {
        id: site.id, name: site.name, url: site.url,
        hasActiveIncident: Number(inc.rows[0].count) > 0,
        layers: layers.filter((l: any) => l !== null),
      };
    }));

    return res.status(200).json({
      stats: { sitesMonitored, uptime30dPercent, avgResponseMs, activeIncidents },
      sites: siteCards,
    });
  }

  // ─── Incidents ──────────────────────────────────────────
  if (pathname === "/api/incidents" && method === "GET") {
    const r = await pool.query(
      "SELECT i.*, s.name as site_name FROM incident i JOIN site s ON i.site_id = s.id ORDER BY i.resolved_at ASC NULLS FIRST, i.started_at DESC LIMIT 200",
    );
    return res.status(200).json({
      incidents: r.rows.map((inc: any) => ({
        id: inc.id, siteName: inc.site_name, layer: inc.layer,
        status: inc.resolved_at ? "resolved" : "open",
        startedAt: inc.started_at, resolvedAt: inc.resolved_at,
        firstError: inc.first_error, aiDiagnosis: inc.ai_diagnosis,
      })),
    });
  }

  // ─── Site Detail ────────────────────────────────────────
  if (pathname?.startsWith("/api/sites/") && method === "GET") {
    const siteId = pathname.replace("/api/sites/", "");
    const site = await pool.query("SELECT * FROM site WHERE id = $1", [siteId]);
    if (!site.rows[0]) return res.status(404).json({ error: "not found" });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history = await Promise.all(
      ["FRONTEND", "BACKEND", "DATABASE", "SSL"].map(async (layer: string) => {
        const r = await pool.query(
          "SELECT status, latency_ms, error_message, timestamp FROM check WHERE site_id = $1 AND layer = $2 AND timestamp >= $3 ORDER BY timestamp ASC",
          [siteId, layer, since],
        );
        return {
          layer,
          checks: r.rows.map((c: any) => ({
            status: c.status, latencyMs: c.latency_ms, errorMessage: c.error_message, timestamp: c.timestamp,
          })),
        };
      })
    );

    const incidents = await pool.query(
      "SELECT id, layer, started_at, resolved_at, first_error, ai_diagnosis FROM incident WHERE site_id = $1 ORDER BY started_at DESC LIMIT 50",
      [siteId],
    );

    return res.status(200).json({
      site: site.rows[0],
      history,
      incidents: incidents.rows.map((inc: any) => ({
        ...inc, status: inc.resolved_at ? "resolved" : "open",
        startedAt: inc.started_at, resolvedAt: inc.resolved_at,
      })),
    });
  }

  // ─── Settings: Sites ────────────────────────────────────
  if (pathname === "/api/settings/sites" && method === "GET") {
    const r = await pool.query("SELECT * FROM site ORDER BY created_at ASC");
    return res.status(200).json(r.rows);
  }

  if (pathname === "/api/settings/sites" && method === "POST") {
    const body = req.body as { name?: string; url?: string; healthUrl?: string; authToken?: string; checkIntervalSeconds?: number };
    const interval = Number(body.checkIntervalSeconds);
    const r = await pool.query(
      "INSERT INTO site (name, url, health_url, auth_token, check_interval_seconds) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [body.name?.trim() || "", body.url?.trim() || "", body.healthUrl?.trim() || null, body.authToken?.trim() || null,
       Number.isFinite(interval) && interval >= 10 ? Math.floor(interval) : 60],
    );
    return res.status(201).json(r.rows[0]);
  }

  if (pathname?.match(/^\/api\/settings\/sites\/[^/]+$/) && method === "PUT") {
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    const body = req.body as { name?: string; url?: string; healthUrl?: string; authToken?: string; checkIntervalSeconds?: number };
    const interval = Number(body.checkIntervalSeconds);
    const r = await pool.query(
      "UPDATE site SET name=$1, url=$2, health_url=$3, auth_token=$4, check_interval_seconds=$5 WHERE id=$6 RETURNING *",
      [body.name?.trim() || "", body.url?.trim() || "", body.healthUrl?.trim() || null, body.authToken?.trim() || null,
       Number.isFinite(interval) && interval >= 10 ? Math.floor(interval) : 60, id],
    );
    return res.status(200).json(r.rows[0]);
  }

  if (pathname?.match(/^\/api\/settings\/sites\/[^/]+$/) && method === "DELETE") {
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    await pool.query("DELETE FROM site WHERE id = $1", [id]);
    return res.status(200).json({ ok: true });
  }

  if (pathname?.endsWith("/toggle") && method === "POST") {
    const parts = pathname.split("/");
    const id = parts[parts.length - 2];
    const r = await pool.query("SELECT * FROM site WHERE id = $1", [id]);
    if (!r.rows[0]) return res.status(404).json({ error: "not found" });
    await pool.query("UPDATE site SET active = NOT active WHERE id = $1", [id]);
    return res.status(200).json({ ok: true });
  }

  // ─── Settings: Password ─────────────────────────────────
  if (pathname === "/api/settings/password" && method === "POST") {
    const body = req.body as { oldPassword?: string; newPassword?: string };
    if (!body.newPassword || body.newPassword.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }
    const currentPwd = process.env.DASHBOARD_PASSWORD;
    if (!currentPwd) return res.status(500).json({ error: "No password configured" });
    if (!timingSafeEqual(body.oldPassword ?? "", currentPwd)) {
      return res.status(401).json({ error: "Incorrect current password" });
    }
    // Store new password in a file (Vercel serverless can write to /tmp)
    const fs = await import("node:fs");
    fs.writeFileSync("/tmp/.pulse_password", body.newPassword);
    return res.status(200).json({ ok: true });
  }

  // ─── Public Status ──────────────────────────────────────
  if (pathname === "/api/public-status" && method === "GET") {
    const sites = await pool.query("SELECT * FROM site WHERE active = true ORDER BY created_at ASC");
    const result = await Promise.all(
      sites.rows.map(async (site: any) => {
        const layers = await Promise.all(
          ["FRONTEND", "BACKEND", "DATABASE", "SSL"].map(async (layer: string) => {
            const r = await pool.query("SELECT * FROM check WHERE site_id = $1 AND layer = $2 ORDER BY timestamp DESC LIMIT 1", [site.id, layer]);
            return r.rows[0] || null;
          })
        );
        let latestCheck = null;
        let latencyMs: number | null = null;
        for (const c of layers) {
          if (c) { latestCheck = c; latencyMs = c.latency_ms; if (c.status === "DOWN") break; }
        }
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const allFrontend = await pool.query(
          "SELECT status FROM check WHERE site_id = $1 AND layer = 'FRONTEND' AND timestamp >= $2",
          [site.id, thirtyDaysAgo],
        );
        let uptime30dPercent: number | null = null;
        if (allFrontend.rows.length > 0) {
          uptime30dPercent = Math.round(
            (allFrontend.rows.filter((c: any) => c.status === "UP").length / allFrontend.rows.length) * 1000
          ) / 10;
        }
        return {
          id: site.id, name: site.name, url: site.url, active: site.active,
          latestStatus: latestCheck?.status ?? null, latencyMs, uptime30dPercent,
          lastChecked: latestCheck?.timestamp ?? null,
        };
      })
    );
    return res.status(200).json({ sites: result });
  }

  // ─── Health ─────────────────────────────────────────────
  if (pathname === "/health" && method === "GET") {
    return res.status(200).json({ status: "ok" });
  }

  return res.status(404).json({ error: "not found" });
}
