// Clipboard copy utility, zero-dependency multi-language syntax/diff tokenizer, and plain-HTML behaviors.

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @typedef {'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'type' | 'operator' | 'property' | 'punctuation'} CodeTokenType
 *
 * @typedef {'add' | 'del' | 'hunk' | null} CodeLineDiff
 *
 * @typedef {object} CodeToken
 * @property {CodeTokenType} type
 * @property {string} text
 *
 * @typedef {object} TokenizedCodeLine
 * @property {number} lineNumber
 * @property {CodeLineDiff} diff
 * @property {CodeToken[]} tokens
 *
 * @typedef {object} TokenizeOptions
 * @property {number} [startLine=1]
 * @property {boolean} [diff]
 */

/**
 * Copy text to the system clipboard with an SSR-safe hidden `<textarea>` fallback.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  const value = text == null ? '' : String(text);

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall back to execCommand('copy') when Clipboard API permissions are restricted.
    }
  }

  if (typeof document === 'undefined' || !document.body) {
    return false;
  }

  const prevFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.tabIndex = -1;
  textarea.style.cssText =
    'position:fixed;top:0;left:-9999px;width:1px;height:1px;padding:0;border:0;opacity:0;pointer-events:none;';

  document.body.appendChild(textarea);
  let copied = false;
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, value.length);
    copied = Boolean(document.execCommand && document.execCommand('copy'));
  } catch {
    copied = false;
  } finally {
    if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
    if (prevFocus && typeof prevFocus.focus === 'function') {
      try {
        prevFocus.focus({ preventScroll: true });
      } catch {
        // Ignore focus restoration errors.
      }
    }
  }
  return copied;
}

const JS_KEYWORDS = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'debugger', 'declare', 'default', 'delete', 'do', 'else', 'enum',
  'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'get', 'if',
  'implements', 'import', 'in', 'infer', 'instanceof', 'interface', 'is', 'keyof',
  'let', 'module', 'namespace', 'new', 'null', 'of', 'override', 'private',
  'protected', 'public', 'readonly', 'return', 'satisfies', 'set', 'static',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined',
  'var', 'void', 'while', 'with', 'yield',
]);

const JS_BUILTIN_TYPES = new Set([
  'any', 'bigint', 'boolean', 'never', 'number', 'object', 'string', 'symbol',
  'unknown', 'Array', 'ReadonlyArray', 'Record', 'Partial', 'Required', 'Readonly',
  'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'ReturnType', 'Parameters',
  'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Date', 'RegExp', 'Error',
  'HTMLElement', 'Element', 'Document', 'Event', 'MouseEvent', 'KeyboardEvent',
  'ReactNode', 'CSSProperties', 'VNode', 'Ref', 'ComputedRef',
]);

const PY_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'case', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'match',
  'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'self', 'cls', 'try',
  'while', 'with', 'yield',
]);

const PY_BUILTIN_TYPES = new Set([
  'int', 'float', 'str', 'bool', 'bytes', 'bytearray', 'list', 'dict', 'set',
  'frozenset', 'tuple', 'object', 'type', 'Any', 'Optional', 'Union', 'Callable',
  'Iterable', 'Iterator', 'Sequence', 'Mapping', 'List', 'Dict', 'Set', 'Tuple',
  'Exception', 'ValueError', 'TypeError', 'KeyError', 'RuntimeError',
]);

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL',
  'CROSS', 'NATURAL', 'ON', 'USING', 'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
  'BETWEEN', 'LIKE', 'ILIKE', 'IS', 'NULL', 'TRUE', 'FALSE', 'INSERT', 'INTO',
  'VALUES', 'UPDATE', 'SET', 'DELETE', 'TRUNCATE', 'CREATE', 'ALTER', 'DROP',
  'TABLE', 'TEMP', 'TEMPORARY', 'IF', 'INDEX', 'UNIQUE', 'VIEW', 'MATERIALIZED',
  'SCHEMA', 'DATABASE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'DEFAULT',
  'CHECK', 'CONSTRAINT', 'CASCADE', 'RESTRICT', 'GROUP', 'BY', 'ORDER', 'ASC',
  'DESC', 'NULLS', 'FIRST', 'LAST', 'HAVING', 'LIMIT', 'OFFSET', 'FETCH', 'NEXT',
  'ROWS', 'ONLY', 'UNION', 'INTERSECT', 'EXCEPT', 'ALL', 'DISTINCT', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'WITH', 'RECURSIVE', 'RETURNING', 'CONFLICT',
  'DO', 'NOTHING', 'OVER', 'PARTITION', 'WINDOW', 'FILTER', 'WITHIN', 'BEGIN',
  'COMMIT', 'ROLLBACK', 'TRANSACTION', 'GRANT', 'REVOKE', 'EXPLAIN', 'ANALYZE',
]);

const SQL_TYPES = new Set([
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'SERIAL', 'BIGSERIAL', 'TEXT',
  'VARCHAR', 'CHAR', 'CHARACTER', 'VARYING', 'BOOLEAN', 'BOOL', 'DATE', 'TIME',
  'TIMESTAMP', 'TIMESTAMPTZ', 'INTERVAL', 'UUID', 'JSON', 'JSONB', 'NUMERIC',
  'DECIMAL', 'REAL', 'FLOAT', 'DOUBLE', 'PRECISION', 'BYTEA', 'ARRAY',
]);

const SH_KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'fi', 'for', 'in', 'do', 'done', 'while', 'until',
  'case', 'esac', 'function', 'select', 'time', 'coproc', 'return', 'exit',
  'break', 'continue', 'export', 'local', 'readonly', 'declare', 'typeset',
  'unset', 'set', 'shift', 'source', 'alias', 'trap', 'wait', 'eval', 'exec',
  'true', 'false',
]);

const CSS_AT_KEYWORDS = new Set([
  'layer', 'media', 'container', 'supports', 'keyframes', 'import', 'property',
  'font-face', 'scope', 'starting-style', 'page', 'namespace', 'charset',
]);

const CSS_VALUE_KEYWORDS = new Set([
  'auto', 'none', 'inherit', 'initial', 'unset', 'revert', 'revert-layer',
  'currentColor', 'transparent', 'solid', 'dashed', 'dotted', 'double', 'hidden',
  'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid',
  'contents', 'relative', 'absolute', 'fixed', 'sticky', 'static', 'inset',
  'border-box', 'content-box', 'pointer', 'default', 'not-allowed', 'nowrap',
  'pre', 'pre-wrap', 'anywhere', 'tabular-nums', 'italic', 'normal', 'bold',
  'center', 'start', 'end', 'stretch', 'baseline', 'space-between', '1fr',
]);

/**
 * Normalize language aliases to canonical family identifiers.
 * @param {string | undefined | null} lang
 * @returns {string}
 */
export function normalizeCodeLanguage(lang) {
  const raw = String(lang ?? 'plain').trim().toLowerCase();
  if (!raw) return 'plain';
  switch (raw) {
    case 'typescript':
    case 'mts':
    case 'cts':
      return 'ts';
    case 'javascript':
    case 'mjs':
    case 'cjs':
      return 'js';
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'vue':
    case 'css':
    case 'json':
    case 'sql':
    case 'diff':
      return raw;
    case 'xml':
    case 'svg':
    case 'html':
      return 'html';
    case 'sh':
    case 'bash':
    case 'shell':
    case 'zsh':
      return raw === 'bash' ? 'bash' : 'sh';
    case 'py':
    case 'python':
      return 'python';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'patch':
      return 'diff';
    default:
      return 'plain';
  }
}

/**
 * Push a token while coalescing adjacent tokens of identical type.
 * @param {CodeToken[]} out
 * @param {CodeTokenType} type
 * @param {string} text
 */
function pushToken(out, type, text) {
  if (!text) return;
  const prev = out[out.length - 1];
  if (prev && prev.type === type) {
    prev.text += text;
  } else {
    out.push({ type, text });
  }
}

/**
 * Scan a quoted string starting at `start` (`'`, `"`, or `` ` ``).
 * @param {string} line
 * @param {number} start
 * @param {string} quote
 * @returns {{ end: number, closed: boolean }}
 */
function scanQuoted(line, start, quote) {
  let i = start + 1;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return { end: i + 1, closed: true };
    }
    i += 1;
  }
  return { end: line.length, closed: false };
}

