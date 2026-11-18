import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { attr, cx, type LayoutAlign, type LayoutGap, type LayoutJustify } from './types';

type StackOwnProps<T extends ElementType> = {
  as?: T;
  gap?: LayoutGap;
  align?: LayoutAlign;
  justify?: LayoutJustify;
};

export type StackProps<T extends ElementType = 'div'> = StackOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof StackOwnProps<T>>;

export function Stack<T extends ElementType = 'div'>({
  as,
  gap = 'field',
  align,
  justify,
  className,
  children,
  ...rest
}: StackProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag
      {...rest}
      className={cx('j-stack', className)}
      data-gap={attr(gap, 'field')}
      data-align={align}
      data-justify={justify}
    >
      {children}
    </Tag>
  );
}
