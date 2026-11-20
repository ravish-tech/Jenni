declare module 'jenni-core/behaviors/virtual-list.js' {
  export type VirtualScrollAlign = 'auto' | 'start' | 'center' | 'end';

  export interface VirtualizerState {
    startIndex: number;
    endIndex: number;
    offsetY: number;
    totalHeight: number;
    visibleIndices: number[];
    scrollTop: number;
    viewportHeight: number;
  }

  export interface VirtualizerOptions {
    count: number;
    itemHeight?: number | ((index: number) => number);
    estimateHeight?: number | (() => number);
    overscan?: number;
    onChange?: (state: VirtualizerState) => void;
  }

  export interface VirtualizerController {
    setOptions: (nextOptions: Partial<VirtualizerOptions>) => void;
    measureElement: (el: HTMLElement | null | undefined, index: number) => void;
    scrollToIndex: (
      index: number,
      align?: VirtualScrollAlign,
      behavior?: ScrollBehavior,
    ) => void;
    scrollToOffset: (offset: number, behavior?: ScrollBehavior) => void;
    getTotalHeight: () => number;
    getState: () => VirtualizerState;
    refresh: (clearCache?: boolean) => void;
    destroy: () => void;
  }

  export function createVirtualizer(
    viewportEl: HTMLElement,
    options: VirtualizerOptions,
  ): VirtualizerController;
}

declare module 'jenni-core/behaviors/data-grid.js' {
  export type GridSortDirection = 'asc' | 'desc';

  export interface GridSortDescriptor<T = any> {
    key: string;
    direction: GridSortDirection;
    comparator?: (a: T, b: T) => number;
  }

  export interface GridColumnLike<T = any> {
    key: string;
    searchable?: boolean;
    format?: (value: any, row: T, rowIndex: number) => string;
    comparator?: (a: T, b: T) => number;
  }

  export interface ColumnResizeOptions {
    minWidth?: number;
    maxWidth?: number;
    invert?: boolean;
    getWidth?: () => number;
    onResize?: (width: number) => void;
    onResizeEnd?: (width: number) => void;
  }

  export type GridKeyActionType =
    | 'navigate'
    | 'select'
    | 'select-all'
    | 'activate'
    | 'header-activate'
    | 'contextmenu';

  export interface GridKeyResult {
    type: GridKeyActionType;
    rowIndex: number;
    colIndex: number;
    extendSelection?: boolean;
  }

  export interface GridKeyState {
    rowCount: number;
    colCount: number;
    rowIndex: number;
    colIndex: number;
    pageSize?: number;
    selectable?: boolean | 'single' | 'multiple';
    onNavigate?: (next: {
      rowIndex: number;
      colIndex: number;
      extendSelection: boolean;
    }) => void;
    onToggleSelect?: (rowIndex: number, extendSelection: boolean) => void;
    onSelectAll?: () => void;
    onActivate?: (rowIndex: number) => void;
    onHeaderActivate?: (colIndex: number, event: KeyboardEvent) => void;
    onContextMenu?: (rowIndex: number, event: KeyboardEvent) => void;
  }

  export function nextGridSorts(
    currentSorts: ReadonlyArray<{ key: string; direction: GridSortDirection }>,
    key: string,
    multi?: boolean,
  ): Array<{ key: string; direction: GridSortDirection }>;

  export function sortGridRows<T>(
    rows: ReadonlyArray<T>,
    sorts?: ReadonlyArray<GridSortDescriptor<T>>,
    columns?: ReadonlyArray<GridColumnLike<T>>,
  ): T[];

  export function filterGridRows<T>(
    rows: ReadonlyArray<T>,
    query?: string,
    columns?: ReadonlyArray<GridColumnLike<T>>,
  ): T[];

  export function attachColumnResize(
    headCell: HTMLElement,
    options?: ColumnResizeOptions,
  ): () => void;

  export function handleGridKeydown(
    e: KeyboardEvent,
    state: GridKeyState,
  ): GridKeyResult | null;
}
