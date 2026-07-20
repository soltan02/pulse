import { FastifyInstance } from "fastify";
import { requireAuthApi } from "../auth";
import { prisma } from "../../db";
import fs from "node:fs";
import path from "node:path";

const PASSWORD_FILE = path.join(process.cwd(), ".pulse_password");

function readStoredPassword(): string | null {
  try {
    return fs.readFileSync(PASSWORD_FILE, "utf-8").trim();
  } catch {
    return null;
  }
}

function writeStoredPassword(pwd: string): void {
  fs.writeFileSync(PASSWORD_FILE, pwd, "utf-8");
}

export async function registerSiteRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/settings/sites", { preHandler: requireAuthApi }, async (_request, reply) => {
    const sites = await prisma.site.findMany({ orderBy: { createdAt: "asc" } });
    reply.send(sites);
  });

  app.post<{ Body: { name: string; url: string; healthUrl?: string; authToken?: string; checkIntervalSeconds?: number } }>(
    "/api/settings/sites",
    { preHandler: requireAuthApi },
    async (request, reply) => {
      const body = request.body;
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
      reply.send(site);
    }
  );

  app.put<{ Params: { id: string }; Body: { name: string; url: string; healthUrl?: string; authToken?: string; checkIntervalSeconds?: number } }>(
    "/api/settings/sites/:id",
    { preHandler: requireAuthApi },
    async (request, reply) => {
      const body = request.body;
      const interval = Number(body.checkIntervalSeconds);
      const site = await prisma.site.update({
        where: { id: request.params.id },
        data: {
          name: body.name.trim(),
          url: body.url.trim(),
          healthUrl: body.healthUrl?.trim() || null,
          authToken: body.authToken?.trim() || null,
          checkIntervalSeconds: Number.isFinite(interval) && interval >= 10 ? Math.floor(interval) : 60,
        },
      });
      reply.send(site);
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/api/settings/sites/:id",
    { preHandler: requireAuthApi },
    async (request, reply) => {
      await prisma.site.delete({ where: { id: request.params.id } });
      reply.send({ ok: true });
    }
  );

  app.post<{ Params: { id: string } }>(
    "/api/settings/sites/:id/toggle",
    { preHandler: requireAuthApi },
    async (request, reply) => {
      const site = await prisma.site.findUnique({ where: { id: request.params.id } });
      if (!site) return reply.code(404).send({ error: "not found" });
      await prisma.site.update({
        where: { id: site.id },
        data: { active: !site.active },
      });
      reply.send({ ok: true });
    }
  );

  app.post<{ Body: { oldPassword: string; newPassword: string } }>(
    "/api/settings/password",
    { preHandler: requireAuthApi },
    async (request, reply) => {
      const { oldPassword, newPassword } = request.body;
      if (!newPassword || newPassword.length < 4) {
        return reply.code(400).send({ error: "Password must be at least 4 characters" });
      }
      const storedPwd = readStoredPassword();
      const currentPwd = storedPwd ?? process.env.DASHBOARD_PASSWORD;
      if (!currentPwd) {
        return reply.code(500).send({ error: "No password configured" });
      }
      if (oldPassword !== currentPwd) {
        return reply.code(401).send({ error: "Incorrect current password" });
      }
      writeStoredPassword(newPassword);
      reply.send({ ok: true });
    }
  );
}
