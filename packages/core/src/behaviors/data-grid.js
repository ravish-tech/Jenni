// Data Grid behavior — multi-column sort, fast search filter, pointer column resize, and WAI-ARIA 2D grid keyboard navigation.

/**
 * @typedef {'asc' | 'desc'} GridSortDirection
 */

/**
 * @template [T=Record<string, any>]
 * @typedef {Object} GridSortDescriptor
 * @property {string} key
 * @property {GridSortDirection} direction
 * @property {(a: T, b: T) => number} [comparator]
 */

/**
 * @template [T=Record<string, any>]
 * @typedef {Object} GridColumnLike
 * @property {string} key
 * @property {boolean} [searchable]
 * @property {(value: any, row: T, rowIndex: number) => string} [format]
 * @property {(a: T, b: T) => number} [comparator]
 */

/**
 * @typedef {Object} ColumnResizeOptions
 * @property {number} [minWidth]
 * @property {number} [maxWidth]
 * @property {boolean} [invert]
 * @property {() => number} [getWidth]
 * @property {(width: number) => void} [onResize]
 * @property {(width: number) => void} [onResizeEnd]
 */

/**
 * @typedef {'navigate' | 'select' | 'select-all' | 'activate' | 'header-activate' | 'contextmenu'} GridKeyActionType
 */

/**
 * @typedef {Object} GridKeyResult
 * @property {GridKeyActionType} type
 * @property {number} rowIndex
 * @property {number} colIndex
 * @property {boolean} [extendSelection]
 */

/**
 * @typedef {Object} GridKeyState
 * @property {number} rowCount
 * @property {number} colCount
 * @property {number} rowIndex
 * @property {number} colIndex
 * @property {number} [pageSize]
 * @property {boolean | 'single' | 'multiple'} [selectable]
 * @property {(next: { rowIndex: number; colIndex: number; extendSelection: boolean }) => void} [onNavigate]
 * @property {(rowIndex: number, extendSelection: boolean) => void} [onToggleSelect]
 * @property {() => void} [onSelectAll]
 * @property {(rowIndex: number) => void} [onActivate]
 * @property {(colIndex: number, event: KeyboardEvent) => void} [onHeaderActivate]
 * @property {(rowIndex: number, event: KeyboardEvent) => void} [onContextMenu]
 */

const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

const NUMERIC_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Natural value comparator supporting numbers, Dates, booleans, ISO timestamps, and numeric strings.
 * Nullish and empty string values sort after defined values regardless of sort direction.
 *
 * @param {unknown} va
 * @param {unknown} vb
 * @param {number} dir 1 for ascending, -1 for descending
 * @returns {number}
 */
function compareValues(va, vb, dir) {
  const aEmpty = va === null || va === undefined || va === '';
  const bEmpty = vb === null || vb === undefined || vb === '';
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof va === 'number' && typeof vb === 'number') {
    if (Number.isNaN(va) && Number.isNaN(vb)) return 0;
    if (Number.isNaN(va)) return 1;
    if (Number.isNaN(vb)) return -1;
    return (va - vb) * dir;
  }

  if (va instanceof Date && vb instanceof Date) {
    return (va.getTime() - vb.getTime()) * dir;
  }

  if (typeof va === 'boolean' && typeof vb === 'boolean') {
    return (Number(va) - Number(vb)) * dir;
  }

  const sa = String(va).trim();
  const sb = String(vb).trim();

  if (NUMERIC_RE.test(sa) && NUMERIC_RE.test(sb)) {
    return (Number(sa) - Number(sb)) * dir;
  }

  if (ISO_DATE_RE.test(sa) && ISO_DATE_RE.test(sb)) {
    const ta = Date.parse(sa);
    const tb = Date.parse(sb);
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) {
      return (ta - tb) * dir;
    }
  }

  return naturalCollator.compare(sa, sb) * dir;
}

/**
 * Compute next sort descriptors for single-click or Shift+Click multi-column sorting.
 * Cycles `asc` -> `desc` -> `none` (removed).
 *
 * @param {ReadonlyArray<{ key: string; direction: GridSortDirection }>} currentSorts
 * @param {string} key
 * @param {boolean} [multi=false]
 * @returns {Array<{ key: string; direction: GridSortDirection }>}
 */
