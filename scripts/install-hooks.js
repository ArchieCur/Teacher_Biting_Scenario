#!/usr/bin/env node
// Turns on the public-safety commit hooks (runs automatically on `npm install`).
// Points git at scripts/hooks. Says so loudly if it cannot, instead of failing quietly.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib/paths.js';

export function hooksActive() {
  try {
    return execFileSync('git', ['config', 'core.hooksPath'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() === 'scripts/hooks';
  } catch {
    return false;
  }
}

export const HOOK_HELP = `The public-safety commit hook is NOT active, so commits are not being checked.
  Fix: in a terminal in this folder, run   npm run hooks
  If git reports "dubious ownership" (common on USB and exFAT drives), first run:
    git config --global --add safe.directory <this folder's full path, with forward slashes>`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.CI) process.exit(0);
  try {
    execFileSync('git', ['config', 'core.hooksPath', 'scripts/hooks'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    console.warn(`\n${String(err.stderr || err.message).trim()}\n`);
  }
  if (hooksActive()) console.log('Public-safety commit hook is active.');
  else console.warn(`\nWARNING: ${HOOK_HELP}\n`);
}
