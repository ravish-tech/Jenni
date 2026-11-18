import type { CSSProperties, ComponentPropsWithoutRef, ElementType } from 'react';
import {
  attr,
  cx,
  type GridCols,
  type GridFlow,
  type GridOrder,
  type GridRowSpan,
  type GridSpan,
  type GridStart,
  type GridSubgrid,
  type LayoutAlign,
  type LayoutGap,
  type LayoutJustify,
} from './types';

type GridOwnProps<T extends ElementType> = {
  as?: T;
  cols?: GridCols;
  minCellWidth?: string | number;
  gap?: LayoutGap;
  colGap?: LayoutGap;
  rowGap?: LayoutGap;
  flow?: GridFlow;
  align?: LayoutAlign;
  justify?: LayoutJustify;
  container?: boolean;
  guides?: boolean;
};

export type GridProps<T extends ElementType = 'div'> = GridOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof GridOwnProps<T>>;

export function Grid<T extends ElementType = 'div'>({
  as,
  cols,
  minCellWidth,
  gap = 'group',
  colGap,
  rowGap,
  flow,
  align,
  justify,
  container,
  guides,
  style,
  className,
  children,
  ...rest
}: GridProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const mergedStyle: CSSProperties | undefined =
    minCellWidth != null
      ? {
          ...style,
          ['--j-grid-min' as string]: typeof minCellWidth === 'number' ? `${minCellWidth}px` : minCellWidth,
        }
      : style;

  return (
    <Tag
      {...rest}
      className={cx('j-grid', className)}
      data-cols={cols != null ? String(cols) : undefined}
      data-gap={attr(gap, 'group')}
      data-col-gap={colGap}
      data-row-gap={rowGap}
      data-flow={attr(flow, 'row')}
      data-align={align}
      data-justify={justify}
      data-container={container ? '' : undefined}
      data-guides={guides ? '' : undefined}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}

type ColOwnProps<T extends ElementType> = {
  as?: T;
  span?: GridSpan;
  sm?: GridSpan;
  md?: GridSpan;
  lg?: GridSpan;
  start?: GridStart;
  rowSpan?: GridRowSpan;
  order?: GridOrder;
  align?: LayoutAlign;
  subgrid?: GridSubgrid;
};

export type ColProps<T extends ElementType = 'div'> = ColOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ColOwnProps<T>>;
export type GridItemProps<T extends ElementType = 'div'> = ColProps<T>;

export function Col<T extends ElementType = 'div'>({
  as,
  span,
  sm,
  md,
  lg,
  start,
  rowSpan,
  order,
  align,
  subgrid,
  className,
  children,
  ...rest
}: ColProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const subgridAttr = !subgrid ? undefined : subgrid === true ? 'rows' : subgrid;

  return (
    <Tag
      {...rest}
      className={cx('j-col', className)}
      data-span={span != null ? String(span) : undefined}
      data-sm={sm != null ? String(sm) : undefined}
      data-md={md != null ? String(md) : undefined}
      data-lg={lg != null ? String(lg) : undefined}
      data-start={start != null ? String(start) : undefined}
      data-row-span={rowSpan != null ? String(rowSpan) : undefined}
      data-order={order != null ? String(order) : undefined}
      data-align={align}
      data-subgrid={subgridAttr}
    >
      {children}
    </Tag>
  );
}

export const GridItem = Col;
