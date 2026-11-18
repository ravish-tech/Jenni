// Jenni — Dialog behavior.
// Markup (all native — invoker commands + <dialog>):
//   <button commandfor="dlg-1" command="show-modal">Open</button>
//   <dialog class="j-dialog" id="dlg-1" closedby="any" aria-labelledby="dlg-1-title">
//     <header class="j-dialog__header"><h2 class="j-dialog__title" id="dlg-1-title">…</h2></header>
//     <div class="j-dialog__body">…</div>
//     <footer class="j-dialog__footer">
//       <button commandfor="dlg-1" command="close">Cancel</button>
//     </footer>
//   </dialog>
// Native: focus trap, Escape, focus restore, top layer. CSS: scroll lock.
// This file polyfills `command`/`commandfor` and `closedby="any"` in browsers
// without them. In current Chromium it does nothing.

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

/**
 * Polyfill invoker commands and `closedby="any"` inside `root`. Idempotent.
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
    root.querySelectorAll('dialog[closedby="any"]').forEach((el) => {
      const dlg = /** @type {HTMLDialogElement} */ (el);
      if (dismissers.has(dlg)) return;
      dismissers.set(dlg, lightDismiss(dlg));
      undo.push(() => { dismissers.get(dlg)?.(); dismissers.delete(dlg); });
    });
  }
  return () => undo.forEach((fn) => fn());
}
