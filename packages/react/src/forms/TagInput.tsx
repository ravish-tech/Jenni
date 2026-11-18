import {
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { cx, mergeRefs, sizeAttr, useControllable, type Size, type Tone } from './types';
import { useFieldProps } from './useFieldProps';

export interface TagInputProps
  extends Omit<ComponentProps<'input'>, 'size' | 'type' | 'value' | 'defaultValue'> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  maxTags?: number;
  allowDuplicates?: boolean;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
}

export function TagInput({
  value,
  defaultValue = [],
  onValueChange,
  maxTags,
  allowDuplicates = false,
  placeholder,
  size,
  tone,
  disabled,
  invalid,
  onKeyDown,
  onPaste,
  className,
  style,
  ref,
  ...rest
}: TagInputProps) {
  const field = useFieldProps(invalid);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tags, setTags] = useControllable<string[]>(value, defaultValue, onValueChange);
  const [draft, setDraft] = useState('');

  const isDisabled = !!(disabled || field.disabled);
  const isInvalid = !!(invalid || field['aria-invalid']);
  const atLimit = maxTags !== undefined && tags.length >= maxTags;

  const addTags = (candidates: string[]) => {
    if (isDisabled) return false;
    const next = [...tags];
    let added = false;
    for (const raw of candidates) {
      const clean = raw.trim().replace(/,+$/, '').trim();
      if (!clean) continue;
      if (maxTags !== undefined && next.length >= maxTags) break;
      if (!allowDuplicates && next.some((t) => t.toLowerCase() === clean.toLowerCase())) continue;
      next.push(clean);
      added = true;
    }
    if (added) setTags(next);
    return added;
  };

  const removeAt = (index: number) => {
    if (isDisabled) return;
    setTags(tags.filter((_, i) => i !== index));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || isDisabled) return;
    if (e.key === 'Enter' || e.key === ',') {
      if (e.key === 'Enter' && !draft.trim()) return;
      e.preventDefault();
      if (addTags([draft])) setDraft('');
      else if (e.key === ',') setDraft((d) => d.replace(/,+$/, ''));
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };

  const handlePaste = (e: ReactClipboardEvent<HTMLInputElement>) => {
    onPaste?.(e);
    if (e.defaultPrevented || isDisabled) return;
    const text = e.clipboardData?.getData('text') ?? '';
    if (!text.includes(',')) return;
    e.preventDefault();
    addTags(text.split(','));
    setDraft('');
  };

  const handleShellClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (target === inputRef.current || target.closest('button')) return;
    if (!isDisabled) inputRef.current?.focus();
  };

  return (
    <div
      className={cx('j-tag-input', className)}
      style={style}
      data-j-managed=""
      data-size={sizeAttr(size)}
      data-tone={tone}
      data-max-tags={maxTags}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-invalid={isInvalid ? 'true' : undefined}
      onClick={handleShellClick}
    >
      {tags.map((tag, idx) => (
        <span key={`${tag}-${idx}`} className="j-tag-input__tag" data-value={tag}>
          <span className="j-tag-input__tag-label">{tag}</span>
          <button
            type="button"
            className="j-tag-input__remove"
            aria-label={`Remove ${tag}`}
            disabled={isDisabled || undefined}
            onClick={(e) => {
              e.stopPropagation();
              removeAt(idx);
            }}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        </span>
      ))}

      <input
        {...field}
        ref={mergeRefs(inputRef, ref)}
        type="text"
        className="j-tag-input__field"
        value={draft}
        placeholder={atLimit ? '' : placeholder}
        disabled={isDisabled || undefined}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        {...rest}
      />
    </div>
  );
}
