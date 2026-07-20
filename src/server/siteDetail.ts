import { Layer } from "@prisma/client";
import { prisma } from "../db";

export interface SiteHistoryLayer {
  layer: Layer;
  checks: Array<{
    status: string;
    latencyMs: number | null;
    errorMessage: string | null;
    timestamp: string;
  }>;
}

export interface SiteDetailApiResponse {
  site: {
    id: string;
    name: string;
    url: string;
    healthUrl: string | null;
    checkIntervalSeconds: number;
    active: boolean;
  };
  history: SiteHistoryLayer[];
  incidents: Array<{
    id: string;
    layer: Layer;
    status: 'open' | 'resolved';
    startedAt: string;
    resolvedAt: string | null;
    firstError: string;
    aiDiagnosis: string | null;
  }>;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export async function getSiteDetailApi(siteId: string): Promise<SiteDetailApiResponse | null> {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return null;

  const since = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
  const layers = ["FRONTEND", "BACKEND", "DATABASE", "SSL"] as Layer[];
  const historyEntries = await Promise.all(
    layers.map(async (layer) => {
      const checks = await prisma.check.findMany({
        where: { siteId, layer, timestamp: { gte: since } },
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
    select: {
      id: true, layer: true, startedAt: true, resolvedAt: true,
      firstError: true, aiDiagnosis: true,
    },
  });

  return {
    site: {
      id: site.id, name: site.name, url: site.url,
      healthUrl: site.healthUrl, checkIntervalSeconds: site.checkIntervalSeconds,
      active: site.active,
    },
    history: historyEntries,
    incidents: incidents.map((inc) => ({
      ...inc,
      status: inc.resolvedAt ? ("resolved" as const) : ("open" as const),
      startedAt: inc.startedAt.toISOString(),
      resolvedAt: inc.resolvedAt?.toISOString() ?? null,
    })),
  };
}
