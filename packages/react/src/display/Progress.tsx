import type { ComponentProps } from 'react';
import { attr, type DisplaySize, type DisplayTone } from './types';

export interface ProgressProps extends Omit<ComponentProps<'progress'>, 'value' | 'children'> {
  /** Omit (or null) for indeterminate. */
  value?: number | null;
  max?: number;
  size?: DisplaySize;
  tone?: DisplayTone;
  label?: string;
}

export function Progress({ value, max = 100, size = 'md', tone, label, className, ...rest }: ProgressProps) {
  return (
    <progress
      aria-label={label}
      {...rest}
      className={className ? `j-progress ${className}` : 'j-progress'}
      value={value ?? undefined}
      max={max}
      data-size={attr(size, 'md')}
      data-tone={tone}
    />
  );
}
