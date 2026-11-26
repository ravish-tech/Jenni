/// <reference path="./core.d.ts" />
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
} from 'react';
import {
  createTabStrip,
  type TabStripController,
  type TabStripDetachDetail,
  type TabStripReorderDetail,
} from 'jenni-core/behaviors/tab-strip.js';
import { createContextMenu, type ContextMenuController } from 'jenni-core/behaviors/context-menu.js';
import { createPopover } from 'jenni-core/behaviors/popover.js';
import { Icon } from '../display/Icon';
import { cx, flag, useControllable } from './types';

export type TabStripSize = 'sm' | 'md';
export type TabStripIndicatorTone =
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export interface TabStripItem {
  id: string;
  title: string;
  label?: string;
  icon?: string;
  closable?: boolean;
  pinned?: boolean;
  preview?: boolean;
  dirty?: boolean;
  loading?: boolean;
  indicator?: boolean | 'accent' | 'success' | 'warning' | 'danger' | 'info' | string;
  description?: string;
  disabled?: boolean;
}

export interface TabStripHandle {
  scrollToTab: (id: string, instant?: boolean) => void;
  focusActiveTab: () => void;
  scrollActiveIntoView: (instant?: boolean) => void;
  closeContextMenu: () => void;
  closeSearch: () => void;
  sync: () => void;
  readonly el: HTMLDivElement | null;
}

export interface TabStripProps
  extends Omit<ComponentProps<'div'>, 'children' | 'ref' | 'onDoubleClick' | 'contextMenu'> {
  tabs: TabStripItem[];
  active?: string;
  value?: string;
  defaultActive?: string;
  defaultValue?: string;
  onActiveChange?: (id: string) => void;
  onValueChange?: (id: string) => void;
  onTabsChange?: (tabs: TabStripItem[]) => void;
  onTabClose?: (id: string) => void;
  onClose?: (id: string) => void;
  onCloseOthers?: (id: string) => void;
  onCloseRight?: (id: string) => void;
  onTabDoubleClick?: (id: string) => void;
  onReorder?: (detail: TabStripReorderDetail) => void;
  onDetach?: (detail: TabStripDetachDetail) => void;
  onNewTab?: (afterId?: string) => void;
  onNew?: (afterId?: string) => void;
  size?: TabStripSize;
  closable?: boolean;
  closablePinned?: boolean;
  addable?: boolean;
  draggable?: boolean;
  detachable?: boolean;
  search?: boolean;
  titlebar?: boolean;
  contextMenu?: boolean;
  middleClickClose?: boolean;
  previewDelay?: number;
  ariaLabel?: string;
  newTabLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  start?: ReactNode;
  end?: ReactNode;
  renderIcon?: (tab: TabStripItem) => ReactNode;
  renderContextMenu?: (ctx: { tab: TabStripItem; close: () => void }) => ReactNode;
  ref?: Ref<TabStripHandle>;
  handleRef?: Ref<TabStripHandle>;
}

const INDICATOR_TONES = new Set<string>([
  'accent',
  'success',
  'warning',
  'danger',
  'info',
  'neutral',
]);

function getTabTitle(tab: TabStripItem): string {
  return tab.title || tab.label || tab.id;
}

function resolveIndicator(
  indicator: TabStripItem['indicator'],
): { tone?: TabStripIndicatorTone; color?: string } | null {
  if (!indicator) return null;
  if (indicator === true) return { tone: 'accent' };
  if (typeof indicator === 'string') {
    if (INDICATOR_TONES.has(indicator)) {
      return { tone: indicator as TabStripIndicatorTone };
    }
    return { color: indicator };
  }
  return null;
}

