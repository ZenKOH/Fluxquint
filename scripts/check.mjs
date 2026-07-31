import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const excluded = new Set(['.git', 'dist', 'node_modules']);
const textExtensions = new Set(['.html', '.js', '.css', '.md', '.json', '.yml', '.yaml', '.webmanifest']);
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (textExtensions.has(path.extname(entry.name)) || entry.name === 'LICENSE') files.push(full);
  }
}
await walk(root);
let failed = false;
for (const file of files) {
  const content = await readFile(file, 'utf8');
  if (content.includes('FLUXQUINT') && !file.endsWith('check.mjs')) {
    console.error(`Use the approved Fluxquint™ brand form instead of FLUXQUINT in ${path.relative(root, file)}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`Checked ${files.length} source files. Fluxquint™ brand validation passed.`);
