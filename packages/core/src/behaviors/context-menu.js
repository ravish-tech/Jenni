// Context menu behavior.
// Opens a `.j-menu[data-context-menu]` `popover="auto"` panel on right-click
// (`contextmenu` event), keyboard `ContextMenu` / `Shift+F10`, or imperative
// `openAt` / `openFor` / `openFromEvent`, clamped inside an 8px safe viewport margin.

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const VIEWPORT_PAD = 8;

/** @param {Element} el */
const isDisabled = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/** @type {null | (() => void)} */
let closeCurrent = null;

/**
 * @typedef {{ loop?: boolean, manageChecked?: boolean }} ContextMenuOptions
 * @typedef {{
 *   keyboard?: boolean,
 *   anchor?: HTMLElement | null,
 *   returnFocusTo?: HTMLElement | null,
 * }} ContextMenuOpenAtOptions
 * @typedef {{
 *   keyboard?: boolean,
 *   align?: 'point' | 'bottom-start',
 *   returnFocusTo?: HTMLElement | null,
 * }} ContextMenuOpenForOptions
 * @typedef {{
 *   openAt: (x: number, y: number, opts?: ContextMenuOpenAtOptions | boolean) => void,
 *   openFor: (anchorEl: HTMLElement, opts?: ContextMenuOpenForOptions) => void,
 *   openFromEvent: (e: MouseEvent | KeyboardEvent | { nativeEvent?: Event, preventDefault: () => void, currentTarget?: EventTarget | null, target?: EventTarget | null, clientX?: number, clientY?: number }) => void,
 *   close: () => void,
 *   isOpen: () => boolean,
 *   destroy: () => void,
 * }} ContextMenuMethods
 * @typedef {(() => void) & ContextMenuMethods} ContextMenuController
 */

/**
 * Connect an optional right-click target element (or `null` for headless imperative menus)
 * to a `.j-menu` popover.
 * @param {HTMLElement | null | undefined} target
 * @param {HTMLElement} menu
 * @param {ContextMenuOptions} [options]
 * @returns {ContextMenuController}
 */
