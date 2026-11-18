import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ToggleEvent,
} from 'react';
import { anchorCombobox } from '@jenni/core/behaviors/combobox.js';
import {
  cx,
  flag,
  mergeRefs,
  sizeAttr,
  useControllable,
  type ComboboxOption,
  type ComboboxSize,
} from './types';

interface ComboboxBaseProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  options?: ComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  size?: ComboboxSize;
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  filter?: (option: ComboboxOption, query: string) => boolean;
}

export interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export interface ComboboxMultipleProps extends ComboboxBaseProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

const defaultFilter = (opt: ComboboxOption, q: string) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    opt.label.toLowerCase().includes(needle) ||
    (opt.description?.toLowerCase().includes(needle) ?? false) ||
    (opt.group?.toLowerCase().includes(needle) ?? false)
  );
};

interface OptionBucket {
  group: string | null;
  items: ComboboxOption[];
}

export function Combobox(props: ComboboxProps) {
  const {
    options = [],
    multiple,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    emptyText = 'No matches found',
    size = 'md',
    clearable = true,
    disabled,
    invalid,
    name,
    filter,
    className,
    onClick,
    ref,
    ...rest
  } = props;

  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const shellRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);

  const [rawVal, setRawVal] = useControllable<string | string[] | null>(
    value as string | string[] | null | undefined,
    defaultValue !== undefined ? (defaultValue as string | string[] | null) : multiple ? [] : null,
    onValueChange as ((v: string | string[] | null) => void) | undefined,
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const selectedValues = useMemo<string[]>(() => {
    if (multiple) return Array.isArray(rawVal) ? rawVal : [];
    return typeof rawVal === 'string' && rawVal ? [rawVal] : [];
  }, [multiple, rawVal]);

  const selectedSingleOption = useMemo(
    () => (multiple ? undefined : options.find((o) => o.value === rawVal)),
    [multiple, options, rawVal],
  );

  const selectedChipOptions = useMemo(() => {
    if (!multiple) return [];
    const map = new Map(options.map((o) => [o.value, o]));
    return selectedValues.map((v) => map.get(v) ?? { value: v, label: v });
  }, [multiple, options, selectedValues]);

  const displayValue = multiple ? query : isTyping ? query : (selectedSingleOption?.label ?? '');

  const filteredOptions = useMemo(() => {
    const q = isTyping ? query : '';
    if (!q.trim()) return options;
    const fn = filter ?? defaultFilter;
    return options.filter((opt) => fn(opt, q));
  }, [options, isTyping, query, filter]);

  const groupedBuckets = useMemo<OptionBucket[]>(() => {
    const buckets: OptionBucket[] = [];
    const byName = new Map<string | null, OptionBucket>();
    for (const opt of filteredOptions) {
      const key = opt.group ?? null;
      let bucket = byName.get(key);
      if (!bucket) {
        bucket = { group: key, items: [] };
        byName.set(key, bucket);
        buckets.push(bucket);
      }
      bucket.items.push(opt);
    }
    return buckets;
  }, [filteredOptions]);

  const enabledFiltered = useMemo(
    () => filteredOptions.filter((o) => !o.disabled),
    [filteredOptions],
  );

  const showClear =
    clearable &&
    !disabled &&
    (multiple ? selectedValues.length > 0 || query.length > 0 : Boolean(rawVal || query));

  const optionDomId = useCallback(
    (val: string) => `${baseId}-opt-${encodeURIComponent(val).replace(/%/g, '_')}`,
    [baseId],
  );

  const activeDescendantId = open && activeValue ? optionDomId(activeValue) : undefined;

  const showListbox = useCallback(() => {
    if (disabled || !listboxRef.current) return;
    if (!listboxRef.current.matches(':popover-open')) {
      try {
        listboxRef.current.showPopover();
      } catch {
        /* ignore */
      }
    }
  }, [disabled]);

  const hideListbox = useCallback(() => {
    if (listboxRef.current?.matches(':popover-open')) {
      try {
        listboxRef.current.hidePopover();
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (!shellRef.current || !listboxRef.current) return;
    return anchorCombobox(shellRef.current, listboxRef.current);
  }, []);

  useEffect(() => {
    if (!open || !activeValue || !listboxRef.current) return;
    const node = listboxRef.current.querySelector(`[data-value="${CSS.escape(activeValue)}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeValue]);

  useEffect(() => {
    if (!open) return;
    if (!enabledFiltered.some((o) => o.value === activeValue)) {
      setActiveValue(enabledFiltered[0]?.value ?? null);
    }
  }, [open, enabledFiltered, activeValue]);

  const pickInitialHighlight = useCallback(
    (preferLast = false) => {
      if (!enabledFiltered.length) {
        setActiveValue(null);
        return;
      }
      if (preferLast) {
        setActiveValue(enabledFiltered[enabledFiltered.length - 1]!.value);
      } else {
        const sel = enabledFiltered.find((o) => selectedValues.includes(o.value));
        setActiveValue((sel ?? enabledFiltered[0])!.value);
      }
    },
    [enabledFiltered, selectedValues],
  );

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    const opened = e.newState === 'open';
    setOpen(opened);
    if (opened) {
      pickInitialHighlight(false);
    } else {
      setIsTyping(false);
      setQuery('');
      setActiveValue(null);
    }
  };

  const selectOption = (opt: ComboboxOption) => {
    if (opt.disabled || disabled) return;
    if (multiple) {
      const next = selectedValues.includes(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];
      setQuery('');
      setIsTyping(false);
      setRawVal(next);
      inputRef.current?.focus();
    } else {
      setIsTyping(false);
      setQuery('');
      setRawVal(opt.value);
      hideListbox();
      inputRef.current?.focus();
    }
  };

  const removeChip = (val: string) => {
    if (disabled || !multiple) return;
    setRawVal(selectedValues.filter((v) => v !== val));
    inputRef.current?.focus();
  };

  const clearAll = () => {
    if (disabled) return;
    setQuery('');
    setIsTyping(false);
    setRawVal(multiple ? [] : null);
    inputRef.current?.focus();
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setIsTyping(true);
    if (!open) showListbox();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const list = enabledFiltered;
    const idx = list.findIndex((o) => o.value === activeValue);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          pickInitialHighlight(false);
          showListbox();
        } else if (list.length) {
          setActiveValue(list[idx < list.length - 1 ? idx + 1 : 0]!.value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          pickInitialHighlight(true);
          showListbox();
        } else if (list.length) {
          setActiveValue(list[idx > 0 ? idx - 1 : list.length - 1]!.value);
        }
        break;
      case 'Home':
        if (open && list.length) {
          e.preventDefault();
          setActiveValue(list[0]!.value);
        }
        break;
      case 'End':
        if (open && list.length) {
          e.preventDefault();
          setActiveValue(list[list.length - 1]!.value);
        }
        break;
      case 'Enter':
        if (open && idx >= 0) {
          e.preventDefault();
          selectOption(list[idx]!);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          hideListbox();
        }
        break;
      case 'Tab':
        if (open) hideListbox();
        break;
      case 'Backspace':
        if (multiple && !query && selectedValues.length > 0) {
          setRawVal(selectedValues.slice(0, -1));
        }
        break;
      default:
        break;
    }
  };

  const handleShellClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    if (disabled || e.defaultPrevented) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('.j-combobox__clear, .j-combobox__chevron, .j-combobox__chip-remove')) return;
    inputRef.current?.focus();
    showListbox();
  };

  const renderOption = (opt: ComboboxOption) => {
    const selected = selectedValues.includes(opt.value);
    return (
      <div
        id={optionDomId(opt.value)}
        key={opt.value}
        className="j-combobox__option"
        role="option"
        data-value={opt.value}
        data-highlighted={flag(activeValue === opt.value)}
        aria-selected={selected}
        aria-disabled={opt.disabled || undefined}
        onPointerEnter={() => {
          if (!opt.disabled) setActiveValue(opt.value);
        }}
        onClick={() => selectOption(opt)}
      >
        <div className="j-combobox__option-body">
          <span className="j-combobox__option-label">{opt.label}</span>
          {opt.description && (
            <span className="j-combobox__option-description">{opt.description}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        {...rest}
        ref={mergeRefs(shellRef, ref)}
        className={cx('j-combobox', className)}
        data-size={sizeAttr(size)}
        data-multiple={flag(multiple)}
        data-disabled={flag(disabled)}
        aria-invalid={invalid || undefined}
        onClick={handleShellClick}
      >
        {name && !multiple && (
          <input type="hidden" name={name} value={typeof rawVal === 'string' ? rawVal : ''} />
        )}
        {name &&
          multiple &&
          selectedValues.map((v) => <input key={v} type="hidden" name={name} value={v} />)}

        {multiple && selectedChipOptions.length > 0 && (
          <span className="j-combobox__chips">
            {selectedChipOptions.map((chip) => (
              <span key={chip.value} className="j-combobox__chip">
                <span className="j-combobox__chip-label">{chip.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    tabIndex={-1}
                    className="j-combobox__chip-remove"
                    aria-label={`Remove ${chip.label}`}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChip(chip.value);
                    }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          className="j-combobox__input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          aria-invalid={invalid || undefined}
          placeholder={multiple && selectedChipOptions.length > 0 ? '' : placeholder}
          disabled={disabled}
          value={displayValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
        />

        <div className="j-combobox__controls">
          {showClear && (
            <button
              type="button"
              tabIndex={-1}
              className="j-combobox__clear"
              aria-label="Clear selection"
              onPointerDown={(e) => e.preventDefault()}
              onClick={clearAll}
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
          <button
            type="button"
            tabIndex={-1}
            className="j-combobox__chevron"
            aria-label="Toggle options"
            disabled={disabled}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => {
              if (disabled) return;
              inputRef.current?.focus();
              if (open) hideListbox();
              else showListbox();
            }}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
            </svg>
          </button>
        </div>
      </div>

      <div
        id={listboxId}
        ref={listboxRef}
        className="j-combobox__listbox"
        popover="auto"
        role="listbox"
        aria-multiselectable={multiple || undefined}
        onPointerDown={(e) => e.preventDefault()}
        onToggle={handleToggle}
      >
        {groupedBuckets.length > 0 ? (
          groupedBuckets.map((bucket, idx) =>
            bucket.group ? (
              <div
                key={bucket.group}
                className="j-combobox__group"
                role="group"
                aria-label={bucket.group}
              >
                <div className="j-combobox__group-label">{bucket.group}</div>
                {bucket.items.map(renderOption)}
              </div>
            ) : (
              <div key={`__ungrouped_${idx}`}>{bucket.items.map(renderOption)}</div>
            ),
          )
        ) : (
          <div className="j-combobox__empty">{emptyText}</div>
        )}
      </div>
    </>
  );
}
