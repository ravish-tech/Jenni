// Menubar behavior — WAI-ARIA role="menubar" horizontal application menu bar.
// Supports roving tabindex across top-level triggers, keyboard open (Enter / Space /
// ArrowDown / ArrowUp), desktop hover handoff while any menu is open, cross-menu
// ArrowRight / ArrowLeft switching, nested cascading submenus, typeahead, Escape,
// and outside pointerdown dismissal.

import { linkAnchor, trackAnchor } from './anchor.js';
import { createSubmenu, getDirectItems, isSubmenuBound } from './menu.js';

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
let menubarUid = 0;

/** @param {Element} el */
const isDisabled = (el) =>
  el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/** @param {HTMLElement} el */
function isPopoverOpen(el) {
  try {
    return el.matches(':popover-open');
  } catch {
    return el.hasAttribute('data-open');
  }
}

/**
 * @typedef {Object} MenubarOptions
 * @property {boolean} [loop]
 * @property {boolean} [manageChecked]
 * @property {number} [offset]
 * @property {(index: number, trigger: HTMLElement | null, menu: HTMLElement | null) => void} [onOpenChange]
 */

/**
 * @typedef {Object} MenubarMethods
 * @property {(index: number, where?: 'first' | 'last' | null) => void} open
 * @property {(restoreFocus?: boolean) => void} close
 * @property {() => void} refresh
 * @property {() => number} getActiveIndex
 * @property {() => void} destroy
 */

/**
 * @typedef {(() => void) & MenubarMethods} MenubarController
 */

/**
 * @typedef {Object} MenubarEntry
 * @property {HTMLElement} trigger
 * @property {HTMLElement} menu
 * @property {Array<() => void>} cleanups
 */

/**
 * Wire a `.j-menubar[role="menubar"]` container and its top-level triggers + `.j-menu` panels.
 * @param {HTMLElement} root
 * @param {MenubarOptions} [options]
 * @returns {MenubarController}
 */