export function createContextMenu(target, menu, options = {}) {
  const loop = options.loop ?? true;
  const manageChecked = options.manageChecked ?? true;

  if (!menu.hasAttribute('popover')) menu.setAttribute('popover', 'auto');
  if (!menu.getAttribute('role')) menu.setAttribute('role', 'menu');
  menu.setAttribute('data-context-menu', '');
  menu.tabIndex = -1;

  let typed = '';
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let typedTimer;
  /** @type {boolean} */
  let focusFirstOnOpen = false;
  /** @type {HTMLElement | null} */
  let activeAnchor = target ?? null;
  /** @type {HTMLElement | null} */
  let returnFocusEl = null;

  const items = () =>
    /** @type {HTMLElement[]} */ (
      [...menu.querySelectorAll(ITEM)].filter(
        (el) => !isDisabled(el) && /** @type {HTMLElement} */ (el).offsetParent !== null,
      )
    );

  /** @param {HTMLElement | undefined} el */
  const focus = (el) => el?.focus({ preventScroll: false });
  const isOpen = () => menu.matches(':popover-open');

  const close = () => {
    if (isOpen()) {
      try {
        menu.hidePopover();
      } catch {
        /* ignore */
      }
    }
    if (closeCurrent === close) closeCurrent = null;
  };

  /**
   * Place `menu` at `(clientX, clientY)` clamped to viewport with 8px margin.
   * @param {number} clientX
   * @param {number} clientY
   */
  const placeAt = (clientX, clientY) => {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const w = menu.offsetWidth || 200;
    const h = menu.offsetHeight || 160;

    let x = clientX;
    let y = clientY;
    let flipX = false;
    let flipY = false;

    if (x + w > vw - VIEWPORT_PAD) {
      if (x - w >= VIEWPORT_PAD) {
        x -= w;
        flipX = true;
      } else {
        x = Math.max(VIEWPORT_PAD, vw - w - VIEWPORT_PAD);
      }
    } else {
      x = Math.max(VIEWPORT_PAD, x);
    }

    if (y + h > vh - VIEWPORT_PAD) {
      if (y - h >= VIEWPORT_PAD) {
        y -= h;
        flipY = true;
      } else {
        y = Math.max(VIEWPORT_PAD, vh - h - VIEWPORT_PAD);
      }
    } else {
      y = Math.max(VIEWPORT_PAD, y);
    }

    menu.dataset.origin = `${flipY ? 'bottom' : 'top'}-${flipX ? 'right' : 'left'}`;
    menu.style.left = `${Math.round(x)}px`;
    menu.style.top = `${Math.round(y)}px`;
  };

  /**
   * Open context menu at `(x, y)` clamped inside the viewport.
   * @param {number} x
   * @param {number} y
   * @param {ContextMenuOpenAtOptions | boolean} [opts]
   */
  const openAt = (x, y, opts) => {
    const normalized = typeof opts === 'boolean' ? { keyboard: opts } : opts || {};
    const keyboard = Boolean(normalized.keyboard);
    const wasOpen = isOpen();

    if (!wasOpen) {
      const currentActive =
        typeof document !== 'undefined' &&
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
          ? document.activeElement
          : null;
      returnFocusEl =
        normalized.returnFocusTo !== undefined ? normalized.returnFocusTo : currentActive;
    } else if (normalized.returnFocusTo !== undefined) {
      returnFocusEl = normalized.returnFocusTo;
    }

    activeAnchor = normalized.anchor !== undefined ? normalized.anchor : target ?? null;

    if (closeCurrent && closeCurrent !== close) closeCurrent();
    focusFirstOnOpen = keyboard;

    if (wasOpen) {
      placeAt(x, y);
      if (keyboard) focus(items()[0]);
      else menu.focus({ preventScroll: true });
      return;
    }

    menu.style.left = `${Math.round(x)}px`;
    menu.style.top = `${Math.round(y)}px`;
    try {
      menu.showPopover();
    } catch {
      return;
    }
    closeCurrent = close;
    placeAt(x, y);
    menu.querySelectorAll(ITEM).forEach((el) => {
      /** @type {HTMLElement} */ (el).tabIndex = -1;
    });
    if (keyboard) focus(items()[0]);
    else menu.focus({ preventScroll: true });
  };

  /**
   * Open context menu anchored to `anchorEl`.
   * @param {HTMLElement} anchorEl
   * @param {ContextMenuOpenForOptions} [opts]
   */
  const openFor = (anchorEl, opts = {}) => {
    if (!anchorEl) return;
    const align = opts.align ?? 'bottom-start';
    const keyboard = opts.keyboard ?? true;
    const currentActive =
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : anchorEl;
    const returnFocusTo = opts.returnFocusTo !== undefined ? opts.returnFocusTo : currentActive;

    const r = anchorEl.getBoundingClientRect();
    const x = align === 'point' ? r.left + Math.min(24, r.width / 2) : r.left;
    const y = align === 'point' ? r.top + Math.min(24, r.height / 2) : r.bottom + 4;

    openAt(x, y, {
      keyboard,
      anchor: anchorEl,
      returnFocusTo,
    });
  };

  /**
   * Open context menu directly from a pointer `contextmenu` / `click` or keyboard event.
   * @param {MouseEvent | KeyboardEvent | { nativeEvent?: Event, preventDefault: () => void, currentTarget?: EventTarget | null, target?: EventTarget | null, clientX?: number, clientY?: number }} e
   */
  const openFromEvent = (e) => {
    e.preventDefault();
    const raw = 'nativeEvent' in e && e.nativeEvent ? e.nativeEvent : e;
    const el =
      (e.currentTarget instanceof HTMLElement ? e.currentTarget : null) ||
      (raw.currentTarget instanceof HTMLElement ? raw.currentTarget : null) ||
      (e.target instanceof HTMLElement ? e.target : null) ||
      (raw.target instanceof HTMLElement ? raw.target : null) ||
      target ||
      null;

    const cxVal = 'clientX' in e && typeof e.clientX === 'number' ? e.clientX : undefined;
    const cyVal = 'clientY' in e && typeof e.clientY === 'number' ? e.clientY : undefined;

    const isKeyboard =
      (typeof KeyboardEvent !== 'undefined' && raw instanceof KeyboardEvent) ||
      cxVal === undefined ||
      cyVal === undefined ||
      (cxVal === 0 && cyVal === 0);

    if (isKeyboard) {
      if (el) {
        openFor(el, { keyboard: true });
      } else {
        openAt(VIEWPORT_PAD, VIEWPORT_PAD, { keyboard: true });
      }
    } else {
      openAt(cxVal, cyVal, {
        keyboard: false,
        anchor: el,
      });
    }
  };

  /** @param {MouseEvent} e */
  const onContextMenu = (e) => {
    if (menu.contains(/** @type {Node} */ (e.target))) return;
    e.preventDefault();
    const eventAnchor =
      (e.target instanceof HTMLElement ? e.target : null) || target || null;
    const keyboard = e.clientX === 0 && e.clientY === 0;
    if (keyboard && eventAnchor) {
      openFor(eventAnchor, { keyboard: true, align: 'point' });
    } else {
      openAt(e.clientX, e.clientY, { keyboard: false, anchor: eventAnchor });
    }
  };

  /** @param {KeyboardEvent} e */
  const onTargetKey = (e) => {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      const eventAnchor =
        (e.target instanceof HTMLElement ? e.target : null) || target || null;
      if (eventAnchor) {
        openFor(eventAnchor, { keyboard: true, align: 'point' });
      }
    }
  };

  const onDocContext = (/** @type {MouseEvent} */ e) => {
    if (!isOpen()) return;
    const t = /** @type {Node | null} */ (e.target);
    if (t && !(target && target.contains(t)) && !menu.contains(t)) close();
  };

  /** @param {Event} e */
  const onWindowScroll = (e) => {
    if (!isOpen()) return;
    const t = e.target;
    if (t instanceof Node && menu.contains(t)) return;
    const shouldClose =
      t === document ||
      t === document.documentElement ||
      t === document.body ||
      Boolean(activeAnchor && t instanceof Node && t.contains(activeAnchor));
    if (shouldClose) close();
  };

  const onWindowResize = () => {
    if (isOpen()) close();
  };

  const onToggle = (/** @type {Event} */ e) => {
    const opened = /** @type {ToggleEvent} */ (e).newState === 'open';
    if (opened) {
      menu.querySelectorAll(ITEM).forEach((el) => {
        /** @type {HTMLElement} */ (el).tabIndex = -1;
      });
      if (focusFirstOnOpen) focus(items()[0]);
      else if (!menu.contains(document.activeElement)) menu.focus({ preventScroll: true });
      document.addEventListener('contextmenu', onDocContext, true);
      window.addEventListener('scroll', onWindowScroll, { capture: true, passive: true });
      window.addEventListener('resize', onWindowResize, { passive: true });
    } else {
      if (closeCurrent === close) closeCurrent = null;
      document.removeEventListener('contextmenu', onDocContext, true);
      window.removeEventListener('scroll', onWindowScroll, { capture: true });
      window.removeEventListener('resize', onWindowResize);
    }
    focusFirstOnOpen = false;
    typed = '';
  };

  /** @param {string} char */
  const typeahead = (char) => {
    clearTimeout(typedTimer);
    typed += char.toLowerCase();
    typedTimer = setTimeout(() => {
      typed = '';
    }, 500);
    const list = items();
    const current = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    const query = typed.split('').every((c) => c === typed[0]) ? typed[0] : typed;
    const ordered = [...list.slice(current + 1), ...list.slice(0, current + 1)];
    const match = ordered.find((el) =>
      (el.dataset.textValue ?? el.textContent ?? '').trim().toLowerCase().startsWith(query),
    );
    focus(match);
  };

  /** @param {KeyboardEvent} e */
  const onMenuKey = (e) => {
    const list = items();
    const i = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    const last = list.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focus(list[i < 0 ? 0 : i === last ? (loop ? 0 : last) : i + 1]);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focus(list[i < 0 ? last : i === 0 ? (loop ? last : 0) : i - 1]);
        break;
      case 'Home':
      case 'PageUp':
        e.preventDefault();
        focus(list[0]);
        break;
      case 'End':
      case 'PageDown':
        e.preventDefault();
        focus(list[last]);
        break;
      case 'Escape': {
        e.preventDefault();
        e.stopPropagation();
        const restoreEl = returnFocusEl;
        close();
        restoreEl?.focus?.({ preventScroll: true });
        break;
      }
      case 'Tab':
        e.preventDefault();
        close();
        break;
      case 'Enter':
      case ' ': {
        const el = /** @type {HTMLElement} */ (document.activeElement);
        if (i >= 0 && el.tagName !== 'BUTTON' && !(e.key === 'Enter' && el.tagName === 'A')) {
          e.preventDefault();
          el.click();
        } else if (i < 0) {
          e.preventDefault();
        }
        break;
      }
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
          typeahead(e.key);
        }
    }
  };

  /** @param {MouseEvent} e */
  const onMenuClick = (e) => {
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest(ITEM));
    if (!item || !menu.contains(item)) return;
    if (isDisabled(item)) {
      e.preventDefault();
      return;
    }
    const role = item.getAttribute('role');
    if (manageChecked && role === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
    } else if (manageChecked && role === 'menuitemradio') {
      const group = item.closest('[role="group"]') || menu;
      group
        .querySelectorAll('[role="menuitemradio"]')
        .forEach((r) => r.setAttribute('aria-checked', String(r === item)));
    }
    const evt = new CustomEvent('j-select', { bubbles: true, cancelable: true, detail: { item } });
    item.dispatchEvent(evt);
    const keepOpen =
      role !== 'menuitem' ? !item.hasAttribute('data-close') : item.hasAttribute('data-keep-open');
    if (!evt.defaultPrevented && !keepOpen) close();
  };

  /** @param {PointerEvent} e */
  const onPointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest(ITEM));
    if (item && !isDisabled(item) && document.activeElement !== item) {
      item.focus({ preventScroll: true });
    } else if (!item && menu.contains(document.activeElement) && document.activeElement !== menu) {
      menu.focus({ preventScroll: true });
    }
  };

  const onPointerLeave = () => {
    if (menu.contains(document.activeElement)) menu.focus({ preventScroll: true });
  };

  if (target) {
    target.addEventListener('contextmenu', onContextMenu);
    target.addEventListener('keydown', onTargetKey);
  }
  menu.addEventListener('toggle', onToggle);
  menu.addEventListener('keydown', onMenuKey);
  menu.addEventListener('click', onMenuClick);
  menu.addEventListener('pointermove', onPointerMove);
  menu.addEventListener('pointerleave', onPointerLeave);

  const destroy = () => {
    clearTimeout(typedTimer);
    close();
    document.removeEventListener('contextmenu', onDocContext, true);
    window.removeEventListener('scroll', onWindowScroll, { capture: true });
    window.removeEventListener('resize', onWindowResize);
    if (target) {
      target.removeEventListener('contextmenu', onContextMenu);
      target.removeEventListener('keydown', onTargetKey);
    }
    menu.removeEventListener('toggle', onToggle);
    menu.removeEventListener('keydown', onMenuKey);
    menu.removeEventListener('click', onMenuClick);
    menu.removeEventListener('pointermove', onPointerMove);
    menu.removeEventListener('pointerleave', onPointerLeave);
  };

  return Object.assign(() => destroy(), {
    openAt,
    openFor,
    openFromEvent,
    close,
    isOpen,
    destroy,
  });
}

/** @type {WeakMap<HTMLElement, ContextMenuController>} */
const bound = new WeakMap();

/**
 * Init every `[data-j-context-menu]` region inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initContextMenus(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  const doc = root instanceof Document ? root : root.ownerDocument || document;
  root.querySelectorAll('[data-j-context-menu]').forEach((el) => {
    const target = /** @type {HTMLElement} */ (el);
    if (bound.has(target)) return;
    const menu = doc.getElementById(target.dataset.jContextMenu || '');
    if (!menu || !menu.classList.contains('j-menu')) return;
    bound.set(target, createContextMenu(target, menu));
    made.push(target);
  });
  return () => {
    made.forEach((t) => {
      bound.get(t)?.();
      bound.delete(t);
    });
  };
}
