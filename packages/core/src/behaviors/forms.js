// Group index for "forms" behaviors. Export vanilla helpers here.
export { initSliders, syncSlider } from './slider.js';
export {
  getSegmentedItems,
  syncSegmentedIndicator,
  segmentedKeydown,
  createSegmented,
  initSegmented,
} from './segmented.js';
export {
  clampNumberValue,
  stepNumberValue,
  createNumberInput,
  initNumberInputs,
} from './number-input.js';
export { sanitizePinChars, createPinInput, initPinInputs } from './pin-input.js';
export { createTagInput, initTagInputs } from './tag-input.js';
export { formatFileSize, validateUploadFile, createFileUpload, initFileUploads } from './file-upload.js';
export * from './date-picker.js';
export * from './time-picker.js';
export * from './color-picker.js';
export * from './rich-text.js';

/** @type {WeakMap<ParentNode, () => void>} */
const toggleBound = new WeakMap();

/**
 * Wire plain-HTML `.j-toggle` buttons and `.j-toggle-group` containers inside `root`.
 * Skips framework-managed controls (`[data-j-managed]`). Idempotent per root.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initToggles(root = document) {
  if (toggleBound.has(root)) return /** @type {() => void} */ (toggleBound.get(root));

  /** @param {Event} event */
  const onClick = (event) => {
    const btn = event.target instanceof Element ? event.target.closest('.j-toggle') : null;
    if (!(btn instanceof HTMLElement)) return;
    if (btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') return;
    if (btn.hasAttribute('data-j-managed')) return;

    const group = btn.closest('.j-toggle-group');
    if (group instanceof HTMLElement) {
      if (group.hasAttribute('data-j-managed') || group.getAttribute('aria-disabled') === 'true') return;
      const single = group.dataset.type !== 'multiple';
      const currentlyOn = btn.getAttribute('aria-pressed') === 'true';
      if (single) {
        group.querySelectorAll(':scope > .j-toggle').forEach((sibling) => {
          sibling.setAttribute('aria-pressed', sibling === btn ? String(!currentlyOn) : 'false');
        });
      } else {
        btn.setAttribute('aria-pressed', String(!currentlyOn));
      }
      group.dispatchEvent(new CustomEvent('j-change', { bubbles: true }));
      return;
    }

    const next = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(next));
    btn.dispatchEvent(new CustomEvent('j-change', { bubbles: true, detail: { pressed: next } }));
  };

  root.addEventListener('click', onClick);
  const cleanup = () => {
    root.removeEventListener('click', onClick);
    toggleBound.delete(root);
  };
  toggleBound.set(root, cleanup);
  return cleanup;
}
