// Jenni — Data Table behavior (sorting, row selection, indeterminate select-all, live filter).

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
      [...tbody.rows].filter((r) => !r.hasAttribute('data-empty'))
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
    thead?.removeEventListener('click', onHeadClick);
    table.removeEventListener('change', onChange);
    searchInput?.removeEventListener('input', onSearch);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every `.j-data-table` and standalone `.j-table-wrap` inside `root`. Idempotent.
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
  return () =>
    made.forEach((host) => {
      bound.get(host)?.();
      bound.delete(host);
    });
}
