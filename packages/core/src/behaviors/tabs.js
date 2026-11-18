// Jenni — Tabs behavior (WAI-ARIA tabs pattern).
// Markup:
//   <div class="j-tabs" data-variant="underline">
//     <div class="j-tabs__list" role="tablist" aria-label="Settings">
//       <button class="j-tabs__tab" role="tab" aria-selected="true" aria-controls="p-1">General</button>
//       <button class="j-tabs__tab" role="tab" aria-controls="p-2">Billing</button>
//     </div>
//     <div class="j-tabs__panel" role="tabpanel" id="p-1">…</div>
//     <div class="j-tabs__panel" role="tabpanel" id="p-2" hidden>…</div>
//   </div>
// Adds roving tabindex, arrow/Home/End keys, automatic (or `data-activation="manual"`)
// activation and the sliding indicator. Without JS the selected tab still
// shows a static indicator.

let uid = 0;

/** @param {Element} el */
const isDisabled = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/**
 * Tabs that belong to `list` (not to a nested tab set).
 * @param {HTMLElement} list
 * @returns {HTMLElement[]}
 */
export function getTabs(list) {
  return /** @type {HTMLElement[]} */ ([...list.querySelectorAll('[role="tab"]')]
    .filter((t) => t.closest('[role="tablist"]') === list));
}

/**
 * Move the sliding indicator to the selected tab. Uses FLIP: the box is
 * placed at its final size at once, then animated from the old box with
 * `translate` + `scale` only (no layout animation).
 * @param {HTMLElement} list
 * @param {boolean} [animate]
 */
export function syncTabIndicator(list, animate = true) {
  let ind = /** @type {HTMLElement | null} */ (list.querySelector(':scope > .j-tabs__indicator'));
  if (!ind) {
    ind = document.createElement('span');
    ind.className = 'j-tabs__indicator';
    ind.setAttribute('aria-hidden', 'true');
    list.prepend(ind);
  }
  const tab = getTabs(list).find((t) => t.getAttribute('aria-selected') === 'true');
  if (!tab || tab.offsetParent === null) return;

  const before = ind.getBoundingClientRect();
  const hadBox = list.hasAttribute('data-indicator') && before.width > 0 && before.height > 0;
  ind.style.setProperty('--_ind-x', `${tab.offsetLeft}px`);
  ind.style.setProperty('--_ind-y', `${tab.offsetTop}px`);
  ind.style.setProperty('--_ind-w', `${tab.offsetWidth}px`);
  ind.style.setProperty('--_ind-h', `${tab.offsetHeight}px`);
  list.setAttribute('data-indicator', '');

  if (!animate || !hadBox) return;
  ind.style.transition = 'none';
  ind.style.translate = '';
  ind.style.scale = '';
  const after = ind.getBoundingClientRect();
  if (!after.width || !after.height) { ind.style.transition = ''; return; }
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
  void ind.offsetWidth; // commit the "from" frame
  ind.style.transition = '';
  ind.style.translate = '';
  ind.style.scale = '';
}

/**
 * Handle roving-focus keys inside a tablist. Focuses and returns the new tab,
 * or null when the key is not a navigation key.
 * @param {HTMLElement} list
 * @param {KeyboardEvent} e
 * @returns {HTMLElement | null}
 */
export function tabsKeydown(list, e) {
  const vertical = list.getAttribute('aria-orientation') === 'vertical';
  const rtl = getComputedStyle(list).direction === 'rtl';
  const tabs = getTabs(list).filter((t) => !isDisabled(t));
  const i = tabs.indexOf(/** @type {HTMLElement} */ (document.activeElement));
  if (i < 0) return null;
  const next = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
  const prev = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
  /** @type {HTMLElement | undefined} */
  let target;
  if (e.key === next) target = tabs[(i + 1) % tabs.length];
  else if (e.key === prev) target = tabs[(i - 1 + tabs.length) % tabs.length];
  else if (e.key === 'Home') target = tabs[0];
  else if (e.key === 'End') target = tabs[tabs.length - 1];
  if (!target) return null;
  e.preventDefault();
  target.focus();
  return target;
}

/**
 * Wire one `.j-tabs` root. Fires `j-change` (detail: { value, tab }) on the root.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function createTabs(root) {
  const list = /** @type {HTMLElement | null} */ (
    [...root.querySelectorAll('[role="tablist"]')].find((l) => l.closest('.j-tabs') === root) || null
  );
  if (!list) return () => {};
  const manual = root.dataset.activation === 'manual';
  if (root.dataset.orientation === 'vertical') list.setAttribute('aria-orientation', 'vertical');
  const base = `j-tabs-${++uid}`;
  const tabs = getTabs(list);

  tabs.forEach((tab, n) => {
    if (!tab.id) tab.id = `${base}-tab-${n}`;
    const panel = document.getElementById(tab.getAttribute('aria-controls') || '');
    if (panel) {
      if (!panel.hasAttribute('aria-labelledby')) panel.setAttribute('aria-labelledby', tab.id);
      if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
    }
  });

  /** @param {HTMLElement} tab @param {boolean} [notify] */
  const select = (tab, notify = true) => {
    getTabs(list).forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls') || '');
      if (panel) panel.hidden = !on;
    });
    syncTabIndicator(list, notify);
    if (notify) {
      root.dispatchEvent(new CustomEvent('j-change', { bubbles: true, detail: { value: tab.dataset.value ?? tab.id, tab } }));
    }
  };

  const initial = tabs.find((t) => t.getAttribute('aria-selected') === 'true' && !isDisabled(t))
    || tabs.find((t) => !isDisabled(t));
  if (initial) select(initial, false);

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const tab = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[role="tab"]'));
    if (!tab || tab.closest('[role="tablist"]') !== list || isDisabled(tab)) return;
    if (tab.getAttribute('aria-selected') !== 'true') select(tab);
  };
  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    const tab = tabsKeydown(list, e);
    if (tab && !manual) select(tab);
  };
  /** @type {number | null} */
  let raf = null;
  const ro = new ResizeObserver(() => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = null;
      syncTabIndicator(list, false);
    });
  });
  ro.observe(list);
  list.addEventListener('click', onClick);
  list.addEventListener('keydown', onKey);
  return () => {
    if (raf !== null) cancelAnimationFrame(raf);
    ro.disconnect();
    list.removeEventListener('click', onClick);
    list.removeEventListener('keydown', onKey);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every `.j-tabs` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initTabs(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-tabs').forEach((el) => {
    const tabs = /** @type {HTMLElement} */ (el);
    if (bound.has(tabs)) return;
    bound.set(tabs, createTabs(tabs));
    made.push(tabs);
  });
  return () => made.forEach((t) => {
    bound.get(t)?.();
    bound.delete(t);
  });
}
