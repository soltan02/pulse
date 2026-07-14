import { config } from "./config";
import { buildApp } from "./server/app";
import { startWorker } from "./worker/scheduler";

async function main(): Promise<void> {
  const app = await buildApp();
  await app.listen({ port: config.port, host: "0.0.0.0" });
  startWorker();
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
