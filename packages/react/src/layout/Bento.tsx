import type { CSSProperties, ComponentPropsWithoutRef, ElementType } from 'react';
import { attr, cx, type BentoRowSpan, type BentoSpan, type LayoutGap } from './types';

type BentoOwnProps<T extends ElementType> = {
  as?: T;
  gap?: LayoutGap;
  rowMinHeight?: string | number;
};

export type BentoProps<T extends ElementType = 'div'> = BentoOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BentoOwnProps<T>>;

export function Bento<T extends ElementType = 'div'>({
  as,
  gap = 'group',
  rowMinHeight,
  style,
  className,
  children,
  ...rest
}: BentoProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const mergedStyle: CSSProperties | undefined =
    rowMinHeight != null
      ? {
          ...style,
          ['--j-bento-row-min' as string]:
            typeof rowMinHeight === 'number' ? `${rowMinHeight}px` : rowMinHeight,
        }
      : style;

  return (
    <Tag
      {...rest}
      className={cx('j-bento', className)}
      data-gap={attr(gap, 'group')}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}

type BentoCellOwnProps<T extends ElementType> = {
  as?: T;
  span?: BentoSpan;
  rowSpan?: BentoRowSpan;
  surface?: boolean;
};

export type BentoCellProps<T extends ElementType = 'div'> = BentoCellOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BentoCellOwnProps<T>>;

export function BentoCell<T extends ElementType = 'div'>({
  as,
  span = 4,
  rowSpan,
  surface,
  className,
  children,
  ...rest
}: BentoCellProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const spanStr = String(span);
  const rowSpanStr = rowSpan != null ? String(rowSpan) : undefined;

  return (
    <Tag
      {...rest}
      className={cx('j-bento__cell', className)}
      data-span={spanStr === '4' ? undefined : spanStr}
      data-row-span={rowSpanStr === '1' ? undefined : rowSpanStr}
      data-surface={surface ? '' : undefined}
    >
      {children}
    </Tag>
  );
}
