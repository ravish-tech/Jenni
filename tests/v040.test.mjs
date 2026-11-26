import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { BUILTIN_ICONS, resolveIcon } from '../packages/core/src/behaviors/icon.js';
import { tokenizeCodeLines, normalizeCodeLanguage } from '../packages/core/src/behaviors/code-block.js';
import { getVisibleRovingTargets } from '../packages/core/src/behaviors/table.js';
import { createSplitHandle } from '../packages/core/src/behaviors/split-handle.js';
import { createTabStrip, getTabStripElements, initTabStrips } from '../packages/core/src/behaviors/tab-strip.js';
import { createMenubar, initMenubars } from '../packages/core/src/behaviors/menubar.js';
import {
  bindDialogDefaultAction,
  resolveDialogDefaultButton,
  focusDialogDefaultAction,
} from '../packages/core/src/behaviors/dialog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function walkFiles(dir, ext) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

describe('ravmon Item #1 — JIcon child sizing, bumped button/toggle icon tokens & --j-icon-scale', () => {
  test('tokens.css and icon.css define --j-icon-scale and 130+ 24x24 HD icons', () => {
    const tokens = read('packages/core/src/tokens.css');
    const iconCss = read('packages/core/src/components/icon.css');
    assert.match(tokens, /--j-icon-scale:\s*1\b/);
    assert.match(iconCss, /--j-icon-scale/);
    assert.match(iconCss, /shape-rendering:\s*geometricPrecision/);

    const names = Object.keys(BUILTIN_ICONS);
    assert.ok(names.length >= 130, `Expected >= 130 built-in icons, got ${names.length}`);
    for (const req of ['dock-left', 'sidebar', 'grip-vertical', 'sun', 'moon', 'loader', 'database', 'file-text']) {
      const def = resolveIcon(req);
      assert.ok(def && typeof def === 'object' && typeof def.body === 'string', `Missing built-in icon "${req}"`);
      assert.equal(def.viewBox, '0 0 24 24');
    }
  });

  test('button, toggle, badge, breadcrumb, pagination, empty-state, combobox & statusbar size .j-icon:not([data-size]) while alert.css does not misuse --_icon as size', () => {
    const buttonCss = read('packages/core/src/components/button.css');
    const toggleCss = read('packages/core/src/components/toggle.css');

    assert.match(buttonCss, /--_icon:\s*18px/);
    assert.match(buttonCss, /\[data-size="sm"\][\s\S]*?--_icon:\s*16px/);
    assert.match(buttonCss, /\[data-size="lg"\][\s\S]*?--_icon:\s*20px/);
    assert.match(buttonCss, /& > \.j-icon:not\(\[data-size\]\)/);

    assert.match(toggleCss, /--_icon:\s*18px/);
    assert.match(toggleCss, /\[data-size="sm"\][\s\S]*?--_icon:\s*16px/);
    assert.match(toggleCss, /\[data-size="lg"\][\s\S]*?--_icon:\s*20px/);
    assert.match(toggleCss, /& > \.j-icon:not\(\[data-size\]\)/);

    for (const slug of ['badge', 'breadcrumb', 'pagination', 'empty-state', 'combobox', 'statusbar']) {
      const css = read(`packages/core/src/components/${slug}.css`);
      assert.match(css, /\.j-icon:not\(\[data-size\]\)/, `Expected .j-icon:not([data-size]) rule in ${slug}.css`);
    }

    const alertCss = read('packages/core/src/components/alert.css');
    assert.doesNotMatch(alertCss, /--_size:\s*var\(--_icon\)/);
  });
});

describe('ravmon Item #2 — Popover panels keep flex-direction: column during exit fade', () => {
  test('menu, combobox, time-picker, menubar, and tab-strip set flex-direction: column on base rule, never only inside :popover-open', () => {
    for (const slug of ['menu', 'combobox', 'time-picker', 'menubar', 'tab-strip']) {
      const css = read(`packages/core/src/components/${slug}.css`);
      assert.match(css, /flex-direction:\s*column/, `Expected flex-direction: column in ${slug}.css`);
      for (const m of css.matchAll(/:popover-open\s*\{([^}]*)\}/g)) {
        assert.doesNotMatch(
          m[1],
          /flex-direction\s*:/,
          `${slug}.css sets flex-direction inside :popover-open, which flips layout during exit fade`,
        );
      }
    }
  });
});

