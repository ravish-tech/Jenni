// Dropdown menu & cascading submenu behavior (WAI-ARIA menu button pattern).
// Markup:
//   <button popovertarget="menu-1">Options</button>
//   <div class="j-menu" id="menu-1" popover role="menu" data-align="start">
//     <div class="j-menu__label">Account</div>
//     <button class="j-menu__item" role="menuitem">Profile <kbd class="j-menu__shortcut">⌘P</kbd></button>
//     <div class="j-menu__sub">
//       <button type="button" role="menuitem" aria-haspopup="menu" aria-expanded="false" class="j-menu__item j-menu__sub-trigger">
//         Share <svg class="j-menu__sub-chevron">…</svg>
//       </button>
//       <div class="j-menu j-menu__sub-content" role="menu" popover="manual">…</div>
//     </div>
//     <hr class="j-menu__separator">
//     <button class="j-menu__item" role="menuitemcheckbox" aria-checked="true">…</button>
//     <button class="j-menu__item" role="menuitem" data-tone="danger">Delete</button>
//   </div>
// Native popover gives open/close, Escape and light-dismiss. This adds
// arrow keys, Home/End, typeahead, Tab-to-close, pointer highlight,
// cascading submenus, checkbox/radio toggling and a `j-select` event on activation.

import { anchorPopover, linkAnchor, trackAnchor } from './anchor.js';

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const SUB_OPEN_DELAY = 90;
const SUB_CLOSE_DELAY = 160;
let subUid = 0;

/** @param {Element} el */
const isDisabled = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/**
 * Return direct enabled menu items belonging to `menuEl`, excluding items inside
 * nested `.j-menu__sub-content` submenus.
 * @param {HTMLElement} menuEl
 * @returns {HTMLElement[]}
 */
export function getDirectItems(menuEl) {
  return /** @type {HTMLElement[]} */ (
    [...menuEl.querySelectorAll(ITEM)].filter(
      (el) =>
        (!el.closest('.j-menu__sub-content') || el.closest('.j-menu, [role="menu"]') === menuEl) &&
        el.closest('.j-menu, [role="menu"]') === menuEl &&
        !isDisabled(el) &&
        /** @type {HTMLElement} */ (el).offsetParent !== null,
    )
  );
}

/**
 * @typedef {{
 *   side?: string,
 *   align?: string,
 *   offset?: number,
 *   loop?: boolean,
 *   manageChecked?: boolean,
 *   openDelay?: number,
 *   closeDelay?: number,
 * }} SubmenuOptions
 */

/**
 * @typedef {{
 *   side?: string,
 *   loop?: boolean,
 *   manageChecked?: boolean,
 *   anchor?: HTMLElement | null,
 * }} MenuOptions
 */

/** @type {WeakMap<HTMLElement, () => void>} */
const boundSubmenus = new WeakMap();

/**
 * Check whether a `.j-menu__sub-content` element is already wired via `createSubmenu`.
 * @param {HTMLElement} subMenu
 * @returns {boolean}
 */
export function isSubmenuBound(subMenu) {
  return boundSubmenus.has(subMenu);
}

/**
 * Wire a WAI-ARIA cascading submenu so it works identically inside both
 * `DropdownMenu` (`popover="auto"`) and `ContextMenu` (at any nesting depth).
 * Accepts either `(subContainerEl, options)` or `(triggerEl, subMenuEl, options)`.
 * @param {HTMLElement} triggerOrSub
 * @param {HTMLElement | SubmenuOptions} [subMenuOrOptions]
 * @param {SubmenuOptions} [maybeOptions]
 * @returns {() => void} cleanup
 */
