import { reactive, watch } from 'vue';

/** Playground preferences + live design-token knobs, persisted in localStorage. */
export type Theme = 'system' | 'light' | 'dark';
export type StageBg = 'plain' | 'dots' | 'grid';

export interface Knobs {
  hue: number;            // --j-hue
  linkNeutralHue: boolean; // --j-hue-neutral follows --j-hue
  neutralHue: number;     // --j-hue-neutral (when not linked)
  neutralChroma: number;  // --j-chroma-neutral
  radius: number;         // --j-radius-factor
  density: number;        // --j-density
}

export const KNOB_DEFAULTS: Knobs = {
  hue: 262,
  linkNeutralHue: true,
  neutralHue: 262,
  neutralChroma: 0.005,
  radius: 1,
  density: 1,
};

export const HUE_PRESETS = [
  { name: 'Slate Indigo', hue: 262 },
  { name: 'Graphite Blue', hue: 235 },
  { name: 'Obsidian Teal', hue: 195 },
  { name: 'Forest Sage', hue: 155 },
  { name: 'Warm Amber', hue: 68 },
  { name: 'Terracotta', hue: 38 },
  { name: 'Crimson Ink', hue: 22 },
  { name: 'Plum Slate', hue: 305 },
];

const KEY = 'jenni.playground.v2';

interface Prefs {
  theme: Theme;
  stage: StageBg;
  rail: boolean;
  knobs: Knobs;
}

function load(): Prefs {
  const base: Prefs = { theme: 'system', stage: 'dots', rail: false, knobs: { ...KNOB_DEFAULTS } };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { ...base, ...raw, knobs: { ...base.knobs, ...(raw.knobs ?? {}) } };
  } catch {
    return base;
  }
}

export const prefs = reactive<Prefs>(load());

export function resetKnobs() {
  Object.assign(prefs.knobs, KNOB_DEFAULTS);
}

export function knobsChanged() {
  return (Object.keys(KNOB_DEFAULTS) as (keyof Knobs)[]).some((k) => prefs.knobs[k] !== KNOB_DEFAULTS[k]);
}

function apply() {
  const root = document.documentElement;
  if (prefs.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', prefs.theme);

  const k = prefs.knobs;
  const set = (name: string, value: number, def: number) => {
    if (value === def) root.style.removeProperty(name);
    else root.style.setProperty(name, String(value));
  };
  set('--j-hue', k.hue, KNOB_DEFAULTS.hue);
  set('--j-hue-neutral', k.linkNeutralHue ? k.hue : k.neutralHue, KNOB_DEFAULTS.neutralHue);
  set('--j-chroma-neutral', k.neutralChroma, KNOB_DEFAULTS.neutralChroma);
  set('--j-radius-factor', k.radius, KNOB_DEFAULTS.radius);
  set('--j-density', k.density, KNOB_DEFAULTS.density);
}

export function startPrefs() {
  apply();
  watch(prefs, () => {
    apply();
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }, { deep: true });
}
