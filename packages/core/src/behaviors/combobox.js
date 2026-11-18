// Jenni — Combobox / Autocomplete behavior (WAI-ARIA 1.2 combobox + listbox).
// Keeps keyboard focus inside `.j-combobox__input` while navigating options via
// `data-highlighted` and `aria-activedescendant`. Anchors `.j-combobox__listbox`
// to `.j-combobox` via `anchorPopover`.

import { anchorPopover } from './anchor.js';

let uid = 0;

/**
 * Anchor a combobox listbox to its `.j-combobox` shell and expose `--_anchor-w`
 * so browsers without `anchor-size(width)` still match the shell width cleanly.
 * @param {HTMLElement} shell
 * @param {HTMLElement} listbox
 * @param {{ side?: string }} [options]
 * @returns {() => void} cleanup
 */
export function anchorCombobox(shell, listbox, options = {}) {
  if (!shell.dataset.align && !listbox.dataset.align) listbox.dataset.align = 'start';
  const syncWidth = () => {
    const w = Math.round(shell.getBoundingClientRect().width);
    if (w > 0) listbox.style.setProperty('--_anchor-w', `${w}px`);
  };
  const onToggle = (/** @type {Event} */ e) => {
    if (/** @type {ToggleEvent} */ (e).newState === 'open') syncWidth();
  };
  syncWidth();
  listbox.addEventListener('toggle', onToggle);
  window.addEventListener('resize', syncWidth, { passive: true });
  const stopAnchor = anchorPopover(shell, listbox, { side: options.side || 'bottom' });
  return () => {
    stopAnchor();
    listbox.removeEventListener('toggle', onToggle);
    window.removeEventListener('resize', syncWidth);
  };
}

/**
 * Connect a plain-HTML `.j-combobox` shell and `.j-combobox__listbox`.
 * @param {HTMLElement} shell
 * @param {HTMLElement} listbox
 * @returns {() => void} cleanup
 */
