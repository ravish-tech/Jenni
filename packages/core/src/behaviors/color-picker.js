// Jenni — Color Picker behavior & perceptual OKLCH/HSV/RGB color engine.
// Exports: parseColor, formatColor, hsvToHex, hexToOklchString, createColorPicker, initColorPickers.

import { anchorPopover } from './anchor.js';

/**
 * @typedef {{ h: number, s: number, v: number, a: number }} HsvaColor
 * @typedef {{ r: number, g: number, b: number, a: number }} RgbaColor
 * @typedef {'hex' | 'oklch' | 'rgb'} ColorFormat
 */

/** Curated architectural palette (poised chroma, OKLCH-balanced). */
export const DEFAULT_OKLCH_SWATCHES = [
  '#4f46e5', // Slate-Indigo
  '#2563eb', // Cobalt
  '#0891b2', // Cerulean
  '#0d9488', // Teal
  '#16a34a', // Botanical Green
  '#ca8a04', // Ochre Gold
  '#ea580c', // Terracotta
  '#dc2626', // Vermilion
  '#be185d', // Berry
  '#7c3aed', // Iris
  '#475569', // Slate
  '#1e293b', // Obsidian
  '#78716c', // Warm Stone
  '#94a3b8', // Mist
  '#e2e8f0', // Paper Ash
  '#0f172a', // Deep Ink
];

/**
 * Clamp `n` into `[min, max]`.
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Convert `0..255` byte to 2-char lowercase hex.
 * @param {number} b
 * @returns {string}
 */
function byteHex(b) {
  return clamp(Math.round(b), 0, 255).toString(16).padStart(2, '0');
}

/**
 * Convert HSV (`h: 0..360, s: 0..100, v: 0..100, a?: 0..1`) to RGBA (`0..255`, `a: 0..1`).
 * @param {number} h
 * @param {number} s
 * @param {number} v
 * @param {number} [a]
 * @returns {RgbaColor}
 */
export function hsvToRgb(h, s, v, a = 1) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const val = clamp(v, 0, 100) / 100;

  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hue < 60) [r1, g1, b1] = [c, x, 0];
  else if (hue < 120) [r1, g1, b1] = [x, c, 0];
  else if (hue < 180) [r1, g1, b1] = [0, c, x];
  else if (hue < 240) [r1, g1, b1] = [0, x, c];
  else if (hue < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a: Number(clamp(a, 0, 1).toFixed(3)),
  };
}

/**
 * Convert RGBA (`0..255`, `a: 0..1`) to HSVA (`h: 0..360, s: 0..100, v: 0..100, a: 0..1`).
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} [a]
 * @returns {HsvaColor}
 */
export function rgbToHsv(r, g, b, a = 1) {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d > 1e-6) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  return {
    h: Number(h.toFixed(1)),
    s: Number(s.toFixed(1)),
    v: Number(v.toFixed(1)),
    a: Number(clamp(a, 0, 1).toFixed(3)),
  };
}

/**
 * Convert HSV(A) directly to `#rrggbb` (or `#rrggbbaa` when `a < 1`).
 * @param {number} h
 * @param {number} s
 * @param {number} v
 * @param {number} [a]
 * @returns {string}
 */
export function hsvToHex(h, s, v, a = 1) {
  const { r, g, b, a: alpha } = hsvToRgb(h, s, v, a);
  const base = `#${byteHex(r)}${byteHex(g)}${byteHex(b)}`;
  return alpha < 0.999 ? `${base}${byteHex(alpha * 255)}` : base;
}

/**
 * sRGB channel `[0..255]` to linear light `[0..1]`.
 * @param {number} ch
 * @returns {number}
 */
