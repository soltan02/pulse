import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../src/db";
import { checkPassword, setSessionCookie, clearSessionCookie, isAuthenticated } from "../../src/server/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  const pathname = url?.split("?")[0] || "";

  // Auth routes
  if (pathname === "/api/login" && method === "POST") {
    const { password } = req.body as { password?: string };
    if (checkPassword(password ?? "")) {
      setSessionCookie(res);
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: "invalid password" });
  }

  if (pathname === "/api/logout" && method === "POST") {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (pathname === "/api/auth/check" && method === "GET") {
    // Check cookies manually
    const cookies = req.headers.cookie || "";
    const authed = cookies.includes("pulse_session=authenticated");
    return res.status(200).json({ authed });
  }

  // Overview
  if (pathname === "/api/overview" && method === "GET") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    // Import data functions
    const { getOverviewStats, getSiteCards } = await import("../../src/server/data");
    const [stats, cards] = await Promise.all([getOverviewStats(), getSiteCards()]);
    return res.status(200).json({
      stats,
      sites: cards.map((card) => ({
        id: card.site.id,
        name: card.site.name,
        url: card.site.url,
        hasActiveIncident: card.hasActiveIncident,
        layers: card.layers.map((tile) => ({
          layer: tile.layer,
          status: tile.status,
          latencyMs: tile.latencyMs,
          errorMessage: tile.errorMessage,
          timestamp: tile.timestamp,
        })),
      })),
    });
  }

  // Incidents
  if (pathname === "/api/incidents" && method === "GET") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { getIncidentsList } = await import("../../src/server/data");
    const incidents = await getIncidentsList();
    return res.status(200).json({
      incidents: incidents.map((inc) => ({
        id: inc.id,
        siteName: inc.siteName,
        layer: inc.layer,
        status: inc.resolvedAt ? "resolved" as const : "open" as const,
        startedAt: inc.startedAt.toISOString(),
        resolvedAt: inc.resolvedAt?.toISOString() ?? null,
        firstError: inc.firstError,
        aiDiagnosis: inc.aiDiagnosis,
      })),
    });
  }

  // Site detail
  if (pathname?.startsWith("/api/sites/") && method === "GET") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const siteId = pathname.split("/api/sites/")[1];
    const { getSiteDetailApi } = await import("../../src/server/siteDetail");
    const detail = await getSiteDetailApi(siteId);
    if (!detail) return res.status(404).json({ error: "not found" });
    return res.status(200).json(detail);
  }

  // Sites list
  if (pathname === "/api/settings/sites" && method === "GET") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const sites = await prisma.site.findMany({ orderBy: { createdAt: "asc" } });
    return res.status(200).json(sites);
  }

  // Create site
  if (pathname === "/api/settings/sites" && method === "POST") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const body = req.body as any;
    const interval = Number(body.checkIntervalSeconds);
    const site = await prisma.site.create({
      data: {
        name: body.name.trim(),
        url: body.url.trim(),
        healthUrl: body.healthUrl?.trim() || null,
        authToken: body.authToken?.trim() || null,
        checkIntervalSeconds: Number.isFinite(interval) && interval >= 10 ? Math.floor(interval) : 60,
      },
    });
    return res.status(201).json(site);
  }

  // Update site
  if (pathname?.startsWith("/api/settings/sites/") && pathname.endsWith("") === false && method === "PUT") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    const body = req.body as any;
    const interval = Number(body.checkIntervalSeconds);
    const site = await prisma.site.update({
      where: { id },
      data: {
        name: body.name.trim(),
        url: body.url.trim(),
        healthUrl: body.healthUrl?.trim() || null,
        authToken: body.authToken?.trim() || null,
        checkIntervalSeconds: Number.isFinite(interval) && interval >= 10 ? Math.floor(interval) : 60,
      },
    });
    return res.status(200).json(site);
  }

  // Delete site
  if (pathname?.startsWith("/api/settings/sites/") && method === "DELETE") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    await prisma.site.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  // Toggle site
  if (pathname?.startsWith("/api/settings/sites/") && pathname.endsWith("/toggle") && method === "POST") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const parts = pathname.split("/");
    const id = parts[parts.length - 2];
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) return res.status(404).json({ error: "not found" });
    await prisma.site.update({ where: { id }, data: { active: !site.active } });
    return res.status(200).json({ ok: true });
  }

  // Change password
  if (pathname === "/api/settings/password" && method === "POST") {
    const cookies = req.headers.cookie || "";
    if (!cookies.includes("pulse_session=authenticated")) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const body = req.body as { oldPassword?: string; newPassword?: string };
    if (!body.newPassword || body.newPassword.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }
    const storedPwd = readStoredPassword();
    const currentPwd = storedPwd ?? process.env.DASHBOARD_PASSWORD;
    if (!currentPwd) return res.status(500).json({ error: "No password configured" });
    if (body.oldPassword !== currentPwd) {
      return res.status(401).json({ error: "Incorrect current password" });
    }
    writeStoredPassword(body.newPassword);
    return res.status(200).json({ ok: true });
  }

  // Public status
  if (pathname === "/api/public-status" && method === "GET") {
    const { getPublicStatus } = await import("../../src/server/publicStatus");
    const data = await getPublicStatus();
    return res.status(200).json(data);
  }

  // Health check
  if (pathname === "/health" && method === "GET") {
    return res.status(200).json({ status: "ok" });
  }

  return res.status(404).json({ error: "not found" });
}

function readStoredPassword(): string | null {
  try {
    const fs = require("node:fs");
    return fs.readFileSync(".pulse_password", "utf-8").trim();
  } catch {
    return null;
  }
}

function writeStoredPassword(pwd: string): void {
  const fs = require("node:fs");
  fs.writeFileSync(".pulse_password", pwd, "utf-8");
}