describe('ravmon Item #3 — JTabStrip / TabStrip (Chrome-style tab strip)', () => {
  test('exports tab-strip behavior helpers and implements titlebar y=0 hit target + active bg token', () => {
    assert.equal(typeof createTabStrip, 'function');
    assert.equal(typeof getTabStripElements, 'function');
    assert.equal(typeof initTabStrips, 'function');

    const css = read('packages/core/src/components/tab-strip.css');
    assert.match(css, /--j-tab-strip-active-bg/);
    assert.match(css, /--j-tab-strip-gap/);
    assert.match(css, /--ct-gap/);
    assert.match(css, /app-region:\s*drag/);
    assert.match(css, /app-region:\s*no-drag/);
  });
});

describe('ravmon Item #4 & #5 — JSidebarLayout, JSidebarToggle, .j-resize-handle & JSplitHandle', () => {
  test('JSidebarLayout computes width relative to layout bounding rect (not clientX from x=0) and resizable.css exposes standalone .j-resize-handle', () => {
    const vueSrc = read('packages/vue/src/layout/JSidebarLayout.vue');
    const reactSrc = read('packages/react/src/layout/SidebarLayout.tsx');
    assert.match(vueSrc, /getBoundingClientRect\(\)/);
    assert.match(vueSrc, /rect\.left/);
    assert.match(reactSrc, /getBoundingClientRect\(\)/);
    assert.match(reactSrc, /rect\.left/);

    const resizableCss = read('packages/core/src/components/resizable.css');
    assert.match(resizableCss, /\.j-resize-handle/);
    assert.match(resizableCss, /data-with-grip/);
    assert.match(resizableCss, /data-dragging/);
  });

  test('createSplitHandle steps via ArrowRight and Shift+ArrowRight keyboard events', () => {
    const listeners = new Map();
    const attrs = new Map();
    const el = {
      dataset: {},
      addEventListener(type, fn) {
        listeners.set(type, fn);
      },
      removeEventListener(type) {
        listeners.delete(type);
      },
      setAttribute(k, v) {
        attrs.set(k, v);
      },
      getAttribute(k) {
        return attrs.get(k) ?? null;
      },
      hasAttribute(k) {
        return attrs.has(k);
      },
      removeAttribute(k) {
        attrs.delete(k);
      },
    };

    const payloads = [];
    const handle = createSplitHandle(el, {
      orientation: 'horizontal',
      step: 16,
      largeStep: 64,
      onDrag: (p) => payloads.push(p),
    });

    const keydown = listeners.get('keydown');
    assert.equal(typeof keydown, 'function');

    let prevented = false;
    keydown({
      key: 'ArrowRight',
      shiftKey: false,
      preventDefault() {
        prevented = true;
      },
    });
    assert.equal(prevented, true);
    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].delta, 16);
    assert.equal(payloads[0].totalDelta, 16);
    assert.equal(payloads[0].source, 'keyboard');

    keydown({
      key: 'ArrowLeft',
      shiftKey: true,
      preventDefault() {},
    });
    assert.equal(payloads.length, 2);
    assert.equal(payloads[1].delta, -64);

    handle.destroy();
  });
});

describe('ravmon Item #6 — JScrollArea dynamic overscroll wheel chaining', () => {
  test('scroll-area.css applies overscroll-behavior: contain only when overflowing or explicitly requested', () => {
    const css = read('packages/core/src/components/scroll-area.css');
    const js = read('packages/core/src/behaviors/scroll-area.js');

    const baseMatch = css.match(/:where\(\.j-scroll-area\)\s*\{([^}]*)\}/);
    assert.ok(baseMatch, 'Expected base :where(.j-scroll-area) rule');
    assert.doesNotMatch(
      baseMatch[1],
      /overscroll-behavior/,
      'Base .j-scroll-area must not unconditionally trap wheel events with overscroll-behavior: contain',
    );
    assert.match(css, /\[data-overflows-y\]/);
    assert.match(css, /\[data-overflows-x\]/);
    assert.match(js, /overflowsY/);
    assert.match(js, /overflowsX/);
  });
});

