// Language checks on learner-visible text (Handoff 01 section 8, Handoff 03 C7):
//   - feedback wording: no "correct!", "wrong", "good job"... in outcome labels,
//     debriefs and the wrap (scoped so the verb "correct section 4" is fine)
//   - no exclamation marks in outcome labels, debriefs or the wrap
//   - no emoji anywhere
//   - no italic or underline markup in scene or module text
//   - children by initials only (a heuristic: capitalized words that are not
//     declared characters or allowed words are flagged)
//   - reading level: a warning above grade 9
// And the form check: every form section title, field label, group and
// option in module.yaml must appear in the source form file.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.js';
import { isVariantList } from '../../engine/src/conditions.js';
import { readText } from './content.js';

const BANNED_FEEDBACK = [
  [/\bcorrect\s*!/i, 'Correct!'],
  [/\b(?:that's|that is|you're|you are|this is|is)\s+(?:\w+\s+)?correct\b/i, 'is correct'],
  [/\bcorrect\s+(?:answer|choice|response|move)\b/i, 'correct answer'],
  [/\bincorrect\b/i, 'incorrect'],
  [/\bwrong\b/i, 'wrong'],
  [/\bmistakes?\b/i, 'mistake'],
  [/\bgood\s+(?:job|call|work|choice)\b/i, 'good job'],
  [/\bgreat\s+(?:job|call|work|choice)\b/i, 'great choice'],
  [/\bwell\s+done\b/i, 'well done'],
  [/\bexactly\s+right\b/i, 'exactly right'],
  [/\b(?:got it|got that)\s+right\b/i, 'got it right'],
  [/\bnailed\s+it\b/i, 'nailed it'],
  [/\bperfect\b/i, 'perfect'],
  [/\bawesome\b/i, 'awesome'],
];

const EMOJI = /\p{Extended_Pictographic}/u;
const UNDERLINE_OR_ITALIC_TAG = /<\/?(?:i|em|u|cite)\b/i;
const SINGLE_STAR = /(^|[^*\w])\*(?!\*)[^*\n]+?\*(?!\*)/;
const UNDERSCORE = /(^|[^\w])_[^_\n]+_(?!\w)/;

/** Visit every learner-visible string in the module with its location and scope. */
export function walkTexts(loaded, visit) {
  const { content, locate, moduleSource } = loaded;
  const each = (value, where, scope, field) => {
    if (value == null) return;
    if (isVariantList(value)) {
      value.forEach((v, i) => each(v.text ?? v.value, { ...where }, scope, `${field}[${i}]`));
      return;
    }
    if (Array.isArray(value)) value.forEach((v) => each(v, where, scope, field));
    else if (typeof value === 'string') visit(value, { where, scope, field });
  };

  const m = moduleSource.data;
  const modWhere = (p) => ({ file: moduleSource.file, line: moduleSource.lineOf(p) });
  each(m.title, modWhere(['title']), 'module', 'title');
  each(m.disclosure, modWhere(['disclosure']), 'module', 'disclosure');
  each(m.intro?.heading, modWhere(['intro', 'heading']), 'module', 'intro');
  each(m.intro?.body, modWhere(['intro', 'body']), 'module', 'intro');

  for (const source of loaded.sceneSources) {
    for (const key of ['title', 'clock', 'place']) each(source.data[key], { file: source.file, line: source.lineOf([key]) }, 'scene', key);
  }

  for (const node of Object.values(content.nodes)) {
    const scope = node.type === 'debrief' || node.type === 'wrap' ? 'debrief' : 'node';
    const id = node.id;
    for (const key of ['heading', 'body', 'prompt', 'line', 'speaker', 'summary']) each(node[key], locate(id, [key]), scope, key);
    each(node.sections?.laterNote, locate(id, ['sections', 'laterNote']), scope, 'laterNote');
    if (node.monday) {
      each(node.monday.title, locate(id, ['monday', 'title']), scope, 'monday');
      node.monday.items.forEach((item, i) => {
        each(item.do, locate(id, ['monday', 'items', i, 'do']), scope, 'monday');
        each(item.say, locate(id, ['monday', 'items', i, 'say']), scope, 'monday');
      });
    }
    (node.choices || []).forEach((choice, j) => {
      for (const key of ['label', 'consequence', 'why', 'say']) each(choice[key], locate(id, ['choices', j, key]), 'choice', key);
      each(choice.outcomeLabel, locate(id, ['choices', j, 'outcomeLabel']), 'outcomeLabel', 'outcomeLabel');
      for (const [field, value] of Object.entries(choice.fill || {})) each(value, locate(id, ['choices', j, 'fill', field]), 'choice', 'fill');
    });
  }
}

