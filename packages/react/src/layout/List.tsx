import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { attr, cx, type LayoutTone, type ListLines, type ListVariant } from './types';

type ListOwnProps<T extends ElementType> = {
  as?: T;
  variant?: ListVariant;
  lines?: ListLines;
  insetDivider?: boolean;
  tone?: LayoutTone;
};

export type ListProps<T extends ElementType = 'div'> = ListOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ListOwnProps<T>>;

export function List<T extends ElementType = 'div'>({
  as,
  variant = 'plain',
  lines = 1,
  insetDivider,
  tone,
  className,
  children,
  ...rest
}: ListProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const linesStr = String(lines);
  return (
    <Tag
      role={Tag === 'div' ? 'list' : undefined}
      {...rest}
      className={cx('j-list', className)}
      data-variant={attr(variant, 'plain')}
      data-lines={linesStr === '1' ? undefined : linesStr}
      data-inset-divider={insetDivider ? '' : undefined}
      data-tone={tone}
    >
      {children}
    </Tag>
  );
}

type ListItemOwnProps<T extends ElementType> = {
  as?: T;
  title?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  lines?: ListLines;
  interactive?: boolean;
  selected?: boolean;
  current?: boolean | 'page';
  disabled?: boolean;
  tone?: LayoutTone;
  children?: ReactNode;
};

export type ListItemProps<T extends ElementType = 'div'> = ListItemOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ListItemOwnProps<T>>;

export function ListItem<T extends ElementType = 'div'>({
  as,
  title,
  description,
  leading,
  trailing,
  lines,
  interactive,
  selected,
  current,
  disabled,
  tone,
  className,
  children,
  ...rest
}: ListItemProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const isButton = Tag === 'button';
  const ariaCurrent = current === 'page' || current === true ? 'page' : undefined;

  return (
    <Tag
      type={isButton ? 'button' : undefined}
      role={Tag === 'div' && !interactive && !selected ? 'listitem' : undefined}
      disabled={isButton && disabled ? true : undefined}
      aria-disabled={!isButton && disabled ? 'true' : undefined}
      aria-selected={selected ? 'true' : undefined}
      aria-current={ariaCurrent}
      {...rest}
      className={cx('j-list-item', className)}
      data-lines={lines != null ? String(lines) : undefined}
      data-interactive={interactive ? '' : undefined}
      data-tone={tone}
    >
      {leading != null && <span className="j-list-item__leading">{leading}</span>}
      <span className="j-list-item__body">
        {children != null ? (
          children
        ) : (
          <>
            {title != null && <span className="j-list-item__title">{title}</span>}
            {description != null && <span className="j-list-item__description">{description}</span>}
          </>
        )}
      </span>
      {trailing != null && <span className="j-list-item__trailing">{trailing}</span>}
    </Tag>
  );
}
