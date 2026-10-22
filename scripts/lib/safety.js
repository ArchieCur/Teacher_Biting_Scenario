// Public-safety checks (Handoff 01 section 12, Handoff 03 items 1 and 5).
//
// Banned strings: the list is never committed, because the list itself would
// reveal what it protects. It is read from, in order:
//   1. the BANNED_STRINGS environment variable (one entry per line; CI secret)
//   2. the file named by BANNED_STRINGS_FILE
//   3. .banned-strings.txt at the repo root (git-ignored)
// Matches are reported by file and line only, never by the matched term.
//
// File rules: no Office or PDF files, no image files, and no large files
// outside the built docs/ folder.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.js';

export const LIST_FILE = '.banned-strings.txt';

const OFFICE = new Set(['.doc', '.docx', '.docm', '.dot', '.dotx', '.ppt', '.pptx', '.pptm', '.xls', '.xlsx', '.xlsm', '.odt', '.odp', '.ods', '.rtf', '.pdf', '.pages', '.key', '.numbers']);
const IMAGES = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.bmp', '.tif', '.tiff', '.heic', '.svg', '.ico', '.psd', '.ai', '.eps']);
const BINARY = new Set(['.woff', '.woff2', '.ttf', '.otf', '.zip']);
const SIZE_LIMIT = 300 * 1024;
const SIZE_EXEMPT = new Set(['package-lock.json']);

/** @returns {{ terms: string[], source: string } | null} */
export function loadBannedList(env = process.env) {
  let text = null;
  let source = null;
  if (env.BANNED_STRINGS && env.BANNED_STRINGS.trim()) {
    text = env.BANNED_STRINGS;
    source = 'BANNED_STRINGS environment variable';
  } else {
    const file = env.BANNED_STRINGS_FILE || path.join(ROOT, LIST_FILE);
    if (fs.existsSync(file)) {
      text = fs.readFileSync(file, 'utf8');
      source = env.BANNED_STRINGS_FILE ? 'BANNED_STRINGS_FILE' : LIST_FILE;
    }
  }
  if (text == null) return null;
  const terms = text
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter((t) => t && !t.startsWith('#'))
    .map((t) => t.toLowerCase());
  return terms.length ? { terms, source } : null;
}

/** Line numbers (1-based) where any term appears. Never returns the term. */
export function findBannedLines(text, terms) {
  const lines = text.toLowerCase().split(/\r?\n/);
  const hits = [];
  lines.forEach((line, i) => {
    if (terms.some((t) => line.includes(t))) hits.push(i + 1);
  });
  return hits;
}

/**
 * @param {{ path: string, size: number, read: () => Buffer }[]} files  repo-relative paths with forward slashes
 * @param {string[] | null} terms
 */
export function checkFiles(files, terms) {
  const problems = [];
  for (const f of files) {
    const ext = path.extname(f.path).toLowerCase();
    const base = path.basename(f.path);

    if (base.startsWith('.banned-strings')) {
      problems.push({ file: f.path, message: 'the banned-strings list must never be committed' });
      continue;
    }
    if (OFFICE.has(ext)) problems.push({ file: f.path, message: 'Office and PDF files are not allowed (they carry author names in their properties). Commit a .md version instead' });
    if (IMAGES.has(ext)) problems.push({ file: f.path, message: 'image files are not allowed in this repo (no logos, photos or stickers)' });
    if (!f.path.startsWith('docs/') && !SIZE_EXEMPT.has(f.path) && f.size > SIZE_LIMIT) {
      problems.push({ file: f.path, message: `file is ${Math.round(f.size / 1024)} KB; the limit outside docs/ is ${SIZE_LIMIT / 1024} KB` });
    }
    if (terms) {
      if (findBannedLines(f.path, terms).length) problems.push({ file: f.path, message: 'the file name matches an entry in the banned-strings list' });
      if (!BINARY.has(ext) && !OFFICE.has(ext) && !IMAGES.has(ext)) {
        for (const line of findBannedLines(f.read().toString('utf8'), terms)) {
          problems.push({ file: f.path, line, message: 'matches an entry in the banned-strings list' });
        }
      }
    }
  }
  return problems;
}
