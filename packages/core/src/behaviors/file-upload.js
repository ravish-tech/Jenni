// Jenni — File Upload / Dropzone behavior (drag highlight, byte formatting, maxSize validation).

/**
 * Format byte size into human-readable units (`B`, `KB`, `MB`, `GB`).
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/**
 * Validate a file against optional `maxSize` (bytes) and `accept` filter.
 * @param {{ name: string, size: number, type?: string }} file
 * @param {{ maxSize?: number, accept?: string }} [opts]
 * @returns {string | null} Error message, or null when valid.
 */
export function validateUploadFile(file, opts = {}) {
  const { maxSize, accept } = opts;
  if (typeof maxSize === 'number' && maxSize > 0 && file.size > maxSize) {
    return `Exceeds maximum size of ${formatFileSize(maxSize)}`;
  }
  if (accept && accept.trim()) {
    const tokens = accept
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (tokens.length) {
      const name = file.name.toLowerCase();
      const mime = (file.type || '').toLowerCase();
      const ok = tokens.some((tok) => {
        if (tok.startsWith('.')) return name.endsWith(tok);
        if (tok.endsWith('/*')) return mime.startsWith(tok.slice(0, -1));
        return mime === tok;
      });
      if (!ok) return `File type not accepted (${accept})`;
    }
  }
  return null;
}

const FILE_SVG =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2H4.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.5L9.5 2Z"/><path d="M9.5 2v3.5H13"/></svg>';
const REMOVE_SVG =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>';

/**
 * Wire one `.j-file-upload` root for plain HTML.
 * @param {HTMLElement} root
 * @returns {() => void}
 */
export function createFileUpload(root) {
  const dropzone = /** @type {HTMLElement | null} */ (root.querySelector('.j-file-upload__dropzone'));
  const input = /** @type {HTMLInputElement | null} */ (root.querySelector('.j-file-upload__input'));
  if (!dropzone || !input) return () => {};

  let list = /** @type {HTMLUListElement | null} */ (root.querySelector('.j-file-upload__list'));
  /** @type {Array<{ file: File, error: string | null }>} */
  let entries = [];
  let dragDepth = 0;

  const render = () => {
    if (!entries.length) {
      list?.remove();
      list = null;
      return;
    }
    if (!list) {
      list = document.createElement('ul');
      list.className = 'j-file-upload__list';
      root.append(list);
    }
    list.innerHTML = '';
    entries.forEach((entry, idx) => {
      const li = document.createElement('li');
      li.className = 'j-file-upload__item';
      if (entry.error) li.setAttribute('data-invalid', '');

      const icon = document.createElement('span');
      icon.className = 'j-file-upload__file-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = FILE_SVG;

      const meta = document.createElement('div');
      meta.className = 'j-file-upload__meta';

      const name = document.createElement('span');
      name.className = 'j-file-upload__name';
      name.textContent = entry.file.name;

      const sub = document.createElement('span');
      if (entry.error) {
        sub.className = 'j-file-upload__error';
        sub.textContent = `${formatFileSize(entry.file.size)} · ${entry.error}`;
      } else {
        sub.className = 'j-file-upload__size';
        sub.textContent = formatFileSize(entry.file.size);
      }
      meta.append(name, sub);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'j-file-upload__remove';
      btn.setAttribute('aria-label', `Remove ${entry.file.name}`);
      btn.innerHTML = REMOVE_SVG;
      btn.addEventListener('click', () => {
        entries.splice(idx, 1);
        render();
        emit();
      });

      li.append(icon, meta, btn);
      list?.append(li);
    });
  };

  const emit = () => {
    const validFiles = entries.filter((e) => !e.error).map((e) => e.file);
    root.dispatchEvent(new CustomEvent('j-change', { bubbles: true, detail: { files: validFiles } }));
  };

  /** @param {FileList | File[]} incoming */
  const handleFiles = (incoming) => {
    if (input.disabled || root.getAttribute('aria-disabled') === 'true') return;
    const maxSize = Number(root.dataset.maxSize || 0) || undefined;
    const accept = input.getAttribute('accept') || undefined;
    const next = [...incoming].map((file) => ({
      file,
      error: validateUploadFile(file, { maxSize, accept }),
    }));
    entries = input.multiple ? [...entries, ...next] : next.slice(0, 1);
    input.value = '';
    render();
    emit();
  };

  /** @param {DragEvent} e */
  const onDragEnter = (e) => {
    e.preventDefault();
    if (input.disabled) return;
    dragDepth += 1;
    dropzone.setAttribute('data-dragging', '');
  };

  /** @param {DragEvent} e */
  const onDragOver = (e) => {
    e.preventDefault();
    if (!input.disabled && e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  /** @param {DragEvent} e */
  const onDragLeave = (e) => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dropzone.removeAttribute('data-dragging');
  };

  /** @param {DragEvent} e */
  const onDrop = (e) => {
    e.preventDefault();
    dragDepth = 0;
    dropzone.removeAttribute('data-dragging');
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  const onInputChange = () => {
    if (input.files?.length) handleFiles(input.files);
  };

  dropzone.addEventListener('dragenter', onDragEnter);
  dropzone.addEventListener('dragover', onDragOver);
  dropzone.addEventListener('dragleave', onDragLeave);
  dropzone.addEventListener('drop', onDrop);
  input.addEventListener('change', onInputChange);

  return () => {
    dropzone.removeEventListener('dragenter', onDragEnter);
    dropzone.removeEventListener('dragover', onDragOver);
    dropzone.removeEventListener('dragleave', onDragLeave);
    dropzone.removeEventListener('drop', onDrop);
    input.removeEventListener('change', onInputChange);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every unmanaged `.j-file-upload` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initFileUploads(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-file-upload:not([data-j-managed])').forEach((el) => {
    const upload = /** @type {HTMLElement} */ (el);
    if (bound.has(upload)) return;
    bound.set(upload, createFileUpload(upload));
    made.push(upload);
  });
  return () =>
    made.forEach((upload) => {
      bound.get(upload)?.();
      bound.delete(upload);
    });
}
