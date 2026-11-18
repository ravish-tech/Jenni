// Jenni — Drawer / Sheet behavior.
// Native `<dialog class="j-drawer">` opened with `showModal()`.
// Reuses `lightDismiss`, `requestClose`, and `initDialogs` from `./dialog.js`
// so invoker commands (`commandfor` / `command="show-modal"`) and backdrop
// clicks work identically across every browser.

import { initDialogs, lightDismiss, requestClose, supportsClosedBy } from './dialog.js';

export { lightDismiss, requestClose };

/**
 * Connect backdrop light-dismiss to a `<dialog class="j-drawer">`.
 * @param {HTMLDialogElement} drawer
 * @param {{ dismissible?: boolean }} [options]
 * @returns {() => void} cleanup
 */
export function createDrawer(drawer, options = {}) {
  const dismissible = options.dismissible ?? drawer.getAttribute('closedby') !== 'none';
  if (!dismissible) return () => {};
  return lightDismiss(drawer);
}

/** @type {WeakMap<HTMLDialogElement, () => void>} */
const boundDrawers = new WeakMap();
/** @type {WeakMap<HTMLElement, () => void>} */
const boundTriggers = new WeakMap();

/**
 * Init drawers and invoker commands inside `root`. Idempotent.
 * @param {Document | HTMLElement} [root]
 * @returns {() => void} cleanup
 */
export function initDrawers(root = document) {
  const stopDialogs = initDialogs(root);
  /** @type {HTMLDialogElement[]} */
  const madeDrawers = [];
  /** @type {HTMLElement[]} */
  const madeTriggers = [];

  root.querySelectorAll('dialog.j-drawer').forEach((el) => {
    const dlg = /** @type {HTMLDialogElement} */ (el);
    if (boundDrawers.has(dlg)) return;
    if (supportsClosedBy() && dlg.getAttribute('closedby') === 'any') return;
    if (dlg.getAttribute('closedby') === 'none') return;
    const stop = lightDismiss(dlg);
    boundDrawers.set(dlg, stop);
    madeDrawers.push(dlg);
  });

  const doc = root instanceof Document ? root : root.ownerDocument || document;
  root.querySelectorAll('[data-j-drawer]').forEach((el) => {
    const btn = /** @type {HTMLElement} */ (el);
    if (boundTriggers.has(btn)) return;
    const onClick = () => {
      const target = doc.getElementById(btn.dataset.jDrawer || '');
      if (target instanceof HTMLDialogElement && !target.open) target.showModal();
    };
    btn.addEventListener('click', onClick);
    const stop = () => btn.removeEventListener('click', onClick);
    boundTriggers.set(btn, stop);
    madeTriggers.push(btn);
  });

  return () => {
    stopDialogs();
    madeDrawers.forEach((d) => {
      boundDrawers.get(d)?.();
      boundDrawers.delete(d);
    });
    madeTriggers.forEach((t) => {
      boundTriggers.get(t)?.();
      boundTriggers.delete(t);
    });
  };
}
