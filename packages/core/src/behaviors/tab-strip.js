// Chrome-style Tab Strip behavior — pointerdown activation, middle-click close,
// double-click, WAI-ARIA roving tabindex + Delete close, horizontal wheel scroll,
// dynamic scroll-edge fade attributes (`data-can-scroll-start` / `data-can-scroll-end`),
// pointer & HTML5 drag-to-reorder, >36px vertical out-of-strip detach, and
// ~380ms anchored `.j-hover-card` tab preview cards.

import { trackAnchor } from './anchor.js';

const EPSILON = 1;
const DRAG_THRESHOLD_PX = 5;
const DETACH_THRESHOLD_PX = 36;
const DEFAULT_PREVIEW_DELAY = 380;
const DEFAULT_PREVIEW_CLOSE_DELAY = 120;

/**
 * @typedef {Object} TabStripScrollState
 * @property {boolean} hasOverflow
 * @property {boolean} canScrollStart
 * @property {boolean} canScrollEnd
 */

/**
 * @typedef {Object} TabStripReorderDetail
 * @property {number} from
 * @property {number} to
 */

/**
 * @typedef {Object} TabStripDetachDetail
 * @property {string} id
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} TabStripOptions
 * @property {boolean} [draggable]
 * @property {boolean} [detachable]
 * @property {boolean} [middleClickClose]
 * @property {'automatic' | 'manual'} [activation]
 * @property {number} [previewDelay]
 * @property {(id: string, tab: HTMLElement) => void} [onSelect]
 * @property {(id: string, tab: HTMLElement) => void} [onClose]
 * @property {(id: string, tab: HTMLElement) => void} [onDoubleClick]
 * @property {(detail: TabStripReorderDetail) => void} [onReorder]
 * @property {(detail: TabStripDetachDetail) => void} [onDetach]
 * @property {(id: string, tab: HTMLElement, event: MouseEvent | KeyboardEvent) => void} [onTabContextMenu]
 * @property {(state: TabStripScrollState) => void} [onScrollStateChange]
 */

/**
 * @typedef {Object} TabStripController
 * @property {() => TabStripScrollState} getScrollState
 * @property {() => void} sync
 * @property {(instant?: boolean) => void} scrollActiveIntoView
 * @property {(id: string, instant?: boolean) => void} scrollToTab
 * @property {() => void} hidePreview
 * @property {() => void} destroy
 */

/** @param {Element} el */
const isDisabled = (el) =>
  el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/** @param {HTMLElement} tab */
const readTabId = (tab) => tab.dataset.tabId ?? tab.dataset.value ?? tab.id ?? '';

/** @param {HTMLElement} tab */
function isClosableTab(tab) {
  if (isDisabled(tab)) return false;
  if (tab.dataset.closable === 'false') return false;
  if (tab.dataset.closable === 'true') return true;
  if (tab.hasAttribute('data-pinned')) return false;
  return Boolean(tab.querySelector('.j-tab-strip__close')) || tab.hasAttribute('data-closable');
}

/**
 * Toggle a boolean data attribute without redundant DOM mutations.
 * @param {HTMLElement} el
 * @param {string} attr
 * @param {boolean} active
 */
function syncAttr(el, attr, active) {
  if (active) {
    if (!el.hasAttribute(attr)) el.setAttribute(attr, '');
  } else if (el.hasAttribute(attr)) {
    el.removeAttribute(attr);
  }
}

/**
 * Return direct `[role="tab"]` elements inside `scroller`.
 * @param {HTMLElement} scroller
 * @returns {HTMLElement[]}
 */
export function getTabStripElements(scroller) {
  return /** @type {HTMLElement[]} */ (
    [...scroller.querySelectorAll('[role="tab"]')].filter(
      (t) => t.closest('[role="tablist"], .j-tab-strip__scroller') === scroller,
    )
  );
}

/**
 * Sync custom CSS colors on `.j-tab-strip__indicator[data-indicator-color]` inside `root`.
 * @param {ParentNode} root
 */
