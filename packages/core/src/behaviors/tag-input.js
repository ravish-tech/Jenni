// Jenni — Tag Input behavior (Enter / comma commit, Backspace remove, maxTags).

/**
 * Wire one `.j-tag-input` root for plain HTML.
 * @param {HTMLElement} root
 * @returns {() => void}
 */
export function createTagInput(root) {
  const field = /** @type {HTMLInputElement | null} */ (root.querySelector('.j-tag-input__field'));
  if (!field) return () => {};

  const getTagEls = () => /** @type {HTMLElement[]} */ ([...root.querySelectorAll(':scope > .j-tag-input__tag')]);
  const getTags = () =>
    getTagEls().map((el) => el.dataset.value ?? el.querySelector('.j-tag-input__tag-label')?.textContent?.trim() ?? el.firstChild?.textContent?.trim() ?? '');

  const emit = () => {
    root.dispatchEvent(new CustomEvent('j-change', { bubbles: true, detail: { tags: getTags() } }));
  };

  /** @param {string} raw */
  const addTag = (raw) => {
    const val = raw.trim().replace(/,+$/, '').trim();
    if (!val) return false;
    const tags = getTags();
    const max = Number(root.dataset.maxTags || 0);
    if (max > 0 && tags.length >= max) return false;
    if (tags.some((t) => t.toLowerCase() === val.toLowerCase())) return false;

    const chip = document.createElement('span');
    chip.className = 'j-tag-input__tag';
    chip.dataset.value = val;

    const label = document.createElement('span');
    label.className = 'j-tag-input__tag-label';
    label.textContent = val;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'j-tag-input__remove';
    btn.setAttribute('aria-label', `Remove ${val}`);
    btn.textContent = '×';

    chip.append(label, btn);
    root.insertBefore(chip, field);
    emit();
    return true;
  };

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const removeBtn = target.closest('.j-tag-input__remove');
    if (removeBtn && root.contains(removeBtn)) {
      if (field.disabled || root.getAttribute('aria-disabled') === 'true') return;
      removeBtn.closest('.j-tag-input__tag')?.remove();
      emit();
      field.focus();
      return;
    }
    if (target !== field && !field.disabled) {
      field.focus();
    }
  };

  /** @param {KeyboardEvent} e */
  const onKeydown = (e) => {
    if (field.disabled) return;
    if (e.key === 'Enter' || e.key === ',') {
      if (!field.value.trim() && e.key === 'Enter') return;
      e.preventDefault();
      if (addTag(field.value)) field.value = '';
      else if (e.key === ',') field.value = field.value.replace(/,+$/, '');
    } else if (e.key === 'Backspace' && field.value === '') {
      const chips = getTagEls();
      if (chips.length) {
        e.preventDefault();
        chips[chips.length - 1].remove();
        emit();
      }
    }
  };

  root.addEventListener('click', onClick);
  field.addEventListener('keydown', onKeydown);

  return () => {
    root.removeEventListener('click', onClick);
    field.removeEventListener('keydown', onKeydown);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every unmanaged `.j-tag-input` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initTagInputs(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-tag-input:not([data-j-managed])').forEach((el) => {
    const tagInput = /** @type {HTMLElement} */ (el);
    if (bound.has(tagInput)) return;
    bound.set(tagInput, createTagInput(tagInput));
    made.push(tagInput);
  });
  return () =>
    made.forEach((tagInput) => {
      bound.get(tagInput)?.();
      bound.delete(tagInput);
    });
}
