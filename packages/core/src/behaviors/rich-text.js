// Jenni — Rich Text Editor behavior (composable editorial prose surface).
// Exports: createRichTextEditor, initRichTextEditors + formatting & selection helpers.

/**
 * @typedef {'p' | 'h2' | 'h3' | 'blockquote' | 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'bulletList' | 'orderedList' | 'link' | 'clear' | 'undo' | 'redo'} RichTextAction
 * @typedef {{
 *   block: 'p' | 'h2' | 'h3' | 'blockquote',
 *   bold: boolean,
 *   italic: boolean,
 *   underline: boolean,
 *   strike: boolean,
 *   code: boolean,
 *   bulletList: boolean,
 *   orderedList: boolean,
 *   link: boolean,
 *   linkHref: string
 * }} ActiveFormats
 */

/** @type {RichTextAction[][]} */
export const DEFAULT_TOOLBAR_GROUPS = [
  ['p', 'h2', 'h3', 'blockquote'],
  ['bold', 'italic', 'underline', 'strike', 'code'],
  ['bulletList', 'orderedList', 'link', 'clear'],
  ['undo', 'redo'],
];

/** @type {Record<RichTextAction, { label: string, short: string }>} */
export const TOOLBAR_META = {
  p: { label: 'Paragraph', short: 'P' },
  h2: { label: 'Heading 2', short: 'H2' },
  h3: { label: 'Heading 3', short: 'H3' },
  blockquote: { label: 'Quote', short: '❝' },
  bold: { label: 'Bold (⌘B)', short: 'B' },
  italic: { label: 'Italic (⌘I)', short: 'I' },
  underline: { label: 'Underline (⌘U)', short: 'U' },
  strike: { label: 'Strikethrough', short: 'S̶' },
  code: { label: 'Inline code (⌘E)', short: '<>' },
  bulletList: { label: 'Bullet list', short: '•≡' },
  orderedList: { label: 'Numbered list', short: '1.' },
  link: { label: 'Insert or edit link (⌘K)', short: '🔗' },
  clear: { label: 'Clear formatting', short: 'T×' },
  undo: { label: 'Undo', short: '↶' },
  redo: { label: 'Redo', short: '↷' },
};

/**
 * Check whether an HTML/editor surface has no visible text.
 * @param {HTMLElement} editor
 * @returns {boolean}
 */
export function isEditorEmpty(editor) {
  const text = (editor.textContent || '').replace(/\u200B/g, '').trim();
  return text.length === 0;
}

/**
 * Count words and characters from plain text inside `editor` (or HTML string).
 * @param {HTMLElement | string} source
 * @returns {{ words: number, chars: number }}
 */
export function countProseStats(source) {
  let raw = '';
  if (typeof source === 'string') {
    raw = source
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ');
  } else {
    raw = source.innerText || source.textContent || '';
  }
  const normalized = raw.replace(/\u200B/g, '');
  const trimmed = normalized.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = normalized.replace(/\r?\n/g, '').length;
  return { words, chars };
}

/**
 * Find closest ancestor matching `tagNames` inside `boundary`.
 * @param {Node | null} node
 * @param {HTMLElement} boundary
 * @param {string[]} tagNames
 * @returns {HTMLElement | null}
 */
function findAncestorTag(node, boundary, tagNames) {
  const upper = tagNames.map((t) => t.toUpperCase());
  /** @type {Node | null} */
  let cur = node;
  while (cur && cur !== boundary) {
    if (cur instanceof HTMLElement && upper.includes(cur.tagName)) {
      return cur;
    }
    cur = cur.parentNode;
  }
  return null;
}

/**
 * Save current selection `Range` if it resides inside `editor`.
 * @param {HTMLElement} editor
 * @returns {Range | null}
 */
export function saveSelectionRange(editor) {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;
  return range.cloneRange();
}

/**
 * Restore a previously saved `Range` inside `editor`.
 * @param {HTMLElement} editor
 * @param {Range | null} range
 */
export function restoreSelectionRange(editor, range) {
  editor.focus({ preventScroll: true });
  if (!range) return;
  const sel = document.getSelection();
  if (!sel) return;
  try {
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    /* ignore detached range */
  }
}

/**
 * Read active formatting state at the current selection inside `editor`.
 * @param {HTMLElement} editor
 * @returns {ActiveFormats}
 */
