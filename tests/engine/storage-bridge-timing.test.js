import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../engine/src/storage.js';
import { bridgeConfig, notifyComplete, MESSAGE_SOURCE } from '../../engine/src/bridge.js';
import { createTimer } from '../../engine/src/timing.js';

function fakeStorage() {
  const map = new Map();
  return { setItem: (k, v) => map.set(k, String(v)), getItem: (k) => (map.has(k) ? map.get(k) : null), removeItem: (k) => map.delete(k) };
}
const blocked = {
  setItem() {
    throw new Error('SecurityError');
  },
  getItem() {
    throw new Error('SecurityError');
  },
  removeItem() {},
};

test('storage: localStorage when it works', () => {
  const store = createStore('k', { win: { localStorage: fakeStorage(), sessionStorage: fakeStorage() } });
  assert.equal(store.save({ a: 1 }), 'local');
  assert.deepEqual(store.load(), { a: 1 });
});

test('storage: falls back to sessionStorage when localStorage is blocked', () => {
  const store = createStore('k', { win: { localStorage: blocked, sessionStorage: fakeStorage() } });
  assert.equal(store.save({ a: 1 }), 'session');
  assert.deepEqual(store.load(), { a: 1 });
});

test('storage: memory only when everything is blocked, or when disabled', () => {
  const store = createStore('k', { win: { get localStorage() { throw new Error('denied'); }, sessionStorage: blocked } });
  assert.equal(store.save({ a: 1 }), 'memory');
  assert.deepEqual(store.load(), { a: 1 });
  const off = createStore('k', { win: { localStorage: fakeStorage() }, disabled: true });
  assert.equal(off.save({ b: 2 }), 'memory');
});

test('storage: a write that does not read back is not reported as saved', () => {
  const liar = { ...fakeStorage(), getItem: (k) => (k.endsWith(':probe') ? '1' : 'something else') };
  const store = createStore('k', { win: { localStorage: liar } });
  assert.equal(store.save({ a: 1 }), 'memory');
});

test('bridge: config comes from the module, query parameters override it', () => {
  const cfg = bridgeConfig('m', { variable: 'ScenarioComplete', targetOrigin: '*' }, '?sv=Done&origin=https://lms.example&bridge=b');
  assert.deepEqual(cfg, { moduleId: 'm', variable: 'Done', targetOrigin: 'https://lms.example', mode: 'b' });
  assert.equal(bridgeConfig('m', { variable: 'X' }, '?bridge=nonsense').mode, 'both');
});

function frames({ playerAt = -1, crossOriginAt = -1, depth = 2 } = {}) {
  // Build a chain: module -> parent 0 -> parent 1 ... ; top is its own parent.
  const calls = { setVar: [], messages: [] };
  const chain = [];
  for (let i = 0; i < depth; i += 1) {
    const w = { postMessage: (msg, origin) => calls.messages.push({ i, msg, origin }) };
    if (i === playerAt) w.GetPlayer = () => ({ SetVar: (name, value) => calls.setVar.push({ i, name, value }) });
    if (i === crossOriginAt) {
      Object.defineProperty(w, 'GetPlayer', {
        get() {
          throw new Error('cross-origin');
        },
      });
    }
    chain.push(w);
  }
  chain.forEach((w, i) => (w.parent = chain[i + 1] || w));
  const win = { parent: chain[0] };
  return { win, calls };
}

test('bridge: route A finds GetPlayer two frames up and sets the variable once', () => {
  const { win, calls } = frames({ playerAt: 1, depth: 3 });
  const report = notifyComplete({ moduleId: 'm', variable: 'ScenarioComplete', targetOrigin: '*', mode: 'both' }, win);
  assert.equal(report.setVar, true);
  assert.deepEqual(calls.setVar, [{ i: 1, name: 'ScenarioComplete', value: true }]);
});

test('bridge: route B posts to every ancestor with no learner data', () => {
  const { win, calls } = frames({ depth: 3 });
  const report = notifyComplete({ moduleId: 'm', variable: 'V', targetOrigin: '*', mode: 'both' }, win);
  assert.equal(report.setVar, false);
  assert.equal(report.messages, 3);
  assert.deepEqual(calls.messages[0].msg, { source: MESSAGE_SOURCE, type: 'complete', moduleId: 'm' });
});

test('bridge: a cross-origin parent does not stop the search or throw', () => {
  const { win, calls } = frames({ crossOriginAt: 0, playerAt: 1, depth: 2 });
  const report = notifyComplete({ moduleId: 'm', variable: 'V', targetOrigin: '*', mode: 'a' }, win);
  assert.equal(report.setVar, true);
  assert.equal(calls.messages.length, 0);
});

test('bridge: opener is used when there is no parent frame', () => {
  const calls = [];
  const opener = { GetPlayer: () => ({ SetVar: (n, v) => calls.push([n, v]) }), postMessage() {} };
  const win = { opener };
  win.parent = win;
  const report = notifyComplete({ moduleId: 'm', variable: 'V', targetOrigin: '*', mode: 'both' }, win);
  assert.equal(report.setVar, true);
  assert.equal(report.messages, 1);
});

test('timing: decide and read seconds per step', () => {
  let t = 0;
  const timer = createTimer(true, () => t);
  timer.shown('1.1');
  t = 30000;
  timer.locked();
  t = 50000;
  timer.done();
  timer.shown('1.d');
  t = 60000;
  timer.done();
  assert.deepEqual(timer.summary(), [
    { node: '1.1', decide: 30, read: 20 },
    { node: '1.d', decide: null, read: 10 },
  ]);
  assert.match(timer.csv(), /total,,60/);
});
