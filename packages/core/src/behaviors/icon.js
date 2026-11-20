// Pluggable icon registry and optical 16x16 stroke icon dictionary.
// Supports built-in SVG definitions, raw <svg> markup strings, { viewBox, body }
// objects, icon dictionaries, and dynamic resolver functions (Lucide, Tabler,
// custom sprites, or framework components).

/**
 * @typedef {Object} SvgIconDefinition
 * @property {string} [viewBox]
 * @property {string} body
 * @property {string} [fill]
 * @property {string} [stroke]
 */

/**
 * @typedef {Object} ParsedSvgIcon
 * @property {string} viewBox
 * @property {string} body
 * @property {string} [fill]
 * @property {string} [stroke]
 */

/**
 * @template [TComponent=unknown]
 * @typedef {string | SvgIconDefinition | TComponent} IconDefinition
 */

/**
 * @template [TComponent=unknown]
 * @typedef {Record<string, IconDefinition<TComponent>>} IconMap
 */

/**
 * @template [TComponent=unknown]
 * @typedef {(name: string) => IconDefinition<TComponent> | null | undefined} IconResolverFn
 */

/**
 * @template [TComponent=unknown]
 * @typedef {IconMap<TComponent> | IconResolverFn<TComponent>} IconRegistrySource
 */

/** @type {WeakSet<object>} */
const VERIFIED_SVG_ICONS = new WeakSet();

/**
 * @param {string} viewBox
 * @param {string} body
 * @param {string} [fill]
 * @param {string} [stroke]
 * @returns {ParsedSvgIcon}
 */
function freezeParsedSvg(viewBox, body, fill, stroke) {
  const icon = Object.freeze({
    viewBox,
    body,
    ...(fill ? { fill } : {}),
    ...(stroke ? { stroke } : {}),
  });
  VERIFIED_SVG_ICONS.add(icon);
  return icon;
}

/** @param {string} body @returns {ParsedSvgIcon} */
const svg16 = (body) => freezeParsedSvg('0 0 16 16', body);

const ICON_X = svg16('<path d="M4 4l8 8M12 4l-8 8"/>');
const ICON_SETTINGS = svg16(
  '<path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm5.2-2a5.2 5.2 0 0 0-.1-1l1.2-1-1.2-2-1.4.5a5.2 5.2 0 0 0-1.7-1L9.7 2H6.3L6 3.5a5.2 5.2 0 0 0-1.7 1l-1.4-.5-1.2 2 1.2 1a5.2 5.2 0 0 0 0 2l-1.2 1 1.2 2 1.4-.5c.5.4 1.1.8 1.7 1L6.3 14h3.4l.3-1.5c.6-.2 1.2-.6 1.7-1l1.4.5 1.2-2-1.2-1c.1-.3.1-.7.1-1Z"/>',
);
const ICON_EDIT = svg16(
  '<path d="M11.15 2.35a1.41 1.41 0 0 1 2 2L5.5 12l-2.75.75L3.5 10l7.65-7.65ZM9.75 3.75l2 2"/>',
);
const ICON_REFRESH = svg16(
  '<path d="M13.5 3.25v3.25h-3.25M2.5 12.75V9.5h3.25"/><path d="M3.15 6A5.25 5.25 0 0 1 12.1 4.4l1.4 2.1M12.85 10a5.25 5.25 0 0 1-8.95 1.6L2.5 9.5"/>',
);
const ICON_MORE_H = svg16(
  '<circle cx="3.5" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="12.5" cy="8" r="1"/>',
);
const ICON_ALERT_TRIANGLE = svg16(
  '<path d="M7.13 2.95a1 1 0 0 1 1.74 0l4.86 8.55a1 1 0 0 1-.87 1.5H3.14a1 1 0 0 1-.87-1.5l4.86-8.55ZM8 6.25v2.75M8 11.15h.01"/>',
);
const ICON_ALERT_CIRCLE = svg16(
  '<circle cx="8" cy="8" r="5.75"/><path d="M8 5.25v3.25M8 10.85h.01"/>',
);

