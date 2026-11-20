<script lang="ts">
/// <reference path="./virtual-grid-core.d.ts" />
import type { VirtualScrollAlign } from 'jenni-core/behaviors/virtual-list.js';
import type { GridSortDirection } from 'jenni-core/behaviors/data-grid.js';

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
}

export type JDataGridColumn<T = any> = DataGridColumn<T>;
export type JDataGridSort = DataGridSort;

export interface JDataGridProps<T = any> {
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
  defaultSelectedKeys?: (string | number)[];
  defaultSorts?: DataGridSort[];
  searchable?: boolean;
  defaultSearch?: string;
  searchPlaceholder?: string;
  virtualized?: boolean;
  overscan?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showFooter?: boolean;
  ariaLabel?: string;
}

export interface JDataGridHandle {
  scrollToRow: (index: number, align?: VirtualScrollAlign) => void;
  scrollToCol: (colIndex: number) => void;
  clearSelection: () => void;
  selectAll: () => void;
}
</script>

<script setup lang="ts" generic="T extends object = Record<string, any>">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useId,
  watch,
  type CSSProperties,
  type ComponentPublicInstance,
} from 'vue';
import {
  createVirtualizer,
  type VirtualizerController,
  type VirtualizerState,
} from 'jenni-core/behaviors/virtual-list.js';
import {
  attachColumnResize,
  filterGridRows,
  handleGridKeydown,
  nextGridSorts,
  sortGridRows,
} from 'jenni-core/behaviors/data-grid.js';

const props = withDefaults(defineProps<JDataGridProps<T>>(), {
  rowKey: 'id',
  height: 420,
  size: 'md',
  dense: false,
  striped: false,
  bordered: false,
  selectable: false,
  searchable: false,
  searchPlaceholder: 'Filter rows…',
  virtualized: true,
  overscan: 8,
  loading: false,
  emptyTitle: 'No matching records',
  emptyDescription: 'Adjust your search or clear active filters.',
  showFooter: false,
  ariaLabel: 'Data grid',
});

const emit = defineEmits<{
  rowClick: [row: T, index: number, event: MouseEvent];
  rowActivate: [row: T, index: number];
  rowContextmenu: [row: T, index: number, event: MouseEvent];
  columnResize: [key: string, width: number];
}>();

const selectedKeysModel = defineModel<(string | number)[]>('selectedKeys');
const sortsModel = defineModel<DataGridSort[]>('sorts');
const searchModel = defineModel<string>('search');

const gridId = useId();
const rootEl = ref<HTMLElement | null>(null);
const viewportEl = ref<HTMLElement | null>(null);
const probeEl = ref<HTMLElement | null>(null);
const selectAllEl = ref<HTMLInputElement | null>(null);

const internalSelectedKeys = ref<(string | number)[]>(
  props.defaultSelectedKeys ? [...props.defaultSelectedKeys] : [],
);
const internalSorts = ref<DataGridSort[]>(props.defaultSorts ? [...props.defaultSorts] : []);
const internalSearch = ref(props.defaultSearch ?? '');

const activeSelectedKeys = computed(
  () => selectedKeysModel.value ?? internalSelectedKeys.value,
);
const selectedSet = computed(() => new Set<string | number>(activeSelectedKeys.value));
const activeSorts = computed(() => sortsModel.value ?? internalSorts.value);
const activeSearch = computed(() => searchModel.value ?? internalSearch.value);

const isDense = computed(() => props.dense || props.size === 'sm');
const selectionMode = computed<'none' | 'single' | 'multiple'>(() => {
  if (!props.selectable) return 'none';
  if (props.selectable === 'single') return 'single';
  return 'multiple';
});
const hasCheckCol = computed(() => selectionMode.value !== 'none');

const columnWidths = ref<Record<string, number>>({});
const focusedRow = ref(0);
const focusedCol = ref(0);
const gridHasFocus = ref(false);
let anchorSelectedIndex: number | null = null;

const originalIndexMap = computed(() => {
  const map = new WeakMap<object, number>();
  props.rows.forEach((row, idx) => {
    if (row && typeof row === 'object') map.set(row, idx);
  });
  return map;
});

