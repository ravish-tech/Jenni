// Slider — keeps `--j-slider-progress` (0…1) in sync with <input type="range" class="j-slider">.
// CSS cannot read an input's live value, so this is the one bit of JS sliders need.

const SELECTOR = 'input[type="range"].j-slider';
const bound = new WeakMap();

/** Update the fill of a single slider. */
export function syncSlider(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value);
  const p = max > min ? (value - min) / (max - min) : 0;
  input.style.setProperty('--j-slider-progress', String(Math.min(1, Math.max(0, p))));
}

/**
 * Sync every `.j-slider` inside `root` and keep them in sync (event delegation,
 * so sliders added later work too). Idempotent per root. Returns cleanup.
 */
export function initSliders(root = document) {
  if (bound.has(root)) return bound.get(root);
  root.querySelectorAll(SELECTOR).forEach(syncSlider);
  const onInput = (event) => {
    const el = event.target;
    if (el instanceof HTMLInputElement && el.matches(SELECTOR)) syncSlider(el);
  };
  root.addEventListener('input', onInput);
  const cleanup = () => {
    root.removeEventListener('input', onInput);
    bound.delete(root);
  };
  bound.set(root, cleanup);
  return cleanup;
}
