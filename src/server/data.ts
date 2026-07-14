import { Layer, Check, Site, Incident } from "@prisma/client";
import { prisma } from "../db";

const ALL_LAYERS: Layer[] = ["FRONTEND", "BACKEND", "DATABASE", "SSL"];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface OverviewStats {
  sitesMonitored: number;
  uptime30dPercent: number | null;
  avgResponseMs: number | null;
  activeIncidents: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const [sitesMonitored, frontendChecks, activeIncidents] = await Promise.all([
    prisma.site.count({ where: { active: true } }),
    prisma.check.findMany({
      where: { layer: "FRONTEND", timestamp: { gte: since } },
      select: { status: true, latencyMs: true },
    }),
    prisma.incident.count({ where: { resolvedAt: null } }),
  ]);

  const uptime30dPercent =
    frontendChecks.length > 0
      ? Math.round((frontendChecks.filter((c) => c.status === "UP").length / frontendChecks.length) * 1000) / 10
      : null;

  const latencies = frontendChecks.map((c) => c.latencyMs).filter((v): v is number => v !== null);
  const avgResponseMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;

  return { sitesMonitored, uptime30dPercent, avgResponseMs, activeIncidents };
}

export interface SiteLayerTile {
  layer: Layer;
  status: Check["status"];
  latencyMs: number | null;
  errorMessage: string | null;
  timestamp: Date;
}

export interface SiteCard {
  site: Site;
  hasActiveIncident: boolean;
  layers: SiteLayerTile[];
}

export async function getSiteCards(): Promise<SiteCard[]> {
  const sites = await prisma.site.findMany({ orderBy: { createdAt: "asc" } });
  const cards = await Promise.all(sites.map((site) => buildSiteCard(site)));

  // Active-incident sites sort to the top.
  return cards.sort((a, b) => Number(b.hasActiveIncident) - Number(a.hasActiveIncident));
}

async function buildSiteCard(site: Site): Promise<SiteCard> {
  const [latestChecks, activeIncidentCount] = await Promise.all([
    getLatestChecksPerLayer(site.id),
    prisma.incident.count({ where: { siteId: site.id, resolvedAt: null } }),
  ]);

  return { site, hasActiveIncident: activeIncidentCount > 0, layers: latestChecks };
}

async function getLatestChecksPerLayer(siteId: string): Promise<SiteLayerTile[]> {
  const results = await Promise.all(
    ALL_LAYERS.map((layer) => prisma.check.findFirst({ where: { siteId, layer }, orderBy: { timestamp: "desc" } }))
  );
  return results.filter((c): c is Check => c !== null);
}

export interface SiteDetail {
  site: Site;
  history: Record<Layer, Check[]>;
  incidents: Incident[];
}

export async function getSiteDetail(siteId: string): Promise<SiteDetail | null> {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return null;

  const since = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
  const historyEntries = await Promise.all(
    ALL_LAYERS.map(async (layer) => {
      const checks = await prisma.check.findMany({
        where: { siteId, layer, timestamp: { gte: since } },
        orderBy: { timestamp: "asc" },
      });
      return [layer, checks] as const;
    })
  );

  const incidents = await prisma.incident.findMany({
    where: { siteId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return {
    site,
    history: Object.fromEntries(historyEntries) as Record<Layer, Check[]>,
    incidents,
  };
}

export interface IncidentRow extends Incident {
  siteName: string;
}

export async function getIncidentsList(): Promise<IncidentRow[]> {
  const incidents = await prisma.incident.findMany({
    orderBy: [{ resolvedAt: { sort: "asc", nulls: "first" } }, { startedAt: "desc" }],
    include: { site: { select: { name: true } } },
    take: 200,
  });
  return incidents.map(({ site, ...incident }) => ({ ...incident, siteName: site.name }));
}

export async function getAllSites(): Promise<Site[]> {
  return prisma.site.findMany({ orderBy: { createdAt: "asc" } });
}
