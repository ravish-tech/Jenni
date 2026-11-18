// Jenni — Tree View behavior (WAI-ARIA tree pattern with roving focus & expand/collapse).

/** @param {Element} el */
const isDisabled = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/**
 * Check whether a `[role="treeitem"]` is currently visible (no collapsed ancestor branch).
 * @param {HTMLElement} tree
 * @param {HTMLElement} item
 * @returns {boolean}
 */
function isItemVisible(tree, item) {
  /** @type {HTMLElement | null} */
  let cursor = item.parentElement;
  while (cursor && cursor !== tree) {
    if (cursor.hidden || cursor.hasAttribute('data-collapsed')) return false;
    if (cursor.classList.contains('j-tree__node')) {
      const ownerItem = /** @type {HTMLElement | null} */ (
        cursor.querySelector(':scope > [role="treeitem"]')
      );
      if (ownerItem && ownerItem !== item && ownerItem.getAttribute('aria-expanded') === 'false') {
        return false;
      }
    }
    cursor = cursor.parentElement;
  }
  return true;
}

/**
 * All visible, non-disabled `[role="treeitem"]` elements belonging to `tree`.
 * @param {HTMLElement} tree
 * @returns {HTMLElement[]}
 */
export function getVisibleTreeItems(tree) {
  return /** @type {HTMLElement[]} */ (
    [...tree.querySelectorAll('[role="treeitem"]')].filter(
      (el) =>
        el instanceof HTMLElement &&
        el.closest('[role="tree"]') === tree &&
        !isDisabled(el) &&
        isItemVisible(tree, el),
    )
  );
}

/**
 * Update roving `tabindex` across treeitems in `tree`.
 * @param {HTMLElement} tree
 * @param {HTMLElement} activeItem
 */
function focusTreeItem(tree, activeItem) {
  tree.querySelectorAll('[role="treeitem"]').forEach((el) => {
    if (el instanceof HTMLElement && el.closest('[role="tree"]') === tree) {
      el.tabIndex = el === activeItem ? 0 : -1;
    }
  });
  activeItem.focus();
}

/**
 * @typedef {'focus' | 'expand' | 'collapse' | 'select'} TreeKeyActionType
 * @typedef {{ action: TreeKeyActionType, item: HTMLElement }} TreeKeyResult
 */

/**
 * WAI-ARIA TreeView keyboard handler:
 * - ArrowDown / ArrowUp: next / previous visible item
 * - ArrowRight: expand closed parent, or enter first child of open parent
 * - ArrowLeft: collapse open parent, or move to parent treeitem
 * - Home / End: first / last visible item
 * - Enter / Space: select focused item
 *
 * @param {HTMLElement} tree
 * @param {KeyboardEvent} event
 * @returns {TreeKeyResult | null}
 */
export function treeKeydown(tree, event) {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active.getAttribute('role') !== 'treeitem') return null;
  if (active.closest('[role="tree"]') !== tree) return null;

  const items = getVisibleTreeItems(tree);
  const idx = items.indexOf(active);
  if (idx < 0) return null;

  const rtl = getComputedStyle(tree).direction === 'rtl';
  const expandKey = rtl ? 'ArrowLeft' : 'ArrowRight';
  const collapseKey = rtl ? 'ArrowRight' : 'ArrowLeft';

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const next = items[Math.min(idx + 1, items.length - 1)];
    if (next && next !== active) focusTreeItem(tree, next);
    return next ? { action: 'focus', item: next } : null;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    const prev = items[Math.max(idx - 1, 0)];
    if (prev && prev !== active) focusTreeItem(tree, prev);
    return prev ? { action: 'focus', item: prev } : null;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    const first = items[0];
    if (first) focusTreeItem(tree, first);
    return first ? { action: 'focus', item: first } : null;
  }

  if (event.key === 'End') {
    event.preventDefault();
    const last = items[items.length - 1];
    if (last) focusTreeItem(tree, last);
    return last ? { action: 'focus', item: last } : null;
  }

  if (event.key === expandKey) {
    const expanded = active.getAttribute('aria-expanded');
    if (expanded === 'false') {
      event.preventDefault();
      return { action: 'expand', item: active };
    }
    if (expanded === 'true') {
      const node = active.closest('.j-tree__node');
      const childItems = node
        ? /** @type {HTMLElement[]} */ (
            [...node.querySelectorAll('[role="treeitem"]')].filter(
              (el) =>
                el instanceof HTMLElement &&
                el !== active &&
                el.closest('[role="tree"]') === tree &&
                !isDisabled(el) &&
                isItemVisible(tree, el),
            )
          )
        : [];
      if (childItems[0]) {
        event.preventDefault();
        focusTreeItem(tree, childItems[0]);
        return { action: 'focus', item: childItems[0] };
      }
    }
    return null;
  }

  if (event.key === collapseKey) {
    const expanded = active.getAttribute('aria-expanded');
    if (expanded === 'true') {
      event.preventDefault();
      return { action: 'collapse', item: active };
    }
    const ownNode = active.closest('.j-tree__node');
    const parentNode = ownNode?.parentElement?.closest('.j-tree__node');
    if (parentNode && tree.contains(parentNode)) {
      const parentItem = /** @type {HTMLElement | null} */ (
        parentNode.querySelector(':scope > [role="treeitem"]')
      );
      if (parentItem && !isDisabled(parentItem)) {
        event.preventDefault();
        focusTreeItem(tree, parentItem);
        return { action: 'focus', item: parentItem };
      }
    }
    return null;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    return { action: 'select', item: active };
  }

  return null;
}

