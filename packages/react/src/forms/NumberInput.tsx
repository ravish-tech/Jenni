import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { clampNumberValue, stepNumberValue } from '@jenni/core/behaviors/number-input.js';
import { cx, mergeRefs, sizeAttr, useControllable, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export interface NumberInputProps
  extends Omit<
    ComponentProps<'input'>,
    'size' | 'type' | 'value' | 'defaultValue' | 'prefix' | 'min' | 'max' | 'step'
  > {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  controls?: 'end' | 'split';
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
}

export function NumberInput({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  controls = 'end',
  prefix,
  suffix,
  size,
  tone,
  invalid,
  disabled,
  readOnly,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  className,
  style,
  ref,
  ...rest
}: NumberInputProps) {
  const field = useFieldProps(invalid);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [current, setCurrent] = useControllable<number | null>(value, defaultValue, onValueChange);
  const [draft, setDraft] = useState<string>(() =>
    current != null && Number.isFinite(current) ? String(current) : '',
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(current != null && Number.isFinite(current) ? String(current) : '');
    }
  }, [current, focused]);

  const isDisabled = !!(disabled || field.disabled);
  const isInvalid = !!(invalid || field['aria-invalid']);
  const atMin = min !== undefined && current != null && Number.isFinite(current) && current <= min;
  const atMax = max !== undefined && current != null && Number.isFinite(current) && current >= max;

  const applyStep = (delta: number) => {
    if (isDisabled || readOnly) return;
    const next = stepNumberValue(current, delta, { min, max, step });
    setCurrent(next);
    setDraft(String(next));
  };

  const handleStepClick = (dir: -1 | 1, e: ReactMouseEvent<HTMLButtonElement>) => {
    const mult = e.shiftKey ? 10 : 1;
    applyStep(dir * mult);
    inputRef.current?.focus();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    const raw = e.target.value;
    setDraft(raw);
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
      if (trimmed === '') setCurrent(null);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) setCurrent(parsed);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const mult = e.shiftKey ? 10 : 1;
      applyStep(e.key === 'ArrowUp' ? mult : -mult);
    }
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === '-' || trimmed === '.') {
      setCurrent(null);
      setDraft('');
    } else {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        const clamped = clampNumberValue(parsed, { min, max, step });
        setCurrent(clamped);
        setDraft(String(clamped));
      } else {
        setDraft(current != null ? String(current) : '');
      }
    }
    onBlur?.(e);
  };

  return (
    <div
      className={cx('j-number-input', className)}
      style={style}
      data-j-managed=""
      data-controls={controls === 'split' ? 'split' : undefined}
      data-size={sizeAttr(size)}
      data-tone={tone}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-invalid={isInvalid ? 'true' : undefined}
    >
      {controls === 'split' && (
        <button
          type="button"
          className="j-number-input__btn"
          data-step="down"
          aria-label="Decrease value"
          tabIndex={-1}
          disabled={isDisabled || readOnly || atMin || undefined}
          onClick={(e) => handleStepClick(-1, e)}
        >
          −
        </button>
      )}

      {prefix != null && <span className="j-number-input__addon">{prefix}</span>}

      <input
        {...field}
        ref={mergeRefs(inputRef, ref)}
        type="text"
        inputMode="decimal"
        role="spinbutton"
        className="j-number-input__field"
        value={draft}
        disabled={isDisabled || undefined}
        readOnly={readOnly}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current ?? undefined}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      />

      {suffix != null && <span className="j-number-input__addon">{suffix}</span>}

      {controls === 'split' ? (
        <button
          type="button"
          className="j-number-input__btn"
          data-step="up"
          aria-label="Increase value"
          tabIndex={-1}
          disabled={isDisabled || readOnly || atMax || undefined}
          onClick={(e) => handleStepClick(1, e)}
        >
          +
        </button>
      ) : (
        <div className="j-number-input__controls">
          <button
            type="button"
            className="j-number-input__btn"
            data-step="down"
            aria-label="Decrease value"
            tabIndex={-1}
            disabled={isDisabled || readOnly || atMin || undefined}
            onClick={(e) => handleStepClick(-1, e)}
          >
            −
          </button>
          <button
            type="button"
            className="j-number-input__btn"
            data-step="up"
            aria-label="Increase value"
            tabIndex={-1}
            disabled={isDisabled || readOnly || atMax || undefined}
            onClick={(e) => handleStepClick(1, e)}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
