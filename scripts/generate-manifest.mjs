#!/usr/bin/env node
/**
 * Machine-readable Component & Token API Manifest Generator (Priority 3).
 *
 * Parses TypeScript / Vue SFC / React TSX / Core CSS & JS sources directly so AI
 * coding agents and IDEs never guess or hallucinate a component prop, event, slot,
 * imperative method, composable, or granular CSS import.
 *
 * Outputs:
 *   - COMPONENT_MANIFEST.json (root)
 *   - packages/core/manifest.json
 *   - packages/vue/manifest.json
 *   - packages/react/manifest.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Shared CSS prerequisites when importing individual component stylesheets. */
export const COMPONENT_CSS_DEPS = {
  input: ['control.css', 'input.css'],
  textarea: ['control.css', 'textarea.css'],
  select: ['control.css', 'select.css'],
  checkbox: ['choice.css', 'checkbox.css'],
  radio: ['choice.css', 'radio.css'],
  combobox: ['floating.css', 'control.css', 'combobox.css'],
  'date-picker': ['floating.css', 'control.css', 'date-picker.css'],
  'time-picker': ['floating.css', 'control.css', 'time-picker.css'],
  'color-picker': ['floating.css', 'control.css', 'color-picker.css'],
  tooltip: ['floating.css', 'tooltip.css'],
  popover: ['floating.css', 'popover.css'],
  menu: ['floating.css', 'menu.css'],
  'context-menu': ['floating.css', 'menu.css', 'context-menu.css'],
  'hover-card': ['floating.css', 'hover-card.css'],
  'doc-tabs': ['floating.css', 'menu.css', 'doc-tabs.css'],
  'data-grid': ['choice.css', 'checkbox.css', 'virtual-list.css', 'data-grid.css'],
};

/** Map Vue component stem (without leading J) to its granular CSS slug. */
const VUE_TO_CSS_SLUG = {
  AppShell: 'shell',
  Page: 'page',
  PageHeader: 'page',
  Section: 'page',
  Container: 'primitives',
  Stack: 'primitives',
  Inline: 'primitives',
  Grid: 'grid',
  Col: 'grid',
  List: 'list',
  ListItem: 'list',
  Sidebar: 'bars',
  SidebarGroup: 'bars',
  SidebarItem: 'bars',
  TopBar: 'bars',
  BottomBar: 'bars',
  BottomBarItem: 'bars',
  StatusBar: 'statusbar',
  StatusBarItem: 'statusbar',
  Toolbar: 'toolbar',
  ToolbarGroup: 'toolbar',
  ToolbarSeparator: 'toolbar',
  ToolbarSpacer: 'toolbar',
  ScrollArea: 'scroll-area',
  ResizableGroup: 'resizable',
  ResizablePanel: 'resizable',
  ResizableHandle: 'resizable',
  Bento: 'screens',
  BentoCell: 'screens',
  Board: 'screens',
  BoardColumn: 'screens',
  DocsLayout: 'screens',
  AuthSplit: 'screens',
  AiCanvas: 'screens',
  CanvasStage: 'screens',
  Button: 'button',
  ButtonGroup: 'button',
  Toggle: 'toggle',
  ToggleGroup: 'toggle',
  SegmentedControl: 'segmented',
  SegmentedItem: 'segmented',
  Field: 'field',
  Label: 'field',
  Input: 'input',
  Textarea: 'textarea',
  NumberInput: 'number-input',
  PinInput: 'pin-input',
  TagInput: 'tag-input',
  Select: 'select',
  Checkbox: 'checkbox',
  Radio: 'radio',
  RadioGroup: 'radio',
  Switch: 'switch',
  Slider: 'slider',
  FileUpload: 'file-upload',
  DatePicker: 'date-picker',
  Calendar: 'date-picker',
  TimePicker: 'time-picker',
  ColorPicker: 'color-picker',
  RichTextEditor: 'rich-text',
  Icon: 'icon',
  IconProvider: 'icon',
  Badge: 'badge',
  Avatar: 'avatar',
  AvatarGroup: 'avatar',
  Card: 'card',
  Alert: 'alert',
  Spinner: 'spinner',
  Progress: 'progress',
  Skeleton: 'skeleton',
  Kbd: 'kbd',
  Separator: 'separator',
  Accordion: 'accordion',
  AccordionItem: 'accordion',
  Collapsible: 'accordion',
  Breadcrumb: 'breadcrumb',
  BreadcrumbItem: 'breadcrumb',
  Pagination: 'pagination',
  EmptyState: 'empty-state',
  Table: 'table',
  DataTable: 'table',
  VirtualList: 'virtual-list',
  DataGrid: 'data-grid',
  Stepper: 'stepper',
  Step: 'stepper',
  TreeView: 'tree-view',
  TreeItem: 'tree-view',
  Carousel: 'carousel',
  CarouselSlide: 'carousel',
  Dialog: 'dialog',
  Drawer: 'drawer',
  Popover: 'popover',
  Tooltip: 'tooltip',
  HoverCard: 'hover-card',
  DropdownMenu: 'menu',
  DropdownItem: 'menu',
  DropdownLabel: 'menu',
  DropdownSeparator: 'menu',
  ContextMenu: 'context-menu',
  Tabs: 'tabs',
  TabList: 'tabs',
  Tab: 'tabs',
  TabPanel: 'tabs',
  DocTabs: 'doc-tabs',
  Toaster: 'toast',
  Combobox: 'combobox',
  CommandPalette: 'command-palette',
};

