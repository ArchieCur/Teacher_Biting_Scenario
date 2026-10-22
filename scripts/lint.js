#!/usr/bin/env node
// Runs every check that does not need a browser:
//   content (schema, graph, language, child names, form labels), contrast,
//   built output (relative paths, no external URLs, size budget), public safety.
// Exits with an error if anything fails. Reading-level notes are warnings only.

import path from 'node:path';
import { ROOT, formatProblems, rel } from './lib/paths.js';
import { listModules, loadModule, loadStrings } from './lib/content.js';
import { checkGraph } from './lib/graph.js';
import { checkLanguage, checkNames, checkFormSource } from './lib/language.js';
import { checkContrast } from './lib/contrast.js';
import { checkOutput } from './lib/output.js';
import { runSafety, MISSING_LIST } from './check-public-safety.js';
import { hooksActive, HOOK_HELP } from './install-hooks.js';

const sections = [];
const warnings = [];
const add = (title, problems) => sections.push({ title, problems });

for (const dir of listModules()) {
  const loaded = loadModule(dir);
  const name = rel(dir);
  if (!loaded.content) {
    add(`${name}: content files`, loaded.errors);
    continue;
  }
  add(`${name}: content files`, loaded.errors);
  add(`${name}: graph and flags`, checkGraph(loaded));
  const language = checkLanguage(loaded, { strings: loadStrings(loaded.content.lang) });
  add(`${name}: language`, language.problems);
  warnings.push(...language.warnings);
  add(`${name}: children by initials (heuristic)`, checkNames(loaded));
  add(`${name}: form matches the source form`, checkFormSource(loaded));
}

const contrast = checkContrast();
add('contrast', contrast.problems);
add('built output in docs/', checkOutput(path.join(ROOT, 'docs')));

const safety = runSafety('--all');
add('public safety', safety.problems);
if (!process.env.CI && !hooksActive()) add('public-safety commit hook', [{ file: 'scripts/hooks', message: HOOK_HELP }]);

let failed = false;
for (const { title, problems } of sections) {
  if (problems.length) {
    failed = true;
    console.error(`\n✗ ${title}\n${formatProblems(problems)}`);
  } else {
    console.log(`✓ ${title}`);
  }
}
if (safety.listMissing) {
  failed = true;
  console.error(`\n✗ public safety\n${MISSING_LIST}`);
}
if (warnings.length) console.warn(`\nWarnings (not failures):\n${formatProblems(warnings)}`);

if (failed) {
  console.error('\nLint failed.');
  process.exit(1);
}
console.log('\nLint passed.');
