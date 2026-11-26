import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react';
import { attr, cx, type PageSize, type SectionLayout } from './types';

const PageStickyContext = createContext<boolean>(false);

function findNearestScrollParent(el: HTMLElement | null): Element | null {
  if (!el || typeof window === 'undefined') return null;
  let cur: HTMLElement | null = el.parentElement;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(cur);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

type PageOwnProps<T extends ElementType> = {
  as?: T;
  size?: PageSize;
  /** Convenience prop forwarding `sticky` to child `PageHeader`s via context. */
  stickyHeader?: boolean;
};

export type PageProps<T extends ElementType = 'div'> = PageOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof PageOwnProps<T>>;

export function Page<T extends ElementType = 'div'>({
  as,
  size = 'lg',
  stickyHeader,
  className,
  children,
  ...rest
}: PageProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <PageStickyContext value={Boolean(stickyHeader)}>
      <Tag
        {...rest}
        className={cx('j-page', className)}
        data-size={attr(size, 'lg')}
        data-sticky-header={stickyHeader ? '' : undefined}
      >
        {children}
      </Tag>
    </PageStickyContext>
  );
}

export interface PageHeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  bordered?: boolean;
  /** Stick to the top of the nearest scroll container with an IntersectionObserver hairline on scroll. */
  sticky?: boolean;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  bordered,
  sticky,
  className,
  children,
  ...rest
}: PageHeaderProps) {
  const inheritedSticky = use(PageStickyContext);
  const isSticky = sticky !== undefined ? Boolean(sticky) : inheritedSticky;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    if (!isSticky) {
      setIsStuck(false);
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const scrollRoot = findNearestScrollParent(sentinel);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const rootTop =
          entry.rootBounds?.top ?? (scrollRoot ? scrollRoot.getBoundingClientRect().top : 0);
        setIsStuck(entry.intersectionRatio === 0 && entry.boundingClientRect.top <= rootTop + 2);
      },
      { threshold: 0, root: scrollRoot },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [isSticky]);

  return (
    <>
      {isSticky && (
        <div ref={sentinelRef} className="j-page-header__sentinel" aria-hidden="true" />
      )}
      <header
        {...rest}
        className={cx('j-page-header', className)}
        data-bordered={bordered ? '' : undefined}
        data-sticky={isSticky ? '' : undefined}
        data-stuck={isSticky && isStuck ? '' : undefined}
      >
        {eyebrow != null && <div className="j-page-header__eyebrow">{eyebrow}</div>}
        <div className="j-page-header__main">
          <div className="j-page-header__text">
            {title != null && <h1 className="j-page-header__title">{title}</h1>}
            {description != null && <p className="j-page-header__description">{description}</p>}
            {children}
          </div>
          {actions != null && <div className="j-page-header__actions">{actions}</div>}
        </div>
      </header>
    </>
  );
}

type SectionOwnProps<T extends ElementType> = {
  as?: T;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  header?: ReactNode;
  layout?: SectionLayout;
  bordered?: boolean;
  children?: ReactNode;
};

export type SectionProps<T extends ElementType = 'section'> = SectionOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof SectionOwnProps<T>>;

export function Section<T extends ElementType = 'section'>({
  as,
  title,
  description,
  actions,
  header,
  layout = 'stack',
  bordered,
  className,
  children,
  ...rest
}: SectionProps<T>) {
  const Tag: ElementType = as ?? 'section';
  const hasHeader = header != null || title != null || description != null || actions != null;

  return (
    <Tag
      {...rest}
      className={cx('j-section', className)}
      data-layout={attr(layout, 'stack')}
      data-bordered={bordered ? '' : undefined}
    >
      {header != null ? (
        header
      ) : hasHeader ? (
        <header className="j-section__header">
          <div className="j-section__heading">
            {title != null && <h2 className="j-section__title">{title}</h2>}
            {description != null && <p className="j-section__description">{description}</p>}
          </div>
          {actions != null && <div className="j-section__actions">{actions}</div>}
        </header>
      ) : null}
      <div className="j-section__body">{children}</div>
    </Tag>
  );
}