/**
 * Scan a numeric literal (hex, binary, octal, decimal, scientific, separators).
 * @param {string} line
 * @param {number} start
 * @returns {number}
 */
function scanNumber(line, start) {
  let i = start;
  if (line[i] === '0' && i + 1 < line.length && /[xXbBoO]/.test(line[i + 1])) {
    i += 2;
    while (i < line.length && /[0-9a-fA-F_]/.test(line[i])) i += 1;
    if (line[i] === 'n') i += 1;
    return i;
  }
  while (i < line.length && /[0-9_]/.test(line[i])) i += 1;
  if (line[i] === '.' && /[0-9]/.test(line[i + 1] || '')) {
    i += 1;
    while (i < line.length && /[0-9_]/.test(line[i])) i += 1;
  }
  if (/[eE]/.test(line[i] || '')) {
    let e = i + 1;
    if (line[e] === '+' || line[e] === '-') e += 1;
    if (/[0-9]/.test(line[e] || '')) {
      i = e + 1;
      while (i < line.length && /[0-9_]/.test(line[i])) i += 1;
    }
  }
  if (line[i] === 'n') i += 1;
  return i;
}

const IDENT_START_RE = /[A-Za-z_$]/;
const IDENT_CONT_RE = /[A-Za-z0-9_$]/;

/**
 * Tokenize a single JS/TS/JSX/TSX line with mutable multi-line state.
 * @param {string} line
 * @param {boolean} jsx
 * @param {{ inBlockComment: boolean, inTemplate: boolean }} state
 * @returns {CodeToken[]}
 */
function tokenizeJsLine(line, jsx, state) {
  /** @type {CodeToken[]} */
  const out = [];
  let i = 0;
  const len = line.length;
  /** @type {string} */
  let prevSig = '';

  while (i < len) {
    if (state.inBlockComment) {
      const closeIdx = line.indexOf('*/', i);
      if (closeIdx === -1) {
        pushToken(out, 'comment', line.slice(i));
        return out;
      }
      pushToken(out, 'comment', line.slice(i, closeIdx + 2));
      i = closeIdx + 2;
      state.inBlockComment = false;
      continue;
    }

    if (state.inTemplate) {
      const res = scanQuoted(line, i - 1, '`');
      // scanQuoted started at i - 1 conceptually; scan manually from i:
      let j = i;
      let closed = false;
      while (j < len) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === '`') {
          j += 1;
          closed = true;
          break;
        }
        j += 1;
      }
      void res;
      pushToken(out, 'string', line.slice(i, j));
      i = j;
      if (closed) {
        state.inTemplate = false;
        prevSig = '`';
      }
      continue;
    }

    const ch = line[i];
    const next = line[i + 1] || '';

    // Whitespace
    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < len && /\s/.test(line[j])) j += 1;
      pushToken(out, 'plain', line.slice(i, j));
      i = j;
      continue;
    }

    // Line comment
    if (ch === '/' && next === '/') {
      pushToken(out, 'comment', line.slice(i));
      break;
    }

    // Block comment
    if (ch === '/' && next === '*') {
      const closeIdx = line.indexOf('*/', i + 2);
      if (closeIdx === -1) {
        pushToken(out, 'comment', line.slice(i));
        state.inBlockComment = true;
        break;
      }
      pushToken(out, 'comment', line.slice(i, closeIdx + 2));
      i = closeIdx + 2;
      continue;
    }

    // Strings & template literals
    if (ch === "'" || ch === '"' || ch === '`') {
      const { end, closed } = scanQuoted(line, i, ch);
      // Object key check for JSON-in-JS `'key':`
      let restIdx = end;
      while (restIdx < len && /\s/.test(line[restIdx])) restIdx += 1;
      const isObjKey =
        ch !== '`' &&
        line[restIdx] === ':' &&
        line[restIdx + 1] !== ':' &&
        (prevSig === '{' || prevSig === ',' || prevSig === '');
      pushToken(out, isObjKey ? 'property' : 'string', line.slice(i, end));
      if (ch === '`' && !closed) state.inTemplate = true;
      prevSig = ch;
      i = end;
      continue;
    }

    // Regex literal
    if (
      ch === '/' &&
      next !== '/' &&
      next !== '*' &&
      next !== '=' &&
      next !== '>' &&
      (prevSig === '' || /[=([{,!?:;&|+-]/.test(prevSig) || prevSig === 'kw')
    ) {
      let j = i + 1;
      let inCharClass = false;
      let valid = false;
      while (j < len) {
        const c = line[j];
        if (c === '\\') {
          j += 2;
          continue;
        }
        if (c === '[') inCharClass = true;
        else if (c === ']') inCharClass = false;
        else if (c === '/' && !inCharClass) {
          valid = j > i + 1;
          j += 1;
          while (j < len && /[dgimsuvy]/.test(line[j])) j += 1;
          break;
        }
        j += 1;
      }
      if (valid) {
        pushToken(out, 'string', line.slice(i, j));
        prevSig = '/';
        i = j;
        continue;
      }
    }

    // JSX opening or closing tag `<Button` / `</Button>` / `<div`
    if (jsx && ch === '<') {
      const tagMatch = line.slice(i).match(/^<(\/?)([A-Za-z][A-Za-z0-9._-]*)(?=[\s/>]|$)/);
      if (tagMatch) {
        const prefix = `<${tagMatch[1]}`;
        const tagName = tagMatch[2];
        pushToken(out, 'punctuation', prefix);
        pushToken(out, /^[A-Z]/.test(tagName) ? 'type' : 'keyword', tagName);
        i += prefix.length + tagName.length;
        prevSig = 'tag';
        continue;
      }
    }

    // Decorator `@Component`
    if (ch === '@' && IDENT_START_RE.test(next)) {
      let j = i + 2;
      while (j < len && IDENT_CONT_RE.test(line[j])) j += 1;
      pushToken(out, 'function', line.slice(i, j));
      prevSig = 'id';
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(next))) {
      const end = scanNumber(line, i);
      pushToken(out, 'number', line.slice(i, end));
      prevSig = 'num';
      i = end;
      continue;
    }

    // Identifiers
    if (IDENT_START_RE.test(ch)) {
      let j = i + 1;
      while (j < len && IDENT_CONT_RE.test(line[j])) j += 1;
      // Allow hyphenated JSX attributes like `aria-label` or `data-variant`
      if (jsx && line[j] === '-' && /[a-z]/.test(ch)) {
        while (j < len && /[A-Za-z0-9_-]/.test(line[j])) j += 1;
      }
      const word = line.slice(i, j);
      let k = j;
      while (k < len && /\s/.test(line[k])) k += 1;
      const after = line[k] || '';

      /** @type {CodeTokenType} */
      let tokType = 'plain';
      if (prevSig === '.') {
        tokType = after === '(' ? 'function' : 'property';
      } else if (jsx && after === '=' && line[k + 1] !== '=' && line[k + 1] !== '>') {
        // JSX prop `variant="outline"` or `strokeWidth={1.75}`
        if (prevSig === 'tag' || prevSig === '}' || prevSig === '"' || prevSig === "'") {
          tokType = 'property';
        }
      }

      if (tokType === 'plain') {
        if (JS_KEYWORDS.has(word)) {
          tokType = 'keyword';
        } else if (JS_BUILTIN_TYPES.has(word) || /^[A-Z][A-Za-z0-9_$]*$/.test(word)) {
          tokType = 'type';
        } else if (after === '(') {
          tokType = 'function';
        } else if (
          (after === ':' && line[k + 1] !== ':') ||
          (after === '?' && line[k + 1] === ':')
        ) {
          tokType = prevSig === 'case' ? 'plain' : 'property';
        }
      }

      pushToken(out, tokType, word);
      prevSig = tokType === 'keyword' ? (word === 'case' ? 'case' : 'kw') : 'id';
      i = j;
      continue;
    }

    // Multi-char operators
    const three = line.slice(i, i + 3);
    const two = line.slice(i, i + 2);
    if (
      three === '===' ||
      three === '!==' ||
      three === '...' ||
      three === '>>>' ||
      three === '??=' ||
      three === '&&=' ||
      three === '||='
    ) {
      pushToken(out, 'operator', three);
      prevSig = '=';
      i += 3;
      continue;
    }
    if (
      two === '=>' ||
      two === '==' ||
      two === '!=' ||
      two === '<=' ||
      two === '>=' ||
      two === '&&' ||
      two === '||' ||
      two === '??' ||
      two === '+=' ||
      two === '-=' ||
      two === '*=' ||
      two === '/=' ||
      two === '++' ||
      two === '--' ||
      two === '<<' ||
      two === '>>'
    ) {
      pushToken(out, 'operator', two);
      prevSig = '=';
      i += 2;
      continue;
    }
    if (two === '?.') {
      pushToken(out, 'punctuation', two);
      prevSig = '.';
      i += 2;
      continue;
    }
    if (jsx && two === '/>') {
      pushToken(out, 'punctuation', two);
      prevSig = '>';
      i += 2;
      continue;
    }

    if ('{}()[];,.'.includes(ch)) {
      pushToken(out, 'punctuation', ch);
      prevSig = ch;
      i += 1;
      continue;
    }

    if (ch === ':') {
      pushToken(out, 'punctuation', ch);
      prevSig = ':';
      i += 1;
      continue;
    }

    if ('=+-*/%!~&|^<>?'.includes(ch)) {
      pushToken(out, 'operator', ch);
      prevSig = ch;
      i += 1;
      continue;
    }

    pushToken(out, 'plain', ch);
    i += 1;
  }

  return out;
}

