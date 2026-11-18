import type { ComponentProps } from 'react';
import { attr, type DisplaySize } from './types';

export interface SpinnerProps extends Omit<ComponentProps<'span'>, 'children'> {
  size?: DisplaySize;
  /** Accessible label. */
  label?: string;
}

export function Spinner({ size = 'md', label = 'Loading', className, ...rest }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      {...rest}
      className={className ? `j-spinner ${className}` : 'j-spinner'}
      data-size={attr(size, 'md')}
    />
  );
}