/** Built-in DOM / framework wrapper base types skipped when merging component props. */
const BUILTIN_BASE_TYPES = new Set([
  'ComponentProps',
  'ComponentPropsWithoutRef',
  'ComponentPropsWithRef',
  'HTMLAttributes',
  'SVGAttributes',
  'SVGProps',
  'AriaAttributes',
  'DOMAttributes',
  'AllHTMLAttributes',
  'IntrinsicAttributes',
  'VNodeProps',
  'AllowedComponentProps',
  'Record',
]);

function isSkippedDomBase(typeName) {
  const bare = typeName.includes('.') ? typeName.split('.').pop() : typeName;
  if (BUILTIN_BASE_TYPES.has(bare)) return true;
  if (bare.endsWith('HTMLAttributes') || bare.endsWith('SVGAttributes')) return true;
  return false;
}

function extractTokens() {
  const raw = fs.readFileSync(path.join(ROOT, 'packages/core/src/tokens.css'), 'utf8');
  const clean = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Set();
  for (const m of clean.matchAll(/(--j-[a-z0-9]+(?:-[a-z0-9]+)*)/g)) {
    tokens.add(m[1]);
  }
  return [...tokens].sort();
}

function extractVueScripts(vueSource) {
  const blocks = [];
  for (const m of vueSource.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (m[1]) blocks.push(m[1]);
  }
  return blocks.join('\n');
}

