import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(root, "..");
const srcDir = join(projectRoot, "dist", "client");
const publicDir = join(projectRoot, "public");

if (!existsSync(srcDir)) {
  console.error("[copy-spa] dist/client not found — run `npm run build` first.");
  process.exit(1);
}

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
cpSync(srcDir, publicDir, { recursive: true });
console.log("[copy-spa] dist/client -> public");
