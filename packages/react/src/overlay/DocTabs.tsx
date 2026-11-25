/// <reference path="./core.d.ts" />
/// <reference path="./doc-tabs-core.d.ts" />
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import {
  createDocTabs,
  getDocTabElements,
  type DocTabsController,
  type DocTabsOverflowState,
} from 'jenni-core/behaviors/doc-tabs.js';
import { createMenu } from 'jenni-core/behaviors/menu.js';
import { Icon } from '../display/Icon';
import { cx, flag, useControllable } from './types';

export type DocTabsVariant = 'workbench' | 'island' | 'minimal';
export type DocTabsSize = 'sm' | 'md';

export interface DocTabItem {
  id: string;
  label: string;
  icon?: string | ReactNode;
  dirty?: boolean;
  pinned?: boolean;
  closable?: boolean;
  disabled?: boolean;
  badge?: string | number;
  tooltip?: string;
  meta?: unknown;
}

export interface DocTabRenderState {
  active: boolean;
  index: number;
  closable: boolean;
  close: (event?: ReactMouseEvent) => void;
}

export interface DocTabsHandle {
  scrollToTab: (id: string, instant?: boolean) => void;
  focusActiveTab: () => void;
  scrollActiveIntoView: (instant?: boolean) => void;
  sync: () => void;
  readonly el: HTMLDivElement | null;
}

export interface DocTabsProps extends Omit<ComponentProps<'div'>, 'children' | 'ref'> {
  tabs: DocTabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  onTabsChange?: (nextTabs: DocTabItem[]) => void;
  onTabClose?: (id: string, tab: DocTabItem) => void;
  onTabAdd?: () => void;
  onTabReorder?: (nextTabs: DocTabItem[], fromIndex: number, toIndex: number) => void;
  onTabContextMenu?: (tab: DocTabItem, event: ReactMouseEvent<HTMLDivElement>) => void;
  variant?: DocTabsVariant;
  size?: DocTabsSize;
  closable?: boolean;
  closablePinned?: boolean;
  addable?: boolean;
  reorderable?: boolean;
  middleClickClose?: boolean;
  showOverflowMenu?: boolean;
  /** Suppress the automatic trailing dirty dot and `×` close button when rendering custom `renderTab` content. */
  hideTabTail?: boolean;
  addLabel?: string;
  overflowLabel?: string;
  renderIcon?: (tab: DocTabItem) => ReactNode;
  renderLabel?: (tab: DocTabItem, state: DocTabRenderState) => ReactNode;
  renderTab?: (tab: DocTabItem, state: DocTabRenderState) => ReactNode;
  actions?: ReactNode;
  empty?: ReactNode;
  ref?: Ref<DocTabsHandle>;
  handleRef?: Ref<DocTabsHandle>;
}

