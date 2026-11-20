/// <reference path="./virtual-grid-core.d.ts" />
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import {
  createVirtualizer,
  type VirtualScrollAlign,
  type VirtualizerController,
  type VirtualizerState,
} from 'jenni-core/behaviors/virtual-list.js';
import {
  attachColumnResize,
  filterGridRows,
  handleGridKeydown,
  nextGridSorts,
  sortGridRows,
  type GridSortDirection,
} from 'jenni-core/behaviors/data-grid.js';

export type DataGridAlign = 'start' | 'center' | 'end';
export type DataGridSortDirection = GridSortDirection;
export type DataGridSelectable = boolean | 'single' | 'multiple';

export interface DataGridSort {
  key: string;
  direction: DataGridSortDirection;
}

export interface DataGridColumn<T = any> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  align?: DataGridAlign;
  sortable?: boolean;
  searchable?: boolean;
  resizable?: boolean;
  pinned?: 'left' | 'right';
  mono?: boolean;
  format?: (value: any, row: T, rowIndex: number) => string;
  comparator?: (a: T, b: T) => number;
  render?: (value: any, row: T, rowIndex: number) => ReactNode;
}

export interface DataGridCellRenderParams<T = any> {
  row: T;
  value: any;
  column: DataGridColumn<T>;
  rowIndex: number;
}

export interface DataGridFooterRenderParams {
  rowCount: number;
  totalCount: number;
  selectedCount: number;
}

export interface DataGridHandle {
  scrollToRow: (index: number, align?: VirtualScrollAlign) => void;
  scrollToCol: (colIndex: number) => void;
  clearSelection: () => void;
  selectAll: () => void;
}

export interface DataGridProps<T = any>
  extends Omit<ComponentProps<'div'>, 'children' | 'onSelect' | 'ref'> {
  rows: T[];
  columns: DataGridColumn<T>[];
  rowKey?: string | ((row: T, index: number) => string | number);
  height?: number | string;
  rowHeight?: number;
  size?: 'sm' | 'md';
  dense?: boolean;
  striped?: boolean;
  bordered?: boolean;
  selectable?: DataGridSelectable;
  selectedKeys?: (string | number)[];
  defaultSelectedKeys?: (string | number)[];
  onSelectedKeysChange?: (selectedKeys: (string | number)[]) => void;
  sorts?: DataGridSort[];
  defaultSorts?: DataGridSort[];
  onSortsChange?: (sorts: DataGridSort[]) => void;
  searchable?: boolean;
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  virtualized?: boolean;
  overscan?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  empty?: ReactNode;
  showFooter?: boolean;
  ariaLabel?: string;
  renderCell?: (params: DataGridCellRenderParams<T>) => ReactNode;
  renderHeader?: (column: DataGridColumn<T>) => ReactNode;
  toolbar?: ReactNode;
  toolbarActions?: ReactNode;
  footer?: ReactNode | ((params: DataGridFooterRenderParams) => ReactNode);
  onRowClick?: (row: T, index: number, event: ReactMouseEvent<HTMLDivElement>) => void;
  onRowActivate?: (row: T, index: number) => void;
  onRowContextMenu?: (
    row: T,
    index: number,
    event: ReactMouseEvent<HTMLDivElement> | globalThis.MouseEvent,
  ) => void;
  onColumnResize?: (key: string, width: number) => void;
  ref?: Ref<DataGridHandle>;
}

interface VirtualSlice {
  visibleIndices: number[];
  offsetY: number;
}

function buildFallbackIndices(
  total: number,
  rowH: number,
  height: number | string,
  overscan: number,
  virtualized: boolean,
): number[] {
  if (total <= 0) return [];
  if (!virtualized) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const vpH = typeof height === 'number' && height > 0 ? height : 420;
  const end = Math.min(total - 1, Math.ceil(vpH / Math.max(1, rowH)) - 1 + overscan);
  const out: number[] = [];
  for (let i = 0; i <= end; i += 1) out.push(i);
  return out;
}

