// Combobox / Autocomplete behavior (WAI-ARIA 1.2 combobox + listbox).
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
 * @param {{
 *   multiple?: boolean,
 *   allowCustomValue?: boolean,
 *   freeSolo?: boolean,
 *   commitOnBlur?: boolean,
 *   creatable?: boolean | ((query: string) => string),
 *   filter?: boolean | ((option: { value: string, label: string, element: HTMLElement }, query: string) => boolean),
 *   debounce?: number,
 *   onCreate?: (value: string) => void,
 *   onSearchChange?: (query: string) => void,
 *   onSearch?: (query: string) => void,
 * }} [options]
 * @returns {() => void} cleanup
 */
export function createCombobox(shell, listbox, options = {}) {
  const input = /** @type {HTMLInputElement | null} */ (shell.querySelector('.j-combobox__input'));
  if (!input) return () => {};

  const clearBtn = /** @type {HTMLButtonElement | null} */ (shell.querySelector('.j-combobox__clear'));
  const chevronBtn = /** @type {HTMLButtonElement | null} */ (shell.querySelector('.j-combobox__chevron'));
  const emptyEl = /** @type {HTMLElement | null} */ (listbox.querySelector('.j-combobox__empty'));
  const loadingEl = /** @type {HTMLElement | null} */ (listbox.querySelector('.j-combobox__loading'));
  const multiple = Boolean(options.multiple || shell.hasAttribute('data-multiple'));
  const isFreeSolo = Boolean(
    options.allowCustomValue ||
      options.freeSolo ||
      shell.hasAttribute('data-allow-custom-value') ||
      shell.hasAttribute('data-free-solo'),
  );

  const commitOnBlurAttr = shell.getAttribute('data-commit-on-blur');
  const effectiveCommitOnBlur =
    options.commitOnBlur !== undefined
      ? Boolean(options.commitOnBlur)
      : commitOnBlurAttr !== null
        ? commitOnBlurAttr !== 'false'
        : !multiple && isFreeSolo;

  const hasCreatableAttr = shell.hasAttribute('data-creatable');
  const creatableAttr = shell.getAttribute('data-creatable');
  const creatable =
    options.creatable !== undefined
      ? options.creatable
      : hasCreatableAttr
        ? creatableAttr && creatableAttr !== 'true'
          ? (/** @type {string} */ q) => creatableAttr.replace(/\{query\}/g, q)
          : true
        : false;

  const filterAttr = shell.getAttribute('data-filter');
  const skipFilter = options.filter === false || filterAttr === 'false';
  const customFilter = typeof options.filter === 'function' ? options.filter : null;

  const debounceMs =
    options.debounce !== undefined
      ? Number(options.debounce) || 0
      : Number(shell.getAttribute('data-debounce')) || 0;

  if (!listbox.id) listbox.id = `j-cb-list-${++uid}`;
  if (!listbox.hasAttribute('popover')) listbox.setAttribute('popover', 'auto');
  if (!listbox.getAttribute('role')) listbox.setAttribute('role', 'listbox');
  if (multiple) listbox.setAttribute('aria-multiselectable', 'true');

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listbox.id);
  input.setAttribute('aria-expanded', 'false');

  const stopAnchor = anchorCombobox(shell, listbox);

  /** @type {HTMLElement | null} */
  let createEl = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let searchTimer = null;
  let isTyping = false;

  const clearSearchTimer = () => {
    if (searchTimer !== null) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
  };

  const emitSearchChange = (/** @type {string} */ query) => {
    options.onSearchChange?.(query);
    shell.dispatchEvent(
      new CustomEvent('j-search-change', {
        bubbles: true,
        detail: { query },
      }),
    );
  };

  const triggerSearch = (/** @type {string} */ query, immediate = false) => {
    clearSearchTimer();
    const fire = () => {
      options.onSearch?.(query);
      shell.dispatchEvent(
        new CustomEvent('j-search', {
          bubbles: true,
          detail: { query },
        }),
      );
    };
    if (immediate || debounceMs <= 0) {
      fire();
    } else {
      searchTimer = setTimeout(() => {
        searchTimer = null;
        fire();
      }, debounceMs);
    }
  };

  const allOptions = () =>
    /** @type {HTMLElement[]} */ ([...listbox.querySelectorAll('[role="option"]')]);

  const regularOptions = () =>
    allOptions().filter((opt) => opt !== createEl && !opt.hasAttribute('data-creatable-option'));

  regularOptions().forEach((opt) => {
    if (!opt.id) opt.id = `${listbox.id}-opt-${++uid}`;
    if (!opt.hasAttribute('aria-selected')) opt.setAttribute('aria-selected', 'false');
  });

  const labelFor = (/** @type {HTMLElement} */ opt) =>
    (opt.dataset.label || opt.querySelector('.j-combobox__option-label')?.textContent || opt.textContent || '').trim();

  const valueFor = (/** @type {HTMLElement} */ opt) => opt.dataset.value ?? labelFor(opt);

  /** @type {string | null} */
  let singleValue =
    regularOptions().find((o) => o.getAttribute('aria-selected') === 'true')?.dataset.value ??
    shell.dataset.value ??
    (isFreeSolo && input.value ? input.value : null);

  /** @type {string[]} */
  let multiValues = regularOptions()
    .filter((o) => o.getAttribute('aria-selected') === 'true')
    .map((o) => o.dataset.value || o.textContent?.trim() || '');

  const isDisabledOpt = (/** @type {HTMLElement} */ opt) =>
    opt.getAttribute('aria-disabled') === 'true' || opt.hasAttribute('disabled');

  const visibleOptions = () =>
    allOptions().filter((opt) => !opt.hidden && !isDisabledOpt(opt));

  const isLoading = () =>
    shell.hasAttribute('data-loading') ||
    listbox.getAttribute('aria-busy') === 'true' ||
    Boolean(loadingEl && !loadingEl.hidden);

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
      target.scrollIntoView?.({ block: 'nearest' });
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
      const opt = regularOptions().find((o) => valueFor(o) === val);
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
    regularOptions().forEach((opt) => {
      const v = valueFor(opt);
      const selected = multiple ? multiValues.includes(v) : singleValue === v;
      opt.setAttribute('aria-selected', String(selected));
    });
    if (!multiple && !isOpen() && !isTyping) {
      const sel = regularOptions().find((o) => valueFor(o) === singleValue);
      input.value = sel ? labelFor(sel) : (singleValue ?? '');
    }
    renderChips();
    syncClearButton();
  };

  const syncCreatableOption = (/** @type {string} */ query) => {
    if (!creatable || isLoading()) {
      if (createEl) {
        createEl.hidden = true;
        createEl.removeAttribute('data-highlighted');
      }
      return false;
    }
    const trimmed = query.trim();
    const lower = trimmed.toLowerCase();
    const exists =
      !trimmed ||
      regularOptions().some(
        (opt) => valueFor(opt).toLowerCase() === lower || labelFor(opt).toLowerCase() === lower,
      );
    if (exists) {
      if (createEl) {
        createEl.hidden = true;
        createEl.removeAttribute('data-highlighted');
      }
      return false;
    }

    if (!createEl) {
      createEl = listbox.ownerDocument.createElement('div');
      createEl.id = `${listbox.id}-opt-create-${++uid}`;
      createEl.className = 'j-combobox__option j-combobox__create';
      createEl.setAttribute('role', 'option');
      createEl.setAttribute('aria-selected', 'false');
      createEl.setAttribute('data-creatable-option', '');
      createEl.innerHTML =
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>' +
        '<div class="j-combobox__option-body"><span class="j-combobox__option-label"></span></div>';
      if (emptyEl && emptyEl.parentNode === listbox) {
        listbox.insertBefore(createEl, emptyEl);
      } else {
        listbox.appendChild(createEl);
      }
    }
    createEl.dataset.value = trimmed;
    const lblText = typeof creatable === 'function' ? creatable(trimmed) : `Create "${trimmed}"`;
    const lblNode = createEl.querySelector('.j-combobox__option-label');
    if (lblNode) lblNode.textContent = lblText;
    createEl.hidden = false;
    return true;
  };

  const filterList = (/** @type {string} */ query, preserveNullHighlight = false) => {
    const q = query.trim().toLowerCase();
    let count = 0;
    regularOptions().forEach((opt) => {
      if (!opt.id) opt.id = `${listbox.id}-opt-${++uid}`;
      let match = true;
      if (!skipFilter && q) {
        if (customFilter) {
          match = customFilter({ value: valueFor(opt), label: labelFor(opt), element: opt }, query);
        } else {
          const hay = `${labelFor(opt)} ${opt.textContent || ''}`.toLowerCase();
          match = hay.includes(q);
        }
      }
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

    const hasCreatable = syncCreatableOption(isTyping ? query : '');
    if (emptyEl) emptyEl.hidden = count > 0 || hasCreatable || isLoading();

    const vis = visibleOptions();
    if (preserveNullHighlight) {
      setHighlight(hasCreatable && count === 0 ? createEl : null);
      return;
    }
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

  const dispatchCreate = (/** @type {string} */ val) => {
    options.onCreate?.(val);
    shell.dispatchEvent(
      new CustomEvent('j-create', {
        bubbles: true,
        detail: { value: val },
      }),
    );
  };

  const commitCustomValue = (/** @type {string} */ raw, emitCreateIfNew = false) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (emitCreateIfNew && creatable && !isLoading()) {
      const lower = trimmed.toLowerCase();
      const exists = regularOptions().some(
        (opt) => valueFor(opt).toLowerCase() === lower || labelFor(opt).toLowerCase() === lower,
      );
      if (!exists) dispatchCreate(trimmed);
    }
    clearSearchTimer();
    isTyping = false;
    if (multiple) {
      if (!multiValues.includes(trimmed)) {
        multiValues = [...multiValues, trimmed];
      }
      input.value = '';
      emitSearchChange('');
      filterList('', isFreeSolo);
      syncSelection();
      dispatchChange();
    } else {
      singleValue = trimmed;
      const sel = regularOptions().find((o) => valueFor(o) === singleValue);
      input.value = sel ? labelFor(sel) : singleValue;
      emitSearchChange('');
      syncSelection();
      dispatchChange();
      close();
    }
  };

  /** @param {HTMLElement} opt */
  const selectOption = (opt) => {
    if (isDisabledOpt(opt)) return;
    if (opt === createEl || opt.hasAttribute('data-creatable-option')) {
      const createdVal = (opt.dataset.value || '').trim();
      if (!createdVal) return;
      dispatchCreate(createdVal);
      commitCustomValue(createdVal, false);
      return;
    }
    clearSearchTimer();
    isTyping = false;
    const val = valueFor(opt);
    if (multiple) {
      if (multiValues.includes(val)) multiValues = multiValues.filter((v) => v !== val);
      else multiValues = [...multiValues, val];
      input.value = '';
      emitSearchChange('');
      filterList('', isFreeSolo);
      syncSelection();
      dispatchChange();
    } else {
      singleValue = val;
      input.value = labelFor(opt);
      emitSearchChange('');
      syncSelection();
      dispatchChange();
      close();
    }
  };

  const commitPendingIfNeeded = () => {
    if (isTyping && effectiveCommitOnBlur) {
      const trimmed = input.value.trim();
      if (trimmed) {
        commitCustomValue(trimmed, true);
        return true;
      }
    }
    return false;
  };

  syncSelection();

  const onToggle = (/** @type {Event} */ e) => {
    const opened = /** @type {ToggleEvent} */ (e).newState === 'open';
    input.setAttribute('aria-expanded', String(opened));
    if (opened) {
      filterList(isTyping ? input.value : '', isTyping && isFreeSolo);
      if (!isTyping) {
        const sel = visibleOptions().find((o) => o.getAttribute('aria-selected') === 'true');
        setHighlight(sel || (isFreeSolo ? null : visibleOptions()[0]) || null);
      }
    } else {
      setHighlight(null);
      if (commitPendingIfNeeded()) return;
      isTyping = false;
      clearSearchTimer();
      if (!multiple) {
        const sel = regularOptions().find((o) => valueFor(o) === singleValue);
        input.value = sel ? labelFor(sel) : (singleValue ?? '');
      } else {
        if (input.value) emitSearchChange('');
        input.value = '';
      }
      if (createEl) createEl.hidden = true;
      syncClearButton();
    }
  };

  const onInput = () => {
    isTyping = true;
    emitSearchChange(input.value);
    triggerSearch(input.value, false);
    if (!isOpen()) open();
    filterList(input.value, isFreeSolo);
    syncClearButton();
  };

  const onBlur = (/** @type {FocusEvent} */ e) => {
    const next = /** @type {Node | null} */ (e.relatedTarget);
    if (next && (shell.contains(next) || listbox.contains(next))) return;
    if (commitPendingIfNeeded()) return;
    if (isTyping) {
      isTyping = false;
      clearSearchTimer();
      if (!multiple) {
        const sel = regularOptions().find((o) => valueFor(o) === singleValue);
        input.value = sel ? labelFor(sel) : (singleValue ?? '');
      } else {
        if (input.value) emitSearchChange('');
        input.value = '';
      }
      syncClearButton();
    }
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    const vis = visibleOptions();
    const curIdx = vis.findIndex((o) => o.hasAttribute('data-highlighted'));
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen()) {
          open();
          const afterVis = visibleOptions();
          setHighlight(afterVis[0] || null);
        } else if (vis.length) {
          setHighlight(vis[curIdx < vis.length - 1 ? curIdx + 1 : 0]);
        }
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
        } else if (isFreeSolo && input.value.trim()) {
          e.preventDefault();
          commitCustomValue(input.value, true);
        }
        break;
      case 'Escape':
        if (isOpen() || isTyping) {
          e.preventDefault();
          e.stopPropagation();
          isTyping = false;
          clearSearchTimer();
          if (!multiple) {
            const sel = regularOptions().find((o) => valueFor(o) === singleValue);
            input.value = sel ? labelFor(sel) : (singleValue ?? '');
          } else {
            input.value = '';
          }
          close();
          syncClearButton();
        }
        break;
      case 'Tab':
        commitPendingIfNeeded();
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
    clearSearchTimer();
    isTyping = false;
    const hadInput = input.value.length > 0;
    if (multiple) multiValues = [];
    else singleValue = null;
    input.value = '';
    emitSearchChange('');
    if (hadInput) triggerSearch('', true);
    filterList('', isFreeSolo);
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

  /** @type {MutationObserver | null} */
  let loadingObserver = null;
  if (typeof MutationObserver !== 'undefined') {
    loadingObserver = new MutationObserver(() => {
      if (isOpen()) {
        filterList(isTyping ? input.value : '', isTyping && isFreeSolo);
      }
    });
    loadingObserver.observe(shell, { attributes: true, attributeFilter: ['data-loading'] });
    loadingObserver.observe(listbox, { attributes: true, attributeFilter: ['aria-busy'] });
    if (loadingEl) {
      loadingObserver.observe(loadingEl, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  shell.addEventListener('click', onShellClick);
  input.addEventListener('input', onInput);
  input.addEventListener('blur', onBlur);
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
    clearSearchTimer();
    loadingObserver?.disconnect();
    stopAnchor();
    createEl?.remove();
    shell.removeEventListener('click', onShellClick);
    input.removeEventListener('input', onInput);
    input.removeEventListener('blur', onBlur);
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
