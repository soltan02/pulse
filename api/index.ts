import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/server/app";

// Cached across warm invocations of the same serverless instance — Vercel
// reuses the container between requests when it can, so this only pays
// Fastify's startup cost on a cold start, not every request.
let appPromise: Promise<FastifyInstance> | null = null;

function getApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

// Fastify's own .listen() binds a port, which serverless platforms don't
// want — instead we hand the raw req/res to Fastify's underlying Node
// server exactly as it would receive them from a real socket connection.
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app.server.emit("request", req, res);
}
