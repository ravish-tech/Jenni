// Jenni — Pin / OTP Input behavior (auto-advance, Backspace, arrows, paste distribution).

/**
 * Filter characters matching the pin input mode.
 * @param {string} raw
 * @param {'numeric' | 'alphanumeric'} [type]
 * @returns {string[]}
 */
export function sanitizePinChars(raw, type = 'numeric') {
  const re = type === 'alphanumeric' ? /[a-zA-Z0-9]/ : /[0-9]/;
  return [...raw].filter((ch) => re.test(ch));
}

/**
 * Wire one `.j-pin-input` root for plain HTML.
 * @param {HTMLElement} root
 * @returns {() => void}
 */
export function createPinInput(root) {
  const getCells = () =>
    /** @type {HTMLInputElement[]} */ ([...root.querySelectorAll('input.j-pin-input__cell')]);
  const getType = () =>
    root.dataset.type === 'alphanumeric' ? /** @type {const} */ ('alphanumeric') : /** @type {const} */ ('numeric');

  const syncFilled = () => {
    getCells().forEach((cell) => {
      if (cell.value) cell.setAttribute('data-filled', '');
      else cell.removeAttribute('data-filled');
    });
  };

  const emit = () => {
    const cells = getCells();
    const value = cells.map((c) => c.value).join('');
    syncFilled();
    root.dispatchEvent(new CustomEvent('j-change', { bubbles: true, detail: { value } }));
    if (cells.length > 0 && cells.every((c) => c.value.length === 1)) {
      root.dispatchEvent(new CustomEvent('j-complete', { bubbles: true, detail: { value } }));
    }
  };

  /** @param {Event} e */
  const onInput = (e) => {
    const cell = e.target;
    if (!(cell instanceof HTMLInputElement) || !cell.classList.contains('j-pin-input__cell')) return;
    const cells = getCells();
    const idx = cells.indexOf(cell);
    if (idx < 0) return;

    const chars = sanitizePinChars(cell.value, getType());
    if (!chars.length) {
      cell.value = '';
      emit();
      return;
    }
    if (chars.length === 1) {
      cell.value = chars[0];
      if (idx + 1 < cells.length) cells[idx + 1].focus();
      emit();
      return;
    }
    chars.forEach((ch, offset) => {
      if (idx + offset < cells.length) cells[idx + offset].value = ch;
    });
    const nextIdx = Math.min(idx + chars.length, cells.length - 1);
    cells[nextIdx]?.focus();
    emit();
  };

  /** @param {KeyboardEvent} e */
  const onKeydown = (e) => {
    const cell = e.target;
    if (!(cell instanceof HTMLInputElement) || !cell.classList.contains('j-pin-input__cell')) return;
    const cells = getCells();
    const idx = cells.indexOf(cell);
    if (idx < 0) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (cell.value) {
        cell.value = '';
        emit();
      } else if (idx > 0) {
        cells[idx - 1].value = '';
        cells[idx - 1].focus();
        emit();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      cells[idx - 1].focus();
    } else if (e.key === 'ArrowRight' && idx + 1 < cells.length) {
      e.preventDefault();
      cells[idx + 1].focus();
    } else if (e.key === 'Home' && cells.length) {
      e.preventDefault();
      cells[0].focus();
    } else if (e.key === 'End' && cells.length) {
      e.preventDefault();
      cells[cells.length - 1].focus();
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const valid = sanitizePinChars(e.key, getType());
      e.preventDefault();
      if (!valid.length) return;
      cell.value = valid[0];
      if (idx + 1 < cells.length) cells[idx + 1].focus();
      emit();
    }
  };

  /** @param {ClipboardEvent} e */
  const onPaste = (e) => {
    const cell = e.target;
    if (!(cell instanceof HTMLInputElement) || !cell.classList.contains('j-pin-input__cell')) return;
    const text = e.clipboardData?.getData('text') ?? '';
    const chars = sanitizePinChars(text, getType());
    if (!chars.length) return;
    e.preventDefault();
    const cells = getCells();
    const startIdx = chars.length >= cells.length ? 0 : Math.max(0, cells.indexOf(cell));
    chars.slice(0, cells.length - startIdx).forEach((ch, offset) => {
      cells[startIdx + offset].value = ch;
    });
    const focusIdx = Math.min(startIdx + chars.length, cells.length - 1);
    cells[focusIdx]?.focus();
    emit();
  };

  /** @param {FocusEvent} e */
  const onFocus = (e) => {
    if (e.target instanceof HTMLInputElement && e.target.classList.contains('j-pin-input__cell')) {
      e.target.select();
    }
  };

  syncFilled();
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onKeydown);
  root.addEventListener('paste', onPaste);
  root.addEventListener('focusin', onFocus);

  return () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('keydown', onKeydown);
    root.removeEventListener('paste', onPaste);
    root.removeEventListener('focusin', onFocus);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every unmanaged `.j-pin-input` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initPinInputs(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-pin-input:not([data-j-managed])').forEach((el) => {
    const pin = /** @type {HTMLElement} */ (el);
    if (bound.has(pin)) return;
    bound.set(pin, createPinInput(pin));
    made.push(pin);
  });
  return () =>
    made.forEach((pin) => {
      bound.get(pin)?.();
      bound.delete(pin);
    });
}
