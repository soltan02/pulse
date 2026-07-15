import { Layer } from "@prisma/client";
import { prisma } from "../db";
import { runFrontendCheck, runSslCheck, runBackendAndDatabaseChecks, CheckOutcome } from "./runners";
import { evaluateIncident } from "./incidents";

const SSL_CHECK_INTERVAL_MS = 60 * 60 * 1000; // once per hour per site

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

async function checkSite(site: SiteRow): Promise<void> {
  if (await isDue(site.id, "FRONTEND", site.checkIntervalSeconds * 1000)) {
    try {
      const frontend = await runFrontendCheck(site.url);
      await persistCheck(site.id, frontend);
    } catch (err) {
      console.error(`Frontend check crashed for site ${site.id}:`, err);
    }

    if (site.healthUrl) {
      try {
        const { backend, database } = await runBackendAndDatabaseChecks(site.healthUrl, site.authToken);
        await persistCheck(site.id, backend);
        await persistCheck(site.id, database);
      } catch (err) {
        console.error(`Backend/database check crashed for site ${site.id}:`, err);
      }
    }
  }

  if (await isDue(site.id, "SSL", SSL_CHECK_INTERVAL_MS)) {
    try {
      const ssl = await runSslCheck(site.url);
      await persistCheck(site.id, ssl);
    } catch (err) {
      console.error(`SSL check crashed for site ${site.id}:`, err);
    }
  }
}

/** Runs one full round: every active site gets its due checks. Safe to call
 * from a long-lived interval loop or a single fresh process invocation. */
export async function runAllActiveSiteChecks(): Promise<void> {
  const sites = await prisma.site.findMany({ where: { active: true } });
  await Promise.all(sites.map((site) => checkSite(site)));
}
