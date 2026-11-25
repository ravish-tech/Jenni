import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cx, mergeRefs, sizeAttr, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export interface InputProps extends Omit<ComponentProps<'input'>, 'size' | 'prefix' | 'value' | 'defaultValue'> {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  /** Show an inline clear button whenever the value is non-empty. */
  clearable?: boolean;
  /** Accessible label for the clear button (default: `'Clear input'`). */
  clearLabel?: string;
  /** Leading adornment (icon, text, button). Wraps the input in .j-input-group. */
  prefix?: ReactNode;
  /** Trailing adornment. */
  suffix?: ReactNode;
}

export function Input({
  value,
  defaultValue,
  size,
  tone,
  invalid,
  clearable,
  clearLabel = 'Clear input',
  prefix,
  suffix,
  disabled,
  readOnly,
  onValueChange,
  onClear,
  onChange,
  onInput,
  className,
  style,
  ref,
  ...rest
}: InputProps) {
  const field = useFieldProps(invalid);
  const inner = useRef<HTMLInputElement>(null);
  const clearingRef = useRef(false);
  const isControlled = value !== undefined;
  const [uncontrolledHasValue, setUncontrolledHasValue] = useState(
    () => String(defaultValue ?? '').length > 0,
  );

  const effectiveDisabled = Boolean(disabled ?? field.disabled);
  const hasValue = isControlled ? String(value ?? '').length > 0 : uncontrolledHasValue;
  const showClear = Boolean(clearable) && hasValue && !effectiveDisabled && !readOnly;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    clearingRef.current = false;
    if (!isControlled) {
      setUncontrolledHasValue(e.target.value.length > 0);
    }
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  const handleInput: ComponentProps<'input'>['onInput'] = (e) => {
    if (!isControlled) {
      setUncontrolledHasValue(e.currentTarget.value.length > 0);
    }
    onInput?.(e);
  };

  const handleClear = () => {
    const el = inner.current;
    let notifiedViaEvent = false;
    if (el) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(el, '');
      else el.value = '';
      clearingRef.current = true;
      try {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        notifiedViaEvent = !clearingRef.current;
      } finally {
        clearingRef.current = false;
      }
    }
    if (!isControlled) {
      setUncontrolledHasValue(false);
    }
    if (!notifiedViaEvent) {
      onValueChange?.('');
    }
    onClear?.();
    el?.focus();
  };

  if (!clearable && prefix == null && suffix == null) {
    return (
      <input
        {...field}
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        disabled={effectiveDisabled || undefined}
        readOnly={readOnly}
        className={cx('j-input', className)}
        style={style}
        data-size={sizeAttr(size)}
        data-tone={tone}
        onChange={handleChange}
        onInput={handleInput}
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
      <input
        {...field}
        ref={mergeRefs(inner, ref)}
        value={value}
        defaultValue={defaultValue}
        disabled={effectiveDisabled || undefined}
        readOnly={readOnly}
        className="j-input"
        onChange={handleChange}
        onInput={handleInput}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          className="j-input-group__clear"
          aria-label={clearLabel}
          onClick={handleClear}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
          </svg>
        </button>
      )}
      {suffix != null && <span className="j-input-group__addon">{suffix}</span>}
    </div>
  );
}
