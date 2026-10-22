// Dev-only tools: jump to any step with chosen flags. Included in dev builds
// (npm run dev) only; the production build drops this file entirely.
// Also available by URL in dev builds: ?node=2.1&flags=checkedSkin,jottedNote

import { h } from './dom.js';

export function mountDev({ content, S, root, jump }) {
  const select = h(
    'select',
    { id: 'dev-node' },
    content.scenes.map((scene) =>
      h(
        'optgroup',
        { label: scene.title },
        scene.nodes.map((id) => h('option', { value: id }, `${id} (${content.nodes[id].type})`)),
      ),
    ),
  );

  const flagBoxes = Object.entries(content.flags).map(([name, def]) =>
    h('label', { class: 'dev__flag', title: def.description }, h('input', { type: 'checkbox', value: name, checked: def.default }), ` ${name}`),
  );

  const panel = h(
    'details',
    { class: 'dev' },
    h('summary', null, S['dev.open']),
    h('label', { for: 'dev-node' }, S['dev.jump']),
    select,
    h('fieldset', null, h('legend', null, S['dev.flags']), flagBoxes),
    h(
      'button',
      {
        type: 'button',
        class: 'button button--secondary',
        onClick() {
          const flags = {};
          for (const box of panel.querySelectorAll('.dev__flag input')) flags[box.value] = box.checked;
          jump(select.value, flags);
          panel.open = false;
        },
      },
      S['dev.go'],
    ),
  );
  root.after(panel);
}
