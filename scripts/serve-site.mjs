import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendFile } from './send-file.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist-site');
const base = '/react-learn/';
const fallback = path.join(root, 'react-learn', '404.html');
const port = 4173;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

async function resolveFile(pathname) {
  try {
    const candidate = path.join(root, decodeURIComponent(pathname));
    if (candidate !== root && !candidate.startsWith(root + path.sep)) return null;
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
    if (info.isDirectory()) {
      const index = path.join(candidate, 'index.html');
      if ((await stat(index)).isFile()) return index;
    }
  } catch {
    return null;
  }
  return null;
}

function send(res, file) {
  const contentType = types[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  sendFile(res, file, contentType);
}

await stat(fallback).catch(() => {
  console.error('dist-site is missing. Run pnpm build first.');
  process.exit(1);
});

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (!pathname.startsWith(base)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  send(res, (await resolveFile(pathname)) ?? fallback);
}).listen(port, () => {
  console.log(`Serving dist-site at http://localhost:${port}${base}`);
});
