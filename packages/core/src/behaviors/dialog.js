// Dialog behavior — invoker commands, backdrop light-dismiss, and default Enter action.
// Markup (all native — invoker commands + <dialog>):
//   <button commandfor="dlg-1" command="show-modal">Open</button>
//   <dialog class="j-dialog" id="dlg-1" closedby="any" aria-labelledby="dlg-1-title">
//     <header class="j-dialog__header"><h2 class="j-dialog__title" id="dlg-1-title">…</h2></header>
//     <div class="j-dialog__body">…</div>
//     <footer class="j-dialog__footer">
//       <button commandfor="dlg-1" command="close">Cancel</button>
//       <button data-default-action commandfor="dlg-1" command="close">Save</button>
//     </footer>
//   </dialog>
// Native: focus trap, Escape, focus restore, top layer. CSS: scroll lock.

/**
 * @typedef {object} DialogDefaultActionOptions
 * @property {boolean | string | (() => boolean | string | undefined)} [defaultAction]
 */

/** @returns {boolean} */
export const supportsCommands = () =>
  typeof HTMLButtonElement !== 'undefined' && 'commandForElement' in HTMLButtonElement.prototype;

/** @returns {boolean} */
export const supportsClosedBy = () =>
  typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;

/**
 * Ask a dialog to close the way Escape would: fires `cancel` first, so
 * listeners can veto. Falls back to `close()` in older browsers.
 * @param {HTMLDialogElement} dialog
 */
export function requestClose(dialog) {
  const d = /** @type {HTMLDialogElement & { requestClose?: () => void }} */ (dialog);
  if (typeof d.requestClose === 'function') { d.requestClose(); return; }
  const evt = new Event('cancel', { cancelable: true });
  if (dialog.dispatchEvent(evt)) dialog.close();
}

/**
 * Close the dialog when the user clicks its backdrop. Press and release must
 * both happen outside the panel, so a text selection drag never closes it.
 * @param {HTMLDialogElement} dialog
 * @returns {() => void} cleanup
 */
