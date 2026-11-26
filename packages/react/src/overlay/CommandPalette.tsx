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
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z',
  sparkles:
    'M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0ZM20 3v4M22 5h-4',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  monitor:
    'M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 21h8M12 17v4',
  terminal:
    'm5 8 4 4-4 4M12 16h7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  file: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7L15 2ZM14 2v4a2 2 0 0 0 2 2h4',
  folder:
    'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16Z',
  'git-branch':
    'M6 9v6M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12-12c0 4.5-3 6-12 6',
  layers: 'M12 2 2 7l10 5 10-5-10-5ZM2 12l10 5 10-5M2 17l10 5 10-5',
  palette:
    'M12 2a10 10 0 0 0 0 20 1.7 1.7 0 0 0 1.7-1.7c0-.44-.18-.85-.46-1.15a1.67 1.67 0 0 1 1.24-2.8H16.5A5.5 5.5 0 0 0 22 10.85C22 5.96 17.52 2 12 2Zm-5.5 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
  layout: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM3 9h18M9 21V9',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.43-2.53c.04-.31.07-.64.07-.97s-.03-.66-.07-.97l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.3 7.3 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64L4.57 11.03c-.04.31-.07.64-.07.97s.03.66.07.97l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.22.39.3.61.22l2.49-1c.52.39 1.08.73 1.69.98l.38 2.65c.05.24.25.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.22.08.48 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65Z',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8Z',
  user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  'arrow-right': 'M5 12h14m-6-6 6 6-6 6',
  globe:
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z',
  copy: 'M10 9h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2ZM5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  close: 'M18 6 6 18M6 6l12 12',
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
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          shapeRendering="geometricPrecision"
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
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            shapeRendering="geometricPrecision"
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
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          shapeRendering="geometricPrecision"
                        >
                          <path d="M9 6l6 6-6 6" />
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
