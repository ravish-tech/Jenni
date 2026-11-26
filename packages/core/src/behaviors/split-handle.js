// Standalone split-handle behavior (.j-resize-handle).
// Pointer-captured splitter dragging with document-level cursor + user-select lock
// (`html[data-j-split-dragging]`) and WAI-ARIA `role="separator"` keyboard stepping
// (ArrowLeft/ArrowRight or ArrowUp/ArrowDown + Shift largeStep).

const DOC_DRAG_ATTR = 'data-j-split-dragging';

/** @type {WeakMap<HTMLElement, SplitHandleController>} */
const controllers = new WeakMap();

/**
 * @typedef {'horizontal' | 'vertical'} SplitHandleOrientation
 */

/**
 * @typedef {'pointer' | 'keyboard'} SplitHandleSource
 */

/**
 * @typedef {Object} SplitHandleDragPayload
 * @property {number} delta
 * @property {number} totalDelta
 * @property {number} clientX
 * @property {number} clientY
 * @property {SplitHandleSource} source
 */

/**
 * @typedef {Object} SplitHandleOptions
 * @property {SplitHandleOrientation} [orientation]
 * @property {boolean} [disabled]
 * @property {number} [step]
 * @property {number} [largeStep]
 * @property {(event: PointerEvent) => void} [onDragStart]
 * @property {(payload: SplitHandleDragPayload) => void} [onDrag]
 * @property {(event: PointerEvent) => void} [onDragEnd]
 */

/**
 * @typedef {Object} SplitHandleController
 * @property {(nextOpts?: SplitHandleOptions) => void} update
 * @property {() => boolean} isDragging
 * @property {() => void} destroy
 */

/**
 * @param {unknown} raw
 * @param {number} fallback
 * @returns {number}
 */
