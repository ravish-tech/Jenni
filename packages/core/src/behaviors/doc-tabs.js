// Document Tabs behavior — horizontal wheel scrolling, overflow measurement,
// active-tab auto-scroll, WAI-ARIA tablist keyboard roving focus, Delete and
// middle-click close, and HTML5 drag-to-reorder.

const EPSILON = 1;

/**
 * @typedef {Object} DocTabsOverflowState
 * @property {boolean} hasOverflow
 * @property {boolean} overflowStart
 * @property {boolean} overflowEnd
 * @property {number} hiddenCount
 */

/**
 * @typedef {Object} DocTabsOptions
 * @property {boolean} [reorderable]
 * @property {boolean} [middleClickClose]
 * @property {'automatic' | 'manual'} [activation]
 * @property {(id: string, tab: HTMLElement) => void} [onSelect]
 * @property {(id: string, tab: HTMLElement) => void} [onClose]
 * @property {(fromIndex: number, toIndex: number) => void} [onReorder]
 * @property {(state: DocTabsOverflowState) => void} [onOverflowChange]
 */

/**
 * @typedef {Object} DocTabsController
 * @property {() => DocTabsOverflowState} getState
 * @property {() => void} sync
 * @property {(instant?: boolean) => void} scrollActiveIntoView
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
  return Boolean(tab.querySelector('.j-doc-tabs__close')) || tab.hasAttribute('data-closable');
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
 * Return direct tabs belonging to `scroller`.
 * @param {HTMLElement} scroller
 * @returns {HTMLElement[]}
 */
export function getDocTabElements(scroller) {
  return /** @type {HTMLElement[]} */ (
    [...scroller.querySelectorAll('[role="tab"]')].filter(
      (t) => t.closest('[role="tablist"], .j-doc-tabs__scroller') === scroller,
    )
  );
}

/**
 * Wire a `.j-doc-tabs` strip element.
 * @param {HTMLElement} root
 * @param {DocTabsOptions} [options]
 * @returns {DocTabsController}
 */
