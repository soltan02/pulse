import { FastifyInstance } from "fastify";
import { prisma } from "../../db";
import { requireAuthPage, checkPassword, setSessionCookie, clearSessionCookie } from "../auth";
import { getOverviewStats, getSiteCards, getSiteDetail, getIncidentsList, getAllSites } from "../data";
import { renderLoginPage } from "../../views/login";
import { renderOverviewPage } from "../../views/overview";
import { renderSiteDetailPage } from "../../views/siteDetail";
import { renderIncidentsPage } from "../../views/incidents";
import { renderSettingsPage, renderEditSitePage } from "../../views/settings";

interface SiteFormBody {
  name: string;
  url: string;
  healthUrl?: string;
  authToken?: string;
  checkIntervalSeconds?: string;
}

function parseSiteForm(body: SiteFormBody) {
  const intervalRaw = Number(body.checkIntervalSeconds);
  return {
    name: body.name.trim(),
    url: body.url.trim(),
    healthUrl: body.healthUrl?.trim() ? body.healthUrl.trim() : null,
    authToken: body.authToken?.trim() ? body.authToken.trim() : null,
    checkIntervalSeconds: Number.isFinite(intervalRaw) && intervalRaw >= 10 ? Math.floor(intervalRaw) : 60,
  };
}

export async function registerPageRoutes(app: FastifyInstance): Promise<void> {
  app.get("/login", async (_request, reply) => {
    reply.type("text/html").send(renderLoginPage());
  });

  app.post<{ Body: { password: string } }>("/login", async (request, reply) => {
    if (checkPassword(request.body.password ?? "")) {
      setSessionCookie(reply);
      return reply.redirect("/");
    }
    reply.type("text/html").send(renderLoginPage({ error: true }));
  });

  app.get("/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    reply.redirect("/login");
  });

  app.get("/", { preHandler: requireAuthPage }, async (_request, reply) => {
    const [stats, cards] = await Promise.all([getOverviewStats(), getSiteCards()]);
    reply.type("text/html").send(renderOverviewPage(stats, cards));
  });

  app.get<{ Params: { id: string } }>("/site/:id", { preHandler: requireAuthPage }, async (request, reply) => {
    const detail = await getSiteDetail(request.params.id);
    if (!detail) return reply.code(404).send("Site not found");
    reply.type("text/html").send(renderSiteDetailPage(detail));
  });

  app.get("/incidents", { preHandler: requireAuthPage }, async (_request, reply) => {
    const incidents = await getIncidentsList();
    reply.type("text/html").send(renderIncidentsPage(incidents));
  });

  app.get("/settings", { preHandler: requireAuthPage }, async (_request, reply) => {
    const sites = await getAllSites();
    reply.type("text/html").send(renderSettingsPage(sites));
  });

  app.get<{ Params: { id: string } }>("/settings/sites/:id/edit", { preHandler: requireAuthPage }, async (request, reply) => {
    const site = await prisma.site.findUnique({ where: { id: request.params.id } });
    if (!site) return reply.code(404).send("Site not found");
    reply.type("text/html").send(renderEditSitePage(site));
  });

  app.post<{ Body: SiteFormBody }>("/settings/sites", { preHandler: requireAuthPage }, async (request, reply) => {
    await prisma.site.create({ data: parseSiteForm(request.body) });
    reply.redirect("/settings");
  });

  app.post<{ Params: { id: string }; Body: SiteFormBody }>(
    "/settings/sites/:id",
    { preHandler: requireAuthPage },
    async (request, reply) => {
      await prisma.site.update({ where: { id: request.params.id }, data: parseSiteForm(request.body) });
      reply.redirect("/settings");
    }
  );

  app.post<{ Params: { id: string } }>(
    "/settings/sites/:id/toggle",
    { preHandler: requireAuthPage },
    async (request, reply) => {
      const site = await prisma.site.findUnique({ where: { id: request.params.id } });
      if (site) await prisma.site.update({ where: { id: site.id }, data: { active: !site.active } });
      reply.redirect("/settings");
    }
  );

  app.post<{ Params: { id: string } }>(
    "/settings/sites/:id/delete",
    { preHandler: requireAuthPage },
    async (request, reply) => {
      await prisma.site.delete({ where: { id: request.params.id } });
      reply.redirect("/settings");
    }
  );
}