function syncIndicatorColors(root) {
  root.querySelectorAll('.j-tab-strip__indicator').forEach((node) => {
    const el = /** @type {HTMLElement} */ (node);
    const customColor = el.dataset.indicatorColor;
    if (customColor) {
      el.style.setProperty('--_ind-color', customColor);
    } else {
      el.style.removeProperty('--_ind-color');
    }
  });
}

/**
 * Wire a `.j-tab-strip` root element.
 * @param {HTMLElement} root
 * @param {TabStripOptions} [options]
 * @returns {TabStripController}
 */
export function createTabStrip(root, options = {}) {
  const scroller = /** @type {HTMLElement | null} */ (
    root.querySelector('.j-tab-strip__scroller, [role="tablist"]')
  );
  const previewCard = /** @type {HTMLElement | null} */ (
    root.querySelector(':scope > .j-tab-strip__preview-card')
  );

  /** @type {TabStripScrollState} */
  let scrollState = {
    hasOverflow: false,
    canScrollStart: false,
    canScrollEnd: false,
  };

  if (!scroller) {
    return {
      getScrollState: () => scrollState,
      sync: () => {},
      scrollActiveIntoView: () => {},
      scrollToTab: () => {},
      hidePreview: () => {},
      destroy: () => {},
    };
  }

  /** @type {number | null} */
  let rafId = null;
  let htmlDragFromIndex = -1;

  /**
   * @type {null | {
   *   tab: HTMLElement,
   *   id: string,
   *   fromIndex: number,
   *   pointerId: number,
   *   startX: number,
   *   startY: number,
   *   dragging: boolean,
   *   detaching: boolean,
   * }}
   */
  let pointerState = null;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let previewTimer;
  /** @type {null | (() => void)} */
  let stopPreviewAnchor = null;
  /** @type {HTMLElement | null} */
  let previewTab = null;

  const isDraggable = () => options.draggable ?? root.hasAttribute('data-draggable');
  const isDetachable = () => options.detachable ?? root.hasAttribute('data-detachable');
  const allowMiddleClose = () => options.middleClickClose ?? true;
  const isManual = () => (options.activation ?? root.dataset.activation) === 'manual';
  const getPreviewDelay = () => options.previewDelay ?? DEFAULT_PREVIEW_DELAY;

  const hidePreview = () => {
    clearTimeout(previewTimer);
    previewTab = null;
    stopPreviewAnchor?.();
    stopPreviewAnchor = null;
    if (previewCard && typeof previewCard.matches === 'function' && previewCard.matches(':popover-open')) {
      try {
        previewCard.hidePopover();
      } catch {
        /* ignore */
      }
    }
  };

  /** @param {HTMLElement} tab */
  const showPreviewForTab = (tab) => {
    if (!previewCard || pointerState?.dragging) return;
    const desc = (tab.dataset.description || '').trim();
    if (!desc) {
      hidePreview();
      return;
    }
    const title = (tab.dataset.title || tab.getAttribute('aria-label') || tab.textContent || '').trim();
    const titleEl = previewCard.querySelector('.j-tab-strip__preview-title');
    const descEl = previewCard.querySelector('.j-tab-strip__preview-desc');
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    stopPreviewAnchor?.();
    stopPreviewAnchor = trackAnchor(tab, previewCard, { side: 'bottom' });
    previewTab = tab;

    if (!previewCard.matches(':popover-open')) {
      try {
        previewCard.showPopover();
      } catch {
        stopPreviewAnchor?.();
        stopPreviewAnchor = null;
      }
    }
  };

  /** @param {HTMLElement} tab */
  const schedulePreview = (tab) => {
    if (!previewCard || pointerState?.dragging) return;
    const desc = (tab.dataset.description || '').trim();
    if (!desc) {
      hidePreview();
      return;
    }
    clearTimeout(previewTimer);
    const warmOpen = previewCard.matches(':popover-open');
    previewTimer = setTimeout(
      () => showPreviewForTab(tab),
      warmOpen ? 90 : getPreviewDelay(),
    );
  };

  const scheduleHidePreview = () => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      hidePreview();
    }, DEFAULT_PREVIEW_CLOSE_DELAY);
  };

  const syncRovingTabIndex = () => {
    const tabs = getTabStripElements(scroller);
    if (tabs.length === 0) return;
    const focused =
      typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
        ? tabs.find((t) => t === document.activeElement && !isDisabled(t))
        : undefined;
    const selected = tabs.find(
      (t) =>
        (t.getAttribute('aria-selected') === 'true' || t.hasAttribute('data-active')) &&
        !isDisabled(t),
    );
    const primary = focused ?? selected ?? tabs.find((t) => !isDisabled(t));
    tabs.forEach((t) => {
      const nextIdx = t === primary ? 0 : -1;
      if (t.tabIndex !== nextIdx) t.tabIndex = nextIdx;
    });
  };

  const measureOverflow = () => {
    syncIndicatorColors(root);
    syncRovingTabIndex();

    const scrollLeft = Math.abs(scroller.scrollLeft);
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const hasOverflow = maxScroll > EPSILON;
    const canScrollStart = hasOverflow && scrollLeft > EPSILON;
    const canScrollEnd = hasOverflow && scrollLeft < maxScroll - EPSILON;

    syncAttr(root, 'data-has-overflow', hasOverflow);
    syncAttr(root, 'data-can-scroll-start', canScrollStart);
    syncAttr(root, 'data-can-scroll-end', canScrollEnd);

    if (
      scrollState.hasOverflow !== hasOverflow ||
      scrollState.canScrollStart !== canScrollStart ||
      scrollState.canScrollEnd !== canScrollEnd
    ) {
      scrollState = { hasOverflow, canScrollStart, canScrollEnd };
      options.onScrollStateChange?.(scrollState);
    }
  };

  const scheduleSync = () => {
    if (rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
    }
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measureOverflow();
      });
    } else {
      measureOverflow();
    }
  };

  /**
   * Scroll a specific tab into the visible horizontal scroller viewport.
   * @param {string} id
   * @param {boolean} [instant]
   */
  const scrollToTab = (id, instant = false) => {
    const target = getTabStripElements(scroller).find((t) => readTabId(t) === id);
    if (!target || typeof target.scrollIntoView !== 'function') return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: instant || reduced ? 'auto' : 'smooth',
    });
    scheduleSync();
  };

  /**
   * Scroll the active tab into the visible horizontal scroller viewport.
   * @param {boolean} [instant]
   */
  const scrollActiveIntoView = (instant = false) => {
    const active = getTabStripElements(scroller).find(
      (t) => t.getAttribute('aria-selected') === 'true' || t.hasAttribute('data-active'),
    );
    if (!active) return;
    scrollToTab(readTabId(active), instant);
  };

  /** @param {HTMLElement} tab */
  const triggerSelect = (tab) => {
    if (isDisabled(tab)) return;
    const id = readTabId(tab);
    options.onSelect?.(id, tab);
    root.dispatchEvent(
      new CustomEvent('j-change', { bubbles: true, detail: { value: id, tab } }),
    );
  };

  /** @param {HTMLElement} tab */
  const triggerClose = (tab) => {
    if (!isClosableTab(tab)) return;
    hidePreview();
    const id = readTabId(tab);
    options.onClose?.(id, tab);
    root.dispatchEvent(
      new CustomEvent('j-close', { bubbles: true, detail: { value: id, tab } }),
    );
  };

  const clearDropIndicators = () => {
    getTabStripElements(scroller).forEach((t) => {
      t.removeAttribute('data-drop-before');
      t.removeAttribute('data-drop-after');
    });
  };

  const clearAllDragVisuals = () => {
    htmlDragFromIndex = -1;
    root.removeAttribute('data-is-dragging');
    root.removeAttribute('data-detaching');
    getTabStripElements(scroller).forEach((t) => {
      t.removeAttribute('data-dragging');
      t.removeAttribute('data-detach-ready');
      t.removeAttribute('data-drop-before');
      t.removeAttribute('data-drop-after');
    });
  };

  /**
   * Compute drop target tab and insertion index for `clientX` among same-pin-group tabs.
   * @param {HTMLElement} draggedTab
   * @param {number} fromIndex
   * @param {number} clientX
   * @returns {{ overTab: HTMLElement | null, before: boolean, toIndex: number }}
   */
  const computeDropPosition = (draggedTab, fromIndex, clientX) => {
    const tabs = getTabStripElements(scroller);
    const draggedPinned = draggedTab.hasAttribute('data-pinned');
    /** @type {HTMLElement | null} */
    let matchedTab = null;
    let matchedBefore = false;

    for (let i = 0; i < tabs.length; i += 1) {
      const candidate = tabs[i];
      if (candidate.hasAttribute('data-pinned') !== draggedPinned) continue;
      const rect = candidate.getBoundingClientRect();
      if (clientX <= rect.left + rect.width / 2) {
        matchedTab = candidate;
        matchedBefore = true;
        break;
      }
      matchedTab = candidate;
      matchedBefore = false;
    }

    if (!matchedTab) {
      return { overTab: null, before: false, toIndex: fromIndex };
    }
    const overIndex = tabs.indexOf(matchedTab);
    const insertPos = matchedBefore ? overIndex : overIndex + 1;
    const toIndex = fromIndex < insertPos ? insertPos - 1 : insertPos;
    return { overTab: matchedTab, before: matchedBefore, toIndex };
  };

  /** @param {PointerEvent} e */
  const onPointerMove = (e) => {
    if (!pointerState || e.pointerId !== pointerState.pointerId) return;
    const dx = e.clientX - pointerState.startX;
    const dy = e.clientY - pointerState.startY;

    if (!pointerState.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      pointerState.dragging = true;
      hidePreview();
      pointerState.tab.setAttribute('data-dragging', '');
      root.setAttribute('data-is-dragging', '');
      try {
        pointerState.tab.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore synthetic pointer events without active pointerId */
      }
    }

    const stripRect = root.getBoundingClientRect();
    const outVertical =
      e.clientY < stripRect.top - DETACH_THRESHOLD_PX ||
      e.clientY > stripRect.bottom + DETACH_THRESHOLD_PX;

    if (isDetachable() && outVertical) {
      pointerState.detaching = true;
      pointerState.tab.setAttribute('data-detach-ready', '');
      root.setAttribute('data-detaching', '');
      clearDropIndicators();
      return;
    }

    pointerState.detaching = false;
    pointerState.tab.removeAttribute('data-detach-ready');
    root.removeAttribute('data-detaching');

    if (isDraggable()) {
      const scrollerRect = scroller.getBoundingClientRect();
      const edgeZone = 28;
      if (e.clientX < scrollerRect.left + edgeZone) {
        scroller.scrollLeft -= 8;
      } else if (e.clientX > scrollerRect.right - edgeZone) {
        scroller.scrollLeft += 8;
      }

      clearDropIndicators();
      const { overTab, before, toIndex } = computeDropPosition(
        pointerState.tab,
        pointerState.fromIndex,
        e.clientX,
      );
      if (overTab && toIndex !== pointerState.fromIndex) {
        overTab.setAttribute(before ? 'data-drop-before' : 'data-drop-after', '');
      }
    }
  };

  /** @param {PointerEvent} e */
  const finishPointerGesture = (e, cancelled = false) => {
    if (!pointerState || e.pointerId !== pointerState.pointerId) return;
    const state = pointerState;
    pointerState = null;

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    }

    try {
      if (state.tab.hasPointerCapture?.(e.pointerId)) {
        state.tab.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }

    if (!state.dragging || cancelled) {
      clearAllDragVisuals();
      return;
    }

    const stripRect = root.getBoundingClientRect();
    const outVertical =
      e.clientY < stripRect.top - DETACH_THRESHOLD_PX ||
      e.clientY > stripRect.bottom + DETACH_THRESHOLD_PX;

    if (isDetachable() && outVertical) {
      clearAllDragVisuals();
      const detail = {
        id: state.id,
        x: Math.round(e.clientX),
        y: Math.round(e.clientY),
      };
      options.onDetach?.(detail);
      root.dispatchEvent(new CustomEvent('j-detach', { bubbles: true, detail }));
      return;
    }

    if (isDraggable()) {
      const tabs = getTabStripElements(scroller);
      const { toIndex } = computeDropPosition(state.tab, state.fromIndex, e.clientX);
      clearAllDragVisuals();
      if (
        toIndex !== state.fromIndex &&
        toIndex >= 0 &&
        toIndex < tabs.length
      ) {
        const detail = { from: state.fromIndex, to: toIndex };
        options.onReorder?.(detail);
        root.dispatchEvent(new CustomEvent('j-reorder', { bubbles: true, detail }));
      }
      return;
    }

    clearAllDragVisuals();
  };

  /** @param {PointerEvent} e */
  function onPointerUp(e) {
    finishPointerGesture(e, false);
  }

  /** @param {PointerEvent} e */
  function onPointerCancel(e) {
    finishPointerGesture(e, true);
  }

  /** @param {PointerEvent} e */
  const onPointerDown = (e) => {
    hidePreview();
    if (e.button !== 0) return;
    // Ignore macOS Ctrl+Click context-menu gesture on mouse pointers
    if (e.ctrlKey && e.pointerType === 'mouse') return;

    const target = /** @type {Element | null} */ (e.target);
    if (!target || target.closest('.j-tab-strip__close')) return;

    const tab = /** @type {HTMLElement | null} */ (target.closest('[role="tab"]'));
    if (!tab || !scroller.contains(tab) || isDisabled(tab)) return;

    // Activate immediately on primary pointerdown
    triggerSelect(tab);

    if (isDraggable() || isDetachable()) {
      const tabs = getTabStripElements(scroller);
      const fromIndex = tabs.indexOf(tab);
      if (fromIndex >= 0 && typeof window !== 'undefined') {
        pointerState = {
          tab,
          id: readTabId(tab),
          fromIndex,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          dragging: false,
          detaching: false,
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
      }
    }
  };

  /** @param {MouseEvent} e */
  const onMouseDown = (e) => {
    if (e.button !== 1 || !allowMiddleClose()) return;
    const target = /** @type {Element | null} */ (e.target);
    const tab = /** @type {HTMLElement | null} */ (target?.closest('[role="tab"]') ?? null);
    if (tab && scroller.contains(tab) && isClosableTab(tab)) {
      e.preventDefault();
    }
  };

  /** @param {MouseEvent} e */
  const onAuxClick = (e) => {
    if (e.button !== 1 || !allowMiddleClose()) return;
    const target = /** @type {Element | null} */ (e.target);
    const tab = /** @type {HTMLElement | null} */ (target?.closest('[role="tab"]') ?? null);
    if (!tab || !scroller.contains(tab) || !isClosableTab(tab)) return;
    e.preventDefault();
    triggerClose(tab);
  };

  /** @param {MouseEvent} e */
  const onDblClick = (e) => {
    const target = /** @type {Element | null} */ (e.target);
    if (!target || target.closest('.j-tab-strip__close')) return;
    const tab = /** @type {HTMLElement | null} */ (target.closest('[role="tab"]'));
    if (!tab || !scroller.contains(tab) || isDisabled(tab)) return;
    const id = readTabId(tab);
    options.onDoubleClick?.(id, tab);
    root.dispatchEvent(
      new CustomEvent('j-dblclick', { bubbles: true, detail: { value: id, tab } }),
    );
  };

  /** @param {MouseEvent} e */
  const onContextMenu = (e) => {
    const target = /** @type {Element | null} */ (e.target);
    const tab = /** @type {HTMLElement | null} */ (target?.closest('[role="tab"]') ?? null);
    if (!tab || !scroller.contains(tab) || isDisabled(tab)) return;
    hidePreview();
    options.onTabContextMenu?.(readTabId(tab), tab, e);
  };

  /** @param {WheelEvent} e */
  const onWheel = (e) => {
    if (Math.abs(e.deltaY) > 0 && Math.abs(e.deltaX) === 0) {
      if (scroller.scrollWidth > scroller.clientWidth + EPSILON) {
        e.preventDefault();
        scroller.scrollLeft += e.deltaY;
      }
    }
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    const target = /** @type {HTMLElement | null} */ (e.target);
    if (!target || target.closest('.j-tab-strip__close')) return;

    const tab = /** @type {HTMLElement | null} */ (target.closest('[role="tab"]'));
    if (!tab || !scroller.contains(tab)) return;

    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      if (!isDisabled(tab) && options.onTabContextMenu) {
        e.preventDefault();
        hidePreview();
        options.onTabContextMenu(readTabId(tab), tab, e);
      }
      return;
    }

    const enabledTabs = getTabStripElements(scroller).filter((t) => !isDisabled(t));
    const idx = enabledTabs.indexOf(tab);
    if (idx < 0) return;

    const rtl =
      typeof getComputedStyle === 'function' &&
      getComputedStyle(scroller).direction === 'rtl';
    const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (e.key === nextKey || e.key === prevKey || e.key === 'Home' || e.key === 'End') {
      /** @type {HTMLElement | undefined} */
      let nextTab;
      if (e.key === nextKey) nextTab = enabledTabs[(idx + 1) % enabledTabs.length];
      else if (e.key === prevKey) {
        nextTab = enabledTabs[(idx - 1 + enabledTabs.length) % enabledTabs.length];
      } else if (e.key === 'Home') nextTab = enabledTabs[0];
      else if (e.key === 'End') nextTab = enabledTabs[enabledTabs.length - 1];

      if (nextTab) {
        e.preventDefault();
        hidePreview();
        getTabStripElements(scroller).forEach((t) => {
          t.tabIndex = t === nextTab ? 0 : -1;
        });
        nextTab.focus();
        if (typeof nextTab.scrollIntoView === 'function') {
          nextTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        if (!isManual()) triggerSelect(nextTab);
      }
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      if (tab.tagName !== 'BUTTON') {
        e.preventDefault();
        triggerSelect(tab);
      }
      return;
    }

    if (e.key === 'Delete') {
      if (isClosableTab(tab)) {
        e.preventDefault();
        const fallback = enabledTabs[idx + 1] ?? enabledTabs[idx - 1];
        if (fallback) {
          fallback.tabIndex = 0;
          fallback.focus();
        }
        triggerClose(tab);
      }
    }
  };

  /** @param {PointerEvent} e */
  const onPointerOver = (e) => {
    if (e.pointerType === 'touch' || pointerState?.dragging) return;
    const target = /** @type {Element | null} */ (e.target);
    if (!target || target.closest('.j-tab-strip__close')) {
      scheduleHidePreview();
      return;
    }
    const tab = /** @type {HTMLElement | null} */ (target.closest('[role="tab"]'));
    if (!tab || !scroller.contains(tab)) {
      scheduleHidePreview();
      return;
    }
    if (tab === previewTab && previewCard?.matches(':popover-open')) {
      clearTimeout(previewTimer);
      return;
    }
    schedulePreview(tab);
  };

  /** @param {PointerEvent} e */
  const onPointerLeaveScroller = (e) => {
    if (e.pointerType === 'touch') return;
    scheduleHidePreview();
  };

  // HTML5 Drag-and-Drop fallback (suppressed when active pointer gesture is managing drag)
  /** @param {DragEvent} e */
  const onDragStart = (e) => {
    if (pointerState) {
      e.preventDefault();
      return;
    }
    if (!isDraggable()) return;
    const target = /** @type {Element | null} */ (e.target);
    if (target?.closest('.j-tab-strip__close')) {
      e.preventDefault();
      return;
    }
    const tab = /** @type {HTMLElement | null} */ (target?.closest('[role="tab"]') ?? null);
    if (!tab || !scroller.contains(tab) || isDisabled(tab)) return;
    const tabs = getTabStripElements(scroller);
    htmlDragFromIndex = tabs.indexOf(tab);
    if (htmlDragFromIndex < 0) return;

    hidePreview();
    tab.setAttribute('data-dragging', '');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', readTabId(tab));
      } catch {
        /* ignore */
      }
    }
  };

  /** @param {DragEvent} e */
  const onDragOver = (e) => {
    if (!isDraggable() || htmlDragFromIndex < 0) return;
    const tabs = getTabStripElements(scroller);
    const draggedTab = tabs[htmlDragFromIndex];
    if (!draggedTab) return;

    const { overTab, before, toIndex } = computeDropPosition(
      draggedTab,
      htmlDragFromIndex,
      e.clientX,
    );
    if (!overTab) return;

    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    clearDropIndicators();
    if (toIndex !== htmlDragFromIndex) {
      overTab.setAttribute(before ? 'data-drop-before' : 'data-drop-after', '');
    }
  };

  /** @param {DragEvent} e */
  const onDrop = (e) => {
    if (!isDraggable() || htmlDragFromIndex < 0) return;
    const tabs = getTabStripElements(scroller);
    const fromIndex = htmlDragFromIndex;
    const draggedTab = tabs[fromIndex];
    if (!draggedTab) {
      clearAllDragVisuals();
      return;
    }
    e.preventDefault();
    const { toIndex } = computeDropPosition(draggedTab, fromIndex, e.clientX);
    clearAllDragVisuals();
    if (toIndex !== fromIndex && toIndex >= 0 && toIndex < tabs.length) {
      const detail = { from: fromIndex, to: toIndex };
      options.onReorder?.(detail);
      root.dispatchEvent(new CustomEvent('j-reorder', { bubbles: true, detail }));
    }
  };

  const onDragEnd = () => {
    clearAllDragVisuals();
  };

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => scheduleSync())
      : null;
  ro?.observe(scroller);
  ro?.observe(root);

  const mo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;
  mo?.observe(scroller, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-selected', 'data-active', 'data-indicator-color'],
  });

  const onScroll = () => {
    hidePreview();
    scheduleSync();
  };

  scroller.addEventListener('pointerdown', onPointerDown);
  scroller.addEventListener('mousedown', onMouseDown);
  scroller.addEventListener('auxclick', onAuxClick);
  scroller.addEventListener('dblclick', onDblClick);
  scroller.addEventListener('contextmenu', onContextMenu);
  scroller.addEventListener('wheel', onWheel, { passive: false });
  scroller.addEventListener('scroll', onScroll, { passive: true });
  scroller.addEventListener('keydown', onKeyDown);
  scroller.addEventListener('pointerover', onPointerOver);
  scroller.addEventListener('pointerleave', onPointerLeaveScroller);
  scroller.addEventListener('dragstart', onDragStart);
  scroller.addEventListener('dragover', onDragOver);
  scroller.addEventListener('drop', onDrop);
  scroller.addEventListener('dragend', onDragEnd);

  measureOverflow();
  scrollActiveIntoView(true);

  return {
    getScrollState: () => scrollState,
    sync: measureOverflow,
    scrollActiveIntoView,
    scrollToTab,
    hidePreview,
    destroy: () => {
      if (rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
      }
      hidePreview();
      ro?.disconnect();
      mo?.disconnect();
      if (pointerState && typeof window !== 'undefined') {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        pointerState = null;
      }
      clearAllDragVisuals();
      scroller.removeEventListener('pointerdown', onPointerDown);
      scroller.removeEventListener('mousedown', onMouseDown);
      scroller.removeEventListener('auxclick', onAuxClick);
      scroller.removeEventListener('dblclick', onDblClick);
      scroller.removeEventListener('contextmenu', onContextMenu);
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('scroll', onScroll);
      scroller.removeEventListener('keydown', onKeyDown);
      scroller.removeEventListener('pointerover', onPointerOver);
      scroller.removeEventListener('pointerleave', onPointerLeaveScroller);
      scroller.removeEventListener('dragstart', onDragStart);
      scroller.removeEventListener('dragover', onDragOver);
      scroller.removeEventListener('drop', onDrop);
      scroller.removeEventListener('dragend', onDragEnd);
    },
  };
}

/** @type {WeakMap<HTMLElement, TabStripController>} */
const bound = new WeakMap();

/**
 * Init every `.j-tab-strip` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initTabStrips(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-tab-strip').forEach((el) => {
    const strip = /** @type {HTMLElement} */ (el);
    if (bound.has(strip)) return;
    bound.set(strip, createTabStrip(strip));
    made.push(strip);
  });
  return () => {
    made.forEach((el) => {
      bound.get(el)?.destroy();
      bound.delete(el);
    });
  };
}
