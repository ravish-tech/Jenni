// Jenni — Resizable Panels behavior.
// Smooth pointer-captured rAF splitter dragging, WAI-ARIA `role="separator"`
// keyboard control (Arrow keys, Shift 5× step, Home/End, Enter/Space &
// double-click collapse/restore), and optional localStorage ratio persistence.
// Scopes strictly to direct children so nested horizontal + vertical groups
// compose without cross-talk.

const STORAGE_PREFIX = 'jenni:resizable:';
const EPSILON = 0.05;
let uid = 0;

/** @type {WeakMap<HTMLElement, ResizableGroupController>} */
const controllers = new WeakMap();

/**
 * @typedef {Object} ResizableGroupOptions
 * @property {'horizontal' | 'vertical'} [orientation]
 * @property {string} [autoSaveId]
 * @property {string} [storageKey]
 * @property {number} [step]
 * @property {(sizes: number[]) => void} [onLayout]
 * @property {(panelId: string, collapsed: boolean) => void} [onPanelCollapse]
 */

/**
 * @typedef {Object} ResizableGroupController
 * @property {() => number[]} getLayout
 * @property {(sizes: number[]) => void} setLayout
 * @property {(idOrIndex: string | number) => void} collapsePanel
 * @property {(idOrIndex: string | number) => void} expandPanel
 * @property {(idOrIndex: string | number) => boolean} togglePanel
 * @property {(idOrIndex: string | number) => boolean} isPanelCollapsed
 * @property {() => void} resetLayout
 * @property {() => void} refresh
 * @property {() => void} destroy
 */

/**
 * @typedef {Object} PanelMeta
 * @property {HTMLElement} el
 * @property {string} id
 * @property {number | null} defaultSize
 * @property {number} minSize
 * @property {number} maxSize
 * @property {boolean} collapsible
 * @property {number} collapsedSize
 */

/**
 * @param {string | undefined | null} raw
 * @param {number} fallback
 * @returns {number}
 */
function parseNum(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
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
 * @param {string | undefined} key
 * @returns {{ sizes?: number[], openSizes?: Record<string, number> } | null}
 */
function loadSaved(key) {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sizes)) return parsed;
  } catch {
    /* ignore storage quota / security errors */
  }
  return null;
}

/**
 * @param {string | undefined} key
 * @param {number[]} sizes
 * @param {Record<string, number>} openSizes
 */
