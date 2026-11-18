import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cx } from './types';

type TopBarOwnProps<T extends ElementType> = {
  as?: T;
  sticky?: boolean;
  translucent?: boolean;
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
};

export type TopBarProps<T extends ElementType = 'header'> = TopBarOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof TopBarOwnProps<T>>;

export function TopBar<T extends ElementType = 'header'>({
  as,
  sticky,
  translucent,
  start,
  center,
  end,
  className,
  children,
  ...rest
}: TopBarProps<T>) {
  const Tag: ElementType = as ?? 'header';
  const startNode = start ?? children;

  return (
    <Tag
      {...rest}
      className={cx('j-topbar', className)}
      data-sticky={sticky ? '' : undefined}
      data-translucent={translucent ? '' : undefined}
    >
      {startNode != null && <div className="j-topbar__start">{startNode}</div>}
      {center != null && <div className="j-topbar__center">{center}</div>}
      {end != null && <div className="j-topbar__end">{end}</div>}
    </Tag>
  );
}