function getKey(row: T, fallbackIndex: number): string | number {
  if (typeof props.rowKey === 'function') {
    const origIdx = originalIndexMap.value.get(row) ?? fallbackIndex;
    return props.rowKey(row, origIdx);
  }
  const val = (row as Record<string, unknown>)[props.rowKey];
  if (typeof val === 'string' || typeof val === 'number') return val;
  return originalIndexMap.value.get(row) ?? fallbackIndex;
}

function getCellValue(row: T, col: DataGridColumn<T>): unknown {
  return (row as Record<string, unknown>)[col.key];
}

function formatCell(row: T, col: DataGridColumn<T>, rowIndex: number): string {
  const raw = getCellValue(row, col);
  if (col.format) return col.format(raw, row, rowIndex);
  return raw == null ? '' : String(raw);
}

const filteredRows = computed(() =>
  filterGridRows(props.rows, activeSearch.value, props.columns),
);

const processedRows = computed(() =>
  sortGridRows(filteredRows.value, activeSorts.value, props.columns),
);

const processedKeys = computed(() =>
  processedRows.value.map((row, idx) => getKey(row, idx)),
);

const allVisibleSelected = computed(
  () =>
    selectionMode.value === 'multiple' &&
    processedKeys.value.length > 0 &&
    processedKeys.value.every((k) => selectedSet.value.has(k)),
);

const someVisibleSelected = computed(
  () =>
    selectionMode.value === 'multiple' &&
    !allVisibleSelected.value &&
    processedKeys.value.some((k) => selectedSet.value.has(k)),
);

watch(
  [someVisibleSelected, selectAllEl],
  ([indeterminate, el]) => {
    if (el) el.indeterminate = indeterminate;
  },
  { immediate: true },
);

const cssRowHeight = ref(isDense.value ? 28 : 34);
const effectiveRowHeight = computed(() =>
  props.rowHeight != null && props.rowHeight > 0 ? props.rowHeight : cssRowHeight.value,
);

function readProbeRowHeight(): number {
  const probe = probeEl.value;
  if (probe) {
    const h = probe.getBoundingClientRect().height || probe.offsetHeight;
    if (h > 0) return Math.round(h);
  }
  const host = rootEl.value;
  if (host && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const density = parseFloat(window.getComputedStyle(host).getPropertyValue('--j-density')) || 1;
    return isDense.value
      ? Math.max(22, Math.round(28 * density))
      : Math.max(24, Math.round(34 * density));
  }
  return isDense.value ? 28 : 34;
}

let ctrl: VirtualizerController | null = null;
let probeRo: ResizeObserver | null = null;
const resizeCleanups = new Map<string, () => void>();
const headCellElements = new Map<string, HTMLElement>();
const headCellPinned = new Map<string, 'left' | 'right' | undefined>();

function computeFallbackIndices(total: number, rowH: number): number[] {
  if (total <= 0) return [];
  if (!props.virtualized) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const vpH = typeof props.height === 'number' && props.height > 0 ? props.height : 420;
  const end = Math.min(total - 1, Math.ceil(vpH / Math.max(1, rowH)) - 1 + props.overscan);
  const out: number[] = [];
  for (let i = 0; i <= end; i += 1) out.push(i);
  return out;
}

const visibleIndices = shallowRef<number[]>(
  computeFallbackIndices(processedRows.value.length, effectiveRowHeight.value),
);
const offsetY = ref(0);
const totalBodyHeight = ref(processedRows.value.length * effectiveRowHeight.value);

function syncVirtualState(state: VirtualizerState) {
  if (!props.virtualized) return;
  if (visibleIndices.value !== state.visibleIndices) {
    visibleIndices.value = state.visibleIndices;
  }
  if (offsetY.value !== state.offsetY) {
    offsetY.value = state.offsetY;
  }
  if (totalBodyHeight.value !== state.totalHeight) {
    totalBodyHeight.value = state.totalHeight;
  }
}

