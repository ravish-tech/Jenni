// Jenni — Dropdown menu behavior (WAI-ARIA menu button pattern).
// Markup:
//   <button popovertarget="menu-1">Options</button>
//   <div class="j-menu" id="menu-1" popover role="menu" data-align="start">
//     <div class="j-menu__label">Account</div>
//     <button class="j-menu__item" role="menuitem">Profile <kbd class="j-menu__shortcut">⌘P</kbd></button>
//     <hr class="j-menu__separator">
//     <button class="j-menu__item" role="menuitemcheckbox" aria-checked="true">…</button>
//     <button class="j-menu__item" role="menuitem" data-tone="danger">Delete</button>
//   </div>
// Native popover gives open/close, Escape and light-dismiss. This adds
// arrow keys, Home/End, typeahead, Tab-to-close, pointer highlight,
// checkbox/radio toggling and a `j-select` event on activation.

import { anchorPopover } from './anchor.js';

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/** @param {Element} el */
const isDisabled = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/**
 * @typedef {{ side?: string, loop?: boolean, manageChecked?: boolean }} MenuOptions
 */

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
  menu.tabIndex = -1;
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  if (menu.id) trigger.setAttribute('aria-controls', menu.id);
  if (trigger instanceof HTMLButtonElement && !trigger.popoverTargetElement) {
    trigger.popoverTargetElement = menu;
  }
  const stopAnchor = anchorPopover(trigger, menu, { side: options.side || 'bottom' });

  /** @type {'first' | 'last' | null} */
  let pendingFocus = null;
  let typed = '';
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let typedTimer;

  const items = () => /** @type {HTMLElement[]} */ (
    [...menu.querySelectorAll(ITEM)].filter((el) => !isDisabled(el) && /** @type {HTMLElement} */ (el).offsetParent !== null)
  );

  /** @param {HTMLElement | undefined} el */
  const focus = (el) => el?.focus({ preventScroll: false });
  const isOpen = () => menu.matches(':popover-open');
  const open = (/** @type {'first' | 'last'} */ where) => {
    pendingFocus = where;
    if (isOpen()) focus(where === 'first' ? items()[0] : items().at(-1));
    else menu.showPopover();
  };
  const close = (restore = true) => {
    if (isOpen()) menu.hidePopover();
    if (restore) trigger.focus({ preventScroll: true });
  };

  const onToggle = (/** @type {Event} */ e) => {
    const opened = /** @type {ToggleEvent} */ (e).newState === 'open';
    trigger.setAttribute('aria-expanded', String(opened));
    if (opened) {
      // Items are reachable by arrow keys only (roving focus), never by Tab.
      menu.querySelectorAll(ITEM).forEach((el) => { /** @type {HTMLElement} */ (el).tabIndex = -1; });
      const list = items();
      if (pendingFocus === 'first') focus(list[0]);
      else if (pendingFocus === 'last') focus(list.at(-1));
      else menu.focus({ preventScroll: true });
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
    if (isDisabled(item)) { e.preventDefault(); return; }
    const role = item.getAttribute('role');
    if (manageChecked && role === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
    } else if (manageChecked && role === 'menuitemradio') {
      const group = item.closest('[role="group"]') || menu;
      group.querySelectorAll('[role="menuitemradio"]').forEach((r) => r.setAttribute('aria-checked', String(r === item)));
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
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest(ITEM));
    if (item && !isDisabled(item) && document.activeElement !== item) item.focus({ preventScroll: true });
    else if (!item && menu.contains(document.activeElement) && document.activeElement !== menu) menu.focus({ preventScroll: true });
  };
  const onPointerLeave = () => {
    if (menu.contains(document.activeElement)) menu.focus({ preventScroll: true });
  };

  trigger.addEventListener('keydown', onTriggerKey);
  menu.addEventListener('toggle', onToggle);
  menu.addEventListener('keydown', onMenuKey);
  menu.addEventListener('click', onMenuClick);
  menu.addEventListener('pointermove', onPointerMove);
  menu.addEventListener('pointerleave', onPointerLeave);

  return () => {
    clearTimeout(typedTimer);
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
 * Init every trigger whose `popovertarget` points to a `.j-menu`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initMenus(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('[popovertarget]').forEach((el) => {
    const trigger = /** @type {HTMLElement} */ (el);
    const menu = document.getElementById(trigger.getAttribute('popovertarget') || '');
    if (!menu || !menu.classList.contains('j-menu') || bound.has(trigger)) return;
    bound.set(trigger, createMenu(trigger, menu));
    made.push(trigger);
  });
  return () => made.forEach((t) => {
    bound.get(t)?.();
    bound.delete(t);
  });
}
