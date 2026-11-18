import {
  Fragment,
  use,
  useRef,
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { sanitizePinChars } from '@jenni/core/behaviors/pin-input.js';
import { FieldContext, cx, sizeAttr, useControllable, type Size, type Tone } from './types';

export interface PinInputProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  type?: 'numeric' | 'alphanumeric';
  mask?: boolean;
  separator?: boolean | number;
  placeholder?: string;
  otp?: boolean;
  size?: Size;
  tone?: Tone;
  disabled?: boolean;
  invalid?: boolean;
}

export function PinInput({
  value,
  defaultValue = '',
  onValueChange,
  onComplete,
  length = 6,
  type = 'numeric',
  mask = false,
  separator,
  placeholder = '·',
  otp = true,
  size,
  tone,
  disabled = false,
  invalid = false,
  className,
  ...rest
}: PinInputProps) {
  const field = use(FieldContext);
  const cellRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);

  const isDisabled = disabled || !!field?.disabled;
  const isInvalid = invalid || !!field?.invalid;

  const chars = sanitizePinChars(current ?? '', type);
  const cells = Array.from({ length }, (_, i) => chars[i] ?? '');

  const hasSeparatorAfter = (index: number) => {
    if (!separator || index >= length - 1) return false;
    if (typeof separator === 'number' && separator > 0) return (index + 1) % separator === 0;
    return index + 1 === Math.floor(length / 2);
  };

  const focusCell = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    cellRefs.current[clamped]?.focus();
  };

  const commit = (next: string[]) => {
    const code = next.join('');
    setCurrent(code);
    if (next.length === length && next.every((c) => c.length === 1)) {
      onComplete?.(code);
    }
  };

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const valid = sanitizePinChars(e.target.value, type);
    const next = [...cells];
    if (!valid.length) {
      next[index] = '';
      commit(next);
      return;
    }
    valid.slice(0, length - index).forEach((ch, offset) => {
      next[index + offset] = ch;
    });
    commit(next);
    focusCell(Math.min(index + valid.length, length - 1));
  };

  const handleKeyDown = (index: number, e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const next = [...cells];
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (next[index]) {
        next[index] = '';
        commit(next);
      } else if (index > 0) {
        next[index - 1] = '';
        commit(next);
        focusCell(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusCell(index - 1);
    } else if (e.key === 'ArrowRight' && index + 1 < length) {
      e.preventDefault();
      focusCell(index + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusCell(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusCell(length - 1);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const valid = sanitizePinChars(e.key, type);
      e.preventDefault();
      if (!valid.length) return;
      next[index] = valid[0];
      commit(next);
      if (index + 1 < length) focusCell(index + 1);
    }
  };

  const handlePaste = (index: number, e: ReactClipboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const text = e.clipboardData?.getData('text') ?? '';
    const valid = sanitizePinChars(text, type);
    if (!valid.length) return;
    e.preventDefault();
    const next = [...cells];
    const start = valid.length >= length ? 0 : index;
    valid.slice(0, length - start).forEach((ch, offset) => {
      next[start + offset] = ch;
    });
    commit(next);
    focusCell(Math.min(start + valid.length, length - 1));
  };

  return (
    <div
      role="group"
      className={cx('j-pin-input', className)}
      data-j-managed=""
      data-type={type}
      data-size={sizeAttr(size)}
      data-tone={tone}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-invalid={isInvalid ? 'true' : undefined}
      aria-labelledby={field?.labelId}
      aria-describedby={field?.describedBy}
      {...rest}
    >
      {cells.map((val, idx) => (
        <Fragment key={idx}>
          <input
            id={idx === 0 ? field?.id : undefined}
            ref={(el) => {
              cellRefs.current[idx] = el;
            }}
            type={mask ? 'password' : 'text'}
            inputMode={type === 'numeric' ? 'numeric' : 'text'}
            autoComplete={otp && idx === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            className="j-pin-input__cell"
            value={val}
            placeholder={placeholder}
            data-filled={val ? '' : undefined}
            aria-label={`Character ${idx + 1} of ${length}`}
            aria-invalid={isInvalid ? 'true' : undefined}
            disabled={isDisabled || undefined}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={(e) => handlePaste(idx, e)}
            onFocus={(e) => e.currentTarget.select()}
          />
          {hasSeparatorAfter(idx) && (
            <span className="j-pin-input__sep" aria-hidden="true">
              —
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
