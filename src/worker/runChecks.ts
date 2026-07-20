import { Layer } from "@prisma/client";
import { prisma } from "../db";
import { runFrontendCheck, runSslCheck, runBackendAndDatabaseChecks, CheckOutcome } from "./runners";
import { evaluateIncident } from "./incidents";

const SSL_CHECK_INTERVAL_MS = 60 * 60 * 1000; // once per hour per site
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2_000;

interface SiteRow {
  id: string;
  url: string;
  healthUrl: string | null;
  authToken: string | null;
  checkIntervalSeconds: number;
}

async function persistCheck(siteId: string, outcome: CheckOutcome): Promise<void> {
  await prisma.check.create({
    data: {
      siteId,
      layer: outcome.layer as Layer,
      status: outcome.status,
      latencyMs: outcome.latencyMs,
      httpStatus: outcome.httpStatus,
      errorMessage: outcome.errorMessage,
    },
  });
  await evaluateIncident(siteId, outcome.layer as Layer);
}

/** Derives "is this due" from the most recent stored Check row rather than
 * in-memory state, so cadence is correct whether this runs in a long-lived
 * process (local dev's setInterval loop) or a fresh process every time
 * (a GitHub Actions schedule, with no memory between runs). */
async function isDue(siteId: string, layer: Layer, intervalMs: number): Promise<boolean> {
  const last = await prisma.check.findFirst({ where: { siteId, layer }, orderBy: { timestamp: "desc" } });
  if (!last) return true;
  return Date.now() - last.timestamp.getTime() >= intervalMs;
}

/** Runs an async function with exponential-backoff retries for transient
 * failures. The function itself decides what counts as a transient error
 * (e.g. timeout, connection refused); we retry anything that throws. */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[${label}] attempt ${attempt + 1}/${MAX_RETRIES + 1} failed, retrying in ${delay}ms:`, (err as Error)?.message ?? err);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error(`[${label}] all ${MAX_RETRIES + 1} attempts failed:`, (lastErr as Error)?.message ?? lastErr);
  return null;
}

async function checkSite(site: SiteRow): Promise<void> {
  if (await isDue(site.id, "FRONTEND", site.checkIntervalSeconds * 1000)) {
    const frontend = await withRetry(
      () => runFrontendCheck(site.url),
      `frontend:${site.id}`,
    );
    if (frontend) await persistCheck(site.id, frontend);
    else console.error(`Frontend check failed for site ${site.id} after retries`);

    if (site.healthUrl) {
      const backendDb = await withRetry(
        () => runBackendAndDatabaseChecks(site.healthUrl!, site.authToken!),
        `backend-db:${site.id}`,
      );
      if (backendDb) {
        await persistCheck(site.id, backendDb.backend);
        await persistCheck(site.id, backendDb.database);
      } else {
        console.error(`Backend/database check failed for site ${site.id} after retries`);
      }
    }
  }

  if (await isDue(site.id, "SSL", SSL_CHECK_INTERVAL_MS)) {
    const ssl = await withRetry(
      () => runSslCheck(site.url),
      `ssl:${site.id}`,
    );
    if (ssl) await persistCheck(site.id, ssl);
    else console.error(`SSL check failed for site ${site.id} after retries`);
  }
}

/** Runs one full round: every active site gets its due checks. Safe to call
 * from a long-lived interval loop or a single fresh process invocation. */
export async function runAllActiveSiteChecks(): Promise<void> {
  const sites = await prisma.site.findMany({ where: { active: true } });
  await Promise.all(sites.map((site) => checkSite(site)));
}
