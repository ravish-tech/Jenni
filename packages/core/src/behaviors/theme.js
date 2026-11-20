// Theme token resolution & live color conversion for charts, code editors, and terminals.
// Converts live CSS variables (`oklch(...)`, `light-dark(...)`, `color-mix(...)`, `rgb(...)`)
// into `#rrggbb` / `rgba(r, g, b, a)` strings with a pure-math OKLCH -> sRGB fallback for SSR.

/**
 * @typedef {{
 *   series: [string, string, string, string, string, string, string, string],
 *   grid: string,
 *   axis: string,
 *   crosshair: string,
 *   tooltipBg: string,
 *   tooltipBorder: string,
 * }} ChartPalette
 *
 * @typedef {{
 *   isDark: boolean,
 *   bg: string,
 *   fg: string,
 *   gutterBg: string,
 *   gutterFg: string,
 *   lineActive: string,
 *   selection: string,
 *   cursor: string,
 *   keyword: string,
 *   string: string,
 *   number: string,
 *   function: string,
 *   type: string,
 *   variable: string,
 *   property: string,
 *   operator: string,
 *   punctuation: string,
 *   comment: string,
 *   constant: string,
 *   tag: string,
 *   attr: string,
 *   regexp: string,
 *   added: string,
 *   deleted: string,
 * }} SyntaxTheme
 *
 * @typedef {{
 *   background: string,
 *   foreground: string,
 *   cursor: string,
 *   cursorAccent: string,
 *   selectionBackground: string,
 *   black: string,
 *   red: string,
 *   green: string,
 *   yellow: string,
 *   blue: string,
 *   magenta: string,
 *   cyan: string,
 *   white: string,
 *   brightBlack: string,
 *   brightRed: string,
 *   brightGreen: string,
 *   brightYellow: string,
 *   brightBlue: string,
 *   brightMagenta: string,
 *   brightCyan: string,
 *   brightWhite: string,
 * }} TerminalTheme
 *
 * @typedef {'compact' | 'default' | 'comfortable'} ThemeDensity
 *
 * @typedef {{
 *   isDark: boolean,
 *   density: ThemeDensity,
 *   bg: string,
 *   fg: string,
 *   fgMuted: string,
 *   fgSubtle: string,
 *   surface1: string,
 *   surface2: string,
 *   surface3: string,
 *   border: string,
 *   borderStrong: string,
 *   accent: string,
 *   accentHover: string,
 *   accentSoft: string,
 *   danger: string,
 *   success: string,
 *   warning: string,
 *   info: string,
 *   charts: ChartPalette,
 *   syntax: SyntaxTheme,
 *   terminal: TerminalTheme,
 * }} ThemeTokens
 *
 * @typedef {{
 *   root?: HTMLElement,
 *   immediate?: boolean,
 * }} OnThemeChangeOptions
 */

