// Jenni — vanilla behaviors (optional; only needed for interactive components in plain HTML).
import { initShells, initScrollAreas, initResizableGroups } from './behaviors/layout.js';
import {
  initSliders,
  initSegmented,
  initNumberInputs,
  initPinInputs,
  initTagInputs,
  initFileUploads,
  initDatePickers,
  initTimePickers,
  initColorPickers,
  initRichTextEditors,
  initToggles,
} from './behaviors/forms.js';
import {
  initAvatars,
  initAccordions,
  initDataTables,
  initSteppers,
  initTreeViews,
  initCarousels,
} from './behaviors/display.js';
import { initOverlay } from './behaviors/overlay.js';

export * from './behaviors/layout.js';
export * from './behaviors/forms.js';
export * from './behaviors/display.js';
export * from './behaviors/overlay.js';

/**
 * Initialize all vanilla jenni-core behaviors inside `root` (idempotent, returns cleanup).
 * @param {Document | HTMLElement} [root]
 * @returns {() => void}
 */
export function initJenni(root = document) {
  const undo = [
    initShells(root),
    initScrollAreas(root),
    initResizableGroups(root),
    initSliders(root),
    initSegmented(root),
    initNumberInputs(root),
    initPinInputs(root),
    initTagInputs(root),
    initFileUploads(root),
    initDatePickers(root),
    initTimePickers(root),
    initColorPickers(root),
    initRichTextEditors(root),
    initToggles(root),
    initAvatars(root),
    initAccordions(root),
    initDataTables(root),
    initSteppers(root),
    initTreeViews(root),
    initCarousels(root),
    initOverlay(root),
  ];
  return () => undo.forEach((fn) => fn && fn());
}