export function lightDismiss(dialog) {
  let downOutside = false;
  /** @param {MouseEvent} e */
  const outside = (e) => {
    if (e.target !== dialog) return false;
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  /** @param {PointerEvent} e */
  const onDown = (e) => { downOutside = outside(e); };
  /** @param {MouseEvent} e */
  const onClick = (e) => {
    if (downOutside && outside(e)) requestClose(dialog);
    downOutside = false;
  };
  dialog.addEventListener('pointerdown', onDown);
  dialog.addEventListener('click', onClick);
  return () => {
    dialog.removeEventListener('pointerdown', onDown);
    dialog.removeEventListener('click', onClick);
  };
}

/**
 * Check whether a candidate button is enabled, non-busy, and visible.
 * @param {HTMLElement | null} btn
 * @returns {btn is HTMLElement}
 */
function isActionableButton(btn) {
  if (!btn || !(btn instanceof HTMLElement)) return false;
  if (btn.hidden || btn.closest('[hidden], [inert]')) return false;
  if ('disabled' in btn && Boolean(/** @type {HTMLButtonElement} */ (btn).disabled)) return false;
  if (btn.hasAttribute('disabled')) return false;
  if (btn.getAttribute('aria-disabled') === 'true') return false;
  if (btn.getAttribute('aria-busy') === 'true') return false;
  if (btn.hasAttribute('data-loading')) return false;
  return true;
}

/**
 * Locate the dialog's primary default action button according to `defaultAction`.
 * - `false`: disabled (returns `null`).
 * - `string` (non-empty, not `'true'`): matches footer (or dialog) button by
 *   `[data-action="<name>"]`, `id`, `aria-label`, or trimmed text content.
 * - `true` or omitted: discovers `[data-default-action]` inside `.j-dialog__footer`
 *   (falling back to the dialog panel excluding `.j-dialog__close`).
 * @param {HTMLDialogElement} dialog
 * @param {boolean | string | undefined} [defaultAction]
 * @returns {HTMLElement | null}
 */
export function resolveDialogDefaultButton(dialog, defaultAction) {
  const spec =
    defaultAction !== undefined
      ? defaultAction
      : dialog.hasAttribute('data-default-action')
        ? dialog.getAttribute('data-default-action') || true
        : true;

  if (spec === false || spec === 'false') return null;

  const footer = dialog.querySelector('.j-dialog__footer');
  /** @param {ParentNode} scope */
  const candidatesIn = (scope) =>
    /** @type {HTMLElement[]} */ (
      [...scope.querySelectorAll('button, [role="button"]')].filter(
        (el) =>
          el instanceof HTMLElement &&
          !el.classList.contains('j-dialog__close') &&
          el.closest('dialog') === dialog,
      )
    );

  if (typeof spec === 'string' && spec.trim().length > 0 && spec !== 'true') {
    const name = spec.trim();
    const pool = footer ? [...candidatesIn(footer), ...candidatesIn(dialog)] : candidatesIn(dialog);
    const seen = new Set();
    for (const btn of pool) {
      if (seen.has(btn)) continue;
      seen.add(btn);
      if (
        btn.getAttribute('data-action') === spec ||
        btn.getAttribute('data-action') === name ||
        btn.id === spec ||
        btn.id === name ||
        btn.getAttribute('aria-label') === spec ||
        btn.getAttribute('aria-label') === name ||
        (btn.textContent ?? '').trim() === name
      ) {
        return btn;
      }
    }
    return null;
  }

  const markedPool = footer
    ? [...candidatesIn(footer), ...candidatesIn(dialog)]
    : candidatesIn(dialog);
  for (const btn of markedPool) {
    if (
      btn.hasAttribute('data-default-action') &&
      btn.getAttribute('data-default-action') !== 'false'
    ) {
      return btn;
    }
  }
  return null;
}

/**
 * Focus the dialog's enabled default action button unless an `[autofocus]` target exists.
 * @param {HTMLDialogElement} dialog
 * @param {boolean | string | undefined} [defaultAction]
 * @returns {boolean}
 */
export function focusDialogDefaultAction(dialog, defaultAction) {
  if (!dialog.open) return false;
  const autofocusEl = dialog.querySelector('[autofocus]');
  if (
    autofocusEl instanceof HTMLElement &&
    autofocusEl.closest('dialog') === dialog &&
    !autofocusEl.hasAttribute('disabled') &&
    !autofocusEl.hidden
  ) {
    return false;
  }
  const btn = resolveDialogDefaultButton(dialog, defaultAction);
  if (!isActionableButton(btn)) return false;
  btn.focus({ preventScroll: true });
  return true;
}

/**
 * Determine whether `Enter` at `target` should be left to the focused control.
 * @param {Element | null} target
 * @param {HTMLDialogElement} dialog
 * @returns {boolean}
 */
function shouldIgnoreEnterTarget(target, dialog) {
  try {
    if (dialog.querySelector('[popover]:popover-open')) return true;
  } catch {
    if (dialog.querySelector('[popover][data-open]')) return true;
  }
  if (!target || target === dialog) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  try {
    const openPopover = target.closest('[popover]:popover-open');
    if (openPopover && openPopover !== dialog) return true;
  } catch {
    const openPopover = target.closest('[popover][data-open]');
    if (openPopover && openPopover !== dialog) return true;
  }
  if (
    target.closest(
      'textarea, select, a, summary, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="combobox"], [role="listbox"], [role="menu"], [role="grid"], [role="gridcell"], [role="columnheader"], [role="tree"], [role="treeitem"], [role="tab"], [role="slider"], [role="spinbutton"]',
    )
  ) {
    return true;
  }
  const input = target.closest('input');
  if (input && typeof HTMLInputElement !== 'undefined' && input instanceof HTMLInputElement) {
    const t = (input.type || 'text').toLowerCase();
    if (t !== 'checkbox' && t !== 'radio') return true;
  } else if (input) {
    const t = (input.getAttribute('type') || 'text').toLowerCase();
    if (t !== 'checkbox' && t !== 'radio') return true;
  }
  return false;
}

/**
 * Bind initial default-button focus and `Enter` activation on a `<dialog>` element.
 * @param {HTMLDialogElement} dialog
 * @param {DialogDefaultActionOptions} [options]
 * @returns {() => void} cleanup
 */
export function bindDialogDefaultAction(dialog, options = {}) {
  const getSpec = () =>
    typeof options.defaultAction === 'function' ? options.defaultAction() : options.defaultAction;

  /** @type {number | null} */
  let rafId = null;
  const cancelScheduled = () => {
    if (rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
  };

  const scheduleFocus = () => {
    cancelScheduled();
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        focusDialogDefaultAction(dialog, getSpec());
      });
    } else {
      queueMicrotask(() => {
        focusDialogDefaultAction(dialog, getSpec());
      });
    }
  };

  let wasOpen = Boolean(dialog.open);
  if (wasOpen) scheduleFocus();

  /** @type {MutationObserver | null} */
  let observer = null;
  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      const nowOpen = Boolean(dialog.open);
      if (nowOpen && !wasOpen) {
        wasOpen = true;
        scheduleFocus();
      } else if (!nowOpen) {
        wasOpen = false;
        cancelScheduled();
      }
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  }

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    if (e.defaultPrevented || !dialog.open) return;
    if (
      e.key !== 'Enter' ||
      e.isComposing ||
      e.keyCode === 229 ||
      e.shiftKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) {
      return;
    }

    const target = e.target instanceof Element ? e.target : null;
    if (target) {
      const ownerDialog = target.closest('dialog');
      if (ownerDialog && ownerDialog !== dialog) return;
    }

    if (shouldIgnoreEnterTarget(target, dialog)) return;

    const defaultBtn = resolveDialogDefaultButton(dialog, getSpec());
    if (!isActionableButton(defaultBtn)) return;

    const hitButton = target ? target.closest('button, [role="button"]') : null;
    if (hitButton && hitButton !== defaultBtn) return;

    // When focus is already on a native <button>, let browser-native Enter fire once.
    if (
      hitButton === defaultBtn &&
      typeof HTMLButtonElement !== 'undefined' &&
      defaultBtn instanceof HTMLButtonElement
    ) {
      return;
    }

    e.preventDefault();
    defaultBtn.click();
  };

  dialog.addEventListener('keydown', onKeyDown);

  return () => {
    cancelScheduled();
    observer?.disconnect();
    dialog.removeEventListener('keydown', onKeyDown);
  };
}

