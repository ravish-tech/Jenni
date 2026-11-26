// Toast & Toaster behavior.
// Shared reactive toast store + stacked-deck layout engine + optional vanilla DOM
// host so `toast(...)` works identically in plain HTML, Vue (`JToaster`), and
// React (`Toaster`).

const DEFAULT_DURATION = 4200;
const EXIT_DURATION = 220;
const DEFAULT_MAX_VISIBLE = 3;

let uid = 0;
let paused = false;
let managedHosts = 0;

/**
 * @typedef {'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'loading'} ToastTone
 * @typedef {'bottom-end' | 'bottom-center' | 'top-end' | 'top-center'} ToasterPosition
 * @typedef {{ label: string, onClick?: () => void }} ToastAction
 * @typedef {{
 *   id?: string,
 *   title: string,
 *   description?: string,
 *   tone?: ToastTone,
 *   loading?: boolean,
 *   duration?: number,
 *   action?: ToastAction,
 *   closable?: boolean,
 * }} ToastOptions
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description?: string,
 *   tone: ToastTone,
 *   loading: boolean,
 *   duration: number,
 *   action?: ToastAction,
 *   closable: boolean,
 *   state: 'open' | 'closing',
 *   createdAt: number,
 * }} ToastItem
 * @typedef {boolean | void | undefined | null | string | { ok: boolean, error?: string, message?: string }} ToastVerifyOutcome
 */

/**
 * @template T
 * @typedef {{
 *   id?: string,
 *   loading: string | Omit<ToastOptions, 'tone' | 'loading'>,
 *   success: string | Partial<ToastOptions> | ((data: T) => string | Partial<ToastOptions>),
 *   error?: string | Partial<ToastOptions> | ((err: unknown) => string | Partial<ToastOptions>),
 *   verify?: (data: T) => ToastVerifyOutcome | Promise<ToastVerifyOutcome>,
 *   autoVerifyResult?: boolean,
 *   throwOnError?: boolean,
 *   duration?: number,
 * }} ToastPromiseMessages
 */

/**
 * @template T
 * @typedef {{
 *   ok: boolean,
 *   data?: T,
 *   error?: string | Error,
 *   message?: string,
 * }} ResultLike
 */

/**
 * @template T
 * @typedef {{
 *   id?: string,
 *   success?: string | Partial<ToastOptions> | ((data: T | undefined, result: ResultLike<T>) => string | Partial<ToastOptions>),
 *   error?: string | Partial<ToastOptions> | ((errorMessage: string, result: ResultLike<T> | null | undefined) => string | Partial<ToastOptions>),
 *   verify?: (data: T | undefined, result: ResultLike<T>) => ToastVerifyOutcome,
 *   duration?: number,
 * }} ToastResultOptions
 */

/** @type {ToastItem[]} newest first (index 0 = front of deck) */
let items = [];

/** @type {Map<string, { timer?: ReturnType<typeof setTimeout>, remaining: number, startedAt: number }>} */
const timers = new Map();

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const exitTimers = new Map();

/** @type {Set<(list: ToastItem[]) => void>} */
const listeners = new Set();

function emit() {
  const snapshot = items.slice();
  listeners.forEach((fn) => fn(snapshot));
}

/**
 * Start or resume auto-dismiss countdown for a single toast.
 * @param {ToastItem} item
 * @param {number} ms
 */
function armTimer(item, ms) {
  const existing = timers.get(item.id);
  if (!Number.isFinite(ms) || ms <= 0 || item.loading || item.state === 'closing') {
    if (existing) {
      clearTimeout(existing.timer);
      timers.delete(item.id);
    }
    return;
  }
  const entry = existing || { remaining: ms, startedAt: Date.now() };
  clearTimeout(entry.timer);
  entry.remaining = ms;
  entry.startedAt = Date.now();
  if (!paused) {
    entry.timer = setTimeout(() => dismissToast(item.id), ms);
  }
  timers.set(item.id, entry);
}

/**
 * Pause all active auto-dismiss timers (e.g. while hovering `.j-toaster`).
 */
