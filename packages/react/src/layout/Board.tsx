import type { CSSProperties, ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { attr, cx, type LayoutGap, type LayoutTone } from './types';

type BoardOwnProps<T extends ElementType> = {
  as?: T;
  gap?: LayoutGap;
  columnWidth?: string | number;
};

export type BoardProps<T extends ElementType = 'div'> = BoardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BoardOwnProps<T>>;

export function Board<T extends ElementType = 'div'>({
  as,
  gap = 'field',
  columnWidth,
  style,
  className,
  children,
  ...rest
}: BoardProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const mergedStyle: CSSProperties | undefined =
    columnWidth != null
      ? {
          ...style,
          ['--j-board-col-w' as string]:
            typeof columnWidth === 'number' ? `${columnWidth}px` : columnWidth,
        }
      : style;

  return (
    <Tag
      {...rest}
      className={cx('j-board', className)}
      data-gap={attr(gap, 'field')}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}

type BoardColumnOwnProps<T extends ElementType> = {
  as?: T;
  title?: ReactNode;
  count?: number | string;
  tone?: LayoutTone;
  dot?: boolean;
  header?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

export type BoardColumnProps<T extends ElementType = 'section'> = BoardColumnOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BoardColumnOwnProps<T>>;

export function BoardColumn<T extends ElementType = 'section'>({
  as,
  title,
  count,
  tone,
  dot,
  header,
  actions,
  footer,
  className,
  children,
  ...rest
}: BoardColumnProps<T>) {
  const Tag: ElementType = as ?? 'section';
  const hasHeader = header != null || title != null || count != null || actions != null;

  return (
    <Tag {...rest} className={cx('j-board__column', className)} data-tone={tone}>
      {hasHeader && (
        <header className="j-board__header">
          {header != null ? (
            header
          ) : (
            <>
              <div className="j-board__heading">
                {dot && <span className="j-board__dot" aria-hidden="true" />}
                {title != null && <span className="j-board__title">{title}</span>}
                {count != null && <span className="j-board__count">{count}</span>}
              </div>
              {actions != null && <div className="j-board__actions">{actions}</div>}
            </>
          )}
        </header>
      )}
      <div className="j-board__body">{children}</div>
      {footer != null && <footer className="j-board__footer">{footer}</footer>}
    </Tag>
  );
}