export function createDocTabs(root, options = {}) {
  const scroller = /** @type {HTMLElement | null} */ (
    root.querySelector(':scope > .j-doc-tabs__scroller, :scope > [role="tablist"]')
  );

  /** @type {DocTabsOverflowState} */
  let state = {
    hasOverflow: false,
    overflowStart: false,
    overflowEnd: false,
    hiddenCount: 0,
  };

  if (!scroller) {
    return {
      getState: () => state,
      sync: () => {},
      scrollActiveIntoView: () => {},
      destroy: () => {},
    };
  }

  /** @type {number | null} */
  let rafId = null;
  let dragFromIndex = -1;

  const isReorderable = () =>
    options.reorderable ?? root.hasAttribute('data-reorderable');
  const allowMiddleClose = () => options.middleClickClose ?? true;
  const isManual = () =>
    (options.activation ?? root.dataset.activation) === 'manual';

  const measureOverflow = () => {
    const scrollLeft = Math.abs(scroller.scrollLeft);
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const hasOverflow = maxScroll > EPSILON;
    const overflowStart = hasOverflow && scrollLeft > EPSILON;
    const overflowEnd = hasOverflow && scrollLeft < maxScroll - EPSILON;

    let hiddenCount = 0;
    if (hasOverflow) {
      const sr = scroller.getBoundingClientRect();
      const tabs = getDocTabElements(scroller);
      for (let i = 0; i < tabs.length; i += 1) {
        const tr = tabs[i].getBoundingClientRect();
        if (tr.left < sr.left - 4 || tr.right > sr.right + 4) {
          hiddenCount += 1;
        }
      }
    }

    syncAttr(root, 'data-has-overflow', hasOverflow);
    syncAttr(root, 'data-overflow-start', overflowStart);
    syncAttr(root, 'data-overflow-end', overflowEnd);

    if (
      state.hasOverflow !== hasOverflow ||
      state.overflowStart !== overflowStart ||
      state.overflowEnd !== overflowEnd ||
      state.hiddenCount !== hiddenCount
    ) {
      state = { hasOverflow, overflowStart, overflowEnd, hiddenCount };
      options.onOverflowChange?.(state);
    }
  };

  const scheduleSync = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      measureOverflow();
    });
  };

  /**
   * Scroll the active tab into the visible horizontal scroller viewport.
   * @param {boolean} [instant]
   */
  const scrollActiveIntoView = (instant = false) => {
    const active = getDocTabElements(scroller).find(
      (t) => t.getAttribute('aria-selected') === 'true' || t.hasAttribute('data-active'),
    );
    if (!active) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    active.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: instant || reduced ? 'auto' : 'smooth',
    });
    scheduleSync();
  };

  /**
   * Trigger tab selection via callback and custom event.
   * @param {HTMLElement} tab
   */
  const triggerSelect = (tab) => {
    if (isDisabled(tab)) return;
    const id = readTabId(tab);
    options.onSelect?.(id, tab);
    root.dispatchEvent(
      new CustomEvent('j-change', { bubbles: true, detail: { value: id, tab } }),
    );
  };

  /**
   * Trigger tab close via callback and custom event.
   * @param {HTMLElement} tab
   */
  const triggerClose = (tab) => {
    if (!isClosableTab(tab)) return;
    const id = readTabId(tab);
    options.onClose?.(id, tab);
    root.dispatchEvent(
      new CustomEvent('j-close', { bubbles: true, detail: { value: id, tab } }),
    );
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

  /** @param {MouseEvent} e */
  const onMouseDown = (e) => {
    if (e.button !== 1 || !allowMiddleClose()) return;
    const target = /** @type {Element | null} */ (e.target);
    const tab = /** @type {HTMLElement | null} */ (target?.closest('[role="tab"]') ?? null);
    if (tab && scroller.contains(tab) && isClosableTab(tab)) {
      // Prevent browser auto-scroll pan mode on middle mouse button press.
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

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    const target = /** @type {HTMLElement | null} */ (e.target);
    if (!target) return;

    // Let nested close button handle its own Enter / Space clicks naturally.
    if (target.closest('.j-doc-tabs__close')) return;

    const tab = /** @type {HTMLElement | null} */ (target.closest('[role="tab"]'));
    if (!tab || !scroller.contains(tab)) return;

    const enabledTabs = getDocTabElements(scroller).filter((t) => !isDisabled(t));
    const idx = enabledTabs.indexOf(tab);
    if (idx < 0) return;

    const rtl = getComputedStyle(scroller).direction === 'rtl';
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
        nextTab.focus();
        nextTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
        fallback?.focus();
        triggerClose(tab);
      }
    }
  };

  const clearDropIndicators = () => {
    getDocTabElements(scroller).forEach((t) => {
      t.removeAttribute('data-drop-before');
      t.removeAttribute('data-drop-after');
    });
  };

  const clearDragState = () => {
    dragFromIndex = -1;
    getDocTabElements(scroller).forEach((t) => {
      t.removeAttribute('data-dragging');
      t.removeAttribute('data-drop-before');
      t.removeAttribute('data-drop-after');
    });
  };

  /** @param {DragEvent} e */
  const onDragStart = (e) => {
    if (!isReorderable()) return;
    const target = /** @type {Element | null} */ (e.target);
    if (target?.closest('.j-doc-tabs__close')) {
      e.preventDefault();
      return;
    }
    const tab = /** @type {HTMLElement | null} */ (target?.closest('[role="tab"]') ?? null);
    if (!tab || !scroller.contains(tab) || isDisabled(tab)) return;
    const tabs = getDocTabElements(scroller);
    dragFromIndex = tabs.indexOf(tab);
    if (dragFromIndex < 0) return;

    tab.setAttribute('data-dragging', '');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', readTabId(tab));
      } catch {
        /* ignore restricted dataTransfer environments */
      }
    }
  };

  /** @param {DragEvent} e */
  const onDragOver = (e) => {
    if (!isReorderable() || dragFromIndex < 0) return;
    const target = /** @type {Element | null} */ (e.target);
    const overTab = /** @type {HTMLElement | null} */ (target?.closest('[role="tab"]') ?? null);
    if (!overTab || !scroller.contains(overTab)) return;

    const tabs = getDocTabElements(scroller);
    const draggedTab = tabs[dragFromIndex];
    const overIndex = tabs.indexOf(overTab);
    if (!draggedTab || overIndex < 0) return;

    // Keep pinned tabs grouped with pinned tabs and regular tabs with regular tabs.
    if (draggedTab.hasAttribute('data-pinned') !== overTab.hasAttribute('data-pinned')) {
      clearDropIndicators();
      return;
    }

    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    clearDropIndicators();
    if (overIndex === dragFromIndex) return;

    const rect = overTab.getBoundingClientRect();
    const before = e.clientX < rect.left + rect.width / 2;
    overTab.setAttribute(before ? 'data-drop-before' : 'data-drop-after', '');
  };

  /** @param {DragEvent} e */
  const onDrop = (e) => {
    if (!isReorderable() || dragFromIndex < 0) return;
    const target = /** @type {Element | null} */ (e.target);
    const overTab = /** @type {HTMLElement | null} */ (target?.closest('[role="tab"]') ?? null);
    const tabs = getDocTabElements(scroller);
    const fromIndex = dragFromIndex;
    const draggedTab = tabs[fromIndex];

    if (!overTab || !scroller.contains(overTab) || !draggedTab) {
      clearDragState();
      return;
    }

    if (draggedTab.hasAttribute('data-pinned') !== overTab.hasAttribute('data-pinned')) {
      clearDragState();
      return;
    }

    e.preventDefault();
    const overIndex = tabs.indexOf(overTab);
    const rect = overTab.getBoundingClientRect();
    const before = e.clientX < rect.left + rect.width / 2;
    const insertPos = before ? overIndex : overIndex + 1;
    const toIndex = fromIndex < insertPos ? insertPos - 1 : insertPos;

    clearDragState();

    if (overIndex >= 0 && toIndex !== fromIndex && toIndex >= 0 && toIndex < tabs.length) {
      options.onReorder?.(fromIndex, toIndex);
      root.dispatchEvent(
        new CustomEvent('j-reorder', {
          bubbles: true,
          detail: { fromIndex, toIndex },
        }),
      );
    }
  };

  const onDragEnd = () => {
    clearDragState();
  };

  /** @param {DragEvent} e */
  const onDragLeave = (e) => {
    const related = /** @type {Node | null} */ (e.relatedTarget);
    if (!related || !scroller.contains(related)) {
      clearDropIndicators();
    }
  };

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => scheduleSync())
      : null;
  ro?.observe(scroller);

  const mo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => scheduleSync())
      : null;
  mo?.observe(scroller, { childList: true, subtree: false });

  scroller.addEventListener('wheel', onWheel, { passive: false });
  scroller.addEventListener('scroll', scheduleSync, { passive: true });
  scroller.addEventListener('mousedown', onMouseDown);
  scroller.addEventListener('auxclick', onAuxClick);
  scroller.addEventListener('keydown', onKeyDown);
  scroller.addEventListener('dragstart', onDragStart);
  scroller.addEventListener('dragover', onDragOver);
  scroller.addEventListener('drop', onDrop);
  scroller.addEventListener('dragend', onDragEnd);
  scroller.addEventListener('dragleave', onDragLeave);

  measureOverflow();
  scrollActiveIntoView(true);

  return {
    getState: () => state,
    sync: measureOverflow,
    scrollActiveIntoView,
    destroy: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro?.disconnect();
      mo?.disconnect();
      clearDragState();
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('scroll', scheduleSync);
      scroller.removeEventListener('mousedown', onMouseDown);
      scroller.removeEventListener('auxclick', onAuxClick);
      scroller.removeEventListener('keydown', onKeyDown);
      scroller.removeEventListener('dragstart', onDragStart);
      scroller.removeEventListener('dragover', onDragOver);
      scroller.removeEventListener('drop', onDrop);
      scroller.removeEventListener('dragend', onDragEnd);
      scroller.removeEventListener('dragleave', onDragLeave);
    },
  };
}

/** @type {WeakMap<HTMLElement, DocTabsController>} */
const bound = new WeakMap();

/**
 * Init every `.j-doc-tabs` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initDocTabs(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-doc-tabs').forEach((el) => {
    const strip = /** @type {HTMLElement} */ (el);
    if (bound.has(strip)) return;
    bound.set(strip, createDocTabs(strip));
    made.push(strip);
  });
  return () => {
    made.forEach((el) => {
      bound.get(el)?.destroy();
      bound.delete(el);
    });
  };
}
