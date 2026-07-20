import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";

declare global {
  var prismaForPulse: PrismaClient | undefined;
}
const prisma = global.prismaForPulse ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prismaForPulse = prisma;

const SESSION_COOKIE = "pulse_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function setCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=authenticated; Path=/; HttpOnly; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax`);
}

function clearCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0`);
}

function isLoggedIn(req: VercelRequest): boolean {
  const cookie = req.headers.cookie || "";
  return cookie.includes(`${SESSION_COOKIE}=authenticated`);
}

function checkPassword(password: string): boolean {
  const stored = readStoredPassword() ?? process.env.DASHBOARD_PASSWORD;
  if (!stored) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  // Simple hash comparison (not ideal but works for this use case)
  return createHash("sha256").update(a).digest("hex") === createHash("sha256").update(b).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function readStoredPassword(): string | null {
  try {
    return fs.readFileSync(".pulse_password", "utf-8").trim();
  } catch {
    return null;
  }
}

function writeStoredPassword(pwd: string): void {
  fs.writeFileSync(".pulse_password", pwd, "utf-8");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || "GET";
  const url = req.url || "/";
  const pathname = url.split("?")[0];

  // ─── Auth ───────────────────────────────────────────────
  if (pathname === "/api/login" && method === "POST") {
    const { password } = (req.body as { password?: string }) || {};
    if (checkPassword(password ?? "")) {
      setCookie(res);
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: "invalid password" });
  }

  if (pathname === "/api/logout" && method === "POST") {
    clearCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (pathname === "/api/auth/check" && method === "GET") {
    return res.status(200).json({ authed: isLoggedIn(req) });
  }

  // Require auth for everything below
  if (!isLoggedIn(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // ─── Overview ───────────────────────────────────────────
  if (pathname === "/api/overview" && method === "GET") {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const since = new Date(Date.now() - THIRTY_DAYS_MS);

    const [sitesMonitored, frontendChecks, activeIncidents] = await Promise.all([
      prisma.site.count({ where: { active: true } }),
      prisma.check.findMany({
        where: { layer: "FRONTEND", timestamp: { gte: since } },
        select: { status: true, latencyMs: true },
      }),
      prisma.incident.count({ where: { resolvedAt: null } }),
    ]);

    const uptime30dPercent = frontendChecks.length > 0
      ? Math.round((frontendChecks.filter((c) => c.status === "UP").length / frontendChecks.length) * 1000) / 10
      : null;

    const latencies = frontendChecks.map((c) => c.latencyMs).filter((v): v is number => v !== null);
    const avgResponseMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

    const sites = await prisma.site.findMany({ orderBy: { createdAt: "asc" } });
    const siteCards = await Promise.all(sites.map(async (site) => {
      const layerNames: string[] = ["FRONTEND", "BACKEND", "DATABASE", "SSL"];
      const layers = await Promise.all(
        layerNames.map(async (layer: string) => {
          const check = await prisma.check.findFirst({
            where: { siteId: site.id, layer: layer as any },
            orderBy: { timestamp: "desc" },
          });
          return check ? {
            layer: check.layer,
            status: check.status,
            latencyMs: check.latencyMs,
            errorMessage: check.errorMessage,
            timestamp: check.timestamp,
          } : null;
        })
      );
      const activeCount = await prisma.incident.count({
        where: { siteId: site.id, resolvedAt: null },
      });
      return {
        id: site.id,
        name: site.name,
        url: site.url,
        hasActiveIncident: activeCount > 0,
        layers: layers.filter((l): l is NonNullable<typeof l> => l !== null),
      };
    }));

    return res.status(200).json({
      stats: { sitesMonitored, uptime30dPercent, avgResponseMs, activeIncidents },
      sites: siteCards,
    });
  }

  // ─── Incidents ──────────────────────────────────────────
  if (pathname === "/api/incidents" && method === "GET") {
    const incidents = await prisma.incident.findMany({
      orderBy: [{ resolvedAt: { sort: "asc", nulls: "first" } }, { startedAt: "desc" }],
      include: { site: { select: { name: true } } },
      take: 200,
    });
    return res.status(200).json({
      incidents: incidents.map((inc) => ({
        id: inc.id,
        siteName: inc.site.name,
        layer: inc.layer,
        status: inc.resolvedAt ? "resolved" as const : "open" as const,
        startedAt: inc.startedAt.toISOString(),
        resolvedAt: inc.resolvedAt?.toISOString() ?? null,
        firstError: inc.firstError,
        aiDiagnosis: inc.aiDiagnosis,
      })),
    });
  }

  // ─── Site Detail ────────────────────────────────────────
  if (pathname?.startsWith("/api/sites/") && method === "GET") {
    const siteId = pathname.replace("/api/sites/", "");
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return res.status(404).json({ error: "not found" });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history = await Promise.all(
      ["FRONTEND", "BACKEND", "DATABASE", "SSL"].map(async (layer: string) => {
        const checks = await prisma.check.findMany({
          where: { siteId, layer: layer as any, timestamp: { gte: since } },
          orderBy: { timestamp: "asc" },
          select: { status: true, latencyMs: true, errorMessage: true, timestamp: true },
        });
        return {
          layer,
          checks: checks.map((c) => ({
            status: c.status,
            latencyMs: c.latencyMs,
            errorMessage: c.errorMessage,
            timestamp: c.timestamp.toISOString(),
          })),
        };
      })
    );

    const incidents = await prisma.incident.findMany({
      where: { siteId },
      orderBy: { startedAt: "desc" },
      take: 50,
      select: { id: true, layer: true, startedAt: true, resolvedAt: true, firstError: true, aiDiagnosis: true },
    });

    return res.status(200).json({
      site: {
        id: site.id, name: site.name, url: site.url,
        healthUrl: site.healthUrl, checkIntervalSeconds: site.checkIntervalSeconds,
        active: site.active,
      },
      history,
      incidents: incidents.map((inc) => ({
        ...inc,
        status: inc.resolvedAt ? ("resolved" as const) : ("open" as const),
        startedAt: inc.startedAt.toISOString(),
        resolvedAt: inc.resolvedAt?.toISOString() ?? null,
      })),
    });
  }

  // ─── Settings: Sites ────────────────────────────────────
  if (pathname === "/api/settings/sites" && method === "GET") {
    const sites = await prisma.site.findMany({ orderBy: { createdAt: "asc" } });
    return res.status(200).json(sites);
  }

  if (pathname === "/api/settings/sites" && method === "POST") {
    const body = req.body as { name?: string; url?: string; healthUrl?: string; authToken?: string; checkIntervalSeconds?: number };
    const interval = Number(body.checkIntervalSeconds);
    const site = await prisma.site.create({
      data: {
        name: body.name?.trim() || "",
        url: body.url?.trim() || "",
        healthUrl: body.healthUrl?.trim() || null,
        authToken: body.authToken?.trim() || null,
        checkIntervalSeconds: Number.isFinite(interval) && interval >= 10 ? Math.floor(interval) : 60,
      },
    });
    return res.status(201).json(site);
  }

  if (pathname?.match(/^\/api\/settings\/sites\/[^/]+$/) && method === "PUT") {
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    const body = req.body as { name?: string; url?: string; healthUrl?: string; authToken?: string; checkIntervalSeconds?: number };
    const interval = Number(body.checkIntervalSeconds);
    const site = await prisma.site.update({
      where: { id },
      data: {
        name: body.name?.trim() || "",
        url: body.url?.trim() || "",
        healthUrl: body.healthUrl?.trim() || null,
        authToken: body.authToken?.trim() || null,
        checkIntervalSeconds: Number.isFinite(interval) && interval >= 10 ? Math.floor(interval) : 60,
      },
    });
    return res.status(200).json(site);
  }

  if (pathname?.match(/^\/api\/settings\/sites\/[^/]+$/) && method === "DELETE") {
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    await prisma.site.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  if (pathname?.endsWith("/toggle") && method === "POST") {
    const parts = pathname.split("/");
    const id = parts[parts.length - 2];
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) return res.status(404).json({ error: "not found" });
    await prisma.site.update({ where: { id }, data: { active: !site.active } });
    return res.status(200).json({ ok: true });
  }

  // ─── Settings: Password ─────────────────────────────────
  if (pathname === "/api/settings/password" && method === "POST") {
    const body = req.body as { oldPassword?: string; newPassword?: string };
    if (!body.newPassword || body.newPassword.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }
    const storedPwd = readStoredPassword();
    const currentPwd = storedPwd ?? process.env.DASHBOARD_PASSWORD;
    if (!currentPwd) return res.status(500).json({ error: "No password configured" });
    if (!timingSafeEqual(body.oldPassword ?? "", currentPwd)) {
      return res.status(401).json({ error: "Incorrect current password" });
    }
    writeStoredPassword(body.newPassword);
    return res.status(200).json({ ok: true });
  }

  // ─── Public Status ──────────────────────────────────────
  if (pathname === "/api/public-status" && method === "GET") {
    const sites = await prisma.site.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
    const result = await Promise.all(
      sites.map(async (site) => {
        const layerNames: string[] = ["FRONTEND", "BACKEND", "DATABASE", "SSL"];
        const latestChecks = await Promise.all(
          layerNames.map(async (layer: string) => {
            const check = await prisma.check.findFirst({
              where: { siteId: site.id, layer: layer as any },
              orderBy: { timestamp: "desc" },
            });
            return check;
          })
        );
        let latestCheck = null;
        let latencyMs: number | null = null;
        for (const c of latestChecks) {
          if (c) { latestCheck = c; latencyMs = c.latencyMs; if (c.status === "DOWN") break; }
        }
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const allFrontend = await prisma.check.findMany({
          where: { siteId: site.id, layer: "FRONTEND", timestamp: { gte: thirtyDaysAgo } },
          select: { status: true },
        });
        let uptime30dPercent: number | null = null;
        if (allFrontend.length > 0) {
          uptime30dPercent = Math.round(
            (allFrontend.filter((c) => c.status === "UP").length / allFrontend.length) * 1000
          ) / 10;
        }
        return {
          id: site.id, name: site.name, url: site.url, active: site.active,
          latestStatus: latestCheck?.status ?? null,
          latencyMs,
          uptime30dPercent,
          lastChecked: latestCheck?.timestamp?.toISOString() ?? null,
        };
      })
    );
    return res.status(200).json({ sites: result });
  }

  // ─── Health ─────────────────────────────────────────────
  if (pathname === "/health" && method === "GET") {
    return res.status(200).json({ status: "ok" });
  }

  // ─── SPA Fallback ───────────────────────────────────────
  const indexPath = path.join(process.cwd(), "public", "spa.html");
  try {
    const html = fs.readFileSync(indexPath, "utf-8");
    return res.setHeader("Content-Type", "text/html").send(html);
  } catch {
    const fallback = path.join(process.cwd(), "dist", "client", "index.html");
    try {
      const html = fs.readFileSync(fallback, "utf-8");
      return res.setHeader("Content-Type", "text/html").send(html);
    } catch {
      return res.status(500).send("SPA not built");
    }
  }
}