/** @type {Record<string, string>} */
const FALLBACK_VARS = {
  '--j-hue': '262',
  '--j-hue-neutral': '262',
  '--j-chroma-neutral': '0.005',
  '--j-bg': 'light-dark(oklch(99% 0.002 var(--j-hue-neutral)), oklch(14.8% 0.005 var(--j-hue-neutral)))',
  '--j-surface-1': 'light-dark(oklch(100% 0 0), oklch(18.2% var(--j-chroma-neutral) var(--j-hue-neutral)))',
  '--j-surface-2': 'light-dark(oklch(97.2% var(--j-chroma-neutral) var(--j-hue-neutral)), oklch(21.5% var(--j-chroma-neutral) var(--j-hue-neutral)))',
  '--j-surface-3': 'light-dark(oklch(94.6% var(--j-chroma-neutral) var(--j-hue-neutral)), oklch(25.2% var(--j-chroma-neutral) var(--j-hue-neutral)))',
  '--j-fg': 'light-dark(oklch(19% 0.008 var(--j-hue-neutral)), oklch(95.5% 0.003 var(--j-hue-neutral)))',
  '--j-fg-muted': 'light-dark(oklch(46% 0.01 var(--j-hue-neutral)), oklch(72% 0.008 var(--j-hue-neutral)))',
  '--j-fg-subtle': 'light-dark(oklch(61% 0.008 var(--j-hue-neutral)), oklch(55% 0.008 var(--j-hue-neutral)))',
  '--j-border': 'light-dark(oklch(90.5% 0.005 var(--j-hue-neutral)), oklch(27.5% 0.007 var(--j-hue-neutral)))',
  '--j-border-strong': 'light-dark(oklch(82.5% 0.007 var(--j-hue-neutral)), oklch(35.5% 0.009 var(--j-hue-neutral)))',
  '--j-accent': 'light-dark(oklch(49% 0.155 var(--j-hue)), oklch(68% 0.135 var(--j-hue)))',
  '--j-accent-hover': 'light-dark(oklch(44.5% 0.155 var(--j-hue)), oklch(72.5% 0.13 var(--j-hue)))',
  '--j-accent-soft': 'light-dark(oklch(95.8% 0.022 var(--j-hue)), oklch(25.5% 0.045 var(--j-hue)))',
  '--j-danger': 'light-dark(oklch(53% 0.175 25), oklch(65% 0.155 25))',
  '--j-success': 'light-dark(oklch(53% 0.13 155), oklch(68% 0.125 155))',
  '--j-warning': 'light-dark(oklch(72% 0.135 75), oklch(77% 0.13 75))',
  '--j-info': 'light-dark(oklch(53% 0.125 240), oklch(68% 0.11 240))',
  '--j-chart-1': 'var(--j-accent)',
  '--j-chart-2': 'light-dark(oklch(54% 0.125 192), oklch(71% 0.12 192))',
  '--j-chart-3': 'light-dark(oklch(53% 0.15 295), oklch(71% 0.135 295))',
  '--j-chart-4': 'light-dark(oklch(66% 0.14 72), oklch(77% 0.135 72))',
  '--j-chart-5': 'light-dark(oklch(54% 0.135 152), oklch(70% 0.13 152))',
  '--j-chart-6': 'light-dark(oklch(55% 0.165 12), oklch(69% 0.15 12))',
  '--j-chart-7': 'light-dark(oklch(54% 0.135 235), oklch(70% 0.12 235))',
  '--j-chart-8': 'light-dark(oklch(59% 0.155 42), oklch(73% 0.145 42))',
  '--j-chart-grid': 'light-dark(oklch(92.5% 0.004 var(--j-hue-neutral)), oklch(24.5% 0.006 var(--j-hue-neutral)))',
  '--j-chart-axis': 'light-dark(oklch(76% 0.007 var(--j-hue-neutral)), oklch(38% 0.008 var(--j-hue-neutral)))',
  '--j-chart-crosshair': 'light-dark(oklch(55% 0.01 var(--j-hue-neutral) / 0.45), oklch(70% 0.008 var(--j-hue-neutral) / 0.45))',
  '--j-chart-tooltip-bg': 'light-dark(oklch(100% 0 0 / 0.96), oklch(20.5% var(--j-chroma-neutral) var(--j-hue-neutral) / 0.96))',
  '--j-chart-tooltip-border': 'var(--j-border)',
  '--j-code-bg': 'light-dark(oklch(97.8% 0.004 var(--j-hue-neutral)), oklch(16.2% 0.005 var(--j-hue-neutral)))',
  '--j-code-fg': 'light-dark(oklch(22% 0.009 var(--j-hue-neutral)), oklch(92% 0.005 var(--j-hue-neutral)))',
  '--j-code-gutter-bg': 'light-dark(oklch(96.4% 0.005 var(--j-hue-neutral)), oklch(15.2% 0.005 var(--j-hue-neutral)))',
  '--j-code-gutter-fg': 'light-dark(oklch(62% 0.008 var(--j-hue-neutral)), oklch(48% 0.008 var(--j-hue-neutral)))',
  '--j-code-line-active': 'light-dark(oklch(94.2% 0.008 var(--j-hue-neutral) / 0.65), oklch(23% 0.008 var(--j-hue-neutral) / 0.65))',
  '--j-code-selection': 'light-dark(oklch(88% 0.045 var(--j-hue) / 0.55), oklch(34% 0.065 var(--j-hue) / 0.55))',
  '--j-code-cursor': 'var(--j-accent)',
  '--j-syntax-keyword': 'light-dark(oklch(48% 0.165 295), oklch(74% 0.135 295))',
  '--j-syntax-string': 'light-dark(oklch(46% 0.125 155), oklch(74% 0.12 155))',
  '--j-syntax-number': 'light-dark(oklch(52% 0.145 50), oklch(76% 0.13 55))',
  '--j-syntax-function': 'light-dark(oklch(47% 0.145 250), oklch(75% 0.12 245))',
  '--j-syntax-type': 'light-dark(oklch(48% 0.12 195), oklch(75% 0.11 195))',
  '--j-syntax-variable': 'light-dark(oklch(26% 0.012 var(--j-hue-neutral)), oklch(90% 0.008 var(--j-hue-neutral)))',
  '--j-syntax-property': 'light-dark(oklch(45% 0.12 230), oklch(77% 0.1 225))',
  '--j-syntax-operator': 'light-dark(oklch(44% 0.09 210), oklch(73% 0.085 210))',
  '--j-syntax-punctuation': 'light-dark(oklch(48% 0.01 var(--j-hue-neutral)), oklch(68% 0.008 var(--j-hue-neutral)))',
  '--j-syntax-comment': 'light-dark(oklch(58% 0.008 var(--j-hue-neutral)), oklch(54% 0.008 var(--j-hue-neutral)))',
  '--j-syntax-constant': 'light-dark(oklch(49% 0.15 32), oklch(75% 0.135 38))',
  '--j-syntax-tag': 'light-dark(oklch(49% 0.155 18), oklch(72% 0.14 20))',
  '--j-syntax-attr': 'light-dark(oklch(50% 0.13 75), oklch(78% 0.115 78))',
  '--j-syntax-regexp': 'light-dark(oklch(48% 0.135 175), oklch(74% 0.12 175))',
  '--j-syntax-added': 'light-dark(oklch(47% 0.13 155), oklch(72% 0.125 155))',
  '--j-syntax-deleted': 'light-dark(oklch(50% 0.165 25), oklch(68% 0.15 25))',
  '--j-term-bg': 'light-dark(oklch(98.2% 0.003 var(--j-hue-neutral)), oklch(14.2% 0.005 var(--j-hue-neutral)))',
  '--j-term-fg': 'light-dark(oklch(21% 0.008 var(--j-hue-neutral)), oklch(92.5% 0.004 var(--j-hue-neutral)))',
  '--j-term-cursor': 'var(--j-accent)',
  '--j-term-cursor-accent': 'light-dark(oklch(99% 0.002 var(--j-hue-neutral)), oklch(14.2% 0.005 var(--j-hue-neutral)))',
  '--j-term-selection': 'light-dark(oklch(86% 0.045 var(--j-hue) / 0.45), oklch(36% 0.065 var(--j-hue) / 0.48))',
  '--j-ansi-black': 'light-dark(oklch(22% 0.008 var(--j-hue-neutral)), oklch(23% 0.007 var(--j-hue-neutral)))',
  '--j-ansi-red': 'light-dark(oklch(51% 0.17 25), oklch(66% 0.155 25))',
  '--j-ansi-green': 'light-dark(oklch(50% 0.13 152), oklch(69% 0.125 152))',
  '--j-ansi-yellow': 'light-dark(oklch(62% 0.135 78), oklch(77% 0.13 80))',
  '--j-ansi-blue': 'light-dark(oklch(50% 0.145 252), oklch(68% 0.13 252))',
  '--j-ansi-magenta': 'light-dark(oklch(51% 0.155 308), oklch(70% 0.14 308))',
  '--j-ansi-cyan': 'light-dark(oklch(51% 0.115 196), oklch(71% 0.11 196))',
  '--j-ansi-white': 'light-dark(oklch(86% 0.005 var(--j-hue-neutral)), oklch(87% 0.005 var(--j-hue-neutral)))',
  '--j-ansi-bright-black': 'light-dark(oklch(50% 0.009 var(--j-hue-neutral)), oklch(52% 0.009 var(--j-hue-neutral)))',
  '--j-ansi-bright-red': 'light-dark(oklch(57% 0.175 25), oklch(73% 0.15 25))',
  '--j-ansi-bright-green': 'light-dark(oklch(56% 0.135 152), oklch(76% 0.125 152))',
  '--j-ansi-bright-yellow': 'light-dark(oklch(68% 0.14 80), oklch(83% 0.125 82))',
  '--j-ansi-bright-blue': 'light-dark(oklch(56% 0.145 252), oklch(75% 0.125 252))',
  '--j-ansi-bright-magenta': 'light-dark(oklch(57% 0.155 308), oklch(77% 0.135 308))',
  '--j-ansi-bright-cyan': 'light-dark(oklch(57% 0.12 196), oklch(78% 0.105 196))',
  '--j-ansi-bright-white': 'light-dark(oklch(96% 0.003 var(--j-hue-neutral)), oklch(96.5% 0.003 var(--j-hue-neutral)))',
};

