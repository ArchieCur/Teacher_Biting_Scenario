// Load a module folder: read the YAML, validate it against the JSON Schemas,
// and compile it into the single content object the engine bundles.
// Errors carry a file and line so writers can find the problem.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';
import Ajv from 'ajv';
import { marked } from 'marked';
import { ROOT, rel } from './paths.js';
import { documentRefs, documentKey } from '../../engine/src/conditions.js';

const ajv = new Ajv({ allErrors: true, strict: false });
const validateModule = ajv.compile(readJson(path.join(ROOT, 'engine/schema/module.schema.json')));
const validateScene = ajv.compile(readJson(path.join(ROOT, 'engine/schema/scene.schema.json')));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

export function listModules() {
  const dir = path.join(ROOT, 'modules');
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'module.yaml')))
    .map((d) => path.join(dir, d.name))
    .sort();
}

export function loadStrings(lang) {
  const file = path.join(ROOT, 'engine/strings', `${lang}.yaml`);
  return YAML.parse(readText(file));
}

/** A parsed YAML file that can report the line of any path inside it. */
function readYaml(file, errors) {
  const lineCounter = new YAML.LineCounter();
  const doc = YAML.parseDocument(readText(file), { lineCounter });
  for (const err of doc.errors) {
    errors.push({ file: rel(file), line: err.linePos?.[0]?.line, message: err.message.split('\n')[0], rule: 'yaml' });
  }
  const source = {
    file: rel(file),
    data: doc.errors.length ? null : doc.toJS(),
    lineOf(pathParts) {
      for (let parts = [...pathParts]; ; parts.pop()) {
        const node = parts.length ? doc.getIn(parts, true) : doc.contents;
        if (node && node.range) return lineCounter.linePos(node.range[0]).line;
        if (!parts.length) return 1;
      }
    },
  };
  return source;
}

function schemaErrors(validate, source, errors) {
  if (validate(source.data)) return;
  const seen = new Set();
  for (const err of validate.errors) {
    // oneOf failures repeat once per branch; keep the first message per location.
    if (seen.has(err.instancePath)) continue;
    seen.add(err.instancePath);
    const parts = err.instancePath.split('/').slice(1).map((p) => (/^\d+$/.test(p) ? Number(p) : p));
    let message = `${err.instancePath || '(top level)'} ${err.message}`;
    if (err.keyword === 'additionalProperties') message = `${err.instancePath || '(top level)'}: unknown field "${err.params.additionalProperty}"`;
    if (err.keyword === 'enum') message += ` (${err.params.allowedValues.join(', ')})`;
    errors.push({ file: source.file, line: source.lineOf(parts), message, rule: 'schema' });
  }
}

