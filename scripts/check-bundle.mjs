import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const limit = 500 * 1024;
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(js|css)$/.test(name)) files.push({ path, bytes: stat.size });
  }
}
walk('dist');
const oversized = files.filter((file) => file.bytes > limit);
if (oversized.length) {
  throw new Error('Bundle budget exceeded: ' + JSON.stringify(oversized));
}
console.log(JSON.stringify({ checked: files.length, maxBytes: Math.max(...files.map((f) => f.bytes), 0), limit }));
