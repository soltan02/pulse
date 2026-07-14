import { Layer } from "@prisma/client";
import { prisma } from "../db";
import { sendAlerts } from "../alerts";

const CONFIRMATION_COUNT = 2;

/** Call after inserting a new Check row — looks at recent history for that
 * (site, layer) pair and opens/resolves an Incident once 2 consecutive
 * checks confirm a transition, guarding against single-check flapping. */
export async function evaluateIncident(siteId: string, layer: Layer): Promise<void> {
  const recentChecks = await prisma.check.findMany({
    where: { siteId, layer },
    orderBy: { timestamp: "desc" },
    take: CONFIRMATION_COUNT,
  });

  if (recentChecks.length < CONFIRMATION_COUNT) return;

  const allDown = recentChecks.every((c) => c.status === "DOWN");
  const allUp = recentChecks.every((c) => c.status === "UP");

  const openIncident = await prisma.incident.findFirst({
    where: { siteId, layer, resolvedAt: null },
    orderBy: { startedAt: "desc" },
  });

  if (allDown && !openIncident) {
    const site = await prisma.site.findUniqueOrThrow({ where: { id: siteId } });
    const firstError = recentChecks[recentChecks.length - 1]?.errorMessage ?? "unknown error";
    const incident = await prisma.incident.create({
      data: { siteId, layer, firstError },
    });
    await sendAlerts({
      kind: "opened",
      site: { id: site.id, name: site.name },
      layer,
      firstError,
      incidentId: incident.id,
      startedAt: incident.startedAt,
    });
    await prisma.incident.update({ where: { id: incident.id }, data: { notified: true } });
    return;
  }

  if (allUp && openIncident) {
    const site = await prisma.site.findUniqueOrThrow({ where: { id: siteId } });
    await prisma.incident.update({ where: { id: openIncident.id }, data: { resolvedAt: new Date() } });
    await sendAlerts({
      kind: "resolved",
      site: { id: site.id, name: site.name },
      layer,
      firstError: openIncident.firstError,
      incidentId: openIncident.id,
      startedAt: openIncident.startedAt,
    });
  }
}
