import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT } from '../../scripts/lib/paths.js';
import { loadModule } from '../../scripts/lib/content.js';
import { matches, pick } from '../../engine/src/conditions.js';
import { initialState, applyChoice, advance, visibleChoices, toSaved, fromSaved, stateAtNode } from '../../engine/src/state.js';

// A fixed fixture module, so these tests do not change when the real content does.
const { content } = loadModule(path.join(ROOT, 'tests/fixtures/engine-module'));

test('conditions: every key must match; missing flags count as off', () => {
  assert.equal(matches(undefined, {}), true);
  assert.equal(matches({ a: true }, { a: true }), true);
  assert.equal(matches({ a: true, b: false }, { a: true }), true);
  assert.equal(matches({ a: true }, {}), false);
});

test('variants: first match wins, last entry is the default, plain values pass through', () => {
  const list = [{ when: { a: true }, text: 'on' }, { text: 'default' }];
  assert.equal(pick(list, { a: true }), 'on');
  assert.equal(pick(list, {}), 'default');
  assert.equal(pick('plain', {}), 'plain');
  assert.deepEqual(pick(['x', 'y'], {}, 'value'), ['x', 'y']);
});

test('fixture module: a flag set in node 1 changes text, form fills and choices later', () => {
  let state = initialState(content);
  assert.equal(state.node, 'p.1');

  let result = applyChoice(state, content, 'p.1-a');
  state = result.state;
  assert.equal(state.flags.placeholderFlag, true);
  assert.equal(state.node, 'p.2');
  assert.equal(result.feedback.tone, 'held');
  assert.equal(pick(content.nodes['p.2'].body, state.flags), 'This variant appears because the flag is set.');

  result = applyChoice(state, content, 'p.2-a');
  state = result.state;
  assert.equal(state.form.incidentTime, '10:20 AM');
  assert.deepEqual(state.form.firstAid, ['Washed with soap and water', 'Applied cold compress/ice']);
  assert.ok(result.filled.includes('brokeSkin'));

  assert.deepEqual(visibleChoices(content.nodes['p.3'], state.flags).map((c) => c.id), ['p.3-a', 'p.3-b', 'p.3-c']);
  state = applyChoice(state, content, 'p.3-a').state;
  assert.equal(state.node, 'p.debrief');

  state = advance(state, content).state;
  assert.equal(state.node, 'p.wrap');
  assert.equal(state.completed, true);
  assert.deepEqual(state.history.map((h) => h.tone), ['held', 'held', 'held']);
});

test('fixture module: without the flag, the other variants and fewer choices appear', () => {
  let state = applyChoice(initialState(content), content, 'p.1-b').state;
  assert.equal(state.flags.placeholderFlag, false);
  state = applyChoice(state, content, 'p.2-a').state;
  assert.equal(state.form.incidentTime, 'Around 10:20, I think');
  assert.deepEqual(visibleChoices(content.nodes['p.3'], state.flags).map((c) => c.id), ['p.3-b', 'p.3-c']);
  assert.throws(() => applyChoice(state, content, 'p.3-a'), /not available/);
});

test('applyChoice does not change the previous state', () => {
  const before = initialState(content);
  const copy = JSON.stringify(before);
  applyChoice(before, content, 'p.1-a');
  assert.equal(JSON.stringify(before), copy);
});

test('resume: same content version resumes exactly', () => {
  const state = applyChoice(initialState(content), content, 'p.1-a').state;
  const saved = JSON.parse(JSON.stringify(toSaved(state, content)));
  const restored = fromSaved(saved, content);
  assert.equal(restored.notice, null);
  assert.equal(restored.state.node, 'p.2');
  assert.equal(restored.state.flags.placeholderFlag, true);
});

test('resume: changed content version goes back to the start of the saved scene', () => {
  const state = applyChoice(initialState(content), content, 'p.1-a').state;
  const saved = { ...JSON.parse(JSON.stringify(toSaved(state, content))), contentVersion: 'older' };
  const restored = fromSaved(saved, content);
  assert.equal(restored.notice, 'scene');
  assert.equal(restored.state.node, 'p.1');
  assert.deepEqual(restored.state.history, []);
});

test('resume: a scene that no longer exists starts over; unknown formats are ignored', () => {
  const saved = { ...toSaved(initialState(content), content), contentVersion: 'older', node: 'gone', sceneStart: { scene: 'gone', node: 'gone' } };
  assert.equal(fromSaved(saved, content).notice, 'restart');
  assert.equal(fromSaved({ format: 999 }, content), null);
  assert.equal(fromSaved(null, content), null);
});

test('dev jump: state at any node with chosen flags', () => {
  const state = stateAtNode(content, 'p.3', { placeholderFlag: true });
  assert.equal(state.node, 'p.3');
  assert.equal(state.flags.placeholderFlag, true);
});
