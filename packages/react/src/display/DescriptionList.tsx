import type { CSSProperties, ComponentProps, ReactNode } from 'react';
import { attr } from './types';

export type DescriptionListLayout = 'horizontal' | 'stacked' | 'grid';
export type DescriptionListVariant = 'divided' | 'striped' | 'bordered' | 'plain';
export type DescriptionListSize = 'sm' | 'md';
export type DescriptionListCols = 1 | 2 | 3;
export type DescriptionItemSpan = 1 | 2 | 3;

export interface DescriptionListEntry {
  term: string;
  details: string | number;
  mono?: boolean;
  span?: DescriptionItemSpan;
}

export interface DescriptionListProps extends ComponentProps<'dl'> {
  /** Key/value arrangement (`horizontal` | `stacked` | `grid`). */
  layout?: DescriptionListLayout;
  /** Column count when `layout="grid"` (`@container` responsive). */
  cols?: DescriptionListCols;
  /** Visual row/cell divider treatment. */
  variant?: DescriptionListVariant;
  /** Spacing & typographic density. */
  size?: DescriptionListSize;
  /** Fixed or flexible term column width in `horizontal` layout (`--j-dl-term-w`). */
  termWidth?: string | number;
  /** Optional data-driven shorthand items. */
  items?: DescriptionListEntry[];
}

export interface DescriptionItemProps extends ComponentProps<'div'> {
  /** Metadata key / label. */
  term?: ReactNode;
  /** Metadata value when `children` is omitted. */
  details?: ReactNode;
  /** Render value in monospace with `tabular-nums`. */
  mono?: boolean;
  /** Column span (1..3) when parent `DescriptionList` uses `layout="grid"`. */
  span?: DescriptionItemSpan;
}

export function DescriptionItem({
  term,
  details,
  mono = false,
  span,
  className,
  children,
  ...rest
}: DescriptionItemProps) {
  return (
    <div
      {...rest}
      className={className ? `j-dl__item ${className}` : 'j-dl__item'}
      data-mono={mono ? '' : undefined}
      data-span={span && span > 1 ? String(span) : undefined}
    >
      <dt className="j-dl__term">{term}</dt>
      <dd className="j-dl__details">{children ?? details}</dd>
    </div>
  );
}

export function DescriptionList({
  layout = 'horizontal',
  cols,
  variant = 'divided',
  size = 'md',
  termWidth,
  items,
  className,
  style,
  children,
  ...rest
}: DescriptionListProps) {
  const mergedStyle: CSSProperties | undefined =
    termWidth !== undefined
      ? ({
          '--j-dl-term-w': typeof termWidth === 'number' ? `${termWidth}px` : termWidth,
          ...style,
        } as CSSProperties)
      : style;

  return (
    <dl
      {...rest}
      style={mergedStyle}
      className={className ? `j-dl ${className}` : 'j-dl'}
      data-layout={attr(layout, 'horizontal')}
      data-cols={layout === 'grid' && cols ? String(cols) : undefined}
      data-variant={attr(variant, 'divided')}
      data-size={attr(size, 'md')}
    >
      {items && items.length > 0
        ? items.map((entry, idx) => (
            <DescriptionItem
              key={idx}
              term={entry.term}
              details={entry.details}
              mono={entry.mono}
              span={entry.span}
            />
          ))
        : children}
    </dl>
  );
}
