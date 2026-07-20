import fs from "node:fs";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildApp } from "../../src/server/app";

let appPromise: ReturnType<typeof buildApp> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle API routes
  if (req.url?.startsWith("/api/")) {
    if (!appPromise) {
      appPromise = buildApp();
    }
    const fastify = await appPromise;
    return fastify.ready().then(() => {
      fastify.server.emit("request", req, res);
    });
  }

  // Serve SPA
  // Try public/ first (Vercel copies it), then dist/ (local dev)
  const indexPath = path.join(process.cwd(), "public", "spa.html");
  try {
    const html = fs.readFileSync(indexPath, "utf-8");
    return res.setHeader("Content-Type", "text/html").send(html);
  } catch {
    const fallback = path.join(process.cwd(), "dist", "client", "index.html");
    try {
      const html = fs.readFileSync(fallback, "utf-8");
      return res.setHeader("Content-Type", "text/html").send(html);
    } catch {
      return res.status(500).send("SPA not found");
    }
  }
}
