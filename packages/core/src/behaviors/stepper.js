// Jenni — Stepper behavior (interactive clickable steps, linear gating, keyboard navigation).

/** @param {Element} el */
const isDisabled = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/**
 * Direct `.j-stepper__step` items belonging to `root`.
 * @param {HTMLElement} root
 * @returns {HTMLElement[]}
 */
function getSteps(root) {
  return /** @type {HTMLElement[]} */ (
    [...root.querySelectorAll(':scope > .j-stepper__step')]
  );
}

/**
 * Wire one `.j-stepper` element. Skips `[data-j-managed]`.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function createStepper(root) {
  if (root.hasAttribute('data-j-managed')) return () => {};

  const steps = getSteps(root);
  if (!steps.length) return () => {};

  let currentIndex = steps.findIndex(
    (s) => s.dataset.status === 'current' || s.getAttribute('aria-current') === 'step',
  );
  if (currentIndex < 0) currentIndex = 0;
  let maxReached = Math.max(
    currentIndex,
    ...steps.map((s, idx) => (s.dataset.status === 'complete' ? idx + 1 : 0)),
  );

  /**
   * @param {number} nextIndex
   * @param {boolean} [notify]
   */
  const goTo = (nextIndex, notify = true) => {
    const all = getSteps(root);
    if (nextIndex < 0 || nextIndex >= all.length) return;
    if (root.hasAttribute('data-linear') && nextIndex > maxReached) return;

    const targetStep = all[nextIndex];
    const trigger = targetStep?.querySelector(':scope > .j-stepper__trigger');
    if (targetStep && (isDisabled(targetStep) || (trigger && isDisabled(trigger)))) return;

    currentIndex = nextIndex;
    if (currentIndex > maxReached) maxReached = currentIndex;

    all.forEach((step, idx) => {
      const explicitError = step.hasAttribute('data-error');
      const status = explicitError
        ? 'error'
        : idx < currentIndex
          ? 'complete'
          : idx === currentIndex
            ? 'current'
            : 'upcoming';
      step.dataset.status = status;
      if (idx === currentIndex) {
        step.setAttribute('aria-current', 'step');
      } else {
        step.removeAttribute('aria-current');
      }

      const btn = /** @type {HTMLButtonElement | null} */ (
        step.querySelector(':scope > button.j-stepper__trigger')
      );
      if (btn && root.hasAttribute('data-linear')) {
        const locked = idx > maxReached;
        btn.disabled = locked;
      }
    });

    if (notify) {
      root.dispatchEvent(
        new CustomEvent('j-change', {
          bubbles: true,
          detail: { index: currentIndex, step: all[currentIndex] },
        }),
      );
    }
  };

  goTo(currentIndex, false);

  /** @param {MouseEvent} event */
  const onClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest('button.j-stepper__trigger');
    if (!(btn instanceof HTMLButtonElement) || isDisabled(btn)) return;
    const step = btn.closest('.j-stepper__step');
    if (!(step instanceof HTMLElement) || step.parentElement !== root) return;
    const idx = getSteps(root).indexOf(step);
    if (idx >= 0 && idx !== currentIndex) {
      goTo(idx, true);
    }
  };

  /** @param {KeyboardEvent} event */
  const onKeydown = (event) => {
    const active = document.activeElement;
    if (!(active instanceof HTMLButtonElement) || !active.classList.contains('j-stepper__trigger')) return;
    if (active.closest('.j-stepper') !== root) return;

    const vertical = root.dataset.orientation === 'vertical';
    const rtl = !vertical && getComputedStyle(root).direction === 'rtl';
    const nextKey = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';

    const buttons = /** @type {HTMLButtonElement[]} */ (
      getSteps(root)
        .map((s) => s.querySelector(':scope > button.j-stepper__trigger'))
        .filter((b) => b instanceof HTMLButtonElement && !isDisabled(b))
    );
    const pos = buttons.indexOf(active);
    if (pos < 0) return;

    /** @type {HTMLButtonElement | undefined} */
    let target;
    if (event.key === nextKey) target = buttons[(pos + 1) % buttons.length];
    else if (event.key === prevKey) target = buttons[(pos - 1 + buttons.length) % buttons.length];
    else if (event.key === 'Home') target = buttons[0];
    else if (event.key === 'End') target = buttons[buttons.length - 1];

    if (target) {
      event.preventDefault();
      target.focus();
    }
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
 * Init every `.j-stepper` inside `root`. Idempotent.
 * @param {ParentNode} [root=document]
 * @returns {() => void} cleanup
 */
export function initSteppers(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-stepper').forEach((el) => {
    const stepper = /** @type {HTMLElement} */ (el);
    if (stepper.hasAttribute('data-j-managed') || bound.has(stepper)) return;
    bound.set(stepper, createStepper(stepper));
    made.push(stepper);
  });
  return () =>
    made.forEach((s) => {
      bound.get(s)?.();
      bound.delete(s);
    });
}
