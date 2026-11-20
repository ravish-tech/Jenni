// Virtual List behavior — O(1) fixed-height and O(log N) dynamic ResizeObserver virtualization.

/**
 * @typedef {'auto' | 'start' | 'center' | 'end'} VirtualScrollAlign
 */

/**
 * @typedef {Object} VirtualizerState
 * @property {number} startIndex
 * @property {number} endIndex
 * @property {number} offsetY
 * @property {number} totalHeight
 * @property {number[]} visibleIndices
 * @property {number} scrollTop
 * @property {number} viewportHeight
 */

/**
 * @typedef {Object} VirtualizerOptions
 * @property {number} count
 * @property {number | ((index: number) => number)} [itemHeight]
 * @property {number | (() => number)} [estimateHeight]
 * @property {number} [overscan]
 * @property {(state: VirtualizerState) => void} [onChange]
 */

/**
 * @typedef {Object} VirtualizerController
 * @property {(nextOptions: Partial<VirtualizerOptions>) => void} setOptions
 * @property {(el: HTMLElement | null | undefined, index: number) => void} measureElement
 * @property {(index: number, align?: VirtualScrollAlign, behavior?: ScrollBehavior) => void} scrollToIndex
 * @property {(offset: number, behavior?: ScrollBehavior) => void} scrollToOffset
 * @property {() => number} getTotalHeight
 * @property {() => VirtualizerState} getState
 * @property {(clearCache?: boolean) => void} refresh
 * @property {() => void} destroy
 */

/**
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
}

/**
 * Create a high-throughput viewport virtualizer supporting both O(1) fixed item heights
 * and dynamic variable-height items backed by a shared ResizeObserver + prefix-sum cache.
 *
 * @param {HTMLElement} viewportEl
 * @param {VirtualizerOptions} options
 * @returns {VirtualizerController}
 */
