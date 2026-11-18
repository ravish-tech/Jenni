// Jenni — Context Menu behavior.
// Opens a `.j-menu[data-context-menu]` `popover="auto"` panel on right-click
// (`contextmenu` event) or keyboard `ContextMenu` / `Shift+F10`, positioned at
// `(clientX, clientY)` clamped inside an 8px safe viewport margin.
// Reuses `.j-menu__item` roles and emits `j-select` so `JDropdownItem` /
// `DropdownItem` work seamlessly inside context menus.

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const VIEWPORT_PAD = 8;

/** @param {Element} el */
const isDisabled = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/** @type {null | (() => void)} */
let closeCurrent = null;

/**
 * @typedef {{ loop?: boolean, manageChecked?: boolean }} ContextMenuOptions
 */

/**
 * Connect a right-click target element to a `.j-menu` popover.
 * @param {HTMLElement} target
 * @param {HTMLElement} menu
 * @param {ContextMenuOptions} [options]
 * @returns {() => void} cleanup
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
      try { menu.hidePopover(); } catch { /* ignore */ }
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
   * Open context menu at `(x, y)`.
   * @param {number} x
   * @param {number} y
   * @param {boolean} keyboard
   */
  const openAt = (x, y, keyboard) => {
    if (closeCurrent && closeCurrent !== close) closeCurrent();
    focusFirstOnOpen = keyboard;
    if (isOpen()) {
      placeAt(x, y);
      if (keyboard) focus(items()[0]);
      else menu.focus({ preventScroll: true });
      return;
    }
    menu.style.left = `${Math.round(x)}px`;
    menu.style.top = `${Math.round(y)}px`;
    try { menu.showPopover(); } catch { return; }
    closeCurrent = close;
    placeAt(x, y);
  };

  /** @param {MouseEvent} e */
  const onContextMenu = (e) => {
    if (menu.contains(/** @type {Node} */ (e.target))) return;
    e.preventDefault();
    const keyboard = e.clientX === 0 && e.clientY === 0;
    if (keyboard) {
      const r = target.getBoundingClientRect();
      openAt(r.left + Math.min(24, r.width / 2), r.top + Math.min(24, r.height / 2), true);
    } else {
      openAt(e.clientX, e.clientY, false);
    }
  };

  /** @param {KeyboardEvent} e */
  const onTargetKey = (e) => {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      const r = target.getBoundingClientRect();
      openAt(r.left + Math.min(24, r.width / 2), r.top + Math.min(24, r.height / 2), true);
    }
  };

  const onDocContext = (/** @type {MouseEvent} */ e) => {
    if (!isOpen()) return;
    const t = /** @type {Node | null} */ (e.target);
    if (t && !target.contains(t) && !menu.contains(t)) close();
  };

  const onWindowScrollOrResize = () => {
    if (isOpen()) close();
  };

  const onToggle = (/** @type {Event} */ e) => {
    const opened = /** @type {ToggleEvent} */ (e).newState === 'open';
    if (opened) {
      menu.querySelectorAll(ITEM).forEach((el) => {
        /** @type {HTMLElement} */ (el).tabIndex = -1;
      });
      if (focusFirstOnOpen) focus(items()[0]);
      else menu.focus({ preventScroll: true });
      document.addEventListener('contextmenu', onDocContext, true);
      window.addEventListener('scroll', onWindowScrollOrResize, { capture: true, passive: true });
      window.addEventListener('resize', onWindowScrollOrResize, { passive: true });
    } else {
      if (closeCurrent === close) closeCurrent = null;
      document.removeEventListener('contextmenu', onDocContext, true);
      window.removeEventListener('scroll', onWindowScrollOrResize, { capture: true });
      window.removeEventListener('resize', onWindowScrollOrResize);
    }
    focusFirstOnOpen = false;
    typed = '';
  };

  /** @param {string} char */
  const typeahead = (char) => {
    clearTimeout(typedTimer);
    typed += char.toLowerCase();
    typedTimer = setTimeout(() => { typed = ''; }, 500);
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
    const keepOpen = role !== 'menuitem' ? !item.hasAttribute('data-close') : item.hasAttribute('data-keep-open');
    if (!evt.defaultPrevented && !keepOpen) close();
  };

  /** @param {PointerEvent} e */
  const onPointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest(ITEM));
    if (item && !isDisabled(item) && document.activeElement !== item) item.focus({ preventScroll: true });
    else if (!item && menu.contains(document.activeElement) && document.activeElement !== menu) {
      menu.focus({ preventScroll: true });
    }
  };

  const onPointerLeave = () => {
    if (menu.contains(document.activeElement)) menu.focus({ preventScroll: true });
  };

  target.addEventListener('contextmenu', onContextMenu);
  target.addEventListener('keydown', onTargetKey);
  menu.addEventListener('toggle', onToggle);
  menu.addEventListener('keydown', onMenuKey);
  menu.addEventListener('click', onMenuClick);
  menu.addEventListener('pointermove', onPointerMove);
  menu.addEventListener('pointerleave', onPointerLeave);

  return () => {
    clearTimeout(typedTimer);
    close();
    document.removeEventListener('contextmenu', onDocContext, true);
    window.removeEventListener('scroll', onWindowScrollOrResize, { capture: true });
    window.removeEventListener('resize', onWindowScrollOrResize);
    target.removeEventListener('contextmenu', onContextMenu);
    target.removeEventListener('keydown', onTargetKey);
    menu.removeEventListener('toggle', onToggle);
    menu.removeEventListener('keydown', onMenuKey);
    menu.removeEventListener('click', onMenuClick);
    menu.removeEventListener('pointermove', onPointerMove);
    menu.removeEventListener('pointerleave', onPointerLeave);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
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