/**
 * Tokenize a CSS line with block-comment state.
 * @param {string} line
 * @param {{ inBlockComment: boolean, braceDepth: number }} state
 * @returns {CodeToken[]}
 */
function tokenizeCssLine(line, state) {
  /** @type {CodeToken[]} */
  const out = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    if (state.inBlockComment) {
      const closeIdx = line.indexOf('*/', i);
      if (closeIdx === -1) {
        pushToken(out, 'comment', line.slice(i));
        return out;
      }
      pushToken(out, 'comment', line.slice(i, closeIdx + 2));
      i = closeIdx + 2;
      state.inBlockComment = false;
      continue;
    }

    const ch = line[i];
    const next = line[i + 1] || '';

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < len && /\s/.test(line[j])) j += 1;
      pushToken(out, 'plain', line.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '/' && next === '*') {
      const closeIdx = line.indexOf('*/', i + 2);
      if (closeIdx === -1) {
        pushToken(out, 'comment', line.slice(i));
        state.inBlockComment = true;
        break;
      }
      pushToken(out, 'comment', line.slice(i, closeIdx + 2));
      i = closeIdx + 2;
      continue;
    }

    if (ch === "'" || ch === '"') {
      const { end } = scanQuoted(line, i, ch);
      pushToken(out, 'string', line.slice(i, end));
      i = end;
      continue;
    }

    // At-rule `@layer`, `@media`
    if (ch === '@' && /[A-Za-z-]/.test(next)) {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_-]/.test(line[j])) j += 1;
      const name = line.slice(i + 1, j);
      pushToken(out, CSS_AT_KEYWORDS.has(name) ? 'keyword' : 'function', line.slice(i, j));
      i = j;
      continue;
    }

    // CSS custom property `--j-accent`
    if (ch === '-' && next === '-' && /[A-Za-z_]/.test(line[i + 2] || '')) {
      let j = i + 2;
      while (j < len && /[A-Za-z0-9_-]/.test(line[j])) j += 1;
      pushToken(out, 'property', line.slice(i, j));
      i = j;
      continue;
    }

    // Hex color `#1a2b3c` inside declaration block
    if (ch === '#' && /[0-9a-fA-F]/.test(next)) {
      let j = i + 1;
      while (j < len && /[0-9a-fA-F]/.test(line[j])) j += 1;
      const hexLen = j - (i + 1);
      if (state.braceDepth > 0 && (hexLen === 3 || hexLen === 4 || hexLen === 6 || hexLen === 8)) {
        pushToken(out, 'number', line.slice(i, j));
        i = j;
        continue;
      }
    }

    // Class or ID selector `.j-code-block`
    if ((ch === '.' || ch === '#') && /[A-Za-z_-]/.test(next)) {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_-]/.test(line[j])) j += 1;
      pushToken(out, 'type', line.slice(i, j));
      i = j;
      continue;
    }

    // Numbers + units (`16px`, `0.875rem`, `99%`, `150ms`)
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(next))) {
      let j = scanNumber(line, i);
      if (line[j] === '%') {
        j += 1;
      } else if (/[A-Za-z]/.test(line[j] || '')) {
        while (j < len && /[A-Za-z]/.test(line[j])) j += 1;
      }
      pushToken(out, 'number', line.slice(i, j));
      i = j;
      continue;
    }

    // Pseudo-selector `:where`, `:hover`, `::selection`
    if (ch === ':' && /[A-Za-z:]/.test(next)) {
      let j = i + 1;
      if (line[j] === ':') j += 1;
      if (/[A-Za-z-]/.test(line[j] || '')) {
        while (j < len && /[A-Za-z0-9_-]/.test(line[j])) j += 1;
        pushToken(out, 'keyword', line.slice(i, j));
        i = j;
        continue;
      }
    }

    // Words (properties, functions, values, tag selectors)
    if (/[A-Za-z_]/.test(ch) || (ch === '-' && /[A-Za-z]/.test(next))) {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_-]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      let k = j;
      while (k < len && /\s/.test(line[k])) k += 1;
      const after = line[k] || '';

      /** @type {CodeTokenType} */
      let tokType = 'plain';
      if (after === '(') {
        tokType = 'function';
      } else if (after === ':' && line[k + 1] !== ':' && state.braceDepth > 0) {
        tokType = 'property';
      } else if (CSS_VALUE_KEYWORDS.has(word)) {
        tokType = 'keyword';
      } else if (state.braceDepth === 0) {
        tokType = 'keyword';
      }
      pushToken(out, tokType, word);
      i = j;
      continue;
    }

    if (ch === '{') {
      state.braceDepth += 1;
      pushToken(out, 'punctuation', ch);
      i += 1;
      continue;
    }
    if (ch === '}') {
      state.braceDepth = Math.max(0, state.braceDepth - 1);
      pushToken(out, 'punctuation', ch);
      i += 1;
      continue;
    }
    if ('()[];,:'.includes(ch)) {
      pushToken(out, 'punctuation', ch);
      i += 1;
      continue;
    }
    if ('+-*/=<>~|&'.includes(ch)) {
      pushToken(out, 'operator', ch);
      i += 1;
      continue;
    }

    pushToken(out, 'plain', ch);
    i += 1;
  }

  return out;
}

