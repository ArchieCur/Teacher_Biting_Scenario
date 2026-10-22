#!/usr/bin/env node
// Fails if docs/ does not match a fresh build of the sources, so the committed
// output can never drift from engine/ and modules/.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './lib/paths.js';
import { buildAll } from './build.js';

function listFiles(dir, base = dir, out = new Map()) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, base, out);
    else out.set(path.relative(base, full).split(path.sep).join('/'), full);
  }
  return out;
}

const docs = path.join(ROOT, 'docs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'scenario-fresh-'));
const fresh = path.join(temp, 'docs');

try {
  await buildAll({ outDir: fresh, quiet: true });
  if (!fs.existsSync(docs)) {
    console.error('docs/ does not exist. Run: npm run build');
    process.exit(1);
  }
  const want = listFiles(fresh);
  const have = listFiles(docs);
  const diffs = [];
  for (const [file, full] of want) {
    if (!have.has(file)) diffs.push(`missing: docs/${file}`);
    else if (!fs.readFileSync(full).equals(fs.readFileSync(have.get(file)))) diffs.push(`out of date: docs/${file}`);
  }
  for (const file of have.keys()) if (!want.has(file)) diffs.push(`extra: docs/${file}`);

  if (diffs.length) {
    console.error(`docs/ is not up to date with the sources:\n  ${diffs.join('\n  ')}\nRun: npm run build, then commit docs/.`);
    process.exit(1);
  }
  console.log('docs/ is up to date.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
