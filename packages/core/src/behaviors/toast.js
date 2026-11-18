// Jenni — Toast & Toaster behavior.
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
 * @typedef {'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'} ToastTone
 * @typedef {'bottom-end' | 'bottom-center' | 'top-end' | 'top-center'} ToasterPosition
 * @typedef {{ label: string, onClick?: () => void }} ToastAction
 * @typedef {{
 *   id?: string,
 *   title: string,
 *   description?: string,
 *   tone?: ToastTone,
 *   duration?: number,
 *   action?: ToastAction,
 *   closable?: boolean,
 * }} ToastOptions
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description?: string,
 *   tone: ToastTone,
 *   duration: number,
 *   action?: ToastAction,
 *   closable: boolean,
 *   state: 'open' | 'closing',
 *   createdAt: number,
 * }} ToastItem
 */

/** @type {ToastItem[]} newest first (index 0 = front of deck) */
let items = [];

/** @type {Map<string, { timer?: ReturnType<typeof setTimeout>, remaining: number, startedAt: number }>} */
const timers = new Map();

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
  if (!Number.isFinite(ms) || ms <= 0 || item.state === 'closing') return;
  const entry = timers.get(item.id) || { remaining: ms, startedAt: Date.now() };
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
    if (entry && item.state === 'open') armTimer(item, entry.remaining);
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
    if (t.state !== 'closing') {
      t.state = 'closing';
      changed = true;
      setTimeout(() => {
        const before = items.length;
        items = items.filter((x) => x.id !== t.id);
        if (items.length !== before) emit();
      }, EXIT_DURATION);
    }
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
 * Push (or update) a toast notification.
 * @param {string | ToastOptions} input
 * @param {Partial<ToastOptions>} [extra]
 * @returns {string} toast id
 */
function pushToast(input, extra) {
  const opts = normalizeOptions(input, extra);
  const id = opts.id || `j-toast-${++uid}`;
  const duration = opts.duration ?? DEFAULT_DURATION;
  const next = /** @type {ToastItem} */ ({
    id,
    title: opts.title,
    description: opts.description,
    tone: opts.tone || 'neutral',
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
    success: (input, extra) => pushToast(input, { ...extra, tone: 'success' }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    error: (input, extra) => pushToast(input, { ...extra, tone: 'danger' }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    danger: (input, extra) => pushToast(input, { ...extra, tone: 'danger' }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    warning: (input, extra) => pushToast(input, { ...extra, tone: 'warning' }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    info: (input, extra) => pushToast(input, { ...extra, tone: 'info' }),
    /** @param {string | Omit<ToastOptions, 'tone'>} input @param {Partial<ToastOptions>} [extra] */
    accent: (input, extra) => pushToast(input, { ...extra, tone: 'accent' }),
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
      try { toaster.hidePopover(); } catch { /* ignore */ }
    }
    return;
  }
  if (!isOpen) {
    try { toaster.showPopover(); } catch { /* ignore */ }
  } else if (repromote && typeof document !== 'undefined' && document.querySelector('dialog[open]')) {
    try {
      toaster.hidePopover();
      toaster.showPopover();
    } catch { /* ignore */ }
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
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="m5.5 8.2 1.7 1.7 3.4-3.7"/></svg>',
  danger:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5.2v3.3M8 10.8h.01"/></svg>',
  warning:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.4 14.2 13a.8.8 0 0 1-.7 1.2H2.5a.8.8 0 0 1-.7-1.2L8 2.4Z"/><path d="M8 6.5v3M8 11.6h.01"/></svg>',
  info:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 7.4v3.4M8 5.2h.01"/></svg>',
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
        card.setAttribute('role', item.tone === 'danger' ? 'alert' : 'status');
        card.setAttribute('aria-live', item.tone === 'danger' ? 'assertive' : 'polite');
        nodes.set(item.id, card);
      }
      card.dataset.tone = item.tone;
      card.dataset.state = item.state;
      card.innerHTML = '';

      const inner = document.createElement('div');
      inner.className = 'j-toast__inner';

      const ind = document.createElement('span');
      ind.className = 'j-toast__indicator';
      const svg = TONE_ICONS[/** @type {keyof typeof TONE_ICONS} */ (item.tone)];
      if (svg) ind.innerHTML = svg;
      else ind.innerHTML = '<span class="j-toast__dot" aria-hidden="true"></span>';
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
