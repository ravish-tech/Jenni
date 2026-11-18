// Avatar — hides broken <img class="j-avatar__image"> so the initials fallback shows.
// Only needed in plain HTML; the Vue/React wrappers do this themselves.
const SELECTOR = '.j-avatar__image';
const bound = new WeakSet();

function markBroken(img) {
  img.setAttribute('data-state', 'error');
}

/**
 * @param {Document | Element} [root=document]
 * @returns {() => void} cleanup
 */
export function initAvatars(root = document) {
  if (bound.has(root)) return () => {};
  bound.add(root);

  /** @param {Event} event */
  const onError = (event) => {
    const t = event.target;
    if (t instanceof HTMLImageElement && t.matches(SELECTOR)) markBroken(t);
  };
  /** @param {Event} event */
  const onLoad = (event) => {
    const t = event.target;
    if (t instanceof HTMLImageElement && t.matches(SELECTOR)) t.removeAttribute('data-state');
  };

  // error/load do not bubble — listen in the capture phase.
  root.addEventListener('error', onError, true);
  root.addEventListener('load', onLoad, true);

  root.querySelectorAll(SELECTOR).forEach((img) => {
    if (img instanceof HTMLImageElement && img.complete && img.naturalWidth === 0) markBroken(img);
  });

  return () => {
    root.removeEventListener('error', onError, true);
    root.removeEventListener('load', onLoad, true);
    bound.delete(root);
  };
}
