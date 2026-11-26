import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Minimal DOM hierarchy shims for headless Node.js execution
if (typeof globalThis.Node === 'undefined') {
  globalThis.Node = class Node extends EventTarget {
    parentNode = null;
    isConnected = true;
    contains(other) {
      let cur = other;
      while (cur) {
        if (cur === this) return true;
        cur = cur.parentNode ?? null;
      }
      return false;
    }
  };
}
if (typeof globalThis.Element === 'undefined') {
  globalThis.Element = class Element extends globalThis.Node {
    tagName = 'DIV';
    attributes = new Map();
    setAttribute(k, v) {
      this.attributes.set(k, String(v));
    }
    getAttribute(k) {
      return this.attributes.has(k) ? this.attributes.get(k) : null;
    }
    hasAttribute(k) {
      return this.attributes.has(k);
    }
    closest() {
      return null;
    }
    matches() {
      return false;
    }
    getClientRects() {
      return [{ width: 100, height: 32 }];
    }
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 100, height: 32 };
    }
  };
}
if (typeof globalThis.HTMLElement === 'undefined') {
  globalThis.HTMLElement = class HTMLElement extends globalThis.Element {
    isContentEditable = false;
    dataset = {};
    style = {};
    offsetHeight = 32;
    clientHeight = 200;
    scrollTop = 0;
  };
}
if (typeof globalThis.HTMLButtonElement === 'undefined') {
  globalThis.HTMLButtonElement = class HTMLButtonElement extends globalThis.HTMLElement {
    tagName = 'BUTTON';
  };
}
if (typeof globalThis.HTMLAnchorElement === 'undefined') {
  globalThis.HTMLAnchorElement = class HTMLAnchorElement extends globalThis.HTMLElement {
    tagName = 'A';
  };
}
if (typeof globalThis.HTMLInputElement === 'undefined') {
  globalThis.HTMLInputElement = class HTMLInputElement extends globalThis.HTMLElement {
    tagName = 'INPUT';
    type = 'text';
  };
}
if (typeof globalThis.Document === 'undefined') {
  globalThis.Document = class Document extends globalThis.Node {
    hidden = false;
    activeElement = null;
    querySelectorAll() {
      return [];
    }
  };
}

