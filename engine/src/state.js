// Scenario state: pure functions with no DOM access, so they can be tested in Node.
//
// State shape (also what gets saved):
//   node        id of the node to show next
//   flags       carried flags
//   form        form field values filled in by choices
//   history     [{ node, choice, tone }] for "Your day at a glance"
//   scene       id of the scene that `node` belongs to
//   sceneStart  snapshot taken when the current scene began, used to resume
//               safely after the content changes
//   completed   true once the wrap screen has been reached

import { matches, pick } from './conditions.js';

export const SAVE_FORMAT = 1;

/** Build lookup tables once per content object. */
export function indexContent(content) {
  if (content._index) return content._index;
  const sceneOf = {};
  for (const scene of content.scenes) for (const id of scene.nodes) sceneOf[id] = scene.id;
  const index = { sceneOf, sceneById: Object.fromEntries(content.scenes.map((s) => [s.id, s])) };
  Object.defineProperty(content, '_index', { value: index, enumerable: false });
  return index;
}

export function defaultFlags(content) {
  const flags = {};
  for (const [name, def] of Object.entries(content.flags)) flags[name] = def.default;
  return flags;
}

function snapshot(state) {
  return {
    scene: state.scene,
    node: state.node,
    flags: { ...state.flags },
    form: structuredCloneSafe(state.form),
    history: state.history.map((h) => ({ ...h })),
  };
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function initialState(content) {
  const { sceneOf } = indexContent(content);
  const state = {
    node: content.start,
    flags: defaultFlags(content),
    form: {},
    history: [],
    scene: sceneOf[content.start],
    completed: false,
  };
  state.sceneStart = snapshot(state);
  return state;
}

/** A fresh state positioned at any node, for the dev jump tool. */
export function stateAtNode(content, nodeId, flagOverrides = {}) {
  const { sceneOf } = indexContent(content);
  const state = initialState(content);
  state.node = nodeId;
  state.scene = sceneOf[nodeId];
  Object.assign(state.flags, flagOverrides);
  state.sceneStart = snapshot(state);
  return state;
}

export function visibleChoices(node, flags) {
  return (node.choices || []).filter((choice) => matches(choice.showIf, flags));
}

export function resolveNext(next, flags) {
  return pick(next, flags, 'to');
}

function enter(state, content, nextId) {
  const { sceneOf } = indexContent(content);
  const nextScene = sceneOf[nextId];
  const changed = nextScene !== state.scene;
  state.node = nextId;
  state.scene = nextScene;
  if (changed) state.sceneStart = snapshot(state);
  if (content.nodes[nextId].type === 'wrap') state.completed = true;
  return changed;
}

/**
 * Lock in a choice. Returns the new state plus everything the UI needs to show
 * the consequence. Conditions inside the choice (text variants, fill variants,
 * conditional next) see the flags after this choice's own setFlags are applied.
 */
export function applyChoice(prev, content, choiceId) {
  const node = content.nodes[prev.node];
  const choice = visibleChoices(node, prev.flags).find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Choice ${choiceId} is not available at node ${prev.node}`);

  const state = structuredCloneSafe({ ...prev, sceneStart: undefined });
  state.sceneStart = prev.sceneStart;
  Object.assign(state.flags, choice.setFlags || {});
  const flags = state.flags;

  const filled = [];
  for (const [field, value] of Object.entries(choice.fill || {})) {
    state.form[field] = pick(value, flags, 'value');
    filled.push(field);
  }

  state.history.push({ node: node.id, choice: choice.id, tone: choice.tone });
  const nextId = resolveNext(choice.next, flags);
  const sceneChanged = enter(state, content, nextId);

  return {
    state,
    filled,
    sceneChanged,
    feedback: {
      tone: choice.tone,
      label: pick(choice.label, flags),
      outcomeLabel: pick(choice.outcomeLabel, flags),
      consequence: pick(choice.consequence, flags),
      why: pick(choice.why, flags),
      say: pick(choice.say, flags),
    },
  };
}

/** Move on from a node that has no choices (story without choices, debrief). */
export function advance(prev, content) {
  const node = content.nodes[prev.node];
  const state = structuredCloneSafe({ ...prev, sceneStart: undefined });
  state.sceneStart = prev.sceneStart;
  const sceneChanged = enter(state, content, resolveNext(node.next, state.flags));
  return { state, sceneChanged };
}

export function toSaved(state, content) {
  return { format: SAVE_FORMAT, contentVersion: content.version, ...state };
}

/**
 * Turn saved data back into a state.
 * - Same content version: resume exactly where the learner was.
 * - Different version: resume at the start of the saved scene if that scene
 *   still exists, using the snapshot taken when the scene began.
 * - Otherwise: start over, with a notice.
 * @returns {{ state: object, notice: null | 'scene' | 'restart' } | null}
 */
export function fromSaved(saved, content) {
  if (!saved || saved.format !== SAVE_FORMAT) return null;
  const { sceneById } = indexContent(content);

  if (saved.contentVersion === content.version && content.nodes[saved.node]) {
    const { format, contentVersion, ...state } = saved;
    return { state, notice: null };
  }

  const snap = saved.sceneStart;
  const scene = snap && sceneById[snap.scene];
  if (scene && content.nodes[snap.node]) {
    const state = initialState(content);
    state.node = snap.node;
    state.scene = snap.scene;
    for (const name of Object.keys(state.flags)) {
      if (typeof snap.flags?.[name] === 'boolean') state.flags[name] = snap.flags[name];
    }
    state.history = (snap.history || []).filter(
      (h) => content.nodes[h.node]?.choices?.some((c) => c.id === h.choice),
    );
    state.form = snap.form || {};
    state.sceneStart = snapshot(state);
    return { state, notice: 'scene' };
  }

  return { state: initialState(content), notice: 'restart' };
}