/** @type {CanvasRenderingContext2D | null} */
let cachedCtx = null;
/** @type {HTMLSpanElement | null} */
let cachedHeadProbe = null;

/**
 * @param {HTMLElement} [root]
 * @returns {HTMLElement | null}
 */
function getRootEl(root) {
  if (root) return root;
  if (typeof document !== 'undefined') return document.documentElement;
  return null;
}

/**
 * Determine whether `root` resolves in dark mode.
 * @param {HTMLElement | null} el
 * @returns {boolean}
 */
function detectDark(el) {
  if (el) {
    const themed = el.closest?.('[data-theme]') || (el.hasAttribute?.('data-theme') ? el : null);
    const attr = themed?.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'light') return false;
    if (typeof getComputedStyle === 'function') {
      const cs = getComputedStyle(el).colorScheme?.trim();
      if (cs === 'dark') return true;
      if (cs === 'light') return false;
    }
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/**
 * Determine active density token on `root`.
 * @param {HTMLElement | null} el
 * @returns {ThemeDensity}
 */
function detectDensity(el) {
  if (el) {
    const host = el.closest?.('[data-density]') || (el.hasAttribute?.('data-density') ? el : null);
    const attr = host?.getAttribute('data-density');
    if (attr === 'compact' || attr === 'default' || attr === 'comfortable') return attr;
    if (typeof getComputedStyle === 'function') {
      const raw = parseFloat(getComputedStyle(el).getPropertyValue('--j-density'));
      if (Number.isFinite(raw)) {
        if (raw <= 0.75) return 'compact';
        if (raw >= 1.1) return 'comfortable';
      }
    }
  }
  return 'default';
}

/**
 * @param {number} n
 * @returns {string}
 */
function hexByte(n) {
  return Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0');
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} [a]
 * @returns {string}
 */
function formatRgbaOrHex(r, g, b, a = 1) {
  const ri = Math.min(255, Math.max(0, Math.round(r)));
  const gi = Math.min(255, Math.max(0, Math.round(g)));
  const bi = Math.min(255, Math.max(0, Math.round(b)));
  const alpha = Math.min(1, Math.max(0, a));
  if (alpha >= 0.999) {
    return `#${hexByte(ri)}${hexByte(gi)}${hexByte(bi)}`;
  }
  const cleanA = Math.round(alpha * 1000) / 1000;
  return `rgba(${ri}, ${gi}, ${bi}, ${cleanA})`;
}

/**
 * @param {string} raw
 * @returns {number}
 */
function parseAlpha(raw) {
  const s = raw.trim();
  if (!s || s === 'none') return 1;
  if (s.endsWith('%')) return parseFloat(s) / 100;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 1;
}

/**
 * @param {string} raw
 * @returns {number}
 */
function parseAngleDeg(raw) {
  const s = raw.trim().toLowerCase();
  if (!s || s === 'none') return 0;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  if (s.endsWith('rad')) return (n * 180) / Math.PI;
  if (s.endsWith('turn')) return n * 360;
  if (s.endsWith('grad')) return n * 0.9;
  return n;
}

/**
 * Pure-math OKLCH -> sRGB conversion.
 * @param {number} L 0..1
 * @param {number} C >= 0
 * @param {number} H degrees
 * @param {number} alpha 0..1
 * @returns {string}
 */
function oklchToCss(L, C, H, alpha) {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  /** @param {number} c */
  const gamma = (c) => {
    const v = Math.min(1, Math.max(0, c));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  };

  return formatRgbaOrHex(gamma(rLin) * 255, gamma(gLin) * 255, gamma(bLin) * 255, alpha);
}

/**
 * Parse `#hex`, `rgb(...)`, `rgba(...)`, `oklch(...)`, or `color(srgb ...)` directly.
 * Returns `null` if unknown syntax (delegated to 2d canvas fallback).
 * @param {string} str
 * @returns {string | null}
 */
function parseDirectColor(str) {
  const s = str.trim();
  if (!s) return null;
  if (s === 'transparent') return 'rgba(0, 0, 0, 0)';

  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
      return formatRgbaOrHex(r, g, b, a);
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return formatRgbaOrHex(r, g, b, a);
    }
  }

  const rgbMatch = s.match(/^rgba?\((.+)\)$/i);
  if (rgbMatch) {
    const inner = rgbMatch[1].trim();
    const slashParts = inner.split('/');
    const coords = slashParts[0]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (coords.length >= 3) {
      /** @param {string} c */
      const chan = (c) => (c.endsWith('%') ? (parseFloat(c) / 100) * 255 : parseFloat(c));
      const r = chan(coords[0]);
      const g = chan(coords[1]);
      const b = chan(coords[2]);
      const a =
        slashParts.length > 1
          ? parseAlpha(slashParts[1])
          : coords[3] !== undefined
            ? parseAlpha(coords[3])
            : 1;
      if ([r, g, b, a].every(Number.isFinite)) {
        return formatRgbaOrHex(r, g, b, a);
      }
    }
  }

  const oklchMatch = s.match(/^oklch\((.+)\)$/i);
  if (oklchMatch) {
    const inner = oklchMatch[1].trim();
    const slashParts = inner.split('/');
    const coords = slashParts[0].trim().split(/\s+/).filter(Boolean);
    if (coords.length >= 3) {
      const rawL = coords[0];
      const L = rawL === 'none' ? 0 : rawL.endsWith('%') ? parseFloat(rawL) / 100 : parseFloat(rawL);
      const C = coords[1] === 'none' ? 0 : parseFloat(coords[1]);
      const H = parseAngleDeg(coords[2]);
      const a = slashParts.length > 1 ? parseAlpha(slashParts[1]) : 1;
      if ([L, C, H, a].every(Number.isFinite)) {
        return oklchToCss(Math.min(1, Math.max(0, L)), Math.max(0, C), H, a);
      }
    }
  }

  const srgbFnMatch = s.match(/^color\(\s*srgb\s+([^)]+)\)$/i);
  if (srgbFnMatch) {
    const slashParts = srgbFnMatch[1].trim().split('/');
    const coords = slashParts[0].trim().split(/\s+/).filter(Boolean);
    if (coords.length >= 3) {
      /** @param {string} c */
      const chan = (c) =>
        c === 'none' ? 0 : (c.endsWith('%') ? parseFloat(c) / 100 : parseFloat(c)) * 255;
      const r = chan(coords[0]);
      const g = chan(coords[1]);
      const b = chan(coords[2]);
      const a = slashParts.length > 1 ? parseAlpha(slashParts[1]) : 1;
      if ([r, g, b, a].every(Number.isFinite)) {
        return formatRgbaOrHex(r, g, b, a);
      }
    }
  }

  return null;
}

