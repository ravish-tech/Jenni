import type { ComponentProps } from 'react';
import { attr, type DisplaySize } from './types';

export interface KbdProps extends ComponentProps<'kbd'> {
  size?: DisplaySize;
}

export function Kbd({ size = 'md', className, ...rest }: KbdProps) {
  return <kbd {...rest} className={className ? `j-kbd ${className}` : 'j-kbd'} data-size={attr(size, 'md')} />;
}