export function nextGridSorts(currentSorts, key, multi = false) {
  const list = Array.isArray(currentSorts) ? currentSorts : [];
  const existingIdx = list.findIndex((s) => s.key === key);
  const existing = existingIdx >= 0 ? list[existingIdx] : undefined;

  if (!multi) {
    if (!existing) {
      return [{ key, direction: 'asc' }];
    }
    if (list.length > 1) {
      return [{ key, direction: existing.direction === 'asc' ? 'desc' : 'asc' }];
    }
    if (existing.direction === 'asc') {
      return [{ key, direction: 'desc' }];
    }
    return [];
  }

  if (!existing) {
    return [...list, { key, direction: 'asc' }];
  }
  if (existing.direction === 'asc') {
    return list.map((s, idx) => (idx === existingIdx ? { key, direction: 'desc' } : s));
  }
  return list.filter((_, idx) => idx !== existingIdx);
}

/**
 * Sort rows across one or multiple columns (`asc` / `desc`) using custom column comparators
 * or fast natural numeric / date / string comparison.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {ReadonlyArray<GridSortDescriptor<T>>} [sorts]
 * @param {ReadonlyArray<GridColumnLike<T>>} [columns]
 * @returns {T[]}
 */
export function sortGridRows(rows, sorts, columns) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (!Array.isArray(sorts) || sorts.length === 0) return /** @type {T[]} */ (rows);

  /** @type {Map<string, GridColumnLike<T>> | null} */
  let colMap = null;
  if (Array.isArray(columns) && columns.length > 0) {
    colMap = new Map();
    for (const col of columns) {
      colMap.set(col.key, col);
    }
  }

  const activeSpecs = sorts.map((s) => ({
    key: s.key,
    dir: s.direction === 'desc' ? -1 : 1,
    comparator: s.comparator ?? colMap?.get(s.key)?.comparator,
  }));

  return rows.slice().sort((a, b) => {
    const recA = /** @type {Record<string, unknown>} */ (a);
    const recB = /** @type {Record<string, unknown>} */ (b);

    for (let i = 0; i < activeSpecs.length; i += 1) {
      const spec = activeSpecs[i];
      if (spec.comparator) {
        const cmp = spec.comparator(a, b);
        if (cmp !== 0) return cmp * spec.dir;
        continue;
      }
      const diff = compareValues(recA[spec.key], recB[spec.key], spec.dir);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

/**
 * Fast case-insensitive substring search across searchable columns.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {string} [query]
 * @param {ReadonlyArray<GridColumnLike<T>>} [columns]
 * @returns {T[]}
 */
export function filterGridRows(rows, query, columns) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return /** @type {T[]} */ (rows);

  const searchableCols =
    Array.isArray(columns) && columns.length > 0
      ? columns.filter((col) => col.searchable !== false)
      : null;

  if (searchableCols && searchableCols.length === 0) {
    return /** @type {T[]} */ (rows);
  }

  /** @type {T[]} */
  const matched = [];

  for (let rIdx = 0; rIdx < rows.length; rIdx += 1) {
    const row = rows[rIdx];
    const rec = /** @type {Record<string, unknown>} */ (row);

    if (searchableCols) {
      for (let cIdx = 0; cIdx < searchableCols.length; cIdx += 1) {
        const col = searchableCols[cIdx];
        const raw = rec[col.key];
        if (raw != null && String(raw).toLowerCase().includes(q)) {
          matched.push(row);
          break;
        }
        if (col.format) {
          const formatted = col.format(raw, row, rIdx);
          if (formatted && formatted.toLowerCase().includes(q)) {
            matched.push(row);
            break;
          }
        }
      }
    } else if (row && typeof row === 'object') {
      const vals = Object.values(rec);
      for (let i = 0; i < vals.length; i += 1) {
        const v = vals[i];
        if (v != null && String(v).toLowerCase().includes(q)) {
          matched.push(row);
          break;
        }
      }
    }
  }

  return matched;
}

/**
 * Attach pointer-capture drag resize to a `.j-data-grid__head-cell` or `.j-data-grid__resizer`.
 * Clamps width between `minWidth` (default `56`) and `maxWidth` (`Infinity`).
 *
 * @param {HTMLElement} headCell
 * @param {ColumnResizeOptions} [options={}]
 * @returns {() => void} cleanup
 */
export function attachColumnResize(headCell, options = {}) {
  const handle = /** @type {HTMLElement} */ (
    headCell.classList.contains('j-data-grid__resizer')
      ? headCell
      : (headCell.querySelector('.j-data-grid__resizer') ?? headCell)
  );
  const cell = /** @type {HTMLElement} */ (headCell.closest('.j-data-grid__head-cell') ?? headCell);

  const minWidth = Math.max(24, options.minWidth ?? 56);
  const maxWidth = options.maxWidth != null && options.maxWidth >= minWidth ? options.maxWidth : Infinity;

  let activePointerId = -1;
  let startX = 0;
  let startWidth = 0;
  let currentWidth = 0;
  let moved = false;
  let isRtl = false;

  /** @param {MouseEvent} ev */
  const suppressSortClick = (ev) => {
    if (!moved) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();
    moved = false;
  };

  /** @param {PointerEvent} ev */
  const onPointerMove = (ev) => {
    if (ev.pointerId !== activePointerId) return;
    const rawDelta = ev.clientX - startX;
    if (Math.abs(rawDelta) > 1) moved = true;
    const invert = Boolean(options.invert) !== isRtl;
    const delta = invert ? -rawDelta : rawDelta;
    const clamped = Math.round(Math.min(maxWidth, Math.max(minWidth, startWidth + delta)));
    if (clamped !== currentWidth) {
      currentWidth = clamped;
      options.onResize?.(clamped);
    }
  };

  /** @param {PointerEvent} ev */
  const finishDrag = (ev) => {
    if (ev.pointerId !== activePointerId) return;
    const pid = activePointerId;
    activePointerId = -1;
    handle.removeAttribute('data-resizing');
    try {
      if (handle.hasPointerCapture?.(pid)) {
        handle.releasePointerCapture(pid);
      }
    } catch {
      // Ignore if pointer already released.
    }
    handle.removeEventListener('pointermove', onPointerMove);
    handle.removeEventListener('pointerup', finishDrag);
    handle.removeEventListener('pointercancel', finishDrag);
    options.onResizeEnd?.(currentWidth);
    if (moved) {
      setTimeout(() => {
        moved = false;
      }, 0);
    }
  };

  /** @param {PointerEvent} ev */
  const onPointerDown = (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();

    activePointerId = ev.pointerId;
    startX = ev.clientX;
    startWidth = options.getWidth ? options.getWidth() : cell.getBoundingClientRect().width;
    currentWidth = Math.round(Math.min(maxWidth, Math.max(minWidth, startWidth)));
    moved = false;
    isRtl =
      typeof window !== 'undefined' &&
      typeof window.getComputedStyle === 'function' &&
      window.getComputedStyle(cell).direction === 'rtl';

    handle.setAttribute('data-resizing', '');
    handle.setPointerCapture?.(ev.pointerId);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', finishDrag);
    handle.addEventListener('pointercancel', finishDrag);
  };

  handle.addEventListener('pointerdown', onPointerDown);
  cell.addEventListener('click', suppressSortClick, true);

  return () => {
    handle.removeEventListener('pointerdown', onPointerDown);
    handle.removeEventListener('pointermove', onPointerMove);
    handle.removeEventListener('pointerup', finishDrag);
    handle.removeEventListener('pointercancel', finishDrag);
    cell.removeEventListener('click', suppressSortClick, true);
    handle.removeAttribute('data-resizing');
  };
}

/**
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
function isEditableTarget(target) {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = /** @type {HTMLInputElement} */ (target).type;
    return type !== 'checkbox' && type !== 'radio' && type !== 'button';
  }
  return false;
}