/**
 * Tokenize an HTML / Vue template line with comment & tag state.
 * @param {string} line
 * @param {{ inHtmlComment: boolean, inTag: boolean }} state
 * @returns {CodeToken[]}
 */
function tokenizeHtmlLine(line, state) {
  /** @type {CodeToken[]} */
  const out = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    if (state.inHtmlComment) {
      const closeIdx = line.indexOf('-->', i);
      if (closeIdx === -1) {
        pushToken(out, 'comment', line.slice(i));
        return out;
      }
      pushToken(out, 'comment', line.slice(i, closeIdx + 3));
      i = closeIdx + 3;
      state.inHtmlComment = false;
      continue;
    }

    if (state.inTag) {
      const ch = line[i];
      if (/\s/.test(ch)) {
        let j = i + 1;
        while (j < len && /\s/.test(line[j])) j += 1;
        pushToken(out, 'plain', line.slice(i, j));
        i = j;
        continue;
      }
      if (ch === '/' && line[i + 1] === '>') {
        pushToken(out, 'punctuation', '/>');
        state.inTag = false;
        i += 2;
        continue;
      }
      if (ch === '>') {
        pushToken(out, 'punctuation', '>');
        state.inTag = false;
        i += 1;
        continue;
      }
      if (ch === '=') {
        pushToken(out, 'operator', '=');
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const { end } = scanQuoted(line, i, ch);
        pushToken(out, 'string', line.slice(i, end));
        i = end;
        continue;
      }
      // Attribute / Vue directive (`v-if`, `:code`, `@copy`, `#actions`, `data-size`)
      if (/[A-Za-z_:@#?]/.test(ch)) {
        let j = i + 1;
        while (j < len && /[A-Za-z0-9_.:@#?-\[\]]/.test(line[j])) j += 1;
        pushToken(out, 'property', line.slice(i, j));
        i = j;
        continue;
      }
      pushToken(out, 'punctuation', ch);
      i += 1;
      continue;
    }

    // Outside of tag
    if (line.startsWith('<!--', i)) {
      const closeIdx = line.indexOf('-->', i + 4);
      if (closeIdx === -1) {
        pushToken(out, 'comment', line.slice(i));
        state.inHtmlComment = true;
        break;
      }
      pushToken(out, 'comment', line.slice(i, closeIdx + 3));
      i = closeIdx + 3;
      continue;
    }

    if (line.startsWith('<!', i)) {
      const closeIdx = line.indexOf('>', i + 2);
      const end = closeIdx === -1 ? len : closeIdx + 1;
      pushToken(out, 'keyword', line.slice(i, end));
      i = end;
      continue;
    }

    // Vue mustache interpolation `{{ expr }}`
    if (line.startsWith('{{', i)) {
      const closeIdx = line.indexOf('}}', i + 2);
      if (closeIdx !== -1) {
        pushToken(out, 'punctuation', '{{');
        const expr = line.slice(i + 2, closeIdx);
        const exprTokens = tokenizeJsLine(expr, false, {
          inBlockComment: false,
          inTemplate: false,
        });
        for (const t of exprTokens) pushToken(out, t.type, t.text);
        pushToken(out, 'punctuation', '}}');
        i = closeIdx + 2;
        continue;
      }
    }

    if (line[i] === '<') {
      const tagMatch = line.slice(i).match(/^<(\/?)([A-Za-z][A-Za-z0-9._:-]*)/);
      if (tagMatch) {
        const openPunc = `<${tagMatch[1]}`;
        const tagName = tagMatch[2];
        pushToken(out, 'punctuation', openPunc);
        pushToken(out, /^[A-Z]/.test(tagName) ? 'type' : 'keyword', tagName);
        i += openPunc.length + tagName.length;
        state.inTag = true;
        continue;
      }
    }

    // Plain text until next `<` or `{{`
    let j = i + 1;
    while (j < len && line[j] !== '<' && !line.startsWith('{{', j)) j += 1;
    pushToken(out, 'plain', line.slice(i, j));
    i = j;
  }

  return out;
}

/**
 * Tokenize a JSON line.
 * @param {string} line
 * @returns {CodeToken[]}
 */
function tokenizeJsonLine(line) {
  /** @type {CodeToken[]} */
  const out = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    const ch = line[i];
    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < len && /\s/.test(line[j])) j += 1;
      pushToken(out, 'plain', line.slice(i, j));
      i = j;
      continue;
    }
    if (ch === '"') {
      const { end } = scanQuoted(line, i, '"');
      let k = end;
      while (k < len && /\s/.test(line[k])) k += 1;
      pushToken(out, line[k] === ':' ? 'property' : 'string', line.slice(i, end));
      i = end;
      continue;
    }
    if (ch === '-' && /[0-9]/.test(line[i + 1] || '')) {
      const end = scanNumber(line, i + 1);
      pushToken(out, 'number', line.slice(i, end));
      i = end;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      const end = scanNumber(line, i);
      pushToken(out, 'number', line.slice(i, end));
      i = end;
      continue;
    }
    if (/[a-z]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[a-z]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      const isKw = word === 'true' || word === 'false' || word === 'null';
      pushToken(out, isKw ? 'keyword' : 'plain', word);
      i = j;
      continue;
    }
    if ('{}[]:,'.includes(ch)) {
      pushToken(out, 'punctuation', ch);
      i += 1;
      continue;
    }
    pushToken(out, 'plain', ch);
    i += 1;
  }
  return out;
}

/**
 * Tokenize a SQL line with multi-line comment state.
 * @param {string} line
 * @param {{ inBlockComment: boolean }} state
 * @returns {CodeToken[]}
 */
