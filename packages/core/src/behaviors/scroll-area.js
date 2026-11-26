// ScrollArea edge-fade, overflow & scroll-activity behavior.
// Observes passive `scroll`, `ResizeObserver`, and direct child mutations on
// `.j-scroll-area` to toggle `data-overflows-y`, `data-overflows-x`,
// `data-can-scroll-start`, `data-can-scroll-end`,
// `data-can-scroll-inline-start`, `data-can-scroll-inline-end`, and
// `data-scrolling` with zero layout shift. Idempotent & framework-friendly.

const EPSILON = 1;
const SCROLL_IDLE_MS = 650;

/** @type {WeakMap<HTMLElement, ScrollAreaController>} */
const controllers = new WeakMap();

/**
 * @typedef {Object} ScrollAreaState
 * @property {boolean} canScrollStart
 * @property {boolean} canScrollEnd
 * @property {boolean} canScrollInlineStart
 * @property {boolean} canScrollInlineEnd
 * @property {boolean} overflowsY
 * @property {boolean} overflowsX
 */

/**
 * @typedef {Object} ScrollAreaOptions
 * @property {(state: ScrollAreaState) => void} [onStateChange]
 */

/**
 * @typedef {Object} ScrollAreaController
 * @property {() => ScrollAreaState} getState
 * @property {() => void} update
 * @property {(options: ScrollToOptions) => void} scrollTo
 * @property {() => void} destroy
 */

/**
 * Toggle an empty boolean data attribute only when its presence changes.
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
 * Attach scroll-state and dynamic edge-fade tracking to a `.j-scroll-area`.
 * @param {HTMLElement} el
 * @param {ScrollAreaOptions} [options]
 * @returns {ScrollAreaController}
 */
