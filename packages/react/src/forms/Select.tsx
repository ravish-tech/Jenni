import { useEffect, useRef, useState, type ChangeEvent, type ComponentProps } from 'react';
import { cx, mergeRefs, sizeAttr, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export type SelectOption =
  | string
  | number
  | { label: string; value: string | number; disabled?: boolean };

export interface SelectProps
  extends Omit<ComponentProps<'select'>, 'value' | 'defaultValue' | 'size'> {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  options?: SelectOption[];
  /** Shown (muted) until a value is picked. */
  placeholder?: string;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  /** Show an inline clear button when a non-empty option is selected. */
  clearable?: boolean;
  /** Value assigned when cleared (default: `''`). */
  emptyValue?: string | number;
  /** Accessible label for the clear button (default: `'Clear'`). */
  clearLabel?: string;
  /** Native tooltip override for the clear button. */
  clearTooltip?: string;
}

export function Select({
  options,
  placeholder,
  size,
  tone,
  invalid,
  clearable,
  emptyValue = '',
  clearLabel = 'Clear',
  clearTooltip,
  disabled,
  onValueChange,
  onClear,
  onChange,
  className,
  style,
  children,
  value,
  defaultValue,
  ref,
  ...rest
}: SelectProps) {
  const field = useFieldProps(invalid);
  const innerRef = useRef<HTMLSelectElement>(null);
  const clearingRef = useRef(false);
  const isControlled = value !== undefined;
  const isMultiple = Boolean(rest.multiple);

  const [uncontrolledVal, setUncontrolledVal] = useState<string | number | undefined>(() => {
    if (defaultValue !== undefined) return defaultValue;
    if (placeholder != null) return emptyValue;
    if (options && options.length > 0) {
      const first = options[0];
      return typeof first === 'object' ? first.value : first;
    }
    return undefined;
  });

  useEffect(() => {
    if (!isControlled && uncontrolledVal === undefined && innerRef.current) {
      setUncontrolledVal(innerRef.current.value);
    }
  }, [isControlled, uncontrolledVal]);

  const effectiveDisabled = Boolean(disabled ?? field.disabled);
  const currentVal = isControlled ? value : uncontrolledVal;
  const showClear =
    Boolean(clearable) &&
    !isMultiple &&
    !effectiveDisabled &&
    currentVal !== undefined &&
    currentVal !== null &&
    currentVal !== emptyValue &&
    String(currentVal) !== String(emptyValue);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (clearingRef.current) {
      clearingRef.current = false;
    }
    if (!isControlled) {
      setUncontrolledVal(e.target.value);
    }
    onChange?.(e);
    onValueChange?.(e.target.value);
  };

  const handleClear = () => {
    const el = innerRef.current;
    const nextStr = String(emptyValue);
    let notifiedViaEvent = false;
    if (el) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
      if (setter) setter.call(el, nextStr);
      else el.value = nextStr;
      clearingRef.current = true;
      try {
        el.dispatchEvent(new Event('change', { bubbles: true }));
        notifiedViaEvent = !clearingRef.current;
      } finally {
        clearingRef.current = false;
      }
    }
    if (!isControlled) {
      setUncontrolledVal(emptyValue);
    }
    if (!notifiedViaEvent) {
      onValueChange?.(nextStr);
    }
    onClear?.();
    el?.focus();
  };

  const showHiddenEmptyOption = placeholder != null || (Boolean(clearable) && !isMultiple);

  const optionNodes = (
    <>
      {showHiddenEmptyOption && (
        <option value={String(emptyValue)} disabled hidden>
          {placeholder ?? ''}
        </option>
      )}
      {options?.map((o) => {
        const opt =
          typeof o === 'object' ? o : { label: String(o), value: o, disabled: false };
        return (
          <option key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled}>
            {opt.label}
          </option>
        );
      })}
      {children}
    </>
  );

  if (!clearable || isMultiple) {
    const valueProps = isControlled
      ? { value: String(value) }
      : {
          defaultValue:
            defaultValue !== undefined
              ? String(defaultValue)
              : placeholder != null
                ? String(emptyValue)
                : undefined,
        };

    return (
      <select
        {...field}
        ref={ref}
        disabled={effectiveDisabled || undefined}
        className={cx('j-select', className)}
        style={style}
        data-size={sizeAttr(size)}
        data-tone={tone}
        onChange={handleChange}
        {...valueProps}
        {...rest}
      >
        {optionNodes}
      </select>
    );
  }

  const clearableValueProps = isControlled
    ? { value: String(value) }
    : uncontrolledVal !== undefined
      ? { value: String(uncontrolledVal) }
      : {};

  return (
    <div
      className={cx('j-select-wrap', className)}
      style={style}
      data-size={sizeAttr(size)}
      data-has-clear={showClear ? '' : undefined}
    >
      <select
        {...field}
        ref={mergeRefs(innerRef, ref)}
        disabled={effectiveDisabled || undefined}
        className="j-select"
        data-size={sizeAttr(size)}
        data-tone={tone}
        onChange={handleChange}
        {...clearableValueProps}
        {...rest}
      >
        {optionNodes}
      </select>
      {showClear && (
        <button
          type="button"
          className="j-select__clear"
          aria-label={clearLabel}
          title={clearTooltip || clearLabel}
          onClick={handleClear}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            shapeRendering="geometricPrecision"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
