import Fastify, { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import statics from "@fastify/static";
import { config } from "../config";
import { registerApiRoutes } from "./routes/api";
import { registerSiteRoutes } from "./routes/sites";
import { registerAuthRoutes } from "./routes/auth";
import path from "node:path";
import fs from "node:fs";

export async function buildApp(): Promise<FastifyInstance> {
  if (!config.dashboardPassword) throw new Error("Missing required env var: DASHBOARD_PASSWORD");
  if (!config.sessionSecret) throw new Error("Missing required env var: SESSION_SECRET");

  const app = Fastify({ logger: true, trustProxy: true });

  await app.register(cookie, { secret: config.sessionSecret });
  await app.register(formbody);

  // Serve the React SPA static files (built by Vite → dist/)
  const spaDir = path.join(__dirname, "..", "..", "dist");

  if (fs.existsSync(spaDir)) {
    await app.register(statics, {
      root: spaDir,
      prefix: "/",
      serve: true,
      wildcard: false,
    });
  }

  // API routes (JSON)
  await registerAuthRoutes(app);
  await registerApiRoutes(app);
  await registerSiteRoutes(app);

  // SPA fallback — serve index.html for client-side routing
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith("/api/") || request.url === "/health") {
      return reply.code(404).send({ error: "not found" });
    }
    try {
      const html = fs.readFileSync(path.join(spaDir, "index.html"), "utf-8");
      return reply.type("text/html").send(html);
    } catch {
      return reply.code(500).send("SPA not built yet");
    }
  });

  return app;
}
