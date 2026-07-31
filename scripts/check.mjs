import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'dist', 'node_modules']);
const files = [];

async function walk(directory) {
  for (const name of await readdir(directory)) {
    if (ignored.has(name)) continue;
    const full = path.join(directory, name);
    const info = await stat(full);
    if (info.isDirectory()) await walk(full);
    else files.push(path.relative(root, full));
  }
}

await walk(root);
const required = [
  'index.html', 'src/main.js', 'src/engine/constants.js', 'src/engine/replay.js',
  'src/engine/game.fragments/00.jsfrag', 'src/ui/app.fragments/00.jsfrag',
  'src/styles.fragments/00.cssfrag', 'sw.js', 'public/manifest.webmanifest',
  '.github/workflows/quality.yml', '.github/workflows/pages.yml'
];
for (const file of required) {
  if (!files.includes(file)) throw new Error(`Required source missing: ${file}`);
}
for (const file of files.filter((name) => name !== 'scripts/check.mjs' && /\.(html|js|mjs|json|md|yml|yaml|cssfrag|jsfrag|webmanifest)$/.test(name))) {
  const content = await readFile(path.join(root, file), 'utf8');
  if (/\bFluxquint\b(?!™)/u.test(content) && !file.includes('ORIGINALITY_AUDIT')) {
    const allowedTechnical = /(ZenKOH\/Fluxquint|github\.com\/ZenKOH\/Fluxquint|zenkoh\.github\.io\/Fluxquint|\/Fluxquint\/|fluxquint-|name:\s*Fluxquint)/;
    const offending = content.split('\n').find((line) => /\bFluxquint\b(?!™)/u.test(line) && !allowedTechnical.test(line));
    if (offending) throw new Error(`Unmarked Fluxquint brand in ${file}: ${offending.trim()}`);
  }
}
console.log(`Fluxquint™ source validation passed across ${files.length} files.`);