function tokenizeSqlLine(line, state) {
  /** @type {CodeToken[]} */
  const out = [];
  let i = 0;
  const len = line.length;
  let prevDot = false;

  while (i < len) {
    if (state.inBlockComment) {
      const closeIdx = line.indexOf('*/', i);
      if (closeIdx === -1) {
        pushToken(out, 'comment', line.slice(i));
        return out;
      }
      pushToken(out, 'comment', line.slice(i, closeIdx + 2));
      i = closeIdx + 2;
      state.inBlockComment = false;
      continue;
    }

    const ch = line[i];
    const next = line[i + 1] || '';

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < len && /\s/.test(line[j])) j += 1;
      pushToken(out, 'plain', line.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '-' && next === '-') {
      pushToken(out, 'comment', line.slice(i));
      break;
    }

    if (ch === '/' && next === '*') {
      const closeIdx = line.indexOf('*/', i + 2);
      if (closeIdx === -1) {
        pushToken(out, 'comment', line.slice(i));
        state.inBlockComment = true;
        break;
      }
      pushToken(out, 'comment', line.slice(i, closeIdx + 2));
      i = closeIdx + 2;
      continue;
    }

    if (ch === "'") {
      let j = i + 1;
      while (j < len) {
        if (line[j] === "'" && line[j + 1] === "'") {
          j += 2;
          continue;
        }
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === "'") {
          j += 1;
          break;
        }
        j += 1;
      }
      pushToken(out, 'string', line.slice(i, j));
      prevDot = false;
      i = j;
      continue;
    }

    if (ch === '"' || ch === '`') {
      const { end } = scanQuoted(line, i, ch);
      pushToken(out, 'property', line.slice(i, end));
      prevDot = false;
      i = end;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const end = scanNumber(line, i);
      pushToken(out, 'number', line.slice(i, end));
      prevDot = false;
      i = end;
      continue;
    }

    if (ch === '$' && /[0-9]/.test(next)) {
      let j = i + 1;
      while (j < len && /[0-9]/.test(line[j])) j += 1;
      pushToken(out, 'property', line.slice(i, j));
      prevDot = false;
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_$]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      const upper = word.toUpperCase();
      let k = j;
      while (k < len && /\s/.test(line[k])) k += 1;
      const after = line[k] || '';

      /** @type {CodeTokenType} */
      let tokType = 'plain';
      if (prevDot) {
        tokType = 'property';
      } else if (SQL_TYPES.has(upper)) {
        tokType = 'type';
      } else if (SQL_KEYWORDS.has(upper)) {
        tokType = after === '(' && !['IN', 'EXISTS', 'VALUES', 'OVER', 'FILTER'].includes(upper)
          ? 'function'
          : 'keyword';
      } else if (after === '(') {
        tokType = 'function';
      }

      pushToken(out, tokType, word);
      prevDot = false;
      i = j;
      continue;
    }

    if (ch === ':' && next === ':') {
      pushToken(out, 'operator', '::');
      prevDot = false;
      i += 2;
      continue;
    }

    if ('(),;.'.includes(ch)) {
      pushToken(out, 'punctuation', ch);
      prevDot = ch === '.';
      i += 1;
      continue;
    }

    if ('=<>!+-*/%|~'.includes(ch)) {
      pushToken(out, 'operator', ch);
      prevDot = false;
      i += 1;
      continue;
    }

    pushToken(out, 'plain', ch);
    prevDot = false;
    i += 1;
  }

  return out;
}

/**
 * Tokenize a Shell / Bash line.
 * @param {string} line
 * @returns {CodeToken[]}
 */
function tokenizeShellLine(line) {
  /** @type {CodeToken[]} */
  const out = [];
  let i = 0;
  const len = line.length;
  let expectCommand = true;

  while (i < len) {
    const ch = line[i];
    const next = line[i + 1] || '';

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < len && /\s/.test(line[j])) j += 1;
      pushToken(out, 'plain', line.slice(i, j));
      i = j;
      continue;
    }

    // Comment `# ...` (at start of token)
    if (ch === '#' && (i === 0 || /\s|[;|&(]/.test(line[i - 1]))) {
      pushToken(out, i === 0 && next === '!' ? 'keyword' : 'comment', line.slice(i));
      break;
    }

    if (ch === "'" || ch === '"') {
      const { end } = scanQuoted(line, i, ch);
      pushToken(out, 'string', line.slice(i, end));
      expectCommand = false;
      i = end;
      continue;
    }

    // Parameter expansion `$VAR` or `${VAR}`
    if (ch === '$') {
      if (next === '{') {
        const closeIdx = line.indexOf('}', i + 2);
        const end = closeIdx === -1 ? len : closeIdx + 1;
        pushToken(out, 'property', line.slice(i, end));
        expectCommand = false;
        i = end;
        continue;
      }
      if (next === '(') {
        pushToken(out, 'punctuation', '$(');
        expectCommand = true;
        i += 2;
        continue;
      }
      if (/[A-Za-z0-9_?#$!@-]/.test(next)) {
        let j = i + 2;
        if (/[A-Za-z_]/.test(next)) {
          while (j < len && /[A-Za-z0-9_]/.test(line[j])) j += 1;
        }
        pushToken(out, 'property', line.slice(i, j));
        expectCommand = false;
        i = j;
        continue;
      }
    }

    // CLI flags `-f`, `--flag`
    if (ch === '-' && /[A-Za-z0-9-]/.test(next) && (i === 0 || /\s/.test(line[i - 1]))) {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_-]/.test(line[j])) j += 1;
      pushToken(out, 'property', line.slice(i, j));
      expectCommand = false;
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch) && (i === 0 || /[\s=:([]/.test(line[i - 1]))) {
      const end = scanNumber(line, i);
      if (end === len || /[\s;|&)<>]/.test(line[end])) {
        pushToken(out, 'number', line.slice(i, end));
        expectCommand = false;
        i = end;
        continue;
      }
    }

    const two = line.slice(i, i + 2);
    if (two === '&&' || two === '||' || two === '>>' || two === '<<' || two === '|&') {
      pushToken(out, 'operator', two);
      expectCommand = two === '&&' || two === '||' || two === '|&';
      i += 2;
      continue;
    }

    if ('|;'.includes(ch)) {
      pushToken(out, ch === ';' ? 'punctuation' : 'operator', ch);
      expectCommand = true;
      i += 1;
      continue;
    }

    if ('()[]{}'.includes(ch)) {
      pushToken(out, 'punctuation', ch);
      if (ch === '(' || ch === '{') expectCommand = true;
      i += 1;
      continue;
    }

    if ('=<>!&'.includes(ch)) {
      pushToken(out, 'operator', ch);
      i += 1;
      continue;
    }

    // Word / path / assignment key
    let j = i;
    while (j < len && !/[\s'"$|;&()<>={}]/.test(line[j])) j += 1;
    if (j > i) {
      const word = line.slice(i, j);
      if (line[j] === '=' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(word)) {
        pushToken(out, 'property', word);
      } else if (SH_KEYWORDS.has(word)) {
        pushToken(out, 'keyword', word);
        expectCommand =
          word === 'then' || word === 'do' || word === 'else' || word === 'elif';
      } else if (expectCommand) {
        pushToken(out, 'function', word);
        expectCommand = false;
      } else {
        pushToken(out, 'plain', word);
      }
      i = j;
      continue;
    }

    pushToken(out, 'plain', ch);
    i += 1;
  }

  return out;
}

/**
 * Tokenize a Python line with multi-line triple-quoted string state.
 * @param {string} line
 * @param {{ tripleQuote: '"""' | "'''" | null }} state
 * @returns {CodeToken[]}
 */