export function createSubmenu(triggerOrSub, subMenuOrOptions, maybeOptions) {
  /** @type {HTMLElement | null} */
  let trigger = null;
  /** @type {HTMLElement | null} */
  let subMenu = null;
  /** @type {HTMLElement | null} */
  let subRoot = null;
  /** @type {SubmenuOptions} */
  let options = {};

  if (subMenuOrOptions instanceof HTMLElement) {
    trigger = triggerOrSub;
    subMenu = subMenuOrOptions;
    subRoot = trigger.closest('.j-menu__sub') || trigger.parentElement;
    options = maybeOptions || {};
  } else {
    subRoot = triggerOrSub;
    trigger = /** @type {HTMLElement | null} */ (
      subRoot.querySelector(':scope > .j-menu__sub-trigger, :scope > [role="menuitem"]')
    );
    subMenu = /** @type {HTMLElement | null} */ (
      subRoot.querySelector(':scope > .j-menu__sub-content, :scope > .j-menu')
    );
    options = subMenuOrOptions || {};
  }

  if (!trigger || !subMenu) return () => {};
  const existing = boundSubmenus.get(subMenu);
  if (existing) return existing;

  const loop = options.loop ?? true;
  const manageChecked = options.manageChecked ?? true;
  const side = options.side || 'right';
  const align = options.align || 'start';
  const offset = options.offset ?? 4;
  const openDelay = options.openDelay ?? SUB_OPEN_DELAY;
  const closeDelay = options.closeDelay ?? SUB_CLOSE_DELAY;

  if (!subMenu.id) subMenu.id = `j-sub-menu-${++subUid}`;
  subMenu.setAttribute('popover', 'manual');
  if (!subMenu.getAttribute('role')) subMenu.setAttribute('role', 'menu');
  if (!subMenu.dataset.side) subMenu.dataset.side = side;
  if (!subMenu.dataset.align) subMenu.dataset.align = align;
  subMenu.style.setProperty('--j-floating-offset', `${offset}px`);
  subMenu.tabIndex = -1;

  if (!trigger.getAttribute('role')) trigger.setAttribute('role', 'menuitem');
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', String(subMenu.matches(':popover-open')));
  trigger.setAttribute('aria-controls', subMenu.id);
  trigger.setAttribute('data-keep-open', '');

  linkAnchor(trigger, subMenu);

  /** @type {null | (() => void)} */
  let stopTrack = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let openTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let closeTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let typedTimer;
  let typed = '';

  const parentMenu = /** @type {HTMLElement | null} */ (
    (subRoot || trigger).parentElement?.closest('.j-menu, [role="menu"]') ?? null
  );

  /** @param {HTMLElement | undefined} el */
  const focus = (el) => el?.focus({ preventScroll: false });
  const isSubOpen = () => subMenu.matches(':popover-open');

  const clearTimers = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  };

  /**
   * @param {'first' | 'last' | null} [where]
   */
  const openSubmenu = (where = null) => {
    if (isDisabled(trigger)) return;
    clearTimers();

    if (parentMenu) {
      parentMenu.querySelectorAll('.j-menu__sub-content').forEach((el) => {
        const other = /** @type {HTMLElement} */ (el);
        if (other !== subMenu && !other.contains(subMenu) && other.matches(':popover-open')) {
          try {
            other.hidePopover();
          } catch {
            /* ignore */
          }
        }
      });
    }

    if (!isSubOpen()) {
      try {
        subMenu.showPopover();
      } catch {
        return;
      }
      stopTrack?.();
      stopTrack = trackAnchor(trigger, subMenu, { side });
      trigger.setAttribute('aria-expanded', 'true');
    }

    subMenu.querySelectorAll(ITEM).forEach((el) => {
      if (el.closest('.j-menu, [role="menu"]') === subMenu) {
        /** @type {HTMLElement} */ (el).tabIndex = -1;
      }
    });

    if (where === 'first') focus(getDirectItems(subMenu)[0]);
    else if (where === 'last') focus(getDirectItems(subMenu).at(-1));
  };

  /**
   * @param {boolean} [restoreFocus]
   */
  const closeSubmenu = (restoreFocus = false) => {
    clearTimers();
    subMenu.querySelectorAll('.j-menu__sub-content').forEach((el) => {
      const child = /** @type {HTMLElement} */ (el);
      if (child.matches(':popover-open')) {
        try {
          child.hidePopover();
        } catch {
          /* ignore */
        }
      }
    });
    if (isSubOpen()) {
      try {
        subMenu.hidePopover();
      } catch {
        /* ignore */
      }
    }
    stopTrack?.();
    stopTrack = null;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  };

  const onSubToggle = (/** @type {Event} */ e) => {
    if (e.target !== subMenu) return;
    const opened = /** @type {ToggleEvent} */ (e).newState === 'open';
    trigger.setAttribute('aria-expanded', String(opened));
    if (!opened) {
      stopTrack?.();
      stopTrack = null;
      subMenu.querySelectorAll('.j-menu__sub-content').forEach((el) => {
        const child = /** @type {HTMLElement} */ (el);
        if (child.matches(':popover-open')) {
          try {
            child.hidePopover();
          } catch {
            /* ignore */
          }
        }
      });
      typed = '';
    }
  };

  const onParentToggle = (/** @type {Event} */ e) => {
    if (e.target !== parentMenu) return;
    if (/** @type {ToggleEvent} */ (e).newState === 'closed') {
      closeSubmenu(false);
    }
  };

  /**
   * If a submenu was opened by hover while focus remained in `parentMenu`,
   * close it synchronously before `parentMenu`'s roving key handler runs.
   * @param {KeyboardEvent} e
   */
  const onParentCaptureKey = (e) => {
    if (!isSubOpen()) return;
    if (subMenu.contains(/** @type {Node | null} */ (document.activeElement))) return;
    if (
      e.target === trigger &&
      (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ')
    ) {
      return;
    }
    if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown' ||
      e.key === 'Escape' ||
      e.key === 'Tab' ||
      (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)
    ) {
      closeSubmenu(false);
    }
  };

  /** @param {KeyboardEvent} e */
  const onTriggerKey = (e) => {
    if (isDisabled(trigger)) return;
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      openSubmenu('first');
    } else if (
      isSubOpen() &&
      (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')
    ) {
      closeSubmenu(false);
    }
  };

  /** @param {MouseEvent} e */
  const onTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled(trigger)) return;
    openSubmenu(e.detail === 0 ? 'first' : null);
  };

  /** @param {PointerEvent} e */
  const onTriggerEnter = (e) => {
    if (e.pointerType === 'touch' || isDisabled(trigger)) return;
    clearTimers();
    if (!isSubOpen()) {
      openTimer = setTimeout(() => {
        openSubmenu(null);
      }, openDelay);
    }
  };

  /** @param {PointerEvent} e */
  const onTriggerLeave = (e) => {
    if (e.pointerType === 'touch') return;
    clearTimers();
    if (isSubOpen()) {
      closeTimer = setTimeout(() => {
        closeSubmenu(false);
      }, closeDelay);
    }
  };

  /** @param {PointerEvent} e */
  const onSubEnter = (e) => {
    if (e.pointerType === 'touch') return;
    clearTimers();
  };

  /** @param {PointerEvent} e */
  const onSubLeave = (e) => {
    if (e.pointerType === 'touch') return;
    const rel = /** @type {Node | null} */ (e.relatedTarget);
    if (rel && (trigger.contains(rel) || subMenu.contains(rel))) return;
    clearTimers();
    closeTimer = setTimeout(() => {
      closeSubmenu(false);
    }, closeDelay);
  };

  /** @param {string} char */
  const typeahead = (char) => {
    clearTimeout(typedTimer);
    typed += char.toLowerCase();
    typedTimer = setTimeout(() => {
      typed = '';
    }, 500);
    const list = getDirectItems(subMenu);
    const current = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    const query = typed.split('').every((c) => c === typed[0]) ? typed[0] : typed;
    const ordered = [...list.slice(current + 1), ...list.slice(0, current + 1)];
    const match = ordered.find((el) =>
      (el.dataset.textValue ?? el.textContent ?? '').trim().toLowerCase().startsWith(query),
    );
    focus(match);
  };

  /** @param {KeyboardEvent} e */
  const onSubKey = (e) => {
    const targetMenu = /** @type {Element} */ (e.target).closest('.j-menu, [role="menu"]');
    if (targetMenu && targetMenu !== subMenu) return;

    const list = getDirectItems(subMenu);
    const i = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    const last = list.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        focus(list[i < 0 ? 0 : i === last ? (loop ? 0 : last) : i + 1]);
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        focus(list[i < 0 ? last : i === 0 ? (loop ? last : 0) : i - 1]);
        break;
      case 'Home':
      case 'PageUp':
        e.preventDefault();
        e.stopPropagation();
        focus(list[0]);
        break;
      case 'End':
      case 'PageDown':
        e.preventDefault();
        e.stopPropagation();
        focus(list[last]);
        break;
      case 'ArrowLeft':
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        closeSubmenu(true);
        break;
      case 'Tab':
        closeSubmenu(false);
        break;
      case 'Enter':
      case ' ': {
        e.stopPropagation();
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
          e.stopPropagation();
          typeahead(e.key);
        }
    }
  };

  /** @param {MouseEvent} e */
  const onSubClick = (e) => {
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest(ITEM));
    if (!item || item.closest('.j-menu, [role="menu"]') !== subMenu) return;
    if (item.classList.contains('j-menu__sub-trigger') || item.getAttribute('aria-haspopup') === 'menu') {
      return;
    }
    if (isDisabled(item)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // If an ancestor root menu (`createMenu` or `createContextMenu`) owns selection,
    // let the click bubble to it so `j-select` fires once and closes both menus.
    const rootOwner = parentMenu?.closest('[data-j-menu-bound], [data-context-menu]');
    if (rootOwner) return;

    const role = item.getAttribute('role');
    if (manageChecked && role === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
    } else if (manageChecked && role === 'menuitemradio') {
      const group = item.closest('[role="group"]') || subMenu;
      group.querySelectorAll('[role="menuitemradio"]').forEach((r) => {
        if (r.closest('.j-menu, [role="menu"]') === subMenu) {
          r.setAttribute('aria-checked', String(r === item));
        }
      });
    }
    const evt = new CustomEvent('j-select', { bubbles: true, cancelable: true, detail: { item } });
    item.dispatchEvent(evt);
    const keepOpen =
      role !== 'menuitem' ? !item.hasAttribute('data-close') : item.hasAttribute('data-keep-open');
    if (!evt.defaultPrevented && !keepOpen) {
      closeSubmenu(false);
    }
  };

  /** @param {PointerEvent} e */
  const onSubPointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    const targetMenu = /** @type {Element} */ (e.target).closest('.j-menu, [role="menu"]');
    if (targetMenu !== subMenu) return;
    e.stopPropagation();
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest(ITEM));
    if (item && item.closest('.j-menu, [role="menu"]') === subMenu && !isDisabled(item)) {
      if (document.activeElement !== item) item.focus({ preventScroll: true });
    } else if (subMenu.contains(document.activeElement) && document.activeElement !== subMenu) {
      subMenu.focus({ preventScroll: true });
    }
  };

  // Wire any nested `.j-menu__sub` inside this submenu (for plain-HTML multi-level cascades).
  /** @type {Array<() => void>} */
  const childCleanups = [];
  subMenu.querySelectorAll(':scope .j-menu__sub').forEach((nested) => {
    if (nested.parentElement?.closest('.j-menu, [role="menu"]') === subMenu) {
      childCleanups.push(
        createSubmenu(/** @type {HTMLElement} */ (nested), { loop, manageChecked }),
      );
    }
  });

  trigger.addEventListener('keydown', onTriggerKey);
  trigger.addEventListener('click', onTriggerClick);
  trigger.addEventListener('pointerenter', onTriggerEnter);
  trigger.addEventListener('pointerleave', onTriggerLeave);
  subMenu.addEventListener('toggle', onSubToggle);
  subMenu.addEventListener('pointerenter', onSubEnter);
  subMenu.addEventListener('pointerleave', onSubLeave);
  subMenu.addEventListener('keydown', onSubKey);
  subMenu.addEventListener('click', onSubClick);
  subMenu.addEventListener('pointermove', onSubPointerMove);
  parentMenu?.addEventListener('toggle', onParentToggle);
  parentMenu?.addEventListener('keydown', onParentCaptureKey, true);

  const cleanup = () => {
    clearTimers();
    clearTimeout(typedTimer);
    childCleanups.forEach((fn) => fn());
    closeSubmenu(false);
    boundSubmenus.delete(subMenu);
    trigger.removeEventListener('keydown', onTriggerKey);
    trigger.removeEventListener('click', onTriggerClick);
    trigger.removeEventListener('pointerenter', onTriggerEnter);
    trigger.removeEventListener('pointerleave', onTriggerLeave);
    subMenu.removeEventListener('toggle', onSubToggle);
    subMenu.removeEventListener('pointerenter', onSubEnter);
    subMenu.removeEventListener('pointerleave', onSubLeave);
    subMenu.removeEventListener('keydown', onSubKey);
    subMenu.removeEventListener('click', onSubClick);
    subMenu.removeEventListener('pointermove', onSubPointerMove);
    parentMenu?.removeEventListener('toggle', onParentToggle);
    parentMenu?.removeEventListener('keydown', onParentCaptureKey, true);
  };

  boundSubmenus.set(subMenu, cleanup);
  return cleanup;
}

