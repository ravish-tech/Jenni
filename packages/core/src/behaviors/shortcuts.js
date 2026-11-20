// Tab- & visibility-aware keyboard shortcut registry.
// Supports modifier chords (`mod+k`, `mod+shift+p`, `alt+n`, `f2`, `/`) and 2-step
// sequences (`g i` within 800ms), while automatically suppressing inactive tabs,
// hidden panels, background scopes behind modal `<dialog>`s, inputs, and terminals.

const DEFAULT_SEQUENCE_TIMEOUT = 800;

/**
 * @typedef {(e: KeyboardEvent) => void} ShortcutHandler
 *
 * @typedef {{
 *   scope?: HTMLElement | null | (() => HTMLElement | null | undefined),
 *   priority?: number,
 *   enabled?: boolean | (() => boolean),
 *   preventDefault?: boolean,
 *   stopPropagation?: boolean,
 *   allowInInputs?: boolean,
 *   allowModInInputs?: boolean,
 *   allowInTerminal?: boolean,
 *   globalModal?: boolean,
 *   allowRepeat?: boolean,
 *   sequenceTimeout?: number,
 *   description?: string,
 * }} ShortcutOptions
 *
 * @typedef {{
 *   mac?: boolean,
 * }} FormatShortcutOptions
 *
 * @typedef {{
 *   register: (combo: string | readonly string[], handler: ShortcutHandler, options?: ShortcutOptions) => () => void,
 *   unregisterAll: () => void,
 *   clear: () => void,
 *   destroy: () => void,
 *   format: (combo: string, options?: FormatShortcutOptions) => string[],
 *   isElementActiveAndVisible: (el: HTMLElement | null | undefined) => boolean,
 * }} ShortcutRegistry
 */

/**
 * @typedef {{
 *   key: string,
 *   mod: boolean,
 *   ctrl: boolean,
 *   meta: boolean,
 *   alt: boolean,
 *   shift: boolean,
 * }} ParsedChord
 */

/**
 * Detect macOS / iOS / iPadOS platform for `mod` (`⌘` vs `Ctrl`) resolution.
 * @returns {boolean}
 */
function detectMacPlatform() {
  if (typeof navigator === 'undefined') return false;
  const src = navigator.platform || navigator.userAgent || '';
  return /Mac|iPhone|iPad|iPod/i.test(src);
}

/** @type {Record<string, string>} */
const KEY_ALIASES = {
  esc: 'escape',
  return: 'enter',
  space: ' ',
  spacebar: ' ',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  del: 'delete',
  ins: 'insert',
  pgup: 'pageup',
  pgdn: 'pagedown',
  plus: '+',
};

/** @type {Record<string, string>} */
const DISPLAY_NAMES = {
  escape: 'Esc',
  ' ': 'Space',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Del',
  enter: 'Enter',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  home: 'Home',
  end: 'End',
  pageup: 'PgUp',
  pagedown: 'PgDn',
};

/**
 * Normalize a single chord token like `'mod+shift+p'` or `'/'`.
 * @param {string} rawChord
 * @returns {ParsedChord}
 */
function parseChord(rawChord) {
  const trimmed = rawChord.trim().toLowerCase();
  if (trimmed === '+') {
    return { key: '+', mod: false, ctrl: false, meta: false, alt: false, shift: false };
  }

  // Handle trailing `+` like `'mod++'`
  const endsWithPlus = trimmed.endsWith('++');
  const base = endsWithPlus ? trimmed.slice(0, -2) : trimmed;
  const parts = base.split('+').filter(Boolean);
  if (endsWithPlus) parts.push('+');

  let mod = false;
  let ctrl = false;
  let meta = false;
  let alt = false;
  let shift = false;
  let key = '';

  for (const part of parts) {
    if (part === 'mod') mod = true;
    else if (part === 'ctrl' || part === 'control') ctrl = true;
    else if (part === 'meta' || part === 'cmd' || part === 'command' || part === 'win' || part === 'super') meta = true;
    else if (part === 'alt' || part === 'opt' || part === 'option') alt = true;
    else if (part === 'shift') shift = true;
    else key = KEY_ALIASES[part] ?? part;
  }

  return { key, mod, ctrl, meta, alt, shift };
}