/**
 * Split a top-level comma in `light-dark(a, b)` respecting nested parentheses.
 * @param {string} inner
 * @returns {[string, string] | null}
 */
function splitTopLevelComma(inner) {
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) {
      return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
    }
  }
  return null;
}

/**
 * Expand `var(--name, fallback)` and `light-dark(l, d)` for SSR / non-layout environments.
 * @param {string} expr
 * @param {HTMLElement | null} el
 * @param {boolean} isDark
 * @param {number} [depth]
 * @returns {string}
 */
function expandCssExpression(expr, el, isDark, depth = 0) {
  if (depth > 10 || !expr) return expr;
  let out = expr.trim();

  // Replace var(--foo) or var(--foo, fallback)
  out = out.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_, name, fb) => {
    const live =
      el && typeof getComputedStyle === 'function'
        ? getComputedStyle(el).getPropertyValue(name).trim()
        : '';
    const raw = live || FALLBACK_VARS[name] || (fb ? fb.trim() : '');
    return expandCssExpression(raw, el, isDark, depth + 1);
  });

  // Resolve light-dark(lightExpr, darkExpr)
  while (/light-dark\(/i.test(out)) {
    const idx = out.toLowerCase().indexOf('light-dark(');
    if (idx < 0) break;
    let d = 0;
    let end = -1;
    for (let i = idx + 10; i < out.length; i++) {
      if (out[i] === '(') d++;
      else if (out[i] === ')') {
        d--;
        if (d === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) break;
    const body = out.slice(idx + 11, end);
    const pair = splitTopLevelComma(body);
    if (!pair) break;
    const chosen = isDark ? pair[1] : pair[0];
    out = out.slice(0, idx) + chosen + out.slice(end + 1);
  }

  return out.trim();
}

/**
 * Use a hidden probe element + `getComputedStyle` + cached 1x1 2D `<canvas>` in browsers.
 * @param {string} cssExpr
 * @param {HTMLElement | null} el
 * @returns {string | null}
 */
function resolveViaBrowser(cssExpr, el) {
  if (!el || typeof document === 'undefined' || typeof getComputedStyle !== 'function') {
    return null;
  }

  let computed = '';
  const isDocRoot = el === document.documentElement;
  if (isDocRoot && document.head) {
    if (!cachedHeadProbe || !cachedHeadProbe.isConnected) {
      cachedHeadProbe = document.createElement('span');
      cachedHeadProbe.setAttribute('data-j-theme-probe', '');
      cachedHeadProbe.setAttribute('aria-hidden', 'true');
      cachedHeadProbe.style.cssText =
        'position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;visibility:hidden;';
      document.head.appendChild(cachedHeadProbe);
    }
    cachedHeadProbe.style.color = '';
    cachedHeadProbe.style.color = cssExpr;
    if (cachedHeadProbe.style.color) {
      computed = getComputedStyle(cachedHeadProbe).color;
    }
  } else {
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;visibility:hidden;';
    probe.style.color = cssExpr;
    if (probe.style.color) {
      el.appendChild(probe);
      computed = getComputedStyle(probe).color;
      probe.remove();
    }
  }

  if (!computed) return null;

  const direct = parseDirectColor(computed);
  if (direct) return direct;

  // Fallback to cached 1x1 2D canvas rasterization for any exotic CSS color space
  try {
    if (!cachedCtx) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      cachedCtx = canvas.getContext('2d', { willReadFrequently: true });
    }
    if (cachedCtx) {
      cachedCtx.clearRect(0, 0, 1, 1);
      cachedCtx.fillStyle = '#000000';
      cachedCtx.fillStyle = computed;
      const serialized = cachedCtx.fillStyle;
      if (typeof serialized === 'string') {
        const fromSerialized = parseDirectColor(serialized);
        if (fromSerialized) return fromSerialized;
      }
      cachedCtx.fillRect(0, 0, 1, 1);
      const data = cachedCtx.getImageData(0, 0, 1, 1).data;
      return formatRgbaOrHex(data[0], data[1], data[2], data[3] / 255);
    }
  } catch {
    /* ignore canvas errors in restricted / headless environments */
  }

  return null;
}

/**
 * Resolve any CSS variable name (`'--j-accent'`), `var(...)`, or CSS color (`oklch(...)`,
 * `light-dark(...)`, `rgb(...)`) into `#rrggbb` (or `rgba(r, g, b, a)` when `alpha < 1`).
 * @param {string} cssValueOrVarName
 * @param {HTMLElement} [root]
 * @returns {string}
 */
export function resolveCssColor(cssValueOrVarName, root) {
  const el = getRootEl(root);
  const trimmed = (cssValueOrVarName || '').trim();
  if (!trimmed) return '#000000';

  const isVarName = trimmed.startsWith('--');
  const cssExpr = isVarName ? `var(${trimmed})` : trimmed;

  // Check if variable exists in live stylesheet when passed a --j-* var name
  const hasLiveVar =
    !isVarName ||
    Boolean(
      el &&
        typeof getComputedStyle === 'function' &&
        getComputedStyle(el).getPropertyValue(trimmed).trim(),
    );

  if (hasLiveVar) {
    const viaDom = resolveViaBrowser(cssExpr, el);
    if (viaDom) return viaDom;
  }

  // Pure-math fallback (SSR, Node, jsdom, or unloaded stylesheet)
  const isDark = detectDark(el);
  const expanded = expandCssExpression(cssExpr, el, isDark);
  const parsed = parseDirectColor(expanded);
  if (parsed) return parsed;

  const viaDomExpanded = resolveViaBrowser(expanded, el);
  if (viaDomExpanded) return viaDomExpanded;

  return '#000000';
}

/**
 * Read the 8-series categorical chart palette + grid/axis/tooltip chrome colors.
 * @param {HTMLElement} [root]
 * @returns {ChartPalette}
 */
export function getChartPalette(root) {
  return {
    series: [
      resolveCssColor('--j-chart-1', root),
      resolveCssColor('--j-chart-2', root),
      resolveCssColor('--j-chart-3', root),
      resolveCssColor('--j-chart-4', root),
      resolveCssColor('--j-chart-5', root),
      resolveCssColor('--j-chart-6', root),
      resolveCssColor('--j-chart-7', root),
      resolveCssColor('--j-chart-8', root),
    ],
    grid: resolveCssColor('--j-chart-grid', root),
    axis: resolveCssColor('--j-chart-axis', root),
    crosshair: resolveCssColor('--j-chart-crosshair', root),
    tooltipBg: resolveCssColor('--j-chart-tooltip-bg', root),
    tooltipBorder: resolveCssColor('--j-chart-tooltip-border', root),
  };
}

/**
 * Read code editor & syntax highlighting tokens (ready for CodeMirror, Shiki, or Monaco).
 * @param {HTMLElement} [root]
 * @returns {SyntaxTheme}
 */
export function getSyntaxTheme(root) {
  const el = getRootEl(root);
  return {
    isDark: detectDark(el),
    bg: resolveCssColor('--j-code-bg', root),
    fg: resolveCssColor('--j-code-fg', root),
    gutterBg: resolveCssColor('--j-code-gutter-bg', root),
    gutterFg: resolveCssColor('--j-code-gutter-fg', root),
    lineActive: resolveCssColor('--j-code-line-active', root),
    selection: resolveCssColor('--j-code-selection', root),
    cursor: resolveCssColor('--j-code-cursor', root),
    keyword: resolveCssColor('--j-syntax-keyword', root),
    string: resolveCssColor('--j-syntax-string', root),
    number: resolveCssColor('--j-syntax-number', root),
    function: resolveCssColor('--j-syntax-function', root),
    type: resolveCssColor('--j-syntax-type', root),
    variable: resolveCssColor('--j-syntax-variable', root),
    property: resolveCssColor('--j-syntax-property', root),
    operator: resolveCssColor('--j-syntax-operator', root),
    punctuation: resolveCssColor('--j-syntax-punctuation', root),
    comment: resolveCssColor('--j-syntax-comment', root),
    constant: resolveCssColor('--j-syntax-constant', root),
    tag: resolveCssColor('--j-syntax-tag', root),
    attr: resolveCssColor('--j-syntax-attr', root),
    regexp: resolveCssColor('--j-syntax-regexp', root),
    added: resolveCssColor('--j-syntax-added', root),
    deleted: resolveCssColor('--j-syntax-deleted', root),
  };
}

/**
 * Read an `xterm.js`-compatible `ITheme` ANSI 16 color object.
 * @param {HTMLElement} [root]
 * @returns {TerminalTheme}
 */
export function getTerminalTheme(root) {
  return {
    background: resolveCssColor('--j-term-bg', root),
    foreground: resolveCssColor('--j-term-fg', root),
    cursor: resolveCssColor('--j-term-cursor', root),
    cursorAccent: resolveCssColor('--j-term-cursor-accent', root),
    selectionBackground: resolveCssColor('--j-term-selection', root),
    black: resolveCssColor('--j-ansi-black', root),
    red: resolveCssColor('--j-ansi-red', root),
    green: resolveCssColor('--j-ansi-green', root),
    yellow: resolveCssColor('--j-ansi-yellow', root),
    blue: resolveCssColor('--j-ansi-blue', root),
    magenta: resolveCssColor('--j-ansi-magenta', root),
    cyan: resolveCssColor('--j-ansi-cyan', root),
    white: resolveCssColor('--j-ansi-white', root),
    brightBlack: resolveCssColor('--j-ansi-bright-black', root),
    brightRed: resolveCssColor('--j-ansi-bright-red', root),
    brightGreen: resolveCssColor('--j-ansi-bright-green', root),
    brightYellow: resolveCssColor('--j-ansi-bright-yellow', root),
    brightBlue: resolveCssColor('--j-ansi-bright-blue', root),
    brightMagenta: resolveCssColor('--j-ansi-bright-magenta', root),
    brightCyan: resolveCssColor('--j-ansi-bright-cyan', root),
    brightWhite: resolveCssColor('--j-ansi-bright-white', root),
  };
}

export const getXtermTheme = getTerminalTheme;

/**
 * Read the complete resolved theme snapshot (`#rrggbb` / `rgba(...)`) for JS consumers.
 * @param {HTMLElement} [root]
 * @returns {ThemeTokens}
 */
export function getThemeTokens(root) {
  const el = getRootEl(root);
  return {
    isDark: detectDark(el),
    density: detectDensity(el),
    bg: resolveCssColor('--j-bg', root),
    fg: resolveCssColor('--j-fg', root),
    fgMuted: resolveCssColor('--j-fg-muted', root),
    fgSubtle: resolveCssColor('--j-fg-subtle', root),
    surface1: resolveCssColor('--j-surface-1', root),
    surface2: resolveCssColor('--j-surface-2', root),
    surface3: resolveCssColor('--j-surface-3', root),
    border: resolveCssColor('--j-border', root),
    borderStrong: resolveCssColor('--j-border-strong', root),
    accent: resolveCssColor('--j-accent', root),
    accentHover: resolveCssColor('--j-accent-hover', root),
    accentSoft: resolveCssColor('--j-accent-soft', root),
    danger: resolveCssColor('--j-danger', root),
    success: resolveCssColor('--j-success', root),
    warning: resolveCssColor('--j-warning', root),
    info: resolveCssColor('--j-info', root),
    charts: getChartPalette(root),
    syntax: getSyntaxTheme(root),
    terminal: getTerminalTheme(root),
  };
}

/**
 * Subscribe to theme, tone, density, inline knob, and OS color-scheme changes.
 * Debounced to 1 animation frame so batch updates fire once with fresh `getThemeTokens(root)`.
 * @param {(tokens: ThemeTokens) => void} callback
 * @param {OnThemeChangeOptions} [options]
 * @returns {() => void} unsubscribe
 */
export function onThemeChange(callback, options = {}) {
  const el = getRootEl(options.root);
  if (options.immediate) {
    callback(getThemeTokens(options.root));
  }
  if (!el || typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }

  let frame = 0;
  const schedule = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      callback(getThemeTokens(options.root));
    });
  };

  const attrFilter = ['data-theme', 'data-tone', 'data-density', 'style', 'class'];
  const observer = new MutationObserver(schedule);
  observer.observe(el, { attributes: true, attributeFilter: attrFilter });

  /** @type {MutationObserver | null} */
  let docObserver = null;
  if (typeof document !== 'undefined' && el !== document.documentElement) {
    docObserver = new MutationObserver(schedule);
    docObserver.observe(document.documentElement, { attributes: true, attributeFilter: attrFilter });
  }

  const mql =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
  mql?.addEventListener?.('change', schedule);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    observer.disconnect();
    docObserver?.disconnect();
    mql?.removeEventListener?.('change', schedule);
  };
}
