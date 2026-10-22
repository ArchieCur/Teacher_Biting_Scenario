// UI components. Each returns a DOM element. No component contains scenario
// text: everything comes from content (module and scenes) or engine strings (S).

import { h, textBlock, fill, uid, formatText, formatInline } from './dom.js';
import { icons } from './icons.js';
import { pick } from './conditions.js';

const iconEl = (name, className = '') => h('span', { class: `icon-wrap ${className}`, html: icons[name] });

export function SceneHeader({ scene, index, total, S }) {
  return h(
    'div',
    { class: 'scene-header' },
    h(
      'p',
      { class: 'scene-pill' },
      scene.clock && h('span', { class: 'scene-pill__item' }, iconEl('clock'), h('span', { class: 'sr-only' }, `${S['header.time']}: `), scene.clock),
      scene.place && h('span', { class: 'scene-pill__item' }, iconEl('place'), h('span', { class: 'sr-only' }, `${S['header.place']}: `), scene.place),
    ),
    ProgressDots({ index, total, S }),
  );
}

export function ProgressDots({ index, total, S }) {
  const dots = [];
  for (let i = 0; i < total; i += 1) {
    dots.push(h('span', { class: `dot${i < index ? ' dot--done' : ''}${i === index ? ' dot--current' : ''}` }));
  }
  return h(
    'p',
    { class: 'progress' },
    h('span', { class: 'progress__dots', 'aria-hidden': 'true' }, dots),
    h('span', { class: 'progress__label' }, fill(S['header.scene'], { n: index + 1, total })),
  );
}

/** The card that holds a node's heading and body. The heading takes focus on each step. */
export function StoryCard({ heading, body, extra, kind }) {
  const headingId = uid('h');
  return h(
    'article',
    { class: `field field--${kind}`, 'aria-labelledby': headingId },
    h('h2', { id: headingId, class: 'field__heading', tabindex: '-1' }, heading),
    textBlock(body),
    extra,
  );
}

/** What the other adult says, in a dialogue node. */
export function SpokenLine({ speaker, line }) {
  return h(
    'figure',
    { class: 'spoken' },
    h('figcaption', { class: 'spoken__speaker' }, iconEl('speech'), speaker),
    h('blockquote', { class: 'spoken__line', html: formatText(line) }),
  );
}

/**
 * Two-step choice (D17): pick an option, then lock it in.
 * Real radio inputs in a fieldset, so it works with keyboards and screen readers.
 */
export function ChoiceForm({ prompt, choices, flags, words, S, onLock }) {
  const name = uid('choice');
  const errorId = uid('err');
  const legendId = uid('legend');
  const error = h('p', { id: errorId, class: 'choices__error', role: 'alert' });

  const options = choices.map((choice) => {
    const id = uid('opt');
    return h(
      'div',
      { class: `choice${words ? ' choice--words' : ''}` },
      h('input', { type: 'radio', name, id, value: choice.id, class: 'choice__input' }),
      h('label', { for: id, class: 'choice__label', html: formatInline(pick(choice.label, flags)) }),
    );
  });

  const form = h(
    'form',
    { class: 'choices', novalidate: true },
    h(
      'fieldset',
      { class: 'choices__set', 'aria-describedby': errorId },
      h('legend', { id: legendId, class: 'choices__legend' }, prompt),
      options,
    ),
    error,
    h('button', { type: 'submit', class: 'button button--primary' }, S['choice.lockIn']),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const picked = form.querySelector('input:checked');
    if (!picked) {
      error.textContent = S['choice.needSelection'];
      form.querySelector('input').focus();
      return;
    }
    onLock(picked.value);
  });
  form.addEventListener('change', () => {
    error.textContent = '';
  });
  return form;
}

export function OutcomePill({ tone, label, S }) {
  return h('p', { class: `outcome outcome--${tone}` }, iconEl(tone, 'outcome__icon'), h('span', null, label || S[`tone.${tone}`]));
}

/** Shown after a choice is locked in: the locked choice, then what happened and why. */
export function ConsequenceCard({ feedback, words, S, onContinue }) {
  const headingId = uid('h');
  return h(
    'section',
    { class: `consequence consequence--${feedback.tone}`, 'aria-labelledby': headingId },
    h(
      'div',
      { class: 'locked' },
      h('p', { class: 'locked__label' }, words ? S['choice.yourWords'] : S['choice.yourChoice']),
      h('div', { class: `locked__text${words ? ' locked__text--words' : ''}`, html: formatText(feedback.label) }),
    ),
    h('h3', { id: headingId, class: 'consequence__heading', tabindex: '-1' }, S['consequence.heading']),
    OutcomePill({ tone: feedback.tone, label: feedback.outcomeLabel, S }),
    textBlock(feedback.consequence, 'text consequence__story'),
    h('h4', { class: 'consequence__sub' }, S['consequence.why']),
    textBlock(feedback.why),
    feedback.say && h('h4', { class: 'consequence__sub' }, S['consequence.say']),
    feedback.say && h('blockquote', { class: 'say', html: formatText(feedback.say) }),
    h('button', { type: 'button', class: 'button button--primary', onClick: onContinue }, S['continue']),
  );
}

function box(checked, S) {
  return h(
    'span',
    { class: 'box' },
    h('span', { class: `box__mark${checked ? ' box__mark--on' : ''}`, 'aria-hidden': 'true' }),
    h('span', { class: 'sr-only' }, checked ? S['form.checked'] : S['form.unchecked']),
  );
}

