/* 로컬 미리보기 서버 — node scripts/serve.mjs [port] */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'dist';
const PORT = Number(process.argv[2] || process.env.PORT || 4321);
const TYPE = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let file = join(ROOT, p);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch { /* fallthrough */ }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPE[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    try {
      const nf = await readFile(join(ROOT, '404.html'));
      res.writeHead(404, { 'content-type': TYPE['.html'] }); res.end(nf);
    } catch { res.writeHead(404); res.end('Not found'); }
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
