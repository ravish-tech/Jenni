import type { ChangeEvent, ComponentProps, ReactNode } from 'react';
import { Choice } from './Choice';
import { cx, sizeAttr, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export interface SwitchProps extends Omit<ComponentProps<'input'>, 'size' | 'type' | 'role'> {
  onCheckedChange?: (checked: boolean) => void;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  /** Put the switch after the text (settings-row layout). */
  placement?: 'start' | 'end';
}

export function Switch({
  size,
  tone,
  invalid,
  label,
  description,
  placement,
  onCheckedChange,
  onChange,
  className,
  style,
  ...rest
}: SwitchProps) {
  const field = useFieldProps(invalid);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };
  const wrapped = label != null;

  return (
    <Choice
      label={label}
      description={description}
      placement={placement}
      className={className}
      style={style}
      control={
        <input
          {...field}
          type="checkbox"
          role="switch"
          className={cx('j-switch', !wrapped && className)}
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