export function pauseToasts() {
  if (paused) return;
  paused = true;
  const now = Date.now();
  timers.forEach((entry) => {
    clearTimeout(entry.timer);
    entry.timer = undefined;
    entry.remaining = Math.max(400, entry.remaining - (now - entry.startedAt));
  });
}

/**
 * Resume all paused auto-dismiss timers.
 */
export function resumeToasts() {
  if (!paused) return;
  paused = false;
  items.forEach((item) => {
    const entry = timers.get(item.id);
    if (entry && item.state === 'open' && !item.loading) armTimer(item, entry.remaining);
  });
}

/**
 * Dismiss a toast by id, or dismiss every active toast when `id` is omitted.
 * @param {string} [id]
 */
export function dismissToast(id) {
  const targets = id ? items.filter((t) => t.id === id) : items.slice();
  if (!targets.length) return;
  let changed = false;
  targets.forEach((t) => {
    const entry = timers.get(t.id);
    if (entry) {
      clearTimeout(entry.timer);
      timers.delete(t.id);
    }
    if (exitTimers.has(t.id)) {
      clearTimeout(exitTimers.get(t.id));
      exitTimers.delete(t.id);
    }
    if (t.state !== 'closing') {
      t.state = 'closing';
      changed = true;
    }
    const exitHandle = setTimeout(() => {
      exitTimers.delete(t.id);
      const before = items.length;
      items = items.filter((x) => !(x.id === t.id && x.state === 'closing'));
      if (items.length !== before) emit();
    }, EXIT_DURATION);
    exitTimers.set(t.id, exitHandle);
  });
  if (changed) emit();
}

/**
 * Normalize string or options object into full ToastOptions.
 * @param {string | ToastOptions} input
 * @param {Partial<ToastOptions>} [extra]
 * @returns {ToastOptions}
 */
function normalizeOptions(input, extra = {}) {
  const base = typeof input === 'string' ? { title: input } : input;
  return { ...base, ...extra };
}

/**
 * Normalize string or partial options object into partial ToastOptions.
 * @param {string | Partial<ToastOptions>} input
 * @returns {Partial<ToastOptions>}
 */
function normalizePatch(input) {
  return typeof input === 'string' ? { title: input } : { ...input };
}

/**
 * Extract a clean error string from an arbitrary error or failed result value.
 * @param {unknown} err
 * @returns {string}
 */
function extractErrorMessage(err) {
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object') {
    const rec = /** @type {Record<string, unknown>} */ (err);
    if (typeof rec.error === 'string' && rec.error.trim()) return rec.error.trim();
    if (rec.error instanceof Error && rec.error.message) return rec.error.message;
    if (typeof rec.message === 'string' && rec.message.trim()) return rec.message.trim();
  }
  return '';
}

/**
 * Interpret a `verify(...)` return value into `{ ok: true }` or `{ ok: false, message }`.
 * @param {ToastVerifyOutcome} outcome
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function evaluateVerification(outcome) {
  if (outcome === false) {
    return { ok: false, message: 'Verification failed' };
  }
  if (typeof outcome === 'string') {
    const trimmed = outcome.trim();
    return trimmed ? { ok: false, message: trimmed } : { ok: true };
  }
  if (outcome && typeof outcome === 'object' && 'ok' in outcome) {
    if (outcome.ok === false) {
      return {
        ok: false,
        message: outcome.error || outcome.message || 'Verification failed',
      };
    }
    return { ok: true };
  }
  return { ok: true };
}

/**
 * Push a toast notification to the front of the deck.
 * @param {string | ToastOptions} input
 * @param {Partial<ToastOptions>} [extra]
 * @returns {string} toast id
 */