/**
 * Connect a trigger button to a `.j-menu` popover. Framework wrappers use this.
 * Set `manageChecked: false` when the framework owns `aria-checked`.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} menu
 * @param {MenuOptions} [options]
 * @returns {() => void} cleanup
 */
export function createMenu(trigger, menu, options = {}) {
  const loop = options.loop ?? true;
  const manageChecked = options.manageChecked ?? true;

  if (!menu.hasAttribute('popover')) menu.setAttribute('popover', 'auto');
  if (!menu.getAttribute('role')) menu.setAttribute('role', 'menu');
  menu.setAttribute('data-j-menu-bound', '');
  menu.tabIndex = -1;
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  if (menu.id) trigger.setAttribute('aria-controls', menu.id);
  if (trigger instanceof HTMLButtonElement && !trigger.popoverTargetElement) {
    trigger.popoverTargetElement = menu;
  }
  const anchorEl = options.anchor || trigger;
  const stopAnchor = anchorPopover(anchorEl, menu, { side: options.side || 'bottom' });

  /** @type {'first' | 'last' | null} */
  let pendingFocus = null;
  let typed = '';
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let typedTimer;

  const items = () => getDirectItems(menu);

  /** @param {HTMLElement | undefined} el */
  const focus = (el) => el?.focus({ preventScroll: false });
  const isOpen = () => menu.matches(':popover-open');
  const open = (/** @type {'first' | 'last'} */ where) => {
    pendingFocus = where;
    if (isOpen()) focus(where === 'first' ? items()[0] : items().at(-1));
    else menu.showPopover();
  };
  const close = (restore = true) => {
    menu.querySelectorAll('.j-menu__sub-content').forEach((el) => {
      const sub = /** @type {HTMLElement} */ (el);
      if (sub.matches(':popover-open')) {
        try {
          sub.hidePopover();
        } catch {
          /* ignore */
        }
      }
    });
    if (isOpen()) menu.hidePopover();
    if (restore) trigger.focus({ preventScroll: true });
  };

  const onToggle = (/** @type {Event} */ e) => {
    if (e.target !== menu) return;
    const opened = /** @type {ToggleEvent} */ (e).newState === 'open';
    trigger.setAttribute('aria-expanded', String(opened));
    if (opened) {
      // Items are reachable by arrow keys only (roving focus), never by Tab.
      menu.querySelectorAll(ITEM).forEach((el) => {
        if (el.closest('.j-menu, [role="menu"]') === menu) {
          /** @type {HTMLElement} */ (el).tabIndex = -1;
        }
      });
      const list = items();
      if (pendingFocus === 'first') focus(list[0]);
      else if (pendingFocus === 'last') focus(list.at(-1));
      else menu.focus({ preventScroll: true });
    } else {
      menu.querySelectorAll('.j-menu__sub-content').forEach((el) => {
        const sub = /** @type {HTMLElement} */ (el);
        if (sub.matches(':popover-open')) {
          try {
            sub.hidePopover();
          } catch {
            /* ignore */
          }
        }
      });
    }
    pendingFocus = null;
    typed = '';
  };

  /** @param {KeyboardEvent} e */
  const onTriggerKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); open('first'); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); open('last'); }
    // Enter / Space click the button natively, which toggles the popover.
    else if (e.key === 'Enter' || e.key === ' ') pendingFocus = 'first';
  };

  /** @param {string} char */
  const typeahead = (char) => {
    clearTimeout(typedTimer);
    typed += char.toLowerCase();
    typedTimer = setTimeout(() => { typed = ''; }, 500);
    const list = items();
    const current = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    // Repeating one letter cycles through matches.
    const query = typed.split('').every((c) => c === typed[0]) ? typed[0] : typed;
    const ordered = [...list.slice(current + 1), ...list.slice(0, current + 1)];
    const match = ordered.find((el) => (el.dataset.textValue ?? el.textContent ?? '').trim().toLowerCase().startsWith(query));
    focus(match);
  };

  /** @param {KeyboardEvent} e */
  const onMenuKey = (e) => {
    const targetMenu = /** @type {Element} */ (e.target).closest('.j-menu, [role="menu"]');
    if (targetMenu && targetMenu !== menu) return;

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
      case 'Home': case 'PageUp':
        e.preventDefault(); focus(list[0]); break;
      case 'End': case 'PageDown':
        e.preventDefault(); focus(list[last]); break;
      case 'Tab':
        e.preventDefault(); close(); break;
      case 'Enter': case ' ': {
        const el = /** @type {HTMLElement} */ (document.activeElement);
        if (i >= 0 && el.tagName !== 'BUTTON' && !(e.key === 'Enter' && el.tagName === 'A')) {
          e.preventDefault(); el.click();
        } else if (i < 0) e.preventDefault();
        break;
      }
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          if (e.key !== ' ') typeahead(e.key);
        }
    }
  };

  /** @param {MouseEvent} e */
  const onMenuClick = (e) => {
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest(ITEM));
    if (!item || !menu.contains(item)) return;
    if (item.classList.contains('j-menu__sub-trigger') || item.getAttribute('aria-haspopup') === 'menu') {
      return;
    }
    if (isDisabled(item)) { e.preventDefault(); return; }
    const role = item.getAttribute('role');
    const ownerMenu = item.closest('.j-menu, [role="menu"]') || menu;
    if (manageChecked && role === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
    } else if (manageChecked && role === 'menuitemradio') {
      const group = item.closest('[role="group"]') || ownerMenu;
      group.querySelectorAll('[role="menuitemradio"]').forEach((r) => {
        if (r.closest('.j-menu, [role="menu"]') === ownerMenu) {
          r.setAttribute('aria-checked', String(r === item));
        }
      });
    }
    const evt = new CustomEvent('j-select', { bubbles: true, cancelable: true, detail: { item } });
    item.dispatchEvent(evt);
    // Plain items close the menu; checkbox / radio items keep it open.
    const keepOpen = role !== 'menuitem' ? !item.hasAttribute('data-close') : item.hasAttribute('data-keep-open');
    if (!evt.defaultPrevented && !keepOpen) close();
  };

  /** @param {PointerEvent} e */
  const onPointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    const targetMenu = /** @type {Element} */ (e.target).closest('.j-menu, [role="menu"]');
    if (targetMenu && targetMenu !== menu) return;
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest(ITEM));
    if (item && item.closest('.j-menu, [role="menu"]') === menu && !isDisabled(item)) {
      if (document.activeElement !== item) item.focus({ preventScroll: true });
    } else if (
      !item &&
      menu.contains(document.activeElement) &&
      document.activeElement?.closest('.j-menu, [role="menu"]') === menu &&
      document.activeElement !== menu
    ) {
      menu.focus({ preventScroll: true });
    }
  };
  const onPointerLeave = () => {
    if (menu.contains(document.activeElement) && document.activeElement?.closest('.j-menu, [role="menu"]') === menu) {
      menu.focus({ preventScroll: true });
    }
  };

  // Auto-wire any plain-HTML `.j-menu__sub` children not already bound by framework wrappers.
  /** @type {Array<() => void>} */
  const subCleanups = [];
  menu.querySelectorAll('.j-menu__sub').forEach((subEl) => {
    const subContent = /** @type {HTMLElement | null} */ (
      subEl.querySelector(':scope > .j-menu__sub-content, :scope > .j-menu')
    );
    if (subContent && !boundSubmenus.has(subContent)) {
      subCleanups.push(
        createSubmenu(/** @type {HTMLElement} */ (subEl), { loop, manageChecked }),
      );
    }
  });

  trigger.addEventListener('keydown', onTriggerKey);
  menu.addEventListener('toggle', onToggle);
  menu.addEventListener('keydown', onMenuKey);
  menu.addEventListener('click', onMenuClick);
  menu.addEventListener('pointermove', onPointerMove);
  menu.addEventListener('pointerleave', onPointerLeave);

  return () => {
    clearTimeout(typedTimer);
    subCleanups.forEach((fn) => fn());
    menu.removeAttribute('data-j-menu-bound');
    stopAnchor();
    trigger.removeEventListener('keydown', onTriggerKey);
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
 * Init every trigger whose `popovertarget` points to a `.j-menu`, plus any
 * unbound `.j-menu__sub` elements inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initMenus(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  /** @type {Array<() => void>} */
  const orphanSubs = [];

  root.querySelectorAll('[popovertarget]').forEach((el) => {
    const trigger = /** @type {HTMLElement} */ (el);
    const menu = document.getElementById(trigger.getAttribute('popovertarget') || '');
    if (!menu || !menu.classList.contains('j-menu') || bound.has(trigger)) return;
    bound.set(trigger, createMenu(trigger, menu));
    made.push(trigger);
  });

  root.querySelectorAll('.j-menu__sub').forEach((subEl) => {
    const subContent = /** @type {HTMLElement | null} */ (
      subEl.querySelector(':scope > .j-menu__sub-content, :scope > .j-menu')
    );
    if (subContent && !boundSubmenus.has(subContent)) {
      orphanSubs.push(createSubmenu(/** @type {HTMLElement} */ (subEl)));
    }
  });

  return () => {
    orphanSubs.forEach((fn) => fn());
    made.forEach((t) => {
      bound.get(t)?.();
      bound.delete(t);
    });
  };
}
