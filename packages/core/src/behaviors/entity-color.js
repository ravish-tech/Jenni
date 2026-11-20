// Deterministic per-entity OKLCH hue hashing for avatars, badges, and series markers.

/**
 * Curated 12-slot perceptual OKLCH hue ring.
 * Every slot preserves distinct hue identity and >= 4.8:1 AA contrast in light and dark modes.
 * @type {readonly number[]}
 */
export const ENTITY_HUE_RING = Object.freeze([
  258, 195, 152, 330, 42, 222, 172, 295, 18, 82, 240, 128,
]);

/**
 * Deterministic 32-bit FNV-1a slot index (`0..11`) for an entity seed string.
 * @param {string} seed
 * @returns {number}
 */
export function hashEntitySeed(seed) {
  const str = String(seed ?? '').trim();
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % ENTITY_HUE_RING.length;
}

/**
 * Return deterministic perceptual OKLCH hue angle (`0..360`) for `seed`.
 * @param {string} seed
 * @returns {number}
 */
export function getEntityHue(seed) {
  return ENTITY_HUE_RING[hashEntitySeed(seed)];
}

/**
 * Return CSS custom properties (`{ '--j-entity-hue': String(hue) }`) for `[data-entity-color]` elements.
 * @param {string} seed
 * @returns {Record<string, string>}
 */
export function getEntityColorVars(seed) {
  const hue = getEntityHue(seed);
  return { '--j-entity-hue': String(hue) };
}
