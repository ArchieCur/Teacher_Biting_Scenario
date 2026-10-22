import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT } from '../../scripts/lib/paths.js';
import { loadModule, renderPolicy } from '../../scripts/lib/content.js';
import { checkGraph } from '../../scripts/lib/graph.js';
import { checkLanguage, checkNames, checkFormSource } from '../../scripts/lib/language.js';
import { checkContrast, ratio } from '../../scripts/lib/contrast.js';
import { checkFiles, findBannedLines, loadBannedList } from '../../scripts/lib/safety.js';

const broken = loadModule(path.join(ROOT, 'tests/fixtures/broken-module'));
const has = (problems, pattern) => problems.some((p) => pattern.test(p.message));
const messages = (problems) => problems.map((p) => `${p.file}:${p.line} ${p.message}`).join('\n');

test('the broken fixture loads (schema-valid) so the other checks can run', () => {
  assert.deepEqual(broken.errors, []);
  assert.ok(broken.content);
});

test('graph: catches missing targets, unreachable nodes, dead ends, loops and variant defaults', () => {
  const problems = checkGraph(broken);
  const text = messages(problems);
  assert.ok(has(problems, /next "missing" does not exist/), text);
  assert.ok(has(problems, /"stuck" can never be reached/), text);
  assert.ok(has(problems, /"stuck" has no choices and no next/), text);
  assert.ok(has(problems, /loop: b -> c -> b/), text);
  assert.ok(has(problems, /last variant in this list needs no "when"/), text);
  assert.ok(has(problems, /"d" can never be reached/), text);
});

test('graph: catches flag problems in both directions', () => {
  const problems = checkGraph(broken);
  assert.ok(has(problems, /flag "neverSet" is never set/));
  assert.ok(has(problems, /flag "neverRead" is set but never read/));
  assert.ok(has(problems, /flag "undeclared" is not declared/));
  assert.ok(has(problems, /no choice is visible when hidden=false/));
});

test('graph: catches bad form fills', () => {
  const problems = checkGraph(broken);
  assert.ok(has(problems, /form field "nowhere" does not exist/));
  assert.ok(has(problems, /"Maybe" is not an option of "skin"/));
});

test('graph: problems point at a file and line', () => {
  const problem = checkGraph(broken).find((p) => /next "missing"/.test(p.message));
  assert.equal(problem.file, 'tests/fixtures/broken-module/scenes/s.yaml');
  assert.equal(problem.line, 21);
});

test('language: banned feedback wording is scoped to outcome labels and debriefs', () => {
  const { problems } = checkLanguage(broken);
  const text = messages(problems);
  assert.ok(has(problems, /avoid "good job" in outcome labels/), text);
  assert.ok(has(problems, /no exclamation marks in outcome labels/), text);
  assert.ok(has(problems, /avoid "well done" in debriefs/), text);
  assert.ok(has(problems, /avoid "perfect" in debriefs/), text);
  // "You can correct section 4 later" is the verb, in a consequence: allowed.
  assert.ok(!has(problems, /correct/), text);
});

test('language: emoji and italic markup are caught', () => {
  const { problems } = checkLanguage(broken);
  assert.ok(has(problems, /emoji in consequence/));
  assert.ok(has(problems, /italic or underline markup in why/));
});

test('names: undeclared initials and likely names are caught; declared ones are not', () => {
  const problems = checkNames(broken);
  const text = messages(problems);
  assert.ok(has(problems, /initials "B\.Z\." are not in the characters list/), text);
  assert.ok(has(problems, /"Maria" in consequence looks like a name/), text);
  assert.ok(!has(problems, /"Then"/), text);
  // A form option ("No") is not a name; a word after sentence-ending initials starts a sentence;
  // an undeclared adult after "Ms." is still caught.
  assert.ok(!has(problems, /"No"/), text);
  assert.ok(has(problems, /"Rivera" in consequence/), text);
});

test('form: labels must appear in the source form', () => {
  const problems = checkFormSource(broken);
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /A label the source form does not have/);
});

test('policy rendering: front matter and change log removed, emphasis made semibold, headings shifted', () => {
  const html = renderPolicy('---\ntitle: x\n---\n\n# Title\n\nParents of *both* children.\n\n---\n\n## Change log\n\n| a |\n');
  assert.match(html, /<h3>Title<\/h3>/);
  assert.match(html, /<strong>both<\/strong>/);
  assert.doesNotMatch(html, /Change log|title: x|<em>/);
});

test('contrast: the palette passes and the ratios match Handoff 01', () => {
  assert.deepEqual(checkContrast().problems, []);
  assert.equal(Math.round(ratio('#243A78', '#FFFFFF') * 100) / 100, 10.76);
  assert.equal(Math.round(ratio('#FFFFFF', '#4560D2') * 100) / 100, 5.44);
});

test('safety: reports file and line, never the matched term', () => {
  const files = [
    { path: 'notes.md', size: 10, read: () => Buffer.from('fine\nThe Secret Org was here\n') },
    { path: 'Sources/Policy.docx', size: 10, read: () => Buffer.from('') },
    { path: 'logo.png', size: 10, read: () => Buffer.from('') },
    { path: '.banned-strings.txt', size: 10, read: () => Buffer.from('') },
    { path: 'big.json', size: 400 * 1024, read: () => Buffer.from('{}') },
    { path: 'docs/biting-incident/app.js', size: 400 * 1024, read: () => Buffer.from('ok') },
  ];
  const problems = checkFiles(files, ['secret org']);
  const text = JSON.stringify(problems);
  assert.ok(problems.some((p) => p.file === 'notes.md' && p.line === 2));
  assert.ok(problems.some((p) => p.file === 'Sources/Policy.docx' && /Office/.test(p.message)));
  assert.ok(problems.some((p) => p.file === 'logo.png'));
  assert.ok(problems.some((p) => p.file === '.banned-strings.txt'));
  assert.ok(problems.some((p) => p.file === 'big.json'));
  assert.ok(!problems.some((p) => p.file.startsWith('docs/') && /KB/.test(p.message)));
  assert.doesNotMatch(text, /secret/i);
});

test('safety: list comes from the environment first; comments and blanks are ignored', () => {
  const list = loadBannedList({ BANNED_STRINGS: '# comment\n\n Alpha \nbeta\n' });
  assert.deepEqual(list.terms, ['alpha', 'beta']);
  assert.deepEqual(findBannedLines('x\nALPHA here', list.terms), [2]);
  assert.equal(loadBannedList({ BANNED_STRINGS_FILE: path.join(ROOT, 'no-such-file') }), null);
});
