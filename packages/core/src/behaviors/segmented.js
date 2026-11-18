// Jenni — Segmented Control behavior (WAI-ARIA radiogroup pattern + FLIP indicator).

/** @param {Element} el */
const isDisabled = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/**
 * Direct item buttons belonging to a `.j-segmented` root.
 * @param {HTMLElement} root
 * @returns {HTMLElement[]}
 */
export function getSegmentedItems(root) {
  return /** @type {HTMLElement[]} */ (
    [...root.querySelectorAll('.j-segmented__item')].filter((el) => el.closest('.j-segmented') === root)
  );
}

/**
 * Sync the gliding `.j-segmented__indicator` using FLIP (`translate` + `scale` only, zero bounce).
 * @param {HTMLElement} root
 * @param {boolean} [animate]
 */
export function syncSegmentedIndicator(root, animate = true) {
  let ind = /** @type {HTMLElement | null} */ (root.querySelector(':scope > .j-segmented__indicator'));
  if (!ind) {
    ind = document.createElement('span');
    ind.className = 'j-segmented__indicator';
    ind.setAttribute('aria-hidden', 'true');
    root.prepend(ind);
  }
  const active = getSegmentedItems(root).find(
    (el) => el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-selected') === 'true',
  );
  if (!active || active.offsetParent === null) {
    root.removeAttribute('data-indicator');
    return;
  }

  const before = ind.getBoundingClientRect();
  const hadBox = root.hasAttribute('data-indicator') && before.width > 0 && before.height > 0;
  ind.style.setProperty('--_ind-x', `${active.offsetLeft}px`);
  ind.style.setProperty('--_ind-y', `${active.offsetTop}px`);
  ind.style.setProperty('--_ind-w', `${active.offsetWidth}px`);
  ind.style.setProperty('--_ind-h', `${active.offsetHeight}px`);
  root.setAttribute('data-indicator', '');

  if (!animate || !hadBox) return;
  ind.style.transition = 'none';
  ind.style.translate = '';
  ind.style.scale = '';
  const after = ind.getBoundingClientRect();
  if (!after.width || !after.height) {
    ind.style.transition = '';
    return;
  }
  const dx = before.left - after.left;
  const dy = before.top - after.top;
  const sx = before.width / after.width;
  const sy = before.height / after.height;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) {
    ind.style.transition = '';
    return;
  }
  ind.style.translate = `${dx}px ${dy}px`;
  ind.style.scale = `${sx} ${sy}`;
  void ind.offsetWidth;
  ind.style.transition = '';
  ind.style.translate = '';
  ind.style.scale = '';
}

/**
 * Handle roving keyboard navigation inside `.j-segmented`.
 * @param {HTMLElement} root
 * @param {KeyboardEvent} e
 * @returns {HTMLElement | null}
 */
export function segmentedKeydown(root, e) {
  if (isDisabled(root)) return null;
  const rtl = getComputedStyle(root).direction === 'rtl';
  const items = getSegmentedItems(root).filter((el) => !isDisabled(el));
  if (!items.length) return null;
  const current = /** @type {HTMLElement | null} */ (
    document.activeElement instanceof HTMLElement ? document.activeElement.closest('.j-segmented__item') : null
  );
  const idx = current ? items.indexOf(current) : -1;
  if (idx < 0) return null;

  const nextKeys = rtl ? ['ArrowLeft', 'ArrowDown'] : ['ArrowRight', 'ArrowDown'];
  const prevKeys = rtl ? ['ArrowRight', 'ArrowUp'] : ['ArrowLeft', 'ArrowUp'];
  /** @type {HTMLElement | undefined} */
  let target;
  if (nextKeys.includes(e.key)) target = items[(idx + 1) % items.length];
  else if (prevKeys.includes(e.key)) target = items[(idx - 1 + items.length) % items.length];
  else if (e.key === 'Home') target = items[0];
  else if (e.key === 'End') target = items[items.length - 1];
  if (!target) return null;
  e.preventDefault();
  target.focus();
  return target;
}

/**
 * Wire one `.j-segmented` root for plain HTML.
 * @param {HTMLElement} root
 * @returns {() => void}
 */
export function createSegmented(root) {
  if (!root.hasAttribute('role')) root.setAttribute('role', 'radiogroup');
  const items = getSegmentedItems(root);
  items.forEach((item) => {
    if (!item.hasAttribute('role')) item.setAttribute('role', 'radio');
  });

  /** @param {HTMLElement} item @param {boolean} [notify] */
  const select = (item, notify = true) => {
    getSegmentedItems(root).forEach((el) => {
      const checked = el === item;
      el.setAttribute('aria-checked', String(checked));
      el.tabIndex = checked ? 0 : -1;
    });
    syncSegmentedIndicator(root, notify);
    if (notify) {
      const value = item.dataset.value ?? item.textContent?.trim() ?? '';
      root.dispatchEvent(new CustomEvent('j-change', { bubbles: true, detail: { value, item } }));
    }
  };

  const initial =
    items.find(
      (el) =>
        (el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-selected') === 'true') && !isDisabled(el),
    ) || items.find((el) => !isDisabled(el));
  if (initial) select(initial, false);

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    if (isDisabled(root)) return;
    const item = /** @type {HTMLElement | null} */ (
      e.target instanceof Element ? e.target.closest('.j-segmented__item') : null
    );
    if (!item || item.closest('.j-segmented') !== root || isDisabled(item)) return;
    if (item.getAttribute('aria-checked') !== 'true') select(item, true);
  };

  /** @param {KeyboardEvent} e */
  const onKeydown = (e) => {
    const target = segmentedKeydown(root, e);
    if (target && target.getAttribute('aria-checked') !== 'true') select(target, true);
  };

  /** @type {number | null} */
  let raf = null;
  const ro = new ResizeObserver(() => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = null;
      syncSegmentedIndicator(root, false);
    });
  });
  ro.observe(root);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);

  return () => {
    if (raf !== null) cancelAnimationFrame(raf);
    ro.disconnect();
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeydown);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every unmanaged `.j-segmented` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initSegmented(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-segmented:not([data-j-managed])').forEach((el) => {
    const seg = /** @type {HTMLElement} */ (el);
    if (bound.has(seg)) return;
    bound.set(seg, createSegmented(seg));
    made.push(seg);
  });
  return () =>
    made.forEach((seg) => {
      bound.get(seg)?.();
      bound.delete(seg);
    });
}