function setupVirtualizer() {
  ctrl?.destroy();
  ctrl = null;
  if (!props.virtualized || !viewportEl.value) {
    visibleIndices.value = computeFallbackIndices(
      processedRows.value.length,
      effectiveRowHeight.value,
    );
    offsetY.value = 0;
    totalBodyHeight.value = processedRows.value.length * effectiveRowHeight.value;
    return;
  }
  ctrl = createVirtualizer(viewportEl.value, {
    count: processedRows.value.length,
    itemHeight: () => effectiveRowHeight.value,
    overscan: props.overscan,
    onChange: syncVirtualState,
  });
}

onMounted(() => {
  cssRowHeight.value = readProbeRowHeight();
  setupVirtualizer();

  if (typeof ResizeObserver !== 'undefined' && probeEl.value) {
    probeRo = new ResizeObserver(() => {
      const nextH = readProbeRowHeight();
      if (nextH !== cssRowHeight.value) {
        cssRowHeight.value = nextH;
        ctrl?.refresh();
      }
    });
    probeRo.observe(probeEl.value);
  }
});

watch(
  () => [processedRows.value.length, effectiveRowHeight.value, props.overscan, props.virtualized] as const,
  ([count, , overscan, virtualized], [, , , prevVirtualized]) => {
    if (focusedRow.value >= count && count > 0) {
      focusedRow.value = count - 1;
    }
    if (virtualized !== prevVirtualized) {
      setupVirtualizer();
      return;
    }
    if (virtualized && ctrl) {
      ctrl.setOptions({
        count,
        itemHeight: () => effectiveRowHeight.value,
        overscan,
      });
      ctrl.refresh();
    } else {
      visibleIndices.value = computeFallbackIndices(count, effectiveRowHeight.value);
      offsetY.value = 0;
      totalBodyHeight.value = count * effectiveRowHeight.value;
    }
  },
);

onBeforeUnmount(() => {
  ctrl?.destroy();
  ctrl = null;
  probeRo?.disconnect();
  probeRo = null;
  resizeCleanups.forEach((fn) => fn());
  resizeCleanups.clear();
  headCellElements.clear();
  headCellPinned.clear();
});

watch(
  () => props.columns.length,
  (colLen) => {
    if (colLen > 0 && focusedCol.value >= colLen) {
      focusedCol.value = colLen - 1;
    }
  },
);

function bindHeadCellRef(el: Element | ComponentPublicInstance | null, col: DataGridColumn<T>) {
  const prevCleanup = resizeCleanups.get(col.key);
  const domEl = el instanceof HTMLElement ? el : null;
  const prevEl = headCellElements.get(col.key);
  const prevPinned = headCellPinned.get(col.key);

  if (domEl === prevEl && prevPinned === col.pinned) return;
  if (prevCleanup) {
    prevCleanup();
    resizeCleanups.delete(col.key);
  }
  if (!domEl) {
    headCellElements.delete(col.key);
    headCellPinned.delete(col.key);
    return;
  }
  headCellElements.set(col.key, domEl);
  headCellPinned.set(col.key, col.pinned);
  if (col.resizable) {
    const cleanup = attachColumnResize(domEl, {
      minWidth: col.minWidth ?? 56,
      maxWidth: col.maxWidth,
      invert: col.pinned === 'right',
      getWidth: () => columnWidths.value[col.key] ?? domEl.getBoundingClientRect().width,
      onResize: (w) => {
        columnWidths.value = { ...columnWidths.value, [col.key]: w };
        emit('columnResize', col.key, w);
      },
    });
    resizeCleanups.set(col.key, cleanup);
  }
}

const hasPinnedLeft = computed(() => props.columns.some((c) => c.pinned === 'left'));

const pinnedOffsets = computed(() => {
  const leftMap: Record<string, number> = {};
  const rightMap: Record<string, number> = {};
  let leftAcc = hasCheckCol.value && hasPinnedLeft.value ? 36 : 0;
  for (const col of props.columns) {
    if (col.pinned === 'left') {
      leftMap[col.key] = leftAcc;
      leftAcc += columnWidths.value[col.key] ?? col.width ?? col.minWidth ?? 140;
    }
  }
  let rightAcc = 0;
  for (let i = props.columns.length - 1; i >= 0; i -= 1) {
    const col = props.columns[i];
    if (col.pinned === 'right') {
      rightMap[col.key] = rightAcc;
      rightAcc += columnWidths.value[col.key] ?? col.width ?? col.minWidth ?? 140;
    }
  }
  return { leftMap, rightMap };
});

