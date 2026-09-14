import { readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["dist/index.js", "dist/index.cjs"];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KiB`;
}

let missing = false;
for (const rel of files) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    console.error(`Missing ${rel}. Run npm run build first.`);
    missing = true;
    continue;
  }
  const raw = readFileSync(path);
  const gzip = gzipSync(raw);
  console.log(`${rel}`);
  console.log(`  raw:  ${formatBytes(raw.length)} (${raw.length} bytes)`);
  console.log(`  gzip: ${formatBytes(gzip.length)} (${gzip.length} bytes)`);
}

if (missing) process.exit(1);
