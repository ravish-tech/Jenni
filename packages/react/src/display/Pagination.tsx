import { useMemo, useState, type ComponentProps } from 'react';
import { attr, type DisplayTone } from './types';

export type PaginationVariant = 'outline' | 'soft' | 'solid' | 'simple';

export interface PaginationProps extends Omit<ComponentProps<'nav'>, 'defaultValue' | 'onChange'> {
  /** Controlled 1-indexed active page. */
  page?: number;
  /** Alias for `page`. */
  value?: number;
  /** Initial 1-indexed page when uncontrolled. */
  defaultPage?: number;
  /** Alias for `defaultPage`. */
  defaultValue?: number;
  /** Called when active page changes. */
  onPageChange?: (page: number) => void;
  /** Alias for `onPageChange`. */
  onValueChange?: (page: number) => void;
  /** Total item count (used with `pageSize` when `totalPages` is omitted). */
  total?: number;
  /** Items per page (default: 10). */
  pageSize?: number;
  /** Explicit page count (overrides `total / pageSize`). */
  totalPages?: number;
  /** Sibling pages shown on each side of active page (default: 1). */
  siblingCount?: number;
  /** Boundary pages pinned at start and end (default: 1). */
  boundaryCount?: number;
  variant?: PaginationVariant;
  size?: 'sm' | 'md';
  tone?: DisplayTone;
  /** Show text labels next to Previous / Next chevrons. */
  showLabels?: boolean;
  disabled?: boolean;
  /** Accessible `<nav>` label (default: 'Pagination'). */
  label?: string;
}

type PageToken = number | 'ellipsis-start' | 'ellipsis-end';

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export function Pagination({
  page,
  value,
  defaultPage,
  defaultValue,
  onPageChange,
  onValueChange,
  total,
  pageSize = 10,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
  variant = 'outline',
  size = 'md',
  tone,
  showLabels,
  disabled = false,
  label = 'Pagination',
  className,
  ...rest
}: PaginationProps) {
  const controlled = page ?? value;
  const [internal, setInternal] = useState(defaultPage ?? defaultValue ?? 1);

  const pageCount =
    totalPages != null
      ? Math.max(1, Math.floor(totalPages))
      : total != null
        ? Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
        : 1;

  const currentPage = Math.min(Math.max(1, controlled ?? internal), pageCount);
  const renderLabels = showLabels ?? variant === 'simple';

  const tokens = useMemo<PageToken[]>(() => {
    const sibling = Math.max(0, siblingCount);
    const boundary = Math.max(0, boundaryCount);
    const maxSlots = boundary * 2 + sibling * 2 + 3;

    if (pageCount <= maxSlots) return range(1, pageCount);

    const leftSibling = Math.max(currentPage - sibling, boundary + 1);
    const rightSibling = Math.min(currentPage + sibling, pageCount - boundary);

    const showLeftDots = leftSibling > boundary + 2;
    const showRightDots = rightSibling < pageCount - boundary - 1;

    const startPages = range(1, boundary);
    const endPages = range(pageCount - boundary + 1, pageCount);

    if (!showLeftDots && showRightDots) {
      const leftCount = boundary + 2 + sibling * 2;
      return [...range(1, leftCount), 'ellipsis-end', ...endPages];
    }
    if (showLeftDots && !showRightDots) {
      const rightCount = boundary + 2 + sibling * 2;
      return [...startPages, 'ellipsis-start', ...range(pageCount - rightCount + 1, pageCount)];
    }
    return [
      ...startPages,
      'ellipsis-start',
      ...range(leftSibling, rightSibling),
      'ellipsis-end',
      ...endPages,
    ];
  }, [pageCount, currentPage, siblingCount, boundaryCount]);

  const selectPage = (next: number) => {
    if (disabled) return;
    const clamped = Math.min(Math.max(1, next), pageCount);
    if (clamped === currentPage) return;
    if (controlled === undefined) setInternal(clamped);
    onPageChange?.(clamped);
    onValueChange?.(clamped);
  };

  const prevSvg = (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.75 4.25 6 8l3.75 3.75" />
    </svg>
  );
  const nextSvg = (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.25 4.25 10 8l-3.75 3.75" />
    </svg>
  );

  return (
    <nav
      aria-label={label}
      {...rest}
      className={className ? `j-pagination ${className}` : 'j-pagination'}
      data-variant={attr(variant, 'outline')}
      data-size={attr(size, 'md')}
      data-tone={tone}
    >
      {variant === 'simple' ? (
        <>
          <button
            type="button"
            className="j-pagination__item j-pagination__prev"
            disabled={disabled || currentPage <= 1}
            aria-label="Previous page"
            onClick={() => selectPage(currentPage - 1)}
          >
            {prevSvg}
            {renderLabels && <span>Previous</span>}
          </button>
          <span className="j-pagination__status" aria-live="polite">
            Page <strong>{currentPage}</strong> of <strong>{pageCount}</strong>
          </span>
          <button
            type="button"
            className="j-pagination__item j-pagination__next"
            disabled={disabled || currentPage >= pageCount}
            aria-label="Next page"
            onClick={() => selectPage(currentPage + 1)}
          >
            {renderLabels && <span>Next</span>}
            {nextSvg}
          </button>
        </>
      ) : (
        <ul className="j-pagination__list">
          <li>
            <button
              type="button"
              className="j-pagination__item j-pagination__prev"
              disabled={disabled || currentPage <= 1}
              aria-label="Previous page"
              onClick={() => selectPage(currentPage - 1)}
            >
              {prevSvg}
              {renderLabels && <span>Previous</span>}
            </button>
          </li>
          {tokens.map((token) => (
            <li key={token}>
              {typeof token === 'string' ? (
                <span className="j-pagination__ellipsis" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  type="button"
                  className="j-pagination__item"
                  disabled={disabled}
                  aria-current={token === currentPage ? 'page' : undefined}
                  aria-label={`Page ${token}`}
                  onClick={() => selectPage(token)}
                >
                  {token}
                </button>
              )}
            </li>
          ))}
          <li>
            <button
              type="button"
              className="j-pagination__item j-pagination__next"
              disabled={disabled || currentPage >= pageCount}
              aria-label="Next page"
              onClick={() => selectPage(currentPage + 1)}
            >
              {renderLabels && <span>Next</span>}
              {nextSvg}
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}