function pushToast(input, extra) {
  const opts = normalizeOptions(input, extra);
  const id = opts.id || `j-toast-${++uid}`;
  if (exitTimers.has(id)) {
    clearTimeout(exitTimers.get(id));
    exitTimers.delete(id);
  }
  const isLoading = Boolean(opts.loading || opts.tone === 'loading');
  const tone = opts.tone || (isLoading ? 'loading' : 'neutral');
  const duration = opts.duration ?? (isLoading ? 0 : DEFAULT_DURATION);
  const next = /** @type {ToastItem} */ ({
    id,
    title: opts.title,
    description: opts.description,
    tone,
    loading: isLoading,
    duration,
    action: opts.action,
    closable: opts.closable ?? true,
    state: 'open',
    createdAt: Date.now(),
  });

  const existingIdx = items.findIndex((t) => t.id === id);
  if (existingIdx >= 0) {
    items = [next, ...items.filter((t) => t.id !== id)];
  } else {
    items = [next, ...items];
  }

  if (managedHosts === 0 && typeof document !== 'undefined') {
    ensureVanillaToaster();
  }

  armTimer(next, duration);
  emit();
  return id;
}

/**
 * Update an existing toast in-place without resetting its deck position.
 * Transitions out of `loading` and arms `duration ?? DEFAULT_DURATION` automatically.
 * @param {string} id
 * @param {string | Partial<ToastOptions>} patch
 * @returns {string} toast id
 */
export function updateToast(id, patch) {
  if (exitTimers.has(id)) {
    clearTimeout(exitTimers.get(id));
    exitTimers.delete(id);
  }
  const p = normalizePatch(patch);
  const idx = items.findIndex((t) => t.id === id);
  if (idx < 0) {
    return pushToast({
      id,
      title: p.title || 'Notification',
      description: p.description,
      tone: p.tone,
      loading: p.loading ?? false,
      duration: p.duration,
      action: p.action,
      closable: p.closable,
    });
  }

  const prev = items[idx];
  const nextLoading = p.loading !== undefined ? p.loading : p.tone === 'loading';
  const nextTone =
    p.tone !== undefined
      ? p.tone
      : nextLoading
        ? prev.tone
        : prev.tone === 'loading'
          ? 'neutral'
          : prev.tone;
  const nextDuration =
    p.duration !== undefined
      ? p.duration
      : nextLoading
        ? 0
        : prev.loading || prev.duration <= 0
          ? DEFAULT_DURATION
          : prev.duration;

  const updated = /** @type {ToastItem} */ ({
    ...prev,
    title: p.title !== undefined ? p.title : prev.title,
    description: 'description' in p ? p.description : prev.description,
    tone: nextTone,
    loading: nextLoading,
    duration: nextDuration,
    action: 'action' in p ? p.action : prev.action,
    closable: p.closable !== undefined ? p.closable : prev.closable,
    state: 'open',
  });

  items = items.map((t, i) => (i === idx ? updated : t));

  if (managedHosts === 0 && typeof document !== 'undefined') {
    ensureVanillaToaster();
  }

  armTimer(updated, nextDuration);
  emit();
  return id;
}

/**
 * Track an async operation with verified result handling:
 * starts in `loading` (`duration: 0`), verifies the resolved value via `verify` / `{ ok: false }`,
 * and transitions in-place to `success` only when verified or `danger` on rejection/verification failure.
 * @template T
 * @param {Promise<T> | (() => Promise<T>)} promiseOrFn
 * @param {ToastPromiseMessages<T>} messages
 * @returns {Promise<T>}
 */
