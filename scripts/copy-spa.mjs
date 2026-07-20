import fs from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "dist");
const dst = path.join(process.cwd(), "public");

if (fs.existsSync(dst)) {
  fs.rmSync(dst, { recursive: true, force: true });
}

if (!fs.existsSync(src)) {
  console.error(`Source directory not found: ${src}. Did vite build succeed?`);
  process.exit(1);
}

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
console.log(`✓ Copied SPA from ${src} to ${dst}`);
