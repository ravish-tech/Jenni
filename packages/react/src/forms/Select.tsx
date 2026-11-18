import type { ChangeEvent, ComponentProps } from 'react';
import { cx, sizeAttr, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export type SelectOption = string | { label: string; value: string; disabled?: boolean };

export interface SelectProps extends Omit<ComponentProps<'select'>, 'value' | 'defaultValue' | 'size'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  /** Shown (muted) until a value is picked. */
  placeholder?: string;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
}

export function Select({
  options,
  placeholder,
  size,
  tone,
  invalid,
  onValueChange,
  onChange,
  className,
  children,
  value,
  defaultValue,
  ...rest
}: SelectProps) {
  const field = useFieldProps(invalid);
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };
  // With a placeholder, start on it (value "") unless told otherwise.
  const valueProps =
    value !== undefined ? { value } : { defaultValue: defaultValue ?? (placeholder != null ? '' : undefined) };

  return (
    <select
      {...field}
      className={cx('j-select', className)}
      data-size={sizeAttr(size)}
      data-tone={tone}
      onChange={handleChange}
      {...valueProps}
      {...rest}
    >
      {placeholder != null && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options?.map((o) => {
        const opt = typeof o === 'string' ? { label: o, value: o, disabled: false } : o;
        return (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        );
      })}
      {children}
    </select>
  );
}
