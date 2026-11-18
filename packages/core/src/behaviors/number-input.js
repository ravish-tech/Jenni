// Jenni — Number Input behavior (precision decimal stepping, Shift×10, clamp-on-blur).

/**
 * Count decimal places of a finite number.
 * @param {number} n
 */
function decimalsOf(n) {
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  const exp = s.indexOf('e-');
  if (exp >= 0) return Number(s.slice(exp + 2));
  const dot = s.indexOf('.');
  return dot >= 0 ? s.length - dot - 1 : 0;
}

/**
 * Clamp and round a numeric value to precision.
 * @param {number} value
 * @param {{ min?: number, max?: number, step?: number }} [opts]
 * @returns {number}
 */
export function clampNumberValue(value, opts = {}) {
  const { min, max, step = 1 } = opts;
  let next = value;
  if (typeof min === 'number' && Number.isFinite(min)) next = Math.max(min, next);
  if (typeof max === 'number' && Number.isFinite(max)) next = Math.min(max, next);
  const precision = Math.max(decimalsOf(step), decimalsOf(min ?? 0));
  return Number(next.toFixed(Math.min(precision, 12)));
}

/**
 * Step a number by `deltaSteps` (e.g. +1, -1, +10, -10) with clean decimal rounding.
 * @param {number | null | undefined} current
 * @param {number} deltaSteps
 * @param {{ min?: number, max?: number, step?: number }} [opts]
 * @returns {number}
 */
export function stepNumberValue(current, deltaSteps, opts = {}) {
  const { min, max, step = 1 } = opts;
  const safeStep = step > 0 ? step : 1;
  const base =
    typeof current === 'number' && Number.isFinite(current)
      ? current
      : typeof min === 'number' && Number.isFinite(min)
        ? min
        : 0;
  const precision = Math.max(decimalsOf(safeStep), decimalsOf(base), decimalsOf(min ?? 0));
  const raw = Number((base + deltaSteps * safeStep).toFixed(Math.min(precision, 12)));
  return clampNumberValue(raw, { min, max, step: safeStep });
}

/**
 * Parse an optional numeric attribute.
 * @param {string | null} raw
 * @returns {number | undefined}
 */
function readNum(raw) {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Wire one `.j-number-input` root for plain HTML.
 * @param {HTMLElement} root
 * @returns {() => void}
 */
export function createNumberInput(root) {
  const field = /** @type {HTMLInputElement | null} */ (root.querySelector('.j-number-input__field'));
  if (!field) return () => {};
  const downBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-step="down"]'));
  const upBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-step="up"]'));

  const getBounds = () => ({
    min: readNum(field.getAttribute('min') ?? root.getAttribute('data-min')),
    max: readNum(field.getAttribute('max') ?? root.getAttribute('data-max')),
    step: readNum(field.getAttribute('step') ?? root.getAttribute('data-step')) ?? 1,
  });

  const syncButtons = () => {
    const disabled = field.disabled || field.readOnly || root.getAttribute('aria-disabled') === 'true';
    const { min, max } = getBounds();
    const val = readNum(field.value.trim());
    if (downBtn) downBtn.disabled = disabled || (val !== undefined && min !== undefined && val <= min);
    if (upBtn) upBtn.disabled = disabled || (val !== undefined && max !== undefined && val >= max);
  };

  /** @param {number} next */
  const commit = (next) => {
    field.value = String(next);
    syncButtons();
    field.dispatchEvent(new Event('input', { bubbles: true }));
    root.dispatchEvent(new CustomEvent('j-change', { bubbles: true, detail: { value: next } }));
  };

  /** @param {number} delta */
  const applyStep = (delta) => {
    if (field.disabled || field.readOnly) return;
    const bounds = getBounds();
    const cur = readNum(field.value.trim());
    commit(stepNumberValue(cur, delta, bounds));
  };

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const btn = /** @type {HTMLElement | null} */ (
      e.target instanceof Element ? e.target.closest('[data-step]') : null
    );
    if (!btn || !root.contains(btn) || btn.hasAttribute('disabled')) return;
    const mult = e.shiftKey ? 10 : 1;
    applyStep(btn.dataset.step === 'down' ? -mult : mult);
    field.focus();
  };

  /** @param {KeyboardEvent} e */
  const onKeydown = (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const mult = e.shiftKey ? 10 : 1;
    applyStep(e.key === 'ArrowUp' ? mult : -mult);
  };

  const onBlur = () => {
    const raw = field.value.trim();
    if (!raw) {
      syncButtons();
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      field.value = '';
      syncButtons();
      return;
    }
    const clamped = clampNumberValue(parsed, getBounds());
    if (String(clamped) !== field.value) commit(clamped);
    else syncButtons();
  };

  syncButtons();
  root.addEventListener('click', onClick);
  field.addEventListener('keydown', onKeydown);
  field.addEventListener('input', syncButtons);
  field.addEventListener('blur', onBlur);

  return () => {
    root.removeEventListener('click', onClick);
    field.removeEventListener('keydown', onKeydown);
    field.removeEventListener('input', syncButtons);
    field.removeEventListener('blur', onBlur);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every unmanaged `.j-number-input` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initNumberInputs(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-number-input:not([data-j-managed])').forEach((el) => {
    const num = /** @type {HTMLElement} */ (el);
    if (bound.has(num)) return;
    bound.set(num, createNumberInput(num));
    made.push(num);
  });
  return () =>
    made.forEach((num) => {
      bound.get(num)?.();
      bound.delete(num);
    });
}
