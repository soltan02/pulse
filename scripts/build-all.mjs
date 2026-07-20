import fs from "node:fs";
import path from "node:path";

// 1. Build SPA
const { execSync } = await import("node:child_process");
execSync("npx tsc -p tsconfig.json", { stdio: "inherit" });
execSync("npx vite build", { stdio: "inherit" });

// 2. Copy SPA to public
const src = path.join(process.cwd(), "dist", "client");
const dst = path.join(process.cwd(), "public");
if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });

function copyRecursive(srcDir, dstDir) {
  fs.readdirSync(srcDir).forEach((file) => {
    const srcPath = path.join(srcDir, file);
    const dstPath = path.join(dstDir, file);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.mkdirSync(dstPath, { recursive: true });
      copyRecursive(srcPath, dstPath);
    } else {
      const destFile = file === "index.html" ? "spa.html" :
                       file === "favicon.svg" ? "pulse-favicon.svg" :
                       file === "robots.txt" ? "pulse-robots.txt" : file;
      const finalDst = path.join(dstDir, destFile);
      if (stat.isDirectory()) {
        copyRecursive(srcPath, finalDst);
      } else {
        fs.copyFileSync(srcPath, finalDst);
      }
    }
  });
}
copyRecursive(src, dst);

// 3. Compile API to JavaScript in api/ directory
const apiSrc = path.join(process.cwd(), "src", "server");
const apiDst = path.join(process.cwd(), "api", "src-server");
if (fs.existsSync(apiDst)) fs.rmSync(apiDst, { recursive: true, force: true });
fs.mkdirSync(apiDst, { recursive: true });

function copyServerFiles(srcDir, dstDir) {
  fs.readdirSync(srcDir).forEach((file) => {
    const srcPath = path.join(srcDir, file);
    const dstPath = path.join(dstDir, file);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.mkdirSync(dstPath, { recursive: true });
      copyServerFiles(srcPath, dstPath);
    } else if (file.endsWith(".ts")) {
      // Copy TS files — Vercel will compile them
      fs.copyFileSync(srcPath, dstPath);
    }
  });
}
copyServerFiles(apiSrc, apiDst);

console.log("✓ Build complete");