function tokenizePythonLine(line, state) {
  /** @type {CodeToken[]} */
  const out = [];
  let i = 0;
  const len = line.length;
  let prevWord = '';
  let prevDot = false;

  while (i < len) {
    if (state.tripleQuote) {
      const closeIdx = line.indexOf(state.tripleQuote, i);
      if (closeIdx === -1) {
        pushToken(out, 'string', line.slice(i));
        return out;
      }
      pushToken(out, 'string', line.slice(i, closeIdx + 3));
      i = closeIdx + 3;
      state.tripleQuote = null;
      continue;
    }

    const ch = line[i];

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < len && /\s/.test(line[j])) j += 1;
      pushToken(out, 'plain', line.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '#') {
      pushToken(out, 'comment', line.slice(i));
      break;
    }

    // String prefixes `f"..."`, `r'...'`, `b"""..."""`
    const prefixMatch = line.slice(i).match(/^([fFrRbBuU]{0,2})("""|'''|"|')/);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      const delim = prefixMatch[2];
      const bodyStart = i + prefix.length;
      if (delim === '"""' || delim === "'''") {
        const closeIdx = line.indexOf(delim, bodyStart + 3);
        if (closeIdx === -1) {
          pushToken(out, 'string', line.slice(i));
          state.tripleQuote = delim;
          break;
        }
        pushToken(out, 'string', line.slice(i, closeIdx + 3));
        i = closeIdx + 3;
        prevDot = false;
        continue;
      }
      const { end } = scanQuoted(line, bodyStart, delim);
      pushToken(out, 'string', line.slice(i, end));
      i = end;
      prevDot = false;
      continue;
    }

    if (ch === '@' && /[A-Za-z_]/.test(line[i + 1] || '')) {
      let j = i + 2;
      while (j < len && /[A-Za-z0-9_.]/.test(line[j])) j += 1;
      pushToken(out, 'function', line.slice(i, j));
      prevDot = false;
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const end = scanNumber(line, i);
      pushToken(out, 'number', line.slice(i, end));
      prevDot = false;
      i = end;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      let k = j;
      while (k < len && /\s/.test(line[k])) k += 1;
      const after = line[k] || '';

      /** @type {CodeTokenType} */
      let tokType = 'plain';
      if (prevWord === 'def') {
        tokType = 'function';
      } else if (prevWord === 'class') {
        tokType = 'type';
      } else if (prevDot) {
        tokType = after === '(' ? 'function' : 'property';
      } else if (PY_KEYWORDS.has(word)) {
        tokType = 'keyword';
      } else if (PY_BUILTIN_TYPES.has(word) || /^[A-Z][A-Za-z0-9_]*$/.test(word)) {
        tokType = 'type';
      } else if (after === '(') {
        tokType = 'function';
      }

      pushToken(out, tokType, word);
      prevWord = word;
      prevDot = false;
      i = j;
      continue;
    }

    if (line.slice(i, i + 2) === '->') {
      pushToken(out, 'operator', '->');
      prevDot = false;
      i += 2;
      continue;
    }

    if ('()[]{}:,.'.includes(ch)) {
      pushToken(out, 'punctuation', ch);
      prevDot = ch === '.';
      i += 1;
      continue;
    }

    if ('=+-*/%<>!&|^~'.includes(ch)) {
      pushToken(out, 'operator', ch);
      prevDot = false;
      i += 1;
      continue;
    }

    pushToken(out, 'plain', ch);
    prevDot = false;
    i += 1;
  }

  return out;
}

/**
 * Tokenize a YAML line.
 * @param {string} line
 * @returns {CodeToken[]}
 */
function tokenizeYamlLine(line) {
  /** @type {CodeToken[]} */
  const out = [];
  const len = line.length;
  if (len === 0) return out;

  if (/^(---|\.\.\.)(\s|$)/.test(line)) {
    pushToken(out, 'punctuation', line.slice(0, 3));
    if (len > 3) pushToken(out, 'comment', line.slice(3));
    return out;
  }

  let i = 0;
  // Leading indent & optional sequence `- `
  while (i < len && /\s/.test(line[i])) i += 1;
  if (i > 0) pushToken(out, 'plain', line.slice(0, i));

  if (line[i] === '#') {
    pushToken(out, 'comment', line.slice(i));
    return out;
  }

  if (line[i] === '-' && (i + 1 === len || /\s/.test(line[i + 1]))) {
    pushToken(out, 'punctuation', '-');
    i += 1;
    let ws = i;
    while (ws < len && /\s/.test(line[ws])) ws += 1;
    if (ws > i) {
      pushToken(out, 'plain', line.slice(i, ws));
      i = ws;
    }
  }

  // Match `key:` before value
  const rest = line.slice(i);
  const keyMatch = rest.match(/^([A-Za-z0-9_./-]+|"[^"]*"|'[^']*')(\s*):(?=\s|$)/);
  if (keyMatch) {
    pushToken(out, 'property', keyMatch[1]);
    if (keyMatch[2]) pushToken(out, 'plain', keyMatch[2]);
    pushToken(out, 'punctuation', ':');
    i += keyMatch[0].length;
  }

  // Value portion
  while (i < len) {
    const ch = line[i];
    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < len && /\s/.test(line[j])) j += 1;
      pushToken(out, 'plain', line.slice(i, j));
      i = j;
      continue;
    }
    if (ch === '#' && /\s/.test(line[i - 1] || ' ')) {
      pushToken(out, 'comment', line.slice(i));
      break;
    }
    if (ch === '"' || ch === "'") {
      const { end } = scanQuoted(line, i, ch);
      pushToken(out, 'string', line.slice(i, end));
      i = end;
      continue;
    }
    if ((ch === '&' || ch === '*') && /[A-Za-z0-9_-]/.test(line[i + 1] || '')) {
      let j = i + 2;
      while (j < len && /[A-Za-z0-9_-]/.test(line[j])) j += 1;
      pushToken(out, 'function', line.slice(i, j));
      i = j;
      continue;
    }
    if (ch === '!' && /[A-Za-z!]/.test(line[i + 1] || '')) {
      let j = i + 2;
      while (j < len && !/\s/.test(line[j])) j += 1;
      pushToken(out, 'type', line.slice(i, j));
      i = j;
      continue;
    }
    if ('[]{},|>'.includes(ch)) {
      pushToken(out, 'punctuation', ch);
      i += 1;
      continue;
    }

    // Read scalar token up to inline ` #` or delimiter
    let j = i;
    while (j < len && !/[\[\]{},]/.test(line[j])) {
      if (line[j] === '#' && /\s/.test(line[j - 1] || '')) break;
      j += 1;
    }
    const rawScalar = line.slice(i, j);
    const trimmed = rawScalar.trimEnd();
    const trailingWs = rawScalar.slice(trimmed.length);

    if (/^(true|false|null|~|yes|no|on|off)$/i.test(trimmed)) {
      pushToken(out, 'keyword', trimmed);
    } else if (/^-?(?:0x[0-9a-fA-F]+|[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)$/.test(trimmed)) {
      pushToken(out, 'number', trimmed);
    } else {
      pushToken(out, 'string', trimmed);
    }
    if (trailingWs) pushToken(out, 'plain', trailingWs);
    i = j;
  }

  return out;
}

/**
 * Tokenize source code into structured, XSS-safe line & token descriptors.
 * Supports: `ts`, `tsx`, `js`, `jsx`, `vue`, `html`, `css`, `json`, `sql`, `sh`, `bash`, `diff`, `python`, `yaml`, and `plain`.
 *
 * @param {string} code
 * @param {string} [language='plain']
 * @param {TokenizeOptions} [options]
 * @returns {TokenizedCodeLine[]}
 */
