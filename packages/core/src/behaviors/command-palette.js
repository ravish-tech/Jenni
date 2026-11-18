// Jenni — Command Palette behavior.
// Native top-layer `<dialog class="j-command-palette">` (plus inline `[data-inline]`
// surfaces) with WAI-ARIA 1.2 combobox + listbox active-descendant keyboard
// navigation, instant query filtering across label / description / keywords / group,
// backdrop light-dismiss, and optional `⌘K` / `Ctrl+K` global shortcut binding.

import { lightDismiss, requestClose } from './dialog.js';

let uid = 0;

/** @type {WeakMap<HTMLElement, CommandPaletteController>} */
const controllers = new WeakMap();

/**
 * @typedef {Object} CommandSelectDetail
 * @property {string} value
 * @property {string} label
 * @property {HTMLElement} item
 */

/**
 * @typedef {Object} CommandPaletteOptions
 * @property {string | false} [shortcut]
 * @property {boolean} [closeOnSelect]
 * @property {boolean} [dismissible]
 * @property {boolean} [loop]
 * @property {boolean} [manageFilter]
 * @property {(detail: CommandSelectDetail) => void} [onSelect]
 * @property {(open: boolean) => void} [onOpenChange]
 * @property {(query: string) => void} [onQueryChange]
 */

/**
 * @typedef {Object} CommandPaletteController
 * @property {() => void} open
 * @property {() => void} close
 * @property {() => void} toggle
 * @property {() => boolean} isOpen
 * @property {(query: string) => void} setQuery
 * @property {() => void} refresh
 * @property {() => void} destroy
 */

/**
 * Bind a global `⌘<key>` / `Ctrl+<key>` shortcut listener.
 * @param {string} key
 * @param {(e: KeyboardEvent) => void} handler
 * @returns {() => void} cleanup
 */
export function bindCommandShortcut(key, handler) {
  if (!key || typeof window === 'undefined') return () => {};
  const normalized = key.trim().toLowerCase();
  if (!normalized) return () => {};

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    if (e.defaultPrevented) return;
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
      if (e.key.toLowerCase() === normalized) {
        e.preventDefault();
        handler(e);
      }
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}

/**
 * Attach command palette combobox + listbox + modal behavior to `el`.
 * @param {HTMLElement} el
 * @param {CommandPaletteOptions} [opts]
 * @returns {CommandPaletteController}
 */