export function createVirtualizer(viewportEl, options) {
  let count = Math.max(0, Math.floor(options.count ?? 0));
  /** @type {number | ((index: number) => number) | undefined} */
  let itemHeightOpt = options.itemHeight;
  /** @type {number | (() => number) | undefined} */
  let estimateHeightOpt = options.estimateHeight;
  let overscan = Math.max(0, Math.floor(options.overscan ?? 6));
  /** @type {((state: VirtualizerState) => void) | undefined} */
  let onChange = options.onChange;

  let destroyed = false;
  let emitting = false;
  let measureQueued = false;
  /** @type {number | null} */
  let roRaf = null;

  /** @type {Map<number, number>} */
  const measuredHeights = new Map();
  /** @type {Map<number, HTMLElement>} */
  const elementByIndex = new Map();
  /** @type {WeakMap<Element, number>} */
  const indexByElement = new WeakMap();

  let offsets = new Float64Array(count + 1);
  let dirtyFrom = 0;

  /** @type {number[]} */
  let cachedIndices = [];
  let cachedStart = 0;
  let cachedEnd = -1;

  /** @type {VirtualizerState} */
  let lastState = {
    startIndex: 0,
    endIndex: -1,
    offsetY: 0,
    totalHeight: 0,
    visibleIndices: cachedIndices,
    scrollTop: 0,
    viewportHeight: 0,
  };

  /**
   * True when every item shares a uniform fixed height (`number` or 0-arg getter).
   * @returns {boolean}
   */
  const isFixedMode = () =>
    typeof itemHeightOpt === 'number' ||
    (typeof itemHeightOpt === 'function' && itemHeightOpt.length === 0);

  /**
   * True when dynamic ResizeObserver measurement is active (`itemHeight` omitted).
   * @returns {boolean}
   */
  const isDynamicMeasureMode = () => itemHeightOpt == null;

  /**
   * @returns {number}
   */
  const resolveFixedHeight = () => {
    const raw = typeof itemHeightOpt === 'function' ? itemHeightOpt(0) : itemHeightOpt;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 36;
  };

  /**
   * @returns {number}
   */
  const resolveEstimateHeight = () => {
    const raw = typeof estimateHeightOpt === 'function' ? estimateHeightOpt() : estimateHeightOpt;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 36;
  };

  /**
   * @param {number} index
   * @param {number} est
   * @returns {number}
   */
  const resolveSlotHeight = (index, est) => {
    if (typeof itemHeightOpt === 'function') {
      const n = Number(itemHeightOpt(index));
      return Number.isFinite(n) && n > 0 ? n : est;
    }
    return measuredHeights.get(index) ?? est;
  };

  /**
   * @returns {number}
   */
  const readViewportHeight = () => {
    const ch = viewportEl.clientHeight;
    if (ch > 0) return ch;
    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      const parsed = parseFloat(window.getComputedStyle(viewportEl).height);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 400;
  };

  const ensureOffsets = () => {
    if (offsets.length !== count + 1) {
      const next = new Float64Array(count + 1);
      const copyLen = Math.min(dirtyFrom + 1, offsets.length, next.length);
      if (copyLen > 0) {
        next.set(offsets.subarray(0, copyLen));
      }
      offsets = next;
      if (dirtyFrom > count) dirtyFrom = count;
    }
    if (dirtyFrom < count) {
      const est = resolveEstimateHeight();
      for (let i = dirtyFrom; i < count; i += 1) {
        offsets[i + 1] = offsets[i] + resolveSlotHeight(i, est);
      }
      dirtyFrom = count;
    }
  };

  /**
   * Binary search on prefix-sum `offsets` for index containing pixel `y`.
   * @param {number} y
   * @returns {number}
   */
  const findIndexAtOffset = (y) => {
    if (count <= 0 || y <= 0) return 0;
    if (y >= offsets[count]) return count - 1;
    let low = 0;
    let high = count - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      if (offsets[mid + 1] <= y) {
        low = mid + 1;
      } else if (offsets[mid] > y) {
        high = mid - 1;
      } else {
        return mid;
      }
    }
    return Math.min(count - 1, Math.max(0, low));
  };

  /**
   * @param {number} start
   * @param {number} end
   * @returns {number[]}
   */
  const getVisibleIndices = (start, end) => {
    if (end < start) {
      if (cachedIndices.length !== 0) {
        cachedIndices = [];
        cachedStart = 0;
        cachedEnd = -1;
      }
      return cachedIndices;
    }
    if (start === cachedStart && end === cachedEnd && cachedIndices.length === end - start + 1) {
      return cachedIndices;
    }
    const len = end - start + 1;
    const arr = new Array(len);
    for (let i = 0; i < len; i += 1) {
      arr[i] = start + i;
    }
    cachedStart = start;
    cachedEnd = end;
    cachedIndices = arr;
    return arr;
  };

  /**
   * @returns {VirtualizerState}
   */
  const computeState = () => {
    const scrollTop = Math.max(0, viewportEl.scrollTop || 0);
    const viewportHeight = readViewportHeight();

    if (count <= 0) {
      return {
        startIndex: 0,
        endIndex: -1,
        offsetY: 0,
        totalHeight: 0,
        visibleIndices: getVisibleIndices(0, -1),
        scrollTop,
        viewportHeight,
      };
    }

    if (isFixedMode()) {
      const h = resolveFixedHeight();
      const totalHeight = count * h;
      const clampedTop = Math.min(scrollTop, Math.max(0, totalHeight - viewportHeight));
      const firstVisible = Math.min(count - 1, Math.max(0, Math.floor(clampedTop / h)));
      const lastVisible = Math.min(
        count - 1,
        Math.max(firstVisible, Math.ceil((clampedTop + viewportHeight) / h) - 1),
      );
      const startIndex = Math.max(0, firstVisible - overscan);
      const endIndex = Math.min(count - 1, lastVisible + overscan);
      const offsetY = startIndex * h;
      return {
        startIndex,
        endIndex,
        offsetY,
        totalHeight,
        visibleIndices: getVisibleIndices(startIndex, endIndex),
        scrollTop,
        viewportHeight,
      };
    }

    ensureOffsets();
    const totalHeight = offsets[count];
    const clampedTop = Math.min(scrollTop, Math.max(0, totalHeight - viewportHeight));
    const firstVisible = findIndexAtOffset(clampedTop);
    const bottomEdge = Math.max(clampedTop, clampedTop + viewportHeight - 0.01);
    const lastVisible = Math.max(firstVisible, findIndexAtOffset(bottomEdge));
    const startIndex = Math.max(0, firstVisible - overscan);
    const endIndex = Math.min(count - 1, lastVisible + overscan);
    const offsetY = offsets[startIndex];

    return {
      startIndex,
      endIndex,
      offsetY,
      totalHeight,
      visibleIndices: getVisibleIndices(startIndex, endIndex),
      scrollTop,
      viewportHeight,
    };
  };

  /**
   * @param {boolean} [force=false]
   */
  const emitState = (force = false) => {
    if (destroyed) return;
    const next = computeState();
    const changed =
      force ||
      next.startIndex !== lastState.startIndex ||
      next.endIndex !== lastState.endIndex ||
      next.offsetY !== lastState.offsetY ||
      next.totalHeight !== lastState.totalHeight ||
      next.scrollTop !== lastState.scrollTop ||
      next.viewportHeight !== lastState.viewportHeight;

    lastState = next;
    if (changed && onChange) {
      emitting = true;
      try {
        onChange(next);
      } finally {
        emitting = false;
      }
    }
  };

  const scheduleMeasureFlush = () => {
    if (measureQueued || destroyed) return;
    measureQueued = true;
    queueMicrotask(() => {
      measureQueued = false;
      if (!destroyed) emitState(false);
    });
  };

  /** @type {ResizeObserver | null} */
  const itemRo =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver((entries) => {
          if (destroyed || !isDynamicMeasureMode()) return;
          let anyChanged = false;
          for (const entry of entries) {
            const target = /** @type {HTMLElement} */ (entry.target);
            if (!target.isConnected) {
              itemRo?.unobserve(target);
              continue;
            }
            const idxAttr = target.dataset.vIndex;
            const idx = idxAttr !== undefined ? Number(idxAttr) : indexByElement.get(target);
            if (idx === undefined || !Number.isInteger(idx) || idx < 0 || idx >= count) continue;

            const boxSize = entry.borderBoxSize?.[0]?.blockSize;
            const nextH =
              typeof boxSize === 'number' && boxSize > 0
                ? boxSize
                : target.offsetHeight || target.getBoundingClientRect().height;
            if (!(nextH > 0)) continue;

            const prevH = measuredHeights.get(idx);
            if (prevH === undefined || Math.abs(prevH - nextH) > 0.25) {
              measuredHeights.set(idx, nextH);
              if (idx < dirtyFrom) dirtyFrom = idx;
              anyChanged = true;
            }
          }

          if (anyChanged) {
            if (roRaf !== null) cancelAnimationFrame(roRaf);
            roRaf = requestAnimationFrame(() => {
              roRaf = null;
              emitState(false);
            });
          }
        })
      : null;

  /** @type {ResizeObserver | null} */
  const viewportRo =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (destroyed) return;
          if (roRaf !== null) cancelAnimationFrame(roRaf);
          roRaf = requestAnimationFrame(() => {
            roRaf = null;
            emitState(false);
          });
        })
      : null;

  viewportRo?.observe(viewportEl);

  const onScroll = () => {
    if (destroyed) return;
    emitState(false);
  };

  viewportEl.addEventListener('scroll', onScroll, { passive: true });

  /**
   * @param {HTMLElement | null | undefined} el
   * @param {number} index
   */
  const measureElement = (el, index) => {
    if (destroyed || !isDynamicMeasureMode()) return;
    if (!Number.isInteger(index) || index < 0 || index >= count) return;

    if (!el) {
      const existing = elementByIndex.get(index);
      if (existing && !existing.isConnected) {
        itemRo?.unobserve(existing);
        elementByIndex.delete(index);
      }
      return;
    }

    const prevIdxForEl = indexByElement.get(el);
    if (prevIdxForEl !== undefined && prevIdxForEl !== index && elementByIndex.get(prevIdxForEl) === el) {
      elementByIndex.delete(prevIdxForEl);
    }

    const prevElAtIndex = elementByIndex.get(index);
    if (prevElAtIndex && prevElAtIndex !== el) {
      itemRo?.unobserve(prevElAtIndex);
    }

    el.dataset.vIndex = String(index);
    elementByIndex.set(index, el);
    indexByElement.set(el, index);
    itemRo?.observe(el);

    const h = el.offsetHeight || el.getBoundingClientRect().height;
    if (h > 0) {
      const prevH = measuredHeights.get(index);
      if (prevH === undefined || Math.abs(prevH - h) > 0.25) {
        measuredHeights.set(index, h);
        if (index < dirtyFrom) dirtyFrom = index;
        if (emitting) {
          scheduleMeasureFlush();
        } else {
          scheduleMeasureFlush();
        }
      }
    }
  };

  /**
   * @returns {number}
   */
  const getTotalHeight = () => {
    if (count <= 0) return 0;
    if (isFixedMode()) return count * resolveFixedHeight();
    ensureOffsets();
    return offsets[count];
  };

  /**
   * @param {number} offset
   * @param {ScrollBehavior} [behavior='auto']
   */
  const scrollToOffset = (offset, behavior = 'auto') => {
    if (destroyed) return;
    const maxScroll = Math.max(0, getTotalHeight() - readViewportHeight());
    const targetTop = Math.min(maxScroll, Math.max(0, offset));
    const effectiveBehavior = behavior === 'smooth' && prefersReducedMotion() ? 'auto' : behavior;

    if (typeof viewportEl.scrollTo === 'function') {
      viewportEl.scrollTo({ top: targetTop, behavior: effectiveBehavior });
    } else {
      viewportEl.scrollTop = targetTop;
    }
    if (effectiveBehavior === 'auto') {
      viewportEl.scrollTop = targetTop;
      emitState(false);
    }
  };

  /**
   * @param {number} index
   * @param {VirtualScrollAlign} [align='auto']
   * @param {ScrollBehavior} [behavior='auto']
   */
  const scrollToIndex = (index, align = 'auto', behavior = 'auto') => {
    if (destroyed || count <= 0) return;
    const clampedIndex = Math.min(count - 1, Math.max(0, Math.floor(index)));

    let itemTop = 0;
    let itemSize = 0;
    if (isFixedMode()) {
      itemSize = resolveFixedHeight();
      itemTop = clampedIndex * itemSize;
    } else {
      ensureOffsets();
      itemTop = offsets[clampedIndex];
      itemSize = offsets[clampedIndex + 1] - itemTop;
    }

    const itemBottom = itemTop + itemSize;
    const vpHeight = readViewportHeight();
    const currentTop = viewportEl.scrollTop || 0;
    const currentBottom = currentTop + vpHeight;

    let nextTop = currentTop;
    if (align === 'start') {
      nextTop = itemTop;
    } else if (align === 'end') {
      nextTop = itemBottom - vpHeight;
    } else if (align === 'center') {
      nextTop = itemTop - (vpHeight - itemSize) / 2;
    } else {
      if (itemTop < currentTop) {
        nextTop = itemTop;
      } else if (itemBottom > currentBottom) {
        nextTop = itemBottom - vpHeight;
      } else {
        return;
      }
    }

    scrollToOffset(nextTop, behavior);
  };

  /**
   * @param {Partial<VirtualizerOptions>} nextOptions
   */
  const setOptions = (nextOptions) => {
    if (destroyed) return;
    let needsReset = false;

    if (nextOptions.onChange !== undefined) {
      onChange = nextOptions.onChange;
    }
    if (nextOptions.overscan !== undefined) {
      overscan = Math.max(0, Math.floor(nextOptions.overscan));
    }
    if ('itemHeight' in nextOptions && nextOptions.itemHeight !== itemHeightOpt) {
      itemHeightOpt = nextOptions.itemHeight;
      needsReset = true;
    }
    if ('estimateHeight' in nextOptions && nextOptions.estimateHeight !== estimateHeightOpt) {
      estimateHeightOpt = nextOptions.estimateHeight;
      needsReset = true;
    }
    if (nextOptions.count !== undefined) {
      const nextCount = Math.max(0, Math.floor(nextOptions.count));
      if (nextCount < count) {
        for (const k of measuredHeights.keys()) {
          if (k >= nextCount) measuredHeights.delete(k);
        }
        for (const [k, el] of elementByIndex.entries()) {
          if (k >= nextCount) {
            itemRo?.unobserve(el);
            elementByIndex.delete(k);
          }
        }
        if (dirtyFrom > nextCount) dirtyFrom = nextCount;
      }
      count = nextCount;
    }

    if (needsReset) {
      dirtyFrom = 0;
    }
    emitState(false);
  };

  /**
   * @param {boolean} [clearCache=true]
   */
  const refresh = (clearCache = true) => {
    if (destroyed) return;
    if (!isFixedMode()) {
      if (clearCache) {
        measuredHeights.clear();
        offsets = new Float64Array(count + 1);
        dirtyFrom = 0;
        ensureOffsets();
      }
      if (isDynamicMeasureMode()) {
        for (const [idx, el] of elementByIndex.entries()) {
          if (!el.isConnected) {
            itemRo?.unobserve(el);
            elementByIndex.delete(idx);
            continue;
          }
          if (idx >= 0 && idx < count) {
            const h = el.offsetHeight || el.getBoundingClientRect().height;
            if (h > 0) measuredHeights.set(idx, h);
          }
        }
      }
      dirtyFrom = 0;
    }
    emitState(true);
  };

  /** @type {MutationObserver | null} */
  const densityMo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver((mutations) => {
          if (destroyed) return;
          for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'data-density') {
              refresh(true);
              break;
            }
          }
        })
      : null;

  if (densityMo) {
    const docEl = viewportEl.ownerDocument?.documentElement ?? null;
    const densityAncestor =
      typeof viewportEl.closest === 'function' ? viewportEl.closest('[data-density]') : null;
    if (densityAncestor) {
      densityMo.observe(densityAncestor, {
        attributes: true,
        attributeFilter: ['data-density'],
      });
    }
    if (docEl && docEl !== densityAncestor) {
      densityMo.observe(docEl, {
        attributes: true,
        attributeFilter: ['data-density'],
      });
    }
    if (!densityAncestor) {
      queueMicrotask(() => {
        if (destroyed || !densityMo) return;
        const lateAncestor =
          typeof viewportEl.closest === 'function' ? viewportEl.closest('[data-density]') : null;
        if (lateAncestor && lateAncestor !== docEl) {
          densityMo.observe(lateAncestor, {
            attributes: true,
            attributeFilter: ['data-density'],
          });
        }
      });
    }
  }

  const getState = () => lastState;

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (roRaf !== null) {
      cancelAnimationFrame(roRaf);
      roRaf = null;
    }
    viewportEl.removeEventListener('scroll', onScroll);
    viewportRo?.disconnect();
    itemRo?.disconnect();
    densityMo?.disconnect();
    elementByIndex.clear();
    measuredHeights.clear();
  };

  emitState(true);

  return {
    setOptions,
    measureElement,
    scrollToIndex,
    scrollToOffset,
    getTotalHeight,
    getState,
    refresh,
    destroy,
  };
}