/**
 * Parse a combo string into 1 or more chord steps (e.g. `'g i'` -> 2 steps).
 * @param {string} combo
 * @returns {ParsedChord[]}
 */
function parseSequence(combo) {
  const raw = combo.trim();
  if (!raw) return [];
  if (raw === ' ') return [parseChord('space')];
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map(parseChord)
    .filter((c) => Boolean(c.key));
}

/**
 * Check whether a chord uses a modifier or function key (`F1`..`F12`).
 * @param {ParsedChord} chord
 * @returns {boolean}
 */
function isModifiedOrFunctionChord(chord) {
  if (chord.mod || chord.ctrl || chord.meta || chord.alt) return true;
  return /^f([1-9]|1[0-2])$/.test(chord.key);
}

/** @type {Record<string, string>} */
const CODE_PUNCTUATION_MAP = {
  Slash: '/',
  Period: '.',
  Comma: ',',
  Minus: '-',
  Equal: '=',
  Backquote: '`',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
};

/**
 * Match a DOM `KeyboardEvent` against a parsed chord step.
 * @param {ParsedChord} chord
 * @param {KeyboardEvent} e
 * @param {boolean} mac
 * @returns {boolean}
 */
function matchesChord(chord, e, mac) {
  const wantMeta = chord.meta || (mac && chord.mod);
  const wantCtrl = chord.ctrl || (!mac && chord.mod);

  if (Boolean(e.metaKey) !== wantMeta) return false;
  if (Boolean(e.ctrlKey) !== wantCtrl) return false;
  if (Boolean(e.altKey) !== chord.alt) return false;

  const rawEventKey = e.key || '';
  const eventKey = rawEventKey.length === 1 ? rawEventKey.toLowerCase() : rawEventKey.toLowerCase();
  const normalizedEventKey = KEY_ALIASES[eventKey] ?? eventKey;

  let keyMatched = normalizedEventKey === chord.key;

  // Fallback for Option/Shift altered characters via physical `e.code` (e.g. Option+N or Mod+Shift+/ on macOS)
  if (!keyMatched && (chord.alt || chord.shift || chord.mod || chord.ctrl || chord.meta) && e.code) {
    if (/^[a-z]$/.test(chord.key) && e.code === `Key${chord.key.toUpperCase()}`) {
      keyMatched = true;
    } else if (/^[0-9]$/.test(chord.key) && e.code === `Digit${chord.key}`) {
      keyMatched = true;
    } else if (
      Object.prototype.hasOwnProperty.call(CODE_PUNCTUATION_MAP, e.code) &&
      CODE_PUNCTUATION_MAP[e.code] === chord.key
    ) {
      keyMatched = true;
    }
  }

  if (!keyMatched) return false;

  // Shift check: allow implicit Shift for punctuation characters produced via Shift (e.g. `?`, `!`, `:`)
  if (chord.shift) {
    if (!e.shiftKey) return false;
  } else if (e.shiftKey) {
    const isShiftedSymbol =
      chord.key.length === 1 &&
      chord.key.toLowerCase() === chord.key.toUpperCase() &&
      chord.key !== ' ' &&
      rawEventKey === chord.key;
    if (!isShiftedSymbol) return false;
  }

  return true;
}

/**
 * Check whether an element is connected, inside an active tab/dialog, and visibly rendered.
 * Returns `false` when inside `[hidden]`, `[inert]`, `[aria-hidden="true"]`, `[data-state="inactive"]`,
 * `[role="tabpanel"][hidden]`, closed `dialog:not([open])`, or `display: none` (`getClientRects().length === 0`).
 * @param {HTMLElement | null | undefined} el
 * @returns {boolean}
 */
