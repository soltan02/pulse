# Pulse

Self-hosted website health monitoring. Pulse polls every site you tell it
about and pinpoints exactly which layer broke: frontend, backend API,
database, or SSL certificate — instead of a generic "it's down."

## Stack

Node.js 20 + TypeScript (strict), Fastify, Prisma/PostgreSQL, node-cron,
server-rendered HTML + a small amount of vanilla JS (no frontend framework).

## Local development

1. **Database**: Pulse needs a Postgres connection string. The simplest option
   is a free [Supabase](https://supabase.com) project — create one, then copy
   the connection string from *Settings → Database → Connection string*
   (the "Session pooler" URI works well for a long-running app like this).
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`,
   `DASHBOARD_PASSWORD`, and `SESSION_SECRET` (generate the secret with
   `openssl rand -hex 32`). Alerts (`TELEGRAM_*`, `WEBHOOK_URL`) are optional.
3. Install dependencies and run the first migration:
   ```
   npm install
   npx prisma migrate dev --name init
   npm run seed      # adds a demo site pointing at https://example.com
   npm run dev
   ```
4. Open `http://localhost:3000`, log in with `DASHBOARD_PASSWORD`.

## Tests

```
npm test
```

Unit tests cover the status-mapping logic (raw check result → UP / DEGRADED
/ DOWN) in `src/worker/statusMapping.ts` — the part of the system where a
wrong call means a false alert or a missed outage.

## Deploying to a plain Ubuntu VPS

Run Pulse on a server that shares **nothing** with the sites it watches —
different provider/region if possible. A monitor that goes down with your
infrastructure isn't monitoring anything.

```bash
# On the VPS, with Docker + Docker Compose installed:
git clone <your-fork-url> pulse
cd pulse
cp .env.example .env
nano .env   # fill in DATABASE_URL, DASHBOARD_PASSWORD, SESSION_SECRET, alerts
docker compose up -d --build
npx prisma migrate deploy   # or: docker compose exec app npx prisma migrate deploy
```

Put a reverse proxy (Caddy or nginx) in front of port 3000 for HTTPS.

## The `/health` contract

Every monitored backend that wants BACKEND + DATABASE layer checks (not just
FRONTEND + SSL) must expose an endpoint returning this JSON shape with
HTTP 200:

```json
{
  "status": "ok",
  "checks": {
    "db": { "status": "ok", "latency_ms": 12 },
    "cache": { "status": "ok", "latency_ms": 3 }
  },
  "latency_ms": 15,
  "version": "1.4.2"
}
```

Rules that make it trustworthy:

- `status` is `"ok"`, `"degraded"`, or `"error"` — the worst status among the checks.
- Each check actually exercises the dependency (`SELECT 1` for the db, a real `PING` for cache) — never hardcode `"ok"`.
- Return HTTP 200 even when a dependency is down (with `"status": "error"` in the body). Reserve non-200 for "the backend itself cannot respond."
- Keep it fast: under ~500ms total, with a short timeout per dependency so a hung database can't hang the endpoint.
- Protect it with a bearer token (`Authorization: Bearer <token>`) so outsiders can't map your infrastructure — put the same token in Pulse's site settings.

Static sites with no backend skip this entirely — add them in Settings with
only the frontend URL, and Pulse still covers FRONTEND + SSL.

## Rollout checklist per project you add

1. Add a `/health` endpoint (see the contract above).
2. One block per real dependency in `checks` — database, cache, external
   payment API, file storage, whatever the app actually needs to function.
3. Generate a token (`openssl rand -hex 24`), set it as that project's
   `HEALTH_TOKEN` env var.
4. Deploy, then verify: `curl -H "Authorization: Bearer <token>" https://yoursite.tld/health`
5. In Pulse → Settings → Add site: name, frontend URL, health URL, token,
   interval.
6. Kill a dependency on staging and confirm Pulse flags it with the real
   error string, and the alert arrives.