function saveState(key, sizes, openSizes) {
  if (!key || typeof localStorage === 'undefined') return;
  try {
    const rounded = sizes.map((s) => Math.round(s * 100) / 100);
    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify({ sizes: rounded, openSizes }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * @param {string | undefined} key
 */
function clearSaved(key) {
  if (!key || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    /* ignore */
  }
}

/**
 * Attach resizable split behavior to a `.j-resizable` container.
 * @param {HTMLElement} root
 * @param {ResizableGroupOptions} [opts]
 * @returns {ResizableGroupController}
 */
export function createResizableGroup(root, opts = {}) {
  const existing = controllers.get(root);
  if (existing) return existing;

  /** @type {PanelMeta[]} */
  let panels = [];
  /** @type {HTMLElement[]} */
  let handles = [];
  /** @type {number[]} */
  let sizes = [];
  /** @type {Record<string, number>} */
  let openSizes = {};
  /** @type {Record<string, boolean>} */
  let lastCollapsedState = {};
  /** @type {Array<() => void>} */
  let handleCleanups = [];
  /** @type {number | null} */
  let dragRaf = null;
  /** @type {number | null} */
  let roRaf = null;

  const getOrientation = () =>
    /** @type {'horizontal' | 'vertical'} */ (
      opts.orientation ||
        (root.getAttribute('data-orientation') === 'vertical' ? 'vertical' : 'horizontal')
    );

  const getStorageKey = () =>
    opts.autoSaveId ||
    opts.storageKey ||
    root.dataset.storageKey ||
    root.dataset.autoSaveId ||
    undefined;

  const getStep = () => (typeof opts.step === 'number' && opts.step > 0 ? opts.step : 2);

  const isRtl = () =>
    getOrientation() === 'horizontal' &&
    typeof getComputedStyle === 'function' &&
    getComputedStyle(root).direction === 'rtl';

  /**
   * Read direct `.j-resizable__panel` and `.j-resizable__handle` children only.
   */
  const collectElements = () => {
    /** @type {PanelMeta[]} */
    const nextPanels = [];
    /** @type {HTMLElement[]} */
    const nextHandles = [];
    const directChildren = Array.from(root.children);

    let pIdx = 0;
    for (const child of directChildren) {
      if (!(child instanceof HTMLElement)) continue;
      if (child.classList.contains('j-resizable__panel')) {
        if (!child.id) child.id = `j-rpanel-${++uid}`;
        const panelId = child.dataset.panelId || child.id || `panel-${pIdx}`;
        const rawDefault = child.dataset.defaultSize;
        const defaultSize =
          rawDefault != null && rawDefault !== '' && Number.isFinite(Number(rawDefault))
            ? clamp(Number(rawDefault), 0, 100)
            : null;
        const collapsible =
          child.hasAttribute('data-collapsible') && child.dataset.collapsible !== 'false';
        const collapsedSize = collapsible
          ? clamp(parseNum(child.dataset.collapsedSize, 0), 0, 50)
          : 0;
        const minSize = clamp(parseNum(child.dataset.minSize, 10), collapsedSize, 100);
        const maxSize = clamp(parseNum(child.dataset.maxSize, 100), minSize, 100);

        nextPanels.push({
          el: child,
          id: panelId,
          defaultSize,
          minSize,
          maxSize,
          collapsible,
          collapsedSize,
        });
        pIdx += 1;
      } else if (child.classList.contains('j-resizable__handle')) {
        nextHandles.push(child);
      }
    }

    panels = nextPanels;
    handles = nextHandles;
  };

  /**
   * Compute default sizes summing to 100 while respecting min/max constraints.
   * @returns {number[]}
   */
  const computeDefaultSizes = () => {
    const n = panels.length;
    if (n === 0) return [];
    let assignedSum = 0;
    let unassignedCount = 0;
    for (const p of panels) {
      if (p.defaultSize != null) assignedSum += p.defaultSize;
      else unassignedCount += 1;
    }
    const fallbackShare =
      unassignedCount > 0 ? Math.max(5, (100 - assignedSum) / unassignedCount) : 0;

    const raw = panels.map((p) => {
      const base = p.defaultSize != null ? p.defaultSize : fallbackShare;
      if (p.collapsible && base <= p.collapsedSize + EPSILON) return p.collapsedSize;
      return clamp(base, p.minSize, p.maxSize);
    });
    const total = raw.reduce((a, b) => a + b, 0) || 100;
    return raw.map((s) => (s / total) * 100);
  };

  /**
   * Check whether panel `idx` is currently in its collapsed state.
   * @param {number} idx
   * @param {number} [val]
   * @returns {boolean}
   */
  const checkCollapsed = (idx, val = sizes[idx]) => {
    const p = panels[idx];
    if (!p || !p.collapsible) return false;
    return val <= p.collapsedSize + EPSILON;
  };

  /**
   * Sync CSS `--_panel-size`, collapsed attributes, and WAI-ARIA separator metadata.
   * @param {boolean} [emitChange]
   * @param {boolean} [persist]
   */
  const applySizes = (emitChange = true, persist = false) => {
    const orientation = getOrientation();
    const ariaOrientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';

    panels.forEach((p, idx) => {
      const s = Math.max(0, sizes[idx] ?? 0);
      const isCol = checkCollapsed(idx, s);
      p.el.style.setProperty('--_panel-size', s.toFixed(4));
      syncAttr(p.el, 'data-collapsed', isCol);
      syncAttr(p.el, 'data-collapsed-zero', isCol && p.collapsedSize <= EPSILON);
      if (!isCol && s >= p.minSize - EPSILON) {
        openSizes[p.id] = s;
      }
      if (lastCollapsedState[p.id] !== isCol) {
        const hadPrev = Object.prototype.hasOwnProperty.call(lastCollapsedState, p.id);
        lastCollapsedState[p.id] = isCol;
        if (hadPrev) {
          opts.onPanelCollapse?.(p.id, isCol);
          root.dispatchEvent(
            new CustomEvent('j-panel-collapse', {
              bubbles: true,
              detail: { panelId: p.id, collapsed: isCol },
            }),
          );
        }
      }
    });

    handles.forEach((h, idx) => {
      const left = panels[idx];
      const right = panels[idx + 1];
      if (!h.getAttribute('role')) h.setAttribute('role', 'separator');
      const disabled =
        h.hasAttribute('data-disabled') || h.getAttribute('aria-disabled') === 'true';
      if (!disabled && !h.hasAttribute('tabindex')) h.setAttribute('tabindex', '0');
      h.setAttribute('aria-orientation', ariaOrientation);

      if (left && right) {
        h.setAttribute('aria-controls', `${left.el.id} ${right.el.id}`);
        const pairSum = (sizes[idx] ?? 0) + (sizes[idx + 1] ?? 0);
        const rightFloor = right.collapsible ? right.collapsedSize : right.minSize;
        const leftFloor = left.collapsible ? left.collapsedSize : left.minSize;
        const effectiveMin = Math.max(leftFloor, pairSum - right.maxSize);
        const effectiveMax = Math.min(left.maxSize, pairSum - rightFloor);
        h.setAttribute('aria-valuemin', String(Math.round(Math.max(0, effectiveMin))));
        h.setAttribute('aria-valuemax', String(Math.round(Math.min(100, effectiveMax))));
        h.setAttribute('aria-valuenow', String(Math.round(sizes[idx] ?? 0)));
      }
    });

    if (persist) {
      saveState(getStorageKey(), sizes, openSizes);
    }

    if (emitChange) {
      const snapshot = sizes.map((s) => Math.round(s * 100) / 100);
      opts.onLayout?.(snapshot);
      root.dispatchEvent(
        new CustomEvent('j-resize', {
          bubbles: true,
          detail: { sizes: snapshot },
        }),
      );
    }
  };

  /**
   * Resize adjacent panels `(handleIdx, handleIdx + 1)` given a desired left size,
   * handling min/max bounds and smooth snap-collapse thresholds.
   * @param {number} handleIdx
   * @param {number} desiredLeft
   * @param {boolean} [allowCollapseSnap]
   * @param {boolean} [persist]
   */
  const resizePair = (handleIdx, desiredLeft, allowCollapseSnap = true, persist = true) => {
    const left = panels[handleIdx];
    const right = panels[handleIdx + 1];
    if (!left || !right) return;

    const pairSum = (sizes[handleIdx] ?? 0) + (sizes[handleIdx + 1] ?? 0);
    let nextLeft = desiredLeft;
    let nextRight = pairSum - nextLeft;

    // Handle collapsible snap on left panel
    if (left.collapsible && nextLeft < left.minSize) {
      const snapPoint = left.collapsedSize + (left.minSize - left.collapsedSize) * 0.5;
      if (allowCollapseSnap && nextLeft <= snapPoint) {
        if (!checkCollapsed(handleIdx) && sizes[handleIdx] >= left.minSize) {
          openSizes[left.id] = sizes[handleIdx];
        }
        nextLeft = left.collapsedSize;
      } else {
        nextLeft = left.minSize;
      }
      nextRight = pairSum - nextLeft;
    } else if (!left.collapsible) {
      nextLeft = Math.max(left.minSize, nextLeft);
      nextRight = pairSum - nextLeft;
    }

    // Handle collapsible snap on right panel
    if (right.collapsible && nextRight < right.minSize) {
      const snapPoint = right.collapsedSize + (right.minSize - right.collapsedSize) * 0.5;
      if (allowCollapseSnap && nextRight <= snapPoint) {
        if (!checkCollapsed(handleIdx + 1) && sizes[handleIdx + 1] >= right.minSize) {
          openSizes[right.id] = sizes[handleIdx + 1];
        }
        nextRight = right.collapsedSize;
      } else {
        nextRight = right.minSize;
      }
      nextLeft = pairSum - nextRight;
    } else if (!right.collapsible) {
      nextRight = Math.max(right.minSize, nextRight);
      nextLeft = pairSum - nextRight;
    }

    // Clamp upper bounds
    if (nextLeft > left.maxSize) {
      nextLeft = left.maxSize;
      nextRight = pairSum - nextLeft;
    }
    if (nextRight > right.maxSize) {
      nextRight = right.maxSize;
      nextLeft = pairSum - nextRight;
    }

    // Re-verify non-collapsible minimums if pairSum was tight
    if (!left.collapsible && nextLeft < left.minSize) {
      nextLeft = Math.min(pairSum, left.minSize);
      nextRight = pairSum - nextLeft;
    }
    if (!right.collapsible && nextRight < right.minSize) {
      nextRight = Math.min(pairSum, right.minSize);
      nextLeft = pairSum - nextRight;
    }

    if (
      Math.abs(nextLeft - sizes[handleIdx]) > 0.001 ||
      Math.abs(nextRight - sizes[handleIdx + 1]) > 0.001
    ) {
      sizes[handleIdx] = nextLeft;
      sizes[handleIdx + 1] = nextRight;
      applySizes(true, persist);
    } else if (persist) {
      saveState(getStorageKey(), sizes, openSizes);
    }
  };

  /**
   * Resolve panel index by `data-panel-id`, element `id`, or numeric index.
   * @param {string | number} idOrIndex
   * @returns {number}
   */
  const resolvePanelIndex = (idOrIndex) => {
    if (typeof idOrIndex === 'number') {
      return idOrIndex >= 0 && idOrIndex < panels.length ? idOrIndex : -1;
    }
    return panels.findIndex((p) => p.id === idOrIndex || p.el.id === idOrIndex);
  };

  /**
   * Collapse a collapsible panel and transfer its space to an adjacent neighbor.
   * @param {string | number} idOrIndex
   */
  const collapsePanel = (idOrIndex) => {
    const idx = resolvePanelIndex(idOrIndex);
    if (idx < 0) return;
    const panel = panels[idx];
    if (!panel || !panel.collapsible || checkCollapsed(idx)) return;

    const neighborIdx = idx < panels.length - 1 ? idx + 1 : idx - 1;
    if (neighborIdx < 0 || !panels[neighborIdx]) return;

    openSizes[panel.id] = sizes[idx];
    const delta = sizes[idx] - panel.collapsedSize;
    const neighbor = panels[neighborIdx];
    const maxTransfer = neighbor.maxSize - sizes[neighborIdx];
    const actualDelta = Math.min(delta, Math.max(0, maxTransfer));
    if (actualDelta <= 0) return;

    sizes[idx] = panel.collapsedSize;
    sizes[neighborIdx] += delta;
    applySizes(true, true);
  };

  /**
   * Expand a collapsed panel back to its saved open size (or default / minSize).
   * @param {string | number} idOrIndex
   */
  const expandPanel = (idOrIndex) => {
    const idx = resolvePanelIndex(idOrIndex);
    if (idx < 0) return;
    const panel = panels[idx];
    if (!panel || !panel.collapsible || !checkCollapsed(idx)) return;

    const neighborIdx = idx < panels.length - 1 ? idx + 1 : idx - 1;
    if (neighborIdx < 0 || !panels[neighborIdx]) return;
    const neighbor = panels[neighborIdx];

    const savedOpen = openSizes[panel.id];
    const targetOpen = clamp(
      savedOpen && savedOpen >= panel.minSize
        ? savedOpen
        : panel.defaultSize && panel.defaultSize >= panel.minSize
          ? panel.defaultSize
          : Math.max(panel.minSize, 20),
      panel.minSize,
      panel.maxSize,
    );

    const pairSum = sizes[idx] + sizes[neighborIdx];
    const neighborMin = neighbor.collapsible ? neighbor.minSize : neighbor.minSize;
    const maxExpand = Math.max(panel.minSize, pairSum - neighborMin);
    const nextSize = clamp(targetOpen, panel.minSize, Math.min(panel.maxSize, maxExpand));

    sizes[idx] = nextSize;
    sizes[neighborIdx] = Math.max(0, pairSum - nextSize);
    applySizes(true, true);
  };

  /**
   * Toggle a collapsible panel; returns the new collapsed state.
   * @param {string | number} idOrIndex
   * @returns {boolean}
   */
  const togglePanel = (idOrIndex) => {
    const idx = resolvePanelIndex(idOrIndex);
    if (idx < 0) return false;
    if (checkCollapsed(idx)) {
      expandPanel(idx);
      return false;
    }
    collapsePanel(idx);
    return true;
  };

  /**
   * Measure usable panel pixel span along the group's primary axis.
   * @returns {number}
   */
  const measureUsablePx = () => {
    const horiz = getOrientation() === 'horizontal';
    const rootRect = root.getBoundingClientRect();
    const total = horiz ? rootRect.width : rootRect.height;
    let handleTotal = 0;
    for (const h of handles) {
      const hr = h.getBoundingClientRect();
      handleTotal += horiz ? hr.width : hr.height;
    }
    return Math.max(1, total - handleTotal);
  };

  /**
   * Bind pointer & keyboard interactions to all direct `.j-resizable__handle`s.
   */
  const bindHandles = () => {
    handleCleanups.forEach((fn) => fn());
    handleCleanups = [];

    handles.forEach((handle, handleIdx) => {
      let activePointerId = /** @type {number | null} */ (null);
      let startCoord = 0;
      let startLeft = 0;
      let usablePx = 1;
      let latestCoord = 0;

      const isDisabled = () =>
        handle.hasAttribute('data-disabled') || handle.getAttribute('aria-disabled') === 'true';

      const flushDrag = () => {
        dragRaf = null;
        if (activePointerId === null) return;
        const deltaPx = (latestCoord - startCoord) * (isRtl() ? -1 : 1);
        const deltaPct = (deltaPx / usablePx) * 100;
        resizePair(handleIdx, startLeft + deltaPct, true, false);
      };

      /** @param {PointerEvent} e */
      const onPointerDown = (e) => {
        if (e.button !== 0 || isDisabled()) return;
        if (!panels[handleIdx] || !panels[handleIdx + 1]) return;
        e.preventDefault();
        activePointerId = e.pointerId;
        const horiz = getOrientation() === 'horizontal';
        startCoord = horiz ? e.clientX : e.clientY;
        latestCoord = startCoord;
        startLeft = sizes[handleIdx] ?? 0;
        usablePx = measureUsablePx();

        try {
          handle.setPointerCapture(e.pointerId);
        } catch {
          /* ignore synthetic events */
        }
        handle.setAttribute('data-dragging', '');
        root.setAttribute('data-dragging', getOrientation());
        handle.focus({ preventScroll: true });
      };

      /** @param {PointerEvent} e */
      const onPointerMove = (e) => {
        if (activePointerId === null || e.pointerId !== activePointerId) return;
        latestCoord = getOrientation() === 'horizontal' ? e.clientX : e.clientY;
        if (typeof requestAnimationFrame === 'function') {
          if (dragRaf === null) {
            dragRaf = requestAnimationFrame(flushDrag);
          }
        } else {
          flushDrag();
        }
      };

      /** @param {PointerEvent} e */
      const finishDrag = (e) => {
        if (activePointerId === null || e.pointerId !== activePointerId) return;
        if (dragRaf !== null && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(dragRaf);
          dragRaf = null;
        }
        latestCoord = getOrientation() === 'horizontal' ? e.clientX : e.clientY;
        const deltaPx = (latestCoord - startCoord) * (isRtl() ? -1 : 1);
        const deltaPct = (deltaPx / usablePx) * 100;
        activePointerId = null;
        try {
          if (handle.hasPointerCapture(e.pointerId)) {
            handle.releasePointerCapture(e.pointerId);
          }
        } catch {
          /* ignore */
        }
        handle.removeAttribute('data-dragging');
        root.removeAttribute('data-dragging');
        resizePair(handleIdx, startLeft + deltaPct, true, true);
      };

      const toggleAdjacentOrReset = (allowReset = false) => {
        const left = panels[handleIdx];
        const right = panels[handleIdx + 1];
        if (!left || !right) return;
        if (left.collapsible) {
          togglePanel(handleIdx);
        } else if (right.collapsible) {
          togglePanel(handleIdx + 1);
        } else if (allowReset) {
          const defaults = computeDefaultSizes();
          const pairSum = sizes[handleIdx] + sizes[handleIdx + 1];
          const defSum = (defaults[handleIdx] || 50) + (defaults[handleIdx + 1] || 50);
          const targetLeft = defSum > 0 ? (defaults[handleIdx] / defSum) * pairSum : pairSum / 2;
          resizePair(handleIdx, targetLeft, false, true);
        }
      };

      /** @param {MouseEvent} e */
      const onDblClick = (e) => {
        if (isDisabled()) return;
        e.preventDefault();
        toggleAdjacentOrReset(true);
      };

      /** @param {KeyboardEvent} e */
      const onKeyDown = (e) => {
        if (isDisabled()) return;
        const left = panels[handleIdx];
        const right = panels[handleIdx + 1];
        if (!left || !right) return;

        const horiz = getOrientation() === 'horizontal';
        const step = e.shiftKey ? getStep() * 5 : getStep();
        const dirSign = isRtl() ? -1 : 1;
        const pairSum = sizes[handleIdx] + sizes[handleIdx + 1];

        if ((horiz && e.key === 'ArrowLeft') || (!horiz && e.key === 'ArrowUp')) {
          e.preventDefault();
          const delta = -step * (horiz ? dirSign : 1);
          if (delta < 0) {
            if (right.collapsible && checkCollapsed(handleIdx + 1)) {
              expandPanel(handleIdx + 1);
              return;
            }
            if (
              left.collapsible &&
              !checkCollapsed(handleIdx) &&
              sizes[handleIdx] + delta < left.minSize
            ) {
              collapsePanel(handleIdx);
              return;
            }
          } else if (left.collapsible && checkCollapsed(handleIdx)) {
            expandPanel(handleIdx);
            return;
          }
          resizePair(handleIdx, sizes[handleIdx] + delta, false, true);
        } else if ((horiz && e.key === 'ArrowRight') || (!horiz && e.key === 'ArrowDown')) {
          e.preventDefault();
          const delta = step * (horiz ? dirSign : 1);
          if (delta > 0) {
            if (left.collapsible && checkCollapsed(handleIdx)) {
              expandPanel(handleIdx);
              return;
            }
            if (
              right.collapsible &&
              !checkCollapsed(handleIdx + 1) &&
              sizes[handleIdx + 1] - delta < right.minSize
            ) {
              collapsePanel(handleIdx + 1);
              return;
            }
          } else if (right.collapsible && checkCollapsed(handleIdx + 1)) {
            expandPanel(handleIdx + 1);
            return;
          }
          resizePair(handleIdx, sizes[handleIdx] + delta, false, true);
        } else if (e.key === 'Home') {
          e.preventDefault();
          if (left.collapsible) {
            collapsePanel(handleIdx);
          } else {
            const minTarget = Math.max(left.minSize, pairSum - right.maxSize);
            resizePair(handleIdx, minTarget, false, true);
          }
        } else if (e.key === 'End') {
          e.preventDefault();
          if (left.collapsible && checkCollapsed(handleIdx)) {
            expandPanel(handleIdx);
          }
          if (right.collapsible) {
            collapsePanel(handleIdx + 1);
          } else {
            const maxTarget = Math.min(left.maxSize, pairSum - right.minSize);
            resizePair(handleIdx, maxTarget, false, true);
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (left.collapsible || right.collapsible) {
            e.preventDefault();
            toggleAdjacentOrReset(false);
          }
        }
      };

      handle.addEventListener('pointerdown', onPointerDown);
      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', finishDrag);
      handle.addEventListener('pointercancel', finishDrag);
      handle.addEventListener('dblclick', onDblClick);
      handle.addEventListener('keydown', onKeyDown);

      handleCleanups.push(() => {
        handle.removeEventListener('pointerdown', onPointerDown);
        handle.removeEventListener('pointermove', onPointerMove);
        handle.removeEventListener('pointerup', finishDrag);
        handle.removeEventListener('pointercancel', finishDrag);
        handle.removeEventListener('dblclick', onDblClick);
        handle.removeEventListener('keydown', onKeyDown);
      });
    });
  };

  /**
   * Scan DOM children and initialize or reconcile panel sizes.
   * @param {boolean} [isInitial]
   */
  const refresh = (isInitial = false) => {
    const prevIds = panels.map((p) => p.id).join('|');
    collectElements();
    const nextIds = panels.map((p) => p.id).join('|');

    if (panels.length === 0) {
      sizes = [];
      bindHandles();
      return;
    }

    if (isInitial || prevIds !== nextIds || sizes.length !== panels.length) {
      const saved = loadSaved(getStorageKey());
      if (saved && Array.isArray(saved.sizes) && saved.sizes.length === panels.length) {
        const sum = saved.sizes.reduce((a, b) => a + b, 0) || 100;
        sizes = saved.sizes.map((s) => (Math.max(0, Number(s) || 0) / sum) * 100);
        if (saved.openSizes && typeof saved.openSizes === 'object') {
          openSizes = { ...openSizes, ...saved.openSizes };
        }
      } else {
        sizes = computeDefaultSizes();
      }
      lastCollapsedState = {};
      panels.forEach((p, i) => {
        const isCol = checkCollapsed(i, sizes[i]);
        lastCollapsedState[p.id] = isCol;
        if (!isCol && sizes[i] >= p.minSize) openSizes[p.id] = sizes[i];
      });
    }

    bindHandles();
    applySizes(!isInitial, false);
  };

  refresh(true);

  /** @type {ResizeObserver | null} */
  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (typeof requestAnimationFrame === 'function') {
            if (roRaf !== null) cancelAnimationFrame(roRaf);
            roRaf = requestAnimationFrame(() => {
              roRaf = null;
              applySizes(false, false);
            });
          } else {
            applySizes(false, false);
          }
        })
      : null;

  ro?.observe(root);

  /** @type {MutationObserver | null} */
  const mo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver((records) => {
          let structureChanged = false;
          for (const rec of records) {
            if (rec.type === 'childList') structureChanged = true;
          }
          if (structureChanged) refresh(false);
          else applySizes(false, false);
        })
      : null;

  mo?.observe(root, {
    childList: true,
    attributes: true,
    attributeFilter: ['data-orientation'],
  });

  /** @type {ResizableGroupController} */
  const api = {
    getLayout: () => sizes.map((s) => Math.round(s * 100) / 100),
    setLayout: (nextSizes) => {
      if (!Array.isArray(nextSizes) || nextSizes.length !== panels.length) return;
      const clamped = nextSizes.map((raw, i) => {
        const p = panels[i];
        const v = Math.max(0, Number(raw) || 0);
        if (p.collapsible && v <= p.collapsedSize + EPSILON) return p.collapsedSize;
        return clamp(v, p.minSize, p.maxSize);
      });
      const total = clamped.reduce((a, b) => a + b, 0) || 100;
      sizes = clamped.map((s) => (s / total) * 100);
      applySizes(true, true);
    },
    collapsePanel,
    expandPanel,
    togglePanel,
    isPanelCollapsed: (idOrIndex) => {
      const idx = resolvePanelIndex(idOrIndex);
      return idx >= 0 ? checkCollapsed(idx) : false;
    },
    resetLayout: () => {
      clearSaved(getStorageKey());
      sizes = computeDefaultSizes();
      applySizes(true, false);
    },
    refresh: () => refresh(false),
    destroy: () => {
      if (dragRaf !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(dragRaf);
        dragRaf = null;
      }
      if (roRaf !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(roRaf);
        roRaf = null;
      }
      handleCleanups.forEach((fn) => fn());
      handleCleanups = [];
      ro?.disconnect();
      mo?.disconnect();
      root.removeAttribute('data-dragging');
      controllers.delete(root);
    },
  };

  controllers.set(root, api);
  return api;
}

/**
 * Initialize every `.j-resizable` split group inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initResizableGroups(root = document) {
  /** @type {Array<() => void>} */
  const cleanups = [];
  if (
    typeof HTMLElement !== 'undefined' &&
    root instanceof HTMLElement &&
    root.matches('.j-resizable')
  ) {
    const ctrl = createResizableGroup(root);
    cleanups.push(() => ctrl.destroy());
  }
  root.querySelectorAll('.j-resizable').forEach((node) => {
    const ctrl = createResizableGroup(/** @type {HTMLElement} */ (node));
    cleanups.push(() => ctrl.destroy());
  });
  return () => cleanups.forEach((fn) => fn());
}