/**
 * Built-in dictionary of crisp, optical 16x16 stroke icons and standard aliases.
 * @type {Readonly<Record<string, ParsedSvgIcon>>}
 */
export const BUILTIN_ICONS = Object.freeze({
  check: svg16('<path d="M3 8.5 6.5 12 13 4.5"/>'),
  x: ICON_X,
  close: ICON_X,
  plus: svg16('<path d="M8 3.25v9.5M3.25 8h9.5"/>'),
  minus: svg16('<path d="M3.25 8h9.5"/>'),
  search: svg16('<circle cx="7.25" cy="7.25" r="4.5"/><path d="m10.6 10.6 3.15 3.15"/>'),
  settings: ICON_SETTINGS,
  gear: ICON_SETTINGS,
  'chevron-down': svg16('<path d="m4 6 4 4 4-4"/>'),
  'chevron-up': svg16('<path d="m4 10 4-4 4 4"/>'),
  'chevron-left': svg16('<path d="m10 4-4 4 4 4"/>'),
  'chevron-right': svg16('<path d="m6 4 4 4-4 4"/>'),
  'chevrons-up-down': svg16(
    '<path d="m5.25 6 2.75-2.75L10.75 6M5.25 10 8 12.75 10.75 10"/>',
  ),
  'arrow-up': svg16('<path d="M8 13V3m-4 4 4-4 4 4"/>'),
  'arrow-down': svg16('<path d="M8 3v10m-4-4 4 4 4-4"/>'),
  'arrow-left': svg16('<path d="M13 8H3m4-4L3 8l4 4"/>'),
  'arrow-right': svg16('<path d="M3 8h10m-4-4 4 4-4 4"/>'),
  'external-link': svg16(
    '<path d="M9.5 2.5h4v4M13.5 2.5l-6 6M7 3.5H3.75A1.25 1.25 0 0 0 2.5 4.75v7.5c0 .69.56 1.25 1.25 1.25h7.5c.69 0 1.25-.56 1.25-1.25V9"/>',
  ),
  copy: svg16(
    '<rect x="5.5" y="5.5" width="8" height="8" rx="1.25"/><path d="M3.5 10.5h-.25A1.25 1.25 0 0 1 2 9.25v-6C2 2.56 2.56 2 3.25 2h6c.69 0 1.25.56 1.25 1.25v.25"/>',
  ),
  clipboard: svg16(
    '<rect x="5.5" y="1.75" width="5" height="2.5" rx="0.75"/><path d="M5.5 3H4a1.25 1.25 0 0 0-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25v-8.5C13.25 3.56 12.69 3 12 3h-1.5"/>',
  ),
  trash: svg16(
    '<path d="M2.75 4.25h10.5M6 4.25V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.25m1.75 0v8.5a1.25 1.25 0 0 1-1.25 1.25h-5A1.25 1.25 0 0 1 4.25 12.75v-8.5M6.75 7v4.25M9.25 7v4.25"/>',
  ),
  edit: ICON_EDIT,
  pencil: ICON_EDIT,
  eye: svg16(
    '<path d="M1.75 8s2.25-4.25 6.25-4.25S14.25 8 14.25 8s-2.25 4.25-6.25 4.25S1.75 8 1.75 8Z"/><circle cx="8" cy="8" r="1.75"/>',
  ),
  'eye-off': svg16(
    '<path d="M2.5 2.5l11 11M6.82 6.82a1.75 1.75 0 0 0 2.36 2.36M4.3 4.42C2.75 5.48 1.75 8 1.75 8s2.25 4.25 6.25 4.25c1.3 0 2.42-.45 3.33-1.08M6.5 3.92A6.3 6.3 0 0 1 8 3.75c4 0 6.25 4.25 6.25 4.25a10.4 10.4 0 0 1-1.66 2.34"/>',
  ),
  folder: svg16(
    '<path d="M2 4.25C2 3.56 2.56 3 3.25 3h3l1.4 1.5h5.1c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25H3.25C2.56 13.5 2 12.94 2 12.25v-8Z"/>',
  ),
  'folder-open': svg16(
    '<path d="M2 12.25V4.25C2 3.56 2.56 3 3.25 3h3l1.4 1.5h5.1c.69 0 1.25.56 1.25 1.25V7M2 12.25l1.6-5.25h10.9l-1.5 5.25a1 1 0 0 1-.96.75H2.96A.96.96 0 0 1 2 12.25Z"/>',
  ),
  file: svg16(
    '<path d="M4.25 2h4.8L12.5 5.45v7.3c0 .69-.56 1.25-1.25 1.25h-7C3.56 14 3 13.44 3 12.75V3.25C3 2.56 3.56 2 4.25 2Z"/><path d="M9 2v3.5h3.5"/>',
  ),
  'file-code': svg16(
    '<path d="M4.25 2h4.8L12.5 5.45v7.3c0 .69-.56 1.25-1.25 1.25h-7C3.56 14 3 13.44 3 12.75V3.25C3 2.56 3.56 2 4.25 2Z"/><path d="M9 2v3.5h3.5M6.5 8.25 5 9.75l1.5 1.5M9 8.25l1.5 1.5L9 11.25"/>',
  ),
  terminal: svg16(
    '<rect x="2" y="2.75" width="12" height="10.5" rx="1.25"/><path d="m4.5 6 2.5 2-2.5 2M8.25 10.25h3.25"/>',
  ),
  code: svg16(
    '<path d="M5.25 4.75 2 8l3.25 3.25M10.75 4.75 14 8l-3.25 3.25M9.25 3.25l-2.5 9.5"/>',
  ),
  'git-branch': svg16(
    '<circle cx="4.75" cy="3.75" r="1.5"/><circle cx="11.25" cy="5.25" r="1.5"/><circle cx="4.75" cy="12.25" r="1.5"/><path d="M4.75 5.25v5.5M11.25 6.75c0 2.25-1.75 3-6.5 3"/>',
  ),
  'git-commit': svg16('<circle cx="8" cy="8" r="2.25"/><path d="M1.75 8h4M10.25 8h4"/>'),
  'git-pull-request': svg16(
    '<circle cx="4.5" cy="3.75" r="1.5"/><circle cx="4.5" cy="12.25" r="1.5"/><circle cx="11.5" cy="12.25" r="1.5"/><path d="M4.5 5.25v5.5M8.5 3.75h1.75a1.25 1.25 0 0 1 1.25 1.25v5.75M9.75 2.25 8.25 3.75l1.5 1.5"/>',
  ),
  'git-merge': svg16(
    '<circle cx="4.5" cy="3.75" r="1.5"/><circle cx="4.5" cy="12.25" r="1.5"/><circle cx="11.75" cy="9.5" r="1.5"/><path d="M4.5 5.25v5.5M4.5 5.25c0 2.5 2.25 4.25 5.75 4.25"/>',
  ),
  play: svg16('<path d="M4.5 3.15 12.75 8 4.5 12.85V3.15Z"/>'),
  pause: svg16(
    '<rect x="4" y="3" width="2.75" height="10" rx="0.6"/><rect x="9.25" y="3" width="2.75" height="10" rx="0.6"/>',
  ),
  stop: svg16('<rect x="3.25" y="3.25" width="9.5" height="9.5" rx="1.25"/>'),
  refresh: ICON_REFRESH,
  reload: ICON_REFRESH,
  download: svg16(
    '<path d="M8 2.5v7.75m-3.25-3L8 10.5l3.25-3.25M2.75 11.25v1.25c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25v-1.25"/>',
  ),
  upload: svg16(
    '<path d="M8 10.5V2.75m-3.25 3L8 2.5l3.25 3.25M2.75 11.25v1.25c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25v-1.25"/>',
  ),
  filter: svg16('<path d="M2.25 3.25h11.5L9.5 8.3v4.2l-3 1v-5.2L2.25 3.25Z"/>'),
  sliders: svg16(
    '<path d="M2.5 4.5h3.25M8.25 4.5h5.25M2.5 8h6.25M11.25 8h2.25M2.5 11.5h2.25M7.25 11.5h6.25"/><circle cx="7" cy="4.5" r="1.25"/><circle cx="10" cy="8" r="1.25"/><circle cx="6" cy="11.5" r="1.25"/>',
  ),
  'more-horizontal': ICON_MORE_H,
  dots: ICON_MORE_H,
  'more-vertical': svg16(
    '<circle cx="8" cy="3.5" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="8" cy="12.5" r="1"/>',
  ),
  pin: svg16(
    '<path d="M9.75 2.25 13.75 6.25l-1.5 1.5-1.1-.35-2.4 2.4.4 2.45L8 13.4l-2.7-2.7L2.5 13.5m2.8-2.8L2.6 8l1.15-1.15 2.45.4 2.4-2.4-.35-1.1 1.5-1.5Z"/>',
  ),
  star: svg16(
    '<path d="m8 2.15 1.76 3.57 3.94.57-2.85 2.78.67 3.93L8 11.15 4.48 13l.67-3.93L2.3 6.29l3.94-.57L8 2.15Z"/>',
  ),
  bell: svg16(
    '<path d="M4 6.75a4 4 0 0 1 8 0c0 3.25 1.5 4.25 1.5 4.25h-11S4 10 4 6.75ZM6.75 13a1.45 1.45 0 0 0 2.5 0"/>',
  ),
  info: svg16('<circle cx="8" cy="8" r="5.75"/><path d="M8 7.25v3.5M8 5.15h.01"/>'),
  'alert-triangle': ICON_ALERT_TRIANGLE,
  warning: ICON_ALERT_TRIANGLE,
  'alert-circle': ICON_ALERT_CIRCLE,
  error: ICON_ALERT_CIRCLE,
  'check-circle': svg16('<circle cx="8" cy="8" r="5.75"/><path d="m5.5 8.15 1.75 1.75 3.25-3.5"/>'),
  clock: svg16('<circle cx="8" cy="8" r="5.75"/><path d="M8 4.75V8l2.25 1.5"/>'),
  calendar: svg16(
    '<rect x="2.25" y="3.25" width="11.5" height="10.25" rx="1.25"/><path d="M5.25 2v2.25M10.75 2v2.25M2.25 6.5h11.5"/>',
  ),
  user: svg16('<circle cx="8" cy="5.25" r="2.5"/><path d="M3.25 13.5a4.75 4.75 0 0 1 9.5 0"/>'),
  'panel-left': svg16('<rect x="2" y="2.5" width="12" height="11" rx="1.25"/><path d="M6 2.5v11"/>'),
  'panel-right': svg16('<rect x="2" y="2.5" width="12" height="11" rx="1.25"/><path d="M10 2.5v11"/>'),
  'panel-bottom': svg16('<rect x="2" y="2.5" width="12" height="11" rx="1.25"/><path d="M2 9.5h12"/>'),
  maximize: svg16(
    '<path d="M10 2.5h3.5V6M6 13.5H2.5V10M13.5 2.5 9.25 6.75M2.5 13.5l4.25-4.25"/>',
  ),
  minimize: svg16(
    '<path d="M10 6h3.5M10 6V2.5M6 10H2.5M6 10v3.5M13.5 2.5 10 6M2.5 13.5 6 10"/>',
  ),
  sparkles: svg16(
    '<path d="m8 2 1.15 3.35L12.5 6.5 9.15 7.65 8 11 6.85 7.65 3.5 6.5l3.35-1.15L8 2Zm4.25 7.5.55 1.7 1.7.55-1.7.55-.55 1.7-.55-1.7-1.7-.55 1.7-.55.55-1.7Z"/>',
  ),
});