function srgbToLinear(ch) {
  const c = clamp(ch, 0, 255) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Linear light `[0..1]` to sRGB byte `[0..255]`.
 * @param {number} lin
 * @returns {number}
 */
function linearToSrgb(lin) {
  const c = clamp(lin, 0, 1);
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(clamp(s, 0, 1) * 255);
}

/**
 * Convert sRGB (`0..255`) to perceptual OKLCH (`{ l: 0..100, c: 0..0.4, h: 0..360 }`).
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{ l: number, c: number, h: number }}
 */
export function rgbToOklch(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.hypot(A, B);
  const H = C < 0.0004 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;

  return {
    l: Number((clamp(L, 0, 1) * 100).toFixed(1)),
    c: Number(C.toFixed(3)),
    h: Math.round(H),
  };
}

/**
 * Convert OKLCH (`lPct: 0..100, c: 0..0.5, hDeg: 0..360`) to sRGB `{ r, g, b }`.
 * @param {number} lPct
 * @param {number} c
 * @param {number} hDeg
 * @returns {{ r: number, g: number, b: number }}
 */
export function oklchToRgb(lPct, c, hDeg) {
  const L = clamp(lPct, 0, 100) / 100;
  const rad = (((hDeg % 360) + 360) % 360) * (Math.PI / 180);
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);

  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: linearToSrgb(lr),
    g: linearToSrgb(lg),
    b: linearToSrgb(lb),
  };
}

/**
 * Convert a HEX color string into a CSS `oklch(...)` string.
 * @param {string} hex
 * @returns {string}
 */
export function hexToOklchString(hex) {
  const parsed = parseColor(hex);
  if (!parsed) return 'oklch(50% 0 0)';
  return formatColor(parsed, 'oklch', parsed.a < 0.999);
}

/**
 * Parse a `#hex`, `rgb(...)`, `rgba(...)`, or `oklch(...)` string into HSVA, or `null`.
 * @param {string | null | undefined} input
 * @returns {HsvaColor | null}
 */
export function parseColor(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();

  // 1. HEX (#rgb, #rgba, #rrggbb, #rrggbbaa)
  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
  if (hexMatch && (s.startsWith('#') || hexMatch[1].length >= 6)) {
    const raw = hexMatch[1];
    if (raw.length === 3 || raw.length === 4) {
      const r = parseInt(raw[0] + raw[0], 16);
      const g = parseInt(raw[1] + raw[1], 16);
      const b = parseInt(raw[2] + raw[2], 16);
      const a = raw.length === 4 ? parseInt(raw[3] + raw[3], 16) / 255 : 1;
      return rgbToHsv(r, g, b, a);
    }
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    const a = raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1;
    return rgbToHsv(r, g, b, a);
  }

  // 2. rgb() / rgba() — both comma and modern space/slash syntax
  const rgbMatch =
    /^rgba?\(\s*([\d.]+)\s*(?:,\s*|\s+)([\d.]+)\s*(?:,\s*|\s+)([\d.]+)(?:\s*(?:,\s*|\/\s*)([\d.]+%?))?\s*\)$/i.exec(
      s,
    );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    let a = 1;
    if (rgbMatch[4] != null) {
      a = rgbMatch[4].endsWith('%')
        ? Number(rgbMatch[4].slice(0, -1)) / 100
        : Number(rgbMatch[4]);
    }
    if ([r, g, b, a].some((n) => !Number.isFinite(n))) return null;
    return rgbToHsv(r, g, b, a);
  }

  // 3. oklch(L% C H [/ A])
  const oklchMatch =
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/i.exec(
      s,
    );
  if (oklchMatch) {
    const lRaw = Number(oklchMatch[1]);
    const lPct = oklchMatch[2] === '%' || lRaw > 1 ? lRaw : lRaw * 100;
    const c = Number(oklchMatch[3]);
    const hDeg = Number(oklchMatch[4]);
    let a = 1;
    if (oklchMatch[5] != null) {
      a = oklchMatch[5].endsWith('%')
        ? Number(oklchMatch[5].slice(0, -1)) / 100
        : Number(oklchMatch[5]);
    }
    if ([lPct, c, hDeg, a].some((n) => !Number.isFinite(n))) return null;
    const { r, g, b } = oklchToRgb(lPct, c, hDeg);
    const hsv = rgbToHsv(r, g, b, a);
    if (hsv.s < 0.5 && c < 0.002) hsv.h = ((hDeg % 360) + 360) % 360;
    return hsv;
  }

  return null;
}

