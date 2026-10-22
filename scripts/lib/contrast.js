// Contrast check: reads the color tokens from engine/styles/tokens.css and
// checks each pair in scripts/contrast-pairs.json against its minimum ratio
// (WCAG 2.1: 4.5 for body text, 3 for large text, icons and focus rings).

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.js';
import { readText } from './content.js';

export function readTokens(file = path.join(ROOT, 'engine/styles/tokens.css')) {
  const tokens = {};
  for (const m of readText(file).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) tokens[m[1]] = m[2];
  return tokens;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function checkContrast() {
  const tokens = readTokens();
  const pairsFile = path.join(ROOT, 'scripts/contrast-pairs.json');
  const pairs = JSON.parse(fs.readFileSync(pairsFile, 'utf8'));
  const problems = [];
  const report = [];
  for (const pair of pairs) {
    const fg = tokens[pair.fg];
    const bg = tokens[pair.bg];
    if (!fg || !bg) {
      problems.push({ file: 'scripts/contrast-pairs.json', message: `unknown token in pair ${pair.fg} on ${pair.bg}`, rule: 'contrast' });
      continue;
    }
    const r = ratio(fg, bg);
    report.push({ ...pair, ratio: Math.floor(r * 100) / 100 });
    if (r < pair.min) {
      problems.push({ file: 'engine/styles/tokens.css', message: `${pair.fg} on ${pair.bg} is ${r.toFixed(2)}:1, needs ${pair.min}:1 (${pair.use})`, rule: 'contrast' });
    }
  }
  return { problems, report };
}