/** @type {Array<IconRegistrySource<unknown>>} */
const registeredSources = [];

const OUTER_SVG_RE = /^\s*<svg\b((?:"[^"]*"|'[^']*'|[^>"'])*)>([\s\S]*?)<\/svg>\s*$/i;

const DANGEROUS_SVG_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'style',
  'animate',
  'animatetransform',
  'animatemotion',
  'animatecolor',
  'set',
  'mpath',
  'discard',
  'handler',
]);

const URL_ATTRS = new Set(['href', 'xlink:href', 'formaction', 'src']);

/** @type {Record<string, string>} */
const NAMED_HTML_ENTITIES = {
  colon: ':',
  tab: '\t',
  newline: '\n',
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  sol: '/',
  bsol: '\\',
  num: '#',
};

/**
 * Decode numeric (`&#106;`, `&#x6a;`) and named (`&colon;`, `&tab;`, `&newline;`) HTML entities
 * for URL protocol and fragment inspection.
 * @param {string} raw
 * @returns {string}
 */
function decodeHtmlEntities(raw) {
  let cur = raw;
  for (let pass = 0; pass < 3; pass += 1) {
    const next = cur
      .replace(/&#x0*([0-9a-f]+);?/gi, (_, hex) => {
        const cp = parseInt(hex, 16);
        return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
      })
      .replace(/&#0*(\d+);?/g, (_, dec) => {
        const cp = parseInt(dec, 10);
        return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
      })
      .replace(/&([a-z]+);?/gi, (full, name) => {
        const key = name.toLowerCase();
        return Object.prototype.hasOwnProperty.call(NAMED_HTML_ENTITIES, key)
          ? NAMED_HTML_ENTITIES[key]
          : full;
      });
    if (next === cur) break;
    cur = next;
  }
  return cur;
}

