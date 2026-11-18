// Jenni — Hover Card behavior.
// Rich interactive preview card (`popover="manual"`) opened on pointer hover or
// keyboard `:focus-visible` after a calm 320ms delay, and bridged across a 180ms
// close delay so moving the pointer or keyboard focus onto the card keeps it open.

import { anchorPopover } from './anchor.js';

const DEFAULT_OPEN_DELAY = 320;
const DEFAULT_CLOSE_DELAY = 180;

/** @type {null | (() => void)} */
let hideCurrent = null;

/**
 * @typedef {{ openDelay?: number, closeDelay?: number, side?: string }} HoverCardOptions
 * @typedef {{ show: () => void, hide: () => void, destroy: () => void }} HoverCardController
 */

/**
 * Connect one trigger element to one `.j-hover-card` (`popover="manual"`).
 * @param {HTMLElement} trigger
 * @param {HTMLElement} card
 * @param {HoverCardOptions} [options]
 * @returns {HoverCardController}
 */
export function createHoverCard(trigger, card, options = {}) {
  const openDelay = options.openDelay ?? (Number(card.dataset.openDelay) || DEFAULT_OPEN_DELAY);
  const closeDelay = options.closeDelay ?? (Number(card.dataset.closeDelay) || DEFAULT_CLOSE_DELAY);

  if (!card.hasAttribute('popover')) card.setAttribute('popover', 'manual');
  const stopAnchor = anchorPopover(trigger, card, { side: options.side || card.dataset.side || 'bottom' });

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  let pointerInTrigger = false;
  let pointerInCard = false;

  const isOpen = () => card.matches(':popover-open');

  const show = () => {
    clearTimeout(timer);
    if (isOpen()) return;
    if (hideCurrent && hideCurrent !== hide) hideCurrent();
    try {
      card.showPopover();
    } catch {
      return;
    }
    hideCurrent = hide;
    document.addEventListener('keydown', onKey, true);
  };

  const hide = () => {
    clearTimeout(timer);
    document.removeEventListener('keydown', onKey, true);
    if (hideCurrent === hide) hideCurrent = null;
    if (!isOpen()) return;
    try {
      card.hidePopover();
    } catch {
      /* already hidden */
    }
  };

  const scheduleShow = () => {
    clearTimeout(timer);
    if (isOpen()) return;
    timer = setTimeout(show, openDelay);
  };

  const scheduleHide = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const active = document.activeElement;
      const focusInside = Boolean(active && (trigger.contains(active) || card.contains(active)));
      if (!pointerInTrigger && !pointerInCard && !focusInside) hide();
    }, closeDelay);
  };

  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key === 'Escape' && isOpen()) {
      e.stopPropagation();
      e.preventDefault();
      hide();
    }
  }

  /** @param {PointerEvent} e */
  const onTriggerEnter = (e) => {
    if (e.pointerType === 'touch') return;
    pointerInTrigger = true;
    scheduleShow();
  };
  /** @param {PointerEvent} e */
  const onTriggerLeave = (e) => {
    if (e.pointerType === 'touch') return;
    pointerInTrigger = false;
    scheduleHide();
  };

  /** @param {PointerEvent} e */
  const onCardEnter = (e) => {
    if (e.pointerType === 'touch') return;
    pointerInCard = true;
    clearTimeout(timer);
  };
  /** @param {PointerEvent} e */
  const onCardLeave = (e) => {
    if (e.pointerType === 'touch') return;
    pointerInCard = false;
    scheduleHide();
  };

  const onTriggerFocus = () => {
    if (trigger.matches(':focus-visible')) scheduleShow();
  };
  const onFocusOut = (/** @type {FocusEvent} */ e) => {
    const next = /** @type {Node | null} */ (e.relatedTarget);
    if (next && (trigger.contains(next) || card.contains(next))) return;
    if (!pointerInTrigger && !pointerInCard) scheduleHide();
  };
  const onCardFocusIn = () => {
    clearTimeout(timer);
  };

  trigger.addEventListener('pointerenter', onTriggerEnter);
  trigger.addEventListener('pointerleave', onTriggerLeave);
  trigger.addEventListener('focus', onTriggerFocus);
  trigger.addEventListener('focusout', onFocusOut);
  card.addEventListener('pointerenter', onCardEnter);
  card.addEventListener('pointerleave', onCardLeave);
  card.addEventListener('focusin', onCardFocusIn);
  card.addEventListener('focusout', onFocusOut);

  const destroy = () => {
    hide();
    stopAnchor();
    trigger.removeEventListener('pointerenter', onTriggerEnter);
    trigger.removeEventListener('pointerleave', onTriggerLeave);
    trigger.removeEventListener('focus', onTriggerFocus);
    trigger.removeEventListener('focusout', onFocusOut);
    card.removeEventListener('pointerenter', onCardEnter);
    card.removeEventListener('pointerleave', onCardLeave);
    card.removeEventListener('focusin', onCardFocusIn);
    card.removeEventListener('focusout', onFocusOut);
  };

  return { show, hide, destroy };
}

/** @type {WeakMap<HTMLElement, HoverCardController>} */
const bound = new WeakMap();

/**
 * Init every `[data-j-hover-card]` trigger inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void} cleanup
 */
export function initHoverCards(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  const doc = root instanceof Document ? root : root.ownerDocument || document;
  root.querySelectorAll('[data-j-hover-card]').forEach((el) => {
    const trigger = /** @type {HTMLElement} */ (el);
    if (bound.has(trigger)) return;
    const card = doc.getElementById(trigger.dataset.jHoverCard || '');
    if (!card || !card.classList.contains('j-hover-card')) return;
    const ctl = createHoverCard(trigger, card);
    bound.set(trigger, ctl);
    made.push(trigger);
  });
  return () => {
    made.forEach((t) => {
      bound.get(t)?.destroy();
      bound.delete(t);
    });
  };
}