export function isElementActiveAndVisible(el) {
  if (!el || !el.isConnected) return false;
  const doc = el.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (doc?.hidden === true) return false;
  if (
    el.closest(
      '[hidden], [inert], [aria-hidden="true"], [data-state="inactive"], [role="tabpanel"][hidden], dialog:not([open])',
    )
  ) {
    return false;
  }
  const win = doc?.defaultView || (typeof window !== 'undefined' ? window : null);
  const getStyle =
    win && typeof win.getComputedStyle === 'function'
      ? (/** @type {Element} */ node) => win.getComputedStyle(node)
      : typeof getComputedStyle === 'function'
        ? (/** @type {Element} */ node) => getComputedStyle(node)
        : null;
  const style = getStyle ? getStyle(el) : null;
  if (style && (style.display === 'none' || style.visibility === 'hidden')) {
    return false;
  }
  if (el.getClientRects().length === 0) {
    if (win && typeof win.getComputedStyle === 'function' && win.getComputedStyle(el).display === 'contents') {
      const descendants = el.querySelectorAll('*');
      let hasNonContentsDescendant = false;
      for (let i = 0; i < descendants.length; i += 1) {
        const desc = descendants[i];
        if (desc.getClientRects().length > 0) {
          return true;
        }
        if (win.getComputedStyle(desc).display !== 'contents') {
          hasNonContentsDescendant = true;
        }
      }
      if (hasNonContentsDescendant) {
        return false;
      }
      let parent = el.parentElement;
      while (parent && win.getComputedStyle(parent).display === 'contents') {
        parent = parent.parentElement;
      }
      return Boolean(parent && parent.getClientRects().length > 0);
    }
    return false;
  }
  return true;
}

/**
 * Compute DOM tree depth for specificity tie-breaking (deeper element wins).
 * @param {HTMLElement | null} el
 * @returns {number}
 */
function getDomDepth(el) {
  if (!el) return -1;
  let depth = 0;
  /** @type {Node | null} */
  let cur = el;
  while (cur.parentNode) {
    depth += 1;
    cur = cur.parentNode;
  }
  return depth;
}

/**
 * Return the topmost open modal `<dialog>` in `doc`, or `null` when none is open.
 * @param {Document} doc
 * @param {EventTarget | null} eventTarget
 * @returns {HTMLDialogElement | null}
 */
function getTopModalDialog(doc, eventTarget) {
  const dialogs = doc.querySelectorAll('dialog[open]');
  if (!dialogs.length) return null;
  /** @type {HTMLDialogElement[]} */
  const modals = [];
  dialogs.forEach((d) => {
    const dlg = /** @type {HTMLDialogElement} */ (d);
    let isModal = false;
    try {
      isModal = dlg.matches(':modal');
    } catch {
      isModal = true;
    }
    if (isModal) modals.push(dlg);
  });
  if (!modals.length) return null;
  if (typeof Node !== 'undefined' && eventTarget instanceof Node) {
    for (let i = modals.length - 1; i >= 0; i--) {
      if (modals[i].contains(eventTarget)) return modals[i];
    }
  }
  return modals[modals.length - 1];
}

/**
 * Format a shortcut combo into platform-aware display tokens (e.g. `['⌘', 'K']` on Mac, `['Ctrl', 'K']` elsewhere).
 * @param {string} combo
 * @param {FormatShortcutOptions} [options]
 * @returns {string[]}
 */
