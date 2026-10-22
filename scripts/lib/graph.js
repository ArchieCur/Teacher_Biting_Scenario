// Graph checks on a loaded module (see content.js):
//   ids are unique; the start node and every `next` exist; every node is
//   reachable; nothing dead-ends before a wrap; no loops; every variant list
//   ends with a default; every flag is declared, set somewhere and read
//   somewhere; every flag combination leaves at least one visible choice;
//   form fills point at real fields and real options.

import fs from 'node:fs';
import path from 'node:path';
import { isVariantList, documentRefs, documentKey } from '../../engine/src/conditions.js';

export function checkGraph(loaded) {
  const { content, locate, sceneSources, moduleSource } = loaded;
  const problems = [];
  const add = (where, message) => problems.push({ ...where, message, rule: 'graph' });

  // Unique ids ---------------------------------------------------------------
  const nodeSeen = new Map();
  const choiceSeen = new Map();
  for (const source of sceneSources) {
    source.data.nodes.forEach((node, i) => {
      const where = { file: source.file, line: source.lineOf(['nodes', i, 'id']) };
      if (nodeSeen.has(node.id)) add(where, `node id "${node.id}" is used twice (also at ${nodeSeen.get(node.id)})`);
      else nodeSeen.set(node.id, `${where.file}:${where.line}`);
      (node.choices || []).forEach((choice, j) => {
        const cw = { file: source.file, line: source.lineOf(['nodes', i, 'choices', j, 'id']) };
        if (choiceSeen.has(choice.id)) add(cw, `choice id "${choice.id}" is used twice (also at ${choiceSeen.get(choice.id)})`);
        else choiceSeen.set(choice.id, `${cw.file}:${cw.line}`);
      });
    });
  }

  const nodes = content.nodes;
  if (!nodes[content.start]) add({ file: moduleSource.file, line: moduleSource.lineOf(['start']) }, `start node "${content.start}" does not exist`);

  // Variant defaults -------------------------------------------------------------
  const checkVariants = (value, nodeId, sub, key) => {
    if (!isVariantList(value)) return;
    const last = value[value.length - 1];
    if (last.when) add(locate(nodeId, [...sub, value.length - 1]), `the last ${key === 'to' ? 'next' : 'variant'} in this list needs no "when" (it is the default)`);
    value.slice(0, -1).forEach((v, i) => {
      if (!v.when) add(locate(nodeId, [...sub, i]), 'only the last variant may leave out "when"; this one hides the ones after it');
    });
  };

  // Edges --------------------------------------------------------------------
  const edges = {};
  const targetsOf = (next) => (isVariantList(next) ? next.map((v) => v.to) : next ? [next] : []);

  for (const node of Object.values(nodes)) {
    const out = [];
    const id = node.id;
    for (const key of ['heading', 'body', 'prompt', 'line', 'document']) checkVariants(node[key], id, [key], 'text');
    if (node.monday) {
      checkVariants(node.monday.title, id, ['monday', 'title'], 'text');
      node.monday.items.forEach((item, i) => {
        checkVariants(item.do, id, ['monday', 'items', i, 'do'], 'text');
        checkVariants(item.say, id, ['monday', 'items', i, 'say'], 'text');
      });
    }

    if (node.choices) {
      node.choices.forEach((choice, j) => {
        for (const key of ['label', 'outcomeLabel', 'consequence', 'why', 'say']) checkVariants(choice[key], id, ['choices', j, key], 'text');
        for (const [field, value] of Object.entries(choice.fill || {})) checkVariants(value, id, ['choices', j, 'fill', field], 'value');
        checkVariants(choice.next, id, ['choices', j, 'next'], 'to');
        for (const t of targetsOf(choice.next)) {
          if (!nodes[t]) add(locate(id, ['choices', j, 'next']), `next "${t}" does not exist`);
          out.push(t);
        }
      });
    } else if (node.type !== 'wrap') {
      if (!node.next) add(locate(id), `"${id}" has no choices and no next, so the learner gets stuck here`);
      checkVariants(node.next, id, ['next'], 'to');
      for (const t of targetsOf(node.next)) {
        if (!nodes[t]) add(locate(id, ['next']), `next "${t}" does not exist`);
        out.push(t);
      }
    } else if (node.next) {
      add(locate(id, ['next']), 'a wrap node ends the module and cannot have a next');
    }
    edges[id] = out.filter((t) => nodes[t]);
  }

  if (!Object.values(nodes).some((n) => n.type === 'wrap')) add({ file: moduleSource.file, line: 1 }, 'the module has no wrap node, so it can never complete');

  // Reachability and loops -----------------------------------------------------------
  if (nodes[content.start]) {
    const seen = new Set();
    const stack = [content.start];
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...edges[id]);
    }
    for (const id of Object.keys(nodes)) if (!seen.has(id)) add(locate(id), `"${id}" can never be reached from the start`);

    const state = {};
    const visit = (id, trail) => {
      if (state[id] === 'done') return;
      if (state[id] === 'active') {
        add(locate(id), `loop: ${[...trail.slice(trail.indexOf(id)), id].join(' -> ')}. Scenarios move forward only`);
        return;
      }
      state[id] = 'active';
      for (const t of edges[id]) visit(t, [...trail, id]);
      state[id] = 'done';
    };
    visit(content.start, []);
  }

  // Flags --------------------------------------------------------------------------
  const declared = new Set(Object.keys(content.flags));
  const setBy = new Set();
  const readBy = new Set();
  const noteReads = (when, where) => {
    for (const name of Object.keys(when || {})) {
      readBy.add(name);
      if (!declared.has(name)) add(where, `flag "${name}" is not declared in module.yaml`);
    }
  };
  const noteVariantReads = (value, where) => {
    if (isVariantList(value)) for (const v of value) noteReads(v.when, where);
  };

  for (const node of Object.values(nodes)) {
    const id = node.id;
    for (const key of ['heading', 'body', 'prompt', 'line', 'document']) noteVariantReads(node[key], locate(id, [key]));
    noteVariantReads(node.next, locate(id, ['next']));
    if (node.monday) {
      noteVariantReads(node.monday.title, locate(id, ['monday']));
      for (const item of node.monday.items) {
        noteVariantReads(item.do, locate(id, ['monday']));
        noteVariantReads(item.say, locate(id, ['monday']));
      }
    }
    (node.choices || []).forEach((choice, j) => {
      const where = locate(id, ['choices', j]);
      noteReads(choice.showIf, locate(id, ['choices', j, 'showIf']));
      for (const key of ['label', 'outcomeLabel', 'consequence', 'why', 'say', 'next']) noteVariantReads(choice[key], where);
      for (const value of Object.values(choice.fill || {})) noteVariantReads(value, where);
      for (const name of Object.keys(choice.setFlags || {})) {
        setBy.add(name);
        if (!declared.has(name)) add(locate(id, ['choices', j, 'setFlags']), `flag "${name}" is not declared in module.yaml`);
      }
    });
  }
  for (const name of declared) {
    const where = { file: moduleSource.file, line: moduleSource.lineOf(['flags', name]) };
    if (!setBy.has(name)) add(where, `flag "${name}" is never set by any choice`);
    if (!readBy.has(name)) add(where, `flag "${name}" is set but never read, so it changes nothing the learner sees`);
  }

  // Every combination of the flags a node's showIf uses leaves at least one choice --------
  for (const node of Object.values(nodes)) {
    if (!node.choices) continue;
    const used = [...new Set(node.choices.flatMap((c) => Object.keys(c.showIf || {})))];
    if (used.length > 8) continue;
    for (let mask = 0; mask < 2 ** used.length; mask += 1) {
      const flags = Object.fromEntries(used.map((name, i) => [name, Boolean(mask & (1 << i))]));
      const visible = node.choices.filter((c) => Object.entries(c.showIf || {}).every(([k, v]) => flags[k] === v));
      if (!visible.length) {
        const combo = used.map((n) => `${n}=${flags[n]}`).join(', ');
        add(locate(node.id, ['choices']), `no choice is visible when ${combo}`);
      }
    }
  }

  // Documents shown on nodes -----------------------------------------------------------
  const declaredDocs = loaded.module.documents || {};
  for (const node of Object.values(nodes)) {
    for (const ref of documentRefs(node.document)) {
      const where = locate(node.id, ['document']);
      const doc = declaredDocs[ref.id];
      if (!doc) {
        add(where, `document "${ref.id}" is not declared under documents in module.yaml`);
        continue;
      }
      const file = path.join(loaded.moduleDir, doc.file);
      if (!fs.existsSync(file)) add({ file: moduleSource.file, line: moduleSource.lineOf(['documents', ref.id, 'file']) }, `document file ${doc.file} not found`);
      else if (!content.documentHtml[documentKey(ref)]) add(where, `section "${ref.section}" not found in ${doc.file} (use the heading text exactly; "A > B" for a nested heading)`);
    }
  }

  // Form fills and form nodes -------------------------------------------------------------
  const fields = new Map((content.form?.sections || []).flatMap((s) => s.fields).map((f) => [f.id, f]));
  const sectionIds = new Set((content.form?.sections || []).map((s) => s.id));
  for (const node of Object.values(nodes)) {
    if (node.type === 'form') {
      if (!content.form) add(locate(node.id), 'form node, but module.yaml has no form');
      for (const key of ['active', 'later']) {
        for (const sid of node.sections?.[key] || []) {
          if (!sectionIds.has(sid)) add(locate(node.id, ['sections', key]), `form section "${sid}" does not exist`);
        }
      }
    }
    (node.choices || []).forEach((choice, j) => {
      for (const [fieldId, value] of Object.entries(choice.fill || {})) {
        const where = locate(node.id, ['choices', j, 'fill', fieldId]);
        const field = fields.get(fieldId);
        if (!field) {
          add(where, `form field "${fieldId}" does not exist`);
          continue;
        }
        const values = isVariantList(value) ? value.map((v) => v.value) : [value];
        for (const v of values) {
          if (field.kind === 'text' && typeof v !== 'string') add(where, `"${fieldId}" is a write-in field and needs text`);
          if (field.kind !== 'text') {
            const list = Array.isArray(v) ? v : [v];
            if (field.kind === 'choice' && Array.isArray(v)) add(where, `"${fieldId}" takes one option, not a list`);
            for (const opt of list) if (!field.options.includes(opt)) add(where, `"${opt}" is not an option of "${fieldId}" (options: ${field.options.join(' | ')})`);
          }
        }
      }
    });
  }

  return problems;
}