export function createCombobox(shell, listbox) {
  const input = /** @type {HTMLInputElement | null} */ (shell.querySelector('.j-combobox__input'));
  if (!input) return () => {};

  const clearBtn = /** @type {HTMLButtonElement | null} */ (shell.querySelector('.j-combobox__clear'));
  const chevronBtn = /** @type {HTMLButtonElement | null} */ (shell.querySelector('.j-combobox__chevron'));
  const emptyEl = /** @type {HTMLElement | null} */ (listbox.querySelector('.j-combobox__empty'));
  const multiple = shell.hasAttribute('data-multiple');

  if (!listbox.id) listbox.id = `j-cb-list-${++uid}`;
  if (!listbox.hasAttribute('popover')) listbox.setAttribute('popover', 'auto');
  if (!listbox.getAttribute('role')) listbox.setAttribute('role', 'listbox');
  if (multiple) listbox.setAttribute('aria-multiselectable', 'true');

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listbox.id);
  input.setAttribute('aria-expanded', 'false');

  const stopAnchor = anchorCombobox(shell, listbox);

  const allOptions = () =>
    /** @type {HTMLElement[]} */ ([...listbox.querySelectorAll('[role="option"]')]);

  allOptions().forEach((opt) => {
    if (!opt.id) opt.id = `${listbox.id}-opt-${++uid}`;
    if (!opt.hasAttribute('aria-selected')) opt.setAttribute('aria-selected', 'false');
  });

  /** @type {string | null} */
  let singleValue =
    allOptions().find((o) => o.getAttribute('aria-selected') === 'true')?.dataset.value ?? null;
  /** @type {string[]} */
  let multiValues = allOptions()
    .filter((o) => o.getAttribute('aria-selected') === 'true')
    .map((o) => o.dataset.value || o.textContent?.trim() || '');

  const labelFor = (/** @type {HTMLElement} */ opt) =>
    (opt.dataset.label || opt.querySelector('.j-combobox__option-label')?.textContent || opt.textContent || '').trim();

  const valueFor = (/** @type {HTMLElement} */ opt) => opt.dataset.value ?? labelFor(opt);

  const isDisabledOpt = (/** @type {HTMLElement} */ opt) =>
    opt.getAttribute('aria-disabled') === 'true' || opt.hasAttribute('disabled');

  const visibleOptions = () =>
    allOptions().filter((opt) => !opt.hidden && !isDisabledOpt(opt));

  const isOpen = () => listbox.matches(':popover-open');
  const open = () => {
    if (!input.disabled && !isOpen()) {
      try { listbox.showPopover(); } catch { /* ignore */ }
    }
  };
  const close = () => {
    if (isOpen()) {
      try { listbox.hidePopover(); } catch { /* ignore */ }
    }
  };

  /** @param {HTMLElement | null | undefined} target */
  const setHighlight = (target) => {
    allOptions().forEach((opt) => {
      if (opt === target) opt.setAttribute('data-highlighted', '');
      else opt.removeAttribute('data-highlighted');
    });
    if (target?.id) {
      input.setAttribute('aria-activedescendant', target.id);
      target.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const syncClearButton = () => {
    if (!clearBtn) return;
    const has = multiple ? multiValues.length > 0 || input.value.length > 0 : Boolean(singleValue || input.value);
    clearBtn.hidden = !has || input.disabled;
  };

  const renderChips = () => {
    if (!multiple) return;
    let holder = /** @type {HTMLElement | null} */ (shell.querySelector('.j-combobox__chips'));
    if (!holder) {
      holder = document.createElement('span');
      holder.className = 'j-combobox__chips';
      shell.insertBefore(holder, input);
    }
    holder.innerHTML = '';
    multiValues.forEach((val) => {
      const opt = allOptions().find((o) => valueFor(o) === val);
      const chip = document.createElement('span');
      chip.className = 'j-combobox__chip';
      const lbl = document.createElement('span');
      lbl.className = 'j-combobox__chip-label';
      lbl.textContent = opt ? labelFor(opt) : val;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.tabIndex = -1;
      rm.className = 'j-combobox__chip-remove';
      rm.setAttribute('aria-label', `Remove ${lbl.textContent}`);
      rm.innerHTML =
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
      rm.addEventListener('pointerdown', (e) => e.preventDefault());
      rm.addEventListener('click', (e) => {
        e.stopPropagation();
        multiValues = multiValues.filter((v) => v !== val);
        syncSelection();
        dispatchChange();
      });
      chip.append(lbl, rm);
      holder.appendChild(chip);
    });
  };

  const syncSelection = () => {
    allOptions().forEach((opt) => {
      const v = valueFor(opt);
      const selected = multiple ? multiValues.includes(v) : singleValue === v;
      opt.setAttribute('aria-selected', String(selected));
    });
    if (!multiple && !isOpen()) {
      const sel = allOptions().find((o) => valueFor(o) === singleValue);
      input.value = sel ? labelFor(sel) : '';
    }
    renderChips();
    syncClearButton();
  };

  const filterList = (/** @type {string} */ query) => {
    const q = query.trim().toLowerCase();
    let count = 0;
    allOptions().forEach((opt) => {
      const hay = `${labelFor(opt)} ${opt.textContent || ''}`.toLowerCase();
      const match = !q || hay.includes(q);
      opt.hidden = !match;
      if (match) count += 1;
    });
    listbox.querySelectorAll('.j-combobox__group').forEach((grp) => {
      const g = /** @type {HTMLElement} */ (grp);
      const anyVisible = [...g.querySelectorAll('[role="option"]')].some(
        (o) => !/** @type {HTMLElement} */ (o).hidden,
      );
      g.hidden = !anyVisible;
    });
    if (emptyEl) emptyEl.hidden = count > 0;
    const vis = visibleOptions();
    const current = vis.find((o) => o.hasAttribute('data-highlighted'));
    setHighlight(current || vis[0] || null);
  };

  const dispatchChange = () => {
    shell.dispatchEvent(
      new CustomEvent('j-change', {
        bubbles: true,
        detail: { value: multiple ? multiValues.slice() : singleValue },
      }),
    );
  };

  /** @param {HTMLElement} opt */
  const selectOption = (opt) => {
    if (isDisabledOpt(opt)) return;
    const val = valueFor(opt);
    if (multiple) {
      if (multiValues.includes(val)) multiValues = multiValues.filter((v) => v !== val);
      else multiValues = [...multiValues, val];
      input.value = '';
      filterList('');
      syncSelection();
      dispatchChange();
    } else {
      singleValue = val;
      input.value = labelFor(opt);
      syncSelection();
      dispatchChange();
      close();
    }
  };

  syncSelection();

  const onToggle = (/** @type {Event} */ e) => {
    const opened = /** @type {ToggleEvent} */ (e).newState === 'open';
    input.setAttribute('aria-expanded', String(opened));
    if (opened) {
      filterList('');
      const sel = visibleOptions().find((o) => o.getAttribute('aria-selected') === 'true');
      setHighlight(sel || visibleOptions()[0] || null);
    } else {
      setHighlight(null);
      if (!multiple) {
        const sel = allOptions().find((o) => valueFor(o) === singleValue);
        input.value = sel ? labelFor(sel) : '';
      } else {
        input.value = '';
      }
      syncClearButton();
    }
  };

  const onInput = () => {
    if (!isOpen()) open();
    filterList(input.value);
    syncClearButton();
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    const vis = visibleOptions();
    const curIdx = vis.findIndex((o) => o.hasAttribute('data-highlighted'));
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen()) open();
        else if (vis.length) setHighlight(vis[curIdx < vis.length - 1 ? curIdx + 1 : 0]);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen()) {
          open();
          const afterVis = visibleOptions();
          setHighlight(afterVis.at(-1) || null);
        } else if (vis.length) {
          setHighlight(vis[curIdx > 0 ? curIdx - 1 : vis.length - 1]);
        }
        break;
      case 'Home':
        if (isOpen() && vis.length) {
          e.preventDefault();
          setHighlight(vis[0]);
        }
        break;
      case 'End':
        if (isOpen() && vis.length) {
          e.preventDefault();
          setHighlight(vis.at(-1) || null);
        }
        break;
      case 'Enter':
        if (isOpen() && curIdx >= 0) {
          e.preventDefault();
          selectOption(vis[curIdx]);
        }
        break;
      case 'Escape':
        if (isOpen()) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
        break;
      case 'Tab':
        if (isOpen()) close();
        break;
      case 'Backspace':
        if (multiple && !input.value && multiValues.length > 0) {
          multiValues = multiValues.slice(0, -1);
          syncSelection();
          dispatchChange();
        }
        break;
      default:
        break;
    }
  };

  const onShellClick = (/** @type {MouseEvent} */ e) => {
    if (input.disabled) return;
    if (/** @type {Element} */ (e.target).closest('.j-combobox__clear, .j-combobox__chevron, .j-combobox__chip-remove')) return;
    input.focus();
    open();
  };

  const onChevronDown = (/** @type {PointerEvent} */ e) => e.preventDefault();
  const onChevronClick = () => {
    if (input.disabled) return;
    input.focus();
    if (isOpen()) close();
    else open();
  };

  const onClearDown = (/** @type {PointerEvent} */ e) => e.preventDefault();
  const onClearClick = () => {
    if (input.disabled) return;
    if (multiple) multiValues = [];
    else singleValue = null;
    input.value = '';
    filterList('');
    syncSelection();
    dispatchChange();
    input.focus();
  };

  const onListboxDown = (/** @type {PointerEvent} */ e) => e.preventDefault();
  const onListboxMove = (/** @type {PointerEvent} */ e) => {
    if (e.pointerType === 'touch') return;
    const opt = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[role="option"]'));
    if (opt && !isDisabledOpt(opt) && !opt.hasAttribute('data-highlighted')) {
      setHighlight(opt);
    }
  };
  const onListboxClick = (/** @type {MouseEvent} */ e) => {
    const opt = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[role="option"]'));
    if (opt && listbox.contains(opt)) selectOption(opt);
  };

  shell.addEventListener('click', onShellClick);
  input.addEventListener('input', onInput);
  input.addEventListener('keydown', onKeyDown);
  chevronBtn?.addEventListener('pointerdown', onChevronDown);
  chevronBtn?.addEventListener('click', onChevronClick);
  clearBtn?.addEventListener('pointerdown', onClearDown);
  clearBtn?.addEventListener('click', onClearClick);
  listbox.addEventListener('toggle', onToggle);
  listbox.addEventListener('pointerdown', onListboxDown);
  listbox.addEventListener('pointermove', onListboxMove);
  listbox.addEventListener('click', onListboxClick);

  return () => {
    stopAnchor();
    shell.removeEventListener('click', onShellClick);
    input.removeEventListener('input', onInput);
    input.removeEventListener('keydown', onKeyDown);
    chevronBtn?.removeEventListener('pointerdown', onChevronDown);
    chevronBtn?.removeEventListener('click', onChevronClick);
    clearBtn?.removeEventListener('pointerdown', onClearDown);
    clearBtn?.removeEventListener('click', onClearClick);
    listbox.removeEventListener('toggle', onToggle);
    listbox.removeEventListener('pointerdown', onListboxDown);
    listbox.removeEventListener('pointermove', onListboxMove);
    listbox.removeEventListener('click', onListboxClick);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every `[data-j-combobox]` shell inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initComboboxes(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  const doc = root instanceof Document ? root : root.ownerDocument || document;
  root.querySelectorAll('[data-j-combobox]').forEach((el) => {
    const shell = /** @type {HTMLElement} */ (el);
    if (bound.has(shell)) return;
    const listId = shell.dataset.jCombobox || shell.querySelector('.j-combobox__input')?.getAttribute('aria-controls') || '';
    const listbox = listId ? doc.getElementById(listId) : /** @type {HTMLElement | null} */ (shell.nextElementSibling);
    if (!listbox || !listbox.classList.contains('j-combobox__listbox')) return;
    bound.set(shell, createCombobox(shell, listbox));
    made.push(shell);
  });
  return () => {
    made.forEach((shell) => {
      bound.get(shell)?.();
      bound.delete(shell);
    });
  };
}
