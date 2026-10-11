/**
 * Tiny static server with single-page fallback for the exported web builds.
 * Usage: node e2e/serve.mjs <dir> <port>
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const [, , dirArg = 'e2e/.build/web-a', portArg = '4311'] = process.argv;
const root = resolve(dirArg);
const port = Number(portArg);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  let file = normalize(join(root, pathname));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(file) || statSync(file).isDirectory()) {
    const indexInDir = join(file, 'index.html');
    file = existsSync(indexInDir) ? indexInDir : join(root, 'index.html');
  }
  const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} on http://127.0.0.1:${port}`);
});