function getColStyle(col: DataGridColumn<T>): CSSProperties {
  const resized = columnWidths.value[col.key];
  const minW = col.minWidth ?? 56;
  const style: Record<string, string> = {
    minInlineSize: `${minW}px`,
  };
  if (col.maxWidth != null && resized == null) {
    style.maxInlineSize = `${col.maxWidth}px`;
  }
  if (resized != null) {
    style.inlineSize = `${resized}px`;
    style.minInlineSize = `${resized}px`;
    style.maxInlineSize = `${resized}px`;
    style.flex = '0 0 auto';
  } else if (col.width != null) {
    style.inlineSize = `${col.width}px`;
    style.flex = '0 0 auto';
  } else if (col.flex != null) {
    style.flex = `${col.flex} 1 ${col.minWidth ?? 120}px`;
  } else {
    style.flex = `1 1 ${col.minWidth ?? 140}px`;
  }

  if (col.pinned === 'left') {
    style['--_pin-offset'] = `${pinnedOffsets.value.leftMap[col.key] ?? 0}px`;
  } else if (col.pinned === 'right') {
    style['--_pin-offset'] = `${pinnedOffsets.value.rightMap[col.key] ?? 0}px`;
  }
  return style as CSSProperties;
}

const sortLookup = computed(() => {
  const map = new Map<string, { direction: DataGridSortDirection; order: number }>();
  activeSorts.value.forEach((s, idx) => {
    map.set(s.key, { direction: s.direction, order: idx + 1 });
  });
  return map;
});

function updateSelectedKeys(next: (string | number)[]) {
  internalSelectedKeys.value = next;
  selectedKeysModel.value = next;
}

function updateSorts(next: DataGridSort[]) {
  internalSorts.value = next;
  sortsModel.value = next;
}

function handleSort(col: DataGridColumn<T>, multi: boolean) {
  if (!col.sortable) return;
  const next = nextGridSorts(activeSorts.value, col.key, multi);
  updateSorts(next);
}

function onHeaderSortClick(col: DataGridColumn<T>, colIndex: number, event: MouseEvent) {
  focusedRow.value = -1;
  focusedCol.value = colIndex;
  gridHasFocus.value = true;
  viewportEl.value?.focus({ preventScroll: true });
  handleSort(col, event.shiftKey);
}

function onHeaderCellClick(col: DataGridColumn<T>, colIndex: number, event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('.j-data-grid__resizer')) return;
  if (target?.closest('.j-data-grid__sort')) return;
  if (target?.closest('input, select, textarea, a, button')) return;

  focusedRow.value = -1;
  focusedCol.value = colIndex;
  gridHasFocus.value = true;
  viewportEl.value?.focus({ preventScroll: true });
  if (col.sortable) {
    handleSort(col, event.shiftKey);
  }
}

function onSearchInput(event: Event) {
  const val = (event.target as HTMLInputElement).value;
  internalSearch.value = val;
  searchModel.value = val;
  viewportEl.value?.scrollTo({ top: 0 });
}

function selectRowAt(rowIndex: number, extendRange: boolean, additiveToggle: boolean) {
  if (selectionMode.value === 'none') return;
  const keys = processedKeys.value;
  if (rowIndex < 0 || rowIndex >= keys.length) return;
  const targetKey = keys[rowIndex];

  if (selectionMode.value === 'single') {
    const already = selectedSet.value.has(targetKey);
    updateSelectedKeys(additiveToggle && already ? [] : [targetKey]);
    anchorSelectedIndex = rowIndex;
    return;
  }

  if (extendRange && anchorSelectedIndex !== null) {
    const start = Math.min(anchorSelectedIndex, rowIndex);
    const end = Math.max(anchorSelectedIndex, rowIndex);
    const next = new Set(activeSelectedKeys.value);
    for (let i = start; i <= end; i += 1) {
      next.add(keys[i]);
    }
    updateSelectedKeys(Array.from(next));
    return;
  }

  const next = new Set(activeSelectedKeys.value);
  if (next.has(targetKey)) next.delete(targetKey);
  else next.add(targetKey);
  anchorSelectedIndex = rowIndex;
  updateSelectedKeys(Array.from(next));
}

