import * as fs from "node:fs";
import * as path from "node:path";

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const cwd = process.cwd();
const srcRoot = path.join(cwd, "src", "workflows", "n8n");
const distRoot = path.join(cwd, "dist", "workflows", "n8n");

copyDir(srcRoot, distRoot);
console.log(`[copyAssets] copied n8n workflows to dist: ${distRoot}`);
