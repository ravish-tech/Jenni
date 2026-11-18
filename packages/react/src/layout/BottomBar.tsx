import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { attr, cx, type BottomBarVariant, type LayoutTone } from './types';

type BottomBarOwnProps<T extends ElementType> = {
  as?: T;
  variant?: BottomBarVariant;
  sticky?: boolean;
  translucent?: boolean;
  tone?: LayoutTone;
};

export type BottomBarProps<T extends ElementType = 'nav'> = BottomBarOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BottomBarOwnProps<T>>;

export function BottomBar<T extends ElementType = 'nav'>({
  as,
  variant = 'tabs',
  sticky,
  translucent,
  tone,
  className,
  children,
  ...rest
}: BottomBarProps<T>) {
  const Tag: ElementType = as ?? 'nav';
  return (
    <Tag
      {...rest}
      className={cx('j-bottombar', className)}
      data-variant={attr(variant, 'tabs')}
      data-sticky={sticky ? '' : undefined}
      data-translucent={translucent ? '' : undefined}
      data-tone={tone}
    >
      {children}
    </Tag>
  );
}

type BottomBarItemOwnProps<T extends ElementType> = {
  as?: T;
  label?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  children?: ReactNode;
};

export type BottomBarItemProps<T extends ElementType = 'button'> = BottomBarItemOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BottomBarItemOwnProps<T>>;

export function BottomBarItem<T extends ElementType = 'button'>({
  as,
  label,
  icon,
  badge,
  active,
  disabled,
  className,
  children,
  ...rest
}: BottomBarItemProps<T>) {
  const Tag: ElementType = as ?? 'button';
  const isButton = Tag === 'button';

  return (
    <Tag
      type={isButton ? 'button' : undefined}
      disabled={isButton && disabled ? true : undefined}
      aria-disabled={!isButton && disabled ? 'true' : undefined}
      aria-current={active ? 'page' : undefined}
      {...rest}
      className={cx('j-bottombar__item', className)}
    >
      {icon != null && (
        <span className="j-bottombar__icon">
          {icon}
          {badge != null && <span className="j-bottombar__badge">{badge}</span>}
        </span>
      )}
      <span className="j-bottombar__label">{children ?? label}</span>
    </Tag>
  );
}