function toggleSelectAll() {
  if (selectionMode.value !== 'multiple') return;
  const next = new Set(activeSelectedKeys.value);
  if (allVisibleSelected.value) {
    processedKeys.value.forEach((k) => next.delete(k));
  } else {
    processedKeys.value.forEach((k) => next.add(k));
  }
  updateSelectedKeys(Array.from(next));
}

function selectAll() {
  if (processedKeys.value.length === 0) return;
  if (selectionMode.value === 'single') {
    updateSelectedKeys([processedKeys.value[0]]);
    return;
  }
  const merged = new Set([...activeSelectedKeys.value, ...processedKeys.value]);
  updateSelectedKeys(Array.from(merged));
}

function clearSelection() {
  anchorSelectedIndex = null;
  updateSelectedKeys([]);
}

function scrollToRow(index: number, align: VirtualScrollAlign = 'auto') {
  const count = processedRows.value.length;
  if (count <= 0) return;
  const clamped = Math.min(count - 1, Math.max(0, Math.floor(index)));
  if (props.virtualized && ctrl) {
    ctrl.scrollToIndex(clamped, align);
    return;
  }
  const vp = viewportEl.value;
  const rowEl = vp?.querySelector<HTMLElement>(`.j-data-grid__row[data-row-index="${clamped}"]`);
  rowEl?.scrollIntoView({ block: align === 'auto' ? 'nearest' : align });
}

function getEffectiveColWidth(col: DataGridColumn<T>): number {
  const el = headCellElements.get(col.key);
  if (el && el.offsetWidth > 0) return el.offsetWidth;
  return columnWidths.value[col.key] ?? col.width ?? col.minWidth ?? 140;
}