/**
 * Normalize a candidate URL/attribute string by decoding entities and stripping ASCII control/whitespace.
 * @param {string} val
 * @returns {string}
 */
function normalizeUrlForCheck(val) {
  return decodeHtmlEntities(val)
    .replace(/[\u0000-\u0020\u007f-\u009f\s]+/g, '')
    .toLowerCase();
}

/**
 * Check whether a URL attribute value is unsafe for `lowerTag`.
 * @param {string} lowerTag
 * @param {string} lowerAttr
 * @param {string} rawVal
 * @returns {boolean}
 */
function isUnsafeUrlAttr(lowerTag, lowerAttr, rawVal) {
  const compact = normalizeUrlForCheck(rawVal);
  if (
    compact.startsWith('javascript:') ||
    compact.startsWith('data:') ||
    compact.startsWith('vbscript:')
  ) {
    return true;
  }
  if (lowerTag === 'use' && (lowerAttr === 'href' || lowerAttr === 'xlink:href')) {
    const trimmed = decodeHtmlEntities(rawVal).replace(
      /^[\u0000-\u0020\u007f-\u009f\s]+|[\u0000-\u0020\u007f-\u009f\s]+$/g,
      '',
    );
    if (!trimmed.startsWith('#') || compact.startsWith('//')) {
      return true;
    }
  }
  return false;
}