/**
 * @param {EventTarget | null} target
 * @param {boolean} [includeAnchors=false]
 * @returns {boolean}
 */
function isNativeTriggerTarget(target, includeAnchors = false) {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'BUTTON' || (includeAnchors && tag === 'A');
}

/**
 * WAI-ARIA `role="grid"` 2D cell and row keyboard navigation handler.
 * Supports ArrowUp/Down/Left/Right, Home/End (+ Ctrl/Cmd), PageUp/PageDown,
 * Space row selection, Ctrl/Cmd+A select all, Enter row activation, and
 * ContextMenu / Shift+F10 row context menu trigger.
 *
 * @param {KeyboardEvent} e
 * @param {GridKeyState} state
 * @returns {GridKeyResult | null}
 */
export function handleGridKeydown(e, state) {
  if (e.defaultPrevented || isEditableTarget(e.target)) return null;

  const { rowCount, colCount } = state;
  if (colCount <= 0 || (rowCount <= 0 && state.rowIndex !== -1)) return null;

  const curRow =
    rowCount <= 0 || state.rowIndex === -1
      ? -1
      : Math.min(rowCount - 1, Math.max(0, state.rowIndex ?? 0));
  const curCol = Math.min(colCount - 1, Math.max(0, state.colIndex ?? 0));
  const pageJump = Math.max(1, state.pageSize ?? 10);
  const selectable = Boolean(state.selectable);
  const isMulti = state.selectable === true || state.selectable === 'multiple';

  let nextRow = curRow;
  let nextCol = curCol;
  let navigated = false;

  switch (e.key) {
    case 'ArrowUp':
      nextRow = Math.max(-1, curRow - 1);
      navigated = true;
      break;
    case 'ArrowDown':
      if (rowCount > 0) {
        nextRow = Math.min(rowCount - 1, curRow + 1);
        navigated = true;
      } else {
        e.preventDefault();
      }
      break;
    case 'ArrowLeft':
      nextCol = Math.max(0, curCol - 1);
      navigated = true;
      break;
    case 'ArrowRight':
      nextCol = Math.min(colCount - 1, curCol + 1);
      navigated = true;
      break;
    case 'Home':
      if ((e.ctrlKey || e.metaKey) && rowCount > 0) nextRow = 0;
      nextCol = 0;
      navigated = true;
      break;
    case 'End':
      if ((e.ctrlKey || e.metaKey) && rowCount > 0) nextRow = rowCount - 1;
      nextCol = colCount - 1;
      navigated = true;
      break;
    case 'PageUp':
      if (curRow >= 0) {
        nextRow = Math.max(0, curRow - pageJump);
        navigated = true;
      } else {
        e.preventDefault();
      }
      break;
    case 'PageDown':
      if (rowCount > 0) {
        nextRow = Math.min(rowCount - 1, Math.max(0, curRow) + pageJump);
        navigated = true;
      } else {
        e.preventDefault();
      }
      break;
    case ' ':
    case 'Spacebar': {
      if (curRow === -1) {
        if (isNativeTriggerTarget(e.target, true)) {
          return null;
        }
        e.preventDefault();
        state.onHeaderActivate?.(curCol, e);
        return { type: 'header-activate', rowIndex: -1, colIndex: curCol };
      }
      if (!selectable || rowCount <= 0) return null;
      if (isNativeTriggerTarget(e.target, false)) return null;
      e.preventDefault();
      const extend = Boolean(e.shiftKey && isMulti);
      state.onToggleSelect?.(curRow, extend);
      return { type: 'select', rowIndex: curRow, colIndex: curCol, extendSelection: extend };
    }
    case 'Enter': {
      if (isNativeTriggerTarget(e.target, true)) {
        return null;
      }
      if (curRow === -1) {
        e.preventDefault();
        state.onHeaderActivate?.(curCol, e);
        return { type: 'header-activate', rowIndex: -1, colIndex: curCol };
      }
      if (rowCount <= 0) return null;
      e.preventDefault();
      state.onActivate?.(curRow);
      return { type: 'activate', rowIndex: curRow, colIndex: curCol };
    }
    case 'ContextMenu': {
      if (curRow < 0 || rowCount <= 0) return null;
      e.preventDefault();
      state.onContextMenu?.(curRow, e);
      return { type: 'contextmenu', rowIndex: curRow, colIndex: curCol };
    }
    case 'F10': {
      if (!e.shiftKey || curRow < 0 || rowCount <= 0) return null;
      e.preventDefault();
      state.onContextMenu?.(curRow, e);
      return { type: 'contextmenu', rowIndex: curRow, colIndex: curCol };
    }
    case 'a':
    case 'A': {
      if (!(e.ctrlKey || e.metaKey) || !isMulti || !state.onSelectAll || rowCount <= 0) return null;
      e.preventDefault();
      state.onSelectAll();
      return { type: 'select-all', rowIndex: curRow, colIndex: curCol };
    }
    default:
      return null;
  }

  if (navigated) {
    e.preventDefault();
    const extend = Boolean(
      e.shiftKey && isMulti && nextRow !== curRow && curRow >= 0 && nextRow >= 0,
    );
    state.onNavigate?.({ rowIndex: nextRow, colIndex: nextCol, extendSelection: extend });
    return {
      type: 'navigate',
      rowIndex: nextRow,
      colIndex: nextCol,
      extendSelection: extend,
    };
  }

  return null;
}
