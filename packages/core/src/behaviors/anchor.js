// Jenni — anchor helper shared by tooltip, popover and menu.
// Native CSS anchor positioning does the real work. This file only:
//   1. links a trigger and a floating element with unique anchor names,
//   2. reports the side the browser actually picked (after position-try flips)
//      as `data-placement`, so arrows and transform-origin stay correct,
//   3. positions with JS when the browser lacks anchor positioning.

const SIDES = ['top', 'right', 'bottom', 'left'];
let uid = 0;

/** @returns {boolean} */
export function supportsAnchor() {
  return typeof CSS !== 'undefined' && CSS.supports('anchor-name: --a');
}

/**
 * Give `trigger` an anchor name (re-used if it already has one) and point
 * `floating` at it.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} floating
 */
export function linkAnchor(trigger, floating) {
  let name = trigger.dataset.jAnchor;
  if (!name) {
    name = `--j-anchor-${++uid}`;
    trigger.dataset.jAnchor = name;
    trigger.style.setProperty('anchor-name', name);
  }
  floating.style.setProperty('position-anchor', name);
}

/**
 * Side + alignment requested by the floating element.
 * @param {HTMLElement} floating
 * @param {string} fallbackSide
 */
function readSide(floating, fallbackSide) {
  const side = floating.dataset.side;
  return {
    side: side && SIDES.includes(side) ? side : fallbackSide,
    align: floating.dataset.align || 'center',
  };
}

function readOffset(floating) {
  const v = parseFloat(getComputedStyle(floating).getPropertyValue('--_offset'));
  return Number.isFinite(v) ? v : 6;
}

/**
 * JS fallback: compute fixed coordinates, flipping when there is no room
 * and clamping into the viewport.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} floating
 * @param {string} fallbackSide
 */
function placeWithJs(trigger, floating, fallbackSide) {
  const { side: wanted, align } = readSide(floating, fallbackSide);
  const t = trigger.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  const gap = readOffset(floating);
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const pad = 8;

  const room = {
    top: t.top - gap - pad,
    bottom: vh - t.bottom - gap - pad,
    left: t.left - gap - pad,
    right: vw - t.right - gap - pad,
  };
  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const need = wanted === 'top' || wanted === 'bottom' ? f.height : f.width;
  const side = room[wanted] < need && room[opposite[wanted]] > room[wanted] ? opposite[wanted] : wanted;

  let x = 0;
  let y = 0;
  if (side === 'top' || side === 'bottom') {
    y = side === 'top' ? t.top - gap - f.height : t.bottom + gap;
    x = align === 'start' ? t.left : align === 'end' ? t.right - f.width : t.left + t.width / 2 - f.width / 2;
  } else {
    x = side === 'left' ? t.left - gap - f.width : t.right + gap;
    y = align === 'start' ? t.top : align === 'end' ? t.bottom - f.height : t.top + t.height / 2 - f.height / 2;
  }
  x = Math.min(Math.max(pad, x), vw - f.width - pad);
  y = Math.min(Math.max(pad, y), vh - f.height - pad);

  floating.style.margin = '0';
  floating.style.inset = 'auto';
  floating.style.left = `${Math.round(x)}px`;
  floating.style.top = `${Math.round(y)}px`;
}

/**
 * Detect the side the floating element ended up on and expose it.
 * Also exposes `--_arrow-x` / `--_arrow-y`: the trigger centre relative
 * to the floating box, so an arrow always points at the trigger.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} floating
 * @param {string} fallbackSide
 */
function syncPlacement(trigger, floating, fallbackSide) {
  const t = trigger.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  let side = readSide(floating, fallbackSide).side;
  if (f.bottom <= t.top + 1) side = 'top';
  else if (f.top >= t.bottom - 1) side = 'bottom';
  else if (f.right <= t.left + 1) side = 'left';
  else if (f.left >= t.right - 1) side = 'right';
  floating.dataset.placement = side;
  const ax = Math.min(Math.max(t.left + t.width / 2 - f.left, 12), f.width - 12);
  const ay = Math.min(Math.max(t.top + t.height / 2 - f.top, 12), f.height - 12);
  floating.style.setProperty('--_arrow-x', `${Math.round(ax)}px`);
  floating.style.setProperty('--_arrow-y', `${Math.round(ay)}px`);
}

/**
 * Keep `floating` attached to `trigger` while it is open.
 * Call when the floating element opens; call the returned function on close.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} floating
 * @param {{ side?: string }} [options]
 * @returns {() => void} stop tracking
 */
export function trackAnchor(trigger, floating, options = {}) {
  const fallbackSide = options.side || 'bottom';
  const native = supportsAnchor();
  linkAnchor(trigger, floating);
  // Reset any placement left over from the previous open.
  delete floating.dataset.placement;

  let frame = 0;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!native) placeWithJs(trigger, floating, fallbackSide);
      syncPlacement(trigger, floating, fallbackSide);
    });
  };
  if (!native) placeWithJs(trigger, floating, fallbackSide);
  syncPlacement(trigger, floating, fallbackSide);
  update();

  window.addEventListener('scroll', update, { capture: true, passive: true });
  window.addEventListener('resize', update, { passive: true });
  // Measure again once the enter transition settles (transforms skew rects).
  floating.addEventListener('transitionend', update);
  return () => {
    cancelAnimationFrame(frame);
    floating.removeEventListener('transitionend', update);
    window.removeEventListener('scroll', update, { capture: true });
    window.removeEventListener('resize', update);
  };
}

/**
 * Wire an element with the `popover` attribute to its trigger: anchor
 * tracking while open. Works for both auto popovers (popovertarget) and
 * manual ones opened from script.
 * @param {HTMLElement} trigger
 * @param {HTMLElement} floating
 * @param {{ side?: string }} [options]
 * @returns {() => void} cleanup
 */
export function anchorPopover(trigger, floating, options = {}) {
  /** @type {null | (() => void)} */
  let stop = null;
  const onToggle = (/** @type {Event} */ e) => {
    const state = /** @type {ToggleEvent} */ (e).newState;
    if (state === 'open') {
      stop?.();
      stop = trackAnchor(trigger, floating, options);
    } else {
      stop?.();
      stop = null;
    }
  };
  // Link up-front so the very first frame is already anchored (no jump).
  linkAnchor(trigger, floating);
  floating.addEventListener('toggle', onToggle);
  if (floating.matches(':popover-open')) stop = trackAnchor(trigger, floating, options);
  return () => {
    floating.removeEventListener('toggle', onToggle);
    stop?.();
  };
}