export async function promiseToast(promiseOrFn, messages) {
  const loadingBase =
    typeof messages.loading === 'string' ? { title: messages.loading } : messages.loading;
  const id = pushToast(loadingBase, {
    id: messages.id,
    tone: 'loading',
    loading: true,
    duration: 0,
  });

  /** @param {unknown} err */
  const buildErrorPatch = (err) => {
    const detail = extractErrorMessage(err);
    /** @type {Partial<ToastOptions>} */
    let resolved;
    if (typeof messages.error === 'function') {
      resolved = normalizePatch(messages.error(err));
    } else if (typeof messages.error === 'string') {
      resolved = {
        title: messages.error,
        description: detail && detail !== messages.error ? detail : undefined,
      };
    } else if (messages.error) {
      resolved = { ...messages.error };
    } else {
      resolved = { title: detail || 'Operation failed' };
    }
    return {
      description: undefined,
      action: undefined,
      ...resolved,
      tone: resolved.tone || 'danger',
      loading: false,
      duration: resolved.duration ?? messages.duration,
    };
  };

  /** @type {T} */
  let result;
  try {
    const pending = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
    result = await pending;
  } catch (err) {
    updateToast(id, buildErrorPatch(err));
    if (messages.throwOnError !== false) throw err;
    return /** @type {T} */ (undefined);
  }

  // Auto-verify `{ ok: false, error?, message? }` result envelopes unless opted out
  if (
    messages.autoVerifyResult !== false &&
    result &&
    typeof result === 'object' &&
    'ok' in result &&
    /** @type {{ ok?: unknown }} */ (result).ok === false
  ) {
    const reason = extractErrorMessage(result) || 'Operation reported failure';
    const verifyErr = new Error(reason, { cause: result });
    updateToast(id, buildErrorPatch(verifyErr));
    if (messages.throwOnError === true) throw verifyErr;
    return result;
  }

  // Explicit `verify(result)` hook
  if (typeof messages.verify === 'function') {
    /** @type {ToastVerifyOutcome} */
    let outcome;
    try {
      outcome = await messages.verify(result);
    } catch (verifyThrown) {
      updateToast(id, buildErrorPatch(verifyThrown));
      if (messages.throwOnError !== false) throw verifyThrown;
      return result;
    }
    const check = evaluateVerification(outcome);
    if (!check.ok) {
      const verifyErr = new Error(check.message);
      updateToast(id, buildErrorPatch(verifyErr));
      if (messages.throwOnError === true) throw verifyErr;
      return result;
    }
  }

  const rawSuccess =
    typeof messages.success === 'function' ? messages.success(result) : messages.success;
  const sOpts = normalizePatch(rawSuccess);
  updateToast(id, {
    description: undefined,
    action: undefined,
    ...sOpts,
    tone: sOpts.tone || 'success',
    loading: false,
    duration: sOpts.duration ?? messages.duration,
  });

  return result;
}

/**
 * Synchronously render a verified `{ ok: boolean, data?, error? }` result object as a toast.
 * Never shows unverified success when `ok` is `false` or `verify` fails.
 * @template T
 * @param {ResultLike<T> | null | undefined} result
 * @param {ToastResultOptions<T>} [options]
 * @returns {string} toast id
 */
export function toastFromResult(result, options = {}) {
  /**
   * @param {string} reason
   * @returns {string}
   */
  const showFailure = (reason) => {
    /** @type {Partial<ToastOptions>} */
    let resolved;
    if (typeof options.error === 'function') {
      resolved = normalizePatch(options.error(reason, result));
    } else if (typeof options.error === 'string') {
      resolved = {
        title: options.error,
        description: reason && reason !== options.error ? reason : undefined,
      };
    } else if (options.error) {
      resolved = { ...options.error };
    } else {
      resolved = { title: reason || 'Operation failed' };
    }
    const payload = /** @type {ToastOptions} */ ({
      id: options.id,
      title: resolved.title || reason || 'Operation failed',
      description: resolved.description,
      tone: resolved.tone || 'danger',
      loading: false,
      duration: resolved.duration ?? options.duration,
      action: resolved.action,
      closable: resolved.closable,
    });
    return options.id && items.some((t) => t.id === options.id)
      ? updateToast(options.id, payload)
      : pushToast(payload);
  };

  if (!result || result.ok !== true) {
    const reason = extractErrorMessage(result) || 'Operation failed';
    return showFailure(reason);
  }

  if (typeof options.verify === 'function') {
    try {
      const check = evaluateVerification(options.verify(result.data, result));
      if (!check.ok) return showFailure(check.message);
    } catch (err) {
      return showFailure(extractErrorMessage(err) || 'Verification failed');
    }
  }

  /** @type {Partial<ToastOptions>} */
  let sOpts;
  if (typeof options.success === 'function') {
    sOpts = normalizePatch(options.success(result.data, result));
  } else if (typeof options.success === 'string') {
    sOpts = { title: options.success };
  } else if (options.success) {
    sOpts = { ...options.success };
  } else {
    sOpts = { title: result.message || 'Completed' };
  }

  const payload = /** @type {ToastOptions} */ ({
    id: options.id,
    title: sOpts.title || 'Completed',
    description: sOpts.description,
    tone: sOpts.tone || 'success',
    loading: false,
    duration: sOpts.duration ?? options.duration,
    action: sOpts.action,
    closable: sOpts.closable,
  });

  return options.id && items.some((t) => t.id === options.id)
    ? updateToast(options.id, payload)
    : pushToast(payload);
}

