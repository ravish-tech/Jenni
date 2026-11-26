// Pluggable icon registry and optical 24x24 geometricPrecision stroke icon dictionary.
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
const svg24 = (body) => freezeParsedSvg('0 0 24 24', body);

const ICON_X = svg24('<path d="M18 6 6 18M6 6l12 12"/>');
const ICON_SETTINGS = svg24(
  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.25.4-1.51 1Z"/>',
);
const ICON_EDIT = svg24(
  '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
);
const ICON_REFRESH = svg24(
  '<path d="M21 3v5h-5M3 21v-5h5"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L21 8M20.49 15a9 9 0 0 1-14.85 3.36L3 16"/>',
);
const ICON_MORE_H = svg24(
  '<circle cx="5" cy="12" r="1.25"/><circle cx="12" cy="12" r="1.25"/><circle cx="19" cy="12" r="1.25"/>',
);
const ICON_ALERT_TRIANGLE = svg24(
  '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
);
const ICON_ALERT_CIRCLE = svg24(
  '<circle cx="12" cy="12" r="9.5"/><path d="M12 8v4.5M12 16h.01"/>',
);
const ICON_PANEL_LEFT = svg24(
  '<rect x="3" y="3.5" width="18" height="17" rx="2"/><path d="M9 3.5v17"/>',
);
const ICON_SPARKLES = svg24(
  '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
);
const ICON_CHEVRON_DOWN = svg24('<path d="m6 9 6 6 6-6"/>');
const ICON_ARROW_RIGHT = svg24('<path d="M5 12h14m-6-6 6 6-6 6"/>');

/**
 * Built-in dictionary of high-definition 24x24 precision stroke icons and standard aliases.
 * @type {Readonly<Record<string, ParsedSvgIcon>>}
 */
