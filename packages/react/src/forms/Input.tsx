import { useRef, type ChangeEvent, type ComponentProps, type PointerEvent, type ReactNode } from 'react';
import { cx, mergeRefs, sizeAttr, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export interface InputProps extends Omit<ComponentProps<'input'>, 'size' | 'prefix' | 'value' | 'defaultValue'> {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  /** Leading adornment (icon, text, button). Wraps the input in .j-input-group. */
  prefix?: ReactNode;
  /** Trailing adornment. */
  suffix?: ReactNode;
}

export function Input({
  size,
  tone,
  invalid,
  prefix,
  suffix,
  onValueChange,
  onChange,
  className,
  style,
  ref,
  ...rest
}: InputProps) {
  const field = useFieldProps(invalid);
  const inner = useRef<HTMLInputElement>(null);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  if (prefix == null && suffix == null) {
    return (
      <input
        {...field}
        ref={ref}
        className={cx('j-input', className)}
        style={style}
        data-size={sizeAttr(size)}
        data-tone={tone}
        onChange={handleChange}
        {...rest}
      />
    );
  }

  /** Clicking the group's padding or a text addon focuses the input. */
  const focusInput = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (target === inner.current || target.closest('button, a, input, select, textarea, [tabindex]')) return;
    e.preventDefault();
    inner.current?.focus();
  };

  return (
    <div
      className={cx('j-input-group', className)}
      style={style}
      data-size={sizeAttr(size)}
      data-tone={tone}
      onPointerDown={focusInput}
    >
      {prefix != null && <span className="j-input-group__addon">{prefix}</span>}
      <input {...field} ref={mergeRefs(inner, ref)} className="j-input" onChange={handleChange} {...rest} />
      {suffix != null && <span className="j-input-group__addon">{suffix}</span>}
    </div>
  );
}
