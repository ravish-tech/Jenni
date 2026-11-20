// Group index for "overlay" behaviors. Export vanilla helpers here.
// Each init* is idempotent and returns a cleanup function.
import { initTooltips } from './tooltip.js';
import { initPopovers } from './popover.js';
import { initMenus } from './menu.js';
import { initDialogs } from './dialog.js';
import { initTabs } from './tabs.js';
import { initDocTabs } from './doc-tabs.js';
import { initToasts } from './toast.js';
import { initDrawers } from './drawer.js';
import { initComboboxes } from './combobox.js';
import { initContextMenus } from './context-menu.js';
import { initHoverCards } from './hover-card.js';
import { initCommandPalettes } from './command-palette.js';

export { supportsAnchor, linkAnchor, trackAnchor, anchorPopover } from './anchor.js';
export { createTooltip, initTooltips } from './tooltip.js';
export { createPopover, initPopovers } from './popover.js';
export { createMenu, initMenus } from './menu.js';
export { initDialogs, lightDismiss, requestClose, supportsCommands, supportsClosedBy } from './dialog.js';
export { createTabs, initTabs, syncTabIndicator, tabsKeydown, getTabs } from './tabs.js';
export { createDocTabs, initDocTabs, getDocTabElements } from './doc-tabs.js';
export {
  toast,
  updateToast,
  promiseToast,
  toastFromResult,
  dismissToast,
  pauseToasts,
  resumeToasts,
  subscribeToasts,
  getToasts,
  registerToastHost,
  promoteToaster,
  syncToasterLayout,
  bindToasterInteractions,
  initToasts,
} from './toast.js';
export { createDrawer, initDrawers } from './drawer.js';
export { anchorCombobox, createCombobox, initComboboxes } from './combobox.js';
export { createContextMenu, initContextMenus } from './context-menu.js';
export { createHoverCard, initHoverCards } from './hover-card.js';
export { createCommandPalette, initCommandPalettes, bindCommandShortcut } from './command-palette.js';

/**
 * Init every overlay & navigation component inside `root`.
 * @param {Document | HTMLElement} [root]
 * @returns {() => void} cleanup
 */
export function initOverlay(root = document) {
  const undo = [
    initTooltips(root),
    initPopovers(root),
    initMenus(root),
    initDialogs(root),
    initTabs(root),
    initDocTabs(root),
    initToasts(root),
    initDrawers(root),
    initComboboxes(root),
    initContextMenus(root),
    initHoverCards(root),
    initCommandPalettes(root),
  ];
  return () => undo.forEach((fn) => fn());
}