export function formatShortcut(combo, options = {}) {
  const mac = options.mac ?? detectMacPlatform();
  const steps = parseSequence(combo);
  /** @type {string[]} */
  const tokens = [];

  for (const step of steps) {
    const wantCtrl = step.ctrl || (!mac && step.mod);
    const wantAlt = step.alt;
    const wantShift = step.shift;
    const wantMeta = step.meta || (mac && step.mod);

    if (mac) {
      if (wantCtrl) tokens.push('⌃');
      if (wantAlt) tokens.push('⌥');
      if (wantShift) tokens.push('⇧');
      if (wantMeta) tokens.push('⌘');
    } else {
      if (wantCtrl) tokens.push('Ctrl');
      if (wantAlt) tokens.push('Alt');
      if (wantShift) tokens.push('Shift');
      if (wantMeta) tokens.push('Meta');
    }

    let label = DISPLAY_NAMES[step.key];
    if (!label) {
      if (mac && step.key === 'enter') label = '↵';
      else if (mac && step.key === 'backspace') label = '⌫';
      else if (step.key.length === 1) label = step.key.toUpperCase();
      else if (/^f\d+$/.test(step.key)) label = step.key.toUpperCase();
      else label = step.key.charAt(0).toUpperCase() + step.key.slice(1);
    } else if (mac && step.key === 'enter') {
      label = '↵';
    } else if (mac && step.key === 'backspace') {
      label = '⌫';
    }
    tokens.push(label);
  }

  return tokens;
}

/**
 * Create an isolated or root-scoped shortcut registry.
 * @param {Document | HTMLElement | null} [root]
 * @returns {ShortcutRegistry}
 */