export function DocTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  onTabsChange,
  onTabClose,
  onTabAdd,
  onTabReorder,
  onTabContextMenu,
  variant = 'workbench',
  size = 'md',
  closable = true,
  closablePinned = false,
  addable = false,
  reorderable = false,
  middleClickClose = true,
  showOverflowMenu = true,
  hideTabTail = false,
  'aria-label': ariaLabel = 'Open documents',
  addLabel = 'New tab',
  overflowLabel = 'More tabs',
  renderIcon,
  renderLabel,
  renderTab,
  actions,
  empty,
  handleRef,
  className,
  ref,
  ...rest
}: DocTabsProps) {
  const baseId = useId();
  const overflowMenuId = `${baseId}-overflow`;

  const initialFallback = defaultValue ?? tabs.find((t) => !t.disabled)?.id ?? '';
  const [activeId, setActiveId] = useControllable(value, initialFallback, onValueChange);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<DocTabsController | null>(null);
  const overflowBtnRef = useRef<HTMLButtonElement | null>(null);
  const overflowMenuRef = useRef<HTMLDivElement | null>(null);

  const [overflowState, setOverflowState] = useState<DocTabsOverflowState>({
    hasOverflow: false,
    overflowStart: false,
    overflowEnd: false,
    hiddenCount: 0,
  });

  const isTabClosable = useCallback(
    (tab: DocTabItem): boolean => {
      if (tab.disabled) return false;
      if (tab.pinned) return Boolean(closablePinned && tab.closable !== false);
      return tab.closable ?? closable;
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

  const closeTab = useCallback(
    (tab: DocTabItem) => {
      if (!isTabClosable(tab)) return;
      const closedIndex = tabs.findIndex((t) => t.id === tab.id);
      onTabClose?.(tab.id, tab);

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
    [isTabClosable, tabs, onTabClose, onTabsChange, activeId, setActiveId],
  );

  const reorderTabs = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= tabs.length ||
        toIndex >= tabs.length ||
        fromIndex === toIndex
      ) {
        return;
      }
      const nextTabs = [...tabs];
      const [moved] = nextTabs.splice(fromIndex, 1);
      if (!moved) return;
      nextTabs.splice(toIndex, 0, moved);
      onTabsChange?.(nextTabs);
      onTabReorder?.(nextTabs, fromIndex, toIndex);
    },
    [tabs, onTabsChange, onTabReorder],
  );

  const callbacksRef = useRef({ selectTabById, closeTab, reorderTabs, tabs });
  callbacksRef.current = { selectTabById, closeTab, reorderTabs, tabs };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctrl = createDocTabs(root, {
      reorderable,
      middleClickClose,
      onSelect: (id) => callbacksRef.current.selectTabById(id),
      onClose: (id) => {
        const tab = callbacksRef.current.tabs.find((t) => t.id === id);
        if (tab) callbacksRef.current.closeTab(tab);
      },
      onReorder: (from, to) => callbacksRef.current.reorderTabs(from, to),
      onOverflowChange: (next) => setOverflowState(next),
    });
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, [reorderable, middleClickClose]);

  useEffect(() => {
    ctrlRef.current?.sync();
  }, [tabs.length]);

  useEffect(() => {
    ctrlRef.current?.scrollActiveIntoView();
  }, [activeId]);

  const showOverflowTrigger = showOverflowMenu && overflowState.hasOverflow && tabs.length > 0;

  useEffect(() => {
    if (!showOverflowTrigger) return;
    const btn = overflowBtnRef.current;
    const menu = overflowMenuRef.current;
    if (!btn || !menu) return;
    return createMenu(btn, menu, { side: 'bottom', loop: true, manageChecked: false });
  }, [showOverflowTrigger]);

  const scrollToTab = useCallback((id: string, instant = false) => {
    const scroller = rootRef.current?.querySelector<HTMLElement>(
      ':scope > .j-doc-tabs__scroller, :scope > [role="tablist"]',
    );
    if (!scroller) return;
    const target = getDocTabElements(scroller).find((t) => t.dataset.tabId === id);
    if (!target) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: instant || reduced ? 'auto' : 'smooth',
    });
    ctrlRef.current?.sync();
  }, []);

  const focusActiveTab = useCallback(() => {
    const scroller = rootRef.current?.querySelector<HTMLElement>(
      ':scope > .j-doc-tabs__scroller, :scope > [role="tablist"]',
    );
    if (!scroller) return;
    const tabEls = getDocTabElements(scroller);
    const target =
      tabEls.find(
        (t) => t.getAttribute('aria-selected') === 'true' || t.hasAttribute('data-active'),
      ) ?? tabEls.find((t) => t.getAttribute('aria-disabled') !== 'true');
    target?.focus();
    ctrlRef.current?.scrollActiveIntoView();
  }, []);

  const buildHandle = useCallback(
    (): DocTabsHandle => ({
      scrollToTab,
      focusActiveTab,
      scrollActiveIntoView: (instant?: boolean) => ctrlRef.current?.scrollActiveIntoView(instant),
      sync: () => ctrlRef.current?.sync(),
      get el() {
        return rootRef.current;
      },
    }),
    [scrollToTab, focusActiveTab],
  );

  useImperativeHandle(ref, buildHandle, [buildHandle]);
  useImperativeHandle(handleRef, buildHandle, [buildHandle]);

  const firstFocusableId = useMemo(() => {
    const active = tabs.find((t) => t.id === activeId && !t.disabled);
    if (active) return active.id;
    return tabs.find((t) => !t.disabled)?.id;
  }, [tabs, activeId]);

  const showActionsCluster = addable || showOverflowTrigger || actions != null;

  const handleOverflowPick = (tab: DocTabItem) => {
    if (tab.disabled) return;
    selectTabById(tab.id);
    if (overflowMenuRef.current?.matches(':popover-open')) {
      try {
        overflowMenuRef.current.hidePopover();
      } catch {
        /* ignore */
      }
    }
    setTimeout(() => ctrlRef.current?.scrollActiveIntoView(), 0);
  };

  return (
    <div
      {...rest}
      ref={rootRef}
      className={cx('j-doc-tabs', className)}
      data-variant={variant === 'workbench' ? undefined : variant}
      data-size={size === 'md' ? undefined : size}
      data-reorderable={flag(reorderable)}
    >
      <div
        className="j-doc-tabs__scroller"
        role="tablist"
        aria-orientation="horizontal"
        aria-label={ariaLabel}
      >
        {tabs.length > 0 ? (
          tabs.map((tab, index) => {
            const active = tab.id === activeId;
            const tabClosable = isTabClosable(tab);
            const handleClose = (e?: ReactMouseEvent) => {
              e?.stopPropagation();
              closeTab(tab);
            };
            const tabState: DocTabRenderState = {
              active,
              index,
              closable: tabClosable,
              close: handleClose,
            };
            const iconContent = renderIcon
              ? renderIcon(tab)
              : typeof tab.icon === 'string'
                ? <Icon name={tab.icon} size="sm" />
                : tab.icon;

            return (
              <div
                id={`${baseId}-tab-${tab.id}`}
                key={tab.id}
                className="j-doc-tabs__tab"
                role="tab"
                tabIndex={tab.id === firstFocusableId ? 0 : -1}
                aria-selected={active}
                aria-disabled={tab.disabled || undefined}
                aria-keyshortcuts={tabClosable ? 'Delete' : undefined}
                data-tab-id={tab.id}
                data-active={flag(active)}
                data-pinned={flag(tab.pinned)}
                data-dirty={flag(tab.dirty)}
                data-closable={tabClosable ? 'true' : 'false'}
                draggable={reorderable && !tab.disabled ? true : undefined}
                title={tab.tooltip ?? tab.label}
                onClick={() => {
                  if (!tab.disabled) selectTabById(tab.id);
                }}
                onContextMenu={(e) => onTabContextMenu?.(tab, e)}
              >
                {renderTab ? (
                  renderTab(tab, tabState)
                ) : (
                  <>
                    {tab.pinned && (
                      <span className="j-doc-tabs__pin" aria-hidden="true">
                        <Icon name="pin" size="xs" />
                      </span>
                    )}

                    {iconContent != null && (
                      <span className="j-doc-tabs__icon" aria-hidden="true">
                        {iconContent}
                      </span>
                    )}

                    <span className="j-doc-tabs__label">
                      {renderLabel ? renderLabel(tab, tabState) : tab.label}
                    </span>

                    {tab.badge != null && <span className="j-doc-tabs__badge">{tab.badge}</span>}
                  </>
                )}

                {!hideTabTail && (tab.dirty || tabClosable) && (
                  <span className="j-doc-tabs__tail">
                    {tab.dirty && <span className="j-doc-tabs__dirty" aria-hidden="true" />}
                    {tabClosable && (
                      <button
                        type="button"
                        tabIndex={-1}
                        className="j-doc-tabs__close"
                        aria-label={`Close ${tab.label}`}
                        onClick={handleClose}
                      >
                        <Icon name="x" size="xs" />
                      </button>
                    )}
                  </span>
                )}
              </div>
            );
          })
        ) : empty != null ? (
          <div className="j-doc-tabs__empty">{empty}</div>
        ) : null}
      </div>

      {showActionsCluster && (
        <div className="j-doc-tabs__actions">
          {addable && (
            <button
              type="button"
              className="j-doc-tabs__add"
              aria-label={addLabel}
              title={addLabel}
              onClick={() => onTabAdd?.()}
            >
              <Icon name="plus" size="sm" />
            </button>
          )}

          {showOverflowTrigger && (
            <>
              <button
                ref={overflowBtnRef}
                type="button"
                className="j-doc-tabs__overflow-btn"
                aria-label={overflowLabel}
                title={overflowLabel}
              >
                <Icon name="chevron-down" size="sm" />
                {overflowState.hiddenCount > 0 && (
                  <span className="j-doc-tabs__overflow-count">{overflowState.hiddenCount}</span>
                )}
              </button>

              <div
                id={overflowMenuId}
                ref={overflowMenuRef}
                className="j-menu"
                popover="auto"
                role="menu"
                data-align="end"
              >
                {tabs.map((tab) => (
                  <button
                    key={`ov-${tab.id}`}
                    type="button"
                    className="j-menu__item"
                    role="menuitemradio"
                    aria-checked={tab.id === activeId}
                    disabled={tab.disabled ? true : undefined}
                    aria-disabled={tab.disabled || undefined}
                    onClick={() => handleOverflowPick(tab)}
                  >
                    {typeof tab.icon === 'string' ? (
                      <Icon name={tab.icon} size="sm" className="j-menu__icon" />
                    ) : (
                      tab.icon
                    )}
                    <span>{tab.label}</span>
                    {tab.dirty && <span className="j-doc-tabs__dirty" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {actions}
        </div>
      )}
    </div>
  );
}
