import { cp, mkdir, rm, readFile, writeFile, readdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

async function joinFragments(directory) {
  const names = (await readdir(directory)).sort();
  const chunks = await Promise.all(names.map((name) => readFile(path.join(directory, name), 'utf8')));
  return chunks.join('');
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const item of ['index.html', 'sw.js', 'src', 'public']) {
  await cp(path.join(root, item), path.join(dist, item), { recursive: true });
}

await writeFile(path.join(dist, 'src/engine/game.js'), await joinFragments(path.join(root, 'src/engine/game.fragments')));
await writeFile(path.join(dist, 'src/ui/app.js'), await joinFragments(path.join(root, 'src/ui/app.fragments')));
await writeFile(path.join(dist, 'src/styles.css'), await joinFragments(path.join(root, 'src/styles.fragments')));
await rm(path.join(dist, 'src/engine/game.fragments'), { recursive: true, force: true });
await rm(path.join(dist, 'src/ui/app.fragments'), { recursive: true, force: true });
await rm(path.join(dist, 'src/styles.fragments'), { recursive: true, force: true });

const html = await readFile(path.join(dist, 'index.html'), 'utf8');
if (!html.includes('Fluxquint™')) throw new Error('Brand validation failed: Fluxquint™ is missing from index.html.');
for (const required of ['src/main.js', 'src/engine/game.js', 'src/ui/app.js', 'src/styles.css', 'public/manifest.webmanifest', 'public/icon-192.png']) {
  await access(path.join(dist, required), constants.R_OK);
}
console.log('Fluxquint™ production build created in dist/.');
