// Checks on the built output in docs/: relative paths only (so the folder can
// be dropped into a Storyline package), no external URLs (no CDN, no outbound
// calls), and a size budget per module folder.

import fs from 'node:fs';
import path from 'node:path';
import { rel } from './paths.js';

const MODULE_BUDGET = 250 * 1024;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const isBad = (url) => /^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(url.trim()) && !/^(?:#|mailto:)/i.test(url.trim());

export function checkOutput(outDir) {
  const problems = [];
  if (!fs.existsSync(outDir)) return problems;

  for (const file of walk(outDir)) {
    const ext = path.extname(file);
    if (!['.html', '.css', '.js'].includes(ext)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const found = [];
    if (ext === '.html') for (const m of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']*)["']/gi)) found.push(m[1]);
    if (ext === '.css' || ext === '.html') for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) found.push(m[1]);
    if (ext === '.js' || ext === '.html') for (const m of text.matchAll(/["'`](?:https?:)?\/\/[^"'`\s]+/gi)) found.push(m[0].slice(1));
    for (const url of found) {
      if (isBad(url)) problems.push({ file: rel(file), message: `absolute or external URL "${url}". Built files must use relative paths only`, rule: 'output' });
    }
  }

  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    const dir = path.join(outDir, entry.name);
    if (!entry.isDirectory() || !fs.existsSync(path.join(dir, 'index.html')) || !fs.existsSync(path.join(dir, 'app.js'))) continue;
    const size = walk(dir).reduce((sum, f) => sum + fs.statSync(f).size, 0);
    if (size > MODULE_BUDGET) {
      problems.push({ file: rel(dir), message: `module folder is ${Math.round(size / 1024)} KB; the budget is ${MODULE_BUDGET / 1024} KB`, rule: 'output' });
    }
  }
  return problems;
}

export function moduleSizes(outDir) {
  if (!fs.existsSync(outDir)) return [];
  return fs
    .readdirSync(outDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(outDir, e.name, 'app.js')))
    .map((e) => {
      const files = walk(path.join(outDir, e.name));
      return { id: e.name, kb: Math.round(files.reduce((s, f) => s + fs.statSync(f).size, 0) / 1024) };
    });
}