describe('ravmon Item #7 & #8 — Clearable JSelect and JDialog default Enter action', () => {
  test('select.css, JSelect.vue, and Select.tsx preserve native <select> and wire clearable button', () => {
    const css = read('packages/core/src/components/select.css');
    const vue = read('packages/vue/src/forms/JSelect.vue');
    const react = read('packages/react/src/forms/Select.tsx');
    assert.match(css, /\.j-select__clear/);
    assert.match(vue, /<select\b/);
    assert.match(vue, /clearable/);
    assert.match(vue, /emptyValue/);
    assert.match(react, /<select\b/);
    assert.match(react, /clearable/);
    assert.match(react, /emptyValue/);
  });

  test('dialog.js exports default action helpers and button/dialog components wire default & defaultAction', () => {
    assert.equal(typeof bindDialogDefaultAction, 'function');
    assert.equal(typeof resolveDialogDefaultButton, 'function');
    assert.equal(typeof focusDialogDefaultAction, 'function');

    const dialogJs = read('packages/core/src/behaviors/dialog.js');
    assert.match(dialogJs, /isComposing/);
    assert.match(dialogJs, /shiftKey/);
    assert.match(dialogJs, /textarea,\s*select/);
    assert.match(dialogJs, /data-default-action/);

    assert.match(read('packages/vue/src/forms/JButton.vue'), /data-default-action/);
    assert.match(read('packages/react/src/forms/Button.tsx'), /data-default-action/);
    assert.match(read('packages/vue/src/overlay/JDialog.vue'), /bindDialogDefaultAction/);
    assert.match(read('packages/react/src/overlay/Dialog.tsx'), /bindDialogDefaultAction/);
  });
});

