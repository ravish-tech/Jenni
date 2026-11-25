import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { computeSparkline } from '../packages/core/src/behaviors/sparkline.js';
import { treeKeydown } from '../packages/core/src/behaviors/tree-view.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('jenni-core/behaviors/*.js TypeScript resolution', () => {
  test('resolves both .js and extensionless behavior subpaths to dist/behaviors/*.d.ts', () => {
    const compilerOptions = {
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    };
    const containingFile = path.join(ROOT, 'apps/playground/src/main.ts');

    for (const spec of [
      'jenni-core/behaviors/theme.js',
      'jenni-core/behaviors/theme',
      'jenni-core/behaviors/shortcuts.js',
      'jenni-core/behaviors/toast.js',
      'jenni-core/behaviors/sparkline.js',
    ]) {
      const res = ts.resolveModuleName(spec, containingFile, compilerOptions, ts.sys);
      assert.ok(res.resolvedModule, `Expected ${spec} to resolve`);
      assert.ok(
        res.resolvedModule.resolvedFileName.endsWith('.d.ts'),
        `Expected ${spec} to resolve to a .d.ts file, got ${res.resolvedModule.resolvedFileName}`,
      );
    }
  });
});

describe('sparkline.js — monotone cubic & bar/area geometry', () => {
  test('handles empty, single-value, and NaN/Infinity series cleanly', () => {
    const empty = computeSparkline([]);
    assert.equal(empty.linePath, '');
    assert.equal(empty.points.length, 0);

    const single = computeSparkline([42, Number.NaN, Number.POSITIVE_INFINITY], {
      width: 80,
      height: 24,
      variant: 'bar',
    });
    assert.equal(single.points.length, 1);
    assert.equal(single.bars.length, 1);
    assert.equal(single.minValue, 42);
    assert.equal(single.maxValue, 42);
  });

  test('computes smooth Fritsch–Carlson monotone cubic spline without overshoot', () => {
    const series = [10, 10, 80, 80, 20, 20];
    const geom = computeSparkline(series, {
      width: 100,
      height: 30,
      padding: 2,
      smooth: true,
      variant: 'area',
    });
    assert.match(geom.linePath, /^M /);
    assert.match(geom.linePath, / C /);
    assert.match(geom.areaPath, / Z$/);
    assert.equal(geom.minValue, 10);
    assert.equal(geom.maxValue, 80);

    const ys = geom.points.map((p) => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Every cubic control point Y must stay strictly within [minY, maxY] (0% overshoot)
    const cubicMatches = [...geom.linePath.matchAll(/C\s+([\d.-]+)\s+([\d.-]+),\s*([\d.-]+)\s+([\d.-]+),\s*([\d.-]+)\s+([\d.-]+)/g)];
    assert.equal(cubicMatches.length, series.length - 1);
    for (const m of cubicMatches) {
      const cp1Y = Number(m[2]);
      const cp2Y = Number(m[4]);
      const endY = Number(m[6]);
      assert.ok(cp1Y >= minY - 1e-6 && cp1Y <= maxY + 1e-6, `cp1Y=${cp1Y} out of [${minY}, ${maxY}]`);
      assert.ok(cp2Y >= minY - 1e-6 && cp2Y <= maxY + 1e-6, `cp2Y=${cp2Y} out of [${minY}, ${maxY}]`);
      assert.ok(endY >= minY - 1e-6 && endY <= maxY + 1e-6);
    }
  });
});

describe('tree-view.js — lazy branch keyboard expansion', () => {
  test('dispatches expand on ArrowRight for aria-expanded="false" lazy node before child group exists', () => {
    const fakeItem = {
      dataset: { value: 'remote-src', lazy: '' },
      getAttribute(attr) {
        if (attr === 'aria-expanded') return 'false';
        if (attr === 'aria-disabled' || attr === 'aria-busy') return null;
        return null;
      },
      hasAttribute(attr) {
        return attr === 'aria-expanded' || attr === 'data-lazy';
      },
      querySelector() {
        return null; // no <ul role="group"> yet!
      },
      focus() {},
    };

    const fakeTree = {
      querySelectorAll(sel) {
        if (sel === '[role="treeitem"]') return [fakeItem];
        return [];
      },
    };
    fakeItem.getAttribute = (attr) => {
      if (attr === 'role') return 'treeitem';
      if (attr === 'aria-expanded') return 'false';
      return null;
    };
    fakeItem.closest = (sel) => (sel === '[role="tree"]' ? fakeTree : sel === '[role="treeitem"]' ? fakeItem : null);

    let prevented = false;
    const res = treeKeydown(fakeTree, {
      key: 'ArrowRight',
      target: {
        closest(sel) {
          return sel === '[role="treeitem"]' ? fakeItem : null;
        },
      },
      preventDefault() {
        prevented = true;
      },
    });

    assert.equal(prevented, true);
    assert.deepEqual(res, { action: 'expand', item: fakeItem });
  });

  test('moves focus into first child inside <ul role="group"> on ArrowRight when already expanded in Node (SSR safe)', () => {
    assert.equal(typeof globalThis.HTMLElement, 'undefined');

    let focusedChild = false;

    const fakeTree = {
      querySelectorAll(sel) {
        if (sel === '[role="treeitem"]') return [parentItem, childItem];
        return [];
      },
    };

    const parentNode = {
      parentElement: fakeTree,
      hidden: false,
      classList: { contains: (cls) => cls === 'j-tree__node' },
      hasAttribute: () => false,
      querySelector(sel) {
        return sel === ':scope > [role="treeitem"]' ? parentItem : null;
      },
      querySelectorAll(sel) {
        return sel === '[role="treeitem"]' ? [parentItem, childItem] : [];
      },
    };

    const groupUl = {
      parentElement: parentNode,
      hidden: false,
      classList: { contains: (cls) => cls === 'j-tree__group' },
      hasAttribute: () => false,
      getAttribute: (attr) => (attr === 'role' ? 'group' : null),
    };

    const childNode = {
      parentElement: groupUl,
      hidden: false,
      classList: { contains: (cls) => cls === 'j-tree__node' },
      hasAttribute: () => false,
      querySelector(sel) {
        return sel === ':scope > [role="treeitem"]' ? childItem : null;
      },
    };

    const parentItem = {
      parentElement: parentNode,
      dataset: { value: 'src' },
      tabIndex: 0,
      getAttribute(attr) {
        if (attr === 'role') return 'treeitem';
        if (attr === 'aria-expanded') return 'true';
        return null;
      },
      hasAttribute(attr) {
        return attr === 'aria-expanded';
      },
      closest(sel) {
        if (sel === '[role="tree"]') return fakeTree;
        if (sel === '[role="treeitem"]') return parentItem;
        if (sel === '.j-tree__node') return parentNode;
        return null;
      },
      focus() {},
    };

    const childItem = {
      parentElement: childNode,
      dataset: { value: 'src/index.ts' },
      tabIndex: -1,
      getAttribute(attr) {
        if (attr === 'role') return 'treeitem';
        return null;
      },
      hasAttribute() {
        return false;
      },
      closest(sel) {
        if (sel === '[role="tree"]') return fakeTree;
        if (sel === '[role="treeitem"]') return childItem;
        if (sel === '.j-tree__node') return childNode;
        return null;
      },
      focus() {
        focusedChild = true;
      },
    };

    let prevented = false;
    const res = treeKeydown(fakeTree, {
      key: 'ArrowRight',
      target: parentItem,
      preventDefault() {
        prevented = true;
      },
    });

    assert.equal(prevented, true);
    assert.equal(focusedChild, true);
    assert.equal(parentItem.tabIndex, -1);
    assert.equal(childItem.tabIndex, 0);
    assert.deepEqual(res, { action: 'focus', item: childItem });
  });
});

describe('COMPONENT_MANIFEST.json — v0.3.0 components & prop contracts', () => {
  test('includes SplitButton, DropdownSub, Sparkline, StatusBarSeparator, and enriched prop contracts', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'COMPONENT_MANIFEST.json'), 'utf8'));
    const byVue = new Map(manifest.components.map((c) => [c.vueName, c]));

    assert.ok(byVue.has('JSplitButton'), 'Missing JSplitButton');
    assert.ok(byVue.has('JDropdownSub'), 'Missing JDropdownSub');
    assert.ok(byVue.has('JSparkline'), 'Missing JSparkline');
    assert.ok(byVue.has('JStatusBarSeparator'), 'Missing JStatusBarSeparator');

    const inputProps = new Set(byVue.get('JInput').props.map((p) => p.name));
    assert.ok(inputProps.has('clearable'), 'JInput missing clearable prop');

    const badgeProps = new Set(byVue.get('JBadge').props.map((p) => p.name));
    assert.ok(badgeProps.has('removable'), 'JBadge missing removable prop');

    const cardProps = new Set(byVue.get('JCard').props.map((p) => p.name));
    assert.ok(cardProps.has('flush'), 'JCard missing flush prop');

    const dialogProps = new Set(byVue.get('JDialog').props.map((p) => p.name));
    assert.ok(dialogProps.has('flush'), 'JDialog missing flush prop');

    const comboProps = new Set(byVue.get('JCombobox').props.map((p) => p.name));
    assert.ok(comboProps.has('creatable') && comboProps.has('loading') && comboProps.has('allowCustomValue'), 'JCombobox missing free-text/async props');

    const treeProps = new Set(byVue.get('JTreeView').props.map((p) => p.name));
    assert.ok(treeProps.has('loadChildren'), 'JTreeView missing loadChildren prop');

    const docTabsSlots = new Set(byVue.get('JDocTabs').slots);
    assert.ok(docTabsSlots.has('tab') && docTabsSlots.has('label'), 'JDocTabs missing tab/label slots');
  });
});
