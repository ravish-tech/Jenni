// WAI-ARIA toolbar roving-tabindex behavior.
// Manages ArrowLeft / ArrowRight (or ArrowUp / ArrowDown when vertical), Home,
// and End across toolbar action buttons while skipping text inputs and selects
// so typing and cursor movement inside toolbar search fields work natively.

const TEXT_CONTROL =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"], [contenteditable=""]';

const ROVING_SELECTOR =
  'button, a[href], [role="button"], [role="checkbox"], [role="radio"], [role="switch"]';

/**
 * @typedef {Object} ToolbarOptions
 * @property {'horizontal' | 'vertical'} [orientation]
 * @property {boolean} [loop]
 */

/** @param {Element} el */
const isDisabled = (el) =>
  el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/** @param {Element} el */
const isHidden = (el) => Boolean(el.closest('[hidden], [inert]'));

/**
 * Collect roving-focus action controls belonging directly to `toolbar`
 * (excluding text inputs/selects and items inside nested popovers/menus).
 * @param {HTMLElement} toolbar
 * @returns {HTMLElement[]}
 */
export function getToolbarItems(toolbar) {
  return /** @type {HTMLElement[]} */ (
    [...toolbar.querySelectorAll(ROVING_SELECTOR)].filter((item) => {
      if (isDisabled(item) || isHidden(item)) return false;
      if (item.matches(TEXT_CONTROL)) return false;
      if (item.closest('[popover], [role="menu"], [role="listbox"], dialog')) return false;
      return item.closest('[role="toolbar"], .j-toolbar') === toolbar;
    })
  );
}

/**
 * Attach WAI-ARIA `role="toolbar"` roving `tabindex` and arrow-key navigation.
 * @param {HTMLElement} el
 * @param {ToolbarOptions} [options]
 * @returns {() => void} cleanup
 */
export function createToolbar(el, options = {}) {
  const loop = options.loop ?? true;
  if (!el.hasAttribute('role')) {
    el.setAttribute('role', 'toolbar');
  }

  const isVertical = () =>
    (options.orientation ?? el.dataset.orientation ?? el.getAttribute('aria-orientation')) ===
    'vertical';

  if (isVertical()) {
    el.setAttribute('aria-orientation', 'vertical');
  }

  /** @type {HTMLElement | null} */
  let activeStop = null;

  const syncTabStops = () => {
    const items = getToolbarItems(el);
    if (items.length === 0) {
      activeStop = null;
      return;
    }
    if (!activeStop || !items.includes(activeStop)) {
      activeStop = items.find((item) => item.getAttribute('tabindex') === '0') ?? items[0];
    }
    for (let i = 0; i < items.length; i += 1) {
      const targetTabIndex = items[i] === activeStop ? 0 : -1;
      if (items[i].tabIndex !== targetTabIndex) {
        items[i].tabIndex = targetTabIndex;
      }
    }
  };

  /** @param {FocusEvent} e */
  const onFocusIn = (e) => {
    const target = /** @type {Element | null} */ (e.target);
    if (!target || target.closest(TEXT_CONTROL)) return;
    const item = /** @type {HTMLElement | null} */ (target.closest(ROVING_SELECTOR));
    if (!item) return;
    const items = getToolbarItems(el);
    if (items.includes(item)) {
      activeStop = item;
      syncTabStops();
    }
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = /** @type {Element | null} */ (e.target);
    if (!target) return;

    // Never hijack arrow/Home/End keys inside text inputs, textareas, or selects.
    if (target.closest(TEXT_CONTROL)) return;
    if (target.closest('[popover], [role="menu"], [role="listbox"], dialog')) return;

    const currentItem = /** @type {HTMLElement | null} */ (target.closest(ROVING_SELECTOR));
    if (!currentItem) return;

    const items = getToolbarItems(el);
    const idx = items.indexOf(currentItem);
    if (idx < 0) return;

    const vertical = isVertical();
    const rtl = !vertical && getComputedStyle(el).direction === 'rtl';
    const nextKey = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';

    /** @type {HTMLElement | undefined} */
    let nextItem;
    if (e.key === nextKey) {
      nextItem =
        idx < items.length - 1 ? items[idx + 1] : loop ? items[0] : items[items.length - 1];
    } else if (e.key === prevKey) {
      nextItem = idx > 0 ? items[idx - 1] : loop ? items[items.length - 1] : items[0];
    } else if (e.key === 'Home') {
      nextItem = items[0];
    } else if (e.key === 'End') {
      nextItem = items[items.length - 1];
    }

    if (!nextItem) return;
    e.preventDefault();
    if (nextItem !== currentItem) {
      activeStop = nextItem;
      syncTabStops();
      nextItem.focus();
    }
  };

  syncTabStops();

  const mo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => syncTabStops())
      : null;
  mo?.observe(el, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-disabled', 'hidden'],
  });

  el.addEventListener('focusin', onFocusIn);
  el.addEventListener('keydown', onKeyDown);

  return () => {
    mo?.disconnect();
    el.removeEventListener('focusin', onFocusIn);
    el.removeEventListener('keydown', onKeyDown);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every `.j-toolbar` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initToolbars(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-toolbar').forEach((node) => {
    const toolbar = /** @type {HTMLElement} */ (node);
    if (bound.has(toolbar)) return;
    bound.set(toolbar, createToolbar(toolbar));
    made.push(toolbar);
  });
  return () => {
    made.forEach((toolbar) => {
      bound.get(toolbar)?.();
      bound.delete(toolbar);
    });
  };
}
