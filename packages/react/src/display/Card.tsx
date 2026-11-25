import type { ElementType, ReactNode, ComponentPropsWithoutRef } from 'react';
import { attr, type DisplaySize } from './types';

type CardOwnProps<T extends ElementType> = {
  /** Element to render. `a` and `button` make the card interactive. */
  as?: T;
  variant?: 'surface' | 'outline' | 'ghost' | 'elevated';
  size?: DisplaySize;
  title?: ReactNode;
  description?: ReactNode;
  /** Top-right header slot (e.g. a menu button). */
  action?: ReactNode;
  /** Full-bleed media on top. */
  media?: ReactNode;
  footer?: ReactNode;
  /** Footer on a tinted band with a top border. */
  footerDivider?: boolean;
  /** Force the interactive hover state (e.g. a clickable div). */
  interactive?: boolean;
  /** Remove `.j-card__body` padding for edge-to-edge grids, lists, editors, or terminals. */
  flush?: boolean;
  /** Alias for `flush`. */
  bodyFlush?: boolean;
};

export type CardProps<T extends ElementType = 'div'> = CardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>;

export function Card<T extends ElementType = 'div'>({
  as, variant = 'surface', size = 'md', title, description, action, media, footer, footerDivider,
  interactive, flush, bodyFlush, className, children, ...rest
}: CardProps<T>) {
  const Tag: ElementType = as ?? 'div';
  // Headings / divs are not valid inside <button>; use phrasing content there.
  const Part: ElementType = Tag === 'button' ? 'span' : 'div';
  const Title: ElementType = Tag === 'button' ? 'span' : 'h3';
  const hasHeader = title != null || description != null || action != null;

  return (
    <Tag
      {...rest}
      className={className ? `j-card ${className}` : 'j-card'}
      data-variant={attr(variant, 'surface')}
      data-size={attr(size, 'md')}
      data-interactive={interactive ? '' : undefined}
      data-flush={flush || bodyFlush ? '' : undefined}
    >
      {media != null && <Part className="j-card__media">{media}</Part>}
      {hasHeader && (
        <Part className="j-card__header">
          {title != null && <Title className="j-card__title">{title}</Title>}
          {description != null && <span className="j-card__description">{description}</span>}
          {action}
        </Part>
      )}
      {children != null && <Part className="j-card__body">{children}</Part>}
      {footer != null && (
        <Part className="j-card__footer" data-divider={footerDivider ? '' : undefined}>{footer}</Part>
      )}
    </Tag>
  );
}
