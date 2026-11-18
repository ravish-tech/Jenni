import { Children, useState, type ComponentProps, type MouseEvent, type ReactNode } from 'react';
import { attr } from './types';

export type BreadcrumbSeparator = 'chevron' | 'slash';

export interface BreadcrumbProps extends ComponentProps<'nav'> {
  separator?: BreadcrumbSeparator;
  /** Alias for `separator`. */
  variant?: BreadcrumbSeparator;
  size?: 'sm' | 'md';
  /** Accessible `<nav>` label (default: 'Breadcrumb'). */
  label?: string;
  /** Collapse middle items behind an interactive `…` button when count exceeds `maxItems`. */
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
}

export function Breadcrumb({
  separator,
  variant,
  size = 'md',
  label = 'Breadcrumb',
  maxItems,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  className,
  children,
  ...rest
}: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  const resolvedSeparator = separator ?? variant ?? 'chevron';
  const all = Children.toArray(children);

  const shouldCollapse =
    !expanded &&
    maxItems != null &&
    maxItems >= 2 &&
    all.length > maxItems &&
    Math.max(1, itemsBeforeCollapse) + Math.max(1, itemsAfterCollapse) < all.length;

  const before = Math.max(1, itemsBeforeCollapse);
  const after = Math.max(1, itemsAfterCollapse);

  return (
    <nav
      aria-label={label}
      {...rest}
      className={className ? `j-breadcrumb ${className}` : 'j-breadcrumb'}
      data-separator={attr(resolvedSeparator, 'chevron')}
      data-size={attr(size, 'md')}
    >
      <ol className="j-breadcrumb__list">
        {shouldCollapse ? (
          <>
            {all.slice(0, before)}
            <li className="j-breadcrumb__item">
              <button
                type="button"
                className="j-breadcrumb__ellipsis"
                aria-label="Show hidden breadcrumbs"
                onClick={() => setExpanded(true)}
              >
                …
              </button>
            </li>
            {all.slice(all.length - after)}
          </>
        ) : (
          all
        )}
      </ol>
    </nav>
  );
}

export interface BreadcrumbItemProps extends Omit<ComponentProps<'li'>, 'onClick'> {
  href?: string;
  /** Marks the active destination (`aria-current="page"`). */
  current?: boolean;
  /** Renders a collapsed `…` trigger button. */
  ellipsis?: boolean;
  /** Accessible label for ellipsis trigger. */
  label?: string;
  icon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
}

export function BreadcrumbItem({
  href,
  current = false,
  ellipsis = false,
  label = 'More breadcrumbs',
  icon,
  onClick,
  className,
  children,
  ...rest
}: BreadcrumbItemProps) {
  return (
    <li
      {...rest}
      className={className ? `j-breadcrumb__item ${className}` : 'j-breadcrumb__item'}
    >
      {ellipsis ? (
        <button
          type="button"
          className="j-breadcrumb__ellipsis"
          aria-label={label}
          onClick={onClick}
        >
          {children ?? '…'}
        </button>
      ) : current || !href ? (
        <span className="j-breadcrumb__page" aria-current={current ? 'page' : undefined}>
          {icon}
          {children}
        </span>
      ) : (
        <a className="j-breadcrumb__link" href={href} onClick={onClick}>
          {icon}
          {children}
        </a>
      )}
    </li>
  );
}