/** Policy markdown to HTML for the drawer: no front matter, no change log, headings shifted under the drawer title, emphasis as semibold. */
export function renderPolicy(markdown) {
  let body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  body = body.split(/\n## Change log\b/)[0].replace(/\n-{3,}\s*$/, '\n');
  return marked
    .parse(body, { gfm: true })
    .replace(/<(\/?)h([1-6])>/g, (_, slash, n) => `<${slash}h${Math.min(6, Number(n) + 2)}>`)
    .replace(/<(\/?)em>/g, '<$1strong>')
    .trim();
}

/**
 * One section of a markdown document, by heading text. "A > B" picks heading B
 * inside section A. Returns the section's markdown (its heading included, up to
 * the next heading of the same or a higher level), or null if not found.
 */
export function extractSection(markdown, sectionPath) {
  const lines = markdown.replace(/^---\n[\s\S]*?\n---\n/, '').split(/\n## Change log\b/)[0].split('\n');
  const headingAt = (i) => /^(#{1,6})\s+(.*?)\s*$/.exec(lines[i]);
  let from = 0;
  let to = lines.length;
  let level = 0;
  for (const part of sectionPath.split('>').map((p) => p.trim())) {
    let found = -1;
    for (let i = from; i < to; i += 1) {
      const m = headingAt(i);
      if (m && m[1].length > level && m[2] === part) {
        found = i;
        level = m[1].length;
        break;
      }
    }
    if (found < 0) return null;
    from = found;
    to = lines.length;
    for (let i = found + 1; i < lines.length; i += 1) {
      const m = headingAt(i);
      if (m && m[1].length <= level) {
        to = i;
        break;
      }
    }
  }
  return lines
    .slice(from, to)
    .join('\n')
    .replace(/\n-{3,}\s*$/, '')
    .trim();
}

/**
 * A document section as HTML for the paper card: its heading becomes an h4
 * (under the card's h3 title), emphasis becomes semibold, and blank lines on
 * the form (runs of underscores) become a visible line that screen readers
 * announce as "blank".
 */
export function renderDocumentSection(sectionMarkdown) {
  const level = /^(#{1,6})\s/.exec(sectionMarkdown)?.[1].length || 4;
  const shift = 4 - level;
  return marked
    .parse(sectionMarkdown.replace(/_{4,}/g, '%%BLANK%%'), { gfm: true })
    .replace(/<(\/?)h([1-6])>/g, (_, slash, n) => `<${slash}h${Math.min(6, Math.max(4, Number(n) + shift))}>`)
    .replace(/<(\/?)em>/g, '<$1strong>')
    .replace(/%%BLANK%%/g, '<span class="blank"><span class="sr-only">blank</span></span>')
    .trim();
}

/**
 * @returns {{ content: object|null, errors: object[], sources: object, locate: Function, characters: object, moduleDir: string }}
 */
export function loadModule(moduleDir) {
  const errors = [];
  const modSource = readYaml(path.join(moduleDir, 'module.yaml'), errors);
  if (!modSource.data) return { content: null, errors };
  schemaErrors(validateModule, modSource, errors);
  if (errors.length) return { content: null, errors };
  const mod = modSource.data;

  const sceneSources = [];
  for (const name of mod.scenes) {
    const file = path.join(moduleDir, 'scenes', `${name}.yaml`);
    if (!fs.existsSync(file)) {
      errors.push({ file: modSource.file, line: modSource.lineOf(['scenes', mod.scenes.indexOf(name)]), message: `scene file scenes/${name}.yaml not found`, rule: 'schema' });
      continue;
    }
    const source = readYaml(file, errors);
    if (source.data) schemaErrors(validateScene, source, errors);
    sceneSources.push(source);
  }
  if (errors.length) return { content: null, errors };

  // Where each node and choice came from, for error messages.
  const origins = {};
  const nodes = {};
  const scenes = [];
  for (const source of sceneSources) {
    const scene = source.data;
    scenes.push({ id: scene.id, title: scene.title, clock: scene.clock, place: scene.place, nodes: scene.nodes.map((n) => n.id) });
    scene.nodes.forEach((node, i) => {
      if (!origins[node.id]) origins[node.id] = { source, path: ['nodes', i] };
      if (!nodes[node.id]) nodes[node.id] = node;
    });
  }

  let policyHtml = null;
  if (mod.policy) {
    const file = path.join(moduleDir, mod.policy.file);
    if (fs.existsSync(file)) policyHtml = renderPolicy(readText(file));
    else errors.push({ file: modSource.file, line: modSource.lineOf(['policy', 'file']), message: `policy file ${mod.policy.file} not found`, rule: 'schema' });
  }

  // Document sections that nodes show. Missing documents or sections are left
  // out here and reported by the graph check with file and line.
  const documents = {};
  const documentHtml = {};
  for (const [id, doc] of Object.entries(mod.documents || {})) documents[id] = { title: doc.title };
  for (const node of Object.values(nodes)) {
    for (const ref of documentRefs(node.document)) {
      const doc = mod.documents?.[ref.id];
      const file = doc && path.join(moduleDir, doc.file);
      if (!file || !fs.existsSync(file)) continue;
      const section = extractSection(readText(file), ref.section);
      if (section) documentHtml[documentKey(ref)] = renderDocumentSection(section);
    }
  }

  const content = {
    id: mod.id,
    title: mod.title,
    lang: mod.lang,
    start: mod.start,
    intro: mod.intro,
    disclosure: mod.disclosure,
    flags: mod.flags,
    storyline: mod.storyline,
    policy: mod.policy ? { buttonLabel: mod.policy.buttonLabel || 'Policy' } : null,
    policyHtml,
    form: mod.form ? { title: mod.form.title, sections: mod.form.sections } : null,
    documents,
    documentHtml,
    scenes,
    nodes,
  };
  content.version = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 12);

  /** File and line for a node (and optional sub-path such as ['choices', 0, 'next']). */
  function locate(nodeId, sub = []) {
    const origin = origins[nodeId];
    if (!origin) return { file: modSource.file, line: 1 };
    return { file: origin.source.file, line: origin.source.lineOf([...origin.path, ...sub]) };
  }

  return {
    content,
    errors,
    moduleDir,
    module: mod,
    moduleSource: modSource,
    sceneSources,
    characters: mod.characters,
    locate,
  };
}
