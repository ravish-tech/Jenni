import type { ComponentProps, ReactNode } from 'react';
import { attr, type DisplaySize, type DisplayTone } from './types';

export interface BadgeProps extends ComponentProps<'span'> {
  variant?: 'soft' | 'solid' | 'outline';
  size?: DisplaySize;
  tone?: DisplayTone;
  /** Show a leading status dot. */
  dot?: boolean;
  icon?: ReactNode;
}

export function Badge({ variant = 'soft', size = 'md', tone, dot, icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      className={className ? `j-badge ${className}` : 'j-badge'}
      data-variant={variant}
      data-size={attr(size, 'md')}
      data-tone={tone}
    >
      {dot && <span className="j-badge__dot" aria-hidden="true" />}
      {icon}
      {children}
    </span>
  );
}
