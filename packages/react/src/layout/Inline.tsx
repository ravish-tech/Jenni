import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { attr, cx, type LayoutAlign, type LayoutGap, type LayoutJustify } from './types';

type InlineOwnProps<T extends ElementType> = {
  as?: T;
  gap?: LayoutGap;
  align?: LayoutAlign;
  justify?: LayoutJustify;
  nowrap?: boolean;
};

export type InlineProps<T extends ElementType = 'div'> = InlineOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof InlineOwnProps<T>>;

export function Inline<T extends ElementType = 'div'>({
  as,
  gap = 'related',
  align,
  justify,
  nowrap,
  className,
  children,
  ...rest
}: InlineProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag
      {...rest}
      className={cx('j-inline', className)}
      data-gap={attr(gap, 'related')}
      data-align={attr(align, 'center')}
      data-justify={justify}
      data-nowrap={nowrap ? '' : undefined}
    >
      {children}
    </Tag>
  );
}