/**
 * Subscribe to toast list updates. Immediately invokes `listener` with current items.
 * @param {(list: ToastItem[]) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeToasts(listener) {
  listeners.add(listener);
  listener(items.slice());
  return () => {
    listeners.delete(listener);
  };
}

/** @returns {ToastItem[]} */
export function getToasts() {
  return items.slice();
}

/**
 * Mark that a framework `<JToaster>` / `<Toaster>` is mounted so the fallback
 * vanilla DOM host steps aside cleanly.
 * @returns {() => void} unregister
 */
export function registerToastHost() {
  managedHosts += 1;
  teardownVanillaToaster();
  return () => {
    managedHosts = Math.max(0, managedHosts - 1);
  };
}

/**
 * Imperative toast helper shared across HTML, Vue, and React.
 */
export const toast = Object.assign(
  /** @param {string | ToastOptions} input @param {Partial<ToastOptions>} [extra] */
  (input, extra) => pushToast(input, extra),
  {
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    success: (input, extra) => pushToast(input, { ...extra, tone: 'success', loading: false }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    error: (input, extra) => pushToast(input, { ...extra, tone: 'danger', loading: false }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    danger: (input, extra) => pushToast(input, { ...extra, tone: 'danger', loading: false }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    warning: (input, extra) => pushToast(input, { ...extra, tone: 'warning', loading: false }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    info: (input, extra) => pushToast(input, { ...extra, tone: 'info', loading: false }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    accent: (input, extra) => pushToast(input, { ...extra, tone: 'accent', loading: false }),
    /** @param {string | Omit<ToastOptions, 'loading'>} input @param {Partial<ToastOptions>} [extra] */
    loading: (input, extra) =>
      pushToast(input, {
        ...extra,
        tone: extra?.tone || 'loading',
        loading: true,
        duration: extra?.duration ?? 0,
      }),
    update: updateToast,
    promise: promiseToast,
    fromResult: toastFromResult,
    dismiss: dismissToast,
    pause: pauseToasts,
    resume: resumeToasts,
    subscribe: subscribeToasts,
    getToasts,
  },
);

/**
 * Keep `.j-toaster` promoted in the browser top layer — even above newly opened
 * modal `<dialog>` elements — while active toasts exist.
 * @param {HTMLElement} toaster
 * @param {boolean} hasToasts
 * @param {boolean} [repromote]
 */
export function promoteToaster(toaster, hasToasts, repromote = false) {
  if (!toaster.hasAttribute('popover')) toaster.setAttribute('popover', 'manual');
  const isOpen = toaster.matches(':popover-open');
  if (!hasToasts) {
    if (isOpen) {
      try {
        toaster.hidePopover();
      } catch {
        /* ignore */
      }
    }
    return;
  }
  if (!isOpen) {
    try {
      toaster.showPopover();
    } catch {
      /* ignore */
    }
  } else if (repromote && typeof document !== 'undefined' && document.querySelector('dialog[open]')) {
    try {
      toaster.hidePopover();
      toaster.showPopover();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Measure `.j-toast__inner` natural heights and assign `--_index`, `--_offset-y`,
 * `--_front-h`, and `--_stack-h` so the stacked deck fans out smoothly with 0% bounce.
 * @param {HTMLElement} toaster
 * @param {number} [maxVisible]
 */
export function syncToasterLayout(toaster, maxVisible = DEFAULT_MAX_VISIBLE) {
  const cards = /** @type {HTMLElement[]} */ (
    [...toaster.querySelectorAll('.j-toast')].filter((el) => el.getAttribute('data-state') !== 'closing')
  );
  if (!cards.length) return;

  const gap = parseFloat(getComputedStyle(toaster).getPropertyValue('--_gap')) || 8;
  let offset = 0;
  let frontH = 0;
  let stackH = 0;

  cards.forEach((card, idx) => {
    const inner = /** @type {HTMLElement | null} */ (card.querySelector('.j-toast__inner'));
    const naturalH = (inner ? inner.offsetHeight : card.offsetHeight) + 2;
    if (idx === 0) frontH = naturalH;

    card.style.setProperty('--_index', String(Math.min(idx, maxVisible - 1)));
    card.style.setProperty('--_offset-y', `${Math.round(offset)}px`);
    card.toggleAttribute('data-behind', idx > 0 && idx < maxVisible);
    card.toggleAttribute('data-hidden', idx >= maxVisible);

    if (idx < maxVisible) {
      stackH = offset + naturalH;
      offset += naturalH + gap;
    }
  });

  toaster.style.setProperty('--_front-h', `${Math.round(frontH)}px`);
  toaster.style.setProperty('--_stack-h', `${Math.round(stackH)}px`);
}

/**
 * Wire hover/focus pause-resume and resize layout sync onto a `.j-toaster` element.
 * @param {HTMLElement} toaster
 * @param {{ max?: number }} [options]
 * @returns {() => void}
 */
export function bindToasterInteractions(toaster, options = {}) {
  const max = options.max ?? DEFAULT_MAX_VISIBLE;
  const onEnter = () => pauseToasts();
  const onLeave = () => {
    if (!toaster.matches(':focus-within')) resumeToasts();
  };
  const onFocusIn = () => pauseToasts();
  const onFocusOut = (/** @type {FocusEvent} */ e) => {
    if (!toaster.contains(/** @type {Node | null} */ (e.relatedTarget)) && !toaster.matches(':hover')) {
      resumeToasts();
    }
  };
  const onResize = () => syncToasterLayout(toaster, max);

  toaster.addEventListener('pointerenter', onEnter);
  toaster.addEventListener('pointerleave', onLeave);
  toaster.addEventListener('focusin', onFocusIn);
  toaster.addEventListener('focusout', onFocusOut);
  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    toaster.removeEventListener('pointerenter', onEnter);
    toaster.removeEventListener('pointerleave', onLeave);
    toaster.removeEventListener('focusin', onFocusIn);
    toaster.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('resize', onResize);
  };
}

const TONE_ICONS = {
  success:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision" aria-hidden="true"><circle cx="12" cy="12" r="9.25"/><path d="m8.25 12.25 2.5 2.5 5-5.5"/></svg>',
  danger:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision" aria-hidden="true"><circle cx="12" cy="12" r="9.25"/><path d="M12 7.75v4.75M12 15.75h.01"/></svg>',
  warning:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision" aria-hidden="true"><path d="M10.44 4.2a1.8 1.8 0 0 1 3.12 0l7.2 12.47A1.8 1.8 0 0 1 19.2 19.37H4.8a1.8 1.8 0 0 1-1.56-2.7Z"/><path d="M12 9.25v4.25M12 16.5h.01"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision" aria-hidden="true"><circle cx="12" cy="12" r="9.25"/><path d="M12 11v5M12 8h.01"/></svg>',
};

/** @type {null | (() => void)} */
let vanillaCleanup = null;

function teardownVanillaToaster() {
  vanillaCleanup?.();
  vanillaCleanup = null;
}

/**
 * Mount a pure-DOM `.j-toaster` host when no framework host is active.
 * @param {HTMLElement} [existing]
 */
function ensureVanillaToaster(existing) {
  if (vanillaCleanup) return;
  const host =
    existing ||
    /** @type {HTMLElement | null} */ (document.querySelector('.j-toaster')) ||
    Object.assign(document.createElement('div'), { className: 'j-toaster' });

  const created = !host.isConnected;
  if (!host.hasAttribute('popover')) host.setAttribute('popover', 'manual');
  if (!host.getAttribute('role')) host.setAttribute('role', 'region');
  if (!host.getAttribute('aria-label')) host.setAttribute('aria-label', 'Notifications');
  if (created) document.body.appendChild(host);

  /** @type {Map<string, HTMLElement>} */
  const nodes = new Map();
  let prevTopId = '';
  const stopInteract = bindToasterInteractions(host);

  const unsub = subscribeToasts((list) => {
    const ids = new Set(list.map((t) => t.id));
    nodes.forEach((el, id) => {
      if (!ids.has(id)) {
        el.remove();
        nodes.delete(id);
      }
    });

    const topId = list[0]?.id || '';
    const addedNew = Boolean(topId && topId !== prevTopId);
    prevTopId = topId;

    list.forEach((item, idx) => {
      let card = nodes.get(item.id);
      if (!card) {
        card = document.createElement('div');
        card.className = 'j-toast';
        nodes.set(item.id, card);
      }
      card.setAttribute('role', item.tone === 'danger' ? 'alert' : 'status');
      card.setAttribute('aria-live', item.tone === 'danger' ? 'assertive' : 'polite');
      card.dataset.tone = item.tone;
      card.dataset.state = item.state;
      card.toggleAttribute('data-loading', Boolean(item.loading));
      card.innerHTML = '';

      const inner = document.createElement('div');
      inner.className = 'j-toast__inner';

      const ind = document.createElement('span');
      ind.className = 'j-toast__indicator';
      if (item.loading || item.tone === 'loading') {
        ind.innerHTML = '<span class="j-toast__spinner" aria-hidden="true"></span>';
      } else {
        const svg = TONE_ICONS[/** @type {keyof typeof TONE_ICONS} */ (item.tone)];
        if (svg) ind.innerHTML = svg;
        else ind.innerHTML = '<span class="j-toast__dot" aria-hidden="true"></span>';
      }
      inner.appendChild(ind);

      const body = document.createElement('div');
      body.className = 'j-toast__body';
      const titleEl = document.createElement('p');
      titleEl.className = 'j-toast__title';
      titleEl.textContent = item.title;
      body.appendChild(titleEl);
      if (item.description) {
        const descEl = document.createElement('p');
        descEl.className = 'j-toast__description';
        descEl.textContent = item.description;
        body.appendChild(descEl);
      }
      inner.appendChild(body);

      if (item.action || item.closable) {
        const actions = document.createElement('div');
        actions.className = 'j-toast__actions';
        if (item.action) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'j-toast__action';
          btn.textContent = item.action.label;
          btn.addEventListener('click', () => {
            item.action?.onClick?.();
            dismissToast(item.id);
          });
          actions.appendChild(btn);
        }
        if (item.closable) {
          const closeBtn = document.createElement('button');
          closeBtn.type = 'button';
          closeBtn.className = 'j-toast__close';
          closeBtn.setAttribute('aria-label', 'Dismiss notification');
          closeBtn.innerHTML =
            '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
          closeBtn.addEventListener('click', () => dismissToast(item.id));
          actions.appendChild(closeBtn);
        }
        inner.appendChild(actions);
      }

      card.appendChild(inner);
      const refNode = host.children[idx] || null;
      if (card !== refNode) host.insertBefore(card, refNode);
    });

    promoteToaster(host, list.length > 0, addedNew);
    requestAnimationFrame(() => syncToasterLayout(host));
  });

  vanillaCleanup = () => {
    unsub();
    stopInteract();
    nodes.forEach((el) => el.remove());
    nodes.clear();
    if (created && host.isConnected) host.remove();
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const boundTriggers = new WeakMap();

/**
 * Init declarative `[data-j-toast]` trigger buttons inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initToasts(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('[data-j-toast]').forEach((el) => {
    const btn = /** @type {HTMLElement} */ (el);
    if (boundTriggers.has(btn)) return;
    const onClick = () => {
      const title = btn.dataset.jToast || 'Notification';
      const description = btn.dataset.jToastDescription;
      const tone = /** @type {ToastTone | undefined} */ (btn.dataset.jToastTone);
      const actionLabel = btn.dataset.jToastAction;
      toast({
        title,
        description,
        tone,
        action: actionLabel ? { label: actionLabel } : undefined,
      });
    };
    btn.addEventListener('click', onClick);
    const cleanup = () => btn.removeEventListener('click', onClick);
    boundTriggers.set(btn, cleanup);
    made.push(btn);
  });

  return () => {
    made.forEach((btn) => {
      boundTriggers.get(btn)?.();
      boundTriggers.delete(btn);
    });
  };
}
