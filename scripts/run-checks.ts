import { runChecks } from "../src/monitor";

// Run once and exit (for GitHub Actions / local one-shot use)
runChecks()
  .catch((err) => {
    console.error("[run-checks] Fatal error:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
