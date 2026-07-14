import { timingSafeEqual } from "node:crypto";
import { FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config";

const SESSION_COOKIE = "pulse_session";
const SESSION_VALUE = "authenticated";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function setSessionCookie(reply: FastifyReply): void {
  reply.setCookie(SESSION_COOKIE, SESSION_VALUE, {
    signed: true,
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
  const unsigned = request.unsignCookie(raw);
  return unsigned.valid && unsigned.value === SESSION_VALUE;
}

export function checkPassword(password: string): boolean {
  const a = Buffer.from(password);
  const b = Buffer.from(config.dashboardPassword);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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
