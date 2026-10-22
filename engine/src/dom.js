// Tiny DOM helpers. Text is always set as text, never parsed as HTML, except
// through formatText() (which escapes first) and the build-time policy HTML.

/**
 * h('p', { class: 'x', onClick: fn }, 'text', childNode, [more])
 * Attributes starting with "on" become event listeners. false/null skip.
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs || {})) {
    if (value === false || value == null) continue;
    if (name.startsWith('on') && typeof value === 'function') {
      el.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (name === 'html') {
      el.innerHTML = value;
    } else {
      el.setAttribute(name, value === true ? '' : String(value));
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children) {
    if (child == null || child === false) continue;
    if (Array.isArray(child)) append(el, child);
    else el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/**
 * Content text to HTML: every remaining line break is a paragraph break,
 * **double asterisks** make semibold. No other markup is supported (no
 * italics or underline, by design). YAML's folded style (>-) turns one blank
 * line into a single "\n" and joins other lines with spaces, so any "\n"
 * left in the text was meant as a paragraph break.
 */
export function formatText(text) {
  if (!text) return '';
  return String(text)
    .trim()
    .split(/\s*\n\s*/)
    .filter(Boolean)
    .map((para) => `<p>${formatInline(para)}</p>`)
    .join('');
}

/** Same as formatText but without paragraphs, for places that only allow inline text (labels). */
export function formatInline(text) {
  if (!text) return '';
  return escapeHtml(String(text).trim().replace(/\s*\n\s*/g, ' ')).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/** A block of formatted content text, or nothing. */
export function textBlock(text, className = 'text') {
  return text ? h('div', { class: className, html: formatText(text) }) : null;
}

/** Fill "{name}" placeholders in an engine string. */
export function fill(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (_, name) => (name in values ? values[name] : `{${name}}`));
}

let idCounter = 0;
export function uid(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
