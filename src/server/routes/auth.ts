import { FastifyInstance } from "fastify";
import { checkPassword, setSessionCookie, clearSessionCookie, isAuthenticated } from "../auth";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/login
  app.post<{ Body: { password: string } }>("/api/login", async (request, reply) => {
    const { password } = request.body;
    if (checkPassword(password ?? "")) {
      setSessionCookie(reply);
      return reply.send({ ok: true });
    }
    return reply.code(401).send({ error: "invalid password" });
  });

  // POST /api/logout
  app.post("/api/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });

  // GET /api/auth/check
  app.get("/api/auth/check", async (request, reply) => {
    return reply.send({ authed: isAuthenticated(request) });
  });
}