export function checkLanguage(loaded, { strings } = {}) {
  const problems = [];
  const warnings = [];

  const checkOne = (text, { where, scope, field }) => {
    if (EMOJI.test(text)) problems.push({ ...where, message: `emoji in ${field}. Use an icon in the engine instead`, rule: 'language' });
    if (UNDERLINE_OR_ITALIC_TAG.test(text) || SINGLE_STAR.test(text) || UNDERSCORE.test(text)) {
      problems.push({ ...where, message: `italic or underline markup in ${field}. Use **double asterisks** for semibold emphasis`, rule: 'language' });
    }
    if (scope === 'outcomeLabel' || scope === 'debrief') {
      for (const [pattern, label] of BANNED_FEEDBACK) {
        if (pattern.test(text)) problems.push({ ...where, message: `feedback wording rule: avoid "${label}" in ${scope === 'outcomeLabel' ? 'outcome labels' : 'debriefs and the wrap'}`, rule: 'language' });
      }
      if (text.includes('!')) problems.push({ ...where, message: `no exclamation marks in ${scope === 'outcomeLabel' ? 'outcome labels' : 'debriefs and the wrap'}`, rule: 'language' });
    }
    if (['body', 'consequence', 'why'].includes(field) || field.startsWith('body[')) {
      const grade = gradeLevel(text);
      if (grade !== null && grade > 9) warnings.push({ ...where, message: `reading level about grade ${grade.toFixed(1)} in ${field} (target 6 to 8)`, rule: 'reading-level' });
    }
  };

  walkTexts(loaded, checkOne);

  // Quoted policy words in "Why" text must match the policy exactly (Handoff 01a section 3).
  // A quote counts as a policy quote when it follows a policy reference closely
  // ("Step 4 says to talk "gently and privately.""); other quotes are speech.
  const policyFile = loaded.module.policy && path.join(loaded.moduleDir, loaded.module.policy.file);
  if (policyFile && fs.existsSync(policyFile)) {
    const policy = normalize(readText(policyFile));
    walkTexts(loaded, (text, { where, field }) => {
      if (field !== 'why' && !field.startsWith('why[')) return;
      for (const m of text.matchAll(/["“]([^"”]+)["”]/g)) {
        const quote = m[1].replace(/[.,;:!?]+$/, '');
        const before = text.slice(Math.max(0, m.index - 40), m.index);
        const citesPolicy = /\b(?:says|asks|requires|states|reads|policy|step \d)\b[^"“.]{0,20}$/i.test(before);
        if (citesPolicy && quote.split(/\s+/).length >= 2 && !policy.includes(normalize(quote))) {
          problems.push({ ...where, message: `quoted words "${quote}" are not in the policy word for word`, rule: 'quotes' });
        }
      }
    });
  }

  // Guessing by length (D34): warn when the held option is the longest in most decisions.
  const decisions = Object.values(loaded.content.nodes).filter((n) => n.choices?.length > 1);
  const words = (c) => String(isVariantList(c.label) ? c.label[c.label.length - 1].text : c.label).split(/\s+/).length;
  const heldLongest = decisions.filter((n) => [...n.choices].sort((a, b) => words(b) - words(a))[0].tone === 'held').length;
  if (decisions.length && heldLongest > decisions.length / 2) {
    warnings.push({
      file: loaded.moduleSource.file,
      message: `the held option is the longest in ${heldLongest} of ${decisions.length} decisions, so length gives the answer away (the per-learner shuffle hides position, not length)`,
      rule: 'option-length',
    });
  }

  // Engine strings get the emoji and markup checks too.
  for (const [key, value] of Object.entries(strings || {})) {
    if (typeof value === 'string') checkOne(value, { where: { file: 'engine/strings', line: null }, scope: 'strings', field: key });
  }

  return { problems, warnings };
}

// Children by initials only --------------------------------------------------------

function allowedWords(loaded) {
  const words = new Set(['Ms', 'Mr', 'Mrs', 'Mx', 'Dr', 'Director', 'Room', 'AM', 'PM', 'OK']);
  for (const adult of loaded.characters.adults) for (const w of adult.name.split(/[\s.]+/)) if (w) words.add(w);
  // The form's own words ("Tick No for broken skin") are not names.
  for (const section of loaded.module.form?.sections || []) {
    const texts = [section.title, ...section.fields.flatMap((f) => [f.label, f.group, ...(f.options || [])])];
    for (const t of texts) for (const w of String(t || '').match(/[A-Za-z]+/g) || []) words.add(w);
  }
  const file = path.join(ROOT, 'scripts/lint/allowed-capitalized-words.txt');
  if (fs.existsSync(file)) {
    for (const line of readText(file).split('\n')) {
      const w = line.trim();
      if (w && !w.startsWith('#')) words.add(w);
    }
  }
  return words;
}

export function checkNames(loaded) {
  const problems = [];
  const allowed = allowedWords(loaded);
  const initials = new Set(loaded.characters.children.map((c) => c.initials));

  walkTexts(loaded, (text, { where, field }) => {
    for (const match of text.matchAll(/\b(?:[A-Z]\.){2,3}/g)) {
      if (!initials.has(match[0])) problems.push({ ...where, message: `initials "${match[0]}" are not in the characters list in module.yaml`, rule: 'names' });
    }
    for (const match of text.matchAll(/\b[A-Z][a-z][A-Za-z'’-]*/g)) {
      const word = match[0].replace(/['’]s$/, '');
      if (allowed.has(word)) continue;
      if (isSentenceStart(text, match.index)) continue;
      problems.push({
        ...where,
        message: `"${word}" in ${field} looks like a name that is not in the characters list. Children appear by initials only. If it is not a name, add it to scripts/lint/allowed-capitalized-words.txt`,
        rule: 'names',
      });
    }
  });
  return problems;
}

/** True if the word at `index` starts a sentence or a quotation (so a capital letter is expected). */
function isSentenceStart(text, index) {
  let i = index - 1;
  if (i >= 0 && /[“"‘'(]/.test(text[i])) return true;
  while (i >= 0 && /\s/.test(text[i])) i -= 1;
  if (i < 0) return true;
  if (/[.!?:;]/.test(text[i])) {
    // "Ms. Whoever": the period after a title does not end a sentence, so an
    // undeclared name after it is still flagged. After initials ("for A.K. Let me")
    // a capital does start a sentence; "D.M. bit" has no capital to check.
    return !/\b(?:Ms|Mr|Mrs|Mx|Dr)\.$/.test(text.slice(0, i + 1));
  }
  return /[”"’')\]]/.test(text[i]) && i > 0 && /[.!?]/.test(text[i - 1]);
}

// Reading level (Flesch-Kincaid grade, rough) ----------------------------------------

export function gradeLevel(text) {
  const words = text.match(/[A-Za-z]+(?:['’][a-z]+)?/g) || [];
  if (words.length < 20) return null;
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) || []).length);
  const syllables = words.reduce((sum, w) => sum + syllableCount(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
}

function syllableCount(word) {
  const w = word.toLowerCase().replace(/['’].*$/, '');
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

// Form labels against the source form ---------------------------------------------------

const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[*_`]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export function checkFormSource(loaded) {
  const problems = [];
  const form = loaded.module.form;
  if (!form) return problems;
  const file = path.join(loaded.moduleDir, form.source);
  const where = (p) => ({ file: loaded.moduleSource.file, line: loaded.moduleSource.lineOf(p) });
  if (!fs.existsSync(file)) {
    return [{ ...where(['form', 'source']), message: `form source ${form.source} not found`, rule: 'form' }];
  }
  const source = normalize(readText(file));
  const expect = (text, p, what) => {
    if (!source.includes(normalize(text))) problems.push({ ...where(p), message: `${what} "${text}" does not appear in ${form.source}`, rule: 'form' });
  };
  form.sections.forEach((section, i) => {
    expect(section.title, ['form', 'sections', i, 'title'], 'section title');
    section.fields.forEach((field, j) => {
      const p = ['form', 'sections', i, 'fields', j];
      expect(field.label, [...p, 'label'], 'field label');
      if (field.group) expect(field.group, [...p, 'group'], 'group');
      for (const opt of field.options || []) expect(opt, [...p, 'options'], 'option');
    });
  });
  return problems;
}
