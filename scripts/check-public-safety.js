#!/usr/bin/env node
// Public-safety check.
//   --staged          files staged for commit (the pre-commit hook)
//   --message <file>  a commit message (the commit-msg hook)
//   --all             every file git would commit: tracked plus untracked, not ignored (lint and CI)
// Fails closed: if the banned-strings list is missing, the check fails.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, formatProblems } from './lib/paths.js';
import { loadBannedList, checkFiles, findBannedLines, LIST_FILE } from './lib/safety.js';

function git(args, options = {}) {
  return execFileSync('git', args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, ...options });
}

function splitZ(buffer) {
  return buffer.toString('utf8').split('\0').filter(Boolean);
}

function stagedFiles() {
  return splitZ(git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'])).map((p) => {
    const blob = git(['show', `:${p}`]);
    return { path: p, size: blob.length, read: () => blob };
  });
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Without git, skip what .gitignore would skip (including the private list itself).
    if (['.git', 'node_modules', '.dev', 'test-results', 'playwright-report'].includes(entry.name) || entry.name.startsWith('.banned-strings')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export function allFiles() {
  let paths;
  try {
    paths = splitZ(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    paths = walk(ROOT).map((f) => path.relative(ROOT, f).split(path.sep).join('/'));
  }
  return [...new Set(paths)]
    .filter((p) => fs.existsSync(path.join(ROOT, p)))
    .map((p) => {
      const full = path.join(ROOT, p);
      return { path: p, size: fs.statSync(full).size, read: () => fs.readFileSync(full) };
    });
}

const MISSING_LIST = `The banned-strings list was not found, so the public-safety check cannot run.
  Locally: create ${LIST_FILE} in the repo folder, one entry per line (it is git-ignored).
  On GitHub: add a repository secret named BANNED_STRINGS with the same lines.`;

/** @returns {{ problems: object[], listMissing: boolean }} */
export function runSafety(mode = '--all', arg) {
  const list = loadBannedList();
  if (mode === '--message') {
    const text = fs
      .readFileSync(arg, 'utf8')
      .split(/\r?\n/)
      .filter((l) => !l.startsWith('#'))
      .join('\n');
    const problems = list ? findBannedLines(text, list.terms).map((line) => ({ file: 'commit message', line, message: 'matches an entry in the banned-strings list' })) : [];
    return { problems, listMissing: !list };
  }
  const files = mode === '--staged' ? stagedFiles() : allFiles();
  return { problems: checkFiles(files, list ? list.terms : null), listMissing: !list };
}

export { MISSING_LIST };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || '--all';
  const { problems, listMissing } = runSafety(mode, process.argv[3]);
  if (problems.length) {
    console.error('Public-safety check failed:');
    console.error(formatProblems(problems));
  }
  if (listMissing) console.error(MISSING_LIST);
  if (problems.length || listMissing) process.exit(1);
  if (mode !== '--message') console.log('Public-safety check passed.');
}
