#!/usr/bin/env node
// A tiny local web server for testing (no dependencies). Serves docs/ on
// http://localhost:8080 by default. Only this computer can reach it.
//   npm run serve
//   node scripts/serve.js --dir .dev --port 8081

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/paths.js';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const dir = path.resolve(ROOT, arg('--dir', 'docs'));
const port = Number(arg('--port', process.env.PORT || 8080));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.normalize(path.join(dir, decodeURIComponent(url.pathname)));
  if (file !== dir && !file.startsWith(dir + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${path.relative(ROOT, dir) || '.'}/ at http://localhost:${port}/`);
  console.log(`Storyline harness: http://localhost:${port}/storyline-harness.html`);
  console.log('Press Ctrl+C to stop.');
});
