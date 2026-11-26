// Data Table & Collapsible Section behavior — sorting, row selection, live filter,
// collapsible section groups, and ArrowUp/ArrowDown roving row focus.

/**
 * Parse a cell's comparable value (numeric-aware for currency/percent/commas).
 * @param {HTMLTableCellElement | undefined} cell
 * @returns {number | string}
 */
function readSortValue(cell) {
  if (!cell) return '';
  const raw = (cell.dataset.sortValue ?? cell.textContent ?? '').trim();
  if (!raw) return '';
  const stripped = raw.replace(/[$€£¥,%+\s,]/g, '');
  if (/^-?\d+(\.\d+)?$/.test(stripped)) {
    const num = Number(stripped);
    if (!Number.isNaN(num)) return num;
  }
  return raw.toLowerCase();
}

/**
 * Check whether keyboard arrow events originating at `target` should remain inside an editable control.
 * @param {Element | null} target
 * @returns {boolean}
 */
function isEditableArrowTarget(target) {
  if (!target) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  if (
    target.closest(
      'textarea, select, [contenteditable="true"], [contenteditable=""], [role="combobox"], [role="listbox"], [role="menu"]',
    )
  ) {
    return true;
  }
  const input = target.closest('input');
  if (input) {
    const t = (input.getAttribute('type') || 'text').toLowerCase();
    if (t !== 'checkbox' && t !== 'radio') return true;
  }
  return false;
}

/**
 * SSR-safe check for HTMLElement-like nodes.
 * @param {unknown} node
 * @returns {node is HTMLElement}
 */
function isElementLike(node) {
  if (typeof HTMLElement !== 'undefined') return node instanceof HTMLElement;
  return Boolean(node && typeof node === 'object' && ('tagName' in node || 'nodeType' in node));
}

/**
 * Collect visible (`:not([hidden])`) interactive row focus stops across a `<table class="j-table">`.
 * Includes `.j-table__section-btn` triggers, focusable `tr[tabindex]` rows, and rows with interactive controls.
 * @param {HTMLTableElement} table
 * @returns {Array<{ row: HTMLTableRowElement, focusEl: HTMLElement }>}
 */
export function getVisibleRovingTargets(table) {
  /** @type {Array<{ row: HTMLTableRowElement, focusEl: HTMLElement }>} */
  const stops = [];
  const bodies = table.tBodies ? [...table.tBodies] : [];
  for (const tbody of bodies) {
    if (tbody.hidden) continue;
    const rows = [...tbody.rows];
    for (const row of rows) {
      if (row.hidden || row.hasAttribute('hidden') || row.hasAttribute('data-empty')) continue;

      if (row.classList.contains('j-table__section-row')) {
        const btn = row.querySelector('.j-table__section-btn:not(:disabled)');
        if (isElementLike(btn) && btn.getAttribute?.('aria-disabled') !== 'true') {
          stops.push({ row, focusEl: btn });
        }
        continue;
      }

      if (row.hasAttribute('tabindex')) {
        stops.push({ row, focusEl: row });
        continue;
      }

      const interactive = row.querySelector(
        'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (isElementLike(interactive)) {
        stops.push({ row, focusEl: interactive });
      }
    }
  }
  return stops;
}

/**
 * Bind `ArrowDown` / `ArrowUp` roving focus across visible interactive rows and section buttons.
 * @param {HTMLTableElement} table
 * @returns {() => void} cleanup
 */
export function bindTableRovingFocus(table) {
  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    if (e.defaultPrevented) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

    const target = e.target instanceof Element ? e.target : null;
    if (!target || isEditableArrowTarget(target)) return;

    const stops = getVisibleRovingTargets(table);
    if (stops.length === 0) return;

    const currentIdx = stops.findIndex(
      ({ row, focusEl }) => focusEl === target || row === target || row.contains(target),
    );
    if (currentIdx === -1) return;

    const delta = e.key === 'ArrowDown' ? 1 : -1;
    const nextIdx = currentIdx + delta;
    if (nextIdx < 0 || nextIdx >= stops.length) return;

    e.preventDefault();
    const prevStop = stops[currentIdx];
    const nextStop = stops[nextIdx];
    if (prevStop.focusEl === prevStop.row && prevStop.row.hasAttribute('tabindex')) {
      prevStop.row.setAttribute('tabindex', '-1');
    }
    if (nextStop.focusEl === nextStop.row && nextStop.row.hasAttribute('tabindex')) {
      nextStop.row.setAttribute('tabindex', '0');
    }
    nextStop.focusEl.focus();
  };

  table.addEventListener('keydown', onKeyDown);
  return () => {
    table.removeEventListener('keydown', onKeyDown);
  };
}

