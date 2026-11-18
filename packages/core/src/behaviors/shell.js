// Jenni — AppShell responsive drawer & inspector/copilot sidecar behavior.
// Wires `[data-shell-toggle]`, `[data-shell-aside-toggle]`, `[data-shell-dock-toggle]`,
// `.j-shell__backdrop` click, `inert` management, focus entry/trap/restore, and `Escape`.
// Idempotent & framework-friendly.

/** @type {WeakMap<HTMLElement, ShellController>} */
const controllers = new WeakMap();

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @typedef {Object} ShellOptions
 * @property {(open: boolean) => void} [onOpenChange]
 * @property {(open: boolean) => void} [onAsideOpenChange]
 * @property {(open: boolean) => void} [onAsideDrawerChange]
 * @property {(open: boolean) => void} [onDockOpenChange]
 * @property {(open: boolean) => void} [onEffectiveAsideChange]
 */

/**
 * @typedef {Object} ShellController
 * @property {() => boolean} isOpen
 * @property {(next?: boolean) => void} toggle
 * @property {() => void} open
 * @property {() => void} close
 * @property {() => boolean} isAsideDrawerOpen
 * @property {(next?: boolean) => void} toggleAsideDrawer
 * @property {(next?: boolean) => void} toggleAside
 * @property {(force?: boolean) => boolean} toggleDock
 * @property {() => boolean} isEffectiveAsideOpen
 * @property {() => void} destroy
 */

/**
 * Attach drawer and sidecar behavior to a `.j-shell` element.
 * @param {HTMLElement} shell
 * @param {ShellOptions} [options]
 * @returns {ShellController}
 */
