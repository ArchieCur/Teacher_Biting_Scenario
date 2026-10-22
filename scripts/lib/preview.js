// Content preview: one read-only page listing every node, option, consequence
// and variant, so the content can be reviewed without playing every path.

import { isVariantList } from '../../engine/src/conditions.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const cond = (when) =>
  when
    ? Object.entries(when)
        .map(([k, v]) => `${k} is ${v ? 'on' : 'off'}`)
        .join(' and ')
    : '';

function text(value, key = 'text') {
  if (value == null || value === '') return '';
  if (isVariantList(value)) {
    return `<ul class="variants">${value
      .map((v) => `<li><span class="when">${v.when ? `when ${esc(cond(v.when))}` : 'otherwise'}</span> ${fmt(v[key])}</li>`)
      .join('')}</ul>`;
  }
  return fmt(value);
}

function fmt(v) {
  if (Array.isArray(v)) return esc(v.join('; '));
  // Same paragraph rule as the engine (engine/src/dom.js): every line break is a paragraph break.
  return esc(String(v).trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\s*\n\s*/g, '<br><br>');
}

const row = (label, value) => (value ? `<tr><th scope="row">${esc(label)}</th><td>${value}</td></tr>` : '');

function choiceBlock(choice) {
  const flags = Object.entries(choice.setFlags || {})
    .map(([k, v]) => `${k} ${v ? 'on' : 'off'}`)
    .join(', ');
  const fills = Object.entries(choice.fill || {})
    .map(([k, v]) => `<div><code>${esc(k)}</code>: ${text(v, 'value')}</div>`)
    .join('');
  return `<div class="choice tone-${choice.tone}">
  <h4><code>${esc(choice.id)}</code> <span class="tone">${esc(choice.tone)}</span>${choice.showIf ? ` <span class="when">shown when ${esc(cond(choice.showIf))}</span>` : ''}</h4>
  <table>${row('Label', text(choice.label))}${row('Outcome label', text(choice.outcomeLabel))}${row('Consequence', text(choice.consequence))}${row('Why', text(choice.why))}${row('Say this', text(choice.say))}${row('Sets flags', esc(flags))}${row('Fills form', fills)}${row('Next', text(choice.next, 'to'))}</table>
</div>`;
}

function docRow(ref) {
  if (!ref) return '';
  const list = Array.isArray(ref) ? ref : [ref];
  return list.map((r) => `${r.when ? `<span class="when">when ${esc(cond(r.when))}</span> ` : ''}<code>${esc(r.id)}</code>: ${esc(r.section)}`).join('<br>');
}

function mondayBlock(monday) {
  if (!monday) return '';
  return `<div class="monday"><strong>${monday.title ? text(monday.title) : 'Monday card'}</strong><ol>${monday.items
    .map((i) => `<li>${text(i.do)}${i.say ? `<div class="say">Say: ${text(i.say)}</div>` : ''}</li>`)
    .join('')}</ol></div>`;
}

export function renderPreview(content) {
  const flagRows = Object.entries(content.flags)
    .map(([name, def]) => `<tr><td><code>${esc(name)}</code></td><td>${def.default ? 'on' : 'off'}</td><td>${esc(def.description)}</td></tr>`)
    .join('');

  const scenes = content.scenes
    .map((scene) => {
      const nodes = scene.nodes
        .map((id) => {
          const n = content.nodes[id];
          return `<section class="node" id="node-${esc(id)}">
  <h3><code>${esc(id)}</code> <span class="type">${esc(n.type)}</span> ${text(n.heading)}</h3>
  <table>${row('Summary', esc(n.summary))}${row('Body', text(n.body))}${row('Speaker', esc(n.speaker))}${row('Line', text(n.line))}${row('Form sections', n.sections ? esc(`now: ${(n.sections.active || []).join(', ')}; later: ${(n.sections.later || []).join(', ')}`) : '')}${row('Document', docRow(n.document))}${row('Prompt', text(n.prompt))}${row('Next', text(n.next, 'to'))}</table>
  ${(n.choices || []).map(choiceBlock).join('')}
  ${mondayBlock(n.monday)}
</section>`;
        })
        .join('');
      return `<section class="scene"><h2>${esc(scene.title)}${scene.clock ? ` <small>${esc(scene.clock)}${scene.place ? `, ${esc(scene.place)}` : ''}</small>` : ''}</h2>${nodes}</section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="${esc(content.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Content preview: ${esc(content.title)}</title>
<style>
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #243A78; background: #F8F4EE; margin: 0; padding: 1rem; line-height: 1.5; }
main { max-width: 60rem; margin: 0 auto; }
h1 { margin-top: 0; }
.scene { margin-top: 2.5rem; }
.node { background: #fff; border-radius: 12px; padding: 1rem 1.25rem; margin: 1rem 0; box-shadow: 0 2px 10px rgba(36,58,120,.1); }
.type, .tone { font-size: .8rem; font-weight: 600; border: 1px solid #243A78; border-radius: 999px; padding: 0 .5rem; vertical-align: middle; }
.when { font-size: .85rem; font-weight: 600; background: #D4EFF8; border-radius: 4px; padding: 0 .35rem; }
table { border-collapse: collapse; width: 100%; margin: .5rem 0; }
th { text-align: left; vertical-align: top; width: 9rem; padding: .25rem .5rem .25rem 0; font-weight: 600; }
td { padding: .25rem 0; vertical-align: top; }
.choice { border-left: 6px solid #A8DFF0; padding: .25rem 0 .25rem .75rem; margin: 1rem 0; }
.tone-held { border-left-color: #35C27C; } .tone-partial { border-left-color: #FFDE59; } .tone-risk { border-left-color: #EE5A47; }
.choice h4 { margin: .25rem 0; }
.variants { margin: 0; padding-left: 1.1rem; }
.monday { background: #F8F4EE; border-radius: 8px; padding: .5rem .75rem; margin-top: .75rem; }
.say { font-size: .95rem; }
code { font-size: .9em; }
</style>
</head>
<body>
<main>
<h1>Content preview: ${esc(content.title)}</h1>
<p>Generated by <code>npm run build</code> from the module's YAML files. Content version <code>${esc(content.version)}</code>. Read-only.</p>
<p><strong>Disclosure:</strong> ${esc(content.disclosure)}</p>
<h2>Flags</h2>
<table><thead><tr><th>Flag</th><th>Starts</th><th>Meaning</th></tr></thead><tbody>${flagRows}</tbody></table>
${scenes}
</main>
</body>
</html>
`;
}
