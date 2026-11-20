import type { AriaRole, ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { Icon } from '../display/Icon';
import { attr, cx, type LayoutTone } from './types';

export type StatusBarVariant = 'subtle' | 'contrast' | 'accent';
export type StatusBarBorder = 'top' | 'bottom' | 'none';

type StatusBarOwnProps<T extends ElementType> = {
  as?: T;
  variant?: StatusBarVariant;
  border?: StatusBarBorder;
  ariaLabel?: string;
  role?: AriaRole;
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
};

export type StatusBarProps<T extends ElementType = 'div'> = StatusBarOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof StatusBarOwnProps<T>>;

export function StatusBar<T extends ElementType = 'div'>({
  as,
  variant = 'subtle',
  border = 'top',
  ariaLabel,
  'aria-label': ariaLabelAttr,
  role = 'region',
  start,
  center,
  end,
  className,
  children,
  ...rest
}: StatusBarProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const startNode = start ?? children;
  const resolvedLabel = ariaLabelAttr ?? ariaLabel ?? 'Status bar';

  return (
    <Tag
      {...rest}
      role={role}
      aria-label={resolvedLabel}
      className={cx('j-statusbar', className)}
      data-variant={attr(variant, 'subtle')}
      data-border={attr(border, 'top')}
    >
      {startNode != null && (
        <div className="j-statusbar__section" data-section="start">
          {startNode}
        </div>
      )}
      {center != null && (
        <div className="j-statusbar__section" data-section="center">
          {center}
        </div>
      )}
      {end != null && (
        <div className="j-statusbar__section" data-section="end">
          {end}
        </div>
      )}
    </Tag>
  );
}

type StatusBarItemOwnProps<T extends ElementType> = {
  as?: T;
  icon?: string | ReactNode;
  dot?: boolean;
  tone?: LayoutTone;
  interactive?: boolean;
  href?: string;
  title?: string;
  disabled?: boolean;
  children?: ReactNode;
};

export type StatusBarItemProps<T extends ElementType = 'span'> = StatusBarItemOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof StatusBarItemOwnProps<T>>;

export function StatusBarItem<T extends ElementType = 'span'>({
  as,
  icon,
  dot,
  tone,
  interactive,
  href,
  title,
  disabled,
  className,
  children,
  ...rest
}: StatusBarItemProps<T>) {
  const Tag: ElementType = as ?? (href ? 'a' : interactive ? 'button' : 'span');
  const isButton = Tag === 'button';

  return (
    <Tag
      {...rest}
      type={isButton ? 'button' : undefined}
      href={href}
      title={title}
      disabled={isButton && disabled ? true : undefined}
      aria-disabled={!isButton && disabled ? true : undefined}
      className={cx('j-statusbar__item', className)}
      data-tone={tone}
      data-interactive={interactive && !isButton && !href ? '' : undefined}
    >
      {dot && <span className="j-statusbar__dot" aria-hidden="true" />}
      {typeof icon === 'string' ? <Icon name={icon} size="xs" /> : icon}
      {children}
    </Tag>
  );
}
