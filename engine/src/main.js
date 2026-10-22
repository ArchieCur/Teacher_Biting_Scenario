// Scenario engine entry point. The build injects this module's content and the
// engine strings, then bundles everything into one classic script (app.js).

import content from 'virtual:content';
import S from 'virtual:strings';
import { h, textBlock, fill } from './dom.js';
import { icons } from './icons.js';
import { pick, pickDocument, documentKey } from './conditions.js';
import { initialState, stateAtNode, applyChoice, advance, orderedChoices, toSaved, fromSaved, indexContent, SAVE_FORMAT } from './state.js';
import { createStore } from './storage.js';
import { bridgeConfig, notifyComplete } from './bridge.js';
import { createTimer } from './timing.js';
import { SceneHeader, StoryCard, SpokenLine, ChoiceForm, ConsequenceCard, FormSheet, DocumentCard, MondayCard, Glance, TimingLog, Dialog } from './components.js';
import { mountDev } from './dev.js';

/* global DEV */
// The build replaces DEV with true or false. Use DEV directly (not through a
// variable) so the production build can drop the dev tools.

function startApp(root) {
  const params = new URLSearchParams(window.location.search);
  const store = createStore(`scenario:${content.id}:v${SAVE_FORMAT}`, { disabled: params.get('storage') === 'off' });
  const bridge = bridgeConfig(content.id, content.storyline, window.location.search);
  const timer = createTimer(DEV || params.get('timing') === '1');
  const { sceneById } = indexContent(content);
  // Options are shuffled per learner (D34). Dev builds and ?order=authored keep
  // the authored order; the dev panel can switch shuffling on.
  let shuffle = !DEV && params.get('order') !== 'authored';

  let state = null;
  let shownScene = null;

  // Page shell -------------------------------------------------------------

  const sceneSlot = h('div', { class: 'topbar__scene' });
  const pauseMessage = h('p', { class: 'pause__message' });
  const pauseDialog = Dialog({
    heading: S['pause.heading'],
    closeLabel: S['pause.close'],
    body: [pauseMessage, h('button', { type: 'button', class: 'button button--primary', onClick: () => pauseDialog.close() }, S['pause.close'])],
  });
  const policyDialog = content.policyHtml
    ? Dialog({
        heading: S['policy.heading'],
        closeLabel: S['policy.close'],
        className: 'sheet-dialog--policy',
        body: h('div', { class: 'policy', html: content.policyHtml }),
      })
    : null;

  const toolButton = (icon, label, onClick) =>
    h('button', { type: 'button', class: 'button button--tool', onClick }, h('span', { class: 'icon-wrap', html: icons[icon] }), h('span', null, label));

  const tools = h(
    'div',
    { class: 'topbar__tools', hidden: true },
    policyDialog && toolButton('book', content.policy.buttonLabel, () => openDialog(policyDialog)),
    toolButton('pause', S['pause.open'], pause),
  );
  const main = h('main', { id: 'main', class: 'stage' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite' });

  root.replaceChildren(h('header', { class: 'topbar' }, sceneSlot, tools), main, live, pauseDialog, policyDialog);

  function openDialog(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function announce(text) {
    live.textContent = '';
    // A short delay makes screen readers treat repeated text as new.
    setTimeout(() => {
      live.textContent = text;
    }, 50);
  }

  function emit(type, detail = {}) {
    window.dispatchEvent(new CustomEvent('scenario:event', { detail: { type, moduleId: content.id, ...detail } }));
  }

  function save() {
    return store.save(toSaved(state, content));
  }

  function pause() {
    const level = save();
    pauseMessage.textContent = level === 'local' ? S['pause.savedLocal'] : level === 'session' ? S['pause.savedSession'] : S['pause.notSaved'];
    openDialog(pauseDialog);
  }

  function focusHeading(container) {
    const heading = container.querySelector('[tabindex="-1"]');
    window.scrollTo(0, 0);
    if (heading) heading.focus({ preventScroll: true });
  }

  // Intro ------------------------------------------------------------------

  function showIntro() {
    tools.hidden = true;
    sceneSlot.replaceChildren();
    shownScene = null;

    const restored = fromSaved(store.load(), content);
    const buttons = [];
    const notes = [];

    if (restored?.state.completed) {
      notes.push(textBlock(S['intro.finishedBody']));
      buttons.push(primary(S['intro.review'], () => begin(restored.state)));
      buttons.push(secondary(S['intro.startOver'], startOver));
    } else if (restored && restored.notice !== 'restart' && (restored.state.history.length || restored.state.node !== content.start)) {
      const scene = sceneById[restored.state.scene];
      notes.push(h('h3', { class: 'intro__resume' }, S['intro.resumeHeading']));
      notes.push(textBlock(fill(S['intro.resumeBody'], { scene: scene.clock ? `${scene.title}, ${scene.clock}` : scene.title })));
      if (restored.notice === 'scene') notes.push(textBlock(fill(S['intro.versionNotice'], { scene: scene.title })));
      buttons.push(primary(S['intro.resume'], () => begin(restored.state)));
      buttons.push(secondary(S['intro.startOver'], startOver));
    } else {
      if (restored?.notice === 'restart') notes.push(textBlock(S['intro.restartNotice']));
      buttons.push(primary(S['intro.begin'], () => begin(initialState(content))));
    }

    const card = StoryCard({
      kind: 'intro',
      heading: content.intro?.heading || content.title,
      body: content.intro?.body,
      extra: [h('p', { class: 'disclosure' }, content.disclosure), notes, h('div', { class: 'actions' }, buttons)],
    });
    main.replaceChildren(card);
    focusHeading(card);
  }

  function primary(label, onClick) {
    return h('button', { type: 'button', class: 'button button--primary', onClick }, label);
  }
  function secondary(label, onClick) {
    return h('button', { type: 'button', class: 'button button--secondary', onClick }, label);
  }

  function startOver() {
    store.clear();
    begin(initialState(content));
  }

  function begin(newState) {
    state = newState;
    save();
    tools.hidden = false;
    showNode();
  }

  // Nodes ------------------------------------------------------------------

  function updateScene() {
    if (state.scene === shownScene) return;
    if (shownScene) emit('sceneComplete', { scene: shownScene });
    shownScene = state.scene;
    const index = content.scenes.findIndex((s) => s.id === state.scene);
    sceneSlot.replaceChildren(SceneHeader({ scene: sceneById[state.scene], index, total: content.scenes.length, S }));
    emit('sceneStart', { scene: shownScene });
  }

  function showNode() {
    const node = content.nodes[state.node];
    updateScene();
    if (node.type === 'wrap') return showWrap(node);

    timer.shown(node.id);
    const flags = state.flags;
    const words = node.type === 'dialogue';
    const extra = [];
    let sheet = null;

    if (node.type === 'dialogue') extra.push(SpokenLine({ speaker: node.speaker, line: pick(node.line, flags) }));
    if (node.type === 'form') {
      sheet = FormSheet({ form: content.form, values: state.form, sections: node.sections, S });
      extra.push(sheet);
    }
    const doc = pickDocument(node.document, flags);
    if (doc && content.documentHtml[documentKey(doc)]) {
      extra.push(DocumentCard({ title: content.documents[doc.id].title, html: content.documentHtml[documentKey(doc)] }));
    }
    if (node.monday) extra.push(MondayCard({ monday: node.monday, flags, S }));

    const card = StoryCard({ kind: node.type, heading: pick(node.heading, flags), body: pick(node.body, flags), extra });
    card.dataset.node = node.id;

    if (node.choices) {
      const choiceForm = ChoiceForm({
        prompt: pick(node.prompt, flags),
        choices: orderedChoices(node, flags, shuffle ? state.seed : null),
        flags,
        words,
        S,
        onLock(choiceId) {
          const result = applyChoice(state, content, choiceId);
          state = result.state;
          save();
          timer.locked();

          if (sheet && result.filled.length) {
            const updated = FormSheet({ form: content.form, values: state.form, sections: node.sections, S, changed: new Set(result.filled) });
            sheet.replaceWith(updated);
            sheet = updated;
            const labels = content.form.sections.flatMap((s) => s.fields).filter((f) => result.filled.includes(f.id)).map((f) => f.label);
            announce(fill(S['form.updated'], { fields: labels.join(', ') }));
          }

          const consequence = ConsequenceCard({ feedback: result.feedback, words, S, onContinue: next });
          choiceForm.replaceWith(consequence);
          focusHeading(consequence);
        },
      });
      card.append(choiceForm);
    } else {
      card.append(
        h(
          'div',
          { class: 'actions' },
          primary(S['continue'], () => {
            state = advance(state, content).state;
            save();
            next();
          }),
        ),
      );
    }

    main.replaceChildren(card);
    focusHeading(card);
  }

  function next() {
    timer.done();
    showNode();
  }

  function showWrap(node) {
    const flags = state.flags;
    state.completed = true;
    save();

    const extra = [
      Glance({ history: state.history, content, flags, S }),
      MondayCard({ monday: node.monday, flags, S }),
      h('p', { class: 'disclosure' }, content.disclosure),
      timer.enabled && TimingLog({ timer, S }),
      h('div', { class: 'actions' }, secondary(S['intro.startOver'], startOver)),
    ];
    const card = StoryCard({ kind: 'wrap', heading: pick(node.heading, flags), body: pick(node.body, flags), extra });
    main.replaceChildren(card);
    focusHeading(card);

    // Fire on every visit to the wrap screen, including after a resume (it is idempotent).
    const report = notifyComplete(bridge, window);
    emit('complete', { report });
    if (timer.enabled) console.table(timer.summary());
  }

  // Start ------------------------------------------------------------------

  if (DEV) {
    mountDev({
      content,
      S,
      root,
      jump(nodeId, flags) {
        begin(stateAtNode(content, nodeId, flags));
      },
      setShuffle(on) {
        shuffle = on;
        if (state) showNode();
      },
    });
    const jumpTo = params.get('node');
    if (jumpTo && content.nodes[jumpTo]) {
      const flags = Object.fromEntries((params.get('flags') || '').split(',').filter(Boolean).map((f) => [f, true]));
      begin(stateAtNode(content, jumpTo, flags));
      return;
    }
  }

  showIntro();
}

function boot() {
  const root = document.getElementById('app');
  if (root) startApp(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
