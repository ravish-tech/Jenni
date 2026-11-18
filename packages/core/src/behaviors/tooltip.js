// Jenni — Tooltip behavior.
// Markup:
//   <button data-j-tooltip="tip-1">…</button>
//   <div class="j-tooltip" id="tip-1" popover="manual" role="tooltip" data-side="top">Copy</div>
// Shows on hover (after a delay) and on keyboard focus. Hides on leave, blur,
// pointerdown and Escape. Moving between tooltips within a short window skips
// the delay ("warm" mode), like native OS tooltips.

import { anchorPopover } from './anchor.js';

const DELAY = 450;
const CLOSE_DELAY = 80;
const WARM_WINDOW = 400;

let lastHiddenAt = 0;
/** @type {null | (() => void)} hides the currently open tooltip */
let hideCurrent = null;

/**
 * @typedef {{ delay?: number, closeDelay?: number, side?: string }} TooltipOptions
 * @typedef {{ show: (instant?: boolean) => void, hide: () => void, destroy: () => void }} TooltipController
 */

/**
 * Connect one trigger to one tooltip element (which must have `popover`).
 * Framework wrappers use this directly.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} tooltip
 * @param {TooltipOptions} [options]
 * @returns {TooltipController}
 */
export function createTooltip(trigger, tooltip, options = {}) {
  const delay = options.delay ?? (Number(tooltip.dataset.delay) || DELAY);
  const closeDelay = options.closeDelay ?? CLOSE_DELAY;
  if (!tooltip.hasAttribute('popover')) tooltip.setAttribute('popover', 'manual');
  if (!tooltip.getAttribute('role')) tooltip.setAttribute('role', 'tooltip');
  if (tooltip.id) {
    const ids = (trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!ids.includes(tooltip.id)) trigger.setAttribute('aria-describedby', [...ids, tooltip.id].join(' '));
  }
  const stopAnchor = anchorPopover(trigger, tooltip, { side: options.side || 'top' });

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const isOpen = () => tooltip.matches(':popover-open');

  const show = (instant = false) => {
    clearTimeout(timer);
    if (isOpen()) return;
    if (hideCurrent && hideCurrent !== hide) hideCurrent();
    tooltip.toggleAttribute('data-instant', instant);
    try { tooltip.showPopover(); } catch { return; }
    hideCurrent = hide;
    document.addEventListener('keydown', onKey, true);
  };
  const hide = () => {
    clearTimeout(timer);
    document.removeEventListener('keydown', onKey, true);
    if (hideCurrent === hide) hideCurrent = null;
    if (!isOpen()) return;
    try { tooltip.hidePopover(); } catch { /* already hidden */ }
    lastHiddenAt = Date.now();
  };
  const scheduleShow = () => {
    clearTimeout(timer);
    const warm = Date.now() - lastHiddenAt < WARM_WINDOW || (hideCurrent !== null && hideCurrent !== hide);
    if (warm) show(true);
    else timer = setTimeout(() => show(false), delay);
  };
  const scheduleHide = () => {
    clearTimeout(timer);
    timer = setTimeout(hide, closeDelay);
  };
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === 'Escape' && isOpen()) {
      // Close only the tooltip; keep any parent popover/dialog open.
      e.stopPropagation();
      e.preventDefault();
      hide();
    }
  }

  /** @param {PointerEvent} e */
  const onEnter = (e) => { if (e.pointerType !== 'touch') scheduleShow(); };
  const onFocus = () => {
    // Keyboard focus only; a mouse click should not pop a tooltip.
    if (trigger.matches(':focus-visible')) show(true);
  };

  trigger.addEventListener('pointerenter', onEnter);
  trigger.addEventListener('pointerleave', scheduleHide);
  trigger.addEventListener('pointerdown', hide);
  trigger.addEventListener('focus', onFocus);
  trigger.addEventListener('blur', hide);
  // Hoverable content (WCAG 1.4.13): moving onto the tooltip keeps it open.
  const keepOpen = () => clearTimeout(timer);
  tooltip.addEventListener('pointerenter', keepOpen);
  tooltip.addEventListener('pointerleave', scheduleHide);

  const destroy = () => {
    hide();
    stopAnchor();
    trigger.removeEventListener('pointerenter', onEnter);
    trigger.removeEventListener('pointerleave', scheduleHide);
    trigger.removeEventListener('pointerdown', hide);
    trigger.removeEventListener('focus', onFocus);
    trigger.removeEventListener('blur', hide);
    tooltip.removeEventListener('pointerenter', keepOpen);
    tooltip.removeEventListener('pointerleave', scheduleHide);
  };
  return { show, hide, destroy };
}

const bound = new WeakMap();

/**
 * Init every `[data-j-tooltip]` trigger inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initTooltips(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('[data-j-tooltip]').forEach((el) => {
    const trigger = /** @type {HTMLElement} */ (el);
    if (bound.has(trigger)) return;
    const tip = document.getElementById(trigger.dataset.jTooltip || '');
    if (!tip) return;
    const ctl = createTooltip(trigger, tip);
    bound.set(trigger, ctl);
    made.push(trigger);
  });
  return () => made.forEach((trigger) => {
    bound.get(trigger)?.destroy();
    bound.delete(trigger);
  });
}
