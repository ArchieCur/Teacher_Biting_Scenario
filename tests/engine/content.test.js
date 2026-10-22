// Tests against the real biting-incident content. They walk every reachable
// state and check the behaviors the content relies on (Handoff 05, R5 and R6).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT } from '../../scripts/lib/paths.js';
import { loadModule } from '../../scripts/lib/content.js';
import { pick } from '../../engine/src/conditions.js';
import { formatText } from '../../engine/src/dom.js';
import { initialState, applyChoice, advance, visibleChoices } from '../../engine/src/state.js';

const { content } = loadModule(path.join(ROOT, 'modules/biting-incident'));

/** Play from the start, using `picks` (node id to choice id) and otherwise the first visible choice, until `stopAt`. */
function play(picks = {}, stopAt = null) {
  let state = initialState(content);
  for (let step = 0; step < 60; step += 1) {
    const node = content.nodes[state.node];
    if (node.id === stopAt || node.type === 'wrap') return state;
    if (node.choices) {
      const id = picks[node.id] || visibleChoices(node, state.flags)[0].id;
      state = applyChoice(state, content, id).state;
    } else {
      state = advance(state, content).state;
    }
  }
  throw new Error('did not finish');
}

test('every reachable state offers at least two options and every path ends at the wrap', () => {
  const seen = new Set();
  const queue = [initialState(content)];
  let wraps = 0;
  while (queue.length) {
    const state = queue.shift();
    const key = `${state.node}|${JSON.stringify(state.flags)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const node = content.nodes[state.node];
    if (node.type === 'wrap') {
      wraps += 1;
      continue;
    }
    if (node.choices) {
      const visible = visibleChoices(node, state.flags);
      assert.ok(visible.length >= 2, `${node.id} shows ${visible.length} option(s) with flags ${JSON.stringify(state.flags)}`);
      for (const choice of visible) queue.push(applyChoice(state, content, choice.id).state);
    } else {
      queue.push(advance(state, content).state);
    }
  }
  assert.ok(wraps > 0);
  assert.ok(seen.size > 50, `explored ${seen.size} states`);
});

test('R6: choice labels, consequences and form fills follow flags (2.1 depends on the quick note)', () => {
  const withNote = play({ '1.4': '1.4-a' }, '2.1');
  const without = play({ '1.4': '1.4-b' }, '2.1');
  assert.equal(withNote.flags.jottedNote, true);
  assert.equal(without.flags.jottedNote, false);

  const choice = content.nodes['2.1'].choices.find((c) => c.id === '2.1-a');
  assert.match(pick(choice.label, withNote.flags), /^Time 10:15/);
  assert.match(pick(choice.label, without.flags), /^Around 10:15, I think/);

  const a = applyChoice(withNote, content, '2.1-a');
  const b = applyChoice(without, content, '2.1-a');
  assert.match(a.feedback.consequence, /copy from your note/);
  assert.match(b.feedback.consequence, /from memory/);
  assert.equal(a.state.form.incidentTime, '10:15 AM');
  assert.equal(b.state.form.incidentTime, 'Around 10:15 AM');
});

test('R6: "Staff Members Present" reflects whether the office was called', () => {
  const called = applyChoice(play({ '1.1': '1.1-b' }, '2.1'), content, '2.1-a').state;
  const alone = applyChoice(play({ '1.1': '1.1-c' }, '2.1'), content, '2.1-a').state;
  assert.match(called.form.staffPresent, /Ms\. Lee arrived after the bite/);
  assert.equal(alone.form.staffPresent, 'Nina Rodriguez');
});

test('R6: form fills accumulate across form nodes (2.1, then 2.2)', () => {
  const after21 = applyChoice(play({}, '2.1'), content, '2.1-a').state;
  const choice22 = visibleChoices(content.nodes['2.2'], after21.flags)[0];
  const after22 = applyChoice(after21, content, choice22.id).state;
  for (const field of Object.keys(content.nodes['2.1'].choices[0].fill)) assert.ok(field in after22.form, `${field} from 2.1 kept`);
  for (const field of Object.keys(choice22.fill || {})) assert.ok(field in after22.form, `${field} from 2.2 added`);
});

test('R6: sections 4 and 5 wait until after pickup, then become active in 3.4', () => {
  for (const id of ['2.1', '2.2']) {
    assert.deepEqual(content.nodes[id].sections.later, ['4', '5']);
    assert.equal(content.nodes[id].sections.laterNote, 'Complete these after pickup.');
  }
  assert.deepEqual(content.nodes['3.4'].sections.active, ['4', '5']);
});

test('R5: a blank line in a folded (>-) body makes a new paragraph', () => {
  assert.equal((formatText(content.nodes['1.0'].body).match(/<p>/g) || []).length, 2);
  assert.equal(formatText('one\ntwo'), '<p>one</p><p>two</p>');
  assert.equal(formatText('one\n\n\ntwo'), '<p>one</p><p>two</p>');
});

test('R2: the policy drawer shows v1.2 without front matter or the change log', () => {
  assert.doesNotMatch(content.policyHtml, /Change log|^---|status:/m);
  assert.match(content.policyHtml, /Version 1\.2/);
  assert.match(content.policyHtml, /Biting hurts\. We keep our teeth to ourselves\./);
});
