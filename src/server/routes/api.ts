import { FastifyInstance } from "fastify";
import { requireAuthApi } from "../auth";
import { getOverviewStats, getSiteCards } from "../data";

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
}
