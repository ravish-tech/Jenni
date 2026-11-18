/**
 * Tiny dependency-free syntax highlighter for the playground (html / vue / tsx).
 * Returns HTML with <span class="tok-*"> wrappers. Not a parser — good enough to read.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wrap = (cls: string, s: string) => `<span class="tok-${cls}">${esc(s)}</span>`;

const KEYWORDS = new Set(
  'import from export default const let var function return if else for of in new class extends type interface as async await true false null undefined this props'.split(' '),
);

function highlightTag(tag: string) {
  // tag like `<button data-variant="solid" disabled>` or `</button>`
  const m = tag.match(/^(<\/?)([\w.:-]+)([\s\S]*?)(\/?>)$/);
  if (!m) return esc(tag);
  const [, open, name, attrs, close] = m;
  const attrHtml = attrs.replace(
    /([\s]+)([@:#]?[\w.:\-@[\]]+)(?:(=)("[^"]*"|'[^']*'|\{[^}]*\}|[^\s>]+))?|([\s\S])/g,
    (_all, ws, an, eq, val, other) => {
      if (other !== undefined) return esc(other);
      return esc(ws) + wrap('attr', an) + (eq ? wrap('punct', eq) + wrap('string', val) : '');
    },
  );
  return wrap('punct', open) + wrap('tag', name) + attrHtml + wrap('punct', close);
}

function highlightScript(src: string) {
  return src.replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)|([\s\S])/g,
    (_all, comment, str, num, word, other) => {
      if (comment) return wrap('comment', comment);
      if (str) return wrap('string', str);
      if (num) return wrap('number', num);
      if (word) return KEYWORDS.has(word) ? wrap('keyword', word) : /^[A-Z]/.test(word) ? wrap('type', word) : esc(word);
      return esc(other);
    },
  );
}

function highlightMarkup(src: string) {
  return src.replace(
    /(<!--[\s\S]*?-->)|(<\/?[\w.:-]+(?:\s+(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)?\s*\/?>)|(\{\{[\s\S]*?\}\})|([^<{]+|[\s\S])/g,
    (_all, comment, tag, interp, text) => {
      if (comment) return wrap('comment', comment);
      if (tag) return highlightTag(tag);
      if (interp) return wrap('interp', interp);
      return esc(text);
    },
  );
}

export function highlight(src: string, lang: 'html' | 'vue' | 'tsx'): string {
  try {
    if (lang === 'tsx') return highlightScript(src);
    if (lang === 'vue') {
      // Highlight <script> blocks as script, everything else as markup.
      return src
        .split(/(<script[^>]*>[\s\S]*?<\/script>)/g)
        .map((part) => {
          const m = part.match(/^(<script[^>]*>)([\s\S]*?)(<\/script>)$/);
          return m ? highlightTag(m[1]) + highlightScript(m[2]) + highlightTag(m[3]) : highlightMarkup(part);
        })
        .join('');
    }
    return highlightMarkup(src);
  } catch {
    return esc(src);
  }
}
