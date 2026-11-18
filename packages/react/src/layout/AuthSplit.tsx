import type { CSSProperties, ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cx } from './types';

type AuthSplitOwnProps<T extends ElementType> = {
  as?: T;
  header?: ReactNode;
  footer?: ReactNode;
  showcase?: ReactNode;
  reverse?: boolean;
  stackShowcase?: boolean;
  embedded?: boolean;
  height?: string | number;
  children?: ReactNode;
};

export type AuthSplitProps<T extends ElementType = 'div'> = AuthSplitOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof AuthSplitOwnProps<T>>;

export function AuthSplit<T extends ElementType = 'div'>({
  as,
  header,
  footer,
  showcase,
  reverse,
  stackShowcase,
  embedded,
  height,
  style,
  className,
  children,
  ...rest
}: AuthSplitProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const mergedStyle: CSSProperties | undefined =
    height != null
      ? {
          ...style,
          ['--j-auth-h' as string]: typeof height === 'number' ? `${height}px` : height,
        }
      : style;

  return (
    <Tag
      {...rest}
      className={cx('j-auth-split', className)}
      data-reverse={reverse ? '' : undefined}
      data-stack-showcase={stackShowcase ? '' : undefined}
      data-embedded={embedded ? '' : undefined}
      style={mergedStyle}
    >
      <div className="j-auth-split__form">
        {header != null && <header className="j-auth-split__header">{header}</header>}
        <div className="j-auth-split__body">{children}</div>
        {footer != null && <footer className="j-auth-split__footer">{footer}</footer>}
      </div>

      {showcase != null && <aside className="j-auth-split__showcase">{showcase}</aside>}
    </Tag>
  );
}