/**
 * Format an HSVA color into `hex`, `oklch`, or `rgb`.
 * @param {HsvaColor} hsva
 * @param {ColorFormat} [format]
 * @param {boolean} [includeAlpha]
 * @returns {string}
 */
export function formatColor(hsva, format = 'hex', includeAlpha = false) {
  const a = includeAlpha ? clamp(hsva.a, 0, 1) : 1;
  const showAlpha = includeAlpha && a < 0.999;

  if (format === 'hex') {
    return hsvToHex(hsva.h, hsva.s, hsva.v, showAlpha ? a : 1);
  }

  const { r, g, b } = hsvToRgb(hsva.h, hsva.s, hsva.v, a);

  if (format === 'rgb') {
    if (showAlpha) {
      return `rgb(${r} ${g} ${b} / ${Number(a.toFixed(2))})`;
    }
    return `rgb(${r} ${g} ${b})`;
  }

  const { l, c, h } = rgbToOklch(r, g, b);
  if (showAlpha) {
    return `oklch(${l}% ${c} ${h} / ${Number(a.toFixed(2))})`;
  }
  return `oklch(${l}% ${c} ${h})`;
}

/**
 * Wire anchor positioning for a `.j-color-picker-field` shell and its `[popover]` panel.
 * @param {HTMLElement} shell
 * @param {HTMLElement} popover
 * @param {{ side?: string }} [options]
 * @returns {() => void}
 */
export function anchorColorPopover(shell, popover, options = {}) {
  if (!popover.hasAttribute('popover')) popover.setAttribute('popover', 'auto');
  if (!popover.dataset.align) popover.dataset.align = 'start';
  return anchorPopover(shell, popover, { side: options.side || 'bottom' });
}

/**
 * Attach pointer-capture 1D/2D dragging to a surface element.
 * @param {HTMLElement} el
 * @param {(nx: number, ny: number) => void} onMove
 * @returns {() => void}
 */
export function bindPointerDrag(el, onMove) {
  /** @param {PointerEvent} e */
  const compute = (e) => {
    const rect = el.getBoundingClientRect();
    const nx = rect.width > 0 ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0;
    const ny = rect.height > 0 ? clamp((e.clientY - rect.top) / rect.height, 0, 1) : 0;
    onMove(nx, ny);
  };

  /** @param {PointerEvent} e */
  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    el.focus({ preventScroll: true });
    el.setPointerCapture(e.pointerId);
    compute(e);

    /** @param {PointerEvent} ev */
    const onPointerMove = (ev) => compute(ev);
    const onPointerUp = () => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  };

  el.addEventListener('pointerdown', onPointerDown);
  return () => el.removeEventListener('pointerdown', onPointerDown);
}

/**
 * Create an interactive `.j-color-picker` inspector inside `root` for plain HTML.
 * @param {HTMLElement} root
 * @param {{
 *   value?: string,
 *   format?: ColorFormat,
 *   alpha?: boolean,
 *   swatches?: string[],
 *   onChange?: (formatted: string, hsva: HsvaColor) => void
 * }} [options]
 * @returns {{ destroy: () => void, setValue: (v: string) => void, getValue: () => string }}
 */