function scrollToCol(colIndex: number) {
  const vp = viewportEl.value;
  if (!vp || vp.clientWidth <= 0) return;
  const col = props.columns[colIndex];
  if (!col) return;
  if (colIndex === 0) {
    vp.scrollLeft = 0;
    return;
  }
  if (colIndex === props.columns.length - 1 && col.pinned === 'right') {
    vp.scrollLeft = Math.max(0, vp.scrollWidth - vp.clientWidth);
    return;
  }
  if (col.pinned === 'left' || col.pinned === 'right') return;

  let pinnedLeftTotal = hasCheckCol.value && hasPinnedLeft.value ? 36 : 0;
  let pinnedRightTotal = 0;
  for (const c of props.columns) {
    if (c.pinned === 'left') pinnedLeftTotal += getEffectiveColWidth(c);
    else if (c.pinned === 'right') pinnedRightTotal += getEffectiveColWidth(c);
  }

  let colStart = 0;
  let colEnd = 0;
  const targetEl = headCellElements.get(col.key);
  if (targetEl && targetEl.offsetWidth > 0) {
    colStart = targetEl.offsetLeft;
    colEnd = colStart + targetEl.offsetWidth;
  } else {
    let acc = hasCheckCol.value ? 36 : 0;
    for (let i = 0; i < colIndex; i += 1) {
      acc += getEffectiveColWidth(props.columns[i]);
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
}

function onRowClickInternal(row: T, rowIndex: number, colIndex: number, event: MouseEvent) {
  focusedRow.value = rowIndex;
  focusedCol.value = colIndex;

  const target = event.target as HTMLElement | null;
  const interactive = target?.closest('button, a, input, select, textarea');
  if (!interactive) {
    viewportEl.value?.focus({ preventScroll: true });
    if (selectionMode.value === 'single') {
      selectRowAt(rowIndex, false, event.metaKey || event.ctrlKey);
    } else if (selectionMode.value === 'multiple' && (event.shiftKey || event.metaKey || event.ctrlKey)) {
      if (event.shiftKey) event.preventDefault();
      selectRowAt(rowIndex, event.shiftKey, true);
    }
  }

  emit('rowClick', row, rowIndex, event);
}

function onCheckboxClick(rowIndex: number, event: MouseEvent) {
  event.stopPropagation();
  focusedRow.value = rowIndex;
  selectRowAt(rowIndex, event.shiftKey, true);
}

function onRowDblClick(row: T, rowIndex: number) {
  emit('rowActivate', row, rowIndex);
}

function onRowContextMenuInternal(row: T, rowIndex: number, event: MouseEvent) {
  focusedRow.value = rowIndex;
  emit('rowContextmenu', row, rowIndex, event);
}

function onViewportKeydown(event: KeyboardEvent) {
  gridHasFocus.value = true;
  const vp = viewportEl.value;
  const pageRows = vp
    ? Math.max(1, Math.floor(vp.clientHeight / Math.max(1, effectiveRowHeight.value)) - 1)
    : 10;

  handleGridKeydown(event, {
    rowCount: processedRows.value.length,
    colCount: props.columns.length,
    rowIndex: focusedRow.value,
    colIndex: focusedCol.value,
    pageSize: pageRows,
    selectable: props.selectable,
    onNavigate: ({ rowIndex, colIndex, extendSelection }) => {
      const prevCol = focusedCol.value;
      focusedRow.value = rowIndex;
      focusedCol.value = colIndex;
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
    onSelectAll: selectionMode.value === 'multiple' ? selectAll : undefined,
    onActivate: (rowIndex) => {
      const row = processedRows.value[rowIndex];
      if (row !== undefined) emit('rowActivate', row, rowIndex);
    },
    onHeaderActivate: (colIndex, ev) => {
      const col = props.columns[colIndex];
      if (col?.sortable) {
        handleSort(col, ev.shiftKey);
      }
    },
    onContextMenu: (rowIndex) => {
      const row = processedRows.value[rowIndex];
      if (row === undefined) return;
      const rowEl = viewportEl.value?.querySelector<HTMLElement>(
        `.j-data-grid__row[data-row-index="${rowIndex}"]`,
      );
      const rect = (rowEl ?? viewportEl.value)?.getBoundingClientRect();
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
        emit('rowContextmenu', row, rowIndex, synthetic);
      }
    },
  });
}

const rootStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.height != null) {
    style['--j-grid-h'] = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  if (props.rowHeight != null && props.rowHeight > 0) {
    style['--j-grid-row-h'] = `${props.rowHeight}px`;
  }
  return Object.keys(style).length > 0 ? style : undefined;
});

const bodyStyle = computed(() =>
  props.virtualized
    ? {
        '--_body-h': `${totalBodyHeight.value}px`,
        blockSize: `${totalBodyHeight.value}px`,
      }
    : undefined,
);

const rowsStyle = computed(() =>
  props.virtualized ? { '--_offset-y': `${offsetY.value}px` } : undefined,
);

const totalColCount = computed(() => props.columns.length + (hasCheckCol.value ? 1 : 0));

const renderedRowIndices = computed(() => {
  const len = processedRows.value.length;
  return visibleIndices.value.filter((idx) => idx >= 0 && idx < len);
});

const activeDescendantId = computed(() => {
  if (!gridHasFocus.value || props.columns.length === 0) {
    return undefined;
  }
  if (focusedRow.value === -1) {
    return focusedCol.value >= 0 && focusedCol.value < props.columns.length
      ? `${gridId}-h-${focusedCol.value}`
      : undefined;
  }
  if (processedRows.value.length === 0 || !renderedRowIndices.value.includes(focusedRow.value)) {
    return undefined;
  }
  return `${gridId}-c-${focusedRow.value}-${focusedCol.value}`;
});

defineExpose({
  scrollToRow,
  scrollToCol,
  clearSelection,
  selectAll,
});
</script>

