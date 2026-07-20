import { Layer } from "@prisma/client";
import { prisma } from "../db";

export async function getPublicStatus() {
  const sites = await prisma.site.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  const result = await Promise.all(
    sites.map(async (site) => {
      const layers = ["FRONTEND", "BACKEND", "DATABASE", "SSL"] as Layer[];
      const latestChecks = await Promise.all(
        layers.map(async (layer) => {
          const check = await prisma.check.findFirst({
            where: { siteId: site.id, layer },
            orderBy: { timestamp: "desc" },
          });
          return check;
        })
      );

      let latestStatus: Layer | null = null;
      let latestCheck: Awaited<ReturnType<typeof prisma.check.findFirst>> = null;
      let latencyMs: number | null = null;
      for (let i = 0; i < layers.length; i++) {
        const c = latestChecks[i];
        if (c) {
          latestStatus = layers[i] as Layer;
          latestCheck = c;
          latencyMs = c.latencyMs;
          if (c.status === "DOWN") break;
        }
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
        id: site.id,
        name: site.name,
        url: site.url,
        active: site.active,
        latestStatus,
        latencyMs,
        uptime30dPercent,
        lastChecked: latestCheck?.timestamp?.toISOString() ?? null,
      };
    })
  );

  return { sites: result };
}
