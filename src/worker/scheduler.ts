import cron from "node-cron";
import { Layer } from "@prisma/client";
import { prisma } from "../db";
import { runFrontendCheck, runSslCheck, runBackendAndDatabaseChecks, CheckOutcome } from "./runners";
import { evaluateIncident } from "./incidents";

const TICK_CRON = "*/10 * * * * *"; // every 10 seconds
const SSL_CHECK_INTERVAL_MS = 60 * 60 * 1000; // once per hour per site

const lastFullCheckAt = new Map<string, number>();
const lastSslCheckAt = new Map<string, number>();

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

async function checkSite(site: SiteRow): Promise<void> {
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

  const lastSsl = lastSslCheckAt.get(site.id) ?? 0;
  if (Date.now() - lastSsl >= SSL_CHECK_INTERVAL_MS) {
    lastSslCheckAt.set(site.id, Date.now());
    try {
      const ssl = await runSslCheck(site.url);
      await persistCheck(site.id, ssl);
    } catch (err) {
      console.error(`SSL check crashed for site ${site.id}:`, err);
    }
  }
}

async function tick(): Promise<void> {
  const sites = await prisma.site.findMany({ where: { active: true } });
  const now = Date.now();

  await Promise.all(
    sites.map((site) => {
      const last = lastFullCheckAt.get(site.id) ?? 0;
      if (now - last < site.checkIntervalSeconds * 1000) return Promise.resolve();
      lastFullCheckAt.set(site.id, now);
      return checkSite(site);
    })
  );
}

export function startWorker(): void {
  cron.schedule(TICK_CRON, () => {
    tick().catch((err) => console.error("Worker tick failed:", err));
  });
  tick().catch((err) => console.error("Initial worker tick failed:", err));
}
