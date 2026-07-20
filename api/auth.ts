import type { VercelRequest, VercelResponse } from "@vercel/node";

const SESSION_COOKIE = "pulse_session";

function checkAuth(req: VercelRequest): boolean {
  const cookie = req.headers.cookie || "";
  return cookie.includes(`${SESSION_COOKIE}=authenticated`);
}

function setAuthCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=authenticated; Path=/; HttpOnly; Max-Age=${60*60*24*30}; SameSite=Lax`);
}

function clearAuthCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0`);
}

import { createHash } from "node:crypto";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function checkPassword(password: string): boolean {
  const stored = process.env.DASHBOARD_PASSWORD || "";
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return createHash("sha256").update(a).digest("hex") === createHash("sha256").update(b).digest("hex");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    const { password } = req.body as { password?: string };
    if (checkPassword(password ?? "")) {
      setAuthCookie(res as any);
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: "invalid password" });
  }

  if (req.method === "POST" && req.url?.includes("/logout")) {
    clearAuthCookie(res as any);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET" && req.url?.includes("/auth/check")) {
    const authed = checkAuth(req as any);
    return res.status(200).json({ authed });
  }

  return res.status(404).json({ error: "not found" });
}