interface ResizableHeaderCellProps<T> {
  id: string;
  col: DataGridColumn<T>;
  cIdx: number;
  ariaColIndex: number;
  isFocused: boolean;
  sortInfo?: { direction: DataGridSortDirection; order: number };
  multiSortActive: boolean;
  style: CSSProperties;
  widthOverride?: number;
  onCellRef: (key: string, el: HTMLDivElement | null) => void;
  onCellClick: (
    col: DataGridColumn<T>,
    cIdx: number,
    event: ReactMouseEvent<HTMLDivElement>,
  ) => void;
  onSortClick: (
    col: DataGridColumn<T>,
    cIdx: number,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  onResize: (key: string, width: number) => void;
  children: ReactNode;
}

function HeaderCell<T>({
  id,
  col,
  cIdx,
  ariaColIndex,
  isFocused,
  sortInfo,
  multiSortActive,
  style,
  widthOverride,
  onCellRef,
  onCellClick,
  onSortClick,
  onResize,
  children,
}: ResizableHeaderCellProps<T>) {
  const cellRef = useRef<HTMLDivElement | null>(null);
  const widthRef = useRef(widthOverride);
  widthRef.current = widthOverride;
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const setCellNode = useCallback(
    (el: HTMLDivElement | null) => {
      cellRef.current = el;
      onCellRef(col.key, el);
    },
    [col.key, onCellRef],
  );

  useEffect(() => {
    const el = cellRef.current;
    if (!el || !col.resizable) return;
    return attachColumnResize(el, {
      minWidth: col.minWidth ?? 56,
      maxWidth: col.maxWidth,
      invert: col.pinned === 'right',
      getWidth: () => widthRef.current ?? el.getBoundingClientRect().width,
      onResize: (w) => onResizeRef.current(col.key, w),
    });
  }, [col.key, col.resizable, col.minWidth, col.maxWidth, col.pinned]);

  const ariaSort = col.sortable
    ? sortInfo?.direction === 'asc'
      ? 'ascending'
      : sortInfo?.direction === 'desc'
        ? 'descending'
        : 'none'
    : undefined;

  return (
    <div
      id={id}
      ref={setCellNode}
      role="columnheader"
      className="j-data-grid__head-cell"
      aria-colindex={ariaColIndex}
      aria-sort={ariaSort}
      data-align={col.align}
      data-pinned={col.pinned}
      data-sortable={col.sortable ? '' : undefined}
      data-focused={isFocused ? '' : undefined}
      style={style}
      onClick={(e) => onCellClick(col, cIdx, e)}
    >
      {col.sortable ? (
        <button
          type="button"
          className="j-data-grid__sort"
          tabIndex={-1}
          onClick={(e) => onSortClick(col, cIdx, e)}
        >
          <span className="j-data-grid__sort-label">{children}</span>
          <span className="j-data-grid__sort-icon" aria-hidden="true" />
          {multiSortActive && sortInfo && (
            <span className="j-data-grid__sort-badge" aria-hidden="true">
              {sortInfo.order}
            </span>
          )}
        </button>
      ) : (
        <span className="j-data-grid__cell-text">{children}</span>
      )}

      {col.resizable && (
        <span
          className="j-data-grid__resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${col.label}`}
        />
      )}
    </div>
  );
}

export function DataGrid<T extends object = Record<string, any>>({
  rows,
  columns,
  rowKey = 'id',
  height = 420,
  rowHeight,
  size = 'md',
  dense = false,
  striped = false,
  bordered = false,
  selectable = false,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectedKeysChange,
  sorts,
  defaultSorts = [],
  onSortsChange,
  searchable = false,
  search,
  defaultSearch = '',
  onSearchChange,
  searchPlaceholder = 'Filter rows…',
  virtualized = true,
  overscan = 8,
  loading = false,
  emptyTitle = 'No matching records',
  emptyDescription = 'Adjust your search or clear active filters.',
  empty,
  showFooter = false,
  ariaLabel = 'Data grid',
  renderCell,
  renderHeader,
  toolbar,
  toolbarActions,
  footer,
  onRowClick,
  onRowActivate,
  onRowContextMenu,
  onColumnResize,
  className,
  style,
  ref,
  ...rest
}: DataGridProps<T>) {
  const gridId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const ctrlRef = useRef<VirtualizerController | null>(null);
  const anchorIndexRef = useRef<number | null>(null);
  const headCellElsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const registerHeadCellEl = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) headCellElsRef.current.set(key, el);
    else headCellElsRef.current.delete(key);
  }, []);

  const [internalSelected, setInternalSelected] =
    useState<(string | number)[]>(defaultSelectedKeys);
  const [internalSorts, setInternalSorts] = useState<DataGridSort[]>(defaultSorts);
  const [internalSearch, setInternalSearch] = useState(defaultSearch);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });
  const [gridHasFocus, setGridHasFocus] = useState(false);

  const isDense = dense || size === 'sm';
  const [cssRowHeight, setCssRowHeight] = useState(() => (isDense ? 28 : 34));
  const effectiveRowHeight = rowHeight != null && rowHeight > 0 ? rowHeight : cssRowHeight;
  const effectiveRowHeightRef = useRef(effectiveRowHeight);
  effectiveRowHeightRef.current = effectiveRowHeight;

  const activeSelectedKeys = selectedKeys !== undefined ? selectedKeys : internalSelected;
  const selectedSet = useMemo(() => new Set(activeSelectedKeys), [activeSelectedKeys]);
  const activeSorts = sorts !== undefined ? sorts : internalSorts;
  const activeSearch = search !== undefined ? search : internalSearch;

  const selectionMode: 'none' | 'single' | 'multiple' = !selectable
    ? 'none'
    : selectable === 'single'
      ? 'single'
      : 'multiple';
  const hasCheckCol = selectionMode !== 'none';

  const originalIndexMap = useMemo(() => {
    const map = new WeakMap<object, number>();
    rows.forEach((row, idx) => {
      if (row && typeof row === 'object') map.set(row, idx);
    });
    return map;
  }, [rows]);

  const getKey = useCallback(
    (row: T, fallbackIndex: number): string | number => {
      if (typeof rowKey === 'function') {
        const origIdx = originalIndexMap.get(row) ?? fallbackIndex;
        return rowKey(row, origIdx);
      }
      const val = (row as Record<string, unknown>)[rowKey];
      if (typeof val === 'string' || typeof val === 'number') return val;
      return originalIndexMap.get(row) ?? fallbackIndex;
    },
    [rowKey, originalIndexMap],
  );

  const filteredRows = useMemo(
    () => filterGridRows(rows, activeSearch, columns),
    [rows, activeSearch, columns],
  );

  const processedRows = useMemo(
    () => sortGridRows(filteredRows, activeSorts, columns),
    [filteredRows, activeSorts, columns],
  );

  const processedKeys = useMemo(
    () => processedRows.map((row, idx) => getKey(row, idx)),
    [processedRows, getKey],
  );

  const allVisibleSelected =
    selectionMode === 'multiple' &&
    processedKeys.length > 0 &&
    processedKeys.every((k) => selectedSet.has(k));

  const someVisibleSelected =
    selectionMode === 'multiple' &&
    !allVisibleSelected &&
    processedKeys.some((k) => selectedSet.has(k));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const readProbeHeight = useCallback((): number => {
    const probe = probeRef.current;
    if (probe) {
      const h = probe.getBoundingClientRect().height || probe.offsetHeight;
      if (h > 0) return Math.round(h);
    }
    const host = rootRef.current;
    if (host && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      const density =
        parseFloat(window.getComputedStyle(host).getPropertyValue('--j-density')) || 1;
      return isDense
        ? Math.max(22, Math.round(28 * density))
        : Math.max(24, Math.round(34 * density));
    }
    return isDense ? 28 : 34;
  }, [isDense]);

  useEffect(() => {
    setCssRowHeight(readProbeHeight());
    const probe = probeRef.current;
    if (!probe || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const next = readProbeHeight();
      setCssRowHeight((prev) => (prev === next ? prev : next));
    });
    ro.observe(probe);
    return () => ro.disconnect();
  }, [readProbeHeight]);

  const [slice, setSlice] = useState<VirtualSlice>(() => ({
    visibleIndices: buildFallbackIndices(
      processedRows.length,
      effectiveRowHeight,
      height,
      overscan,
      virtualized,
    ),
    offsetY: 0,
  }));

  const handleVirtualChange = useCallback((state: VirtualizerState) => {
    setSlice((prev) => {
      if (prev.visibleIndices === state.visibleIndices && prev.offsetY === state.offsetY) {
        return prev;
      }
      return { visibleIndices: state.visibleIndices, offsetY: state.offsetY };
    });
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!virtualized || !vp) {
      ctrlRef.current?.destroy();
      ctrlRef.current = null;
      return;
    }
    const ctrl = createVirtualizer(vp, {
      count: processedRows.length,
      itemHeight: () => effectiveRowHeightRef.current,
      overscan,
      onChange: handleVirtualChange,
    });
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, [virtualized, handleVirtualChange]);

  useEffect(() => {
    if (!virtualized) return;
    ctrlRef.current?.setOptions({
      count: processedRows.length,
      itemHeight: () => effectiveRowHeightRef.current,
      overscan,
    });
    ctrlRef.current?.refresh();
  }, [processedRows.length, effectiveRowHeight, overscan, virtualized]);

  useEffect(() => {
    setFocusedCell((prev) => {
      const maxR = Math.max(0, processedRows.length - 1);
      const maxC = Math.max(0, columns.length - 1);
      const r = Math.min(prev.row, maxR);
      const c = Math.min(prev.col, maxC);
      return r === prev.row && c === prev.col ? prev : { row: r, col: c };
    });
  }, [processedRows.length, columns.length]);

  const updateSelectedKeys = useCallback(
    (next: (string | number)[]) => {
      if (selectedKeys === undefined) setInternalSelected(next);
      onSelectedKeysChange?.(next);
    },
    [selectedKeys, onSelectedKeysChange],
  );

  const selectRowAt = useCallback(
    (rowIndex: number, extendRange: boolean, additiveToggle: boolean) => {
      if (selectionMode === 'none') return;
      if (rowIndex < 0 || rowIndex >= processedKeys.length) return;
      const targetKey = processedKeys[rowIndex];

      if (selectionMode === 'single') {
        const already = selectedSet.has(targetKey);
        updateSelectedKeys(additiveToggle && already ? [] : [targetKey]);
        anchorIndexRef.current = rowIndex;
        return;
      }

      if (extendRange && anchorIndexRef.current !== null) {
        const start = Math.min(anchorIndexRef.current, rowIndex);
        const end = Math.max(anchorIndexRef.current, rowIndex);
        const next = new Set(activeSelectedKeys);
        for (let i = start; i <= end; i += 1) {
          next.add(processedKeys[i]);
        }
        updateSelectedKeys(Array.from(next));
        return;
      }

      const next = new Set(activeSelectedKeys);
      if (next.has(targetKey)) next.delete(targetKey);
      else next.add(targetKey);
      anchorIndexRef.current = rowIndex;
      updateSelectedKeys(Array.from(next));
    },
    [selectionMode, processedKeys, selectedSet, activeSelectedKeys, updateSelectedKeys],
  );

  const toggleSelectAll = () => {
    if (selectionMode !== 'multiple') return;
    const next = new Set(activeSelectedKeys);
    if (allVisibleSelected) {
      processedKeys.forEach((k) => next.delete(k));
    } else {
      processedKeys.forEach((k) => next.add(k));
    }
    updateSelectedKeys(Array.from(next));
  };

  const selectAll = useCallback(() => {
    if (processedKeys.length === 0) return;
    if (selectionMode === 'single') {
      updateSelectedKeys([processedKeys[0]]);
      return;
    }
    const merged = new Set([...activeSelectedKeys, ...processedKeys]);
    updateSelectedKeys(Array.from(merged));
  }, [processedKeys, selectionMode, activeSelectedKeys, updateSelectedKeys]);

  const clearSelection = useCallback(() => {
    anchorIndexRef.current = null;
    updateSelectedKeys([]);
  }, [updateSelectedKeys]);

  const scrollToRow = useCallback(
    (index: number, align: VirtualScrollAlign = 'auto') => {
      const count = processedRows.length;
      if (count <= 0) return;
      const clamped = Math.min(count - 1, Math.max(0, Math.floor(index)));
      if (virtualized && ctrlRef.current) {
        ctrlRef.current.scrollToIndex(clamped, align);
        return;
      }
      const rowEl = viewportRef.current?.querySelector<HTMLElement>(
        `.j-data-grid__row[data-row-index="${clamped}"]`,
      );
      rowEl?.scrollIntoView({ block: align === 'auto' ? 'nearest' : align });
    },
    [processedRows.length, virtualized],
  );

  const hasPinnedLeft = useMemo(() => columns.some((c) => c.pinned === 'left'), [columns]);

  const getEffectiveColWidth = useCallback(
    (col: DataGridColumn<T>): number => {
      const el = headCellElsRef.current.get(col.key);
      if (el && el.offsetWidth > 0) return el.offsetWidth;
      return columnWidths[col.key] ?? col.width ?? col.minWidth ?? 140;
    },
    [columnWidths],
  );

  const scrollToCol = useCallback(
    (colIndex: number) => {
      const vp = viewportRef.current;
      if (!vp || vp.clientWidth <= 0) return;
      const col = columns[colIndex];
      if (!col) return;
      if (colIndex === 0) {
        vp.scrollLeft = 0;
        return;
      }
      if (colIndex === columns.length - 1 && col.pinned === 'right') {
        vp.scrollLeft = Math.max(0, vp.scrollWidth - vp.clientWidth);
        return;
      }
      if (col.pinned === 'left' || col.pinned === 'right') return;

      let pinnedLeftTotal = hasCheckCol && hasPinnedLeft ? 36 : 0;
      let pinnedRightTotal = 0;
      for (const c of columns) {
        if (c.pinned === 'left') pinnedLeftTotal += getEffectiveColWidth(c);
        else if (c.pinned === 'right') pinnedRightTotal += getEffectiveColWidth(c);
      }

      let colStart = 0;
      let colEnd = 0;
      const targetEl = headCellElsRef.current.get(col.key);
      if (targetEl && targetEl.offsetWidth > 0) {
        colStart = targetEl.offsetLeft;
        colEnd = colStart + targetEl.offsetWidth;
      } else {
        let acc = hasCheckCol ? 36 : 0;
        for (let i = 0; i < colIndex; i += 1) {
          acc += getEffectiveColWidth(columns[i]);
        }
        colStart = acc;
        colEnd = acc + getEffectiveColWidth(col);
      }

      const visibleStart = vp.scrollLeft + pinnedLeftTotal;
      const visibleEnd = vp.scrollLeft + vp.clientWidth - pinnedRightTotal;
      if (visibleEnd <= visibleStart) return;

      if (colStart < visibleStart || colEnd - colStart >= visibleEnd - visibleStart) {
        vp.scrollLeft = Math.max(0, colStart - pinnedLeftTotal);
      } else if (colEnd > visibleEnd) {
        vp.scrollLeft = Math.max(0, colEnd - (vp.clientWidth - pinnedRightTotal));
      }
    },
    [columns, hasCheckCol, hasPinnedLeft, getEffectiveColWidth],
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToRow,
      scrollToCol,
      clearSelection,
      selectAll,
    }),
    [scrollToRow, scrollToCol, clearSelection, selectAll],
  );

  const handleSort = useCallback(
    (col: DataGridColumn<T>, multi: boolean) => {
      if (!col.sortable) return;
      const next = nextGridSorts(activeSorts, col.key, multi);
      if (sorts === undefined) setInternalSorts(next);
      onSortsChange?.(next);
    },
    [activeSorts, sorts, onSortsChange],
  );

  const handleSortClick = useCallback(
    (col: DataGridColumn<T>, cIdx: number, event: ReactMouseEvent<HTMLButtonElement>) => {
      setFocusedCell({ row: -1, col: cIdx });
      setGridHasFocus(true);
      viewportRef.current?.focus({ preventScroll: true });
      handleSort(col, event.shiftKey);
    },
    [handleSort],
  );

  const handleHeaderCellClick = useCallback(
    (col: DataGridColumn<T>, cIdx: number, event: ReactMouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.j-data-grid__resizer')) return;
      if (target?.closest('.j-data-grid__sort')) return;
      if (target?.closest('input, select, textarea, a, button')) return;

      setFocusedCell({ row: -1, col: cIdx });
      setGridHasFocus(true);
      viewportRef.current?.focus({ preventScroll: true });
      if (col.sortable) {
        handleSort(col, event.shiftKey);
      }
    },
    [handleSort],
  );

  const handleSearchInput = (val: string) => {
    if (search === undefined) setInternalSearch(val);
    onSearchChange?.(val);
    viewportRef.current?.scrollTo({ top: 0 });
  };

  const handleResizeColumn = useCallback(
    (key: string, width: number) => {
      setColumnWidths((prev) => (prev[key] === width ? prev : { ...prev, [key]: width }));
      onColumnResize?.(key, width);
    },
    [onColumnResize],
  );

  const pinnedOffsets = useMemo(() => {
    const leftMap: Record<string, number> = {};
    const rightMap: Record<string, number> = {};
    let leftAcc = hasCheckCol && hasPinnedLeft ? 36 : 0;
    for (const col of columns) {
      if (col.pinned === 'left') {
        leftMap[col.key] = leftAcc;
        leftAcc += columnWidths[col.key] ?? col.width ?? col.minWidth ?? 140;
      }
    }
    let rightAcc = 0;
    for (let i = columns.length - 1; i >= 0; i -= 1) {
      const col = columns[i];
      if (col.pinned === 'right') {
        rightMap[col.key] = rightAcc;
        rightAcc += columnWidths[col.key] ?? col.width ?? col.minWidth ?? 140;
      }
    }
    return { leftMap, rightMap };
  }, [columns, columnWidths, hasCheckCol, hasPinnedLeft]);

  const colStyles = useMemo(() => {
    const map: Record<string, CSSProperties> = {};
    for (const col of columns) {
      const resized = columnWidths[col.key];
      const minW = col.minWidth ?? 56;
      const st: Record<string, string> = {
        minInlineSize: `${minW}px`,
      };
      if (col.maxWidth != null && resized == null) {
        st.maxInlineSize = `${col.maxWidth}px`;
      }
      if (resized != null) {
        st.inlineSize = `${resized}px`;
        st.minInlineSize = `${resized}px`;
        st.maxInlineSize = `${resized}px`;
        st.flex = '0 0 auto';
      } else if (col.width != null) {
        st.inlineSize = `${col.width}px`;
        st.flex = '0 0 auto';
      } else if (col.flex != null) {
        st.flex = `${col.flex} 1 ${col.minWidth ?? 120}px`;
      } else {
        st.flex = `1 1 ${col.minWidth ?? 140}px`;
      }

      if (col.pinned === 'left') {
        st['--_pin-offset'] = `${pinnedOffsets.leftMap[col.key] ?? 0}px`;
      } else if (col.pinned === 'right') {
        st['--_pin-offset'] = `${pinnedOffsets.rightMap[col.key] ?? 0}px`;
      }
      map[col.key] = st as CSSProperties;
    }
    return map;
  }, [columns, columnWidths, pinnedOffsets]);

  const sortLookup = useMemo(() => {
    const map = new Map<string, { direction: DataGridSortDirection; order: number }>();
    activeSorts.forEach((s, idx) => {
      map.set(s.key, { direction: s.direction, order: idx + 1 });
    });
    return map;
  }, [activeSorts]);

  const handleViewportKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    setGridHasFocus(true);
    const vp = viewportRef.current;
    const pageRows = vp
      ? Math.max(1, Math.floor(vp.clientHeight / Math.max(1, effectiveRowHeight)) - 1)
      : 10;

    handleGridKeydown(event.nativeEvent, {
      rowCount: processedRows.length,
      colCount: columns.length,
      rowIndex: focusedCell.row,
      colIndex: focusedCell.col,
      pageSize: pageRows,
      selectable,
      onNavigate: ({ rowIndex, colIndex, extendSelection }) => {
        const prevCol = focusedCell.col;
        setFocusedCell({ row: rowIndex, col: colIndex });
        if (rowIndex >= 0) {
          scrollToRow(rowIndex, 'auto');
        }
        if (colIndex !== prevCol) {
          scrollToCol(colIndex);
        }
        if (extendSelection && rowIndex >= 0) {
          selectRowAt(rowIndex, true, false);
        }
      },
      onToggleSelect: (rowIndex, extendSelection) => {
        selectRowAt(rowIndex, extendSelection, true);
      },
      onSelectAll: selectionMode === 'multiple' ? selectAll : undefined,
      onActivate: (rowIndex) => {
        const row = processedRows[rowIndex];
        if (row !== undefined) onRowActivate?.(row, rowIndex);
      },
      onHeaderActivate: (colIndex, ev) => {
        const col = columns[colIndex];
        if (col?.sortable) {
          handleSort(col, ev.shiftKey);
        }
      },
      onContextMenu: (rowIndex) => {
        const row = processedRows[rowIndex];
        if (row === undefined) return;
        const rowEl = viewportRef.current?.querySelector<HTMLElement>(
          `.j-data-grid__row[data-row-index="${rowIndex}"]`,
        );
        const rect = (rowEl ?? viewportRef.current)?.getBoundingClientRect();
        const clientX = rect ? Math.round(rect.left + Math.min(80, rect.width / 2)) : 0;
        const clientY = rect ? Math.round(rect.top + rect.height / 2) : 0;
        const synthetic = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
        });
        if (rowEl) {
          rowEl.dispatchEvent(synthetic);
        } else {
          onRowContextMenu?.(row, rowIndex, synthetic);
        }
      },
    });
  };

  const nonVirtualIndices = useMemo(
    () => (virtualized ? [] : Array.from({ length: processedRows.length }, (_, i) => i)),
    [virtualized, processedRows.length],
  );
  const renderedIndices = virtualized ? slice.visibleIndices : nonVirtualIndices;

  const totalBodyHeight = processedRows.length * effectiveRowHeight;
  const totalColCount = columns.length + (hasCheckCol ? 1 : 0);

  const activeDescendantId =
    !gridHasFocus || columns.length === 0
      ? undefined
      : focusedCell.row === -1
        ? focusedCell.col >= 0 && focusedCell.col < columns.length
          ? `${gridId}-h-${focusedCell.col}`
          : undefined
        : processedRows.length > 0 && renderedIndices.includes(focusedCell.row)
          ? `${gridId}-c-${focusedCell.row}-${focusedCell.col}`
          : undefined;

  const mergedStyle: CSSProperties = {
    ...style,
    ...(height != null
      ? ({
          '--j-grid-h': typeof height === 'number' ? `${height}px` : height,
        } as CSSProperties)
      : undefined),
    ...(rowHeight != null && rowHeight > 0
      ? ({ '--j-grid-row-h': `${rowHeight}px` } as CSSProperties)
      : undefined),
  };

  const bodyStyle: CSSProperties | undefined = virtualized
    ? ({
        '--_body-h': `${totalBodyHeight}px`,
        blockSize: `${totalBodyHeight}px`,
      } as CSSProperties)
    : undefined;

  const rowsStyle: CSSProperties | undefined = virtualized
    ? ({ '--_offset-y': `${slice.offsetY}px` } as CSSProperties)
    : undefined;

  return (
    <div
      {...rest}
      ref={rootRef}
      data-j-managed=""
      className={className ? `j-data-grid ${className}` : 'j-data-grid'}
      data-size={size === 'md' ? undefined : size}
      data-density-mode={isDense ? 'dense' : undefined}
      data-striped={striped ? '' : undefined}
      data-bordered={bordered ? '' : undefined}
      data-virtualized={virtualized ? undefined : 'false'}
      aria-busy={loading ? 'true' : undefined}
      style={mergedStyle}
    >
      <div ref={probeRef} className="j-data-grid__row-probe" aria-hidden="true" />
      {loading && <div className="j-data-grid__loading" aria-hidden="true" />}

      {(searchable || toolbar != null || toolbarActions != null) && (
        <div className="j-data-grid__toolbar">
          {toolbar ?? (
            <>
              {searchable && (
                <label className="j-data-grid__search">
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="7" cy="7" r="4.5" />
                    <path d="m10.5 10.5 3 3" />
                  </svg>
                  <input
                    type="search"
                    className="j-data-grid__search-input"
                    value={activeSearch}
                    placeholder={searchPlaceholder}
                    aria-label="Filter grid rows"
                    onChange={(e) => handleSearchInput(e.target.value)}
                  />
                </label>
              )}
              {(toolbarActions != null || (hasCheckCol && activeSelectedKeys.length > 0)) && (
                <div className="j-data-grid__toolbar-actions">
                  {hasCheckCol && activeSelectedKeys.length > 0 && (
                    <span className="j-data-grid__meta">
                      <strong>{activeSelectedKeys.length}</strong> selected
                    </span>
                  )}
                  {toolbarActions}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div
        ref={viewportRef}
        className="j-data-grid__viewport"
        role="grid"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-rowcount={processedRows.length + 1}
        aria-colcount={totalColCount}
        aria-multiselectable={selectionMode === 'multiple' ? 'true' : undefined}
        aria-activedescendant={activeDescendantId}
        onKeyDown={handleViewportKeyDown}
        onFocus={() => setGridHasFocus(true)}
        onBlur={() => setGridHasFocus(false)}
      >
        <div className="j-data-grid__header" role="row" aria-rowindex={1}>
          {hasCheckCol && (
            <div
              role="columnheader"
              className="j-data-grid__head-cell j-data-grid__check"
              aria-colindex={1}
              data-pinned={hasPinnedLeft ? 'left' : undefined}
            >
              {selectionMode === 'multiple' && (
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="j-checkbox"
                  data-size="sm"
                  aria-label="Select all rows"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                />
              )}
            </div>
          )}

          {columns.map((col, cIdx) => (
            <HeaderCell
              key={col.key}
              id={`${gridId}-h-${cIdx}`}
              col={col}
              cIdx={cIdx}
              ariaColIndex={cIdx + (hasCheckCol ? 2 : 1)}
              isFocused={focusedCell.row === -1 && focusedCell.col === cIdx}
              sortInfo={sortLookup.get(col.key)}
              multiSortActive={activeSorts.length > 1}
              style={colStyles[col.key]}
              widthOverride={columnWidths[col.key]}
              onCellRef={registerHeadCellEl}
              onCellClick={handleHeaderCellClick}
              onSortClick={handleSortClick}
              onResize={handleResizeColumn}
            >
              {renderHeader ? renderHeader(col) : col.label}
            </HeaderCell>
          ))}
        </div>

        {processedRows.length === 0 ? (
          <div className="j-data-grid__empty">
            {empty ?? (
              <>
                <span className="j-data-grid__empty-title">{emptyTitle}</span>
                <span className="j-data-grid__empty-desc">{emptyDescription}</span>
              </>
            )}
          </div>
        ) : (
          <div className="j-data-grid__body" style={bodyStyle}>
            <div className="j-data-grid__rows" style={rowsStyle}>
              {renderedIndices.map((rIdx) => {
                if (rIdx < 0 || rIdx >= processedRows.length) return null;
                const row = processedRows[rIdx];
                const rKey = processedKeys[rIdx];
                const isSelected = hasCheckCol && selectedSet.has(rKey);

                return (
                  <div
                    key={rKey}
                    role="row"
                    className="j-data-grid__row"
                    aria-rowindex={rIdx + 2}
                    aria-selected={hasCheckCol ? (isSelected ? 'true' : 'false') : undefined}
                    data-selected={isSelected ? '' : undefined}
                    data-odd={rIdx % 2 === 1 ? '' : undefined}
                    data-even={rIdx % 2 === 0 ? '' : undefined}
                    data-row-index={rIdx}
                    onDoubleClick={() => onRowActivate?.(row, rIdx)}
                    onContextMenu={(ev) => {
                      setFocusedCell((prev) => ({ ...prev, row: rIdx }));
                      onRowContextMenu?.(row, rIdx, ev);
                    }}
                  >
                    {hasCheckCol && (
                      <div
                        role="gridcell"
                        className="j-data-grid__cell j-data-grid__check"
                        aria-colindex={1}
                        data-pinned={hasPinnedLeft ? 'left' : undefined}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setFocusedCell((prev) => ({ ...prev, row: rIdx }));
                          selectRowAt(rIdx, ev.shiftKey, true);
                        }}
                      >
                        <input
                          type="checkbox"
                          className="j-checkbox"
                          data-size="sm"
                          tabIndex={-1}
                          aria-label={`Select row ${rIdx + 1}`}
                          checked={isSelected}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setFocusedCell((prev) => ({ ...prev, row: rIdx }));
                            selectRowAt(rIdx, ev.shiftKey, true);
                          }}
                          onChange={() => {}}
                        />
                      </div>
                    )}

                    {columns.map((col, cIdx) => {
                      const rawValue = (row as Record<string, unknown>)[col.key];
                      const formatted = col.format
                        ? col.format(rawValue, row, rIdx)
                        : rawValue == null
                          ? ''
                          : String(rawValue);
                      const isCellFocused =
                        gridHasFocus && focusedCell.row === rIdx && focusedCell.col === cIdx;

                      let cellBody: ReactNode;
                      if (col.render) {
                        cellBody = col.render(rawValue, row, rIdx);
                      } else if (renderCell) {
                        cellBody = renderCell({
                          row,
                          value: rawValue,
                          column: col,
                          rowIndex: rIdx,
                        });
                      } else {
                        cellBody = <span className="j-data-grid__cell-text">{formatted}</span>;
                      }

                      return (
                        <div
                          id={`${gridId}-c-${rIdx}-${cIdx}`}
                          key={col.key}
                          role="gridcell"
                          className="j-data-grid__cell"
                          aria-colindex={cIdx + (hasCheckCol ? 2 : 1)}
                          data-align={col.align}
                          data-pinned={col.pinned}
                          data-mono={col.mono ? '' : undefined}
                          data-focused={isCellFocused ? '' : undefined}
                          style={colStyles[col.key]}
                          onClick={(ev) => {
                            setFocusedCell({ row: rIdx, col: cIdx });
                            const target = ev.target as HTMLElement | null;
                            const interactive = target?.closest(
                              'button, a, input, select, textarea',
                            );
                            if (!interactive) {
                              viewportRef.current?.focus({ preventScroll: true });
                              if (selectionMode === 'single') {
                                selectRowAt(rIdx, false, ev.metaKey || ev.ctrlKey);
                              } else if (
                                selectionMode === 'multiple' &&
                                (ev.shiftKey || ev.metaKey || ev.ctrlKey)
                              ) {
                                if (ev.shiftKey) ev.preventDefault();
                                selectRowAt(rIdx, ev.shiftKey, true);
                              }
                            }
                            onRowClick?.(row, rIdx, ev);
                          }}
                        >
                          {cellBody}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {(showFooter || footer != null) && (
        <div className="j-data-grid__footer">
          {typeof footer === 'function' ? (
            footer({
              rowCount: processedRows.length,
              totalCount: rows.length,
              selectedCount: activeSelectedKeys.length,
            })
          ) : footer != null ? (
            footer
          ) : (
            <>
              <span className="j-data-grid__meta">
                {processedRows.length !== rows.length ? (
                  <>
                    <strong>{processedRows.length.toLocaleString()}</strong> of{' '}
                    {rows.length.toLocaleString()} rows
                  </>
                ) : (
                  <>
                    <strong>{processedRows.length.toLocaleString()}</strong>{' '}
                    {processedRows.length === 1 ? 'row' : 'rows'}
                  </>
                )}
              </span>
              {hasCheckCol && activeSelectedKeys.length > 0 && (
                <span className="j-data-grid__meta">
                  <strong>{activeSelectedKeys.length.toLocaleString()}</strong> selected
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
