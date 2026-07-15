import { prisma } from "../src/db";
import { runAllActiveSiteChecks } from "../src/worker/runChecks";

async function main(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Pulse check run starting...`);
  await runAllActiveSiteChecks();
  console.log(`[${new Date().toISOString()}] Pulse check run complete.`);
}

main()
  .catch((err) => {
    console.error("Pulse check run failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