function resolveStep(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Attach pointer-captured drag + keyboard separator stepping to a `.j-resize-handle` element.
 * @param {HTMLElement} el
 * @param {SplitHandleOptions} [initialOpts]
 * @returns {SplitHandleController}
 */
export function createSplitHandle(el, initialOpts = {}) {
  const existing = controllers.get(el);
  if (existing) {
    existing.update(initialOpts);
    return existing;
  }

  /** @type {SplitHandleOptions} */
  let opts = { ...initialOpts };
  /** @type {number | null} */
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;

  /** @returns {SplitHandleOrientation} */
  const getOrientation = () => {
    if (opts.orientation === 'vertical' || opts.orientation === 'horizontal') {
      return opts.orientation;
    }
    return el.getAttribute('data-orientation') === 'vertical' ? 'vertical' : 'horizontal';
  };

  /** @returns {boolean} */
  const isDisabled = () =>
    Boolean(opts.disabled) ||
    el.hasAttribute('data-disabled') ||
    el.getAttribute('aria-disabled') === 'true';

  /** @returns {number} */
  const getStep = () => resolveStep(opts.step ?? el.dataset?.step, 16);

  /** @returns {number} */
  const getLargeStep = () => resolveStep(opts.largeStep ?? el.dataset?.largeStep, 64);

  /** @returns {boolean} */
  const isRtl = () =>
    getOrientation() === 'horizontal' &&
    typeof getComputedStyle === 'function' &&
    getComputedStyle(el).direction === 'rtl';

  const syncAria = () => {
    if (!el.getAttribute('role')) {
      el.setAttribute('role', 'separator');
    }
    const orientation = getOrientation();
    const ariaOrientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
    el.setAttribute('aria-orientation', ariaOrientation);
    if (isDisabled()) {
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-disabled', 'true');
    } else {
      if (!el.hasAttribute('tabindex') || el.getAttribute('tabindex') === '-1') {
        el.setAttribute('tabindex', '0');
      }
      if (opts.disabled === false && el.getAttribute('aria-disabled') === 'true') {
        el.removeAttribute('aria-disabled');
      }
    }
  };

  const clearDocDragLock = () => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.removeAttribute(DOC_DRAG_ATTR);
    }
  };

  /**
   * Release active drag state cleanly and optionally notify `onDragEnd`.
   * @param {PointerEvent | null} event
   */
  const cleanupActiveDrag = (event) => {
    if (activePointerId === null) return;
    const pid = activePointerId;
    activePointerId = null;

    try {
      if (typeof el.hasPointerCapture === 'function' && el.hasPointerCapture(pid)) {
        el.releasePointerCapture(pid);
      }
    } catch {
      /* ignore synthetic or detached pointer capture errors */
    }

    el.removeAttribute('data-dragging');
    clearDocDragLock();

    if (event) {
      opts.onDragEnd?.(event);
      if (typeof CustomEvent === 'function' && typeof el.dispatchEvent === 'function') {
        el.dispatchEvent(
          new CustomEvent('j-split-drag-end', {
            bubbles: true,
            detail: { originalEvent: event },
          }),
        );
      }
    }
  };

  /**
   * @param {SplitHandleDragPayload} payload
   */
  const emitDrag = (payload) => {
    opts.onDrag?.(payload);
    if (typeof CustomEvent === 'function' && typeof el.dispatchEvent === 'function') {
      el.dispatchEvent(
        new CustomEvent('j-split-drag', {
          bubbles: true,
          detail: payload,
        }),
      );
    }
  };

  /** @param {PointerEvent} e */
  const onPointerDown = (e) => {
    if (e.button !== 0 || isDisabled()) return;
    e.preventDefault();

    activePointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;

    try {
      el.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore synthetic events */
    }

    const orientation = getOrientation();
    el.setAttribute('data-dragging', '');
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute(DOC_DRAG_ATTR, orientation);
    }
    el.focus?.({ preventScroll: true });

    opts.onDragStart?.(e);
    if (typeof CustomEvent === 'function') {
      el.dispatchEvent(
        new CustomEvent('j-split-drag-start', {
          bubbles: true,
          detail: { originalEvent: e },
        }),
      );
    }
  };

  /** @param {PointerEvent} e */
  const onPointerMove = (e) => {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    if (isDisabled()) {
      cleanupActiveDrag(e);
      return;
    }

    const horiz = getOrientation() === 'horizontal';
    const dirSign = horiz && isRtl() ? -1 : 1;
    const delta = horiz ? (e.clientX - lastX) * dirSign : e.clientY - lastY;
    const totalDelta = horiz ? (e.clientX - startX) * dirSign : e.clientY - startY;
    lastX = e.clientX;
    lastY = e.clientY;

    if (delta === 0) return;

    emitDrag({
      delta,
      totalDelta,
      clientX: e.clientX,
      clientY: e.clientY,
      source: 'pointer',
    });
  };

  /** @param {PointerEvent} e */
  const onPointerFinish = (e) => {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    cleanupActiveDrag(e);
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    if (isDisabled()) return;

    const horiz = getOrientation() === 'horizontal';
    const step = e.shiftKey ? getLargeStep() : getStep();
    const dirSign = horiz && isRtl() ? -1 : 1;
    /** @type {number | null} */
    let delta = null;

    if (horiz && e.key === 'ArrowLeft') {
      delta = -step * dirSign;
    } else if (horiz && e.key === 'ArrowRight') {
      delta = step * dirSign;
    } else if (!horiz && e.key === 'ArrowUp') {
      delta = -step;
    } else if (!horiz && e.key === 'ArrowDown') {
      delta = step;
    }

    if (delta === null) return;
    e.preventDefault();

    let clientX = 0;
    let clientY = 0;
    if (typeof el.getBoundingClientRect === 'function') {
      const rect = el.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    emitDrag({
      delta,
      totalDelta: delta,
      clientX,
      clientY,
      source: 'keyboard',
    });
  };

  syncAria();

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerFinish);
  el.addEventListener('pointercancel', onPointerFinish);
  el.addEventListener('lostpointercapture', onPointerFinish);
  el.addEventListener('keydown', onKeyDown);

  /** @type {SplitHandleController} */
  const api = {
    update: (nextOpts = {}) => {
      opts = { ...opts, ...nextOpts };
      if (isDisabled() && activePointerId !== null) {
        cleanupActiveDrag(null);
      }
      syncAria();
    },
    isDragging: () => activePointerId !== null,
    destroy: () => {
      cleanupActiveDrag(null);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerFinish);
      el.removeEventListener('pointercancel', onPointerFinish);
      el.removeEventListener('lostpointercapture', onPointerFinish);
      el.removeEventListener('keydown', onKeyDown);
      controllers.delete(el);
    },
  };

  controllers.set(el, api);
  return api;
}

/**
 * Initialize every `.j-resize-handle` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initSplitHandles(root = document) {
  /** @type {Array<() => void>} */
  const cleanups = [];
  if (
    typeof HTMLElement !== 'undefined' &&
    root instanceof HTMLElement &&
    root.matches('.j-resize-handle')
  ) {
    const ctrl = createSplitHandle(root);
    cleanups.push(() => ctrl.destroy());
  }
  root.querySelectorAll('.j-resize-handle').forEach((node) => {
    const ctrl = createSplitHandle(/** @type {HTMLElement} */ (node));
    cleanups.push(() => ctrl.destroy());
  });
  return () => cleanups.forEach((fn) => fn());
}