export function createShortcutRegistry(root) {
  let seqId = 0;

  /**
   * @typedef {{
   *   id: number,
   *   order: number,
   *   steps: ParsedChord[],
   *   handler: ShortcutHandler,
   *   options: ShortcutOptions,
   *   hasScope: boolean,
   * }} Entry
   */

  /** @type {Map<number, Entry>} */
  const entries = new Map();
  let listening = false;
  let destroyed = false;

  /** @type {{ event: KeyboardEvent, time: number, timer: ReturnType<typeof setTimeout> } | null} */
  let pendingPrefix = null;

  const clearPrefix = () => {
    if (pendingPrefix) {
      clearTimeout(pendingPrefix.timer);
      pendingPrefix = null;
    }
  };

  const getTargetNode = () => {
    if (root) return root;
    if (typeof document !== 'undefined') return document;
    return null;
  };

  /**
   * Evaluate whether `entry` is currently eligible to handle `e`.
   * Returns resolved `{ scopeEl, depth, priority, focusScore }` or `null` if suppressed.
   * @param {Entry} entry
   * @param {KeyboardEvent} e
   * @param {Document} doc
   * @param {HTMLDialogElement | null} topModal
   * @param {boolean} inTerminal
   * @param {boolean} inEditable
   */
  const evaluateCandidate = (entry, e, doc, topModal, inTerminal, inEditable) => {
    const opts = entry.options;
    const enabled = typeof opts.enabled === 'function' ? opts.enabled() : opts.enabled !== false;
    if (!enabled) return null;

    if (e.repeat && opts.allowRepeat !== true) return null;

    /** @type {HTMLElement | null} */
    let scopeEl = null;
    if (entry.hasScope) {
      const resolved = typeof opts.scope === 'function' ? opts.scope() : opts.scope;
      scopeEl = resolved ?? null;
      if (!isElementActiveAndVisible(scopeEl)) return null;
    }

    // Modal Top-Layer Guard
    if (topModal && opts.globalModal !== true) {
      if (!scopeEl || !topModal.contains(scopeEl)) return null;
    }

    // Terminal Guard (.xterm / .xterm-helper-textarea)
    if (inTerminal && opts.allowInTerminal !== true) {
      return null;
    }

    // Input / Editor Guard (input, textarea, select, contenteditable, .cm-content)
    if (inEditable && !inTerminal && opts.allowInInputs !== true) {
      const isSingleModified =
        entry.steps.length === 1 && isModifiedOrFunctionChord(entry.steps[0]);
      const allowMod = opts.allowModInInputs ?? true;
      if (!isSingleModified || !allowMod) {
        return null;
      }
    }

    const activeNode =
      (typeof Node !== 'undefined' && e.target instanceof Node ? e.target : null) ||
      (typeof Node !== 'undefined' && doc.activeElement instanceof Node ? doc.activeElement : null);
    const focusScore = scopeEl && activeNode && scopeEl.contains(activeNode) ? 1 : 0;

    return {
      entry,
      priority: opts.priority ?? 0,
      focusScore,
      depth: getDomDepth(scopeEl),
      order: entry.order,
    };
  };

  /**
   * Pick the highest-specificity candidate:
   * 1. highest `priority`
   * 2. scope containing focused target (`focusScore`)
   * 3. deepest DOM `scope` (`depth`)
   * 4. most recently registered (`order`)
   * @param {Array<{ entry: Entry, priority: number, focusScore: number, depth: number, order: number }>} list
   */
  const pickWinner = (list) => {
    if (!list.length) return null;
    list.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (b.focusScore !== a.focusScore) return b.focusScore - a.focusScore;
      if (b.depth !== a.depth) return b.depth - a.depth;
      return b.order - a.order;
    });
    return list[0].entry;
  };

  /**
   * @param {Entry} winner
   * @param {KeyboardEvent} e
   */
  const fireWinner = (winner, e) => {
    if (winner.options.preventDefault !== false) {
      e.preventDefault();
    }
    if (winner.options.stopPropagation === true) {
      e.stopPropagation();
    }
    winner.handler(e);
  };

  /** @param {Event} rawEvt */
  const onKeyDown = (rawEvt) => {
    const e = /** @type {KeyboardEvent} */ (rawEvt);
    if (!entries.size || e.defaultPrevented || e.isComposing) return;
    if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt' || e.key === 'Shift') return;

    const targetNode = getTargetNode();
    const doc =
      (typeof Document !== 'undefined' && targetNode instanceof Document) ||
      (targetNode && !('ownerDocument' in targetNode && targetNode.ownerDocument) && 'querySelectorAll' in targetNode)
        ? /** @type {Document} */ (targetNode)
        : targetNode?.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!doc || doc.hidden === true) return;

    const mac = detectMacPlatform();

    const targetEl =
      typeof HTMLElement !== 'undefined' && e.target instanceof HTMLElement
        ? e.target
        : typeof HTMLElement !== 'undefined' && doc.activeElement instanceof HTMLElement
          ? doc.activeElement
          : e.target && typeof (/** @type {{ closest?: unknown }} */ (e.target)).closest === 'function'
            ? /** @type {HTMLElement} */ (e.target)
            : null;

    const inTerminal = Boolean(targetEl?.closest('.xterm, .xterm-helper-textarea'));
    const inEditable = Boolean(
      targetEl &&
        (targetEl.closest(
          'input, textarea, select, [contenteditable="true"], [contenteditable=""], .cm-content',
        ) ||
          targetEl.isContentEditable),
    );
    const topModal = getTopModalDialog(doc, e.target);
    const now = Date.now();

    // 1. Try completing an active 2-step sequence
    if (pendingPrefix) {
      const prev = pendingPrefix;
      clearPrefix();
      const elapsed = now - prev.time;
      /** @type {Array<{ entry: Entry, priority: number, focusScore: number, depth: number, order: number }>} */
      const seqMatches = [];
      entries.forEach((entry) => {
        if (entry.steps.length !== 2) return;
        const timeout = entry.options.sequenceTimeout ?? DEFAULT_SEQUENCE_TIMEOUT;
        if (elapsed > timeout) return;
        if (!matchesChord(entry.steps[0], prev.event, mac)) return;
        if (!matchesChord(entry.steps[1], e, mac)) return;
        const cand = evaluateCandidate(entry, e, doc, topModal, inTerminal, inEditable);
        if (cand) seqMatches.push(cand);
      });
      const seqWinner = pickWinner(seqMatches);
      if (seqWinner) {
        fireWinner(seqWinner, e);
        return;
      }
    }

    // 2. Match 1-step chords and check for 2-step sequence prefixes
    /** @type {Array<{ entry: Entry, priority: number, focusScore: number, depth: number, order: number }>} */
    const singleMatches = [];
    let maxPrefixTimeout = 0;
    let hasPrefixCandidate = false;

    entries.forEach((entry) => {
      if (entry.steps.length === 1) {
        if (!matchesChord(entry.steps[0], e, mac)) return;
        const cand = evaluateCandidate(entry, e, doc, topModal, inTerminal, inEditable);
        if (cand) singleMatches.push(cand);
      } else if (entry.steps.length === 2) {
        if (!matchesChord(entry.steps[0], e, mac)) return;
        const cand = evaluateCandidate(entry, e, doc, topModal, inTerminal, inEditable);
        if (cand) {
          hasPrefixCandidate = true;
          const t = entry.options.sequenceTimeout ?? DEFAULT_SEQUENCE_TIMEOUT;
          if (t > maxPrefixTimeout) maxPrefixTimeout = t;
        }
      }
    });

    const singleWinner = pickWinner(singleMatches);
    if (singleWinner) {
      fireWinner(singleWinner, e);
      return;
    }

    if (hasPrefixCandidate) {
      const waitMs = maxPrefixTimeout || DEFAULT_SEQUENCE_TIMEOUT;
      pendingPrefix = {
        event: e,
        time: now,
        timer: setTimeout(() => {
          pendingPrefix = null;
        }, waitMs),
      };
    }
  };

  const attachIfNeeded = () => {
    if (listening || destroyed || !entries.size) return;
    const node = getTargetNode();
    if (!node) return;
    node.addEventListener('keydown', onKeyDown);
    listening = true;
  };

  const detachIfEmpty = () => {
    if (!listening || entries.size > 0) return;
    const node = getTargetNode();
    node?.removeEventListener('keydown', onKeyDown);
    listening = false;
    clearPrefix();
  };

  /**
   * Register one or more shortcut combos.
   * @param {string | readonly string[]} combo
   * @param {ShortcutHandler} handler
   * @param {ShortcutOptions} [options]
   * @returns {() => void} unregister
   */
  const register = (combo, handler, options = {}) => {
    if (destroyed) return () => {};
    const list = Array.isArray(combo) ? combo : [combo];
    const hasScope = 'scope' in options && options.scope !== undefined;
    /** @type {number[]} */
    const ids = [];

    for (const item of list) {
      const steps = parseSequence(item);
      if (!steps.length) continue;
      const id = ++seqId;
      entries.set(id, {
        id,
        order: id,
        steps,
        handler,
        options,
        hasScope,
      });
      ids.push(id);
    }

    attachIfNeeded();

    return () => {
      for (const id of ids) {
        entries.delete(id);
      }
      detachIfEmpty();
    };
  };

  const unregisterAll = () => {
    entries.clear();
    detachIfEmpty();
  };

  const destroy = () => {
    destroyed = true;
    entries.clear();
    if (listening) {
      const node = getTargetNode();
      node?.removeEventListener('keydown', onKeyDown);
      listening = false;
    }
    clearPrefix();
  };

  return {
    register,
    unregisterAll,
    clear: unregisterAll,
    destroy,
    format: formatShortcut,
    isElementActiveAndVisible,
  };
}

/** Default document-wide shortcut registry singleton. */
export const shortcuts = createShortcutRegistry();

/**
 * Register a shortcut on the shared document registry.
 * @param {string | readonly string[]} combo
 * @param {ShortcutHandler} handler
 * @param {ShortcutOptions} [options]
 * @returns {() => void} unregister
 */
export function registerShortcut(combo, handler, options) {
  return shortcuts.register(combo, handler, options);
}
