import Fastify, { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import { config } from "../config";
import { registerPageRoutes } from "./routes/pages";
import { registerApiRoutes } from "./routes/api";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true, trustProxy: true });

  await app.register(cookie, { secret: config.sessionSecret });
  await app.register(formbody);

  await registerPageRoutes(app);
  await registerApiRoutes(app);

  return app;
}
