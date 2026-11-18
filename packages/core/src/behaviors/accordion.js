// Accordion & Collapsible — progressive fallback for browsers without CSS `::details-content`.
// When `::details-content` is supported, pure CSS handles the 300ms damped glide natively.
const TRIGGER_SELECTOR = '.j-accordion__trigger, .j-collapsible__trigger';
const bound = new WeakSet();
const animations = new WeakMap();

const EASE_EMPHASIZED = 'cubic-bezier(0.16, 1, 0.3, 1)';
const DURATION_MS = 300;

function supportsDetailsContent() {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('selector(::details-content)');
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * @param {HTMLDetailsElement} details
 * @param {boolean} nextOpen
 */
function animateDetails(details, nextOpen) {
  animations.get(details)?.cancel();

  const summary = details.querySelector(':scope > summary');
  if (!(summary instanceof HTMLElement)) {
    details.open = nextOpen;
    return;
  }

  const startHeight = details.offsetHeight;
  if (nextOpen) details.open = true;
  const endHeight = nextOpen ? details.offsetHeight : summary.offsetHeight;

  details.style.overflow = 'clip';
  const anim = details.animate(
    { height: [`${startHeight}px`, `${endHeight}px`] },
    { duration: DURATION_MS, easing: EASE_EMPHASIZED },
  );
  animations.set(details, anim);

  const finish = () => {
    if (!nextOpen) details.open = false;
    details.style.overflow = '';
    animations.delete(details);
  };
  anim.onfinish = finish;
  anim.oncancel = () => {
    details.style.overflow = '';
    animations.delete(details);
  };
}

/**
 * @param {Document | Element} [root=document]
 * @returns {() => void} cleanup
 */
export function initAccordions(root = document) {
  if (bound.has(root)) return () => {};
  bound.add(root);

  /** @param {MouseEvent} event */
  const onClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest(TRIGGER_SELECTOR);
    if (!(trigger instanceof HTMLElement)) return;
    const details = trigger.parentElement;
    if (!(details instanceof HTMLDetailsElement)) return;

    if (
      details.hasAttribute('data-disabled') ||
      details.getAttribute('aria-disabled') === 'true' ||
      trigger.getAttribute('aria-disabled') === 'true'
    ) {
      event.preventDefault();
      return;
    }

    // Native CSS handles smooth height transitions when ::details-content is supported.
    if (supportsDetailsContent() || prefersReducedMotion()) return;

    event.preventDefault();
    const nextOpen = !details.open;

    // Mirror exclusive <details name="..."> closing with matching smooth glide.
    if (nextOpen && details.name) {
      const scope = details.getRootNode() instanceof Document || details.getRootNode() instanceof ShadowRoot
        ? /** @type {Document | ShadowRoot} */ (details.getRootNode())
        : document;
      scope.querySelectorAll(`details[name="${CSS.escape(details.name)}"][open]`).forEach((sibling) => {
        if (sibling instanceof HTMLDetailsElement && sibling !== details) {
          animateDetails(sibling, false);
        }
      });
    }

    animateDetails(details, nextOpen);
  };

  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('click', onClick);
    bound.delete(root);
  };
}