export function createCommandPalette(el, opts = {}) {
  const existing = controllers.get(el);
  if (existing) return existing;

  const isDialog = typeof HTMLDialogElement !== 'undefined' && el instanceof HTMLDialogElement;
  const isInline = el.hasAttribute('data-inline') || !isDialog;
  const input = /** @type {HTMLInputElement | null} */ (
    el.querySelector('.j-command-palette__input')
  );
  const list = /** @type {HTMLElement | null} */ (el.querySelector('.j-command-palette__list'));
  const emptyEl = /** @type {HTMLElement | null} */ (
    el.querySelector('.j-command-palette__empty')
  );
  const closeBtn = /** @type {HTMLElement | null} */ (
    el.querySelector('.j-command-palette__close')
  );

  const loop = opts.loop !== false;
  const dismissible = opts.dismissible !== false;
  const manageFilter = opts.manageFilter !== false;
  const closeOnSelect = opts.closeOnSelect ?? !isInline;

  if (list) {
    if (!list.id) list.id = `j-cmd-list-${++uid}`;
    if (!list.getAttribute('role')) list.setAttribute('role', 'listbox');
  }

  if (input) {
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    if (list?.id) input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', isInline ? 'true' : String(Boolean(isDialog && el.open)));
  }

  const allItems = () =>
    list
      ? /** @type {HTMLElement[]} */ (
          Array.from(list.querySelectorAll('.j-command-palette__item, [role="option"]'))
        )
      : [];

  const isDisabledItem = (/** @type {HTMLElement} */ item) =>
    item.getAttribute('aria-disabled') === 'true' ||
    item.hasAttribute('data-disabled') ||
    item.hasAttribute('disabled');

  const labelFor = (/** @type {HTMLElement} */ item) =>
    (
      item.dataset.label ||
      item.querySelector('.j-command-palette__item-title')?.textContent ||
      item.textContent ||
      ''
    ).trim();

  const valueFor = (/** @type {HTMLElement} */ item) => item.dataset.value ?? labelFor(item);

  const ensureItemIds = () => {
    const baseId = list?.id || `j-cmd-${++uid}`;
    allItems().forEach((item) => {
      if (!item.id) item.id = `${baseId}-item-${++uid}`;
      if (!item.getAttribute('role')) item.setAttribute('role', 'option');
      if (!item.hasAttribute('aria-selected')) item.setAttribute('aria-selected', 'false');
    });
  };

  const visibleItems = () => allItems().filter((item) => !item.hidden && !isDisabledItem(item));

  /**
   * @param {HTMLElement | null} target
   * @param {boolean} [scroll]
   */
  const setHighlight = (target, scroll = true) => {
    allItems().forEach((item) => {
      const active = item === target;
      if (active) {
        item.setAttribute('data-highlighted', '');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.removeAttribute('data-highlighted');
        item.setAttribute('aria-selected', 'false');
      }
    });
    if (input) {
      if (target?.id) {
        input.setAttribute('aria-activedescendant', target.id);
        if (scroll) target.scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }
  };

  /**
   * Filter DOM items against `query` across label, description, keywords, and group.
   * @param {string} query
   */
  const filterItems = (query) => {
    ensureItemIds();
    if (!manageFilter) {
      const vis = visibleItems();
      const cur = vis.find((i) => i.hasAttribute('data-highlighted'));
      setHighlight(cur || vis[0] || null, false);
      return;
    }

    const q = query.trim().toLowerCase();
    let matchCount = 0;

    allItems().forEach((item) => {
      const groupEl = item.closest('.j-command-palette__group');
      const groupName =
        item.dataset.group ||
        groupEl?.querySelector('.j-command-palette__group-label')?.textContent ||
        '';
      const desc =
        item.querySelector('.j-command-palette__item-description')?.textContent || '';
      const keywords = item.dataset.keywords || '';
      const haystack = `${labelFor(item)} ${desc} ${keywords} ${groupName}`.toLowerCase();
      const matched = !q || haystack.includes(q);
      item.hidden = !matched;
      if (matched) matchCount += 1;
    });

    list?.querySelectorAll('.j-command-palette__group').forEach((grp) => {
      const g = /** @type {HTMLElement} */ (grp);
      const anyVisible = Array.from(
        g.querySelectorAll('.j-command-palette__item, [role="option"]'),
      ).some((node) => !/** @type {HTMLElement} */ (node).hidden);
      g.hidden = !anyVisible;
    });

    if (emptyEl) emptyEl.hidden = matchCount > 0;

    const vis = visibleItems();
    const cur = vis.find((i) => i.hasAttribute('data-highlighted'));
    setHighlight(cur || vis[0] || null, false);
  };

  const isOpen = () => {
    if (isInline) return true;
    return isDialog ? el.open : el.hasAttribute('open');
  };

  const open = () => {
    if (isInline) {
      input?.focus();
      return;
    }
    if (isDialog && !el.open) {
      el.showModal();
      input?.setAttribute('aria-expanded', 'true');
      if (input) {
        input.value = '';
        opts.onQueryChange?.('');
      }
      filterItems('');
      const vis = visibleItems();
      setHighlight(vis[0] || null, false);
      input?.focus();
      opts.onOpenChange?.(true);
    }
  };

  const close = () => {
    if (isInline) return;
    if (isDialog && el.open) {
      el.close();
      input?.setAttribute('aria-expanded', 'false');
      opts.onOpenChange?.(false);
    }
  };

  const toggle = () => {
    if (isOpen() && !isInline) close();
    else open();
  };

  /** @param {HTMLElement} item */
  const selectItem = (item) => {
    if (isDisabledItem(item)) return;
    const detail = {
      value: valueFor(item),
      label: labelFor(item),
      item,
    };
    opts.onSelect?.(detail);
    const ev = new CustomEvent('j-select', {
      bubbles: true,
      cancelable: true,
      detail,
    });
    const proceed = el.dispatchEvent(ev);
    const keepOpen = item.hasAttribute('data-keep-open');
    if (proceed && closeOnSelect && !keepOpen && !isInline) {
      close();
    }
  };

  const onInput = () => {
    const val = input?.value ?? '';
    opts.onQueryChange?.(val);
    filterItems(val);
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    const vis = visibleItems();
    const curIdx = vis.findIndex((i) => i.hasAttribute('data-highlighted'));

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!vis.length) break;
        const nextIdx = curIdx < vis.length - 1 ? curIdx + 1 : loop ? 0 : vis.length - 1;
        setHighlight(vis[nextIdx]);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!vis.length) break;
        const prevIdx = curIdx > 0 ? curIdx - 1 : loop ? vis.length - 1 : 0;
        setHighlight(vis[prevIdx]);
        break;
      }
      case 'Home': {
        if (vis.length) {
          e.preventDefault();
          setHighlight(vis[0]);
        }
        break;
      }
      case 'End': {
        if (vis.length) {
          e.preventDefault();
          setHighlight(vis[vis.length - 1]);
        }
        break;
      }
      case 'Enter': {
        if (curIdx >= 0 && vis[curIdx]) {
          e.preventDefault();
          selectItem(vis[curIdx]);
        }
        break;
      }
      case 'Escape': {
        if (isInline) {
          if (input && input.value) {
            e.preventDefault();
            input.value = '';
            opts.onQueryChange?.('');
            filterItems('');
          }
        } else if (dismissible && isDialog && el.open) {
          e.preventDefault();
          requestClose(el);
        }
        break;
      }
      default:
        break;
    }
  };

  /** @param {PointerEvent} e */
  const onListPointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    const item = /** @type {HTMLElement | null} */ (
      /** @type {Element} */ (e.target).closest('.j-command-palette__item, [role="option"]')
    );
    if (item && list?.contains(item) && !isDisabledItem(item)) {
      if (!item.hasAttribute('data-highlighted')) {
        setHighlight(item, false);
      }
    }
  };

  /** @param {MouseEvent} e */
  const onListClick = (e) => {
    const item = /** @type {HTMLElement | null} */ (
      /** @type {Element} */ (e.target).closest('.j-command-palette__item, [role="option"]')
    );
    if (item && list?.contains(item)) {
      selectItem(item);
      input?.focus();
    }
  };

  /** @param {PointerEvent} e */
  const onListPointerDown = (e) => {
    // Keep typing focus inside combobox input when clicking items
    if (input && e.target !== input) e.preventDefault();
  };

  const onDialogClose = () => {
    input?.setAttribute('aria-expanded', 'false');
    opts.onOpenChange?.(false);
  };

  /** @param {Event} e */
  const onDialogCancel = (e) => {
    if (!dismissible) e.preventDefault();
  };

  const onCloseClick = () => {
    if (isInline) {
      if (input) {
        input.value = '';
        opts.onQueryChange?.('');
        filterItems('');
        input.focus();
      }
    } else {
      close();
    }
  };

  const stopDismiss =
    isDialog && !isInline && dismissible ? lightDismiss(el) : null;

  const shortcutKey =
    opts.shortcut === false ? '' : opts.shortcut ?? el.dataset.shortcut ?? '';
  const stopShortcut =
    shortcutKey && !isInline ? bindCommandShortcut(shortcutKey, () => toggle()) : null;

  ensureItemIds();
  filterItems(input?.value ?? '');

  input?.addEventListener('input', onInput);
  input?.addEventListener('keydown', onKeyDown);
  list?.addEventListener('pointerdown', onListPointerDown);
  list?.addEventListener('pointermove', onListPointerMove);
  list?.addEventListener('click', onListClick);
  closeBtn?.addEventListener('click', onCloseClick);
  if (isDialog) {
    el.addEventListener('close', onDialogClose);
    el.addEventListener('cancel', onDialogCancel);
  }

  /** @type {CommandPaletteController} */
  const api = {
    open,
    close,
    toggle,
    isOpen,
    setQuery: (q) => {
      if (input) input.value = q;
      opts.onQueryChange?.(q);
      filterItems(q);
    },
    refresh: () => {
      ensureItemIds();
      filterItems(input?.value ?? '');
    },
    destroy: () => {
      stopDismiss?.();
      stopShortcut?.();
      input?.removeEventListener('input', onInput);
      input?.removeEventListener('keydown', onKeyDown);
      list?.removeEventListener('pointerdown', onListPointerDown);
      list?.removeEventListener('pointermove', onListPointerMove);
      list?.removeEventListener('click', onListClick);
      closeBtn?.removeEventListener('click', onCloseClick);
      if (isDialog) {
        el.removeEventListener('close', onDialogClose);
        el.removeEventListener('cancel', onDialogCancel);
      }
      controllers.delete(el);
    },
  };

  controllers.set(el, api);
  return api;
}

/**
 * Initialize all `.j-command-palette` elements inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initCommandPalettes(root = document) {
  /** @type {Array<() => void>} */
  const cleanups = [];
  if (
    typeof HTMLElement !== 'undefined' &&
    root instanceof HTMLElement &&
    root.matches('.j-command-palette')
  ) {
    const ctrl = createCommandPalette(root);
    cleanups.push(() => ctrl.destroy());
  }
  root.querySelectorAll('.j-command-palette').forEach((node) => {
    const ctrl = createCommandPalette(/** @type {HTMLElement} */ (node));
    cleanups.push(() => ctrl.destroy());
  });
  return () => cleanups.forEach((fn) => fn());
}
