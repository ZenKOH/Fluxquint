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

async function joinedFragments(directory) {
  const names = (await readdir(path.join(root, directory))).sort();
  const parts = await Promise.all(names.map((name) => readFile(path.join(root, directory, name), 'utf8')));
  return parts.join('');
}

await walk(root);
const required = [
  'index.html', '.nojekyll', 'src/main.js', 'src/styles.css',
  'src/engine/constants.js', 'src/engine/replay.js', 'src/engine/game.js',
  'src/ui/app.js', 'src/engine/game.fragments/00.jsfrag',
  'src/ui/app.fragments/00.jsfrag', 'src/styles.fragments/00.cssfrag',
  'sw.js', 'public/manifest.webmanifest', '.github/workflows/quality.yml',
  '.github/workflows/pages.yml', '.github/workflows/materialise-pages.yml'
];
for (const file of required) {
  if (!files.includes(file)) throw new Error(`Required source missing: ${file}`);
}

const materialised = [
  ['src/engine/game.fragments', 'src/engine/game.js'],
  ['src/ui/app.fragments', 'src/ui/app.js'],
  ['src/styles.fragments', 'src/styles.css']
];
for (const [fragmentDirectory, outputFile] of materialised) {
  const expected = await joinedFragments(fragmentDirectory);
  const actual = await readFile(path.join(root, outputFile), 'utf8');
  if (actual !== expected) {
    throw new Error(`Browser-ready asset is stale: ${outputFile}. Run the materialisation workflow or copy the production build output.`);
  }
}

for (const file of files.filter((name) => name !== 'scripts/check.mjs' && /\.(html|js|mjs|json|md|yml|yaml|cssfrag|jsfrag|webmanifest)$/.test(name))) {
  const content = await readFile(path.join(root, file), 'utf8');
  if (/\bFluxquint\b(?!™)/u.test(content) && !file.includes('ORIGINALITY_AUDIT')) {
    const allowedTechnical = /(ZenKOH\/Fluxquint|github\.com\/ZenKOH\/Fluxquint|zenkoh\.github\.io\/Fluxquint|\/Fluxquint\/|fluxquint-|name:\s*Fluxquint)/;
    const offending = content.split('\n').find((line) => /\bFluxquint\b(?!™)/u.test(line) && !allowedTechnical.test(line));
    if (offending) throw new Error(`Unmarked Fluxquint brand in ${file}: ${offending.trim()}`);
  }
}
console.log(`Fluxquint™ source and Pages deployment validation passed across ${files.length} files.`);