export const BUILTIN_ICONS = Object.freeze({
  check: svg24('<path d="M20 6 9 17l-5-5"/>'),
  x: ICON_X,
  close: ICON_X,
  plus: svg24('<path d="M12 5v14M5 12h14"/>'),
  minus: svg24('<path d="M5 12h14"/>'),
  search: svg24('<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.15-4.15"/>'),
  settings: ICON_SETTINGS,
  gear: ICON_SETTINGS,
  'chevron-down': ICON_CHEVRON_DOWN,
  chevron: ICON_CHEVRON_DOWN,
  'chevron-up': svg24('<path d="m18 15-6-6-6 6"/>'),
  'chevron-left': svg24('<path d="m15 18-6-6 6-6"/>'),
  'chevron-right': svg24('<path d="m9 18 6-6-6-6"/>'),
  'chevrons-up-down': svg24('<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>'),
  'arrow-up': svg24('<path d="M12 19V5m-6 6 6-6 6 6"/>'),
  'arrow-down': svg24('<path d="M12 5v14m-6-6 6 6 6-6"/>'),
  'arrow-left': svg24('<path d="M19 12H5m6-6-6 6 6 6"/>'),
  'arrow-right': ICON_ARROW_RIGHT,
  arrow: ICON_ARROW_RIGHT,
  'external-link': svg24(
    '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  ),
  copy: svg24(
    '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>',
  ),
  clipboard: svg24(
    '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  ),
  trash: svg24(
    '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/>',
  ),
  edit: ICON_EDIT,
  pencil: ICON_EDIT,
  eye: svg24(
    '<path d="M2.06 12.35a1 1 0 0 1 0-.7C3.78 7.5 7.52 5 12 5s8.22 2.5 9.94 6.65a1 1 0 0 1 0 .7C20.22 16.5 16.48 19 12 19s-8.22-2.5-9.94-6.65Z"/><circle cx="12" cy="12" r="3"/>',
  ),
  'eye-off': svg24(
    '<path d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.88 5.09A10.94 10.94 0 0 1 12 5c4.48 0 8.22 2.5 9.94 6.65a1 1 0 0 1 0 .7 11.4 11.4 0 0 1-4.18 5.15M6.61 6.61A11.5 11.5 0 0 0 2.06 11.65a1 1 0 0 0 0 .7C3.78 16.5 7.52 19 12 19c1.9 0 3.68-.45 5.23-1.27"/>',
  ),
  folder: svg24(
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  ),
  'folder-open': svg24(
    '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  ),
  file: svg24(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  ),
  'file-code': svg24(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4m-10 4-2 2 2 2m4-4 2 2-2 2"/>',
  ),
  terminal: svg24(
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3.5 3L7 15m5.5 0H17"/>',
  ),
  code: svg24('<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>'),
  'git-branch': svg24(
    '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  ),
  'git-commit': svg24('<circle cx="12" cy="12" r="3.5"/><path d="M2 12h6.5M15.5 12H22"/>'),
  'git-pull-request': svg24(
    '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7M6 9v12"/>',
  ),
  'git-merge': svg24(
    '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  ),
  play: svg24('<polygon points="6 3 20 12 6 21 6 3"/>'),
  pause: svg24(
    '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  ),
  stop: svg24('<rect x="4.5" y="4.5" width="15" height="15" rx="2"/>'),
  refresh: ICON_REFRESH,
  reload: ICON_REFRESH,
  reset: svg24('<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>'),
  download: svg24(
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"/>',
  ),
  upload: svg24(
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7-5-5-5 5m5-5v12"/>',
  ),
  filter: svg24('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
  sliders: svg24(
    '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  ),
  'more-horizontal': ICON_MORE_H,
  dots: ICON_MORE_H,
  'more-vertical': svg24(
    '<circle cx="12" cy="5" r="1.25"/><circle cx="12" cy="12" r="1.25"/><circle cx="12" cy="19" r="1.25"/>',
  ),
  pin: svg24(
    '<path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 1 1-1 1 1 0 0 0 1-1V3H7v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/>',
  ),
  'file-text': svg24(
    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h6M8 9h2"/>',
  ),
  star: svg24(
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  ),
  bell: svg24(
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.3 13a1.94 1.94 0 0 0 3.4 0"/>',
  ),
  info: svg24('<circle cx="12" cy="12" r="9.5"/><path d="M12 16v-4.5M12 8h.01"/>'),
  'alert-triangle': ICON_ALERT_TRIANGLE,
  warning: ICON_ALERT_TRIANGLE,
  'alert-circle': ICON_ALERT_CIRCLE,
  error: ICON_ALERT_CIRCLE,
  'check-circle': svg24('<circle cx="12" cy="12" r="9.5"/><path d="m8.5 12.25 2.4 2.4 4.8-5.1"/>'),
  clock: svg24('<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>'),
  calendar: svg24(
    '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9.5h18"/>',
  ),
  user: svg24('<circle cx="12" cy="8" r="4"/><path d="M19 21v-1a7 7 0 0 0-14 0v1"/>'),
  users: svg24(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  ),
  'user-plus': svg24(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6m-3-3h6"/>',
  ),
  'panel-left': ICON_PANEL_LEFT,
  'dock-left': ICON_PANEL_LEFT,
  sidebar: ICON_PANEL_LEFT,
  'panel-right': svg24('<rect x="3" y="3.5" width="18" height="17" rx="2"/><path d="M15 3.5v17"/>'),
  panel: svg24('<rect x="3" y="3.5" width="18" height="17" rx="2"/><path d="M15 3.5v17"/>'),
  'panel-bottom': svg24('<rect x="3" y="3.5" width="18" height="17" rx="2"/><path d="M3 15h18"/>'),
  maximize: svg24('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  expand: svg24('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  minimize: svg24('<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>'),
  sparkles: ICON_SPARKLES,
  sparkle: ICON_SPARKLES,
  menu: svg24('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  sun: svg24(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  ),
  moon: svg24('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  monitor: svg24(
    '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  ),
  loader: svg24(
    '<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/>',
  ),
  command: svg24(
    '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3Z"/>',
  ),
  layers: svg24('<path d="m12 2 10 5-10 5L2 7l10-5Zm10 10-10 5-10-5m20 5-10 5-10-5"/>'),
  cpu: svg24(
    '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>',
  ),
  database: svg24(
    '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
  ),
  server: svg24(
    '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
  ),
  cloud: svg24('<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>'),
  globe: svg24(
    '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a15.3 15.3 0 0 1 4 9.5 15.3 15.3 0 0 1-4 9.5 15.3 15.3 0 0 1-4-9.5 15.3 15.3 0 0 1 4-9.5Z"/>',
  ),
  lock: svg24(
    '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M7.5 11V7a4.5 4.5 0 0 1 9 0v4"/>',
  ),
  unlock: svg24(
    '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M7.5 11V7a4.5 4.5 0 0 1 8.8-1.2"/>',
  ),
  shield: svg24('<path d="M12 2.5 19.5 6v5.5c0 5-3.2 8.7-7.5 10-4.3-1.3-7.5-5-7.5-10V6L12 2.5Z"/>'),
  'shield-check': svg24(
    '<path d="M12 2.5 19.5 6v5.5c0 5-3.2 8.7-7.5 10-4.3-1.3-7.5-5-7.5-10V6L12 2.5Z"/><path d="m9 12 2 2 4-4"/>',
  ),
  key: svg24(
    '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 3-9.6 9.6M15.5 8.5l2.5 2.5M18 6l2.5 2.5"/>',
  ),
  send: svg24('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'),
  paperclip: svg24(
    '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  ),
  bookmark: svg24('<path d="m19 21-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>'),
  archive: svg24(
    '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-10 4h4"/>',
  ),
  inbox: svg24(
    '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>',
  ),
  mail: svg24(
    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  ),
  message: svg24('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>'),
  building: svg24(
    '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  ),
  'chart-bar': svg24('<path d="M3 3v18h18M7 16v-4m5 4V8m5 8v-6"/>'),
  'chart-line': svg24('<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>'),
  activity: svg24('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
  zap: svg24('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  flame: svg24(
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>',
  ),
  tag: svg24(
    '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.58 8.58a2 2 0 0 0 2.83 0l7.17-7.17a2 2 0 0 0 0-2.83Z"/><path d="M7 7h.01"/>',
  ),
  hash: svg24('<path d="M4 9h16M4 15h16M10 3 8 21m8-18-2 18"/>'),
  link: svg24(
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  ),
  unlink: svg24(
    '<path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71M8 2v3M2 8h3m11 11v3m3-8h3"/>',
  ),
  share: svg24(
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98m-.01-10.98-6.82 3.98"/>',
  ),
  'grip-vertical': svg24(
    '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
  ),
  'grip-horizontal': svg24(
    '<circle cx="5" cy="9" r="1"/><circle cx="12" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="5" cy="15" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="19" cy="15" r="1"/>',
  ),
  layout: svg24(
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',
  ),
  columns: svg24(
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  ),
  screens: svg24(
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  ),
  home: svg24('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>'),
  compass: svg24(
    '<circle cx="12" cy="12" r="9.5"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  ),
  book: svg24(
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"/>',
  ),
  wrench: svg24(
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
  ),
  bug: svg24(
    '<rect x="8" y="6" width="8" height="14" rx="4"/><path d="m19 7-3 2M5 7l3 2m11 10-3-2M5 19l3-2M20 13h-4M8 13H4m5-7V4m6 2V4"/>',
  ),
  diff: svg24('<path d="M12 3v12M6 9h12M6 19h12"/>'),
  history: svg24('<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5m4-1v5l3.5 2"/>'),
  undo: svg24('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>'),
  redo: svg24('<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>'),
  save: svg24(
    '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  ),
  'help-circle': svg24(
    '<circle cx="12" cy="12" r="9.5"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.75-3 2.75M12 17h.01"/>',
  ),
  'minus-circle': svg24('<circle cx="12" cy="12" r="9.5"/><path d="M8 12h8"/>'),
  'plus-circle': svg24('<circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8"/>'),
  'x-circle': svg24('<circle cx="12" cy="12" r="9.5"/><path d="m15 9-6 6m0-6 6 6"/>'),
  ban: svg24('<circle cx="12" cy="12" r="9.5"/><path d="m5.3 5.3 13.4 13.4"/>'),
  wifi: svg24(
    '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
  ),
  image: svg24(
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  ),
  camera: svg24(
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.5"/>',
  ),
  mic: svg24(
    '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2m7 9v3"/>',
  ),
  gauge: svg24('<path d="m12 14 4-4M3.34 19a10 10 0 1 1 17.32 0"/>'),
  ruler: svg24('<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v4m4-4v3m4-3v4m4-4v3"/>'),
  tablet: svg24('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>'),
  smartphone: svg24('<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 18h.01"/>'),
  laptop: svg24('<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20"/>'),
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
