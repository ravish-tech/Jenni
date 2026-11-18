import type { ChangeEvent, ComponentProps, CSSProperties } from 'react';
import { cx, sizeAttr, useControllable, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export interface SliderProps
  extends Omit<ComponentProps<'input'>, 'size' | 'type' | 'value' | 'defaultValue' | 'min' | 'max'> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
}

export function Slider({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  size,
  tone,
  invalid,
  onChange,
  className,
  style,
  ...rest
}: SliderProps) {
  const field = useFieldProps(invalid);
  const [current, setValue] = useControllable(value, defaultValue ?? min, onValueChange);
  const span = max - min;
  const progress = span > 0 ? Math.min(1, Math.max(0, (current - min) / span)) : 0;
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    setValue(e.target.valueAsNumber);
  };
  return (
    <input
      {...field}
      type="range"
      className={cx('j-slider', className)}
      min={min}
      max={max}
      step={step}
      value={current}
      data-size={sizeAttr(size)}
      data-tone={tone}
      style={{ '--j-slider-progress': progress, ...style } as CSSProperties}
      onChange={handleChange}
      {...rest}
    />
  );
}
