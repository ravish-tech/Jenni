// Jenni — Popover behavior.
// Markup (opening, closing, Escape and light-dismiss are all native):
//   <button popovertarget="pop-1">Open</button>
//   <div class="j-popover" id="pop-1" popover data-side="bottom" data-align="start">…</div>
// This file only adds anchor tracking and keeps `aria-expanded` in sync on the
// trigger (used for the pressed look on the trigger).

import { anchorPopover } from './anchor.js';

/**
 * Connect a trigger to a `[popover]` panel. Framework wrappers use this.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} panel
 * @param {{ side?: string }} [options]
 * @returns {() => void} cleanup
 */
export function createPopover(trigger, panel, options = {}) {
  if (!panel.hasAttribute('popover')) panel.setAttribute('popover', 'auto');
  if (trigger instanceof HTMLButtonElement && !trigger.popoverTargetElement) {
    trigger.popoverTargetElement = panel;
  }
  if (panel.id) trigger.setAttribute('aria-controls', panel.id);
  trigger.setAttribute('aria-expanded', String(panel.matches(':popover-open')));
  const stopAnchor = anchorPopover(trigger, panel, { side: options.side || 'bottom' });
  const onToggle = (/** @type {Event} */ e) => {
    trigger.setAttribute('aria-expanded', String(/** @type {ToggleEvent} */ (e).newState === 'open'));
  };
  panel.addEventListener('toggle', onToggle);
  return () => {
    stopAnchor();
    panel.removeEventListener('toggle', onToggle);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every trigger whose `popovertarget` points to a `.j-popover`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initPopovers(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('[popovertarget]').forEach((el) => {
    const trigger = /** @type {HTMLElement} */ (el);
    const panel = document.getElementById(trigger.getAttribute('popovertarget') || '');
    if (!panel || !panel.classList.contains('j-popover') || bound.has(trigger)) return;
    bound.set(trigger, createPopover(trigger, panel));
    made.push(trigger);
  });
  return () => made.forEach((t) => {
    bound.get(t)?.();
    bound.delete(t);
  });
}