function fieldValue(field, value, S) {
  if (field.kind === 'text') {
    return value ? h('dd', { class: 'sheet__value sheet__value--write' }, value) : h('dd', { class: 'sheet__value sheet__value--empty' }, S['form.empty']);
  }
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return h(
    'dd',
    { class: 'sheet__value' },
    h('ul', { class: 'sheet__options' }, field.options.map((opt) => h('li', null, box(selected.includes(opt), S), h('span', null, opt)))),
  );
}

/**
 * The reporting form as a document region (D20), not as disabled inputs.
 * `changed` is a Set of field ids to highlight after a choice fills them in.
 */
export function FormSheet({ form, values, sections, S, changed = new Set() }) {
  const headingId = uid('h');
  const active = new Set(sections?.active || form.sections.map((s) => s.id));
  const later = new Set(sections?.later || []);

  return h(
    'section',
    { class: 'sheet', 'aria-labelledby': headingId },
    h('h3', { id: headingId, class: 'sheet__title' }, iconEl('form'), form.title),
    form.sections.map((section) => {
      const isLater = later.has(section.id) && !active.has(section.id);
      const title = `${section.id}. ${section.title}`;
      if (isLater) {
        return h(
          'div',
          { class: 'sheet__section sheet__section--later' },
          h('h4', { class: 'sheet__section-title' }, title),
          h('p', { class: 'sheet__later' }, h('span', { class: 'sheet__later-tag' }, S['form.later']), sections.laterNote ? ` ${sections.laterNote}` : ''),
        );
      }
      // Consecutive fields that share a group get their own list under a sub-heading.
      const blocks = [];
      let list = null;
      let group;
      for (const field of section.fields) {
        if (!list || field.group !== group) {
          group = field.group;
          if (group) blocks.push(h('h5', { class: 'sheet__group' }, group));
          list = h('dl', { class: 'sheet__list' });
          blocks.push(list);
        }
        list.append(
          h(
            'div',
            { class: `sheet__row${changed.has(field.id) ? ' sheet__row--changed' : ''}`, 'data-field': field.id },
            h('dt', { class: 'sheet__label' }, field.label),
            fieldValue(field, values[field.id], S),
          ),
        );
      }
      return h('div', { class: 'sheet__section' }, h('h4', { class: 'sheet__section-title' }, title), blocks);
    }),
  );
}

export function MondayCard({ monday, flags, S }) {
  if (!monday) return null;
  const headingId = uid('h');
  return h(
    'section',
    { class: 'monday', 'aria-labelledby': headingId },
    h('h3', { id: headingId, class: 'monday__heading' }, pick(monday.title, flags) || S['monday.heading']),
    h(
      'ol',
      { class: 'monday__list' },
      monday.items.map((item) => {
        const say = pick(item.say, flags);
        return h(
          'li',
          null,
          h('div', { class: 'monday__do', html: formatText(pick(item.do, flags)) }),
          say && h('p', { class: 'monday__say' }, h('span', { class: 'monday__say-label' }, `${S['monday.say']} `), say),
        );
      }),
    ),
  );
}

/** "Your day at a glance": each decision with its outcome phrase. No score. */
export function Glance({ history, content, flags, S }) {
  const headingId = uid('h');
  return h(
    'section',
    { class: 'glance', 'aria-labelledby': headingId },
    h('h3', { id: headingId, class: 'glance__heading' }, S['wrap.glanceHeading']),
    h(
      'ol',
      { class: 'glance__list' },
      history.map((entry) => {
        const node = content.nodes[entry.node];
        const choice = node?.choices?.find((c) => c.id === entry.choice);
        if (!choice) return null;
        return h(
          'li',
          { class: 'glance__item' },
          h('p', { class: 'glance__summary' }, node.summary),
          OutcomePill({ tone: choice.tone, label: pick(choice.outcomeLabel, flags), S }),
        );
      }),
    ),
  );
}

export function TimingLog({ timer, S }) {
  const rows = timer.summary();
  return h(
    'section',
    { class: 'timing' },
    h('h3', null, S['wrap.timingHeading']),
    h('p', null, S['wrap.timingNote']),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        null,
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, S['wrap.timingNode']), h('th', { scope: 'col' }, S['wrap.timingDecide']), h('th', { scope: 'col' }, S['wrap.timingRead']))),
        h('tbody', null, rows.map((r) => h('tr', null, h('td', null, r.node), h('td', null, r.decide ?? '-'), h('td', null, r.read)))),
      ),
    ),
    h('textarea', { class: 'timing__csv', readonly: true, rows: '6', 'aria-label': S['wrap.timingHeading'] }, timer.csv()),
  );
}

/** A modal panel (policy reference, pause). Uses the native <dialog> for focus handling and Escape. */
export function Dialog({ heading, body, closeLabel, className = '' }) {
  const headingId = uid('h');
  const dialog = h(
    'dialog',
    { class: `sheet-dialog ${className}`, 'aria-labelledby': headingId },
    h(
      'div',
      { class: 'sheet-dialog__bar' },
      h('h2', { id: headingId, class: 'sheet-dialog__heading' }, heading),
      h('button', { type: 'button', class: 'button button--icon', 'aria-label': closeLabel, onClick: () => dialog.close() }, iconEl('close')),
    ),
    h('div', { class: 'sheet-dialog__body' }, body),
  );
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  return dialog;
}
