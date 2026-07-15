import cron from "node-cron";
import { runAllActiveSiteChecks } from "./runChecks";

const TICK_CRON = "*/10 * * * * *"; // every 10 seconds

/** Local/dev convenience only — runs the same check logic as
 * scripts/run-checks.ts (used by the GitHub Actions schedule in
 * production) on a tight interval, for a live "always-on" feel while
 * developing. Each site's own checkIntervalSeconds still gates how often
 * it's actually checked (see runChecks.ts's isDue). */
export function startWorker(): void {
  cron.schedule(TICK_CRON, () => {
    runAllActiveSiteChecks().catch((err) => console.error("Worker tick failed:", err));
  });
  runAllActiveSiteChecks().catch((err) => console.error("Initial worker tick failed:", err));
}
