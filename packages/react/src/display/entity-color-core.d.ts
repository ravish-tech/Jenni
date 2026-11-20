declare module 'jenni-core/behaviors/entity-color.js' {
  export const ENTITY_HUE_RING: readonly number[];
  export function hashEntitySeed(seed: string): number;
  export function getEntityHue(seed: string): number;
  export function getEntityColorVars(seed: string): Record<string, string>;
}
