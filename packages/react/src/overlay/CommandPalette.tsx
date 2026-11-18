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
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { lightDismiss } from 'jenni-core/behaviors/dialog.js';
import {
  bindCommandShortcut,
  createCommandPalette,
} from 'jenni-core/behaviors/command-palette.js';
import {
  cx,
  flag,
  mergeRefs,
  useControllable,
  type CommandGroup,
  type CommandItem,
} from './types';

export interface CommandPaletteProps
  extends Omit<ComponentProps<'dialog'>, 'onSelect' | 'children'> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  items?: CommandItem[];
  groups?: CommandGroup[];
  placeholder?: string;
  emptyText?: ReactNode;
  shortcut?: string | false;
  inline?: boolean;
  closeOnSelect?: boolean;
  dismissible?: boolean;
  showFooter?: boolean;
  showEsc?: boolean;
  breadcrumbs?: string[];
  filter?: (item: CommandItem, query: string) => boolean;
  onSelect?: (item: CommandItem) => void;
  onBack?: () => void;
  onBreadcrumbClick?: (index: number) => void;
  trigger?: ReactNode | ((api: { open: () => void; toggle: () => void }) => ReactNode);
  footer?: ReactNode;
  children?: ReactNode;
}

const ICON_PATHS: Record<string, string> = {
  search: 'M11.5 11.5 14 14M7.25 12.5a5.25 5.25 0 1 1 0-10.5 5.25 5.25 0 0 1 0 10.5Z',
  sparkles: 'M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14M4.2 4.2l1.6 1.6M10.2 10.2l1.6 1.6M11.8 4.2l-1.6 1.6M5.8 10.2l-1.6 1.6',
  sun: 'M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1 1M11.2 11.2l1 1M12.2 3.8l-1 1M4.8 11.2l-1 1',
  moon: 'M13.2 9.8A5.5 5.5 0 0 1 6.2 2.8a5.5 5.5 0 1 0 7 7Z',
  monitor: 'M2.5 3.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1ZM5.5 13.5h5M8 11.5v2',
  terminal: 'm3.5 5.5 3 2.5-3 2.5M8 10.5h4.5M2.5 3h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
  file: 'M4.5 2h4.8L12.5 5.2V13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm4.5.3V5.5h3.2',
  folder: 'M2 4.5a1 1 0 0 1 1-1h3.2l1.4 1.5H13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z',
  'git-branch': 'M5 4.5v7M11 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm6-6.5c0 2.5-2 3-6 3',
  layers: 'M8 2.2 14 5.5 8 8.8 2 5.5 8 2.2ZM2 8.5l6 3.3 6-3.3M2 11.2l6 3.3 6-3.3',
  palette: 'M8 2.2a5.8 5.8 0 1 0 0 11.6c.9 0 1.5-.6 1.5-1.4 0-.4-.2-.7-.4-1-.2-.3-.3-.6-.3-1 0-.8.6-1.4 1.4-1.4h1.1A2.5 2.5 0 0 0 13.8 6.5C13.8 4 11.2 2.2 8 2.2Z',
  layout: 'M2.5 3h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm0 3.5h12M6.5 6.5V13',
  settings: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm5.2-2a5.2 5.2 0 0 0-.1-1l1.2-1-1.2-2-1.4.5a5.2 5.2 0 0 0-1.7-1L9.7 2H6.3L6 3.5a5.2 5.2 0 0 0-1.7 1l-1.4-.5-1.2 2 1.2 1a5.2 5.2 0 0 0 0 2l-1.2 1 1.2 2 1.4-.5c.5.4 1.1.8 1.7 1L6.3 14h3.4l.3-1.5c.6-.2 1.2-.6 1.7-1l1.4.5 1.2-2-1.2-1c.1-.3.1-.7.1-1Z',
  bolt: 'M8.8 1.8 3.5 9h4.1l-.4 5.2L12.5 7H8.4l.4-5.2Z',
  user: 'M8 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.2 13.5a4.8 4.8 0 0 1 9.6 0',
  'arrow-right': 'M3 8h10m-4-4 4 4-4 4',
  globe: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM2.2 8h11.6M8 2c1.7 1.6 2.6 3.7 2.6 6S9.7 12.4 8 14c-1.7-1.6-2.6-3.7-2.6-6S6.3 3.6 8 2Z',
  copy: 'M5.5 5.5h6.5a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Zm-2 5H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h6.5a1 1 0 0 1 1 1v.5',
  plus: 'M8 3.2v9.6M3.2 8h9.6',
};

function parseKeys(shortcut?: string | string[]): string[] {
  if (!shortcut) return [];
  if (Array.isArray(shortcut)) return shortcut;
  if (shortcut.includes(' ')) return shortcut.split(/\s+/).filter(Boolean);
  return [shortcut];
}

