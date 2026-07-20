import { FastifyInstance } from "fastify";
import { requireAuthApi } from "../auth";
import { getOverviewStats, getSiteCards, getIncidentsList } from "../data";
import { getPublicStatus } from "../publicStatus";
import { getSiteDetailApi } from "../siteDetail";
import { prisma } from "../../db";

export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/overview", { preHandler: requireAuthApi }, async (_request, reply) => {
    const [stats, cards] = await Promise.all([getOverviewStats(), getSiteCards()]);
    reply.send({
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
  });

  app.get("/api/incidents", { preHandler: requireAuthApi }, async (_request, reply) => {
    const incidents = await getIncidentsList();
    reply.send({
      incidents: incidents.map((inc) => ({
        id: inc.id,
        siteName: inc.siteName,
        layer: inc.layer,
        status: inc.resolvedAt ? ("resolved" as const) : ("open" as const),
        startedAt: inc.startedAt.toISOString(),
        resolvedAt: inc.resolvedAt?.toISOString() ?? null,
        firstError: inc.firstError,
        aiDiagnosis: inc.aiDiagnosis,
      })),
    });
  });

  app.get<{ Params: { id: string } }>("/api/sites/:id", { preHandler: requireAuthApi }, async (request, reply) => {
    const detail = await getSiteDetailApi(request.params.id);
    if (!detail) return reply.code(404).send({ error: "not found" });
    reply.send(detail);
  });

  app.get("/api/settings/sites", { preHandler: requireAuthApi }, async (_request, reply) => {
    const sites = await prisma.site.findMany({ orderBy: { createdAt: "asc" } });
    reply.send(sites);
  });

  app.get("/api/public-status", async (_request, reply) => {
    const data = await getPublicStatus();
    reply.send(data);
  });
}