<template>
  <div
    ref="rootEl"
    class="j-data-grid"
    data-j-managed=""
    :data-size="size === 'md' ? undefined : size"
    :data-density-mode="isDense ? 'dense' : undefined"
    :data-striped="striped ? '' : undefined"
    :data-bordered="bordered ? '' : undefined"
    :data-virtualized="virtualized ? undefined : 'false'"
    :aria-busy="loading ? 'true' : undefined"
    :style="rootStyle"
  >
    <div ref="probeEl" class="j-data-grid__row-probe" aria-hidden="true" />
    <div v-if="loading" class="j-data-grid__loading" aria-hidden="true" />

    <div
      v-if="searchable || $slots.toolbar || $slots['toolbar-actions']"
      class="j-data-grid__toolbar"
    >
      <slot name="toolbar">
        <label v-if="searchable" class="j-data-grid__search">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <input
            type="search"
            class="j-data-grid__search-input"
            :value="activeSearch"
            :placeholder="searchPlaceholder"
            aria-label="Filter grid rows"
            @input="onSearchInput"
          />
        </label>
        <div
          v-if="$slots['toolbar-actions'] || (hasCheckCol && activeSelectedKeys.length > 0)"
          class="j-data-grid__toolbar-actions"
        >
          <span v-if="hasCheckCol && activeSelectedKeys.length > 0" class="j-data-grid__meta">
            <strong>{{ activeSelectedKeys.length }}</strong> selected
          </span>
          <slot name="toolbar-actions" :selected-keys="activeSelectedKeys" />
        </div>
      </slot>
    </div>

    <div
      ref="viewportEl"
      class="j-data-grid__viewport"
      role="grid"
      tabindex="0"
      :aria-label="ariaLabel"
      :aria-rowcount="processedRows.length + 1"
      :aria-colcount="totalColCount"
      :aria-multiselectable="selectionMode === 'multiple' ? 'true' : undefined"
      :aria-activedescendant="activeDescendantId"
      @keydown="onViewportKeydown"
      @focus="gridHasFocus = true"
      @blur="gridHasFocus = false"
    >
      <div class="j-data-grid__header" role="row" :aria-rowindex="1">
        <div
          v-if="hasCheckCol"
          role="columnheader"
          class="j-data-grid__head-cell j-data-grid__check"
          :aria-colindex="1"
          :data-pinned="hasPinnedLeft ? 'left' : undefined"
        >
          <input
            v-if="selectionMode === 'multiple'"
            ref="selectAllEl"
            type="checkbox"
            class="j-checkbox"
            data-size="sm"
            aria-label="Select all rows"
            :checked="allVisibleSelected"
            @change="toggleSelectAll"
          />
        </div>

        <div
          v-for="(col, cIdx) in columns"
          :id="`${gridId}-h-${cIdx}`"
          :key="col.key"
          :ref="(el) => bindHeadCellRef(el, col)"
          role="columnheader"
          class="j-data-grid__head-cell"
          :aria-colindex="cIdx + (hasCheckCol ? 2 : 1)"
          :aria-sort="
            col.sortable
              ? sortLookup.get(col.key)?.direction === 'asc'
                ? 'ascending'
                : sortLookup.get(col.key)?.direction === 'desc'
                  ? 'descending'
                  : 'none'
              : undefined
          "
          :data-align="col.align"
          :data-pinned="col.pinned"
          :data-sortable="col.sortable ? '' : undefined"
          :data-focused="focusedRow === -1 && focusedCol === cIdx ? '' : undefined"
          :style="getColStyle(col)"
          @click="(ev) => onHeaderCellClick(col, cIdx, ev)"
        >
          <button
            v-if="col.sortable"
            type="button"
            class="j-data-grid__sort"
            tabindex="-1"
            @click="(ev) => onHeaderSortClick(col, cIdx, ev)"
          >
            <span class="j-data-grid__sort-label">
              <slot :name="`header-${col.key}`" :column="col">
                <slot name="header" :column="col">{{ col.label }}</slot>
              </slot>
            </span>
            <span class="j-data-grid__sort-icon" aria-hidden="true" />
            <span
              v-if="activeSorts.length > 1 && sortLookup.has(col.key)"
              class="j-data-grid__sort-badge"
              aria-hidden="true"
            >
              {{ sortLookup.get(col.key)?.order }}
            </span>
          </button>
          <span v-else class="j-data-grid__cell-text">
            <slot :name="`header-${col.key}`" :column="col">
              <slot name="header" :column="col">{{ col.label }}</slot>
            </slot>
          </span>

          <span
            v-if="col.resizable"
            class="j-data-grid__resizer"
            role="separator"
            aria-orientation="vertical"
            :aria-label="`Resize ${col.label}`"
          />
        </div>
      </div>

      <div v-if="processedRows.length === 0" class="j-data-grid__empty">
        <slot name="empty">
          <span class="j-data-grid__empty-title">{{ emptyTitle }}</span>
          <span class="j-data-grid__empty-desc">{{ emptyDescription }}</span>
        </slot>
      </div>

      <div v-else class="j-data-grid__body" :style="bodyStyle">
        <div class="j-data-grid__rows" :style="rowsStyle">
          <div
            v-for="rIdx in renderedRowIndices"
            :key="processedKeys[rIdx]"
            role="row"
            class="j-data-grid__row"
            :aria-rowindex="rIdx + 2"
            :aria-selected="
              hasCheckCol ? (selectedSet.has(processedKeys[rIdx]) ? 'true' : 'false') : undefined
            "
            :data-selected="
              hasCheckCol && selectedSet.has(processedKeys[rIdx]) ? '' : undefined
            "
            :data-odd="rIdx % 2 === 1 ? '' : undefined"
            :data-even="rIdx % 2 === 0 ? '' : undefined"
            :data-row-index="rIdx"
            @dblclick="onRowDblClick(processedRows[rIdx], rIdx)"
            @contextmenu="(ev) => onRowContextMenuInternal(processedRows[rIdx], rIdx, ev)"
          >
            <div
              v-if="hasCheckCol"
              role="gridcell"
              class="j-data-grid__cell j-data-grid__check"
              :aria-colindex="1"
              :data-pinned="hasPinnedLeft ? 'left' : undefined"
              @click="(ev) => onCheckboxClick(rIdx, ev)"
            >
              <input
                type="checkbox"
                class="j-checkbox"
                data-size="sm"
                tabindex="-1"
                :aria-label="`Select row ${rIdx + 1}`"
                :checked="selectedSet.has(processedKeys[rIdx])"
                @click.stop="(ev) => onCheckboxClick(rIdx, ev)"
                @change.prevent
              />
            </div>

            <div
              v-for="(col, cIdx) in columns"
              :id="`${gridId}-c-${rIdx}-${cIdx}`"
              :key="col.key"
              role="gridcell"
              class="j-data-grid__cell"
              :aria-colindex="cIdx + (hasCheckCol ? 2 : 1)"
              :data-align="col.align"
              :data-pinned="col.pinned"
              :data-mono="col.mono ? '' : undefined"
              :data-focused="
                gridHasFocus && focusedRow === rIdx && focusedCol === cIdx ? '' : undefined
              "
              :style="getColStyle(col)"
              @click="(ev) => onRowClickInternal(processedRows[rIdx], rIdx, cIdx, ev)"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="processedRows[rIdx]"
                :value="getCellValue(processedRows[rIdx], col)"
                :column="col"
                :row-index="rIdx"
              >
                <slot
                  name="cell"
                  :row="processedRows[rIdx]"
                  :value="getCellValue(processedRows[rIdx], col)"
                  :column="col"
                  :row-index="rIdx"
                >
                  <span class="j-data-grid__cell-text">
                    {{ formatCell(processedRows[rIdx], col, rIdx) }}
                  </span>
                </slot>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showFooter || $slots.footer" class="j-data-grid__footer">
      <slot
        name="footer"
        :row-count="processedRows.length"
        :total-count="rows.length"
        :selected-count="activeSelectedKeys.length"
      >
        <span class="j-data-grid__meta">
          <template v-if="processedRows.length !== rows.length">
            <strong>{{ processedRows.length.toLocaleString() }}</strong> of
            {{ rows.length.toLocaleString() }} rows
          </template>
          <template v-else>
            <strong>{{ processedRows.length.toLocaleString() }}</strong>
            {{ processedRows.length === 1 ? 'row' : 'rows' }}
          </template>
        </span>
        <span v-if="hasCheckCol && activeSelectedKeys.length > 0" class="j-data-grid__meta">
          <strong>{{ activeSelectedKeys.length.toLocaleString() }}</strong> selected
        </span>
      </slot>
    </div>
  </div>
</template>