/** @param {MouseEvent} e */
function onCommandClick(e) {
  const btn = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('button[commandfor]'));
  if (!btn || /** @type {HTMLButtonElement} */ (btn).disabled) return;
  const target = document.getElementById(btn.getAttribute('commandfor') || '');
  const command = btn.getAttribute('command');
  if (!target || !command) return;
  const dlg = /** @type {HTMLDialogElement} */ (target);
  switch (command) {
    case 'show-modal': if (!dlg.open) dlg.showModal(); break;
    case 'close': if (dlg.open) dlg.close(/** @type {HTMLButtonElement} */ (btn).value || undefined); break;
    case 'request-close': if (dlg.open) requestClose(dlg); break;
    case 'show-popover': target.showPopover(); break;
    case 'hide-popover': target.hidePopover(); break;
    case 'toggle-popover': target.togglePopover(); break;
    default: return;
  }
}

const roots = new WeakSet();
/** @type {WeakMap<HTMLDialogElement, () => void>} */
const dismissers = new WeakMap();
/** @type {WeakMap<HTMLDialogElement, () => void>} */
const defaultBinders = new WeakMap();

/**
 * Polyfill invoker commands, `closedby="any"`, and default Enter actions inside `root`. Idempotent.
 * @param {Document | HTMLElement} [root]
 * @returns {() => void} cleanup
 */
export function initDialogs(root = document) {
  /** @type {Array<() => void>} */
  const undo = [];
  if (!supportsCommands() && !roots.has(root)) {
    roots.add(root);
    const listener = /** @type {EventListener} */ (onCommandClick);
    root.addEventListener('click', listener);
    undo.push(() => { root.removeEventListener('click', listener); roots.delete(root); });
  }
  if (!supportsClosedBy()) {
    root.querySelectorAll('dialog[closedby="any"]:not(.j-alert-dialog):not([role="alertdialog"])').forEach((el) => {
      const dlg = /** @type {HTMLDialogElement} */ (el);
      if (dlg.hasAttribute('data-j-managed') || dismissers.has(dlg)) return;
      dismissers.set(dlg, lightDismiss(dlg));
      undo.push(() => { dismissers.get(dlg)?.(); dismissers.delete(dlg); });
    });
  }
  root.querySelectorAll('dialog.j-dialog:not(.j-alert-dialog):not([role="alertdialog"])').forEach((el) => {
    const dlg = /** @type {HTMLDialogElement} */ (el);
    if (dlg.hasAttribute('data-j-managed') || defaultBinders.has(dlg)) return;
    defaultBinders.set(dlg, bindDialogDefaultAction(dlg));
    undo.push(() => { defaultBinders.get(dlg)?.(); defaultBinders.delete(dlg); });
  });
  return () => undo.forEach((fn) => fn());
}
