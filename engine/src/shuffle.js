// Per-learner option order (D34). In the authored files the held option is
// often first and longest, which teaches guessing by position. Each learner
// gets a random seed, saved with their progress; each node's order comes from
// that seed plus the node id, so it stays the same on resume and differs
// between learners.

/** A 32-bit seed for a new learner. */
export function newSeed() {
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}

// FNV-1a: turns the seed and node id into a starting number for the generator.
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// mulberry32: a small, fast generator; good enough for ordering options.
function generator(start) {
  let a = start >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The node's choices in this learner's order. All choices are ordered first
 * and filtered afterward (by the caller), so options keep their relative order
 * when flags hide some of them.
 */
export function orderChoices(node, seed) {
  const list = [...(node.choices || [])];
  if (node.fixedOrder || seed == null) return list;
  const random = generator(hash(`${seed}:${node.id}`));
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