/**
 * Single pass of quote-aware SVG tag & attribute sanitization.
 * @param {string} input
 * @returns {string}
 */
function sanitizeSvgPass(input) {
  const cleaned = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '');

  const len = cleaned.length;
  let out = '';
  let i = 0;

  while (i < len) {
    const lt = cleaned.indexOf('<', i);
    if (lt === -1) {
      out += cleaned.slice(i);
      break;
    }
    if (lt > i) {
      out += cleaned.slice(i, lt);
    }

    const rest = cleaned.slice(lt);

    // Closing tag `</tag>`
    const closeMatch = /^<\/\s*([a-zA-Z][a-zA-Z0-9:_-]*)[^>]*>/.exec(rest);
    if (closeMatch) {
      const closeName = closeMatch[1];
      if (!DANGEROUS_SVG_TAGS.has(closeName.toLowerCase())) {
        out += `</${closeName}>`;
      }
      i = lt + closeMatch[0].length;
      continue;
    }

    // Opening tag `<tag ...>`
    const openMatch = /^<([a-zA-Z][a-zA-Z0-9:_-]*)/.exec(rest);
    if (!openMatch) {
      out += '&lt;';
      i = lt + 1;
      continue;
    }

    const tagName = openMatch[1];
    const lowerTag = tagName.toLowerCase();
    let pos = lt + openMatch[0].length;
    let selfClosing = false;
    let closedGt = false;
    /** @type {Array<{ name: string, value: string, hasValue: boolean }>} */
    const attrs = [];

    while (pos < len) {
      while (pos < len && /\s/.test(cleaned[pos])) pos += 1;
      if (pos >= len) break;

      const ch = cleaned[pos];
      if (ch === '>') {
        pos += 1;
        closedGt = true;
        break;
      }
      if (ch === '/') {
        if (cleaned[pos + 1] === '>') {
          selfClosing = true;
          closedGt = true;
          pos += 2;
          break;
        }
        pos += 1;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '=') {
        pos += 1;
        continue;
      }

      const nameStart = pos;
      while (pos < len && !/[\s=/>"']/.test(cleaned[pos])) {
        pos += 1;
      }
      const attrName = cleaned.slice(nameStart, pos);
      if (!attrName) {
        pos += 1;
        continue;
      }

      while (pos < len && /\s/.test(cleaned[pos])) pos += 1;

      if (cleaned[pos] === '=') {
        pos += 1;
        while (pos < len && /\s/.test(cleaned[pos])) pos += 1;
        let attrVal = '';
        if (pos < len && (cleaned[pos] === '"' || cleaned[pos] === "'")) {
          const quote = cleaned[pos];
          pos += 1;
          const valStart = pos;
          const endQuote = cleaned.indexOf(quote, pos);
          if (endQuote === -1) {
            attrVal = cleaned.slice(valStart);
            pos = len;
          } else {
            attrVal = cleaned.slice(valStart, endQuote);
            pos = endQuote + 1;
          }
        } else {
          const valStart = pos;
          while (
            pos < len &&
            !/[\s>]/.test(cleaned[pos]) &&
            !(cleaned[pos] === '/' && cleaned[pos + 1] === '>')
          ) {
            pos += 1;
          }
          attrVal = cleaned.slice(valStart, pos);
        }
        attrs.push({ name: attrName, value: attrVal, hasValue: true });
      } else {
        attrs.push({ name: attrName, value: '', hasValue: false });
      }
    }

    if (!closedGt) {
      // Drop malformed unclosed tag tail
      break;
    }

    if (DANGEROUS_SVG_TAGS.has(lowerTag)) {
      if (!selfClosing) {
        const escapedTag = lowerTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const endRe = new RegExp(`<\\/\\s*${escapedTag}\\b[^>]*>`, 'i');
        const endMatch = endRe.exec(cleaned.slice(pos));
        if (endMatch) {
          pos += endMatch.index + endMatch[0].length;
        } else if (lowerTag === 'script' || lowerTag === 'style') {
          pos = len;
        }
      }
      i = pos;
      continue;
    }

    let attrOut = '';
    for (let a = 0; a < attrs.length; a += 1) {
      const { name, value, hasValue } = attrs[a];
      const lowerAttr = name.toLowerCase();

      // Strip all inline `on*` event handler attributes
      if (lowerAttr.startsWith('on')) continue;

      // Sanitize URL-bearing attributes
      if (URL_ATTRS.has(lowerAttr)) {
        if (!hasValue || isUnsafeUrlAttr(lowerTag, lowerAttr, value)) continue;
      }

      // Guard inline style attributes against script/data URLs
      if (lowerAttr === 'style' && hasValue) {
        const normStyle = normalizeUrlForCheck(value);
        if (
          normStyle.includes('javascript:') ||
          normStyle.includes('vbscript:') ||
          normStyle.includes('data:') ||
          normStyle.includes('expression(') ||
          normStyle.includes('@import')
        ) {
          continue;
        }
      }

      if (hasValue) {
        attrOut += ` ${name}="${value.replace(/"/g, '&quot;')}"`;
      } else {
        attrOut += ` ${name}`;
      }
    }

    out += `<${tagName}${attrOut}${selfClosing ? '/>' : '>'}`;
    i = pos;
  }

  return out;
}

