import { use, useId, type ChangeEvent, type ComponentProps, type ReactNode } from 'react';
import { Choice } from './Choice';
import {
  FieldContext,
  RadioGroupContext,
  cx,
  sizeAttr,
  useControllable,
  type Orientation,
  type Size,
  type Tone,
} from './types';

export interface RadioGroupProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  orientation?: Orientation;
  size?: Size;
  tone?: Tone;
  disabled?: boolean;
  invalid?: boolean;
}

export function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  name,
  orientation,
  size,
  tone,
  disabled = false,
  invalid = false,
  className,
  ...rest
}: RadioGroupProps) {
  const field = use(FieldContext);
  const autoName = useId();
  const [current, setValue] = useControllable<string | undefined>(value, defaultValue, onValueChange as
    | ((v: string | undefined) => void)
    | undefined);
  const isInvalid = invalid || !!field?.invalid;

  return (
    <RadioGroupContext
      value={{
        value: current,
        setValue,
        name: name ?? `j-radio-${autoName}`,
        size,
        tone,
        disabled: disabled || !!field?.disabled,
        invalid: isInvalid,
      }}
    >
      <div
        role="radiogroup"
        className={cx('j-radio-group', className)}
        data-orientation={orientation === 'horizontal' ? 'horizontal' : undefined}
        aria-labelledby={field?.labelId}
        aria-describedby={field?.describedBy}
        aria-invalid={isInvalid || undefined}
        aria-required={field?.required || undefined}
        {...rest}
      />
    </RadioGroupContext>
  );
}

export interface RadioProps extends Omit<ComponentProps<'input'>, 'size' | 'type' | 'value'> {
  value: string;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  label?: ReactNode;
  description?: ReactNode;
}

export function Radio({
  value,
  size,
  tone,
  invalid,
  disabled,
  label,
  description,
  onChange,
  className,
  style,
  ...rest
}: RadioProps) {
  const group = use(RadioGroupContext);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    if (e.target.checked) group?.setValue(value);
  };
  const wrapped = label != null;
  const groupProps = group
    ? { name: group.name, checked: group.value === value }
    : {};

  return (
    <Choice
      label={label}
      description={description}
      className={className}
      style={style}
      control={
        <input
          type="radio"
          className={cx('j-radio', !wrapped && className)}
          style={wrapped ? undefined : style}
          value={value}
          disabled={disabled || group?.disabled || undefined}
          aria-invalid={invalid || group?.invalid || undefined}
          data-size={sizeAttr(size ?? group?.size)}
          data-tone={tone ?? group?.tone}
          onChange={handleChange}
          {...groupProps}
          {...rest}
        />
      }
    />
  );
}
