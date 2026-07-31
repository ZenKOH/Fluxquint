import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.join(process.cwd(), 'dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
createServer(async (request, response) => {
  try {
    const raw = decodeURIComponent(request.url.split('?')[0]);
    const relative = raw === '/' ? 'index.html' : raw.replace(/^\//, '');
    const full = path.join(root, relative);
    const info = await stat(full);
    const file = info.isDirectory() ? path.join(full, 'index.html') : full;
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  }
}).listen(port, () => console.log(`Fluxquint™ development server: http://localhost:${port}`));