describe('ravmon Item #9, #10 & #11 — Sticky PageHeader, Collapsible TableSection & StatusBar options', () => {
  test('page.css, JPageHeader.vue, and Page.tsx use IntersectionObserver sentinel and [data-stuck] hairline', () => {
    const pageCss = read('packages/core/src/components/page.css');
    const vueHeader = read('packages/vue/src/layout/JPageHeader.vue');
    const reactPage = read('packages/react/src/layout/Page.tsx');

    assert.match(pageCss, /\.j-page-header\[data-sticky\]/);
    assert.match(pageCss, /\[data-stuck\]/);
    assert.match(vueHeader, /IntersectionObserver/);
    assert.doesNotMatch(vueHeader, /addEventListener\(\s*['"]scroll['"]/);
    assert.match(reactPage, /IntersectionObserver/);
    assert.doesNotMatch(reactPage, /addEventListener\(\s*['"]scroll['"]/);
  });

  test('table.js getVisibleRovingTargets skips hidden rows inside collapsed sections', () => {
    const makeRow = ({ hidden = false, section = false } = {}) => {
      const btn = { tagName: 'BUTTON', getAttribute: () => null };
      return {
        hidden,
        hasAttribute: (a) => (a === 'hidden' ? hidden : a === 'tabindex' && !section),
        getAttribute: (a) => (a === 'tabindex' && !section ? '0' : null),
        classList: { contains: (c) => section && c === 'j-table__section-row' },
        querySelector: (sel) => (section && sel.includes('.j-table__section-btn') ? btn : null),
      };
    };

    const sec1 = makeRow({ section: true });
    const row1 = makeRow({ hidden: false });
    const sec2 = makeRow({ section: true });
    const hiddenRow = makeRow({ hidden: true });
    const fakeTable = {
      tBodies: [
        { hidden: false, rows: [sec1, row1] },
        { hidden: false, rows: [sec2, hiddenRow] },
      ],
    };

    const stops = getVisibleRovingTargets(fakeTable);
    assert.equal(stops.length, 3, 'Expected collapsed hiddenRow to be excluded from roving targets');
  });

  test('statusbar.css uses --j-statusbar-h, --j-text-xs/--j-text-sm tokens (not 11px), size="lg" (30px), and data-mono', () => {
    const css = read('packages/core/src/components/statusbar.css');
    assert.doesNotMatch(css, /font-size:\s*11px/);
    assert.match(css, /--j-statusbar-h/);
    assert.match(css, /--j-text-xs/);
    assert.match(css, /--j-text-sm/);
    assert.match(css, /--j-font-mono/);
    assert.match(css, /30px/);
  });
});

describe('Wave 1 Flagship Components, Code Tokenizer, Manifest & Framework Hygiene', () => {
  test('code-block.js tokenizes TypeScript, SQL, and unified diff lines accurately', () => {
    assert.equal(normalizeCodeLanguage('typescript'), 'ts');
    assert.equal(normalizeCodeLanguage('SQL'), 'sql');
    assert.equal(typeof createMenubar, 'function');
    assert.equal(typeof initMenubars, 'function');

    const diffLines = tokenizeCodeLines(
      '@@ -1,2 +1,2 @@\n-const oldVal = 1;\n+const newVal = 2;',
      'ts',
      { diff: true },
    );
    assert.equal(diffLines.length, 3);
    assert.equal(diffLines[0].diff, 'hunk');
    assert.equal(diffLines[1].diff, 'del');
    assert.equal(diffLines[2].diff, 'add');
    assert.ok(diffLines[2].tokens.some((t) => t.type === 'keyword' && t.text === 'const'));
  });

  test('jenni-core/behaviors/*.js TypeScript resolution covers all new v0.4.0 behavior modules', () => {
    const compilerOptions = {
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    };
    const containingFile = path.join(ROOT, 'apps/playground/src/main.ts');

    for (const spec of [
      'jenni-core/behaviors/code-block.js',
      'jenni-core/behaviors/menubar.js',
      'jenni-core/behaviors/split-handle.js',
      'jenni-core/behaviors/tab-strip.js',
      'jenni-core/behaviors/dialog.js',
      'jenni-core/behaviors/table.js',
    ]) {
      const res = ts.resolveModuleName(spec, containingFile, compilerOptions, ts.sys);
      assert.ok(res.resolvedModule, `Expected ${spec} to resolve`);
      assert.ok(
        res.resolvedModule.resolvedFileName.endsWith('.d.ts'),
        `Expected ${spec} to resolve to .d.ts, got ${res.resolvedModule.resolvedFileName}`,
      );
    }
  });

  test('COMPONENT_MANIFEST.json, AGENTS.md, llms.txt & llms-full.txt include all v0.4.0 components and valid tokens', () => {
    const manifest = JSON.parse(read('COMPONENT_MANIFEST.json'));
    const byReact = new Map(manifest.components.map((c) => [c.reactName, c]));

    for (const name of [
      'TabStrip',
      'SidebarLayout',
      'SidebarToggle',
      'SplitHandle',
      'TableSection',
      'ProgressRing',
      'Stat',
      'StatGroup',
      'Timeline',
      'TimelineItem',
      'DescriptionList',
      'DescriptionItem',
      'Banner',
      'CodeBlock',
      'CopyButton',
      'AlertDialog',
      'Menubar',
      'MenubarMenu',
    ]) {
      const entry = byReact.get(name);
      assert.ok(entry, `Missing ${name} in COMPONENT_MANIFEST.json`);
      assert.ok(
        fs.existsSync(path.join(ROOT, 'packages/core/dist/css', path.basename(entry.css.componentImport))),
        `Missing built granular CSS for ${name}: ${entry.css.componentImport}`,
      );
    }

    const llmsFull = read('apps/playground/public/llms-full.txt');
    assert.doesNotMatch(llmsFull, /undefined/);
    assert.match(llmsFull, /--j-statusbar-h/);
    assert.match(llmsFull, /--j-icon-scale/);
    assert.ok(fs.existsSync(path.join(ROOT, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(ROOT, 'llms.txt')));
  });

  test('enforces 0 !important in CSS, 0 <style> in jenni-vue, and 0 kebab-case SVG attrs in jenni-react', () => {
    for (const file of walkFiles(path.join(ROOT, 'packages/core/src'), '.css')) {
      const clean = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      assert.doesNotMatch(clean, /!important/, `Forbidden !important in ${file}`);
    }
    for (const file of walkFiles(path.join(ROOT, 'packages/vue/src'), '.vue')) {
      const src = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(src, /<style\b/i, `Forbidden <style> block in ${file}`);
    }
    for (const file of walkFiles(path.join(ROOT, 'packages/react/src'), '.tsx')) {
      const src = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(
        src,
        /\b(stroke-width|stroke-linecap|stroke-linejoin|stroke-dasharray|stroke-dashoffset|fill-rule|clip-rule|shape-rendering)=/,
        `Forbidden kebab-case JSX SVG attribute in ${file}`,
      );
    }
  });
});
