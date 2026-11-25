import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ToggleEvent,
} from 'react';
import { anchorCombobox } from 'jenni-core/behaviors/combobox.js';
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
  filter?: boolean | ((option: ComboboxOption, query: string) => boolean);
  allowCustomValue?: boolean;
  freeSolo?: boolean;
  commitOnBlur?: boolean;
  creatable?: boolean | ((query: string) => string);
  onCreate?: (value: string) => void;
  loading?: boolean;
  loadingText?: string;
  debounce?: number;
  searchValue?: string;
  defaultSearchValue?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: (query: string) => void;
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

function escapeSelectorVal(val: string) {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(val)
    : val.replace(/["\\]/g, '\\$&');
}

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
    filter = true,
    allowCustomValue,
    freeSolo,
    commitOnBlur,
    creatable = false,
    onCreate,
    loading,
    loadingText = 'Searching…',
    debounce = 0,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    onSearch,
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

  const [query, setQueryControllable] = useControllable<string>(
    searchValue,
    defaultSearchValue ?? '',
    onSearchChange,
  );

  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(() => Boolean(searchValue ?? defaultSearchValue));
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const isTypingRef = useRef(isTyping);
  isTypingRef.current = isTyping;
  const lastUserQueryRef = useRef<string | undefined>(searchValue);
  const prevSearchValueRef = useRef<string | undefined>(searchValue);

  useEffect(() => {
    if (prevSearchValueRef.current === searchValue) return;
    prevSearchValueRef.current = searchValue;
    if (searchValue === undefined) {
      lastUserQueryRef.current = undefined;
      isTypingRef.current = false;
      setIsTyping(false);
      return;
    }
    if (searchValue !== lastUserQueryRef.current) {
      lastUserQueryRef.current = searchValue;
      const nextTyping = searchValue.length > 0;
      isTypingRef.current = nextTyping;
      setIsTyping(nextTyping);
    }
  }, [searchValue]);

  const isFreeSolo = Boolean(allowCustomValue || freeSolo);
  const effectiveCommitOnBlur =
    commitOnBlur !== undefined ? commitOnBlur : !multiple && isFreeSolo;

  const knownOptionsRef = useRef<Map<string, ComboboxOption>>(new Map());
  for (const opt of options) {
    knownOptionsRef.current.set(opt.value, opt);
  }

  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSearchTimer = useCallback(() => {
    if (searchTimerRef.current !== null) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  const updateQuery = useCallback(
    (next: string, emitImmediateSearch = false, emitDebouncedSearch = false) => {
      lastUserQueryRef.current = next;
      if (query !== next || searchValue !== undefined) {
        if (query !== next || searchValue !== next) {
          setQueryControllable(next);
        }
      }
      if (emitImmediateSearch) {
        clearSearchTimer();
        onSearchRef.current?.(next);
      } else if (emitDebouncedSearch) {
        clearSearchTimer();
        if (!onSearchRef.current) return;
        if (debounce <= 0) {
          onSearchRef.current(next);
        } else {
          searchTimerRef.current = setTimeout(() => {
            searchTimerRef.current = null;
            onSearchRef.current?.(next);
          }, debounce);
        }
      }
    },
    [clearSearchTimer, debounce, query, searchValue, setQueryControllable],
  );

  useEffect(() => () => clearSearchTimer(), [clearSearchTimer]);

  const selectedValues = useMemo<string[]>(() => {
    if (multiple) return Array.isArray(rawVal) ? rawVal : [];
    return typeof rawVal === 'string' && rawVal ? [rawVal] : [];
  }, [multiple, rawVal]);

  const selectedSingleOption = useMemo(() => {
    if (multiple || typeof rawVal !== 'string' || !rawVal) return undefined;
    return options.find((o) => o.value === rawVal) ?? knownOptionsRef.current.get(rawVal);
  }, [multiple, options, rawVal]);

  const selectedChipOptions = useMemo(() => {
    if (!multiple) return [];
    const map = new Map(options.map((o) => [o.value, o]));
    return selectedValues.map(
      (v) => map.get(v) ?? knownOptionsRef.current.get(v) ?? { value: v, label: v },
    );
  }, [multiple, options, selectedValues]);

  const displayValue = multiple
    ? query
    : isTyping
      ? query
      : (selectedSingleOption?.label ?? (typeof rawVal === 'string' ? rawVal : ''));

  const activeQuery = isTyping || searchValue !== undefined ? query : '';

  const filteredOptions = useMemo(() => {
    if (filter === false) return options;
    if (!activeQuery.trim()) return options;
    const fn = typeof filter === 'function' ? filter : defaultFilter;
    return options.filter((opt) => fn(opt, activeQuery));
  }, [options, activeQuery, filter]);

  const creatableOption = useMemo<ComboboxOption | null>(() => {
    if (!creatable || loading) return null;
    const trimmed = activeQuery.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    const exists = options.some(
      (opt) => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower,
    );
    if (exists) return null;
    const label = typeof creatable === 'function' ? creatable(trimmed) : `Create "${trimmed}"`;
    return { value: trimmed, label };
  }, [creatable, loading, activeQuery, options]);

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

  const enabledFiltered = useMemo(() => {
    const regular = filteredOptions.filter((o) => !o.disabled);
    return creatableOption ? [...regular, creatableOption] : regular;
  }, [filteredOptions, creatableOption]);

  const showClear =
    clearable &&
    !disabled &&
    (multiple ? selectedValues.length > 0 || query.length > 0 : Boolean(rawVal || query));

  const optionDomId = useCallback(
    (val: string) =>
      `${baseId}-opt-${val.length ? Array.from(val, (c) => c.codePointAt(0)!.toString(36)).join('_') : '_'}`,
    [baseId],
  );

  const activeDescendantId = open && activeValue !== null ? optionDomId(activeValue) : undefined;

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
    if (!open || activeValue === null || !listboxRef.current) return;
    const node = listboxRef.current.querySelector(
      `[data-value="${escapeSelectorVal(activeValue)}"]`,
    );
    node?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeValue]);

  useEffect(() => {
    if (!open) return;
    if (activeValue === null) {
      if (!isFreeSolo) {
        setActiveValue(enabledFiltered[0]?.value ?? null);
      }
      return;
    }
    if (!enabledFiltered.some((o) => o.value === activeValue)) {
      setActiveValue(isFreeSolo ? null : (enabledFiltered[0]?.value ?? null));
    }
  }, [open, enabledFiltered, activeValue, isFreeSolo]);

  const pickInitialHighlight = useCallback(
    (preferLast = false, fromKeyboard = false) => {
      if (!enabledFiltered.length) {
        setActiveValue(null);
        return;
      }
      if (preferLast) {
        setActiveValue(enabledFiltered[enabledFiltered.length - 1]!.value);
      } else {
        const sel = enabledFiltered.find((o) => selectedValues.includes(o.value));
        if (sel) {
          setActiveValue(sel.value);
        } else if (isFreeSolo && !fromKeyboard) {
          setActiveValue(null);
        } else {
          setActiveValue(enabledFiltered[0]!.value);
        }
      }
    },
    [enabledFiltered, isFreeSolo, selectedValues],
  );

  const commitCustomValue = useCallback(
    (raw: string, emitCreateIfNew = false) => {
      const trimmed = raw.trim();
      if (!trimmed || disabled) return;

      if (emitCreateIfNew && creatable && !loading) {
        const lower = trimmed.toLowerCase();
        const exists = options.some(
          (opt) => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower,
        );
        if (!exists) onCreate?.(trimmed);
      }

      clearSearchTimer();
      setIsTyping(false);
      updateQuery('');

      if (multiple) {
        const next = selectedValues.includes(trimmed)
          ? selectedValues
          : [...selectedValues, trimmed];
        setRawVal(next);
      } else {
        setRawVal(trimmed);
        hideListbox();
      }
    },
    [
      clearSearchTimer,
      creatable,
      disabled,
      hideListbox,
      loading,
      multiple,
      onCreate,
      options,
      selectedValues,
      setRawVal,
      updateQuery,
    ],
  );

  const queryRef = useRef(query);
  queryRef.current = query;

  const commitPendingIfNeeded = useCallback((): boolean => {
    if (isTypingRef.current && effectiveCommitOnBlur) {
      const trimmed = queryRef.current.trim();
      if (trimmed) {
        isTypingRef.current = false;
        commitCustomValue(trimmed, true);
        return true;
      }
    }
    return false;
  }, [commitCustomValue, effectiveCommitOnBlur]);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    const opened = e.newState === 'open';
    setOpen(opened);
    if (opened) {
      if (!isTypingRef.current) {
        pickInitialHighlight(false, false);
      }
    } else {
      setActiveValue(null);
      if (commitPendingIfNeeded()) return;
      clearSearchTimer();
      isTypingRef.current = false;
      setIsTyping(false);
      updateQuery('');
    }
  };

  const selectCreatableOption = (opt: ComboboxOption) => {
    if (disabled) return;
    clearSearchTimer();
    isTypingRef.current = false;
    setIsTyping(false);
    updateQuery('');
    onCreate?.(opt.value);
    if (multiple) {
      const next = selectedValues.includes(opt.value)
        ? selectedValues
        : [...selectedValues, opt.value];
      setRawVal(next);
      inputRef.current?.focus();
    } else {
      setRawVal(opt.value);
      hideListbox();
      inputRef.current?.focus();
    }
  };

  const selectOption = (opt: ComboboxOption) => {
    if (opt.disabled || disabled) return;
    if (creatableOption && opt === creatableOption) {
      selectCreatableOption(opt);
      return;
    }
    clearSearchTimer();
    isTypingRef.current = false;
    setIsTyping(false);
    updateQuery('');
    if (multiple) {
      const next = selectedValues.includes(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];
      setRawVal(next);
      inputRef.current?.focus();
    } else {
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
    const hadQuery = query.length > 0;
    isTypingRef.current = false;
    setIsTyping(false);
    updateQuery('', hadQuery, false);
    setRawVal(multiple ? [] : null);
    inputRef.current?.focus();
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    isTypingRef.current = true;
    setIsTyping(true);
    updateQuery(v, false, true);
    if (!open) showListbox();
    if (isFreeSolo) {
      const trimmed = v.trim();
      const lower = trimmed.toLowerCase();
      const regularMatch =
        filter === false
          ? options.length > 0
          : options.some((opt) =>
              typeof filter === 'function' ? filter(opt, v) : defaultFilter(opt, v),
            );
      const existsExact = options.some(
        (opt) => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower,
      );
      if (!regularMatch && creatable && !loading && trimmed && !existsExact) {
        setActiveValue(trimmed);
      } else {
        setActiveValue(null);
      }
    }
  };

  const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    const related = e.relatedTarget as Node | null;
    if (
      related &&
      (shellRef.current?.contains(related) || listboxRef.current?.contains(related))
    ) {
      return;
    }
    if (commitPendingIfNeeded()) return;
    if (isTypingRef.current) {
      clearSearchTimer();
      isTypingRef.current = false;
      setIsTyping(false);
      updateQuery('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const list = enabledFiltered;
    const idx = list.findIndex((o) => o.value === activeValue);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          pickInitialHighlight(false, true);
          showListbox();
        } else if (list.length) {
          setActiveValue(list[idx < list.length - 1 ? idx + 1 : 0]!.value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          pickInitialHighlight(true, true);
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
        } else if (isFreeSolo && query.trim()) {
          e.preventDefault();
          isTypingRef.current = false;
          commitCustomValue(query, true);
          inputRef.current?.focus();
        }
        break;
      case 'Escape':
        if (open || isTyping) {
          e.preventDefault();
          e.stopPropagation();
          clearSearchTimer();
          isTypingRef.current = false;
          setIsTyping(false);
          updateQuery('');
          setActiveValue(null);
          hideListbox();
        }
        break;
      case 'Tab':
        commitPendingIfNeeded();
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
        data-loading={flag(loading)}
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
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />

        <div className="j-combobox__controls">
          {loading && <span className="j-combobox__spinner" aria-hidden="true" />}
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
        aria-busy={loading || undefined}
        onPointerDown={(e) => e.preventDefault()}
        onToggle={handleToggle}
      >
        {loading && groupedBuckets.length > 0 && (
          <div className="j-combobox__loading" data-inline="" role="status" aria-live="polite">
            <span className="j-combobox__spinner" aria-hidden="true" />
            <span>{loadingText}</span>
          </div>
        )}

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
        ) : loading ? (
          <div className="j-combobox__loading" role="status" aria-live="polite">
            <span className="j-combobox__spinner" aria-hidden="true" />
            <span>{loadingText}</span>
          </div>
        ) : null}

        {creatableOption && (
          <div
            id={optionDomId(creatableOption.value)}
            className="j-combobox__option j-combobox__create"
            role="option"
            data-value={creatableOption.value}
            data-highlighted={flag(activeValue === creatableOption.value)}
            aria-selected={false}
            onPointerEnter={() => setActiveValue(creatableOption.value)}
            onClick={() => selectCreatableOption(creatableOption)}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M8 3.5v9M3.5 8h9" />
            </svg>
            <div className="j-combobox__option-body">
              <span className="j-combobox__option-label">{creatableOption.label}</span>
            </div>
          </div>
        )}

        {!loading && groupedBuckets.length === 0 && !creatableOption && (
          <div className="j-combobox__empty">{emptyText}</div>
        )}
      </div>
    </>
  );
}
