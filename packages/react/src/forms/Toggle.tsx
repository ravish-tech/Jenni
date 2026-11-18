import { use, type ComponentProps, type MouseEvent as ReactMouseEvent } from 'react';
import {
  FieldContext,
  ToggleGroupContext,
  cx,
  flag,
  sizeAttr,
  useControllable,
  type Size,
  type ToggleVariant,
  type Tone,
} from './types';

export interface ToggleProps extends Omit<ComponentProps<'button'>, 'value'> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  value?: string;
  variant?: ToggleVariant;
  size?: Size;
  tone?: Tone;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

export function Toggle({
  pressed,
  defaultPressed = false,
  onPressedChange,
  value,
  variant,
  size,
  tone,
  iconOnly,
  fullWidth,
  disabled,
  onClick,
  className,
  ...rest
}: ToggleProps) {
  const group = use(ToggleGroupContext);
  const [innerPressed, setInnerPressed] = useControllable(pressed, defaultPressed, onPressedChange);

  const inGroup = !!(group && value !== undefined);
  const isOn = inGroup ? group.isPressed(value) : innerPressed;
  const isDisabled = !!(disabled || group?.disabled);

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || isDisabled) return;
    if (inGroup) group.toggle(value);
    else setInnerPressed(!isOn);
  };

  return (
    <button
      type="button"
      className={cx('j-toggle', className)}
      data-j-managed=""
      data-value={value}
      data-variant={variant ?? group?.variant}
      data-size={sizeAttr(size ?? group?.size)}
      data-tone={tone ?? group?.tone}
      data-icon-only={flag(iconOnly)}
      data-full-width={flag(fullWidth)}
      aria-pressed={isOn ? 'true' : 'false'}
      disabled={isDisabled || undefined}
      onClick={handleClick}
      {...rest}
    />
  );
}

interface ToggleGroupBaseProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  variant?: ToggleVariant;
  size?: Size;
  tone?: Tone;
  attached?: boolean;
  fullWidth?: boolean;
  disallowEmpty?: boolean;
  disabled?: boolean;
}

export interface SingleToggleGroupProps extends ToggleGroupBaseProps {
  type?: 'single';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export interface MultipleToggleGroupProps extends ToggleGroupBaseProps {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ToggleGroupProps = SingleToggleGroupProps | MultipleToggleGroupProps;

export function ToggleGroup(props: ToggleGroupProps) {
  const {
    type = 'single',
    value,
    defaultValue,
    onValueChange,
    variant,
    size,
    tone,
    attached,
    fullWidth,
    disallowEmpty,
    disabled = false,
    className,
    children,
    ...rest
  } = props;

  const field = use(FieldContext);
  const [current, setCurrent] = useControllable<string | null | string[]>(
    value,
    defaultValue ?? (type === 'multiple' ? [] : null),
    onValueChange as ((v: string | null | string[]) => void) | undefined,
  );

  const isDisabled = disabled || !!field?.disabled;

  const isPressed = (itemValue: string) => {
    if (type === 'multiple') {
      return Array.isArray(current) && current.includes(itemValue);
    }
    return current === itemValue;
  };

  const toggle = (itemValue: string) => {
    if (isDisabled) return;
    if (type === 'multiple') {
      const arr = Array.isArray(current) ? current : [];
      if (arr.includes(itemValue)) {
        if (disallowEmpty && arr.length <= 1) return;
        setCurrent(arr.filter((v) => v !== itemValue));
      } else {
        setCurrent([...arr, itemValue]);
      }
    } else {
      if (current === itemValue) {
        if (!disallowEmpty) setCurrent(null);
      } else {
        setCurrent(itemValue);
      }
    }
  };

  return (
    <ToggleGroupContext value={{ isPressed, toggle, variant, size, tone, disabled: isDisabled }}>
      <div
        role="group"
        className={cx('j-toggle-group', className)}
        data-j-managed=""
        data-type={type}
        data-tone={tone}
        data-attached={flag(attached)}
        data-full-width={flag(fullWidth)}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-labelledby={field?.labelId}
        aria-describedby={field?.describedBy}
        {...rest}
      >
        {children}
      </div>
    </ToggleGroupContext>
  );
}