/**
 * Strip dangerous elements, inline `on*` event handlers, and unsafe URLs from SVG markup.
 * @param {string} raw
 * @returns {string}
 */
export function sanitizeSvgMarkup(raw) {
  if (typeof raw !== 'string' || !raw) return '';
  let cur = raw;
  for (let pass = 0; pass < 4; pass += 1) {
    const next = sanitizeSvgPass(cur);
    if (next === cur) break;
    cur = next;
  }
  return cur.trim();
}

/**
 * Extract an XML/HTML attribute value from an opening tag's attribute string.
 * @param {string} attrs
 * @param {string} attrName
 * @returns {string | undefined}
 */
function readAttr(attrs, attrName) {
  const re = new RegExp(
    `(?:^|[\\s/"'])${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>"']+))`,
    'i',
  );
  const m = re.exec(attrs);
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

/**
 * Guard extracted presentation attribute (`fill` / `stroke`) against unsafe URL schemes.
 * @param {string | undefined} val
 * @returns {string | undefined}
 */
function sanitizePaintAttr(val) {
  if (val === undefined) return undefined;
  const norm = normalizeUrlForCheck(val);
  if (
    norm.includes('javascript:') ||
    norm.includes('vbscript:') ||
    norm.includes('data:')
  ) {
    return undefined;
  }
  return val;
}

/**
 * Check whether an icon definition represents declarative SVG markup rather than
 * a framework component.
 * @param {unknown} def
 * @returns {def is string | SvgIconDefinition}
 */
export function isSvgIconDefinition(def) {
  if (typeof def === 'string') return true;
  if (
    def !== null &&
    typeof def === 'object' &&
    'body' in def &&
    typeof (/** @type {{ body?: unknown }} */ (def).body) === 'string'
  ) {
    return true;
  }
  return false;
}

/**
 * Normalize a raw `<svg viewBox="…">…</svg>` string, SVG fragment, path `d` string,
 * or `{ viewBox, body }` object into a clean `{ viewBox, body, fill?, stroke? }`
 * structure without double `<svg>` nesting. Returns `null` for non-SVG inputs
 * (such as Vue or React component definitions).
 * @param {unknown} def
 * @returns {ParsedSvgIcon | null}
 */
export function parseSvgIcon(def) {
  if (!isSvgIconDefinition(def)) return null;

  if (typeof def === 'string') {
    const trimmed = def.trim();
    if (!trimmed) return null;

    const svgMatch = OUTER_SVG_RE.exec(trimmed);
    if (svgMatch) {
      const attrs = svgMatch[1] || '';
      const inner = sanitizeSvgMarkup(svgMatch[2] || '');
      const viewBox =
        readAttr(attrs, 'viewBox') ||
        (() => {
          const w = readAttr(attrs, 'width');
          const h = readAttr(attrs, 'height');
          return w && h && /^\d+(\.\d+)?$/.test(w) && /^\d+(\.\d+)?$/.test(h)
            ? `0 0 ${w} ${h}`
            : '0 0 16 16';
        })();
      const fill = sanitizePaintAttr(readAttr(attrs, 'fill'));
      const stroke = sanitizePaintAttr(readAttr(attrs, 'stroke'));
      return freezeParsedSvg(viewBox, inner, fill, stroke);
    }

    if (trimmed.startsWith('<')) {
      return freezeParsedSvg('0 0 16 16', sanitizeSvgMarkup(trimmed));
    }

    if (/^[Mm]\s*[-\d.]/.test(trimmed)) {
      const escaped = trimmed.replace(/"/g, '&quot;');
      return freezeParsedSvg('0 0 16 16', `<path d="${escaped}"/>`);
    }

    return null;
  }

  // Fast path for already-parsed and verified frozen definitions
  if (VERIFIED_SVG_ICONS.has(def)) {
    return /** @type {ParsedSvgIcon} */ (def);
  }

  const rawBody = def.body.trim();
  const nestedMatch = OUTER_SVG_RE.exec(rawBody);
  const attrs = nestedMatch ? nestedMatch[1] || '' : '';
  const body = sanitizeSvgMarkup(nestedMatch ? nestedMatch[2] || '' : rawBody);
  const viewBox = def.viewBox || (attrs ? readAttr(attrs, 'viewBox') : undefined) || '0 0 16 16';
  const fill = sanitizePaintAttr(def.fill ?? (attrs ? readAttr(attrs, 'fill') : undefined));
  const stroke = sanitizePaintAttr(def.stroke ?? (attrs ? readAttr(attrs, 'stroke') : undefined));

  return freezeParsedSvg(viewBox, body, fill, stroke);
}

/**
 * Look up a single icon name from a map or resolver function.
 * @param {IconRegistrySource<unknown> | null | undefined} source
 * @param {string} name
 * @returns {unknown}
 */
function lookupFromSource(source, name) {
  if (!source) return undefined;
  if (typeof source === 'function') {
    return /** @type {IconResolverFn<unknown>} */ (source)(name);
  }
  if (typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, name)) {
    return /** @type {IconMap<unknown>} */ (source)[name];
  }
  return undefined;
}

/**
 * Register a custom icon map or resolver function globally. Later registrations
 * take precedence over earlier ones and built-in icons.
 * Returns an `unregister` cleanup function.
 * @template [TComponent=unknown]
 * @param {IconRegistrySource<TComponent>} iconsOrResolver
 * @returns {() => void}
 */
export function registerIcons(iconsOrResolver) {
  if (!iconsOrResolver) return () => {};
  registeredSources.unshift(/** @type {IconRegistrySource<unknown>} */ (iconsOrResolver));
  return () => {
    const idx = registeredSources.indexOf(iconsOrResolver);
    if (idx !== -1) registeredSources.splice(idx, 1);
  };
}

/**
 * Clear all globally registered custom icon maps and resolvers.
 */
export function clearRegisteredIcons() {
  registeredSources.length = 0;
}

/**
 * Resolve an icon by name, checking `customResolver` first, then globally
 * registered icon maps/resolvers (newest first), then `BUILTIN_ICONS`.
 * Normalizes SVG strings and `{ viewBox, body }` objects via `parseSvgIcon`,
 * while returning framework component definitions untouched.
 * @param {string | null | undefined} name
 * @param {IconRegistrySource<unknown> | null} [customResolver]
 * @returns {ParsedSvgIcon | unknown | null}
 */
export function resolveIcon(name, customResolver) {
  if (!name) return null;

  let candidate = lookupFromSource(customResolver, name);

  if (candidate == null) {
    for (let i = 0; i < registeredSources.length; i += 1) {
      candidate = lookupFromSource(registeredSources[i], name);
      if (candidate != null) break;
    }
  }

  if (candidate == null && Object.prototype.hasOwnProperty.call(BUILTIN_ICONS, name)) {
    return BUILTIN_ICONS[name];
  }

  if (candidate == null) return null;
  if (isSvgIconDefinition(candidate)) {
    return parseSvgIcon(candidate);
  }
  return candidate;
}

/**
 * Return all built-in icon names (including standard aliases).
 * @returns {string[]}
 */
export function listBuiltinIcons() {
  return Object.keys(BUILTIN_ICONS);
}