export function createColorPicker(root, options = {}) {
  const showAlpha =
    options.alpha ?? (root.dataset.alpha === 'true' || root.hasAttribute('data-alpha'));
  /** @type {ColorFormat} */
  let format = /** @type {ColorFormat} */ (options.format || root.dataset.format || 'hex');
  const swatches = options.swatches ?? DEFAULT_OKLCH_SWATCHES;

  let hsva = parseColor(options.value || root.dataset.value || '#5b5bd6') || {
    h: 262,
    s: 68,
    v: 84,
    a: 1,
  };

  // Build inspector DOM
  const spectrum = document.createElement('div');
  spectrum.className = 'j-color-picker__spectrum';
  spectrum.tabIndex = 0;
  spectrum.setAttribute('role', 'slider');
  spectrum.setAttribute('aria-label', 'Color saturation and brightness');
  const loupe = document.createElement('span');
  loupe.className = 'j-color-picker__loupe';
  spectrum.appendChild(loupe);

  const controls = document.createElement('div');
  controls.className = 'j-color-picker__controls';
  const well = document.createElement('span');
  well.className = 'j-color-picker__well';
  well.setAttribute('aria-hidden', 'true');

  const sliders = document.createElement('div');
  sliders.className = 'j-color-picker__sliders';

  const hueTrack = document.createElement('div');
  hueTrack.className = 'j-color-picker__track';
  hueTrack.dataset.track = 'hue';
  hueTrack.tabIndex = 0;
  hueTrack.setAttribute('role', 'slider');
  hueTrack.setAttribute('aria-label', 'Hue');
  hueTrack.setAttribute('aria-valuemin', '0');
  hueTrack.setAttribute('aria-valuemax', '360');
  const hueThumb = document.createElement('span');
  hueThumb.className = 'j-color-picker__thumb';
  hueTrack.appendChild(hueThumb);
  sliders.appendChild(hueTrack);

  /** @type {HTMLDivElement | null} */
  let alphaTrack = null;
  /** @type {HTMLSpanElement | null} */
  let alphaThumb = null;
  if (showAlpha) {
    alphaTrack = document.createElement('div');
    alphaTrack.className = 'j-color-picker__track';
    alphaTrack.dataset.track = 'alpha';
    alphaTrack.tabIndex = 0;
    alphaTrack.setAttribute('role', 'slider');
    alphaTrack.setAttribute('aria-label', 'Opacity');
    alphaTrack.setAttribute('aria-valuemin', '0');
    alphaTrack.setAttribute('aria-valuemax', '100');
    alphaThumb = document.createElement('span');
    alphaThumb.className = 'j-color-picker__thumb';
    alphaTrack.appendChild(alphaThumb);
    sliders.appendChild(alphaTrack);
  }
  controls.append(well, sliders);

  const formatsBar = document.createElement('div');
  formatsBar.className = 'j-color-picker__formats';
  /** @type {Record<ColorFormat, HTMLButtonElement>} */
  const formatBtns = /** @type {any} */ ({});
  for (const fmt of /** @type {ColorFormat[]} */ (['hex', 'oklch', 'rgb'])) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'j-color-picker__format-btn';
    btn.textContent = fmt.toUpperCase();
    btn.addEventListener('click', () => {
      format = fmt;
      syncUI(true);
      emit();
    });
    formatBtns[fmt] = btn;
    formatsBar.appendChild(btn);
  }

  const readout = document.createElement('div');
  readout.className = 'j-color-picker__readout';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'j-color-picker__input';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Color value');
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'j-color-picker__copy';
  copyBtn.setAttribute('aria-label', 'Copy color value');
  copyBtn.textContent = '⧉';
  readout.append(input, copyBtn);

  const swatchGrid = document.createElement('div');
  swatchGrid.className = 'j-color-picker__swatches';
  /** @type {Array<{ hex: string, btn: HTMLButtonElement }>} */
  const swatchEntries = [];
  for (const sw of swatches) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'j-color-picker__swatch';
    btn.style.setProperty('--_swatch-bg', sw);
    btn.setAttribute('aria-label', `Select ${sw}`);
    btn.addEventListener('click', () => {
      const p = parseColor(sw);
      if (p) {
        hsva = { ...p, a: hsva.a };
        syncUI(true);
        emit();
      }
    });
    swatchEntries.push({ hex: sw.toLowerCase(), btn });
    swatchGrid.appendChild(btn);
  }

  root.replaceChildren(spectrum, controls, formatsBar, readout);
  if (swatches.length) root.appendChild(swatchGrid);

  /**
   * @param {boolean} [updateInput]
   */
  function syncUI(updateInput = true) {
    const solidHex = hsvToHex(hsva.h, hsva.s, hsva.v, 1);
    const previewStr = formatColor(hsva, 'rgb', showAlpha);
    root.style.setProperty('--_cp-hue', String(hsva.h));
    root.style.setProperty('--_cp-sat', `${hsva.s}%`);
    root.style.setProperty('--_cp-val', `${hsva.v}%`);
    root.style.setProperty('--_cp-solid', solidHex);
    root.style.setProperty('--_cp-preview', previewStr);

    hueTrack.style.setProperty('--_track-pct', `${(hsva.h / 360) * 100}%`);
    hueThumb.style.setProperty('--_thumb-bg', `hsl(${hsva.h} 100% 50%)`);
    hueTrack.setAttribute('aria-valuenow', String(Math.round(hsva.h)));

    if (alphaTrack && alphaThumb) {
      alphaTrack.style.setProperty('--_track-pct', `${hsva.a * 100}%`);
      alphaThumb.style.setProperty('--_thumb-bg', previewStr);
      alphaTrack.setAttribute('aria-valuenow', String(Math.round(hsva.a * 100)));
    }

    for (const fmt of /** @type {ColorFormat[]} */ (['hex', 'oklch', 'rgb'])) {
      formatBtns[fmt].setAttribute('aria-pressed', format === fmt ? 'true' : 'false');
    }

    if (updateInput && document.activeElement !== input) {
      input.value = formatColor(hsva, format, showAlpha);
    }

    const curHex = solidHex.toLowerCase();
    for (const entry of swatchEntries) {
      entry.btn.setAttribute('aria-selected', entry.hex === curHex ? 'true' : 'false');
    }
  }

  function emit() {
    const formatted = formatColor(hsva, format, showAlpha);
    root.dataset.value = formatted;
    options.onChange?.(formatted, { ...hsva });
    root.dispatchEvent(
      new CustomEvent('j-change', {
        bubbles: true,
        detail: { value: formatted, hsva: { ...hsva } },
      }),
    );
  }

  const stopSpec = bindPointerDrag(spectrum, (nx, ny) => {
    hsva = {
      ...hsva,
      s: Number((nx * 100).toFixed(1)),
      v: Number(((1 - ny) * 100).toFixed(1)),
    };
    syncUI(true);
    emit();
  });

  const stopHue = bindPointerDrag(hueTrack, (nx) => {
    hsva = { ...hsva, h: Number((nx * 360).toFixed(1)) };
    syncUI(true);
    emit();
  });

  const stopAlpha = alphaTrack
    ? bindPointerDrag(alphaTrack, (nx) => {
        hsva = { ...hsva, a: Number(nx.toFixed(2)) };
        syncUI(true);
        emit();
      })
    : null;

  /** @param {KeyboardEvent} e */
  const onSpecKey = (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') hsva = { ...hsva, s: clamp(hsva.s - step, 0, 100) };
    else if (e.key === 'ArrowRight') hsva = { ...hsva, s: clamp(hsva.s + step, 0, 100) };
    else if (e.key === 'ArrowUp') hsva = { ...hsva, v: clamp(hsva.v + step, 0, 100) };
    else if (e.key === 'ArrowDown') hsva = { ...hsva, v: clamp(hsva.v - step, 0, 100) };
    else return;
    e.preventDefault();
    syncUI(true);
    emit();
  };

  /** @param {KeyboardEvent} e */
  const onHueKey = (e) => {
    const step = e.shiftKey ? 15 : 3;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      hsva = { ...hsva, h: (hsva.h - step + 360) % 360 };
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      hsva = { ...hsva, h: (hsva.h + step) % 360 };
    } else return;
    e.preventDefault();
    syncUI(true);
    emit();
  };

  /** @param {KeyboardEvent} e */
  const onAlphaKey = (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      hsva = { ...hsva, a: clamp(Number((hsva.a - step).toFixed(2)), 0, 1) };
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      hsva = { ...hsva, a: clamp(Number((hsva.a + step).toFixed(2)), 0, 1) };
    } else return;
    e.preventDefault();
    syncUI(true);
    emit();
  };

  const onInputChange = () => {
    const parsed = parseColor(input.value);
    if (parsed) {
      hsva = parsed;
      syncUI(false);
      emit();
    }
  };

  const onInputBlur = () => {
    syncUI(true);
  };

  let copyTimer = 0;
  const onCopy = () => {
    const text = formatColor(hsva, format, showAlpha);
    navigator.clipboard?.writeText(text).catch(() => {});
    copyBtn.dataset.copied = '';
    copyBtn.textContent = '✓';
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      delete copyBtn.dataset.copied;
      copyBtn.textContent = '⧉';
    }, 1200);
  };

  spectrum.addEventListener('keydown', onSpecKey);
  hueTrack.addEventListener('keydown', onHueKey);
  alphaTrack?.addEventListener('keydown', onAlphaKey);
  input.addEventListener('input', onInputChange);
  input.addEventListener('blur', onInputBlur);
  copyBtn.addEventListener('click', onCopy);

  syncUI(true);

  return {
    destroy() {
      stopSpec();
      stopHue();
      stopAlpha?.();
      window.clearTimeout(copyTimer);
      spectrum.removeEventListener('keydown', onSpecKey);
      hueTrack.removeEventListener('keydown', onHueKey);
      alphaTrack?.removeEventListener('keydown', onAlphaKey);
      input.removeEventListener('input', onInputChange);
      input.removeEventListener('blur', onInputBlur);
      copyBtn.removeEventListener('click', onCopy);
    },
    /** @param {string} v */
    setValue(v) {
      const p = parseColor(v);
      if (p) {
        hsva = p;
        syncUI(true);
      }
    },
    getValue() {
      return formatColor(hsva, format, showAlpha);
    },
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init unmanaged `.j-color-picker` and `.j-color-picker-field` elements inside `root`.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initColorPickers(root = document) {
  /** @type {Array<() => void>} */
  const cleanups = [];

  root.querySelectorAll('.j-color-picker-field:not([data-j-managed])').forEach((el) => {
    const field = /** @type {HTMLElement} */ (el);
    if (bound.has(field)) return;
    const trigger = /** @type {HTMLButtonElement | null} */ (
      field.querySelector('.j-color-picker-field__trigger')
    );
    const swatchEl = /** @type {HTMLElement | null} */ (
      field.querySelector('.j-color-picker-field__swatch')
    );
    const labelEl = /** @type {HTMLElement | null} */ (
      field.querySelector('.j-color-picker-field__label')
    );
    const popId = trigger?.getAttribute('popovertarget') || field.dataset.jColorPicker;
    const pop =
      (popId ? document.getElementById(popId) : null) ||
      /** @type {HTMLElement | null} */ (
        field.nextElementSibling?.classList.contains('j-color-picker__popover')
          ? field.nextElementSibling
          : null
      );
    if (!trigger || !pop) return;

    let card = /** @type {HTMLElement | null} */ (pop.querySelector('.j-color-picker'));
    if (!card) {
      card = document.createElement('div');
      card.className = 'j-color-picker';
      pop.appendChild(card);
    }

    const ctrl = createColorPicker(card, {
      value: field.dataset.value || '#4f46e5',
      alpha: field.hasAttribute('data-alpha'),
      onChange(val) {
        swatchEl?.style.setProperty('--_swatch-color', val);
        if (labelEl) labelEl.textContent = val;
        field.dispatchEvent(
          new CustomEvent('j-change', { bubbles: true, detail: { value: val } }),
        );
      },
    });
    const initVal = ctrl.getValue();
    swatchEl?.style.setProperty('--_swatch-color', initVal);
    if (labelEl) labelEl.textContent = initVal;

    const stopAnchor = anchorColorPopover(field, pop);
    /** @param {Event} e */
    const onToggle = (e) => {
      const open = /** @type {ToggleEvent} */ (e).newState === 'open';
      trigger.setAttribute('aria-expanded', String(open));
      if (open) field.dataset.open = '';
      else delete field.dataset.open;
    };
    pop.addEventListener('toggle', onToggle);

    const stop = () => {
      stopAnchor();
      ctrl.destroy();
      pop.removeEventListener('toggle', onToggle);
    };
    bound.set(field, stop);
    cleanups.push(() => {
      stop();
      bound.delete(field);
    });
  });

  root.querySelectorAll('.j-color-picker:not([data-j-managed])').forEach((el) => {
    const cp = /** @type {HTMLElement} */ (el);
    if (cp.closest('.j-color-picker__popover') || bound.has(cp)) return;
    const ctrl = createColorPicker(cp);
    const stop = () => ctrl.destroy();
    bound.set(cp, stop);
    cleanups.push(() => {
      stop();
      bound.delete(cp);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
