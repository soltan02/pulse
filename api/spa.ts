import fs from "node:fs";
import path from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  // Vercel copies public/ to output root
  const indexPath = path.join(process.cwd(), "public", "spa.html");
  try {
    const html = fs.readFileSync(indexPath, "utf-8");
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch {
    const fallbackPath = path.join(process.cwd(), "dist", "client", "index.html");
    try {
      const html = fs.readFileSync(fallbackPath, "utf-8");
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch {
      res.status(500).send("SPA not built");
    }
  }
}
