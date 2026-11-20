import type { CSSProperties, ComponentProps, ReactNode } from 'react';
import { getEntityHue } from 'jenni-core/behaviors/entity-color.js';
import { attr, type DisplaySize, type DisplayTone } from './types';

export interface BadgeProps extends ComponentProps<'span'> {
  variant?: 'soft' | 'solid' | 'outline';
  size?: DisplaySize;
  tone?: DisplayTone;
  /** Show a leading status dot. */
  dot?: boolean;
  icon?: ReactNode;
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
    </span>
  );
}