export function tokenizeCodeLines(code, language = 'plain', options) {
  const normalizedCode =
    typeof code === 'string' ? code.replace(/\r\n?/g, '\n') : String(code ?? '');
  const rawLines = normalizedCode.split('\n');
  const lang = normalizeCodeLanguage(language);
  const startLine =
    options && typeof options.startLine === 'number' && Number.isFinite(options.startLine)
      ? Math.trunc(options.startLine)
      : 1;
  const parseDiff = lang === 'diff' || Boolean(options && options.diff);

  const jsState = { inBlockComment: false, inTemplate: false };
  const cssState = { inBlockComment: false, braceDepth: 0 };
  const htmlState = { inHtmlComment: false, inTag: false };
  const sqlState = { inBlockComment: false };
  const pyState = /** @type {{ tripleQuote: '"""' | "'''" | null }} */ ({ tripleQuote: null });
  /** @type {'markup' | 'script' | 'style'} */
  let vueRegion = 'markup';

  /** @type {TokenizedCodeLine[]} */
  const result = new Array(rawLines.length);

  for (let idx = 0; idx < rawLines.length; idx += 1) {
    const rawLine = rawLines[idx];
    const lineNumber = startLine + idx;

    /** @type {CodeLineDiff} */
    let diffKind = null;
    let bodyLine = rawLine;
    let diffPrefix = '';

    if (parseDiff) {
      if (rawLine.startsWith('@@')) {
        diffKind = 'hunk';
      } else if (
        lang === 'diff' &&
        (rawLine.startsWith('+++ ') ||
          rawLine.startsWith('--- ') ||
          rawLine.startsWith('diff ') ||
          rawLine.startsWith('index '))
      ) {
        diffKind = null;
      } else if (rawLine.startsWith('+')) {
        diffKind = 'add';
        if (lang !== 'diff') {
          diffPrefix = '+';
          bodyLine = rawLine.slice(1);
        }
      } else if (rawLine.startsWith('-')) {
        diffKind = 'del';
        if (lang !== 'diff') {
          diffPrefix = '-';
          bodyLine = rawLine.slice(1);
        }
      }
    }

    /** @type {CodeToken[]} */
    let tokens = [];

    if (lang === 'diff') {
      if (diffKind === 'hunk') {
        const closeAt = rawLine.indexOf('@@', 2);
        if (closeAt !== -1) {
          pushToken(tokens, 'keyword', rawLine.slice(0, closeAt + 2));
          if (closeAt + 2 < rawLine.length) {
            pushToken(tokens, 'comment', rawLine.slice(closeAt + 2));
          }
        } else {
          pushToken(tokens, 'keyword', rawLine);
        }
      } else if (diffKind === 'add' || diffKind === 'del') {
        pushToken(tokens, 'operator', rawLine[0]);
        if (rawLine.length > 1) pushToken(tokens, 'plain', rawLine.slice(1));
      } else if (
        rawLine.startsWith('+++ ') ||
        rawLine.startsWith('--- ') ||
        rawLine.startsWith('diff ') ||
        rawLine.startsWith('index ')
      ) {
        pushToken(tokens, 'comment', rawLine);
      } else if (rawLine.length > 0) {
        pushToken(tokens, 'plain', rawLine);
      }
    } else if (diffKind === 'hunk') {
      pushToken(tokens, 'keyword', rawLine);
    } else {
      if (diffPrefix) pushToken(tokens, 'operator', diffPrefix);

      /** @type {CodeToken[]} */
      let lineTokens;
      if (lang === 'ts' || lang === 'js' || lang === 'tsx' || lang === 'jsx') {
        lineTokens = tokenizeJsLine(bodyLine, lang === 'tsx' || lang === 'jsx', jsState);
      } else if (lang === 'css') {
        lineTokens = tokenizeCssLine(bodyLine, cssState);
      } else if (lang === 'json') {
        lineTokens = tokenizeJsonLine(bodyLine);
      } else if (lang === 'sql') {
        lineTokens = tokenizeSqlLine(bodyLine, sqlState);
      } else if (lang === 'sh' || lang === 'bash') {
        lineTokens = tokenizeShellLine(bodyLine);
      } else if (lang === 'python') {
        lineTokens = tokenizePythonLine(bodyLine, pyState);
      } else if (lang === 'yaml') {
        lineTokens = tokenizeYamlLine(bodyLine);
      } else if (lang === 'vue' || lang === 'html') {
        if (vueRegion === 'script') {
          if (/^\s*<\/script\b/i.test(bodyLine)) {
            vueRegion = 'markup';
            lineTokens = tokenizeHtmlLine(bodyLine, htmlState);
          } else {
            lineTokens = tokenizeJsLine(bodyLine, false, jsState);
          }
        } else if (vueRegion === 'style') {
          if (/^\s*<\/style\b/i.test(bodyLine)) {
            vueRegion = 'markup';
            lineTokens = tokenizeHtmlLine(bodyLine, htmlState);
          } else {
            lineTokens = tokenizeCssLine(bodyLine, cssState);
          }
        } else {
          lineTokens = tokenizeHtmlLine(bodyLine, htmlState);
          if (
            !htmlState.inHtmlComment &&
            /<script\b[^>]*>/i.test(bodyLine) &&
            !/<\/script\b/i.test(bodyLine)
          ) {
            vueRegion = 'script';
          } else if (
            !htmlState.inHtmlComment &&
            /<style\b[^>]*>/i.test(bodyLine) &&
            !/<\/style\b/i.test(bodyLine)
          ) {
            vueRegion = 'style';
          }
        }
      } else {
        lineTokens = bodyLine.length > 0 ? [{ type: 'plain', text: bodyLine }] : [];
      }

      for (const tok of lineTokens) {
        pushToken(tokens, tok.type, tok.text);
      }
    }

    result[idx] = {
      lineNumber,
      diff: diffKind,
      tokens,
    };
  }

  return result;
}

/**
 * Create a crisp 24x24 geometricPrecision SVG icon (`copy` or `check`) for plain-HTML hydration.
 * @param {'copy' | 'check'} kind
 * @returns {SVGSVGElement}
 */
function createCopySvg(kind) {
  const svg = /** @type {SVGSVGElement} */ (document.createElementNS(SVG_NS, 'svg'));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('shape-rendering', 'geometricPrecision');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute(
    'class',
    `j-copy-button__icon j-copy-button__icon--${kind}`,
  );

  if (kind === 'copy') {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', '9');
    rect.setAttribute('y', '9');
    rect.setAttribute('width', '11');
    rect.setAttribute('height', '11');
    rect.setAttribute('rx', '2');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
    svg.appendChild(rect);
    svg.appendChild(path);
  } else {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M20 6 9 17l-5-5');
    svg.appendChild(path);
  }

  return svg;
}

/**
 * Parse `"2,4-6"` or `[2, 4]` style line specifications into a `Set<number>`.
 * @param {string | null | undefined} spec
 * @returns {Set<number>}
 */
function parseHighlightSpec(spec) {
  /** @type {Set<number>} */
  const set = new Set();
  if (!spec) return set;
  for (const part of spec.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const range = trimmed.split('-');
    if (range.length === 2) {
      const lo = Number.parseInt(range[0], 10);
      const hi = Number.parseInt(range[1], 10);
      if (Number.isFinite(lo) && Number.isFinite(hi)) {
        for (let n = Math.min(lo, hi); n <= Math.max(lo, hi); n += 1) set.add(n);
      }
    } else {
      const num = Number.parseInt(trimmed, 10);
      if (Number.isFinite(num)) set.add(num);
    }
  }
  return set;
}

/** @type {WeakMap<HTMLElement, () => void>} */
const boundCopyButtons = new WeakMap();

/**
 * Bind plain-HTML `.j-copy-button` elements inside `root`. Idempotent and SSR-safe.
 * @param {ParentNode} [root=document]
 * @returns {() => void}
 */
