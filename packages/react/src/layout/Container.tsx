import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { attr, cx, type ContainerSize } from './types';

type ContainerOwnProps<T extends ElementType> = {
  as?: T;
  size?: ContainerSize;
  padded?: boolean;
};

export type ContainerProps<T extends ElementType = 'div'> = ContainerOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ContainerOwnProps<T>>;

export function Container<T extends ElementType = 'div'>({
  as,
  size = 'lg',
  padded,
  className,
  children,
  ...rest
}: ContainerProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag
      {...rest}
      className={cx('j-container', className)}
      data-size={attr(size, 'lg')}
      data-padded={padded ? '' : undefined}
    >
      {children}
    </Tag>
  );
}