import {
  resolveCssColor,
  getThemeTokens,
  getChartPalette,
  getSyntaxTheme,
  getTerminalTheme,
  getXtermTheme,
} from '../packages/core/src/behaviors/theme.js';
import {
  ENTITY_HUE_RING,
  hashEntitySeed,
  getEntityHue,
  getEntityColorVars,
} from '../packages/core/src/behaviors/entity-color.js';
import {
  BUILTIN_ICONS,
  listBuiltinIcons,
  registerIcons,
  clearRegisteredIcons,
  resolveIcon,
  parseSvgIcon,
} from '../packages/core/src/behaviors/icon.js';
import { normalizeDayMarkers } from '../packages/core/src/behaviors/date-picker.js';
import {
  toast,
  dismissToast,
  getToasts,
} from '../packages/core/src/behaviors/toast.js';
import {
  createShortcutRegistry,
  formatShortcut,
} from '../packages/core/src/behaviors/shortcuts.js';
import { createVirtualizer } from '../packages/core/src/behaviors/virtual-list.js';
import {
  filterGridRows,
  nextGridSorts,
  sortGridRows,
  handleGridKeydown,
} from '../packages/core/src/behaviors/data-grid.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEX_RE = /^#[0-9a-f]{6}$/;
const RGBA_OR_HEX_RE = /^(#[0-9a-f]{6}|rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\))$/;

function makeThemeRoot(theme, density = 'default') {
  const el = new globalThis.HTMLElement();
  el.setAttribute('data-theme', theme);
  el.setAttribute('data-density', density);
  return el;
}

function makeKeyEvent(init = {}) {
  const evt = new Event('keydown', { bubbles: true, cancelable: true });
  Object.assign(evt, {
    key: init.key ?? '',
    code: init.code ?? '',
    ctrlKey: Boolean(init.ctrlKey),
    metaKey: Boolean(init.metaKey),
    altKey: Boolean(init.altKey),
    shiftKey: Boolean(init.shiftKey),
    repeat: Boolean(init.repeat),
    isComposing: Boolean(init.isComposing),
  });
  if (init.target !== undefined) {
    Object.defineProperty(evt, 'target', { value: init.target, configurable: true });
  }
  return evt;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// 1. theme.js
// ---------------------------------------------------------------------------
describe('theme.js — color resolution & token snapshots', () => {
  const lightRoot = makeThemeRoot('light');
  const darkRoot = makeThemeRoot('dark', 'compact');

  it('resolves #hex, rgb/rgba, oklch, and light-dark(...) expressions', () => {
    assert.equal(resolveCssColor('#3b82f6'), '#3b82f6');
    assert.equal(resolveCssColor('#abc'), '#aabbcc');
    assert.equal(resolveCssColor('rgb(30, 64, 175)'), '#1e40af');
    assert.equal(resolveCssColor('rgb(255 0 128 / 0.5)'), 'rgba(255, 0, 128, 0.5)');

    const oklchHex = resolveCssColor('oklch(53% 0.175 25)');
    assert.match(oklchHex, HEX_RE);

    const oklchAlpha = resolveCssColor('oklch(55% 0.12 240 / 0.4)');
    assert.match(oklchAlpha, /^rgba\(/);

    const ldExpr = 'light-dark(oklch(99% 0 0), oklch(15% 0 0))';
    const resolvedLight = resolveCssColor(ldExpr, lightRoot);
    const resolvedDark = resolveCssColor(ldExpr, darkRoot);
    assert.match(resolvedLight, HEX_RE);
    assert.match(resolvedDark, HEX_RE);
    assert.notEqual(resolvedLight, resolvedDark);
  });

  it('returns 8 hex series strings in getChartPalette', () => {
    const palette = getChartPalette(lightRoot);
    assert.equal(palette.series.length, 8);
    for (const color of palette.series) {
      assert.match(color, HEX_RE);
    }
    assert.match(palette.grid, HEX_RE);
    assert.match(palette.axis, HEX_RE);
    assert.match(palette.crosshair, RGBA_OR_HEX_RE);
    assert.match(palette.tooltipBg, RGBA_OR_HEX_RE);
    assert.match(palette.tooltipBorder, HEX_RE);
  });

  it('returns light and dark syntax themes in getSyntaxTheme', () => {
    const lightSyntax = getSyntaxTheme(lightRoot);
    const darkSyntax = getSyntaxTheme(darkRoot);
    assert.equal(lightSyntax.isDark, false);
    assert.equal(darkSyntax.isDark, true);
    assert.notEqual(lightSyntax.bg, darkSyntax.bg);

    for (const key of [
      'bg',
      'fg',
      'gutterBg',
      'gutterFg',
      'cursor',
      'keyword',
      'string',
      'number',
      'function',
      'type',
      'variable',
      'property',
      'operator',
      'punctuation',
      'comment',
      'constant',
      'tag',
      'attr',
      'regexp',
      'added',
      'deleted',
    ]) {
      assert.match(lightSyntax[key], HEX_RE, `light syntax.${key}`);
      assert.match(darkSyntax[key], HEX_RE, `dark syntax.${key}`);
    }
  });

  it('returns all 16 ANSI colors + cursor/bg/fg in getTerminalTheme / getXtermTheme', () => {
    assert.equal(getXtermTheme, getTerminalTheme);
    const term = getTerminalTheme(darkRoot);
    const hexKeys = [
      'background',
      'foreground',
      'cursor',
      'cursorAccent',
      'black',
      'red',
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
      'white',
      'brightBlack',
      'brightRed',
      'brightGreen',
      'brightYellow',
      'brightBlue',
      'brightMagenta',
      'brightCyan',
      'brightWhite',
    ];
    for (const key of hexKeys) {
      assert.match(term[key], HEX_RE, `terminal.${key}`);
    }
    assert.match(term.selectionBackground, RGBA_OR_HEX_RE);
  });

  it('returns complete snapshot in getThemeTokens', () => {
    const light = getThemeTokens(lightRoot);
    const dark = getThemeTokens(darkRoot);
    assert.equal(light.isDark, false);
    assert.equal(light.density, 'default');
    assert.equal(dark.isDark, true);
    assert.equal(dark.density, 'compact');
    assert.notEqual(light.bg, dark.bg);
    assert.equal(light.charts.series.length, 8);
    assert.match(dark.accent, HEX_RE);
    assert.match(dark.danger, HEX_RE);
    assert.match(dark.success, HEX_RE);
    assert.match(dark.warning, HEX_RE);
    assert.match(dark.info, HEX_RE);
  });
});

// ---------------------------------------------------------------------------
// 2. entity-color.js
// ---------------------------------------------------------------------------
describe('entity-color.js — deterministic 12-hue OKLCH hashing', () => {
  it('exposes 12 frozen perceptual hues in ENTITY_HUE_RING', () => {
    assert.equal(ENTITY_HUE_RING.length, 12);
    assert.equal(Object.isFrozen(ENTITY_HUE_RING), true);
    assert.equal(new Set(ENTITY_HUE_RING).size, 12);
    for (const hue of ENTITY_HUE_RING) {
      assert.equal(typeof hue, 'number');
      assert.ok(hue >= 0 && hue < 360);
    }
  });

  it('hashes entity seeds deterministically and trims surrounding whitespace', () => {
    const slotA = hashEntitySeed('Ada Lovelace');
    const slotB = hashEntitySeed('  Ada Lovelace  ');
    assert.equal(slotA, slotB);
    assert.ok(Number.isInteger(slotA) && slotA >= 0 && slotA < 12);

    const hue = getEntityHue('Ada Lovelace');
    assert.equal(hue, ENTITY_HUE_RING[slotA]);
    assert.equal(getEntityHue('Grace Hopper'), ENTITY_HUE_RING[hashEntitySeed('Grace Hopper')]);
  });

  it('produces Light/Dark-compatible CSS variable maps in getEntityColorVars', () => {
    const vars = getEntityColorVars('Margaret Hamilton');
    const expectedHue = String(getEntityHue('Margaret Hamilton'));
    assert.equal(vars['--j-entity-hue'], expectedHue);
    for (const [k, v] of Object.entries(vars)) {
      assert.ok(k.startsWith('--j-'));
      assert.equal(typeof v, 'string');
    }

    // Verify the entity hue resolves cleanly into distinct light and dark surface/foreground colors
    const softExpr = `light-dark(oklch(93.5% 0.032 ${expectedHue}), oklch(25% 0.055 ${expectedHue}))`;
    const lightSoft = resolveCssColor(softExpr, makeThemeRoot('light'));
    const darkSoft = resolveCssColor(softExpr, makeThemeRoot('dark'));
    assert.match(lightSoft, HEX_RE);
    assert.match(darkSoft, HEX_RE);
    assert.notEqual(lightSoft, darkSoft);
  });
});

// ---------------------------------------------------------------------------
// 3. icon.js
// ---------------------------------------------------------------------------
describe('icon.js — built-in dictionary, registry & SVG XSS sanitizer', () => {
  beforeEach(() => {
    clearRegisteredIcons();
  });

  it('ships 130+ built-in 24x24 stroke icon keys', () => {
    const keys = listBuiltinIcons();
    assert.ok(keys.length >= 130, `Expected >= 130 icons, got ${keys.length}`);
    assert.equal(Object.isFrozen(BUILTIN_ICONS), true);
    for (const key of keys) {
      const def = resolveIcon(key);
      assert.ok(def && typeof def === 'object');
      assert.equal(Object.isFrozen(def), true);
      assert.equal(def.viewBox, '0 0 24 24');
      assert.ok(def.body.length > 0);
    }
  });

  it('supports registerIcons, unregister cleanup, and clearRegisteredIcons', () => {
    const unregisterMap = registerIcons({
      'custom-spark': '<svg viewBox="0 0 24 24"><path d="M12 2v20"/></svg>',
    });
    const resolved = resolveIcon('custom-spark');
    assert.equal(resolved.viewBox, '0 0 24 24');
    assert.equal(Object.isFrozen(resolved), true);

    const unregisterFn = registerIcons((name) =>
      name === 'fn-icon' ? 'M1 1L15 15' : undefined,
    );
    const fromFn = resolveIcon('fn-icon');
    assert.equal(fromFn.body, '<path d="M1 1L15 15"/>');
    assert.equal(Object.isFrozen(fromFn), true);

    unregisterMap();
    assert.equal(resolveIcon('custom-spark'), null);

    clearRegisteredIcons();
    assert.equal(resolveIcon('fn-icon'), null);
    unregisterFn();
  });

  it('freezes parsed SVG objects and strips all XSS vectors', () => {
    const safe = parseSvgIcon('<svg viewBox="0 0 16 16"><path d="M2 8h12"/></svg>');
    assert.equal(Object.isFrozen(safe), true);
    assert.equal(
      Object.isFrozen(parseSvgIcon({ viewBox: '0 0 16 16', body: '<circle cx="8" cy="8" r="4"/>' })),
      true,
    );

    const vectors = [
      '<svg><script>alert(1)</script><path d="M0 0"/></svg>',
      '<svg><path d="M0 0"onload="alert(1)"/></svg>',
      '<svg><rect/onload=alert(1) width="8" height="8"/></svg>',
      '<svg><set attributeName="onmouseover" to="alert(1)"/><path d="M1 1"/></svg>',
      '<svg><animate attributeName="href" to="javascript:alert(1)"/><path d="M1 1"/></svg>',
      '<svg><a href=javascript:alert(1)><path d="M1 1"/></a></svg>',
      '<svg><a href="&#x6a;avascript:alert(1)"><path d="M1 1"/></a></svg>',
      '<svg><use href="data:text/html,<script>alert(1)</script>"/><path d="M1 1"/></svg>',
    ];

    for (const payload of vectors) {
      const parsed = parseSvgIcon(payload);
      assert.ok(parsed, `Expected parsed object for payload: ${payload}`);
      assert.equal(Object.isFrozen(parsed), true);
      const lower = parsed.body.toLowerCase();
      assert.ok(!lower.includes('<script'), `Leaked <script in: ${parsed.body}`);
      assert.ok(!lower.includes('onload'), `Leaked onload in: ${parsed.body}`);
      assert.ok(!lower.includes('onmouseover'), `Leaked onmouseover in: ${parsed.body}`);
      assert.ok(!lower.includes('alert('), `Leaked alert( in: ${parsed.body}`);
      assert.ok(!lower.includes('<set'), `Leaked <set in: ${parsed.body}`);
      assert.ok(!lower.includes('<animate'), `Leaked <animate in: ${parsed.body}`);
      assert.ok(!lower.includes('javascript:'), `Leaked javascript: in: ${parsed.body}`);
      assert.ok(!lower.includes('&#x6a'), `Leaked encoded javascript URI in: ${parsed.body}`);
      assert.ok(!lower.includes('data:text/html'), `Leaked data: URI in: ${parsed.body}`);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. date-picker.js
// ---------------------------------------------------------------------------
describe('date-picker.js — normalizeDayMarkers', () => {
  it('normalizes plain Record, function, Set, and Array marker sources', () => {
    const record = {
      '2026-11-20': ['success', { tone: 'warning', label: 'Release' }, '#ff0055', 'danger'],
    };
    const fromRecord = normalizeDayMarkers(record, '2026-11-20');
    assert.equal(fromRecord.length, 3); // capped at 3 dots per day
    assert.deepEqual(fromRecord[0], { tone: 'success' });
    assert.deepEqual(fromRecord[1], { tone: 'warning', label: 'Release' });
    assert.deepEqual(fromRecord[2], { color: '#ff0055' });
    assert.deepEqual(normalizeDayMarkers(record, '2026-11-21'), []);

    const fromFn = normalizeDayMarkers((iso) => (iso === '2026-11-20' ? 2 : null), '2026-11-20');
    assert.deepEqual(fromFn, [{ tone: 'accent' }, { tone: 'accent' }]);

    const setMarkers = new Set(['2026-11-20']);
    assert.deepEqual(normalizeDayMarkers(setMarkers, '2026-11-20'), [{ tone: 'accent' }]);
    assert.deepEqual(normalizeDayMarkers(setMarkers, '2026-11-21'), []);

    const arrayMarkers = ['2026-11-20'];
    assert.deepEqual(normalizeDayMarkers(arrayMarkers, '2026-11-20'), [{ tone: 'accent' }]);
    assert.deepEqual(normalizeDayMarkers(arrayMarkers, '2026-11-21'), []);
  });
});

// ---------------------------------------------------------------------------
// 5. toast.js
// ---------------------------------------------------------------------------
describe('toast.js — verified promises, result envelopes & exit-window ID reuse', () => {
  beforeEach(() => {
    dismissToast();
  });

  it('transitions toast.promise to success when verified', async () => {
    const id = 'promise-pass';
    const res = await toast.promise(
      async () => ({ ok: true, count: 4 }),
      {
        id,
        duration: 0,
        loading: 'Saving changes…',
        verify: (data) => data.count === 4,
        success: (data) => ({ title: 'Saved', description: `${data.count} items synced` }),
      },
    );
    assert.equal(res.count, 4);
    const active = getToasts().find((t) => t.id === id);
    assert.ok(active);
    assert.equal(active.tone, 'success');
    assert.equal(active.loading, false);
    assert.equal(active.title, 'Saved');
    assert.equal(active.description, '4 items synced');
  });

  it('turns { ok: false, error } into danger with clean description and never [object Object]', async () => {
    const envId = 'promise-envelope-fail';
    await toast.promise(
      async () => ({ ok: false, error: 'Quota exceeded on workspace' }),
      {
        id: envId,
        duration: 0,
        loading: 'Deploying…',
        success: 'Deployed',
        error: 'Deploy failed',
      },
    );
    const envToast = getToasts().find((t) => t.id === envId);
    assert.ok(envToast);
    assert.equal(envToast.tone, 'danger');
    assert.equal(envToast.title, 'Deploy failed');
    assert.equal(envToast.description, 'Quota exceeded on workspace');
    assert.ok(!String(envToast.description).includes('[object Object]'));

    const rejId = 'promise-reject-obj';
    await assert.rejects(
      () =>
        toast.promise(
          async () => {
            throw { ok: false, error: 'Upstream gateway timeout' };
          },
          {
            id: rejId,
            duration: 0,
            loading: 'Syncing…',
            success: 'Synced',
            error: 'Sync failed',
          },
        ),
    );
    const rejToast = getToasts().find((t) => t.id === rejId);
    assert.ok(rejToast);
    assert.equal(rejToast.tone, 'danger');
    assert.equal(rejToast.title, 'Sync failed');
    assert.equal(rejToast.description, 'Upstream gateway timeout');
    assert.ok(!String(rejToast.title).includes('[object Object]'));
    assert.ok(!String(rejToast.description ?? '').includes('[object Object]'));
  });

  it('handles verify returning false or an error string, plus toast.fromResult', async () => {
    await toast.promise(async () => ({ committed: 0 }), {
      id: 'verify-bool-false',
      duration: 0,
      loading: 'Committing…',
      verify: () => false,
      success: 'Committed',
      error: 'Commit check failed',
    });
    const boolToast = getToasts().find((t) => t.id === 'verify-bool-false');
    assert.ok(boolToast);
    assert.equal(boolToast.tone, 'danger');
    assert.equal(boolToast.description, 'Verification failed');

    await toast.promise(async () => ({ committed: 0 }), {
      id: 'verify-err-str',
      duration: 0,
      loading: 'Committing…',
      verify: () => 'Zero rows affected',
      success: 'Committed',
      error: 'Commit rejected',
    });
    const strToast = getToasts().find((t) => t.id === 'verify-err-str');
    assert.ok(strToast);
    assert.equal(strToast.tone, 'danger');
    assert.equal(strToast.description, 'Zero rows affected');

    const resFailId = toast.fromResult(
      { ok: false, error: 'Invalid token' },
      { id: 'from-result-fail', duration: 0, error: 'Auth failed', success: 'Signed in' },
    );
    const resFailToast = getToasts().find((t) => t.id === resFailId);
    assert.ok(resFailToast);
    assert.equal(resFailToast.tone, 'danger');
    assert.equal(resFailToast.description, 'Invalid token');

    const resOkId = toast.fromResult(
      { ok: true, data: { user: 'ada' } },
      { id: 'from-result-ok', duration: 0, success: (d) => `Welcome ${d.user}` },
    );
    const resOkToast = getToasts().find((t) => t.id === resOkId);
    assert.ok(resOkToast);
    assert.equal(resOkToast.tone, 'success');
    assert.equal(resOkToast.title, 'Welcome ada');
  });

  it('preserves a toast when its ID is reused or updated within the 220ms dismissToast exit window', async () => {
    const id = 'reused-toast-id';
    const updId = 'updated-toast-id';
    toast({ id, title: 'Initial notification', duration: 0 });
    toast({ id: updId, title: 'Initial updatable', duration: 0 });
    dismissToast(id);
    dismissToast(updId);

    assert.equal(getToasts().find((t) => t.id === id)?.state, 'closing');
    assert.equal(getToasts().find((t) => t.id === updId)?.state, 'closing');

    // Reopen / update with the same IDs after 40ms (well inside the 220ms exit animation window)
    await wait(40);
    toast.success('Reopened notification', { id, duration: 0 });
    toast.update(updId, { title: 'Updated notification', tone: 'info', duration: 0 });

    assert.equal(getToasts().find((t) => t.id === id)?.state, 'open');
    assert.equal(getToasts().find((t) => t.id === updId)?.state, 'open');

    // Wait 250ms past reopen (total 290ms > 220ms exit window) and assert neither was deleted
    await wait(250);
    const stillAlive = getToasts().find((t) => t.id === id);
    const stillUpdated = getToasts().find((t) => t.id === updId);
    assert.ok(stillAlive, 'Reopened toast must not be deleted by stale exit timer');
    assert.equal(stillAlive.state, 'open');
    assert.equal(stillAlive.title, 'Reopened notification');
    assert.ok(stillUpdated, 'Updated toast must not be deleted by stale exit timer');
    assert.equal(stillUpdated.state, 'open');
    assert.equal(stillUpdated.title, 'Updated notification');
  });
});

// ---------------------------------------------------------------------------
// 6. shortcuts.js
// ---------------------------------------------------------------------------
describe('shortcuts.js — chord matching, shifted punctuation & sequences', () => {
  const isMacRuntime = formatShortcut('mod+k')[0] === '⌘';
  const modFlags = { metaKey: isMacRuntime, ctrlKey: !isMacRuntime };

  it('formats platform-aware shortcut tokens', () => {
    assert.deepEqual(formatShortcut('mod+shift+p', { mac: true }), ['⇧', '⌘', 'P']);
    assert.deepEqual(formatShortcut('mod+shift+p', { mac: false }), ['Ctrl', 'Shift', 'P']);
    assert.deepEqual(formatShortcut('g p', { mac: false }), ['G', 'P']);
  });

  it('matches Mod+Shift+/ when browser reports key: "?" and code: "Slash"', () => {
    const doc = new globalThis.Document();
    const reg = createShortcutRegistry(doc);
    let hits = 0;

    reg.register('Mod+Shift+/', () => {
      hits += 1;
    });

    const evt = makeKeyEvent({
      ...modFlags,
      shiftKey: true,
      key: '?',
      code: 'Slash',
    });
    doc.dispatchEvent(evt);
    assert.equal(hits, 1);
    assert.equal(evt.defaultPrevented, true);

    reg.destroy();
  });

  it('matches 2-step key sequences (g p) and ignores unrelated second keys', () => {
    const doc = new globalThis.Document();
    const reg = createShortcutRegistry(doc);
    let count = 0;

    reg.register('g p', () => {
      count += 1;
    });

    doc.dispatchEvent(makeKeyEvent({ key: 'g', code: 'KeyG' }));
    assert.equal(count, 0);
    doc.dispatchEvent(makeKeyEvent({ key: 'x', code: 'KeyX' }));
    assert.equal(count, 0);

    doc.dispatchEvent(makeKeyEvent({ key: 'g', code: 'KeyG' }));
    doc.dispatchEvent(makeKeyEvent({ key: 'p', code: 'KeyP' }));
    assert.equal(count, 1);

    reg.destroy();
  });
});

// ---------------------------------------------------------------------------
// 7. virtual-list.js & data-grid.js
// ---------------------------------------------------------------------------
describe('virtual-list.js & data-grid.js — virtualization, sort, filter & 2D keyboard nav', () => {
  it('computes virtualized slices and scrollToIndex offsets in createVirtualizer', () => {
    const vp = new globalThis.HTMLElement();
    vp.clientHeight = 200;
    vp.scrollTop = 0;
    vp.scrollTo = ({ top }) => {
      vp.scrollTop = top;
    };

    const states = [];
    const ctrl = createVirtualizer(vp, {
      count: 1000,
      itemHeight: 40,
      overscan: 2,
      onChange: (s) => states.push(s),
    });

    assert.equal(ctrl.getTotalHeight(), 40000);
    assert.equal(ctrl.getState().startIndex, 0);
    assert.equal(ctrl.getState().endIndex, 6); // ceil(200/40)-1 + 2 = 6

    ctrl.scrollToIndex(50, 'start');
    assert.equal(vp.scrollTop, 2000);
    assert.equal(ctrl.getState().startIndex, 48);
    assert.ok(states.length >= 2);

    ctrl.destroy();
  });

  it('filters and multi-sorts rows in data-grid.js', () => {
    const rows = [
      { id: 1, service: 'auth', latency: 42, region: 'us-east' },
      { id: 2, service: 'billing', latency: 18, region: 'eu-west' },
      { id: 3, service: 'cache', latency: 18, region: 'ap-south' },
    ];
    const cols = [
      { key: 'service', searchable: true },
      { key: 'latency', searchable: false },
      { key: 'region', searchable: true },
    ];

    const filtered = filterGridRows(rows, 'EU-WEST', cols);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 2);

    // Single-sort cycle: asc -> desc -> none
    let sorts = nextGridSorts([], 'latency', false);
    assert.deepEqual(sorts, [{ key: 'latency', direction: 'asc' }]);
    sorts = nextGridSorts(sorts, 'latency', false);
    assert.deepEqual(sorts, [{ key: 'latency', direction: 'desc' }]);
    assert.deepEqual(nextGridSorts(sorts, 'latency', false), []);

    // Multi-sort: primary latency asc, secondary region asc
    let multi = nextGridSorts([], 'latency', true);
    multi = nextGridSorts(multi, 'region', true);
    assert.deepEqual(multi, [
      { key: 'latency', direction: 'asc' },
      { key: 'region', direction: 'asc' },
    ]);

    const sorted = sortGridRows(rows, multi, cols);
    assert.deepEqual(
      sorted.map((r) => r.id),
      [3, 2, 1],
    );
  });

  it('handles 2D body cell navigation, selection, and row activation in handleGridKeydown', () => {
    let nav = null;
    let toggled = null;
    let activated = null;
    let selectedAll = 0;

    const state = {
      rowCount: 10,
      colCount: 4,
      rowIndex: 2,
      colIndex: 1,
      pageSize: 5,
      selectable: 'multiple',
      onNavigate: (next) => {
        nav = next;
      },
      onToggleSelect: (r, ext) => {
        toggled = { r, ext };
      },
      onActivate: (r) => {
        activated = r;
      },
      onSelectAll: () => {
        selectedAll += 1;
      },
    };

    const downRes = handleGridKeydown(
      makeKeyEvent({ key: 'ArrowDown', shiftKey: true, target: new globalThis.HTMLElement() }),
      state,
    );
    assert.deepEqual(downRes, {
      type: 'navigate',
      rowIndex: 3,
      colIndex: 1,
      extendSelection: true,
    });
    assert.equal(nav?.rowIndex, 3);

    const spaceRes = handleGridKeydown(
      makeKeyEvent({ key: ' ', target: new globalThis.HTMLElement() }),
      state,
    );
    assert.equal(spaceRes?.type, 'select');
    assert.deepEqual(toggled, { r: 2, ext: false });

    const enterRes = handleGridKeydown(
      makeKeyEvent({ key: 'Enter', target: new globalThis.HTMLElement() }),
      state,
    );
    assert.equal(enterRes?.type, 'activate');
    assert.equal(activated, 2);

    const allRes = handleGridKeydown(
      makeKeyEvent({ key: 'a', metaKey: true, target: new globalThis.HTMLElement() }),
      state,
    );
    assert.equal(allRes?.type, 'select-all');
    assert.equal(selectedAll, 1);
  });

  it('navigates into header row -1 via ArrowUp from row 0 and activates header via Enter/Space', () => {
    let navTarget = null;
    let activatedRow = null;
    const headerActivations = [];

    const baseState = {
      rowCount: 5,
      colCount: 3,
      rowIndex: 0,
      colIndex: 1,
      selectable: 'multiple',
      hasHeader: true,
      includeHeader: true,
      onNavigate: (next) => {
        navTarget = next;
      },
      onActivate: (r) => {
        activatedRow = r;
      },
      onHeaderActivate: (c) => headerActivations.push(c),
      onActivateHeader: (c) => headerActivations.push(c),
      onHeaderSort: (c) => headerActivations.push(c),
      onSort: (c) => headerActivations.push(c),
    };

    const upEvt = makeKeyEvent({ key: 'ArrowUp', target: new globalThis.HTMLElement() });
    const upRes = handleGridKeydown(upEvt, baseState);
    assert.ok(upRes);
    assert.equal(upEvt.defaultPrevented, true);
    assert.equal(upRes.type, 'navigate');
    assert.equal(upRes.rowIndex, -1);
    assert.equal(upRes.colIndex, 1);
    assert.equal(navTarget?.rowIndex, -1);
    assert.equal(navTarget?.colIndex, 1);

    // Header Enter activation on row -1
    const enterEvt = makeKeyEvent({ key: 'Enter', target: new globalThis.HTMLElement() });
    const enterRes = handleGridKeydown(enterEvt, { ...baseState, rowIndex: -1, colIndex: 1 });
    assert.ok(enterRes);
    assert.equal(enterEvt.defaultPrevented, true);
    assert.equal(enterRes.rowIndex, -1);
    assert.equal(enterRes.colIndex, 1);
    assert.equal(activatedRow, null);
    assert.ok(headerActivations.includes(1));

    // Header Space activation on row -1
    headerActivations.length = 0;
    const spaceEvt = makeKeyEvent({ key: ' ', target: new globalThis.HTMLElement() });
    const spaceRes = handleGridKeydown(spaceEvt, { ...baseState, rowIndex: -1, colIndex: 2 });
    assert.ok(spaceRes);
    assert.equal(spaceEvt.defaultPrevented, true);
    assert.equal(spaceRes.rowIndex, -1);
    assert.equal(spaceRes.colIndex, 2);
    assert.ok(headerActivations.includes(2));

    // ArrowDown from header row -1 returns to body row 0
    const downEvt = makeKeyEvent({ key: 'ArrowDown', target: new globalThis.HTMLElement() });
    const downRes = handleGridKeydown(downEvt, { ...baseState, rowIndex: -1, colIndex: 2 });
    assert.ok(downRes);
    assert.equal(downRes.type, 'navigate');
    assert.equal(downRes.rowIndex, 0);
    assert.equal(downRes.colIndex, 2);
  });
});

// ---------------------------------------------------------------------------
// 8. COMPONENT_MANIFEST.json
// ---------------------------------------------------------------------------
describe('COMPONENT_MANIFEST.json — Vue/React props, named slots & granular CSS metadata', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'COMPONENT_MANIFEST.json'), 'utf8'),
  );

  it('includes --j-space-2-5 token and foundationImport metadata', () => {
    assert.ok(manifest.tokens.includes('--j-space-2-5'));
    assert.equal(manifest.cssImports?.foundationImport, 'jenni-core/css/foundation.css');
  });

  it('populates non-empty Vue and React props for JDataGrid, JVirtualList, JIcon, JToolbar, JStatusBar, JDocTabs', () => {
    for (const vueName of [
      'JDataGrid',
      'JVirtualList',
      'JIcon',
      'JToolbar',
      'JStatusBar',
      'JDocTabs',
    ]) {
      const comp = manifest.components.find((c) => c.vueName === vueName);
      assert.ok(comp, `Missing component ${vueName} in manifest`);
      assert.ok(comp.props.length > 0, `${vueName} props should be non-empty`);
      assert.ok(comp.vue.props.length > 0, `${vueName} vue.props should be non-empty`);
      assert.ok(comp.react.props.length > 0, `${vueName} react.props should be non-empty`);
      assert.equal(comp.css.foundationImport, 'jenni-core/css/foundation.css');
      assert.ok(comp.css.componentImport.startsWith('jenni-core/css/'));
    }

    const gridComp = manifest.components.find((c) => c.vueName === 'JDataGrid');
    assert.ok(gridComp.css.sourceImports.includes('jenni-core/components/choice.css'));
    assert.ok(gridComp.css.sourceImports.includes('jenni-core/components/checkbox.css'));
  });

  it('extracts exact named slots on JToolbar, JStatusBar, JCalendar, and JAppShell', () => {
    const toolbar = manifest.components.find((c) => c.vueName === 'JToolbar');
    for (const slot of ['default', 'start', 'center', 'end']) {
      assert.ok(toolbar.slots.includes(slot), `JToolbar missing slot "${slot}"`);
    }

    const statusBar = manifest.components.find((c) => c.vueName === 'JStatusBar');
    for (const slot of ['default', 'start', 'center', 'end']) {
      assert.ok(statusBar.slots.includes(slot), `JStatusBar missing slot "${slot}"`);
    }

    const calendar = manifest.components.find((c) => c.vueName === 'JCalendar');
    assert.ok(calendar.slots.includes('day'), 'JCalendar missing slot "day"');

    const appShell = manifest.components.find((c) => c.vueName === 'JAppShell');
    for (const slot of ['banner', 'topbar', 'statusbar', 'sidebar', 'aside', 'dock']) {
      assert.ok(appShell.slots.includes(slot), `JAppShell missing slot "${slot}"`);
    }
  });
});
