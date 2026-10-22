// Timing log for the volunteer tests (D18). Records how long each step takes,
// on this device only. On in dev builds, or with ?timing=1 in any build.

export function createTimer(enabled, now = () => performance.now()) {
  const rows = [];
  let current = null;

  return {
    enabled,
    rows,
    shown(nodeId) {
      if (!enabled) return;
      current = { node: nodeId, shown: now(), locked: null, done: null };
      rows.push(current);
    },
    locked() {
      if (current) current.locked = now();
    },
    done() {
      if (current) current.done = now();
    },
    /** Seconds per step: [{ node, decide, read }]. decide is null for steps without a choice. */
    summary() {
      return rows
        .filter((r) => r.done != null)
        .map((r) => ({
          node: r.node,
          decide: r.locked != null ? round((r.locked - r.shown) / 1000) : null,
          read: round((r.done - (r.locked ?? r.shown)) / 1000),
        }));
    },
    csv() {
      const lines = ['step,decide_seconds,read_seconds'];
      for (const r of this.summary()) lines.push(`${r.node},${r.decide ?? ''},${r.read}`);
      const total = this.summary().reduce((sum, r) => sum + (r.decide || 0) + r.read, 0);
      lines.push(`total,,${round(total)}`);
      return lines.join('\n');
    },
  };
}

function round(n) {
  return Math.round(n * 10) / 10;
}