/**
 * Sync a plain-HTML `.j-table__section-row` and its `[data-section-parent="<id>"]` child rows.
 * @param {HTMLTableElement} table
 * @param {HTMLTableRowElement} sectionRow
 * @param {boolean} expanded
 */
function syncSectionRow(table, sectionRow, expanded) {
  const sectionId = sectionRow.dataset.sectionId;
  if (expanded) {
    sectionRow.setAttribute('data-expanded', '');
  } else {
    sectionRow.removeAttribute('data-expanded');
  }
  const btn = sectionRow.querySelector('.j-table__section-btn');
  if (btn) {
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }
  if (!sectionId) return;
  for (const tbody of [...table.tBodies]) {
    for (const row of [...tbody.rows]) {
      if (row.dataset.sectionParent === sectionId) {
        row.hidden = !expanded;
      }
    }
  }
}

/**
 * Wire collapsible section rows (`tr.j-table__section-row[data-section-id]`) + roving focus on a table or wrapper.
 * @param {HTMLElement} root
 * @param {{ onToggle?: () => void }} [hooks]
 * @returns {() => void} cleanup
 */
export function createCollapsibleTable(root, hooks) {
  if (root.hasAttribute('data-j-managed')) return () => {};

  const table = root.matches('table.j-table')
    ? /** @type {HTMLTableElement} */ (root)
    : /** @type {HTMLTableElement | null} */ (root.querySelector('table.j-table'));
  if (!table) return () => {};

  const sectionRows = /** @type {HTMLTableRowElement[]} */ (
    [...table.querySelectorAll('tr.j-table__section-row')]
  );

  sectionRows.forEach((sectionRow) => {
    const btn = sectionRow.querySelector('.j-table__section-btn');
    const isExpanded =
      sectionRow.hasAttribute('data-expanded') || btn?.getAttribute('aria-expanded') === 'true';
    syncSectionRow(table, sectionRow, isExpanded);
  });

  /** @param {MouseEvent} event */
  const onClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest('.j-table__section-btn');
    if (!(btn instanceof HTMLElement)) return;
    if (
      ('disabled' in btn && Boolean(/** @type {HTMLButtonElement} */ (btn).disabled)) ||
      btn.hasAttribute('disabled') ||
      btn.getAttribute('aria-disabled') === 'true'
    ) {
      return;
    }
    const sectionRow = btn.closest('tr.j-table__section-row');
    if (!(sectionRow instanceof HTMLTableRowElement) || sectionRow.closest('table') !== table) {
      return;
    }

    const currentlyExpanded =
      sectionRow.hasAttribute('data-expanded') || btn.getAttribute('aria-expanded') === 'true';
    const next = !currentlyExpanded;
    syncSectionRow(table, sectionRow, next);
    hooks?.onToggle?.();

    root.dispatchEvent(
      new CustomEvent('j-section-toggle', {
        bubbles: true,
        detail: { id: sectionRow.dataset.sectionId ?? '', expanded: next },
      }),
    );
  };

  const stopRoving = bindTableRovingFocus(table);
  table.addEventListener('click', onClick);

  return () => {
    stopRoving();
    table.removeEventListener('click', onClick);
  };
}

/** @type {WeakMap<HTMLTableElement, () => void>} */
const boundCollapsible = new WeakMap();

/**
 * Init collapsible section rows and `ArrowUp`/`ArrowDown` roving focus across `.j-table` instances in `root`. Idempotent.
 * @param {ParentNode} [root=document]
 * @returns {() => void} cleanup
 */