export function initCopyButtons(root = typeof document !== 'undefined' ? document : /** @type {any} */ (null)) {
  if (!root || typeof root.querySelectorAll !== 'function') return () => {};

  /** @type {HTMLElement[]} */
  const candidates = [];
  if (typeof Element !== 'undefined' && root instanceof Element && root.matches('.j-copy-button')) {
    candidates.push(/** @type {HTMLElement} */ (root));
  }
  root.querySelectorAll('.j-copy-button').forEach((el) => {
    candidates.push(/** @type {HTMLElement} */ (el));
  });

  /** @type {HTMLElement[]} */
  const attached = [];

  for (const btn of candidates) {
    if (btn.hasAttribute('data-j-managed') || boundCopyButtons.has(btn)) continue;

    if (!btn.hasAttribute('type') && btn.tagName === 'BUTTON') {
      btn.setAttribute('type', 'button');
    }
    const baseAria = btn.getAttribute('aria-label') || 'Copy to clipboard';
    if (!btn.hasAttribute('aria-label')) {
      btn.setAttribute('aria-label', baseAria);
    }

    if (!btn.querySelector('svg')) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'j-copy-button__icons';
      iconWrap.setAttribute('aria-hidden', 'true');
      iconWrap.appendChild(createCopySvg('copy'));
      iconWrap.appendChild(createCopySvg('check'));

      const existingText = (btn.textContent || '').trim() || btn.getAttribute('data-label') || '';
      btn.replaceChildren(iconWrap);
      if (existingText) {
        const labelSpan = document.createElement('span');
        labelSpan.className = 'j-copy-button__label';
        labelSpan.textContent = existingText;
        btn.appendChild(labelSpan);
      }
    }

    const labelEl = btn.querySelector('.j-copy-button__label');
    const baseLabelText = labelEl ? labelEl.textContent || '' : '';
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timer = null;

    const onClick = async () => {
      if (
        btn.hasAttribute('disabled') ||
        btn.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }

      let textToCopy =
        btn.getAttribute('data-copy-value') ?? btn.getAttribute('data-value') ?? null;

      if (textToCopy == null) {
        const targetSel = btn.getAttribute('data-copy-target');
        if (targetSel && typeof document !== 'undefined') {
          const target = document.querySelector(targetSel);
          if (target) textToCopy = target.textContent || '';
        }
      }

      if (textToCopy == null) {
        const parentBlock = btn.closest('.j-code-block');
        if (parentBlock) {
          const rawAttr = parentBlock.getAttribute('data-raw-code');
          if (rawAttr != null) {
            textToCopy = rawAttr;
          } else {
            const codeNode = parentBlock.querySelector('.j-code-block__code, pre code, pre');
            textToCopy = codeNode ? codeNode.textContent || '' : '';
          }
        }
      }

      const finalValue = textToCopy ?? '';
      const ok = await copyToClipboard(finalValue);
      if (!ok) return;

      const copiedLabel = btn.getAttribute('data-copied-label') || 'Copied';
      const timeoutMs = Math.max(200, Number(btn.getAttribute('data-timeout')) || 1600);

      btn.setAttribute('data-copied', '');
      btn.setAttribute('aria-label', copiedLabel);
      if (labelEl && baseLabelText) {
        labelEl.textContent = copiedLabel;
      }

      btn.dispatchEvent(
        new CustomEvent('j-copy', {
          bubbles: true,
          detail: { value: finalValue },
        }),
      );

      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        btn.removeAttribute('data-copied');
        btn.setAttribute('aria-label', baseAria);
        if (labelEl && baseLabelText) {
          labelEl.textContent = baseLabelText;
        }
        timer = null;
      }, timeoutMs);
    };

    btn.addEventListener('click', onClick);
    boundCopyButtons.set(btn, () => {
      if (timer !== null) clearTimeout(timer);
      btn.removeEventListener('click', onClick);
    });
    attached.push(btn);
  }

  return () => {
    for (const btn of attached) {
      boundCopyButtons.get(btn)?.();
      boundCopyButtons.delete(btn);
    }
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const boundCodeBlocks = new WeakMap();

/**
 * Hydrate plain-HTML `.j-code-block` elements with XSS-safe syntax spans, line numbers,
 * line highlights, diff markers, and copy buttons. Idempotent and SSR-safe.
 * @param {ParentNode} [root=document]
 * @returns {() => void}
 */
export function initCodeBlocks(root = typeof document !== 'undefined' ? document : /** @type {any} */ (null)) {
  if (!root || typeof root.querySelectorAll !== 'function') return () => {};

  /** @type {HTMLElement[]} */
  const candidates = [];
  if (typeof Element !== 'undefined' && root instanceof Element && root.matches('.j-code-block')) {
    candidates.push(/** @type {HTMLElement} */ (root));
  }
  root.querySelectorAll('.j-code-block').forEach((el) => {
    candidates.push(/** @type {HTMLElement} */ (el));
  });

  /** @type {HTMLElement[]} */
  const attached = [];

  for (const block of candidates) {
    if (block.hasAttribute('data-j-managed') || boundCodeBlocks.has(block)) continue;

    const codeEl =
      block.querySelector('.j-code-block__code') ||
      block.querySelector('pre > code') ||
      block.querySelector('code');
    const preEl = block.querySelector('.j-code-block__pre') || block.querySelector('pre');

    if (!codeEl || !preEl) continue;

    preEl.classList.add('j-code-block__pre');
    codeEl.classList.add('j-code-block__code');

    const rawSource = (block.getAttribute('data-code') ?? codeEl.textContent ?? '').replace(
      /^\n+|\s+$/g,
      (match, offset) => (offset === 0 ? '' : match.replace(/\n$/, '')),
    );
    block.setAttribute('data-raw-code', rawSource);

    const language =
      block.getAttribute('data-lang') || block.getAttribute('data-language') || 'plain';
    const showLineNumbers = block.hasAttribute('data-line-numbers');
    const startLine = Number.parseInt(block.getAttribute('data-start-line') || '1', 10) || 1;
    const highlightSet = parseHighlightSpec(block.getAttribute('data-highlight-lines'));
    const isDiff =
      block.hasAttribute('data-diff') || normalizeCodeLanguage(language) === 'diff';

    const lines = tokenizeCodeLines(rawSource, language, { startLine, diff: isDiff });
    const frag = document.createDocumentFragment();

    for (const line of lines) {
      const lineEl = document.createElement('span');
      lineEl.className = 'j-code-block__line';
      if (highlightSet.has(line.lineNumber)) {
        lineEl.setAttribute('data-highlighted', '');
      }
      if (line.diff) {
        lineEl.setAttribute('data-diff', line.diff);
      }

      if (showLineNumbers) {
        const gutter = document.createElement('span');
        gutter.className = 'j-code-block__gutter';
        gutter.setAttribute('aria-hidden', 'true');
        gutter.textContent = String(line.lineNumber);
        lineEl.appendChild(gutter);
      }

      const content = document.createElement('span');
      content.className = 'j-code-block__content';
      for (const tok of line.tokens) {
        const tokSpan = document.createElement('span');
        tokSpan.className = 'j-code-tok';
        tokSpan.setAttribute('data-tok', tok.type);
        tokSpan.textContent = tok.text;
        content.appendChild(tokSpan);
      }
      lineEl.appendChild(content);
      frag.appendChild(lineEl);
    }

    codeEl.replaceChildren(frag);
    const cleanupCopy = initCopyButtons(block);

    boundCodeBlocks.set(block, () => {
      cleanupCopy();
    });
    attached.push(block);
  }

  return () => {
    for (const block of attached) {
      boundCodeBlocks.get(block)?.();
      boundCodeBlocks.delete(block);
    }
  };
}
