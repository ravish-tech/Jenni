import { useEffect, useRef, type ChangeEvent, type ComponentProps, type ReactNode } from 'react';
import { Choice } from './Choice';
import { cx, mergeRefs, sizeAttr, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'size' | 'type'> {
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  /** When set, renders a <label class="j-choice"> around the box. */
  label?: ReactNode;
  description?: ReactNode;
}

export function Checkbox({
  size,
  tone,
  invalid,
  indeterminate = false,
  label,
  description,
  onCheckedChange,
  onChange,
  className,
  style,
  ref,
  ...rest
}: CheckboxProps) {
  const field = useFieldProps(invalid);
  const inner = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };
  const wrapped = label != null;

  return (
    <Choice
      label={label}
      description={description}
      className={className}
      style={style}
      control={
        <input
          {...field}
          ref={mergeRefs(inner, ref)}
          type="checkbox"
          className={cx('j-checkbox', !wrapped && className)}
          style={wrapped ? undefined : style}
          data-size={sizeAttr(size)}
          data-tone={tone}
          onChange={handleChange}
          {...rest}
        />
      }
    />
  );
}