function LoadingSpinner() {
  return (
    <span className="j-spinner" data-size="sm" aria-hidden="true">
      <svg
        className="j-spinner__svg"
        viewBox="0 0 24 24"
        fill="none"
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <circle className="j-spinner__track" cx="12" cy="12" r="9.5" stroke="currentColor" />
        <circle
          className="j-spinner__arc"
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function TabStrip({
  tabs,
  active,
  value,
  defaultActive,
  defaultValue,
  onActiveChange,
  onValueChange,
  onTabsChange,
  onTabClose,
  onClose,
  onCloseOthers,
  onCloseRight,
  onTabDoubleClick,
  onReorder,
  onDetach,
  onNewTab,
  onNew,
  size = 'md',
  closable = true,
  closablePinned = false,
  addable = true,
  draggable = false,
  detachable = false,
  search = false,
  titlebar = false,
  contextMenu = true,
  middleClickClose = true,
  previewDelay = 380,
  ariaLabel,
  'aria-label': ariaLabelAttr,
  newTabLabel = 'New tab',
  searchLabel = 'Search tabs',
  searchPlaceholder = 'Search open tabs…',
  start,
  end,
  renderIcon,
  renderContextMenu,
  className,
  ref,
  handleRef,
  ...rest
}: TabStripProps) {
  const baseId = useId();
  const searchPanelId = `${baseId}-search`;
  const ctxMenuId = `${baseId}-ctx`;

  const controlledValue = active !== undefined ? active : value;
  const initialFallback =
    defaultActive ?? defaultValue ?? tabs.find((t) => !t.disabled)?.id ?? '';

  const handleActiveChange = useCallback(
    (id: string) => {
      onActiveChange?.(id);
      onValueChange?.(id);
    },
    [onActiveChange, onValueChange],
  );

  const [activeId, setActiveId] = useControllable(
    controlledValue,
    initialFallback,
    handleActiveChange,
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stripCtrlRef = useRef<TabStripController | null>(null);
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchListRef = useRef<HTMLDivElement | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement | null>(null);
  const ctxCtrlRef = useRef<ContextMenuController | null>(null);
  const pendingCtxOpenRef = useRef<null | {
    isKeyboard: boolean;
    x: number;
    y: number;
    anchorEl: HTMLElement;
  }>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchHighlightIndex, setSearchHighlightIndex] = useState(0);
  const [contextTabId, setContextTabId] = useState<string | null>(null);
  const [ctxOpenTick, setCtxOpenTick] = useState(0);

  const isTabClosable = useCallback(
    (tab: TabStripItem | null | undefined): boolean => {
      if (!tab || tab.disabled) return false;
      if (tab.pinned) {
        return tab.closable === true || (closablePinned && tab.closable !== false);
      }
      return (tab.closable ?? closable) !== false;
    },
    [closable, closablePinned],
  );

  const selectTabById = useCallback(
    (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (!tab || tab.disabled) return;
      if (activeId !== id) {
        setActiveId(id);
      }
    },
    [tabs, activeId, setActiveId],
  );

  const emitClose = useCallback(
    (id: string) => {
      onTabClose?.(id);
      onClose?.(id);
    },
    [onTabClose, onClose],
  );

  const closeTab = useCallback(
    (tab: TabStripItem) => {
      if (!isTabClosable(tab)) return;
      const closedIndex = tabs.findIndex((t) => t.id === tab.id);
      emitClose(tab.id);

      if (onTabsChange && closedIndex !== -1) {
        const nextTabs = tabs.filter((t) => t.id !== tab.id);
        onTabsChange(nextTabs);
        if (activeId === tab.id) {
          const nextCandidate =
            nextTabs.slice(closedIndex).find((t) => !t.disabled) ??
            [...nextTabs.slice(0, closedIndex)].reverse().find((t) => !t.disabled);
          if (nextCandidate) {
            setActiveId(nextCandidate.id);
          }
        }
      }
    },
    [isTabClosable, tabs, emitClose, onTabsChange, activeId, setActiveId],
  );

  const closeContextMenu = useCallback(() => {
    ctxCtrlRef.current?.close();
  }, []);

  const closeSearch = useCallback(() => {
    if (searchPanelRef.current?.matches(':popover-open')) {
      try {
        searchPanelRef.current.hidePopover();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handleCloseOthers = useCallback(
    (keepTab: TabStripItem) => {
      const targets = tabs.filter(
        (t) => t.id !== keepTab.id && !t.pinned && isTabClosable(t),
      );
      for (const t of targets) {
        emitClose(t.id);
      }
      onCloseOthers?.(keepTab.id);

      if (onTabsChange && targets.length > 0) {
        const removeIds = new Set(targets.map((t) => t.id));
        const nextTabs = tabs.filter((t) => !removeIds.has(t.id));
        onTabsChange(nextTabs);
        if (removeIds.has(activeId) && !keepTab.disabled) {
          setActiveId(keepTab.id);
        }
      }
      closeContextMenu();
    },
    [tabs, isTabClosable, emitClose, onCloseOthers, onTabsChange, activeId, setActiveId, closeContextMenu],
  );

  const handleCloseRight = useCallback(
    (anchorTab: TabStripItem) => {
      const idx = tabs.findIndex((t) => t.id === anchorTab.id);
      if (idx < 0) return;
      const targets = tabs.slice(idx + 1).filter((t) => isTabClosable(t));
      for (const t of targets) {
        emitClose(t.id);
      }
      onCloseRight?.(anchorTab.id);

      if (onTabsChange && targets.length > 0) {
        const removeIds = new Set(targets.map((t) => t.id));
        const nextTabs = tabs.filter((t) => !removeIds.has(t.id));
        onTabsChange(nextTabs);
        if (removeIds.has(activeId)) {
          const candidate = !anchorTab.disabled
            ? anchorTab
            : nextTabs.find((t) => !t.disabled);
          if (candidate) setActiveId(candidate.id);
        }
      }
      closeContextMenu();
    },
    [tabs, isTabClosable, emitClose, onCloseRight, onTabsChange, activeId, setActiveId, closeContextMenu],
  );

  const reorderTabs = useCallback(
    (detail: TabStripReorderDetail) => {
      const { from, to } = detail;
      if (from < 0 || to < 0 || from >= tabs.length || to >= tabs.length || from === to) {
        return;
      }
      const nextTabs = [...tabs];
      const [moved] = nextTabs.splice(from, 1);
      if (!moved) return;
      nextTabs.splice(to, 0, moved);
      onTabsChange?.(nextTabs);
      onReorder?.({ from, to });
    },
    [tabs, onTabsChange, onReorder],
  );

  const handleNewTab = useCallback(
    (afterId?: string) => {
      onNewTab?.(afterId);
      onNew?.(afterId);
      closeContextMenu();
    },
    [onNewTab, onNew, closeContextMenu],
  );

  const openTabContextMenu = useCallback(
    (id: string, tabEl: HTMLElement, event: MouseEvent | KeyboardEvent) => {
      if (!contextMenu) return;
      event.preventDefault();
      const isKeyboard =
        event instanceof KeyboardEvent ||
        ('clientX' in event && event.clientX === 0 && event.clientY === 0);
      const x = 'clientX' in event ? event.clientX : 0;
      const y = 'clientY' in event ? event.clientY : 0;

      pendingCtxOpenRef.current = { isKeyboard, x, y, anchorEl: tabEl };
      setContextTabId(id);
      setCtxOpenTick((n) => n + 1);
    },
    [contextMenu],
  );

  useEffect(() => {
    const req = pendingCtxOpenRef.current;
    const ctrl = ctxCtrlRef.current;
    if (!req || !ctrl) return;
    pendingCtxOpenRef.current = null;
    if (req.isKeyboard) {
      ctrl.openFor(req.anchorEl, {
        keyboard: true,
        align: 'bottom-start',
        returnFocusTo: req.anchorEl,
      });
    } else {
      ctrl.openAt(req.x, req.y, {
        keyboard: false,
        anchor: req.anchorEl,
        returnFocusTo: req.anchorEl,
      });
    }
  }, [contextTabId, ctxOpenTick]);

  const callbacksRef = useRef({
    selectTabById,
    closeTab,
    reorderTabs,
    onTabDoubleClick,
    onDetach,
    openTabContextMenu,
    tabs,
  });
  callbacksRef.current = {
    selectTabById,
    closeTab,
    reorderTabs,
    onTabDoubleClick,
    onDetach,
    openTabContextMenu,
    tabs,
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctrl = createTabStrip(root, {
      draggable,
      detachable,
      middleClickClose,
      previewDelay,
      onSelect: (id) => callbacksRef.current.selectTabById(id),
      onClose: (id) => {
        const tab = callbacksRef.current.tabs.find((t) => t.id === id);
        if (tab) callbacksRef.current.closeTab(tab);
      },
      onDoubleClick: (id) => callbacksRef.current.onTabDoubleClick?.(id),
      onReorder: (detail) => callbacksRef.current.reorderTabs(detail),
      onDetach: (detail) => callbacksRef.current.onDetach?.(detail),
      onTabContextMenu: (id, tabEl, ev) =>
        callbacksRef.current.openTabContextMenu(id, tabEl, ev),
    });
    stripCtrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      stripCtrlRef.current = null;
    };
  }, [draggable, detachable, middleClickClose, previewDelay]);

  useEffect(() => {
    stripCtrlRef.current?.sync();
  }, [tabs]);

  useEffect(() => {
    stripCtrlRef.current?.scrollActiveIntoView();
  }, [activeId]);

  useEffect(() => {
    if (!search) return;
    const btn = searchBtnRef.current;
    const panel = searchPanelRef.current;
    if (!btn || !panel) return;
    return createPopover(btn, panel, { side: 'bottom' });
  }, [search]);

  useEffect(() => {
    if (!contextMenu) return;
    const menuEl = ctxMenuRef.current;
    if (!menuEl) return;
    const ctrl = createContextMenu(null, menuEl, { loop: true, manageChecked: false });
    ctxCtrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      ctxCtrlRef.current = null;
    };
  }, [contextMenu]);

  const focusActiveTab = useCallback(() => {
    const scroller = rootRef.current?.querySelector<HTMLElement>('.j-tab-strip__scroller');
    if (!scroller) return;
    const activeEl =
      scroller.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ??
      scroller.querySelector<HTMLElement>('[role="tab"]:not([aria-disabled="true"])');
    activeEl?.focus();
    stripCtrlRef.current?.scrollActiveIntoView();
  }, []);

  const buildHandle = useCallback(
    (): TabStripHandle => ({
      scrollToTab: (id: string, instant?: boolean) =>
        stripCtrlRef.current?.scrollToTab(id, instant),
      focusActiveTab,
      scrollActiveIntoView: (instant?: boolean) =>
        stripCtrlRef.current?.scrollActiveIntoView(instant),
      closeContextMenu,
      closeSearch,
      sync: () => stripCtrlRef.current?.sync(),
      get el() {
        return rootRef.current;
      },
    }),
    [focusActiveTab, closeContextMenu, closeSearch],
  );

  useImperativeHandle(ref, buildHandle, [buildHandle]);
  useImperativeHandle(handleRef, buildHandle, [buildHandle]);

  const firstFocusableId = useMemo(() => {
    const activeItem = tabs.find((t) => t.id === activeId && !t.disabled);
    if (activeItem) return activeItem.id;
    return tabs.find((t) => !t.disabled)?.id;
  }, [tabs, activeId]);

  const filteredTabs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabs;
    return tabs.filter((t) => {
      const title = getTabTitle(t).toLowerCase();
      const desc = (t.description ?? '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [tabs, searchQuery]);

  useEffect(() => {
    if (filteredTabs.length === 0) {
      setSearchHighlightIndex(-1);
      return;
    }
    setSearchHighlightIndex((prev) => {
      if (prev >= 0 && prev < filteredTabs.length) return prev;
      const firstEnabled = filteredTabs.findIndex((t) => !t.disabled);
      return firstEnabled >= 0 ? firstEnabled : 0;
    });
  }, [filteredTabs]);

  const contextTab = useMemo(
    () => tabs.find((t) => t.id === contextTabId) ?? null,
    [tabs, contextTabId],
  );

  const closableOtherTabs = useMemo(() => {
    if (!contextTab) return [];
    return tabs.filter(
      (t) => t.id !== contextTab.id && !t.pinned && isTabClosable(t),
    );
  }, [tabs, contextTab, isTabClosable]);

  const closableRightTabs = useMemo(() => {
    if (!contextTab) return [];
    const idx = tabs.findIndex((t) => t.id === contextTab.id);
    if (idx < 0) return [];
    return tabs.slice(idx + 1).filter((t) => isTabClosable(t));
  }, [tabs, contextTab, isTabClosable]);

  const onSearchToggle = (e: SyntheticEvent<HTMLDivElement>) => {
    const native = e.nativeEvent as ToggleEvent;
    if (native.newState !== 'open') return;
    setSearchQuery('');
    const activeIdx = tabs.findIndex((t) => t.id === activeId && !t.disabled);
    const fallbackIdx = tabs.findIndex((t) => !t.disabled);
    const targetIdx = activeIdx >= 0 ? activeIdx : Math.max(0, fallbackIdx);
    setSearchHighlightIndex(targetIdx);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
      const item = searchListRef.current?.children[targetIdx] as HTMLElement | undefined;
      item?.scrollIntoView?.({ block: 'nearest' });
    });
  };

  const stepSearchHighlight = (delta: 1 | -1) => {
    if (filteredTabs.length === 0) return;
    let idx = searchHighlightIndex;
    for (let count = 0; count < filteredTabs.length; count += 1) {
      idx = (idx + delta + filteredTabs.length) % filteredTabs.length;
      if (!filteredTabs[idx]?.disabled) {
        setSearchHighlightIndex(idx);
        const nextIdx = idx;
        requestAnimationFrame(() => {
          const item = searchListRef.current?.children[nextIdx] as HTMLElement | undefined;
          item?.scrollIntoView?.({ block: 'nearest' });
        });
        return;
      }
    }
  };

  const activateSearchTab = (tab: TabStripItem) => {
    if (tab.disabled) return;
    selectTabById(tab.id);
    closeSearch();
    setTimeout(() => stripCtrlRef.current?.scrollToTab(tab.id), 0);
  };

  const onSearchKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepSearchHighlight(1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepSearchHighlight(-1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const picked = filteredTabs[searchHighlightIndex];
      if (picked && !picked.disabled) {
        activateSearchTab(picked);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeSearch();
      searchBtnRef.current?.focus({ preventScroll: true });
    }
  };

  const renderTabMedia = (tab: TabStripItem) => {
    if (tab.loading) {
      return (
        <span className="j-tab-strip__media" aria-hidden="true">
          <LoadingSpinner />
        </span>
      );
    }
    const custom = renderIcon ? renderIcon(tab) : null;
    if (custom != null) {
      return (
        <span className="j-tab-strip__media" aria-hidden="true">
          {custom}
        </span>
      );
    }
    if (tab.icon) {
      return (
        <span className="j-tab-strip__media" aria-hidden="true">
          <Icon name={tab.icon} size="sm" />
        </span>
      );
    }
    if (tab.pinned) {
      return (
        <span className="j-tab-strip__media" aria-hidden="true">
          <Icon name="pin" size="xs" />
        </span>
      );
    }
    return null;
  };

  const resolvedAriaLabel = ariaLabelAttr ?? ariaLabel ?? 'Open tabs';

  return (
    <div
      {...rest}
      ref={rootRef}
      className={cx('j-tab-strip', className)}
      data-size={size === 'md' ? undefined : size}
      data-titlebar={flag(titlebar)}
      data-draggable={flag(draggable)}
      data-detachable={flag(detachable)}
    >
      {start != null && <div className="j-tab-strip__start">{start}</div>}

      {search && (
        <>
          <button
            ref={searchBtnRef}
            type="button"
            className="j-tab-strip__search-btn"
            aria-label={searchLabel}
            title={searchLabel}
          >
            <Icon name="chevron-down" size="xs" />
          </button>

          <div
            id={searchPanelId}
            ref={searchPanelRef}
            className="j-tab-strip__search-panel"
            popover="auto"
            data-side="bottom"
            data-align="start"
            role="dialog"
            aria-label={searchLabel}
            onToggle={onSearchToggle}
            onKeyDown={onSearchKeyDown}
          >
            <div className="j-tab-strip__search-header">
              <Icon name="search" size="sm" />
              <input
                ref={searchInputRef}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={filteredTabs.length > 0}
                aria-controls={filteredTabs.length > 0 ? `${searchPanelId}-listbox` : undefined}
                aria-activedescendant={
                  filteredTabs[searchHighlightIndex]
                    ? `${searchPanelId}-opt-${filteredTabs[searchHighlightIndex].id}`
                    : undefined
                }
                className="j-tab-strip__search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {filteredTabs.length > 0 ? (
              <div
                id={`${searchPanelId}-listbox`}
                ref={searchListRef}
                className="j-tab-strip__search-list"
                role="listbox"
                aria-label={resolvedAriaLabel}
              >
                {filteredTabs.map((tab, sIdx) => {
                  const tabTitle = getTabTitle(tab);
                  const ind = resolveIndicator(tab.indicator);
                  const tabClosable = isTabClosable(tab);
                  return (
                    <div
                      id={`${searchPanelId}-opt-${tab.id}`}
                      key={`search-${tab.id}`}
                      className="j-tab-strip__search-item"
                      role="option"
                      aria-selected={tab.id === activeId}
                      data-active={flag(tab.id === activeId)}
                      data-highlighted={flag(sIdx === searchHighlightIndex)}
                      data-preview={flag(tab.preview)}
                      data-disabled={flag(tab.disabled)}
                      onPointerEnter={() => setSearchHighlightIndex(sIdx)}
                      onClick={() => activateSearchTab(tab)}
                    >
                      {renderTabMedia(tab)}

                      <div className="j-tab-strip__search-item-main">
                        <span className="j-tab-strip__search-item-title">{tabTitle}</span>
                        {tab.description && (
                          <span className="j-tab-strip__search-item-desc">{tab.description}</span>
                        )}
                      </div>

                      {ind && (
                        <span
                          className="j-tab-strip__indicator"
                          data-tone={ind.tone}
                          data-indicator-color={ind.color}
                          aria-hidden="true"
                        />
                      )}
                      {tab.dirty && <span className="j-tab-strip__dirty" aria-hidden="true" />}

                      {tabClosable && (
                        <button
                          type="button"
                          tabIndex={-1}
                          className="j-tab-strip__search-close"
                          aria-label={`Close ${tabTitle}`}
                          onClick={(e: ReactMouseEvent) => {
                            e.stopPropagation();
                            closeTab(tab);
                          }}
                        >
                          <Icon name="x" size="xs" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="j-tab-strip__search-empty">No matching open tabs</div>
            )}
          </div>
        </>
      )}

      <div className="j-tab-strip__viewport">
        <div
          className="j-tab-strip__scroller"
          role="tablist"
          aria-orientation="horizontal"
          aria-label={resolvedAriaLabel}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const tabTitle = getTabTitle(tab);
            const tabClosable = isTabClosable(tab);
            const ind = resolveIndicator(tab.indicator);

            return (
              <div
                id={`${baseId}-tab-${tab.id}`}
                key={tab.id}
                className="j-tab-strip__tab"
                role="tab"
                tabIndex={tab.id === firstFocusableId ? 0 : -1}
                aria-selected={isActive}
                aria-disabled={tab.disabled || undefined}
                aria-label={tab.pinned ? tabTitle : undefined}
                aria-keyshortcuts={tabClosable ? 'Delete' : undefined}
                data-tab-id={tab.id}
                data-title={tabTitle}
                data-description={tab.description || undefined}
                data-active={flag(isActive)}
                data-pinned={flag(tab.pinned)}
                data-preview={flag(tab.preview)}
                data-dirty={flag(tab.dirty)}
                data-loading={flag(tab.loading)}
                data-closable={tabClosable ? 'true' : 'false'}
                title={tab.description ? undefined : tabTitle}
              >
                <div className="j-tab-strip__tab-surface">
                  {renderTabMedia(tab)}

                  <span className="j-tab-strip__title">{tabTitle}</span>

                  {ind && (
                    <span
                      className="j-tab-strip__indicator"
                      data-tone={ind.tone}
                      data-indicator-color={ind.color}
                      aria-hidden="true"
                    />
                  )}

                  {(tab.dirty || tabClosable) && (
                    <span className="j-tab-strip__tail">
                      {tab.dirty && <span className="j-tab-strip__dirty" aria-hidden="true" />}
                      {tabClosable && (
                        <button
                          type="button"
                          tabIndex={-1}
                          className="j-tab-strip__close"
                          aria-label={`Close ${tabTitle}`}
                          onClick={(e: ReactMouseEvent) => {
                            e.stopPropagation();
                            closeTab(tab);
                          }}
                        >
                          <Icon name="x" size="xs" />
                        </button>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {addable && (
        <button
          type="button"
          className="j-tab-strip__new-btn"
          aria-label={newTabLabel}
          title={newTabLabel}
          onClick={() => handleNewTab(undefined)}
        >
          <Icon name="plus" size="sm" />
        </button>
      )}

      <div className="j-tab-strip__spacer" aria-hidden="true" />

      {end != null && <div className="j-tab-strip__end">{end}</div>}

      <div
        className="j-hover-card j-tab-strip__preview-card"
        popover="manual"
        data-side="bottom"
        data-align="start"
        role="tooltip"
      >
        <div className="j-tab-strip__preview-title" />
        <div className="j-tab-strip__preview-desc" />
      </div>

      {contextMenu && (
        <div
          id={ctxMenuId}
          ref={ctxMenuRef}
          className="j-menu"
          popover="auto"
          role="menu"
        >
          {contextTab && (
            <>
              <button
                type="button"
                className="j-menu__item"
                role="menuitem"
                onClick={() => handleNewTab(contextTab.id)}
              >
                <span>New tab to the right</span>
              </button>

              {renderContextMenu?.({ tab: contextTab, close: closeContextMenu })}

              <hr className="j-menu__separator" role="separator" />

              <button
                type="button"
                className="j-menu__item"
                role="menuitem"
                disabled={!isTabClosable(contextTab) ? true : undefined}
                aria-disabled={!isTabClosable(contextTab) || undefined}
                onClick={() => closeTab(contextTab)}
              >
                <span>Close</span>
              </button>

              <button
                type="button"
                className="j-menu__item"
                role="menuitem"
                disabled={closableOtherTabs.length === 0 ? true : undefined}
                aria-disabled={closableOtherTabs.length === 0 || undefined}
                onClick={() => handleCloseOthers(contextTab)}
              >
                <span>Close others</span>
              </button>

              <button
                type="button"
                className="j-menu__item"
                role="menuitem"
                disabled={closableRightTabs.length === 0 ? true : undefined}
                aria-disabled={closableRightTabs.length === 0 || undefined}
                onClick={() => handleCloseRight(contextTab)}
              >
                <span>Close tabs to the right</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
