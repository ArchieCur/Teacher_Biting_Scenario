// Flag conditions and variant lists.
//
// A condition ("when" or "showIf") is an object of flag names to true/false.
// Every key must match (AND). There is no OR and no expression language on
// purpose: if a branch needs more, add a flag.
//
// A variant list is an array of { when, <key> } objects tried in order. The
// last entry has no "when" and is the default. Plain values pass through.

/** @param {Record<string, boolean> | undefined} when @param {Record<string, boolean>} flags */
export function matches(when, flags) {
  if (!when) return true;
  return Object.keys(when).every((name) => Boolean(flags[name]) === when[name]);
}

/** True when value is a variant list (an array of objects) rather than a plain value. */
export function isVariantList(value) {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
}

/**
 * Resolve a plain value or a variant list against the current flags.
 * @param {unknown} value
 * @param {Record<string, boolean>} flags
 * @param {'text' | 'to' | 'value'} key  property holding the payload in each variant
 */
export function pick(value, flags, key = 'text') {
  if (!isVariantList(value)) return value;
  for (const variant of value) {
    if (matches(variant.when, flags)) return variant[key];
  }
  return undefined;
}
