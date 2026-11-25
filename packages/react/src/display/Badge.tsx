import type {
  CSSProperties,
  ComponentProps,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import { getEntityHue } from 'jenni-core/behaviors/entity-color.js';
import { attr, type DisplaySize, type DisplayTone } from './types';

export interface BadgeProps extends ComponentProps<'span'> {
  variant?: 'soft' | 'solid' | 'outline';
  size?: DisplaySize;
  tone?: DisplayTone;
  /** Show a leading status dot. */
  dot?: boolean;
  icon?: ReactNode;
  /** Render a trailing `×` remove button and invoke `onRemove`. */
  removable?: boolean;
  /** Alias for `removable`. */
  closable?: boolean;
  /** Accessible label for the remove button (default: 'Remove'). */
  removeLabel?: string;
  /** Fired when the trailing remove button is clicked. */
  onRemove?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  /** Deterministic per-entity color seed (`true` hashes badge text). */
  colorSeed?: string | boolean;
  /** Alias for `colorSeed={true}`. */
  autoColor?: boolean;
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextContent).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    if (props?.children !== undefined) return extractTextContent(props.children);
  }
  return '';
}

export function Badge({
  variant = 'soft',
  size = 'md',
  tone,
  dot,
  icon,
  removable,
  closable,
  removeLabel = 'Remove',
  onRemove,
  colorSeed,
  autoColor,
  className,
  style,
  children,
  ...rest
}: BadgeProps) {
  let entityHue: number | undefined;
  if (!tone) {
    if (typeof colorSeed === 'string' && colorSeed.trim()) {
      entityHue = getEntityHue(colorSeed.trim());
    } else if (colorSeed === true || autoColor === true) {
      const text = extractTextContent(children).trim();
      if (text) entityHue = getEntityHue(text);
    }
  }

  const mergedStyle =
    entityHue !== undefined
      ? ({ '--j-entity-hue': String(entityHue), ...style } as CSSProperties)
      : style;

  return (
    <span
      {...rest}
      style={mergedStyle}
      className={className ? `j-badge ${className}` : 'j-badge'}
      data-variant={variant}
      data-size={attr(size, 'md')}
      data-tone={tone}
      data-entity-color={entityHue !== undefined ? '' : undefined}
    >
      {dot && <span className="j-badge__dot" aria-hidden="true" />}
      {icon}
      {children}
      {(removable || closable) && (
        <button
          type="button"
          className="j-badge__remove"
          aria-label={removeLabel}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(e);
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
          </svg>
        </button>
      )}
    </span>
  );
}
