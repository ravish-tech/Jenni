import type { CSSProperties, ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cx } from './types';

type DocsLayoutOwnProps<T extends ElementType> = {
  as?: T;
  nav?: ReactNode;
  toc?: ReactNode;
  tocTitle?: ReactNode;
  embedded?: boolean;
  height?: string | number;
  children?: ReactNode;
};

export type DocsLayoutProps<T extends ElementType = 'div'> = DocsLayoutOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof DocsLayoutOwnProps<T>>;

export function DocsLayout<T extends ElementType = 'div'>({
  as,
  nav,
  toc,
  tocTitle,
  embedded,
  height,
  style,
  className,
  children,
  ...rest
}: DocsLayoutProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const mergedStyle: CSSProperties | undefined =
    height != null
      ? {
          ...style,
          ['--j-docs-h' as string]: typeof height === 'number' ? `${height}px` : height,
        }
      : style;

  return (
    <Tag
      {...rest}
      className={cx('j-docs-layout', className)}
      data-embedded={embedded ? '' : undefined}
      style={mergedStyle}
    >
      {nav != null && (
        <aside className="j-docs-layout__nav" aria-label="Documentation navigation">
          <div className="j-docs-layout__nav-inner">{nav}</div>
        </aside>
      )}

      <article className="j-docs-layout__main">
        <div className="j-docs-layout__prose">{children}</div>
      </article>

      {toc != null && (
        <aside className="j-docs-layout__toc" aria-label="On this page">
          <div className="j-docs-layout__toc-inner">
            {tocTitle != null && <div className="j-docs-layout__toc-title">{tocTitle}</div>}
            {toc}
          </div>
        </aside>
      )}
    </Tag>
  );
}