export function createMenubar(root, options = {}) {
  const loop = options.loop ?? true;
  const manageChecked = options.manageChecked ?? true;
  const offset = options.offset ?? 4;
  const doc = root.ownerDocument || document;

  if (!root.getAttribute('role')) root.setAttribute('role', 'menubar');

  /** @type {MenubarEntry[]} */
  let entries = [];
  let activeIndex = -1;
  let rovingIndex = 0;
  /** @type {null | (() => void)} */
  let stopTrack = null;
  let typed = '';
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let typedTimer;
  let triggerTyped = '';
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let triggerTypedTimer;

  /** @param {HTMLElement | undefined | null} el */
  const focus = (el) => el?.focus({ preventScroll: true });

  /**
   * Resolve the `.j-menu` panel paired with a top-level menubar trigger.
   * @param {HTMLElement} trigger
   * @returns {HTMLElement | null}
   */
  const resolveMenuForTrigger = (trigger) => {
    const ctrlId =
      trigger.getAttribute('aria-controls') ||
      trigger.getAttribute('popovertarget') ||
      trigger.dataset.menu;
    if (ctrlId) {
      const byId = doc.getElementById(ctrlId);
      if (byId) return byId;
    }
    if (trigger.parentElement?.classList.contains('j-menubar__menu')) {
      const sibling = /** @type {HTMLElement | null} */ (
        trigger.parentElement.querySelector(':scope > .j-menu, :scope > [role="menu"]')
      );
      if (sibling) return sibling;
    }
    const next = trigger.nextElementSibling;
    if (next instanceof HTMLElement && next.matches('.j-menu, [role="menu"]')) {
      return next;
    }
    return null;
  };

  /** @param {HTMLElement} menuEl */
  const closeSubmenusIn = (menuEl) => {
    menuEl.querySelectorAll('.j-menu__sub-content').forEach((el) => {
      const sub = /** @type {HTMLElement} */ (el);
      if (isPopoverOpen(sub)) {
        try {
          sub.hidePopover();
        } catch {
          /* ignore */
        }
      }
      sub.removeAttribute('data-open');
    });
    menuEl.querySelectorAll('.j-menu__sub-trigger, [aria-haspopup="menu"]').forEach((el) => {
      el.setAttribute('aria-expanded', 'false');
    });
  };

  /** @returns {number[]} */
  const getEnabledIndices = () => {
    /** @type {number[]} */
    const out = [];
    for (let i = 0; i < entries.length; i++) {
      if (!isDisabled(entries[i].trigger)) out.push(i);
    }
    return out;
  };

  /** @param {number} [preferred] */
  const syncRoving = (preferred) => {
    const enabled = getEnabledIndices();
    if (preferred !== undefined && enabled.includes(preferred)) {
      rovingIndex = preferred;
    } else if (!enabled.includes(rovingIndex)) {
      rovingIndex = enabled[0] ?? -1;
    }
    entries.forEach((entry, idx) => {
      entry.trigger.tabIndex = idx === rovingIndex && !isDisabled(entry.trigger) ? 0 : -1;
    });
  };

  /**
   * @param {number} fromIndex
   * @param {1 | -1} delta
   * @returns {number}
   */
  const stepEnabledIndex = (fromIndex, delta) => {
    const enabled = getEnabledIndices();
    if (enabled.length === 0) return -1;
    const pos = enabled.indexOf(fromIndex);
    if (pos < 0) return delta > 0 ? enabled[0] : enabled[enabled.length - 1];
    if (delta > 0) {
      return pos + 1 < enabled.length
        ? enabled[pos + 1]
        : loop
          ? enabled[0]
          : enabled[enabled.length - 1];
    }
    return pos - 1 >= 0 ? enabled[pos - 1] : loop ? enabled[enabled.length - 1] : enabled[0];
  };

  /** @param {number} index */
  const focusTriggerAt = (index) => {
    const entry = entries[index];
    if (!entry || isDisabled(entry.trigger)) return;
    syncRoving(index);
    focus(entry.trigger);
  };

  /** @param {MenubarEntry} entry */
  const hideEntryMenu = (entry) => {
    closeSubmenusIn(entry.menu);
    if (isPopoverOpen(entry.menu)) {
      try {
        entry.menu.hidePopover();
      } catch {
        /* ignore */
      }
    }
    entry.menu.removeAttribute('data-open');
    entry.trigger.setAttribute('aria-expanded', 'false');
    entry.trigger.removeAttribute('data-open');
  };

  /**
   * Close the currently open top-level menu and all nested cascading submenus.
   * @param {boolean} [restoreFocus]
   */
  const close = (restoreFocus = false) => {
    if (activeIndex < 0) return;
    const prev = entries[activeIndex];
    activeIndex = -1;
    typed = '';
    clearTimeout(typedTimer);
    stopTrack?.();
    stopTrack = null;
    root.removeAttribute('data-open');
    if (prev) {
      hideEntryMenu(prev);
      if (restoreFocus) focus(prev.trigger);
    }
    options.onOpenChange?.(-1, null, null);
  };

  /**
   * Open the top-level menu at `index`, closing any previously active menu first.
   * @param {number} index
   * @param {'first' | 'last' | null} [where]
   */
  const open = (index, where = null) => {
    const entry = entries[index];
    if (!entry || isDisabled(entry.trigger)) return;

    if (activeIndex >= 0 && activeIndex !== index) {
      const prev = entries[activeIndex];
      stopTrack?.();
      stopTrack = null;
      if (prev) hideEntryMenu(prev);
    }

    activeIndex = index;
    typed = '';
    clearTimeout(typedTimer);
    syncRoving(index);
    root.setAttribute('data-open', '');
    entry.trigger.setAttribute('aria-expanded', 'true');
    entry.trigger.setAttribute('data-open', '');

    entry.menu.querySelectorAll(ITEM).forEach((el) => {
      if (el.closest('.j-menu, [role="menu"]') === entry.menu) {
        /** @type {HTMLElement} */ (el).tabIndex = -1;
      }
    });

    if (!isPopoverOpen(entry.menu)) {
      entry.menu.setAttribute('data-open', '');
      try {
        entry.menu.showPopover();
      } catch {
        /* fallback in headless environments without showPopover */
      }
    }

    stopTrack?.();
    stopTrack = trackAnchor(entry.trigger, entry.menu, {
      side: 'bottom',
      align: 'start',
      offset,
    });

    const list = getDirectItems(entry.menu);
    if (where === 'first') focus(list[0] ?? entry.menu);
    else if (where === 'last') focus(list.at(-1) ?? entry.menu);
    else focus(entry.menu);

    options.onOpenChange?.(index, entry.trigger, entry.menu);
  };

  /**
   * Typeahead inside an open top-level menu.
   * @param {HTMLElement} menuEl
   * @param {string} char
   */
  const menuTypeahead = (menuEl, char) => {
    clearTimeout(typedTimer);
    typed += char.toLowerCase();
    typedTimer = setTimeout(() => {
      typed = '';
    }, 500);
    const list = getDirectItems(menuEl);
    const current = list.indexOf(/** @type {HTMLElement} */ (doc.activeElement));
    const query = typed.split('').every((c) => c === typed[0]) ? typed[0] : typed;
    const ordered = [...list.slice(current + 1), ...list.slice(0, current + 1)];
    const match = ordered.find((el) =>
      (el.dataset.textValue ?? el.textContent ?? '').trim().toLowerCase().startsWith(query),
    );
    focus(match);
  };

  /**
   * Typeahead across top-level menubar triggers when closed.
   * @param {number} fromIdx
   * @param {string} char
   */
  const triggerTypeahead = (fromIdx, char) => {
    clearTimeout(triggerTypedTimer);
    triggerTyped += char.toLowerCase();
    triggerTypedTimer = setTimeout(() => {
      triggerTyped = '';
    }, 500);
    const enabled = getEnabledIndices();
    const pos = enabled.indexOf(fromIdx);
    const query = triggerTyped.split('').every((c) => c === triggerTyped[0])
      ? triggerTyped[0]
      : triggerTyped;
    const ordered = [...enabled.slice(pos + 1), ...enabled.slice(0, pos + 1)];
    const matchIdx = ordered.find((idx) =>
      (entries[idx].trigger.textContent ?? '').trim().toLowerCase().startsWith(query),
    );
    if (matchIdx !== undefined) focusTriggerAt(matchIdx);
  };

  /**
   * Bind listeners to a single `{ trigger, menu }` pair.
   * @param {HTMLElement} trigger
   * @param {HTMLElement} menu
   * @returns {MenubarEntry}
   */
  const bindEntry = (trigger, menu) => {
    if (!menu.id) menu.id = `j-menubar-menu-${++menubarUid}`;
    menu.setAttribute('popover', 'manual');
    if (!menu.getAttribute('role')) menu.setAttribute('role', 'menu');
    if (!menu.dataset.side) menu.dataset.side = 'bottom';
    if (!menu.dataset.align) menu.dataset.align = 'start';
    menu.style.setProperty('--j-floating-offset', `${offset}px`);
    menu.setAttribute('data-j-menu-bound', '');
    menu.tabIndex = -1;

    if (!trigger.getAttribute('role')) trigger.setAttribute('role', 'menuitem');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', String(isPopoverOpen(menu)));
    trigger.setAttribute('aria-controls', menu.id);

    linkAnchor(trigger, menu);

    /** @type {Array<() => void>} */
    const cleanups = [];

    // Wire any plain-HTML `.j-menu__sub` inside this menu not already bound by framework wrappers.
    menu.querySelectorAll('.j-menu__sub').forEach((subEl) => {
      const subContent = /** @type {HTMLElement | null} */ (
        subEl.querySelector(':scope > .j-menu__sub-content, :scope > .j-menu')
      );
      if (subContent && !isSubmenuBound(subContent)) {
        cleanups.push(createSubmenu(/** @type {HTMLElement} */ (subEl), { loop, manageChecked }));
      }
    });

    const getIdx = () => entries.findIndex((e) => e.trigger === trigger);

    /** @param {KeyboardEvent} e */
    const onTriggerKey = (e) => {
      const idx = getIdx();
      if (idx < 0 || isDisabled(trigger)) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'Enter':
        case ' ':
          e.preventDefault();
          open(idx, 'first');
          break;
        case 'ArrowUp':
          e.preventDefault();
          open(idx, 'last');
          break;
        case 'ArrowRight': {
          e.preventDefault();
          const next = stepEnabledIndex(idx, 1);
          if (next >= 0) {
            if (activeIndex >= 0) open(next, 'first');
            else focusTriggerAt(next);
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          const prev = stepEnabledIndex(idx, -1);
          if (prev >= 0) {
            if (activeIndex >= 0) open(prev, 'first');
            else focusTriggerAt(prev);
          }
          break;
        }
        case 'Home': {
          e.preventDefault();
          const first = getEnabledIndices()[0] ?? -1;
          if (first >= 0) {
            if (activeIndex >= 0) open(first, 'first');
            else focusTriggerAt(first);
          }
          break;
        }
        case 'End': {
          e.preventDefault();
          const last = getEnabledIndices().at(-1) ?? -1;
          if (last >= 0) {
            if (activeIndex >= 0) open(last, 'first');
            else focusTriggerAt(last);
          }
          break;
        }
        case 'Escape':
          if (activeIndex >= 0) {
            e.preventDefault();
            close(true);
          }
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
            triggerTypeahead(idx, e.key);
          }
      }
    };

    /** @param {MouseEvent} e */
    const onTriggerClick = (e) => {
      const idx = getIdx();
      if (idx < 0 || isDisabled(trigger)) {
        e.preventDefault();
        return;
      }
      if (activeIndex === idx) {
        close(true);
      } else {
        open(idx, e.detail === 0 ? 'first' : null);
      }
    };

    /** @param {PointerEvent} e */
    const onTriggerPointerEnter = (e) => {
      if (e.pointerType === 'touch' || isDisabled(trigger)) return;
      const idx = getIdx();
      if (idx < 0) return;
      if (activeIndex >= 0 && activeIndex !== idx) {
        open(idx, null);
      }
    };

    const onTriggerFocus = () => {
      const idx = getIdx();
      if (idx >= 0 && !isDisabled(trigger)) {
        syncRoving(idx);
      }
    };

    /** @param {KeyboardEvent} e */
    const onMenuKey = (e) => {
      const idx = getIdx();
      if (idx < 0) return;

      const targetEl = e.target instanceof Element ? e.target : null;
      if (targetEl?.closest('.j-menu__sub-content')) return;

      const targetMenu = targetEl?.closest('.j-menu, [role="menu"]');
      if (targetMenu && targetMenu !== menu) return;

      const list = getDirectItems(menu);
      const activeEl = /** @type {HTMLElement | null} */ (doc.activeElement);
      const i = activeEl ? list.indexOf(activeEl) : -1;
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
        case 'ArrowRight': {
          const itemEl = targetEl?.closest(ITEM) ?? targetEl;
          const isSubTrigger = Boolean(
            itemEl &&
              (itemEl.classList.contains('j-menu__sub-trigger') ||
                itemEl.getAttribute('aria-haspopup') === 'menu'),
          );
          if (isSubTrigger) return;
          e.preventDefault();
          const next = stepEnabledIndex(idx, 1);
          if (next >= 0 && next !== idx) {
            open(next, 'first');
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          const prev = stepEnabledIndex(idx, -1);
          if (prev >= 0 && prev !== idx) {
            open(prev, 'first');
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          close(true);
          break;
        case 'Tab':
          close(false);
          break;
        case 'Enter':
        case ' ': {
          if (i >= 0 && activeEl) {
            if (
              activeEl.tagName !== 'BUTTON' &&
              !(e.key === 'Enter' && activeEl.tagName === 'A')
            ) {
              e.preventDefault();
              activeEl.click();
            }
          } else {
            e.preventDefault();
          }
          break;
        }
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== ' ') {
            menuTypeahead(menu, e.key);
          }
      }
    };

    /** @param {MouseEvent} e */
    const onMenuClick = (e) => {
      const targetEl = e.target instanceof Element ? e.target : null;
      const item = /** @type {HTMLElement | null} */ (targetEl?.closest(ITEM) ?? null);
      if (!item || !menu.contains(item)) return;
      if (
        item.classList.contains('j-menu__sub-trigger') ||
        item.getAttribute('aria-haspopup') === 'menu'
      ) {
        return;
      }
      if (isDisabled(item)) {
        e.preventDefault();
        return;
      }

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

      const evt = new CustomEvent('j-select', {
        bubbles: true,
        cancelable: true,
        detail: { item },
      });
      item.dispatchEvent(evt);

      const keepOpen =
        role !== 'menuitem' ? !item.hasAttribute('data-close') : item.hasAttribute('data-keep-open');
      if (!evt.defaultPrevented && !keepOpen) {
        const activeAfter = doc.activeElement;
        const focusMovedElsewhere = Boolean(
          activeAfter &&
            activeAfter !== doc.body &&
            activeAfter !== doc.documentElement &&
            !menu.contains(activeAfter) &&
            !root.contains(activeAfter),
        );
        close(!focusMovedElsewhere);
      }
    };

    /** @param {PointerEvent} e */
    const onMenuPointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      const targetEl = e.target instanceof Element ? e.target : null;
      const targetMenu = targetEl?.closest('.j-menu, [role="menu"]');
      if (targetMenu && targetMenu !== menu) return;
      const item = /** @type {HTMLElement | null} */ (targetEl?.closest(ITEM) ?? null);
      if (item && item.closest('.j-menu, [role="menu"]') === menu && !isDisabled(item)) {
        if (doc.activeElement !== item) item.focus({ preventScroll: true });
      } else if (
        !item &&
        menu.contains(doc.activeElement) &&
        doc.activeElement?.closest('.j-menu, [role="menu"]') === menu &&
        doc.activeElement !== menu
      ) {
        menu.focus({ preventScroll: true });
      }
    };

    const onMenuPointerLeave = () => {
      if (
        menu.contains(doc.activeElement) &&
        doc.activeElement?.closest('.j-menu, [role="menu"]') === menu &&
        doc.activeElement !== menu
      ) {
        menu.focus({ preventScroll: true });
      }
    };

    /** @param {Event} e */
    const onMenuToggle = (e) => {
      if (e.target !== menu) return;
      const opened = /** @type {ToggleEvent} */ (e).newState === 'open';
      trigger.setAttribute('aria-expanded', String(opened));
      if (!opened && activeIndex === getIdx()) {
        close(false);
      }
    };

    trigger.addEventListener('keydown', onTriggerKey);
    trigger.addEventListener('click', onTriggerClick);
    trigger.addEventListener('pointerenter', onTriggerPointerEnter);
    trigger.addEventListener('focus', onTriggerFocus);
    menu.addEventListener('toggle', onMenuToggle);
    menu.addEventListener('keydown', onMenuKey);
    menu.addEventListener('click', onMenuClick);
    menu.addEventListener('pointermove', onMenuPointerMove);
    menu.addEventListener('pointerleave', onMenuPointerLeave);

    cleanups.push(() => {
      menu.removeAttribute('data-j-menu-bound');
      trigger.removeEventListener('keydown', onTriggerKey);
      trigger.removeEventListener('click', onTriggerClick);
      trigger.removeEventListener('pointerenter', onTriggerPointerEnter);
      trigger.removeEventListener('focus', onTriggerFocus);
      menu.removeEventListener('toggle', onMenuToggle);
      menu.removeEventListener('keydown', onMenuKey);
      menu.removeEventListener('click', onMenuClick);
      menu.removeEventListener('pointermove', onMenuPointerMove);
      menu.removeEventListener('pointerleave', onMenuPointerLeave);
    });

    return { trigger, menu, cleanups };
  };

  /**
   * Re-scan `root` for top-level triggers + menus while preserving existing bindings.
   */
  const refresh = () => {
    const candidates = /** @type {HTMLElement[]} */ (
      [...root.querySelectorAll('.j-menubar__trigger, [role="menuitem"]')].filter(
        (el) =>
          !el.closest('.j-menu, [role="menu"]') &&
          el.closest('.j-menubar, [role="menubar"]') === root,
      )
    );

    const existingByTrigger = new Map(entries.map((e) => [e.trigger, e]));
    /** @type {MenubarEntry[]} */
    const nextEntries = [];
    const activeTrigger = activeIndex >= 0 ? entries[activeIndex]?.trigger : null;

    for (const trig of candidates) {
      const menu = resolveMenuForTrigger(trig);
      if (!menu) continue;
      const existing = existingByTrigger.get(trig);
      if (existing && existing.menu === menu) {
        existingByTrigger.delete(trig);
        // Ensure any newly mounted plain-HTML submenus are wired
        menu.querySelectorAll('.j-menu__sub').forEach((subEl) => {
          const subContent = /** @type {HTMLElement | null} */ (
            subEl.querySelector(':scope > .j-menu__sub-content, :scope > .j-menu')
          );
          if (subContent && !isSubmenuBound(subContent)) {
            existing.cleanups.push(
              createSubmenu(/** @type {HTMLElement} */ (subEl), { loop, manageChecked }),
            );
          }
        });
        nextEntries.push(existing);
      } else {
        if (existing) {
          hideEntryMenu(existing);
          existing.cleanups.forEach((fn) => fn());
          existingByTrigger.delete(trig);
        }
        nextEntries.push(bindEntry(trig, menu));
      }
    }

    for (const removed of existingByTrigger.values()) {
      hideEntryMenu(removed);
      removed.cleanups.forEach((fn) => fn());
    }

    entries = nextEntries;
    if (activeTrigger) {
      activeIndex = entries.findIndex((e) => e.trigger === activeTrigger);
      if (activeIndex < 0) {
        stopTrack?.();
        stopTrack = null;
        root.removeAttribute('data-open');
      } else if (isDisabled(entries[activeIndex].trigger)) {
        close(false);
      }
    }
    syncRoving();
  };

  /** @param {PointerEvent} e */
  const onDocPointerDown = (e) => {
    if (activeIndex < 0) return;
    const t = /** @type {Node | null} */ (e.target);
    if (!t) return;
    const current = entries[activeIndex];
    if (current && current.menu.contains(t)) return;
    if (t instanceof Element) {
      const trig = t.closest('.j-menubar__trigger, [role="menuitem"]');
      if (trig && entries.some((en) => en.trigger === trig)) return;
    }
    close(false);
  };

  refresh();
  doc.addEventListener('pointerdown', onDocPointerDown, true);

  /** @type {MutationObserver | null} */
  let observer = null;
  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      refresh();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled'],
    });
  }

  const destroy = () => {
    observer?.disconnect();
    observer = null;
    clearTimeout(typedTimer);
    clearTimeout(triggerTypedTimer);
    close(false);
    doc.removeEventListener('pointerdown', onDocPointerDown, true);
    entries.forEach((entry) => {
      hideEntryMenu(entry);
      entry.cleanups.forEach((fn) => fn());
    });
    entries = [];
  };

  const getActiveIndex = () => activeIndex;

  return Object.assign(destroy, {
    open,
    close,
    refresh,
    getActiveIndex,
    destroy,
  });
}

/** @type {WeakMap<HTMLElement, MenubarController>} */
const boundMenubars = new WeakMap();

/**
 * Initialize every `.j-menubar` or `[role="menubar"]` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initMenubars(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  const candidates =
    root instanceof HTMLElement && root.matches('.j-menubar, [role="menubar"]')
      ? [root, ...root.querySelectorAll('.j-menubar, [role="menubar"]')]
      : [...root.querySelectorAll('.j-menubar, [role="menubar"]')];

  candidates.forEach((el) => {
    const bar = /** @type {HTMLElement} */ (el);
    if (boundMenubars.has(bar)) return;
    boundMenubars.set(bar, createMenubar(bar));
    made.push(bar);
  });

  return () => {
    made.forEach((bar) => {
      boundMenubars.get(bar)?.destroy();
      boundMenubars.delete(bar);
    });
  };
}