function groupFlatItems(list: CommandItem[], fallbackLabel = ''): CommandGroup[] {
  const buckets: CommandGroup[] = [];
  const map = new Map<string, CommandGroup>();
  for (const item of list) {
    const key = item.group ?? fallbackLabel;
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { id: key || '__ungrouped', label: key, items: [] };
      map.set(key, bucket);
      buckets.push(bucket);
    }
    bucket.items.push(item);
  }
  return buckets;
}

const defaultFilter = (item: CommandItem, q: string, groupLabel?: string): boolean => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (item.label.toLowerCase().includes(needle)) return true;
  if (item.description?.toLowerCase().includes(needle)) return true;
  if ((groupLabel || item.group || '').toLowerCase().includes(needle)) return true;
  if (item.keywords?.some((kw) => kw.toLowerCase().includes(needle))) return true;
  return false;
};

interface DrilldownPage {
  label: string;
  items: CommandItem[];
}

export function CommandPalette({
  open,
  defaultOpen,
  onOpenChange,
  query,
  defaultQuery,
  onQueryChange,
  items,
  groups,
  placeholder = 'Type a command or search…',
  emptyText = 'No matching commands found.',
  shortcut,
  inline = false,
  closeOnSelect = true,
  dismissible = true,
  showFooter = true,
  showEsc = true,
  breadcrumbs,
  filter,
  onSelect,
  onBack,
  onBreadcrumbClick,
  trigger,
  footer,
  children,
  className,
  'aria-label': ariaLabel = 'Command palette',
  onClose,
  onCancel,
  ref,
  ...rest
}: CommandPaletteProps) {
  const baseId = useId();
  const listboxId = `${baseId}-list`;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inlineRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const [curQuery, setQuery] = useControllable(query, defaultQuery ?? '', onQueryChange);
  const [pageStack, setPageStack] = useState<DrilldownPage[]>([]);
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const isSlotMode =
    children != null && (!items || items.length === 0) && (!groups || groups.length === 0);

  const activeBreadcrumbs = useMemo<string[]>(() => {
    if (breadcrumbs && breadcrumbs.length > 0) return breadcrumbs;
    return pageStack.map((p) => p.label);
  }, [breadcrumbs, pageStack]);

  const rawGroups = useMemo<CommandGroup[]>(() => {
    const topPage = pageStack[pageStack.length - 1];
    if (topPage) return groupFlatItems(topPage.items, topPage.label);
    if (groups && groups.length > 0) return groups;
    return groupFlatItems(items ?? []);
  }, [pageStack, groups, items]);

  const filteredGroups = useMemo<CommandGroup[]>(() => {
    if (!curQuery.trim()) return rawGroups;
    return rawGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) =>
          filter ? filter(item, curQuery) : defaultFilter(item, curQuery, g.label),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [rawGroups, curQuery, filter]);

  const enabledItems = useMemo(
    () => filteredGroups.flatMap((g) => g.items.filter((i) => !i.disabled)),
    [filteredGroups],
  );

  const itemDomId = useCallback(
    (val: string) => `${baseId}-opt-${encodeURIComponent(val).replace(/%/g, '_')}`,
    [baseId],
  );

  const activeDescendantId =
    !isSlotMode && activeValue ? itemDomId(activeValue) : undefined;

  const showModal = useCallback(() => {
    if (inline) {
      inputRef.current?.focus();
      return;
    }
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [inline, setOpen]);

  const closeModal = useCallback(() => {
    if (inline) return;
    const el = dialogRef.current;
    if (el?.open) el.close();
    setOpen(false);
    setPageStack([]);
    setQuery('');
  }, [inline, setOpen, setQuery]);

  const toggleModal = useCallback(() => {
    if (isOpen) closeModal();
    else showModal();
  }, [isOpen, closeModal, showModal]);

  const popBreadcrumb = useCallback(
    (targetIndex?: number) => {
      if (breadcrumbs && breadcrumbs.length > 0) {
        if (typeof targetIndex === 'number') onBreadcrumbClick?.(targetIndex);
        else onBack?.();
        setQuery('');
        inputRef.current?.focus();
        return true;
      }
      if (pageStack.length > 0) {
        setPageStack((prev) =>
          typeof targetIndex === 'number' ? prev.slice(0, targetIndex) : prev.slice(0, -1),
        );
        setQuery('');
        onBack?.();
        inputRef.current?.focus();
        return true;
      }
      return false;
    },
    [breadcrumbs, pageStack.length, onBack, onBreadcrumbClick, setQuery],
  );

  useEffect(() => {
    if (isSlotMode) return;
    if (!enabledItems.length) {
      setActiveValue(null);
      return;
    }
    if (!enabledItems.some((i) => i.value === activeValue)) {
      setActiveValue(enabledItems[0]!.value);
    }
  }, [enabledItems, activeValue, isSlotMode]);

  useEffect(() => {
    if (!activeValue || !listRef.current) return;
    const node = listRef.current.querySelector(`[data-value="${CSS.escape(activeValue)}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeValue]);

  useEffect(() => {
    if (inline) return;
    const el = dialogRef.current;
    if (!el || !dismissible) return;
    return lightDismiss(el);
  }, [inline, dismissible]);

  useEffect(() => {
    if (inline || !shortcut) return;
    return bindCommandShortcut(shortcut, () => toggleModal());
  }, [inline, shortcut, toggleModal]);

  useEffect(() => {
    if (inline) return;
    const el = dialogRef.current;
    if (!el) return;
    if (isOpen && !el.open) {
      el.showModal();
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (!isOpen && el.open) {
      el.close();
    }
  }, [inline, isOpen]);

  useEffect(() => {
    if (!isSlotMode) return;
    const host = inline ? inlineRef.current : dialogRef.current;
    if (!host) return;
    const ctrl = createCommandPalette(host, {
      shortcut: false,
      dismissible: false,
      closeOnSelect,
      onSelect: (detail) => onSelect?.({ value: detail.value, label: detail.label }),
      onQueryChange: (q) => setQuery(q),
    });
    return () => ctrl.destroy();
  }, [isSlotMode, inline, closeOnSelect, onSelect, setQuery]);

  useEffect(() => {
    return () => {
      if (dialogRef.current?.open) dialogRef.current.close();
    };
  }, []);

  const handleSelectItem = (item: CommandItem) => {
    if (item.disabled) return;
    if (item.children && item.children.length > 0) {
      setPageStack((prev) => [...prev, { label: item.label, items: item.children! }]);
      setQuery('');
      inputRef.current?.focus();
      return;
    }
    item.onSelect?.(item);
    onSelect?.(item);
    if (!inline && closeOnSelect && !item.keepOpen) {
      closeModal();
    } else {
      inputRef.current?.focus();
    }
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isSlotMode) return;
    const list = enabledItems;
    const idx = list.findIndex((i) => i.value === activeValue);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (list.length) {
          setActiveValue(list[idx < list.length - 1 ? idx + 1 : 0]!.value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (list.length) {
          setActiveValue(list[idx > 0 ? idx - 1 : list.length - 1]!.value);
        }
        break;
      case 'Home':
        if (list.length) {
          e.preventDefault();
          setActiveValue(list[0]!.value);
        }
        break;
      case 'End':
        if (list.length) {
          e.preventDefault();
          setActiveValue(list[list.length - 1]!.value);
        }
        break;
      case 'Enter':
        if (idx >= 0 && list[idx]) {
          e.preventDefault();
          handleSelectItem(list[idx]!);
        }
        break;
      case 'Backspace':
        if (!curQuery && activeBreadcrumbs.length > 0) {
          e.preventDefault();
          popBreadcrumb();
        }
        break;
      case 'Escape':
        if (activeBreadcrumbs.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          popBreadcrumb();
        } else if (inline && curQuery) {
          e.preventDefault();
          setQuery('');
        } else if (!inline && dismissible) {
          e.preventDefault();
          closeModal();
        }
        break;
      default:
        break;
    }
  };

  const handleDialogClose = (e: SyntheticEvent<HTMLDialogElement>) => {
    onClose?.(e);
    setOpen(false);
    setPageStack([]);
    setQuery('');
  };

  const handleDialogCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    onCancel?.(e);
    if (activeBreadcrumbs.length > 0) {
      e.preventDefault();
      popBreadcrumb();
      return;
    }
    if (!dismissible) e.preventDefault();
  };

  const renderIcon = (icon?: ReactNode | string) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      const path =
        ICON_PATHS[icon] ?? (icon.startsWith('M') || icon.startsWith('m') ? icon : null);
      if (!path) return null;
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={path} />
        </svg>
      );
    }
    return icon;
  };

  const innerContent = (
    <>
      <div className="j-command-palette__header">
        <span className="j-command-palette__search-icon" aria-hidden="true">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICON_PATHS.search} />
          </svg>
        </span>

        {activeBreadcrumbs.length > 0 && (
          <span className="j-command-palette__breadcrumbs">
            <button
              type="button"
              className="j-command-palette__breadcrumb"
              onClick={() => popBreadcrumb(0)}
            >
              Root
            </button>
            {activeBreadcrumbs.map((crumb, cIdx) => (
              <button
                key={`${crumb}-${cIdx}`}
                type="button"
                className="j-command-palette__breadcrumb"
                onClick={() => popBreadcrumb(cIdx)}
              >
                {crumb}
              </button>
            ))}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          className="j-command-palette__input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={inline || isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={curQuery}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
        />

        {showEsc && (!inline || Boolean(curQuery)) && (
          <button
            type="button"
            tabIndex={-1}
            className="j-command-palette__close"
            aria-label={inline ? 'Clear query' : 'Close command palette'}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => (inline ? setQuery('') : closeModal())}
          >
            <kbd className="j-kbd" data-size="sm">
              Esc
            </kbd>
          </button>
        )}
      </div>

      <div
        id={listboxId}
        ref={listRef}
        className="j-command-palette__list"
        role="listbox"
        aria-label={ariaLabel}
        onPointerDown={(e) => {
          if (!isSlotMode) e.preventDefault();
        }}
      >
        {isSlotMode ? (
          children
        ) : filteredGroups.length > 0 ? (
          filteredGroups.map((group, gIdx) => (
            <div
              key={group.id ?? `${group.label}-${gIdx}`}
              className="j-command-palette__group"
              role="group"
              aria-label={group.label || undefined}
            >
              {group.label && (
                <div className="j-command-palette__group-label">{group.label}</div>
              )}
              {group.items.map((item) => {
                const iconNode = renderIcon(item.icon);
                const keys = parseKeys(item.shortcut);
                const active = activeValue === item.value;
                return (
                  <div
                    id={itemDomId(item.value)}
                    key={item.id ?? item.value}
                    className="j-command-palette__item"
                    role="option"
                    data-value={item.value}
                    data-highlighted={flag(active)}
                    aria-selected={active}
                    aria-disabled={item.disabled || undefined}
                    onPointerEnter={() => {
                      if (!item.disabled) setActiveValue(item.value);
                    }}
                    onClick={() => handleSelectItem(item)}
                  >
                    {iconNode && (
                      <span className="j-command-palette__item-icon" aria-hidden="true">
                        {iconNode}
                      </span>
                    )}
                    <span className="j-command-palette__item-body">
                      <span className="j-command-palette__item-title">{item.label}</span>
                      {item.description && (
                        <span className="j-command-palette__item-description">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {keys.length > 0 ? (
                      <span className="j-command-palette__item-shortcut" aria-hidden="true">
                        {keys.map((k, kIdx) => (
                          <kbd key={`${k}-${kIdx}`} className="j-kbd" data-size="sm">
                            {k}
                          </kbd>
                        ))}
                      </span>
                    ) : item.children && item.children.length > 0 ? (
                      <span className="j-command-palette__item-chevron" aria-hidden="true">
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 4 4 4-4 4" />
                        </svg>
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="j-command-palette__empty">{emptyText}</div>
        )}
      </div>

      {(showFooter || footer != null) && (
        <footer className="j-command-palette__footer">
          {footer ?? (
            <div className="j-command-palette__hints">
              <span className="j-command-palette__hint">
                <kbd className="j-kbd" data-size="sm">
                  ↑
                </kbd>
                <kbd className="j-kbd" data-size="sm">
                  ↓
                </kbd>
                <span>Navigate</span>
              </span>
              <span className="j-command-palette__hint">
                <kbd className="j-kbd" data-size="sm">
                  ↵
                </kbd>
                <span>{activeBreadcrumbs.length > 0 ? 'Select' : 'Run'}</span>
              </span>
              {activeBreadcrumbs.length > 0 && (
                <span className="j-command-palette__hint">
                  <kbd className="j-kbd" data-size="sm">
                    ⌫
                  </kbd>
                  <span>Back</span>
                </span>
              )}
              {!inline && (
                <span className="j-command-palette__hint">
                  <kbd className="j-kbd" data-size="sm">
                    Esc
                  </kbd>
                  <span>{activeBreadcrumbs.length > 0 ? 'Back' : 'Close'}</span>
                </span>
              )}
            </div>
          )}
        </footer>
      )}
    </>
  );

  return (
    <>
      {typeof trigger === 'function' ? trigger({ open: showModal, toggle: toggleModal }) : trigger}
      {inline ? (
        <div
          ref={inlineRef}
          className={cx('j-command-palette', className)}
          data-inline=""
          role="region"
          aria-label={ariaLabel}
          style={rest.style}
        >
          {innerContent}
        </div>
      ) : (
        <dialog
          {...rest}
          ref={mergeRefs(dialogRef, ref)}
          className={cx('j-command-palette', className)}
          aria-label={ariaLabel}
          onClose={handleDialogClose}
          onCancel={handleDialogCancel}
        >
          {innerContent}
        </dialog>
      )}
    </>
  );
}
