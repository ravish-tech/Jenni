import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Pagination } from './Pagination';
import {
  attr,
  type DisplaySize,
  type TableAlign,
  type TableSortDirection,
  type TableVariant,
} from './types';

export type { TableVariant, TableAlign, TableSortDirection };

export interface TableProps extends Omit<ComponentProps<'table'>, 'caption'> {
  variant?: TableVariant;
  size?: DisplaySize;
  hover?: boolean;
  stickyHeader?: boolean;
  pinFirst?: boolean;
  pinLast?: boolean;
  caption?: ReactNode;
  maxHeight?: string | number;
  wrapClassName?: string;
}

export function Table({
  variant = 'surface',
  size = 'md',
  hover = false,
  stickyHeader = false,
  pinFirst = false,
  pinLast = false,
  caption,
  maxHeight,
  wrapClassName,
  className,
  children,
  ...rest
}: TableProps) {
  const wrapStyle: CSSProperties | undefined =
    maxHeight != null
      ? ({
          '--j-table-max-height': typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        } as CSSProperties)
      : undefined;

  return (
    <div
      className={wrapClassName ? `j-table-wrap ${wrapClassName}` : 'j-table-wrap'}
      data-variant={attr(variant, 'surface')}
      data-size={attr(size, 'md')}
      data-hover={hover ? '' : undefined}
      data-sticky-header={stickyHeader ? '' : undefined}
      style={wrapStyle}
    >
      <table
        {...rest}
        className={className ? `j-table ${className}` : 'j-table'}
        data-pin-first={pinFirst ? '' : undefined}
        data-pin-last={pinLast ? '' : undefined}
      >
        {caption != null && <caption>{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export interface DataTableColumn<T = any> {
  key: string;
  label: ReactNode;
  sortable?: boolean;
  align?: TableAlign;
  numeric?: boolean;
  width?: string | number;
  pin?: 'start' | 'end';
  format?: (value: any, row: T, index: number) => string;
  render?: (value: any, row: T, index: number) => ReactNode;
}

export interface DataTableProps<T = any>
  extends Omit<ComponentProps<'div'>, 'onSelect' | 'defaultValue'> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey?: string | ((row: T, index: number) => string | number);
  selectable?: boolean;
  selected?: (string | number)[];
  defaultSelected?: (string | number)[];
  onSelectedChange?: (selected: (string | number)[]) => void;
  sortBy?: string;
  defaultSortBy?: string;
  onSortByChange?: (sortBy: string) => void;
  sortDir?: TableSortDirection;
  defaultSortDir?: TableSortDirection;
  onSortDirChange?: (sortDir: TableSortDirection) => void;
  onSortChange?: (sortBy: string, sortDir: TableSortDirection) => void;
  searchable?: boolean;
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  pageSize?: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  variant?: TableVariant;
  size?: DisplaySize;
  hover?: boolean;
  stickyHeader?: boolean;
  pinFirst?: boolean;
  pinLast?: boolean;
  maxHeight?: string | number;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  empty?: ReactNode;
  toolbar?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  caption?: ReactNode;
}

export function DataTable<T extends object = Record<string, any>>({
  columns,
  rows,
  rowKey = 'id',
  selectable = false,
  selected,
  defaultSelected = [],
  onSelectedChange,
  sortBy,
  defaultSortBy,
  onSortByChange,
  sortDir,
  defaultSortDir = 'asc',
  onSortDirChange,
  onSortChange,
  searchable = false,
  search,
  defaultSearch = '',
  onSearchChange,
  searchPlaceholder = 'Filter rows…',
  pageSize,
  page,
  defaultPage = 1,
  onPageChange,
  variant = 'surface',
  size = 'md',
  hover = true,
  stickyHeader = false,
  pinFirst = false,
  pinLast = false,
  maxHeight,
  emptyTitle = 'No matching records',
  emptyDescription = 'Adjust your search or clear active filters.',
  empty,
  toolbar,
  actions,
  footer,
  caption,
  className,
  ...rest
}: DataTableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<(string | number)[]>(defaultSelected);
  const [internalSortBy, setInternalSortBy] = useState<string | undefined>(defaultSortBy);
  const [internalSortDir, setInternalSortDir] = useState<TableSortDirection>(defaultSortDir);
  const [internalSearch, setInternalSearch] = useState(defaultSearch);
  const [internalPage, setInternalPage] = useState(defaultPage);

  const selectedKeys = selected !== undefined ? selected : internalSelected;
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const activeSortBy = sortBy !== undefined ? sortBy : internalSortBy;
  const activeSortDir = sortDir !== undefined ? sortDir : internalSortDir;
  const activeSearch = search !== undefined ? search : internalSearch;

  const getKey = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    const val = (row as Record<string, unknown>)[rowKey];
    return typeof val === 'string' || typeof val === 'number' ? val : index;
  };

  const getCellValue = (row: T, col: DataTableColumn<T>): unknown =>
    (row as Record<string, unknown>)[col.key];

  const formatCell = (row: T, col: DataTableColumn<T>, index: number): string => {
    const raw = getCellValue(row, col);
    if (col.format) return col.format(raw, row, index);
    return raw == null ? '' : String(raw);
  };

  const filteredRows = useMemo(() => {
    const q = activeSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row, idx) =>
      columns.some((col) => formatCell(row, col, idx).toLowerCase().includes(q)),
    );
  }, [rows, columns, activeSearch]);

  const sortedRows = useMemo(() => {
    if (!activeSortBy) return filteredRows;
    const col = columns.find((c) => c.key === activeSortBy);
    if (!col) return filteredRows;
    const dir = activeSortDir === 'asc' ? 1 : -1;

    return [...filteredRows].sort((a, b) => {
      const va = getCellValue(a, col);
      const vb = getCellValue(b, col);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true }) * dir;
    });
  }, [filteredRows, columns, activeSortBy, activeSortDir]);

  const pageCount =
    pageSize && pageSize > 0 ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;
  const currentPage = Math.min(Math.max(1, page ?? internalPage), pageCount);

  const pagedRows = useMemo(() => {
    if (!pageSize || pageSize <= 0) return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, pageSize, currentPage]);

  const pagedKeys = useMemo(
    () =>
      pagedRows.map((row, idx) => {
        const baseIdx = pageSize && pageSize > 0 ? (currentPage - 1) * pageSize + idx : idx;
        return getKey(row, baseIdx);
      }),
    [pagedRows, pageSize, currentPage, rowKey],
  );

  const allPageSelected =
    pagedKeys.length > 0 && pagedKeys.every((k) => selectedSet.has(k));
  const somePageSelected =
    !allPageSelected && pagedKeys.some((k) => selectedSet.has(k));

  const selectAllRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected;
    }
  }, [somePageSelected]);

  const updateSelected = (next: (string | number)[]) => {
    if (selected === undefined) setInternalSelected(next);
    onSelectedChange?.(next);
  };

  const toggleSelectAll = () => {
    const current = new Set(selectedKeys);
    if (allPageSelected) {
      pagedKeys.forEach((k) => current.delete(k));
    } else {
      pagedKeys.forEach((k) => current.add(k));
    }
    updateSelected(Array.from(current));
  };

  const toggleRow = (key: string | number) => {
    const current = new Set(selectedKeys);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    updateSelected(Array.from(current));
  };

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    if (activeSortBy === col.key) {
      const nextDir: TableSortDirection = activeSortDir === 'asc' ? 'desc' : 'asc';
      if (sortDir === undefined) setInternalSortDir(nextDir);
      onSortDirChange?.(nextDir);
      onSortChange?.(col.key, nextDir);
    } else {
      if (sortBy === undefined) setInternalSortBy(col.key);
      if (sortDir === undefined) setInternalSortDir('asc');
      onSortByChange?.(col.key);
      onSortDirChange?.('asc');
      onSortChange?.(col.key, 'asc');
    }
  };

  const handleSearchChange = (val: string) => {
    if (search === undefined) setInternalSearch(val);
    if (page === undefined) setInternalPage(1);
    onSearchChange?.(val);
    onPageChange?.(1);
  };

  const handlePageChange = (next: number) => {
    if (page === undefined) setInternalPage(next);
    onPageChange?.(next);
  };

  const wrapStyle: CSSProperties | undefined =
    maxHeight != null
      ? ({
          '--j-table-max-height': typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        } as CSSProperties)
      : undefined;

  const totalColSpan = columns.length + (selectable ? 1 : 0);
  const rangeText = (() => {
    const total = sortedRows.length;
    if (total === 0) return '0 results';
    if (!pageSize || pageSize <= 0) return `${total} ${total === 1 ? 'row' : 'rows'}`;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(total, currentPage * pageSize);
    return `${start}–${end} of ${total}`;
  })();

  return (
    <div
      {...rest}
      data-j-managed=""
      className={className ? `j-data-table ${className}` : 'j-data-table'}
      data-variant={attr(variant, 'surface')}
      data-size={attr(size, 'md')}
      data-hover={hover ? '' : undefined}
    >
      {(searchable || toolbar != null || actions != null) && (
        <div className="j-data-table__toolbar">
          {toolbar ?? (
            <>
              {searchable && (
                <label className="j-data-table__search">
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
                    value={activeSearch}
                    placeholder={searchPlaceholder}
                    aria-label="Filter table rows"
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </label>
              )}
              {(actions != null || (selectable && selectedKeys.length > 0)) && (
                <div className="j-data-table__actions">
                  {selectable && selectedKeys.length > 0 && (
                    <span className="j-data-table__meta">
                      <strong>{selectedKeys.length}</strong> selected
                    </span>
                  )}
                  {actions}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div
        className="j-table-wrap"
        data-variant={attr(variant, 'surface')}
        data-size={attr(size, 'md')}
        data-hover={hover ? '' : undefined}
        data-sticky-header={stickyHeader ? '' : undefined}
        style={wrapStyle}
      >
        <table
          className="j-table"
          data-pin-first={pinFirst ? '' : undefined}
          data-pin-last={pinLast ? '' : undefined}
        >
          {caption != null && <caption>{caption}</caption>}
          <thead>
            <tr>
              {selectable && (
                <th
                  scope="col"
                  className="j-table__check"
                  data-pin={pinFirst ? 'start' : undefined}
                >
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="j-checkbox"
                    data-size="sm"
                    aria-label="Select all rows"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => {
                const colAlign = col.align ?? (col.numeric ? 'end' : undefined);
                const sortAttr = col.sortable
                  ? activeSortBy === col.key
                    ? activeSortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined;
                const widthStyle =
                  col.width != null
                    ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width }
                    : undefined;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={widthStyle}
                    data-align={colAlign}
                    data-pin={col.pin}
                    aria-sort={sortAttr}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className="j-table__sort"
                        onClick={() => toggleSort(col)}
                      >
                        <span>{col.label}</span>
                        <span className="j-table__sort-icon" aria-hidden="true" />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr data-empty="">
                <td colSpan={totalColSpan} className="j-table__empty">
                  {empty ?? (
                    <>
                      <span className="j-table__empty-title">{emptyTitle}</span>
                      <span className="j-table__empty-desc">{emptyDescription}</span>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              pagedRows.map((row, rIdx) => {
                const key = pagedKeys[rIdx];
                const isRowSelected = selectable && selectedSet.has(key);

                return (
                  <tr
                    key={key}
                    data-selected={isRowSelected ? '' : undefined}
                    aria-selected={selectable ? (isRowSelected ? 'true' : 'false') : undefined}
                  >
                    {selectable && (
                      <td
                        className="j-table__check"
                        data-pin={pinFirst ? 'start' : undefined}
                      >
                        <input
                          type="checkbox"
                          className="j-checkbox"
                          data-size="sm"
                          aria-label={`Select row ${rIdx + 1}`}
                          checked={isRowSelected}
                          onChange={() => toggleRow(key)}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const colAlign = col.align ?? (col.numeric ? 'end' : undefined);
                      const raw = getCellValue(row, col);
                      return (
                        <td
                          key={col.key}
                          data-align={colAlign}
                          data-numeric={col.numeric ? '' : undefined}
                          data-pin={col.pin}
                        >
                          {col.render ? col.render(raw, row, rIdx) : formatCell(row, col, rIdx)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {((pageSize && pageSize > 0) || footer != null) && (
        <div className="j-data-table__footer">
          {footer ?? (
            <>
              <span className="j-data-table__meta">
                {rangeText}
                {selectable && selectedKeys.length > 0 && (
                  <>
                    {' · '}
                    <strong>{selectedKeys.length}</strong> selected
                  </>
                )}
              </span>
              {pageSize && pageSize > 0 && pageCount > 1 && (
                <Pagination
                  page={currentPage}
                  size="sm"
                  totalPages={pageCount}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