function extractMembersProps(members, sf) {
  /** @type {Array<{ name: string, type: string, required: boolean }>} */
  const out = [];
  for (const member of members) {
    if (ts.isPropertySignature(member) && member.name) {
      const name = member.name.getText(sf).replace(/^['"]|['"]$/g, '');
      const type = member.type ? member.type.getText(sf).replace(/\s+/g, ' ').trim() : 'unknown';
      const required = !member.questionToken;
      out.push({ name, type, required });
    } else if (ts.isMethodSignature(member) && member.name) {
      const name = member.name.getText(sf).replace(/^['"]|['"]$/g, '');
      const params = member.parameters.map((p) => p.getText(sf).replace(/\s+/g, ' ').trim()).join(', ');
      const ret = member.type ? member.type.getText(sf).replace(/\s+/g, ' ').trim() : 'unknown';
      const required = !member.questionToken;
      out.push({ name, type: `(${params}) => ${ret}`, required });
    }
  }
  return out;
}

function extractStringLiteralSet(typeNode, sf) {
  /** @type {Set<string> | null} */
  const keys = new Set();
  function walk(n) {
    if (!n) return false;
    if (ts.isParenthesizedTypeNode(n)) return walk(n.type);
    if (ts.isLiteralTypeNode(n) && ts.isStringLiteral(n.literal)) {
      keys.add(n.literal.text);
      return true;
    }
    if (ts.isUnionTypeNode(n)) {
      let any = false;
      for (const branch of n.types) {
        if (walk(branch)) any = true;
      }
      return any;
    }
    void sf;
    return false;
  }
  return walk(typeNode) ? keys : null;
}

function mergePropsSequential(lists) {
  /** @type {Map<string, { name: string, type: string, required: boolean }>} */
  const merged = new Map();
  for (const list of lists) {
    for (const p of list) {
      merged.set(p.name, { ...p });
    }
  }
  return [...merged.values()];
}

function mergePropsUnion(branchLists) {
  const nonEmpty = branchLists.filter((l) => l.length > 0);
  if (nonEmpty.length === 0) return [];
  if (nonEmpty.length === 1) return nonEmpty[0].map((p) => ({ ...p }));

  /** @type {Map<string, { types: string[], count: number, allRequired: boolean }>} */
  const acc = new Map();
  for (const list of nonEmpty) {
    const seenInBranch = new Set();
    for (const p of list) {
      if (seenInBranch.has(p.name)) continue;
      seenInBranch.add(p.name);
      let entry = acc.get(p.name);
      if (!entry) {
        entry = { types: [], count: 0, allRequired: true };
        acc.set(p.name, entry);
      }
      if (!entry.types.includes(p.type)) entry.types.push(p.type);
      entry.count += 1;
      if (!p.required) entry.allRequired = false;
    }
  }

  const branchCount = nonEmpty.length;
  /** @type {Array<{ name: string, type: string, required: boolean }>} */
  const out = [];
  for (const [name, entry] of acc.entries()) {
    const type =
      entry.types.length === 2 &&
      ((entry.types[0] === 'false' && entry.types[1] === 'true') ||
        (entry.types[0] === 'true' && entry.types[1] === 'false'))
        ? 'boolean'
        : entry.types.join(' | ');
    out.push({
      name,
      type,
      required: entry.count === branchCount && entry.allRequired,
    });
  }
  return out;
}

function collectSourceFiles(dirs, acc = []) {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectSourceFiles([full], acc);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(full, 'utf8');
        const kind = entry.name.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
        acc.push(ts.createSourceFile(full, content, ts.ScriptTarget.ES2022, true, kind));
      } else if (entry.name.endsWith('.vue')) {
        const raw = fs.readFileSync(full, 'utf8');
        const script = extractVueScripts(raw);
        if (script.trim()) {
          acc.push(
            ts.createSourceFile(full + '.ts', script, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS),
          );
        }
      }
    }
  }
  return acc;
}

function collectInterfaceMap(dirs) {
  const sourceFiles = collectSourceFiles(dirs);

  /**
   * @type {Map<string, Array<{ kind: 'interface' | 'type', node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, sf: ts.SourceFile }>>}
   */
  const rawDecls = new Map();

  for (const sf of sourceFiles) {
    sf.forEachChild((node) => {
      if (ts.isInterfaceDeclaration(node)) {
        const name = node.name.text;
        const arr = rawDecls.get(name) || [];
        arr.push({ kind: 'interface', node, sf });
        rawDecls.set(name, arr);
      } else if (ts.isTypeAliasDeclaration(node)) {
        const name = node.name.text;
        const arr = rawDecls.get(name) || [];
        arr.push({ kind: 'type', node, sf });
        rawDecls.set(name, arr);
      }
    });
  }

  /** @type {Map<string, Array<{ name: string, type: string, required: boolean }>>} */
  const resolvedCache = new Map();

  function resolveRefOrHeritage(refName, typeArgs, sf, visiting) {
    const bare = refName.includes('.') ? refName.split('.').pop() : refName;
    if (!bare || isSkippedDomBase(bare)) return [];

    if (bare === 'Omit' && typeArgs && typeArgs.length >= 1) {
      const baseProps = resolveTypeNode(typeArgs[0], sf, visiting);
      if (baseProps.length === 0) return [];
      const omitted = typeArgs[1] ? extractStringLiteralSet(typeArgs[1], sf) : null;
      return omitted ? baseProps.filter((p) => !omitted.has(p.name)) : baseProps;
    }

    if (bare === 'Pick' && typeArgs && typeArgs.length >= 2) {
      const baseProps = resolveTypeNode(typeArgs[0], sf, visiting);
      const picked = extractStringLiteralSet(typeArgs[1], sf);
      return picked ? baseProps.filter((p) => picked.has(p.name)) : baseProps;
    }

    if (bare === 'Partial' && typeArgs && typeArgs.length >= 1) {
      return resolveTypeNode(typeArgs[0], sf, visiting).map((p) => ({ ...p, required: false }));
    }

    if (bare === 'Required' && typeArgs && typeArgs.length >= 1) {
      return resolveTypeNode(typeArgs[0], sf, visiting).map((p) => ({ ...p, required: true }));
    }

    if (bare === 'Readonly' && typeArgs && typeArgs.length >= 1) {
      return resolveTypeNode(typeArgs[0], sf, visiting);
    }

    return resolveByName(bare, visiting);
  }

  function resolveTypeNode(typeNode, sf, visiting) {
    if (!typeNode) return [];
    if (ts.isParenthesizedTypeNode(typeNode)) {
      return resolveTypeNode(typeNode.type, sf, visiting);
    }
    if (ts.isTypeLiteralNode(typeNode)) {
      return extractMembersProps(typeNode.members, sf);
    }
    if (ts.isTypeReferenceNode(typeNode)) {
      const refName = typeNode.typeName.getText(sf).trim();
      return resolveRefOrHeritage(refName, typeNode.typeArguments, sf, visiting);
    }
    if (ts.isIntersectionTypeNode(typeNode)) {
      return mergePropsSequential(typeNode.types.map((t) => resolveTypeNode(t, sf, visiting)));
    }
    if (ts.isUnionTypeNode(typeNode)) {
      return mergePropsUnion(typeNode.types.map((t) => resolveTypeNode(t, sf, visiting)));
    }
    return [];
  }

  function resolveByName(name, visiting = new Set()) {
    if (resolvedCache.has(name)) {
      return resolvedCache.get(name).map((p) => ({ ...p }));
    }
    if (visiting.has(name)) return [];
    const decls = rawDecls.get(name);
    if (!decls || decls.length === 0) return [];

    const nextVisiting = new Set(visiting);
    nextVisiting.add(name);

    const parts = [];
    for (const { kind, node, sf } of decls) {
      if (kind === 'interface') {
        const iface = /** @type {ts.InterfaceDeclaration} */ (node);
        if (iface.heritageClauses) {
          for (const clause of iface.heritageClauses) {
            if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;
            for (const expr of clause.types) {
              const baseName = expr.expression.getText(sf).trim();
              parts.push(resolveRefOrHeritage(baseName, expr.typeArguments, sf, nextVisiting));
            }
          }
        }
        parts.push(extractMembersProps(iface.members, sf));
      } else {
        const alias = /** @type {ts.TypeAliasDeclaration} */ (node);
        parts.push(resolveTypeNode(alias.type, sf, nextVisiting));
      }
    }

    const merged = mergePropsSequential(parts);
    resolvedCache.set(name, merged);
    return merged.map((p) => ({ ...p }));
  }

  /** @type {Map<string, Array<{ name: string, type: string, required: boolean }>>} */
  const map = new Map();
  for (const [name, decls] of rawDecls.entries()) {
    const props = resolveByName(name);
    const hasInterface = decls.some((d) => d.kind === 'interface');
    if (hasInterface || props.length > 0 || name.endsWith('Props')) {
      map.set(name, props);
    }
  }

  return { map, resolveTypeNode };
}

function parseVueSfc(filePath, vueIfaceCtx, reactIfaceMap) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const vueName = path.basename(filePath, '.vue');
  const stem = vueName.startsWith('J') ? vueName.slice(1) : vueName;
  const script = extractVueScripts(raw);
  const templateMatch = raw.match(/<template\b[^>]*>([\s\S]*)<\/template>/);
  const template = templateMatch ? templateMatch[1] : '';

  const sf = ts.createSourceFile(filePath + '.ts', script, ts.ScriptTarget.ES2022, true);
  /** @type {Array<{ name: string, type: string, required: boolean, default?: string }>} */
  let props = [];
  /** @type {Record<string, string>} */
  const defaults = {};
  /** @type {Array<{ name: string, modelProp: string, type: string }>} */
  const models = [];
  /** @type {string[]} */
  const emits = [];
  /** @type {string[]} */
  const exposed = [];
  /** @type {Set<string>} */
  const declaredSlots = new Set();

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const exprText = node.expression.getText(sf);
      if (exprText === 'withDefaults' && node.arguments.length >= 2) {
        const defObj = node.arguments[1];
        if (ts.isObjectLiteralExpression(defObj)) {
          for (const p of defObj.properties) {
            if (ts.isPropertyAssignment(p) && p.name) {
              const key = p.name.getText(sf).replace(/^['"]|['"]$/g, '');
              defaults[key] = p.initializer.getText(sf);
            }
          }
        }
      }
      if (exprText === 'defineProps') {
        if (node.typeArguments?.length) {
          const resolved = vueIfaceCtx.resolveTypeNode(node.typeArguments[0], sf, new Set());
          if (resolved.length > 0) {
            props = resolved.map((x) => ({ ...x }));
          }
        } else if (node.arguments.length > 0 && ts.isObjectLiteralExpression(node.arguments[0])) {
          for (const p of node.arguments[0].properties) {
            if ((ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && p.name) {
              const name = p.name.getText(sf).replace(/^['"]|['"]$/g, '');
              props.push({ name, type: 'unknown', required: false });
            }
          }
        }
      }
      if (exprText === 'defineModel') {
        const modelProp =
          node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])
            ? node.arguments[0].text
            : 'modelValue';
        const type = node.typeArguments?.[0]
          ? node.typeArguments[0].getText(sf).replace(/\s+/g, ' ').trim()
          : 'unknown';
        models.push({ name: `v-model${modelProp === 'modelValue' ? '' : ':' + modelProp}`, modelProp, type });
      }
      if (exprText === 'defineEmits') {
        if (node.typeArguments?.length && ts.isTypeLiteralNode(node.typeArguments[0])) {
          for (const m of node.typeArguments[0].members) {
            if (ts.isPropertySignature(m) && m.name) {
              emits.push(m.name.getText(sf).replace(/^['"]|['"]$/g, ''));
            } else if (ts.isCallSignatureDeclaration(m) && m.parameters.length > 0) {
              const firstParam = m.parameters[0].type;
              if (firstParam && ts.isLiteralTypeNode(firstParam) && ts.isStringLiteral(firstParam.literal)) {
                emits.push(firstParam.literal.text);
              }
            }
          }
        } else if (node.arguments.length > 0 && ts.isArrayLiteralExpression(node.arguments[0])) {
          for (const el of node.arguments[0].elements) {
            if (ts.isStringLiteral(el)) emits.push(el.text);
          }
        }
      }
      if (exprText === 'defineSlots' && node.typeArguments?.length && ts.isTypeLiteralNode(node.typeArguments[0])) {
        for (const m of node.typeArguments[0].members) {
          if ((ts.isPropertySignature(m) || ts.isMethodSignature(m)) && m.name) {
            declaredSlots.add(m.name.getText(sf).replace(/^['"]|['"]$/g, ''));
          }
        }
      }
      if (exprText === 'defineExpose' && node.arguments.length > 0) {
        const arg0 = node.arguments[0];
        if (ts.isObjectLiteralExpression(arg0)) {
          for (const p of arg0.properties) {
            if (
              (ts.isShorthandPropertyAssignment(p) ||
                ts.isPropertyAssignment(p) ||
                ts.isMethodDeclaration(p) ||
                ts.isGetAccessorDeclaration(p)) &&
              p.name
            ) {
              exposed.push(p.name.getText(sf).replace(/^['"]|['"]$/g, ''));
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  for (const p of props) {
    if (defaults[p.name] !== undefined) {
      p.default = defaults[p.name];
      p.required = false;
    }
  }
  for (const m of models) {
    if (!props.some((p) => p.name === m.modelProp)) {
      props.unshift({ name: m.modelProp, type: m.type, required: false });
    }
    const ev = `update:${m.modelProp}`;
    if (!emits.includes(ev)) emits.unshift(ev);
  }

  // Extract slot names from <slot ...> using two-step tag + attribute parsing
  const slots = new Set();
  for (const m of template.matchAll(/<slot\b([^>]*?)\/?>/g)) {
    const attrs = m[1] || '';
    const staticName = attrs.match(/(?:^|\s)name=["']([^"']+)["']/);
    if (staticName) {
      slots.add(staticName[1]);
      continue;
    }
    const dynName = attrs.match(/(?:^|\s)(?::name|v-bind:name)=["']([^"']+)["']/);
    if (dynName) {
      const expr = dynName[1].trim();
      if (expr.startsWith('`') && expr.endsWith('`')) {
        slots.add(expr.slice(1, -1).replace(/\$\{[^}]+\}/g, '${key}'));
      }
      continue;
    }
    slots.add('default');
  }
  for (const s of declaredSlots) {
    slots.add(s);
  }

  // Extract root j-* CSS classes
  const cssClasses = new Set();
  for (const cm of template.matchAll(/\bj-[a-z0-9_-]+/g)) {
    cssClasses.add(cm[0]);
  }

  const cssSlug = VUE_TO_CSS_SLUG[stem] || stem.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const rawDeps = COMPONENT_CSS_DEPS[cssSlug] || [`${cssSlug}.css`];
  const slotList = [...slots];
  const reactPropsInterface = `${stem}Props`;
  const reactProps = (reactIfaceMap.get(reactPropsInterface) || []).map((p) => ({ ...p }));

  return {
    vueName,
    reactName: stem,
    group: path.basename(path.dirname(filePath)),
    css: {
      foundationImport: 'jenni-core/css/foundation.css',
      componentImport: `jenni-core/css/${cssSlug}.css`,
      standaloneImport: `jenni-core/css/${cssSlug}.css`,
      requiresFoundation: true,
      sourceImports: ['jenni-core/tokens.css', 'jenni-core/base.css', ...rawDeps.map((d) => `jenni-core/components/${d}`)],
      classes: [...cssClasses],
    },
    models,
    props,
    events: emits,
    slots: slotList,
    exposed,
    vue: {
      name: vueName,
      props,
      models,
      events: emits,
      slots: slotList,
      exposed,
    },
    react: {
      name: stem,
      propsInterface: reactPropsInterface,
      props: reactProps,
    },
  };
}

export function generateManifests() {
  const pkgVersion = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/core/package.json'), 'utf8')).version;
  const vueIfaceCtx = collectInterfaceMap([path.join(ROOT, 'packages/vue/src')]);
  const reactIfaceCtx = collectInterfaceMap([path.join(ROOT, 'packages/react/src')]);

  const groups = ['layout', 'forms', 'display', 'overlay'];
  const components = [];

  for (const group of groups) {
    const dir = path.join(ROOT, 'packages/vue/src', group);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith('.vue')) continue;
      components.push(parseVueSfc(path.join(dir, file), vueIfaceCtx, reactIfaceCtx.map));
    }
  }

  // Discover core JS behaviors & exported functions
  const behaviorsDir = path.join(ROOT, 'packages/core/src/behaviors');
  const behaviors = {};
  for (const file of fs.readdirSync(behaviorsDir).sort()) {
    if (!file.endsWith('.js')) continue;
    const content = fs.readFileSync(path.join(behaviorsDir, file), 'utf8');
    const exports = [];
    for (const m of content.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+([A-Za-z0-9_]+)/g)) {
      exports.push(m[1]);
    }
    if (exports.length) {
      behaviors[`jenni-core/behaviors/${file}`] = exports;
    }
  }

  // Discover granular CSS bundles & sizes
  const cssComponentsDir = path.join(ROOT, 'packages/core/src/components');
  const cssModules = fs
    .readdirSync(cssComponentsDir)
    .filter((f) => f.endsWith('.css'))
    .sort()
    .map((f) => {
      const slug = f.replace(/\.css$/, '');
      return {
        slug,
        foundationImport: 'jenni-core/css/foundation.css',
        componentImport: `jenni-core/css/${slug}.css`,
        standaloneImport: `jenni-core/css/${slug}.css`,
        requiresFoundation: true,
        sourceImport: `jenni-core/components/${f}`,
        bytesSource: fs.statSync(path.join(cssComponentsDir, f)).size,
      };
    });

  const manifest = {
    $schema: 'https://ravish-tech.github.io/Jenni/schema/component-manifest-v1.json',
    name: 'Jenni UI Component & Token Manifest',
    version: pkgVersion,
    packages: {
      core: 'jenni-core',
      vue: 'jenni-vue',
      react: 'jenni-react',
    },
    cssImports: {
      fullBundle: 'jenni-core/css',
      foundationImport: 'jenni-core/css/foundation.css',
      componentImportPattern: 'jenni-core/css/<slug>.css',
      requiresFoundation: true,
      note: 'Import jenni-core/css/foundation.css once (tokens + base reset) alongside any granular jenni-core/css/<slug>.css component stylesheets, or import jenni-core/css for the full bundle.',
    },
    cssUsage: {
      fullBundle: "import 'jenni-core/css';",
      granularFoundation: "import 'jenni-core/css/foundation.css';",
      granularComponentPattern: "import 'jenni-core/css/<slug>.css';",
      requiresFoundation: true,
      note: "Pair 'jenni-core/css/foundation.css' with individual 'jenni-core/css/<slug>.css' imports.",
    },
    composablesAndHooks: {
      vue: ['useThemeTokens', 'useShortcut', 'useShortcuts', 'provideIcons', 'toast', 'dismissToast'],
      react: ['useThemeTokens', 'useShortcut', 'useShortcuts', 'IconProvider', 'toast', 'dismissToast'],
      core: [
        'getThemeTokens',
        'getTerminalTheme',
        'getXtermTheme',
        'getSyntaxTheme',
        'getChartPalette',
        'resolveCssColor',
        'onThemeChange',
        'getEntityHue',
        'getEntityColorVars',
        'createShortcutRegistry',
        'registerShortcut',
        'formatShortcut',
        'registerIcons',
        'resolveIcon',
        'createVirtualizer',
      ],
    },
    componentCount: components.length,
    tokens: extractTokens(),
    cssModules,
    behaviors,
    components,
    reactPropsInterfaces: Object.fromEntries(reactIfaceCtx.map),
  };

  const json = JSON.stringify(manifest, null, 2) + '\n';
  fs.writeFileSync(path.join(ROOT, 'COMPONENT_MANIFEST.json'), json, 'utf8');
  fs.writeFileSync(path.join(ROOT, 'packages/core/manifest.json'), json, 'utf8');
  fs.writeFileSync(path.join(ROOT, 'packages/vue/manifest.json'), json, 'utf8');
  fs.writeFileSync(path.join(ROOT, 'packages/react/manifest.json'), json, 'utf8');

  // Emit bundled AGENTS.md + public web agent files (llms.txt, llms-full.txt, COMPONENT_MANIFEST.json)
  const skillMdPath = path.join(ROOT, '.agents/skills/jenni-ui/SKILL.md');
  const recipesMdPath = path.join(ROOT, '.agents/skills/jenni-ui/references/RECIPES.md');
  if (fs.existsSync(skillMdPath) && fs.existsSync(recipesMdPath)) {
    const skillBody = fs.readFileSync(skillMdPath, 'utf8').replace(/^---[\s\S]*?---\s*/, '');
    const recipesBody = fs.readFileSync(recipesMdPath, 'utf8');

    const compRows = components.map((c) => {
      const propNames = c.props.map((p) => p.name).join(', ') || '—';
      const slotNames = c.slots.join(', ') || '—';
      return `| \`${c.vueName}\` / \`${c.reactName}\` | ${c.group} | \`${c.css.componentImport}\` | ${propNames} | ${slotNames} |`;
    });

    const catalogTable = [
      '## Complete Component Index (AST-Generated)',
      '',
      '| Vue / React | Group | Granular CSS | Props | Slots |',
      '|---|---|---|---|---|',
      ...compRows,
      '',
    ].join('\n');

    const bundledAgentsMd = [
      skillBody.trim(),
      '',
      '---',
      '',
      recipesBody.trim(),
      '',
      '---',
      '',
      catalogTable,
    ].join('\n');

    fs.writeFileSync(path.join(ROOT, 'packages/core/AGENTS.md'), bundledAgentsMd, 'utf8');
    fs.writeFileSync(path.join(ROOT, 'packages/vue/AGENTS.md'), bundledAgentsMd, 'utf8');
    fs.writeFileSync(path.join(ROOT, 'packages/react/AGENTS.md'), bundledAgentsMd, 'utf8');

    const publicDir = path.join(ROOT, 'apps/playground/public');
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'COMPONENT_MANIFEST.json'), json, 'utf8');

    const llmsTxt = [
      '# Jenni UI Framework',
      '',
      '> Web UI framework driven by beauty, simplicity, and performance (`jenni-core`, `jenni-vue`, `jenni-react`) — built in loving memory of Jenni.',
      '',
      '## Key Principles for AI Agents',
      '- **Never guess props:** Inspect `manifest.json` (`node_modules/jenni-core/manifest.json` or the URL below) before using unfamiliar components.',
      '- **Spatial precision:** Use `Stack`, `Inline`, `Grid`, and `Page` with semantic `gap` tokens (`inline` 6px, `related` 8px, `item` 12px, `field` 16px, `group` 24px, `section` 40px) — never arbitrary pixel gaps.',
      '- **Weighted motion, zero bounce:** 0% spring overshoot, 0 `!important`, OKLCH `light-dark()` tokens only (`var(--j-*)`), and `0.65x–1.15x` `--j-density` scaling.',
      '- **Verified actions:** Use `toast.promise(fn, { loading, verify, success, error })` — never show optimistic success before verifying the result.',
      '- **Respectful naming:** Keep the name strictly to package identifiers (`jenni-core`, `jenni-vue`, `jenni-react`) and top-level dedication; never use it casually in prose or mock brand text.',
      '',
      '## Agent Documentation & Machine-Readable References',
      '- [Full Agent Guide, Recipes & Component Catalog](https://ravish-tech.github.io/Jenni/llms-full.txt): Philosophy, spatial rules, Vue 3 & React 19 patterns, and all 106 components.',
      '- [Component & Token AST Manifest (JSON)](https://ravish-tech.github.io/Jenni/COMPONENT_MANIFEST.json): Exact props, types, defaults, v-models, events, slots, CSS slugs, and 194 tokens.',
      '- [Interactive Design Lab](https://ravish-tech.github.io/Jenni/): Live demos, theme/density controls, and multi-tier benchmarks.',
      '- [GitHub Repository](https://github.com/ravish-tech/Jenni): Source code, releases, and `.agents/skills/jenni-ui/SKILL.md`.',
      '',
    ].join('\n');

    const tokenLines = manifest.tokens.map((t) => `- \`${t.name}\`: \`${t.value}\``).join('\n');
    const llmsFullTxt = [
      bundledAgentsMd.trim(),
      '',
      '---',
      '',
      `## Design Tokens (${manifest.tokens.length} CSS Custom Properties)`,
      '',
      tokenLines,
      '',
    ].join('\n');

    fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsTxt, 'utf8');
    fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf8');
  }

  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = generateManifests();
  console.log(`✅ Generated API manifest (${m.componentCount} components, ${m.tokens.length} CSS tokens)`);
}
