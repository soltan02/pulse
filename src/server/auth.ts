import { timingSafeEqual, createHash } from "node:crypto";
import { FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config";
import fs from "node:fs";

const SESSION_COOKIE = "pulse_session";
const SESSION_VALUE = "authenticated";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function setSessionCookie(reply: FastifyReply): void {
  reply.setCookie(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function isAuthenticated(request: FastifyRequest): boolean {
  const raw = request.cookies[SESSION_COOKIE];
  if (!raw) return false;
  return raw === SESSION_VALUE;
}

export function checkPassword(password: string): boolean {
  const storedPwd = readStoredPassword();
  const currentPwd = storedPwd ?? config.dashboardPassword;
  if (!currentPwd) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(currentPwd);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function readStoredPassword(): string | null {
  try {
    const p = require("node:path");
    const f = p.join(process.cwd(), ".pulse_password");
    return fs.readFileSync(f, "utf-8").trim();
  } catch {
    return null;
  }
}

export async function requireAuthPage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isAuthenticated(request)) {
    await reply.redirect("/login");
  }
}

export async function requireAuthApi(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isAuthenticated(request)) {
    await reply.code(401).send({ error: "unauthorized" });
  }
}