export function readActiveFormats(editor) {
  /** @type {ActiveFormats} */
  const empty = {
    block: 'p',
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    code: false,
    bulletList: false,
    orderedList: false,
    link: false,
    linkHref: '',
  };
  if (typeof document === 'undefined') return empty;
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return empty;
  const anchor = sel.anchorNode;
  if (!anchor || !editor.contains(anchor)) return empty;

  const blockEl = findAncestorTag(anchor, editor, ['H2', 'H3', 'BLOCKQUOTE', 'P']);
  /** @type {'p' | 'h2' | 'h3' | 'blockquote'} */
  let block = 'p';
  if (blockEl?.tagName === 'H2') block = 'h2';
  else if (blockEl?.tagName === 'H3') block = 'h3';
  else if (blockEl?.tagName === 'BLOCKQUOTE') block = 'blockquote';

  const codeEl = findAncestorTag(anchor, editor, ['CODE']);
  const linkEl = /** @type {HTMLAnchorElement | null} */ (
    findAncestorTag(anchor, editor, ['A'])
  );
  const ulEl = findAncestorTag(anchor, editor, ['UL']);
  const olEl = findAncestorTag(anchor, editor, ['OL']);

  /** @param {string} cmd */
  const qState = (cmd) => {
    try {
      return document.queryCommandState(cmd);
    } catch {
      return false;
    }
  };

  return {
    block,
    bold: qState('bold') || Boolean(findAncestorTag(anchor, editor, ['B', 'STRONG'])),
    italic: qState('italic') || Boolean(findAncestorTag(anchor, editor, ['I', 'EM'])),
    underline: qState('underline') || Boolean(findAncestorTag(anchor, editor, ['U'])),
    strike:
      qState('strikeThrough') ||
      Boolean(findAncestorTag(anchor, editor, ['S', 'STRIKE', 'DEL'])),
    code: Boolean(codeEl),
    bulletList: qState('insertUnorderedList') || Boolean(ulEl),
    orderedList: qState('insertOrderedList') || Boolean(olEl),
    link: Boolean(linkEl),
    linkHref: linkEl?.getAttribute('href') || '',
  };
}

/**
 * Toggle inline `<code>` around the current selection inside `editor`.
 * @param {HTMLElement} editor
 */
export function toggleInlineCode(editor) {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const existingCode = findAncestorTag(range.commonAncestorContainer, editor, ['CODE']);
  if (existingCode) {
    const parent = existingCode.parentNode;
    if (!parent) return;
    while (existingCode.firstChild) {
      parent.insertBefore(existingCode.firstChild, existingCode);
    }
    parent.removeChild(existingCode);
    return;
  }

  if (range.collapsed) {
    const code = document.createElement('code');
    code.textContent = '\u200B';
    range.insertNode(code);
    const nextRange = document.createRange();
    nextRange.setStart(code.firstChild || code, 1);
    nextRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nextRange);
    return;
  }

  const fragment = range.extractContents();
  const code = document.createElement('code');
  code.appendChild(fragment);
  range.insertNode(code);
  const nextRange = document.createRange();
  nextRange.selectNodeContents(code);
  sel.removeAllRanges();
  sel.addRange(nextRange);
}

/**
 * Normalize a user-entered URL so bare domains receive `https://`.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeLinkHref(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Apply a link `href` to the saved or current selection inside `editor`.
 * @param {HTMLElement} editor
 * @param {Range | null} savedRange
 * @param {string} rawUrl
 */