/**
 * Wire one `.j-tree` root for plain-HTML usage. Skips `[data-j-managed]`.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function createTreeView(root) {
  if (root.hasAttribute('data-j-managed')) return () => {};

  const multiple = root.getAttribute('aria-multiselectable') === 'true';

  const ensureRovingTabIndex = () => {
    const visible = getVisibleTreeItems(root);
    if (!visible.length) return;
    const currentFocusable = visible.find((el) => el.tabIndex === 0);
    if (currentFocusable) return;
    const selected = visible.find((el) => el.getAttribute('aria-selected') === 'true');
    const target = selected ?? visible[0];
    visible.forEach((el) => {
      el.tabIndex = el === target ? 0 : -1;
    });
  };

  ensureRovingTabIndex();

  /**
   * @param {HTMLElement} item
   * @param {boolean} nextOpen
   */
  const setExpanded = (item, nextOpen) => {
    if (!item.hasAttribute('aria-expanded')) return;
    item.setAttribute('aria-expanded', String(nextOpen));
    root.dispatchEvent(
      new CustomEvent('j-toggle', {
        bubbles: true,
        detail: { value: item.dataset.value ?? item.id, expanded: nextOpen, item },
      }),
    );
  };

  /** @param {HTMLElement} item */
  const toggleSelect = (item) => {
    if (isDisabled(item)) return;
    if (multiple) {
      const next = item.getAttribute('aria-selected') !== 'true';
      item.setAttribute('aria-selected', String(next));
    } else {
      root.querySelectorAll('[role="treeitem"]').forEach((el) => {
        if (el.closest('[role="tree"]') === root) {
          el.setAttribute('aria-selected', String(el === item));
        }
      });
    }
    const selected = [...root.querySelectorAll('[role="treeitem"][aria-selected="true"]')]
      .filter((el) => el.closest('[role="tree"]') === root)
      .map((el) => /** @type {HTMLElement} */ (el).dataset.value ?? el.id);

    root.dispatchEvent(
      new CustomEvent('j-change', {
        bubbles: true,
        detail: { value: multiple ? selected : selected[0] ?? '', item },
      }),
    );
  };

  /** @param {MouseEvent} event */
  const onClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest('[role="treeitem"]');
    if (!(item instanceof HTMLElement) || item.closest('[role="tree"]') !== root || isDisabled(item)) {
      return;
    }

    focusTreeItem(root, item);
    const hitChevron = Boolean(target.closest('.j-tree__chevron'));
    if (item.hasAttribute('aria-expanded')) {
      const isOpen = item.getAttribute('aria-expanded') === 'true';
      if (hitChevron) {
        setExpanded(item, !isOpen);
        return;
      }
      setExpanded(item, !isOpen);
    }
    toggleSelect(item);
  };

  /** @param {KeyboardEvent} event */
  const onKeydown = (event) => {
    const res = treeKeydown(root, event);
    if (!res) return;
    if (res.action === 'expand') setExpanded(res.item, true);
    else if (res.action === 'collapse') setExpanded(res.item, false);
    else if (res.action === 'select') toggleSelect(res.item);
  };

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeydown);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every `.j-tree` inside `root`. Idempotent.
 * @param {ParentNode} [root=document]
 * @returns {() => void} cleanup
 */
export function initTreeViews(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-tree').forEach((el) => {
    const tree = /** @type {HTMLElement} */ (el);
    if (tree.hasAttribute('data-j-managed') || bound.has(tree)) return;
    bound.set(tree, createTreeView(tree));
    made.push(tree);
  });
  return () =>
    made.forEach((t) => {
      bound.get(t)?.();
      bound.delete(t);
    });
}