export function createShell(shell, options = {}) {
  const existing = controllers.get(shell);
  if (existing) return existing;

  /** @param {Element} el */
  const owns = (el) => el.closest('.j-shell') === shell;

  /**
   * Query elements inside `shell` excluding nested `.j-shell` instances.
   * @param {string} selector
   * @returns {HTMLElement[]}
   */
  const queryOwned = (selector) =>
    /** @type {HTMLElement[]} */ ([...shell.querySelectorAll(selector)].filter(owns));

  const getLayout = () => shell.dataset.layout || 'sidebar';
  const isOpen = () => shell.hasAttribute('data-sidebar-open');
  const isAsideDrawerOpen = () => shell.hasAttribute('data-aside-open');
  const isAsideCollapsed = () => shell.hasAttribute('data-aside-collapsed');
  const isDockOpen = () => !shell.hasAttribute('data-dock-collapsed');

  const getAsideBreakpoint = () => {
    const layout = getLayout();
    if (layout === 'floating-dock') return 760;
    if (layout === 'holy-grail' || layout === 'copilot') return 1024;
    return 960;
  };

  const isNarrowSidebar = () => {
    const w = shell.clientWidth;
    if (w <= 0) return false;
    const layout = getLayout();
    if (
      layout === 'centered' ||
      layout === 'bars' ||
      layout === 'topnav' ||
      layout === 'focus' ||
      layout === 'floating-dock'
    ) {
      return false;
    }
    if (w < 720) return true;
    if ((layout === 'dual-nav' || layout === 'ide') && w < 900) return true;
    return false;
  };

  const isNarrowAside = () => {
    const w = shell.clientWidth;
    return w > 0 && w < getAsideBreakpoint();
  };

  const isEffectiveAsideOpen = () =>
    isNarrowAside() ? isAsideDrawerOpen() : !isAsideCollapsed();

  /** @type {Set<HTMLElement>} */
  const bgInerted = new Set();
  /** @type {HTMLElement | null} */
  let lastTrigger = null;
  /** @type {number | null} */
  let focusRaf = null;
  /** @type {boolean} */
  let modalListenerBound = false;
  /** @type {'sidebar' | 'aside' | null} */
  let activeModalKind = null;
  /** @type {boolean | undefined} */
  let lastEffectiveAside;

  const syncAria = () => {
    const openStr = String(isOpen());
    queryOwned('[data-shell-toggle]').forEach((btn) => {
      btn.setAttribute('aria-expanded', openStr);
    });

    const asideStr = String(isEffectiveAsideOpen());
    queryOwned('[data-shell-aside-toggle]').forEach((btn) => {
      btn.setAttribute('aria-expanded', asideStr);
    });

    const dockStr = String(isDockOpen());
    queryOwned('[data-shell-dock-toggle]').forEach((btn) => {
      btn.setAttribute('aria-expanded', dockStr);
    });
  };

  const getActiveDrawerElements = () => {
    const w = shell.clientWidth;
    const layout = getLayout();
    if (isNarrowAside() && isAsideDrawerOpen()) {
      return queryOwned('.j-shell__aside');
    }
    if (isOpen() && w > 0) {
      if (w < 720) {
        return queryOwned('.j-shell__rail, .j-sidebar, .j-shell__sidebar, .j-shell__subnav').filter(
          (el, _, arr) => !arr.some((other) => other !== el && other.contains(el)),
        );
      }
      if ((layout === 'dual-nav' || layout === 'ide') && w < 900) {
        return queryOwned('.j-shell__subnav');
      }
    }
    return [];
  };

  /**
   * @param {HTMLElement[]} drawers
   * @returns {HTMLElement[]}
   */
  const getFocusableInDrawers = (drawers) => {
    /** @type {HTMLElement[]} */
    const result = [];
    for (const drawer of drawers) {
      const candidates = /** @type {HTMLElement[]} */ ([
        ...drawer.querySelectorAll(FOCUSABLE_SELECTOR),
      ]);
      for (const el of candidates) {
        if (!owns(el)) continue;
        if (el.closest('[inert]')) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        result.push(el);
      }
    }
    return result;
  };

  const clearBgInert = () => {
    for (const el of bgInerted) {
      el.inert = false;
    }
    bgInerted.clear();
  };

  const restoreFocus = () => {
    const target = lastTrigger;
    lastTrigger = null;
    if (target && target.isConnected && typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
    }
  };

  /** @param {KeyboardEvent} e */
  const onDocumentKeydown = (e) => {
    const drawers = getActiveDrawerElements();
    if (!drawers.length) return;

    if (e.key === 'Escape') {
      if (typeof document !== 'undefined') {
        if (document.querySelector('dialog[open]')) return;
        try {
          if (document.querySelector(':popover-open')) return;
        } catch {
          // Ignore if engine lacks :popover-open selector support
        }
      }
      e.preventDefault();
      e.stopPropagation();
      if (isAsideDrawerOpen()) setAsideDrawer(false, true);
      if (isOpen()) setOpen(false, true);
      return;
    }

    if (e.key === 'Tab') {
      const focusables = getFocusableInDrawers(drawers);
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && drawers.some((d) => d.contains(active));

      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (!inside || active === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    }
  };

  const bindModalKeydown = () => {
    if (modalListenerBound || typeof document === 'undefined') return;
    document.addEventListener('keydown', onDocumentKeydown, true);
    modalListenerBound = true;
  };

  const unbindModalKeydown = () => {
    if (!modalListenerBound || typeof document === 'undefined') return;
    document.removeEventListener('keydown', onDocumentKeydown, true);
    modalListenerBound = false;
  };

  const syncInertAndModal = () => {
    const w = shell.clientWidth;
    const layout = getLayout();
    const open = isOpen();
    const asideDrawer = isAsideDrawerOpen();
    const narrowAside = isNarrowAside();

    // First release any previously-inerted background siblings before recomputing.
    clearBgInert();

    const sidebarRoots = queryOwned('.j-sidebar, .j-shell__sidebar').filter(
      (el) => !el.closest('.j-shell__rail, .j-shell__subnav'),
    );
    const railEls = queryOwned('.j-shell__rail');
    const subnavEls = queryOwned('.j-shell__subnav');
    const asideEls = queryOwned('.j-shell__aside');

    // 1. Primary navigation / subnav off-canvas inert state
    if (w > 0 && w < 720) {
      const shouldInertNav = !open;
      for (const el of sidebarRoots) el.inert = shouldInertNav;
      for (const el of railEls) el.inert = shouldInertNav;
      for (const el of subnavEls) el.inert = shouldInertNav;
    } else if (w >= 720 && w < 900 && (layout === 'dual-nav' || layout === 'ide')) {
      for (const el of sidebarRoots) el.inert = false;
      for (const el of railEls) el.inert = false;
      for (const el of subnavEls) el.inert = !open;
    } else {
      for (const el of sidebarRoots) el.inert = false;
      for (const el of railEls) el.inert = false;
      for (const el of subnavEls) el.inert = false;
    }

    // 2. Aside off-canvas / collapsed inert state
    for (const el of asideEls) {
      if (narrowAside) {
        el.inert = !asideDrawer;
      } else {
        el.inert = isAsideCollapsed() || el.hasAttribute('data-collapsed');
      }
    }

    // 3. Determine active modal drawer (if any)
    /** @type {'sidebar' | 'aside' | null} */
    let nextModalKind = null;
    const drawers = getActiveDrawerElements();
    if (drawers.length > 0) {
      if (narrowAside && asideDrawer) nextModalKind = 'aside';
      else if (isNarrowSidebar() && open) nextModalKind = 'sidebar';
    }

    if (nextModalKind) {
      if (!activeModalKind && typeof document !== 'undefined') {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          document.body.contains(active) &&
          !drawers.some((d) => d.contains(active))
        ) {
          lastTrigger = active;
        }
      }

      // Inert background sibling panes while keeping `.j-shell__backdrop` clickable.
      const bgSelectors =
        '.j-shell__main, .j-shell__detail, .j-shell__master, .j-shell__dock, .j-shell__statusbar, .j-shell__banner, .j-shell__subbar, .j-subbar, .j-topbar, .j-bottombar';
      const candidates = [
        ...queryOwned(bgSelectors),
        ...sidebarRoots,
        ...railEls,
        ...subnavEls,
        ...asideEls,
      ];

      for (const el of candidates) {
        if (drawers.includes(el)) continue;
        if (drawers.some((d) => el.contains(d) || d.contains(el))) continue;
        if (!el.inert) {
          el.inert = true;
          bgInerted.add(el);
        }
      }

      bindModalKeydown();

      if (activeModalKind !== nextModalKind && typeof requestAnimationFrame !== 'undefined') {
        if (focusRaf !== null) cancelAnimationFrame(focusRaf);
        focusRaf = requestAnimationFrame(() => {
          focusRaf = null;
          const currentDrawers = getActiveDrawerElements();
          if (!currentDrawers.length) return;
          const active = document.activeElement;
          if (active instanceof Node && currentDrawers.some((d) => d.contains(active))) return;
          const focusables = getFocusableInDrawers(currentDrawers);
          if (focusables.length > 0) {
            focusables[0].focus({ preventScroll: true });
          } else {
            const fallback = currentDrawers[0];
            if (!fallback.hasAttribute('tabindex')) fallback.setAttribute('tabindex', '-1');
            fallback.focus({ preventScroll: true });
          }
        });
      }
    } else {
      if (focusRaf !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(focusRaf);
        focusRaf = null;
      }
      unbindModalKeydown();
    }

    activeModalKind = nextModalKind;
  };

  const syncState = () => {
    syncAria();
    syncInertAndModal();
    const eff = isEffectiveAsideOpen();
    if (eff !== lastEffectiveAside) {
      lastEffectiveAside = eff;
      options.onEffectiveAsideChange?.(eff);
    }
  };

  /**
   * @param {boolean} next
   * @param {boolean} [shouldRestoreFocus]
   */
  const setOpen = (next, shouldRestoreFocus = false) => {
    const prev = isOpen();
    const wasModal = activeModalKind === 'sidebar';
    if (next) {
      if (
        !wasModal &&
        isNarrowSidebar() &&
        typeof document !== 'undefined' &&
        document.activeElement instanceof HTMLElement &&
        document.body.contains(document.activeElement)
      ) {
        lastTrigger = document.activeElement;
      }
      shell.setAttribute('data-sidebar-open', '');
      if (isAsideDrawerOpen()) setAsideDrawer(false, false);
    } else {
      shell.removeAttribute('data-sidebar-open');
    }

    syncState();

    if (!next && prev && (shouldRestoreFocus || wasModal) && !activeModalKind) {
      restoreFocus();
    }

    if (prev !== next) {
      options.onOpenChange?.(next);
      shell.dispatchEvent(new CustomEvent('j-shell-toggle', { detail: { open: next } }));
    }
  };

  /**
   * @param {boolean} next
   * @param {boolean} [shouldRestoreFocus]
   */
  const setAsideDrawer = (next, shouldRestoreFocus = false) => {
    const prev = isAsideDrawerOpen();
    const wasModal = activeModalKind === 'aside';
    if (next) {
      if (
        !wasModal &&
        isNarrowAside() &&
        typeof document !== 'undefined' &&
        document.activeElement instanceof HTMLElement &&
        document.body.contains(document.activeElement)
      ) {
        lastTrigger = document.activeElement;
      }
      shell.setAttribute('data-aside-open', '');
      if (isOpen()) setOpen(false, false);
    } else {
      shell.removeAttribute('data-aside-open');
    }

    syncState();

    if (!next && prev && (shouldRestoreFocus || wasModal) && !activeModalKind) {
      restoreFocus();
    }

    if (prev !== next) {
      options.onAsideDrawerChange?.(next);
      shell.dispatchEvent(new CustomEvent('j-shell-aside-drawer', { detail: { open: next } }));
    }
  };

  /** @param {boolean} [next] */
  const toggleAside = (next) => {
    if (isNarrowAside()) {
      const target = typeof next === 'boolean' ? next : !isAsideDrawerOpen();
      setAsideDrawer(target, !target);
      return;
    }
    const currentlyOpen = !isAsideCollapsed();
    const targetOpen = typeof next === 'boolean' ? next : !currentlyOpen;
    if (targetOpen) shell.removeAttribute('data-aside-collapsed');
    else shell.setAttribute('data-aside-collapsed', '');
    syncState();
    if (targetOpen !== currentlyOpen) {
      options.onAsideOpenChange?.(targetOpen);
      shell.dispatchEvent(new CustomEvent('j-shell-aside-toggle', { detail: { open: targetOpen } }));
    }
  };

  /** @param {boolean} [force] */
  const toggleDock = (force) => {
    const currentlyOpen = isDockOpen();
    const nextOpen = typeof force === 'boolean' ? force : !currentlyOpen;
    if (nextOpen) shell.removeAttribute('data-dock-collapsed');
    else shell.setAttribute('data-dock-collapsed', '');
    syncState();
    if (nextOpen !== currentlyOpen) {
      options.onDockOpenChange?.(nextOpen);
      shell.dispatchEvent(new CustomEvent('j-shell-dock-toggle', { detail: { open: nextOpen } }));
    }
    return nextOpen;
  };

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const target = /** @type {Element | null} */ (e.target);
    if (!target) return;

    const toggleBtn = target.closest('[data-shell-toggle]');
    if (toggleBtn && owns(toggleBtn)) {
      e.preventDefault();
      const next = !isOpen();
      setOpen(next, !next);
      return;
    }

    const asideBtn = target.closest('[data-shell-aside-toggle]');
    if (asideBtn && owns(asideBtn)) {
      e.preventDefault();
      toggleAside();
      return;
    }

    const dockBtn = target.closest('[data-shell-dock-toggle]');
    if (dockBtn && owns(dockBtn)) {
      e.preventDefault();
      toggleDock();
      return;
    }

    const backdrop = target.closest('.j-shell__backdrop');
    if (backdrop && owns(backdrop)) {
      setOpen(false, true);
      setAsideDrawer(false, true);
    }
  };

  /** @type {ResizeObserver | null} */
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      syncState();
    });
    ro.observe(shell);
  }

  /** @type {MutationObserver | null} */
  let mo = null;
  if (typeof MutationObserver !== 'undefined') {
    mo = new MutationObserver(() => {
      const hadModal = activeModalKind !== null;
      syncState();
      if (hadModal && activeModalKind === null && lastTrigger) {
        restoreFocus();
      }
    });
    mo.observe(shell, {
      attributes: true,
      attributeFilter: [
        'data-sidebar-open',
        'data-aside-open',
        'data-aside-collapsed',
        'data-dock-collapsed',
        'data-layout',
        'data-sidebar-side',
      ],
    });
  }

  shell.addEventListener('click', onClick);
  syncState();

  /** @type {ShellController} */
  const api = {
    isOpen,
    open: () => setOpen(true, false),
    close: () => setOpen(false, true),
    toggle: (next) => {
      const val = typeof next === 'boolean' ? next : !isOpen();
      setOpen(val, !val);
    },
    isAsideDrawerOpen,
    toggleAsideDrawer: (next) => {
      const val = typeof next === 'boolean' ? next : !isAsideDrawerOpen();
      setAsideDrawer(val, !val);
    },
    toggleAside,
    toggleDock,
    isEffectiveAsideOpen,
    destroy: () => {
      if (focusRaf !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(focusRaf);
        focusRaf = null;
      }
      unbindModalKeydown();
      lastTrigger = null;
      activeModalKind = null;
      ro?.disconnect();
      mo?.disconnect();
      clearBgInert();
      queryOwned('.j-sidebar, .j-shell__sidebar, .j-shell__rail, .j-shell__subnav, .j-shell__aside').forEach(
        (el) => {
          el.inert = false;
        },
      );
      shell.removeEventListener('click', onClick);
      controllers.delete(shell);
    },
  };

  controllers.set(shell, api);
  return api;
}

/**
 * Initialize all `.j-shell` roots inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initShells(root = document) {
  /** @type {Array<() => void>} */
  const cleanups = [];
  root.querySelectorAll('.j-shell').forEach((el) => {
    const ctrl = createShell(/** @type {HTMLElement} */ (el));
    cleanups.push(() => ctrl.destroy());
  });
  return () => cleanups.forEach((fn) => fn());
}