export function applyLinkAtRange(editor, savedRange, rawUrl) {
  const href = normalizeLinkHref(rawUrl);
  restoreSelectionRange(editor, savedRange);
  if (!href) {
    removeLinkAtRange(editor, savedRange);
    return;
  }
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const anchorEl = /** @type {HTMLAnchorElement | null} */ (
    findAncestorTag(sel.anchorNode, editor, ['A'])
  );
  if (anchorEl) {
    anchorEl.setAttribute('href', href);
    anchorEl.setAttribute('target', '_blank');
    anchorEl.setAttribute('rel', 'noopener noreferrer');
    return;
  }
  const range = sel.getRangeAt(0);
  if (range.collapsed) {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = href;
    range.insertNode(a);
    const after = document.createRange();
    after.setStartAfter(a);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  } else {
    document.execCommand('createLink', false, href);
    const created = /** @type {HTMLAnchorElement | null} */ (
      findAncestorTag(sel.anchorNode, editor, ['A'])
    );
    if (created) {
      created.setAttribute('target', '_blank');
      created.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

/**
 * Remove `<a>` wrapper at saved or current selection inside `editor`.
 * @param {HTMLElement} editor
 * @param {Range | null} savedRange
 */
export function removeLinkAtRange(editor, savedRange) {
  restoreSelectionRange(editor, savedRange);
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const anchorEl = findAncestorTag(sel.anchorNode, editor, ['A']);
  if (anchorEl && anchorEl.parentNode) {
    const parent = anchorEl.parentNode;
    while (anchorEl.firstChild) {
      parent.insertBefore(anchorEl.firstChild, anchorEl);
    }
    parent.removeChild(anchorEl);
  } else {
    document.execCommand('unlink', false);
  }
}

/**
 * Execute a non-link formatting action inside `editor`.
 * @param {HTMLElement} editor
 * @param {Exclude<RichTextAction, 'link'>} action
 */
export function execRichTextAction(editor, action) {
  editor.focus({ preventScroll: true });
  switch (action) {
    case 'p':
      document.execCommand('formatBlock', false, 'p');
      break;
    case 'h2':
      document.execCommand('formatBlock', false, 'h2');
      break;
    case 'h3':
      document.execCommand('formatBlock', false, 'h3');
      break;
    case 'blockquote': {
      const active = readActiveFormats(editor);
      document.execCommand('formatBlock', false, active.block === 'blockquote' ? 'p' : 'blockquote');
      break;
    }
    case 'bold':
      document.execCommand('bold', false);
      break;
    case 'italic':
      document.execCommand('italic', false);
      break;
    case 'underline':
      document.execCommand('underline', false);
      break;
    case 'strike':
      document.execCommand('strikeThrough', false);
      break;
    case 'code':
      toggleInlineCode(editor);
      break;
    case 'bulletList':
      document.execCommand('insertUnorderedList', false);
      break;
    case 'orderedList':
      document.execCommand('insertOrderedList', false);
      break;
    case 'clear': {
      const sel = document.getSelection();
      const codeEl = sel?.anchorNode
        ? findAncestorTag(sel.anchorNode, editor, ['CODE'])
        : null;
      if (codeEl && codeEl.parentNode) {
        const p = codeEl.parentNode;
        while (codeEl.firstChild) p.insertBefore(codeEl.firstChild, codeEl);
        p.removeChild(codeEl);
      }
      document.execCommand('removeFormat', false);
      document.execCommand('formatBlock', false, 'p');
      break;
    }
    case 'undo':
      document.execCommand('undo', false);
      break;
    case 'redo':
      document.execCommand('redo', false);
      break;
    default:
      break;
  }
}

/**
 * Hydrate an unmanaged `.j-rich-text` editor for plain HTML.
 * @param {HTMLElement} root
 * @param {{
 *   placeholder?: string,
 *   toolbar?: RichTextAction[][],
 *   showFooter?: boolean,
 *   onChange?: (html: string) => void
 * }} [options]
 * @returns {{ destroy: () => void, getHTML: () => string, setHTML: (html: string) => void }}
 */
export function createRichTextEditor(root, options = {}) {
  let toolbar = /** @type {HTMLElement | null} */ (
    root.querySelector('.j-rich-text__toolbar')
  );
  let linkBar = /** @type {HTMLElement | null} */ (
    root.querySelector('.j-rich-text__link-bar')
  );
  let content = /** @type {HTMLElement | null} */ (
    root.querySelector('.j-rich-text__content')
  );
  let footer = /** @type {HTMLElement | null} */ (
    root.querySelector('.j-rich-text__footer')
  );

  const groups = options.toolbar ?? DEFAULT_TOOLBAR_GROUPS;
  const readonly = root.hasAttribute('data-readonly');
  const disabled = root.getAttribute('aria-disabled') === 'true';

  if (!toolbar && !readonly) {
    toolbar = document.createElement('div');
    toolbar.className = 'j-rich-text__toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Formatting');
    groups.forEach((group, gIdx) => {
      if (gIdx > 0) {
        const sep = document.createElement('span');
        sep.className = 'j-rich-text__sep';
        sep.setAttribute('aria-hidden', 'true');
        toolbar?.appendChild(sep);
      }
      const grpEl = document.createElement('div');
      grpEl.className = 'j-rich-text__group';
      for (const act of group) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'j-rich-text__btn';
        btn.dataset.action = act;
        btn.setAttribute('aria-label', TOOLBAR_META[act].label);
        btn.title = TOOLBAR_META[act].label;
        btn.textContent = TOOLBAR_META[act].short;
        grpEl.appendChild(btn);
      }
      toolbar?.appendChild(grpEl);
    });
    root.prepend(toolbar);
  }

  if (!linkBar && !readonly) {
    linkBar = document.createElement('div');
    linkBar.className = 'j-rich-text__link-bar';
    linkBar.hidden = true;
    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'j-rich-text__link-input';
    input.placeholder = 'https://example.com';
    input.setAttribute('aria-label', 'Link URL');
    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'j-rich-text__link-btn';
    applyBtn.dataset.primary = '';
    applyBtn.dataset.linkAct = 'apply';
    applyBtn.textContent = 'Apply';
    const unlinkBtn = document.createElement('button');
    unlinkBtn.type = 'button';
    unlinkBtn.className = 'j-rich-text__link-btn';
    unlinkBtn.dataset.danger = '';
    unlinkBtn.dataset.linkAct = 'remove';
    unlinkBtn.textContent = 'Remove';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'j-rich-text__link-btn';
    cancelBtn.dataset.linkAct = 'cancel';
    cancelBtn.textContent = 'Cancel';
    linkBar.append(input, applyBtn, unlinkBtn, cancelBtn);
    if (toolbar) toolbar.after(linkBar);
    else root.prepend(linkBar);
  }

  if (!content) {
    content = document.createElement('div');
    content.className = 'j-rich-text__content';
    root.appendChild(content);
  }
  content.contentEditable = readonly || disabled ? 'false' : 'true';
  content.setAttribute('role', 'textbox');
  content.setAttribute('aria-multiline', 'true');
  if (options.placeholder && !content.dataset.placeholder) {
    content.dataset.placeholder = options.placeholder;
  }

  if (!footer && (options.showFooter ?? root.dataset.footer !== 'false')) {
    footer = document.createElement('div');
    footer.className = 'j-rich-text__footer';
    const counts = document.createElement('span');
    counts.className = 'j-rich-text__counts';
    footer.appendChild(counts);
    root.appendChild(footer);
  }

  const editorEl = content;
  const linkInput = /** @type {HTMLInputElement | null} */ (
    linkBar?.querySelector('.j-rich-text__link-input') ?? null
  );
  /** @type {Range | null} */
  let savedRange = null;

  function syncState() {
    if (isEditorEmpty(editorEl)) editorEl.dataset.empty = '';
    else delete editorEl.dataset.empty;

    const formats = readActiveFormats(editorEl);
    toolbar?.querySelectorAll('[data-action]').forEach((node) => {
      const btn = /** @type {HTMLElement} */ (node);
      const act = /** @type {RichTextAction} */ (btn.dataset.action);
      let active = false;
      if (act === 'p' || act === 'h2' || act === 'h3' || act === 'blockquote') {
        active = formats.block === act;
      } else if (
        act === 'bold' ||
        act === 'italic' ||
        act === 'underline' ||
        act === 'strike' ||
        act === 'code' ||
        act === 'bulletList' ||
        act === 'orderedList' ||
        act === 'link'
      ) {
        active = formats[act];
      }
      if (act !== 'clear' && act !== 'undo' && act !== 'redo') {
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    });

    if (footer) {
      const { words, chars } = countProseStats(editorEl);
      const countsEl = footer.querySelector('.j-rich-text__counts') || footer;
      countsEl.textContent = `${words} ${words === 1 ? 'word' : 'words'} · ${chars} ${chars === 1 ? 'char' : 'chars'}`;
    }
  }

  function emitChange() {
    syncState();
    const html = isEditorEmpty(editorEl) ? '' : editorEl.innerHTML;
    options.onChange?.(html);
    root.dispatchEvent(
      new CustomEvent('j-change', { bubbles: true, detail: { value: html } }),
    );
  }

  function openLinkBar() {
    if (!linkBar || !linkInput) return;
    savedRange = saveSelectionRange(editorEl);
    const formats = readActiveFormats(editorEl);
    linkInput.value = formats.linkHref || '';
    linkBar.hidden = false;
    linkInput.focus();
    linkInput.select();
  }

  function closeLinkBar(restore = true) {
    if (!linkBar) return;
    linkBar.hidden = true;
    if (restore) restoreSelectionRange(editorEl, savedRange);
    syncState();
  }

  /** @param {MouseEvent} e */
  const onToolbarMouseDown = (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-action]') : null;
    if (btn) e.preventDefault();
  };

  /** @param {MouseEvent} e */
  const onToolbarClick = (e) => {
    const btn = /** @type {HTMLElement | null} */ (
      e.target instanceof Element ? e.target.closest('[data-action]') : null
    );
    if (!btn || btn.hasAttribute('disabled')) return;
    const act = /** @type {RichTextAction} */ (btn.dataset.action);
    if (act === 'link') {
      if (linkBar && !linkBar.hidden) closeLinkBar(true);
      else openLinkBar();
      return;
    }
    execRichTextAction(editorEl, act);
    emitChange();
  };

  /** @param {MouseEvent} e */
  const onLinkBarClick = (e) => {
    const btn = /** @type {HTMLElement | null} */ (
      e.target instanceof Element ? e.target.closest('[data-link-act]') : null
    );
    if (!btn) return;
    const act = btn.dataset.linkAct;
    if (act === 'apply') {
      applyLinkAtRange(editorEl, savedRange, linkInput?.value || '');
      closeLinkBar(false);
      emitChange();
    } else if (act === 'remove') {
      removeLinkAtRange(editorEl, savedRange);
      closeLinkBar(false);
      emitChange();
    } else if (act === 'cancel') {
      closeLinkBar(true);
    }
  };

  /** @param {KeyboardEvent} e */
  const onLinkInputKeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyLinkAtRange(editorEl, savedRange, linkInput?.value || '');
      closeLinkBar(false);
      emitChange();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeLinkBar(true);
    }
  };

  /** @param {KeyboardEvent} e */
  const onEditorKeydown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'b') {
      e.preventDefault();
      execRichTextAction(editorEl, 'bold');
      emitChange();
    } else if (key === 'i') {
      e.preventDefault();
      execRichTextAction(editorEl, 'italic');
      emitChange();
    } else if (key === 'u') {
      e.preventDefault();
      execRichTextAction(editorEl, 'underline');
      emitChange();
    } else if (key === 'e') {
      e.preventDefault();
      execRichTextAction(editorEl, 'code');
      emitChange();
    } else if (key === 'k') {
      e.preventDefault();
      openLinkBar();
    }
  };

  const onSelectionChange = () => {
    const sel = document.getSelection();
    if (sel?.anchorNode && editorEl.contains(sel.anchorNode)) {
      syncState();
    }
  };

  toolbar?.addEventListener('mousedown', onToolbarMouseDown);
  toolbar?.addEventListener('click', onToolbarClick);
  linkBar?.addEventListener('click', onLinkBarClick);
  linkInput?.addEventListener('keydown', onLinkInputKeydown);
  editorEl.addEventListener('input', emitChange);
  editorEl.addEventListener('keydown', onEditorKeydown);
  document.addEventListener('selectionchange', onSelectionChange);

  syncState();

  return {
    destroy() {
      toolbar?.removeEventListener('mousedown', onToolbarMouseDown);
      toolbar?.removeEventListener('click', onToolbarClick);
      linkBar?.removeEventListener('click', onLinkBarClick);
      linkInput?.removeEventListener('keydown', onLinkInputKeydown);
      editorEl.removeEventListener('input', emitChange);
      editorEl.removeEventListener('keydown', onEditorKeydown);
      document.removeEventListener('selectionchange', onSelectionChange);
    },
    getHTML() {
      return isEditorEmpty(editorEl) ? '' : editorEl.innerHTML;
    },
    /** @param {string} html */
    setHTML(html) {
      editorEl.innerHTML = html || '';
      syncState();
    },
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init unmanaged `.j-rich-text` elements inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initRichTextEditors(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-rich-text:not([data-j-managed])').forEach((el) => {
    const rte = /** @type {HTMLElement} */ (el);
    if (bound.has(rte)) return;
    const ctrl = createRichTextEditor(rte);
    bound.set(rte, () => ctrl.destroy());
    made.push(rte);
  });
  return () =>
    made.forEach((rte) => {
      bound.get(rte)?.();
      bound.delete(rte);
    });
}