export function initCollapsibleTables(root = document) {
  /** @type {HTMLTableElement[]} */
  const made = [];
  root.querySelectorAll('table.j-table').forEach((el) => {
    const table = /** @type {HTMLTableElement} */ (el);
    const host = /** @type {HTMLElement} */ (
      table.closest('.j-data-table, .j-table-wrap') ?? table
    );
    if (host.hasAttribute('data-j-managed') || table.hasAttribute('data-j-managed')) return;
    if (boundCollapsible.has(table)) return;
    boundCollapsible.set(table, createCollapsibleTable(host));
    made.push(table);
  });
  return () =>
    made.forEach((table) => {
      boundCollapsible.get(table)?.();
      boundCollapsible.delete(table);
    });
}

/**
 * Wire one `.j-data-table` or `.j-table-wrap` root for plain-HTML progressive enhancement.
 * Skips framework-managed roots (`[data-j-managed]`).
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function createDataTable(root) {
  if (root.hasAttribute('data-j-managed')) return () => {};

  const table = root.matches('table.j-table')
    ? /** @type {HTMLTableElement} */ (root)
    : /** @type {HTMLTableElement | null} */ (root.querySelector('table.j-table'));
  if (!table) return () => {};

  const thead = table.tHead;
  const tbody = table.tBodies[0];
  if (!tbody) return () => {};

  const searchInput = /** @type {HTMLInputElement | null} */ (
    root.querySelector('[data-table-search], .j-data-table__search input')
  );
  const selectAllBox = /** @type {HTMLInputElement | null} */ (
    thead?.querySelector('input[type="checkbox"][data-select-all], .j-table__check input[type="checkbox"]') ?? null
  );

  /** @returns {HTMLTableRowElement[]} */
  const getDataRows = () =>
    /** @type {HTMLTableRowElement[]} */ (
      [...tbody.rows].filter(
        (r) => !r.hasAttribute('data-empty') && !r.classList.contains('j-table__section-row'),
      )
    );

  /** @returns {HTMLTableRowElement[]} */
  const getVisibleDataRows = () => getDataRows().filter((r) => !r.hidden);

  /** @param {HTMLTableRowElement} row */
  const getRowCheckbox = (row) =>
    /** @type {HTMLInputElement | null} */ (
      row.querySelector('input[type="checkbox"][data-select-row], .j-table__check input[type="checkbox"]')
    );

  const syncSelectionState = (notify = false) => {
    const rows = getVisibleDataRows();
    /** @type {string[]} */
    const selectedIds = [];
    let checkedCount = 0;

    getDataRows().forEach((row, idx) => {
      const box = getRowCheckbox(row);
      if (!box) return;
      const on = box.checked;
      if (on) {
        row.setAttribute('data-selected', '');
        row.setAttribute('aria-selected', 'true');
        selectedIds.push(row.dataset.rowKey ?? box.value ?? String(idx));
      } else {
        row.removeAttribute('data-selected');
        row.removeAttribute('aria-selected');
      }
    });

    rows.forEach((row) => {
      const box = getRowCheckbox(row);
      if (box?.checked) checkedCount += 1;
    });

    if (selectAllBox) {
      const total = rows.length;
      selectAllBox.checked = total > 0 && checkedCount === total;
      selectAllBox.indeterminate = checkedCount > 0 && checkedCount < total;
    }

    const counter = root.querySelector('[data-selected-count]');
    if (counter) counter.textContent = String(selectedIds.length);

    if (notify) {
      root.dispatchEvent(
        new CustomEvent('j-select', { bubbles: true, detail: { selected: selectedIds } }),
      );
      root.dispatchEvent(
        new CustomEvent('j-change', { bubbles: true, detail: { selected: selectedIds } }),
      );
    }
  };

  let stopCollapsible = () => {};
  if (!boundCollapsible.has(table)) {
    const cleanup = createCollapsibleTable(root, {
      onToggle: () => syncSelectionState(false),
    });
    boundCollapsible.set(table, cleanup);
    stopCollapsible = () => {
      cleanup();
      boundCollapsible.delete(table);
    };
  }

  syncSelectionState(false);

  /** @param {MouseEvent} event */
  const onHeadClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest('.j-table__sort');
    if (!(btn instanceof HTMLElement)) return;
    const th = btn.closest('th');
    if (!(th instanceof HTMLTableCellElement) || th.closest('table') !== table) return;

    const current = th.getAttribute('aria-sort');
    const next = current === 'ascending' ? 'descending' : 'ascending';
    const colIndex = th.cellIndex;

    thead?.querySelectorAll('th[aria-sort]').forEach((cell) => {
      cell.setAttribute('aria-sort', cell === th ? next : 'none');
    });
    if (!th.hasAttribute('aria-sort')) {
      th.setAttribute('aria-sort', next);
    }

    const dir = next === 'ascending' ? 1 : -1;
    const sorted = getDataRows().sort((a, b) => {
      const va = readSortValue(a.cells[colIndex]);
      const vb = readSortValue(b.cells[colIndex]);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });

    sorted.forEach((row) => tbody.appendChild(row));
    const emptyRow = tbody.querySelector('tr[data-empty]');
    if (emptyRow) tbody.appendChild(emptyRow);

    const key = th.dataset.key ?? (btn.textContent?.trim() || String(colIndex));
    root.dispatchEvent(
      new CustomEvent('j-sort', { bubbles: true, detail: { key, direction: next } }),
    );
  };

  /** @param {Event} event */
  const onChange = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') return;

    if (target === selectAllBox) {
      const next = selectAllBox.checked;
      getVisibleDataRows().forEach((row) => {
        const box = getRowCheckbox(row);
        if (box && !box.disabled) box.checked = next;
      });
      syncSelectionState(true);
      return;
    }

    if (tbody.contains(target)) {
      syncSelectionState(true);
    }
  };

  const onSearch = () => {
    if (!searchInput) return;
    const q = searchInput.value.trim().toLowerCase();
    let visible = 0;
    getDataRows().forEach((row) => {
      const parentId = row.dataset.sectionParent;
      if (parentId) {
        const safeParentId =
          typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(parentId)
            : parentId.replace(/["\\]/g, '\\$&');
        const parentRow = tbody.querySelector(
          `tr.j-table__section-row[data-section-id="${safeParentId}"]`,
        );
        if (parentRow && !parentRow.hasAttribute('data-expanded') && !q) {
          row.hidden = true;
          return;
        }
      }
      const match = !q || (row.textContent ?? '').toLowerCase().includes(q);
      row.hidden = !match;
      if (match) visible += 1;
    });
    const emptyRow = /** @type {HTMLElement | null} */ (tbody.querySelector('tr[data-empty]'));
    if (emptyRow) emptyRow.hidden = visible > 0;
    syncSelectionState(false);
  };

  thead?.addEventListener('click', onHeadClick);
  table.addEventListener('change', onChange);
  searchInput?.addEventListener('input', onSearch);

  return () => {
    stopCollapsible();
    thead?.removeEventListener('click', onHeadClick);
    table.removeEventListener('change', onChange);
    searchInput?.removeEventListener('input', onSearch);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every `.j-data-table`, standalone `.j-table-wrap`, and collapsible `.j-table` inside `root`. Idempotent.
 * @param {ParentNode} [root=document]
 * @returns {() => void} cleanup
 */
export function initDataTables(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-data-table, .j-table-wrap').forEach((el) => {
    const host = /** @type {HTMLElement} */ (el);
    if (host.hasAttribute('data-j-managed')) return;
    if (host.classList.contains('j-table-wrap') && host.closest('.j-data-table')) return;
    if (bound.has(host)) return;
    bound.set(host, createDataTable(host));
    made.push(host);
  });
  const stopStandaloneCollapsible = initCollapsibleTables(root);
  return () => {
    stopStandaloneCollapsible();
    made.forEach((host) => {
      bound.get(host)?.();
      bound.delete(host);
    });
  };
}
