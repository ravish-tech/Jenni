import type { ChangeEvent, ComponentProps } from 'react';
import { cx, sizeAttr, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'value' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  /** Grow with content (field-sizing: content). Default true. */
  autoGrow?: boolean;
}

export function Textarea({ size, tone, invalid, autoGrow = true, onValueChange, onChange, className, ...rest }: TextareaProps) {
  const field = useFieldProps(invalid);
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };
  return (
    <textarea
      {...field}
      className={cx('j-textarea', className)}
      data-size={sizeAttr(size)}
      data-tone={tone}
      data-fixed={autoGrow ? undefined : ''}
      onChange={handleChange}
      {...rest}
    />
  );
}
