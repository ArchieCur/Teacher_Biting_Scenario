// Inline SVG icons, drawn in ink (currentColor). Always paired with words, and
// always hidden from assistive technology because the words carry the meaning.

const svg = (body) =>
  `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const icons = {
  held: svg('<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9"/>'),
  partial: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'),
  risk: svg('<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5"/><path d="M12 17.2v.1"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  place: svg('<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>'),
  book: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'),
  pause: svg('<path d="M9 5v14"/><path d="M15 5v14"/>'),
  close: svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>'),
  speech: svg('<path d="M4 5h16v11H9l-5 4z"/>'),
  form: svg('<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7"/><path d="M9 15h7"/>'),
};
