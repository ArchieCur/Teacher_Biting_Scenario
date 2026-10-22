// Saving progress. Embedded frames often block or partition storage, so every
// access is wrapped and the module works with no storage at all.
//
// save() reports where the data actually landed, after reading it back:
//   'local'   localStorage: survives closing the window
//   'session' sessionStorage: survives reloads, lost when the window closes
//   'memory'  nothing persistent: lost on reload
// The pause dialog uses this to tell the learner the truth.

export function createStore(key, { win = globalThis, disabled = false } = {}) {
  const backends = [];
  if (!disabled) {
    for (const [name, level] of [['localStorage', 'local'], ['sessionStorage', 'session']]) {
      try {
        const store = win[name];
        const probe = `${key}:probe`;
        store.setItem(probe, '1');
        const ok = store.getItem(probe) === '1';
        store.removeItem(probe);
        if (ok) backends.push({ store, level });
      } catch {
        // Blocked, partitioned away or missing. Try the next one.
      }
    }
  }
  let memory = null;

  return {
    save(data) {
      const text = JSON.stringify(data);
      memory = text;
      for (const { store, level } of backends) {
        try {
          store.setItem(key, text);
          if (store.getItem(key) === text) return level;
        } catch {
          // Quota or a policy change mid-session. Fall through.
        }
      }
      return 'memory';
    },

    load() {
      for (const { store } of backends) {
        try {
          const text = store.getItem(key);
          if (text) return JSON.parse(text);
        } catch {
          // Unreadable or corrupt. Ignore it.
        }
      }
      try {
        return memory ? JSON.parse(memory) : null;
      } catch {
        return null;
      }
    },

    clear() {
      memory = null;
      for (const { store } of backends) {
        try {
          store.removeItem(key);
        } catch {
          // Nothing more to do.
        }
      }
    },
  };
}