export function createScrollArea(el, options = {}) {
  const existing = controllers.get(el);
  if (existing) return existing;

  /** @type {ScrollAreaState} */
  let state = {
    canScrollStart: false,
    canScrollEnd: false,
    canScrollInlineStart: false,
    canScrollInlineEnd: false,
    overflowsY: false,
    overflowsX: false,
  };

  /** @type {ReturnType<typeof setTimeout> | null} */
  let idleTimer = null;
  /** @type {number | null} */
  let initialRaf = null;

  const compute = () => {
    const orientation = el.getAttribute('data-orientation') || 'vertical';
    const allowBlock = orientation === 'vertical' || orientation === 'both';
    const allowInline = orientation === 'horizontal' || orientation === 'both';

    const canScrollBlock = allowBlock && el.scrollHeight - el.clientHeight > EPSILON;
    const canScrollStart = canScrollBlock && el.scrollTop > EPSILON;
    const canScrollEnd = canScrollBlock && el.scrollTop + el.clientHeight < el.scrollHeight - EPSILON;

    const scrollLeft = Math.abs(el.scrollLeft);
    const canScrollInline = allowInline && el.scrollWidth - el.clientWidth > EPSILON;
    const canScrollInlineStart = canScrollInline && scrollLeft > EPSILON;
    const canScrollInlineEnd = canScrollInline && scrollLeft + el.clientWidth < el.scrollWidth - EPSILON;

    syncAttr(el, 'data-overflows-y', canScrollBlock);
    syncAttr(el, 'data-overflows-x', canScrollInline);
    syncAttr(el, 'data-can-scroll-start', canScrollStart);
    syncAttr(el, 'data-can-scroll-end', canScrollEnd);
    syncAttr(el, 'data-can-scroll-inline-start', canScrollInlineStart);
    syncAttr(el, 'data-can-scroll-inline-end', canScrollInlineEnd);

    if (
      state.canScrollStart !== canScrollStart ||
      state.canScrollEnd !== canScrollEnd ||
      state.canScrollInlineStart !== canScrollInlineStart ||
      state.canScrollInlineEnd !== canScrollInlineEnd ||
      state.overflowsY !== canScrollBlock ||
      state.overflowsX !== canScrollInline
    ) {
      state = {
        canScrollStart,
        canScrollEnd,
        canScrollInlineStart,
        canScrollInlineEnd,
        overflowsY: canScrollBlock,
        overflowsX: canScrollInline,
      };
      options.onStateChange?.(state);
    }
  };

  const onScroll = () => {
    compute();
    if (!el.hasAttribute('data-scrolling')) {
      el.setAttribute('data-scrolling', '');
    }
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimer = null;
      el.removeAttribute('data-scrolling');
    }, SCROLL_IDLE_MS);
  };

  el.addEventListener('scroll', onScroll, { passive: true });

  /** @type {Set<Element>} */
  const observedChildren = new Set();

  /** @type {number | null} */
  let roRaf = null;

  /** @type {ResizeObserver | null} */
  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (typeof requestAnimationFrame === 'function') {
            if (roRaf !== null) cancelAnimationFrame(roRaf);
            roRaf = requestAnimationFrame(() => {
              roRaf = null;
              compute();
            });
          } else {
            compute();
          }
        })
      : null;

  const syncObservedChildren = () => {
    if (!ro) return;
    const nextChildren = new Set(Array.from(el.children));
    for (const prev of observedChildren) {
      if (!nextChildren.has(prev)) {
        ro.unobserve(prev);
        observedChildren.delete(prev);
      }
    }
    for (const child of nextChildren) {
      if (!observedChildren.has(child)) {
        ro.observe(child);
        observedChildren.add(child);
      }
    }
  };

  if (ro) {
    ro.observe(el);
    syncObservedChildren();
  }

  /** @type {MutationObserver | null} */
  const mo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver((records) => {
          let childrenChanged = false;
          for (const rec of records) {
            if (rec.type === 'childList') childrenChanged = true;
          }
          if (childrenChanged) syncObservedChildren();
          compute();
        })
      : null;

  if (mo) {
    mo.observe(el, {
      childList: true,
      attributes: true,
      attributeFilter: ['data-orientation', 'data-fade'],
    });
  }

  compute();
  if (typeof requestAnimationFrame === 'function') {
    initialRaf = requestAnimationFrame(() => {
      initialRaf = null;
      compute();
    });
  }

  /** @type {ScrollAreaController} */
  const api = {
    getState: () => ({ ...state }),
    update: compute,
    scrollTo: (scrollOptions) => el.scrollTo(scrollOptions),
    destroy: () => {
      el.removeEventListener('scroll', onScroll);
      if (idleTimer !== null) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (initialRaf !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(initialRaf);
        initialRaf = null;
      }
      if (roRaf !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(roRaf);
        roRaf = null;
      }
      ro?.disconnect();
      observedChildren.clear();
      mo?.disconnect();
      el.removeAttribute('data-scrolling');
      el.removeAttribute('data-overflows-y');
      el.removeAttribute('data-overflows-x');
      el.removeAttribute('data-can-scroll-start');
      el.removeAttribute('data-can-scroll-end');
      el.removeAttribute('data-can-scroll-inline-start');
      el.removeAttribute('data-can-scroll-inline-end');
      controllers.delete(el);
    },
  };

  controllers.set(el, api);
  return api;
}

/**
 * Initialize all `.j-scroll-area` containers inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initScrollAreas(root = document) {
  /** @type {Array<() => void>} */
  const cleanups = [];
  if (typeof HTMLElement !== 'undefined' && root instanceof HTMLElement && root.matches('.j-scroll-area')) {
    const ctrl = createScrollArea(root);
    cleanups.push(() => ctrl.destroy());
  }
  root.querySelectorAll('.j-scroll-area').forEach((node) => {
    const ctrl = createScrollArea(/** @type {HTMLElement} */ (node));
    cleanups.push(() => ctrl.destroy());
  });
  return () => cleanups.forEach((fn) => fn());
}
