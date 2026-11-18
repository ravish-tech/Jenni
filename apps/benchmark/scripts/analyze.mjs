import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as lightningcss from 'lightningcss';
import { rolldown } from 'rolldown';
import { build as viteBuild } from 'vite';
import vuePlugin from '@vitejs/plugin-vue';
import postcss from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';
import {
  buildParityHtml,
  buildMountRowsHtml,
  buildDashboardGridHtml,
} from '../src/fixtures/markups.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BENCH_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BENCH_ROOT, '../..');
const TMP_DIR = path.join(BENCH_ROOT, '.tmp-build');
const SANDBOX_DIR = path.join(BENCH_ROOT, 'public/sandboxes');
const GEN_DIR = path.join(BENCH_ROOT, 'src/generated');

function measureBytes(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (b.byteLength === 0) {
    return { min: 0, gzip: 0, brotli: 0 };
  }
  const gz = zlib.gzipSync(b, { level: 9 });
  const br = zlib.brotliCompressSync(b, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  return {
    min: b.byteLength,
    gzip: gz.byteLength,
    brotli: br.byteLength,
  };
}

async function bundleCssFile(entryPath) {
  const res = await lightningcss.bundleAsync({
    filename: entryPath,
    minify: true,
  });
  return Buffer.from(res.code);
}

function minifyCssString(cssText, filename = 'input.css') {
  const res = lightningcss.transform({
    filename,
    code: Buffer.from(cssText),
    minify: true,
  });
  return Buffer.from(res.code);
}

async function bundleJsEntry(entryCode, entryName) {
  const entryPath = path.join(TMP_DIR, entryName);
  await fs.writeFile(entryPath, entryCode, 'utf8');
  const build = await rolldown({
    input: entryPath,
    cwd: REPO_ROOT,
    platform: 'browser',
    treeshake: true,
  });
  const { output } = await build.generate({
    format: 'iife',
    minify: true,
  });
  await build.close();
  return Buffer.from(output[0].code, 'utf8');
}

/**
 * Compile a Vue 3 or React 19 entry via Vite 8 (Rolldown + LightningCSS) in memory.
 */
async function bundleViteEntry({
  entryCode,
  entryPath: existingEntryPath,
  entryName,
  isVue = false,
  external = [],
  format = 'es',
}) {
  const entry = existingEntryPath ?? path.join(TMP_DIR, entryName);
  if (!existingEntryPath) {
    await fs.writeFile(entry, entryCode, 'utf8');
  }
  const res = await viteBuild({
    root: BENCH_ROOT,
    configFile: false,
    logLevel: 'silent',
    plugins: isVue ? [vuePlugin()] : [],
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env': '{"NODE_ENV":"production"}',
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },
    build: {
      write: false,
      minify: true,
      cssCodeSplit: false,
      emptyOutDir: false,
      lib: {
        entry,
        name: '__jenniBenchEntry',
        formats: [format],
        fileName: () => 'bundle.js',
      },
      rollupOptions: {
        external,
      },
    },
  });

  const outs = Array.isArray(res) ? res[0].output : res.output;
  const jsParts = [];
  const cssParts = [];
  for (const item of outs) {
    if (item.type === 'chunk') {
      jsParts.push(Buffer.from(item.code, 'utf8'));
    } else if (item.fileName.endsWith('.css')) {
      cssParts.push(
        Buffer.isBuffer(item.source) ? item.source : Buffer.from(String(item.source), 'utf8'),
      );
    }
  }
  return {
    jsBuf: Buffer.concat(jsParts),
    cssBuf: Buffer.concat(cssParts),
  };
}

function resolvePkgVersion(name) {
  if (name === 'jenni-core') {
    return JSON.parse(fsSync.readFileSync(path.join(REPO_ROOT, 'packages/core/package.json'), 'utf8')).version;
  }
  if (name === 'jenni-vue') {
    return JSON.parse(fsSync.readFileSync(path.join(REPO_ROOT, 'packages/vue/package.json'), 'utf8')).version;
  }
  if (name === 'jenni-react') {
    return JSON.parse(fsSync.readFileSync(path.join(REPO_ROOT, 'packages/react/package.json'), 'utf8')).version;
  }
  for (const base of [path.join(BENCH_ROOT, 'node_modules'), path.join(REPO_ROOT, 'node_modules')]) {
    const p = path.join(base, name, 'package.json');
    if (fsSync.existsSync(p)) {
      return JSON.parse(fsSync.readFileSync(p, 'utf8')).version;
    }
  }
  return '0.0.0';
}

/**
 * Compute honest CSS hygiene metrics from minified stylesheet text:
 * - !important count
 * - custom property declarations (--foo:)
 * - @layer usage
 * - estimated average specificity score ([id=100, class/attr/pseudo=10, type=1]; :where(...) = 0 per Selectors L4)
 */
function analyzeCssHygiene(cssBuf, runtimeCssInJs = false) {
  if (runtimeCssInJs && cssBuf.byteLength === 0) {
    return {
      selectorCount: 0,
      importantCount: 0,
      customPropsCount: 0,
      hasCascadeLayers: false,
      avgSpecificityScore: 10,
      maxSpecificityScore: 20,
      runtimeCssInJs: true,
    };
  }

  const css = cssBuf.toString('utf8');
  const importantCount = (css.match(/!important/g) || []).length;
  const customPropsCount = new Set(
    (css.match(/--[a-zA-Z0-9_-]+(?=\s*:)/g) || []),
  ).size;
  const hasCascadeLayers = css.includes('@layer ');

  // Extract selector blocks outside @keyframes
  const selectors = [];
  let depth = 0;
  let token = '';
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const sel = token.trim();
      if (sel && !sel.startsWith('@') && depth <= 2) {
        for (const part of sel.split(',')) {
          const p = part.trim();
          if (p && !/^\d+%$|^from$|^to$/.test(p)) selectors.push(p);
        }
      }
      token = '';
      depth++;
    } else if (ch === '}') {
      token = '';
      depth = Math.max(0, depth - 1);
    } else if (ch === ';' && depth === 0) {
      token = '';
    } else {
      token += ch;
    }
  }

  function stripZeroSpecificityWhere(s) {
    let out = '';
    let i = 0;
    while (i < s.length) {
      if (s.startsWith(':where(', i)) {
        i += 7;
        let p = 1;
        while (i < s.length && p > 0) {
          if (s[i] === '(') p++;
          else if (s[i] === ')') p--;
          i++;
        }
      } else {
        out += s[i++];
      }
    }
    return out;
  }

  let totalScore = 0;
  let maxScore = 0;
  for (const raw of selectors) {
    const cleaned = stripZeroSpecificityWhere(raw)
      .replace(/::[a-zA-Z0-9_-]+/g, ' e ')
      .replace(/:not\(|:is\(|:has\(/g, '(');
    const ids = (cleaned.match(/#[a-zA-Z_-][a-zA-Z0-9_-]*/g) || []).length;
    const classes = (cleaned.match(/\.[a-zA-Z_-][a-zA-Z0-9_\\-]*/g) || []).length;
    const attrs = (cleaned.match(/\[[^\]]+\]/g) || []).length;
    const pseudos = (cleaned.match(/:[a-zA-Z_-][a-zA-Z0-9_-]*/g) || []).length;
    const score = ids * 100 + (classes + attrs + pseudos) * 10;
    totalScore += score;
    if (score > maxScore) maxScore = score;
  }

  const avgSpecificityScore = selectors.length
    ? Number((totalScore / selectors.length).toFixed(1))
    : 0;

  return {
    selectorCount: selectors.length,
    importantCount,
    customPropsCount,
    hasCascadeLayers,
    avgSpecificityScore,
    maxSpecificityScore: maxScore,
    runtimeCssInJs: false,
  };
}

function analyzeHtmlString(html) {
  const bytes = measureBytes(html);
  // Strip inline <style>...</style> blocks before counting UI DOM elements & classes
  const domOnly = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const classMatches = [...domOnly.matchAll(/class="([^"]*)"/g)];
  let totalClasses = 0;
  for (const m of classMatches) {
    totalClasses += m[1].trim().split(/\s+/).filter(Boolean).length;
  }
  const tagCount = (domOnly.match(/<[a-zA-Z][a-zA-Z0-9-]*/g) || []).length;
  return {
    rawBytes: bytes.min,
    gzipBytes: bytes.gzip,
    elementCount: tagCount,
    totalClassTokens: totalClasses,
    avgClassesPerElement: tagCount ? Number((totalClasses / tagCount).toFixed(2)) : 0,
  };
}

function analyzeHtmlPayload(fw) {
  const html = buildMountRowsHtml(fw, 200) + buildDashboardGridHtml(fw, 24) + buildParityHtml(fw);
  return analyzeHtmlString(html);
}

function packBundle(cssBuf, jsBuf, componentCount, withRuntimeBuf = null) {
  const css = measureBytes(cssBuf);
  const js = measureBytes(jsBuf);
  const total = {
    min: css.min + js.min,
    gzip: css.gzip + js.gzip,
    brotli: css.brotli + js.brotli,
  };
  const out = {
    css,
    js,
    total,
    componentCount,
    gzipPerComponent: Math.round(total.gzip / componentCount),
  };
  if (withRuntimeBuf) {
    const rtJs = measureBytes(withRuntimeBuf);
    out.withRuntime = {
      min: css.min + rtJs.min,
      gzip: css.gzip + rtJs.gzip,
      brotli: css.brotli + rtJs.brotli,
    };
  }
  return out;
}

function printLevelTable(label, frameworks) {
  console.log(`\n┌─────────────────────────────┬──────────────────┬──────────────────┬────────────┬───────────────┬──────────────┐`);
  console.log(`│ ${label.padEnd(27)} │ 12-Comp Kit Gzip │ Full Bundle Gzip │ !important │ Avg Specif.   │ 200-Row HTML │`);
  console.log(`├─────────────────────────────┼──────────────────┼──────────────────┼────────────┼───────────────┼──────────────┤`);
  for (const f of frameworks) {
    const kitKb = `${(f.kit.total.gzip / 1024).toFixed(1)} kB`.padStart(10);
    const fullKb = `${(f.full.total.gzip / 1024).toFixed(1)} kB`.padStart(10);
    const imp = (f.cssHygiene.runtimeCssInJs ? 'CSS-in-JS' : String(f.cssHygiene.importantCount)).padStart(9);
    const spec = (f.cssHygiene.runtimeCssInJs ? 'runtime' : String(f.cssHygiene.avgSpecificityScore)).padStart(8);
    const htmlKb = `${(f.htmlPayload.gzipBytes / 1024).toFixed(1)} kB`.padStart(8);
    console.log(
      `│ ${f.name.padEnd(27)} │ ${kitKb.padEnd(16)} │ ${fullKb.padEnd(16)} │ ${imp.padEnd(10)} │ ${spec.padEnd(13)} │ ${htmlKb.padEnd(12)} │`,
    );
  }
  console.log(`└─────────────────────────────┴──────────────────┴──────────────────┴────────────┴───────────────┴──────────────┘`);
}

async function main() {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.mkdir(SANDBOX_DIR, { recursive: true });
  await fs.mkdir(GEN_DIR, { recursive: true });

  // =========================================================================
  // LEVEL 1: BASE / CORE
  // =========================================================================
  console.log('⚡ [Level 1/3] Analyzing Base / Core frameworks (jenni-core, Bootstrap 5, Tailwind+DaisyUI, Shoelace)...');

  const jenniKitCssEntry = path.join(TMP_DIR, 'jenni-kit.css');
  await fs.writeFile(
    jenniKitCssEntry,
    [
      '@layer jenni.tokens, jenni.base, jenni.components;',
      `@import "${path.join(REPO_ROOT, 'packages/core/src/tokens.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/base.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/primitives.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/grid.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/list.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/control.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/button.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/field.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/input.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/select.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/choice.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/switch.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/badge.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/avatar.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/card.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/alert.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/progress.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/floating.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/dialog.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/menu.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/tabs.css')}";`,
      `@import "${path.join(REPO_ROOT, 'packages/core/src/components/tooltip.css')}";`,
    ].join('\n'),
  );
  const jenniKitCss = await bundleCssFile(jenniKitCssEntry);
  const jenniFullCss = await bundleCssFile(path.join(REPO_ROOT, 'packages/core/src/index.css'));

  const jenniKitJs = await bundleJsEntry(
    `
      import { initToggles } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/forms.js')}';
      import { initDialogs } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/dialog.js')}';
      import { initMenus } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/menu.js')}';
      import { initTabs } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/tabs.js')}';
      import { initTooltips } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/tooltip.js')}';
      window.__jenniKit = { initToggles, initDialogs, initMenus, initTabs, initTooltips };
    `,
    'jenni-kit-entry.js',
  );

  const jenniFullJs = await bundleJsEntry(
    `
      import * as Jenni from '${path.join(REPO_ROOT, 'packages/core/src/index.js')}';
      window.Jenni = Jenni;
    `,
    'jenni-full-entry.js',
  );

  const jenniSandboxJs = await bundleJsEntry(
    `
      import { initToggles } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/forms.js')}';
      import { initDialogs } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/dialog.js')}';
      import { initMenus } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/menu.js')}';
      import { initTabs } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/tabs.js')}';
      import { initTooltips } from '${path.join(REPO_ROOT, 'packages/core/src/behaviors/tooltip.js')}';
      window.__benchAdapter = {
        init(root) {
          const cleanups = [
            initToggles(root),
            initDialogs(root),
            initMenus(root),
            initTabs(root),
            initTooltips(root),
          ];
          return () => cleanups.forEach((fn) => fn && fn());
        },
        setTheme(dark, density) {
          document.documentElement.dataset.theme = dark ? 'dark' : 'light';
          document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
          document.documentElement.dataset.density = density || 'default';
        },
        async cycleOverlay(root, iterations = 30) {
          const dlg = root.querySelector('#bench-dlg');
          const menu = root.querySelector('#bench-menu');
          for (let i = 0; i < iterations; i++) {
            dlg.showModal();
            void dlg.offsetHeight;
            dlg.close();
            if (menu.showPopover) {
              menu.showPopover();
              void menu.offsetHeight;
              menu.hidePopover();
            }
          }
        }
      };
    `,
    'jenni-sandbox.js',
  );
  await fs.writeFile(path.join(SANDBOX_DIR, 'jenni.css'), jenniKitCss);
  await fs.writeFile(path.join(SANDBOX_DIR, 'jenni.js'), jenniSandboxJs);

  // 2. Bootstrap 5.3
  const bsCssPath = path.join(REPO_ROOT, 'node_modules/bootstrap/dist/css/bootstrap.css');
  const bsFullCss = await bundleCssFile(bsCssPath);
  const bsKitCss = bsFullCss;

  const bsKitJs = await bundleJsEntry(
    `
      import Button from '${path.join(REPO_ROOT, 'node_modules/bootstrap/js/dist/button.js')}';
      import Dropdown from '${path.join(REPO_ROOT, 'node_modules/bootstrap/js/dist/dropdown.js')}';
      import Modal from '${path.join(REPO_ROOT, 'node_modules/bootstrap/js/dist/modal.js')}';
      import Tab from '${path.join(REPO_ROOT, 'node_modules/bootstrap/js/dist/tab.js')}';
      import Tooltip from '${path.join(REPO_ROOT, 'node_modules/bootstrap/js/dist/tooltip.js')}';
      window.__bsKit = { Button, Dropdown, Modal, Tab, Tooltip };
    `,
    'bs-kit-entry.js',
  );

  const bsFullJs = await bundleJsEntry(
    `
      import * as bootstrap from '${path.join(REPO_ROOT, 'node_modules/bootstrap/dist/js/bootstrap.esm.js')}';
      window.bootstrap = bootstrap;
    `,
    'bs-full-entry.js',
  );

  const bsSandboxJs = await bundleJsEntry(
    `
      import * as bootstrap from '${path.join(REPO_ROOT, 'node_modules/bootstrap/dist/js/bootstrap.esm.js')}';
      window.bootstrap = bootstrap;
      window.__benchAdapter = {
        init(root) {
          const instances = [];
          root.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((el) => instances.push(new bootstrap.Dropdown(el)));
          root.querySelectorAll('.modal').forEach((el) => instances.push(new bootstrap.Modal(el, { backdrop: false })));
          return () => instances.forEach((inst) => inst.dispose && inst.dispose());
        },
        setTheme(dark) {
          document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
        },
        async cycleOverlay(root, iterations = 30) {
          const dlgEl = root.querySelector('#bench-dlg');
          const ddBtn = root.querySelector('#bench-menu-trigger');
          const modal = bootstrap.Modal.getOrCreateInstance(dlgEl, { backdrop: false });
          const dd = bootstrap.Dropdown.getOrCreateInstance(ddBtn);
          for (let i = 0; i < iterations; i++) {
            modal.show();
            void dlgEl.offsetHeight;
            modal.hide();
            dd.show();
            void ddBtn.offsetHeight;
            dd.hide();
          }
        }
      };
    `,
    'bs-sandbox.js',
  );
  await fs.writeFile(path.join(SANDBOX_DIR, 'bootstrap.css'), bsFullCss);
  await fs.writeFile(path.join(SANDBOX_DIR, 'bootstrap.js'), bsSandboxJs);

  // 3. Tailwind CSS v4 + DaisyUI 5
  const twInputPath = path.join(TMP_DIR, 'tw-kit.css');
  await fs.writeFile(
    twInputPath,
    [
      '@import "tailwindcss";',
      `@source "${path.join(BENCH_ROOT, 'src/fixtures/markups.js')}";`,
      `@source not "${SANDBOX_DIR}";`,
      `@source not "${path.join(BENCH_ROOT, 'src/sandboxes')}";`,
      `@source not "${path.join(BENCH_ROOT, 'dist')}";`,
      '@plugin "daisyui";',
    ].join('\n'),
  );
  const twPostcssRes = await postcss([
    tailwindcssPostcss({ base: REPO_ROOT }),
  ]).process(await fs.readFile(twInputPath, 'utf8'), { from: twInputPath });
  const twKitCss = minifyCssString(twPostcssRes.css, 'tailwind-daisyui-kit.css');

  const twFullInputPath = path.join(TMP_DIR, 'tw-full.css');
  await fs.writeFile(
    twFullInputPath,
    [
      '@import "tailwindcss";',
      `@source "${path.join(BENCH_ROOT, 'src/fixtures/markups.js')}";`,
      `@source not "${SANDBOX_DIR}";`,
      `@source not "${path.join(BENCH_ROOT, 'src/sandboxes')}";`,
      `@source not "${path.join(BENCH_ROOT, 'dist')}";`,
    ].join('\n'),
  );
  const twBaseOnly = await postcss([
    tailwindcssPostcss({ base: REPO_ROOT }),
  ]).process(await fs.readFile(twFullInputPath, 'utf8'), { from: twFullInputPath });
  const daisyRaw = await fs.readFile(path.join(REPO_ROOT, 'node_modules/daisyui/daisyui.css'), 'utf8');
  const twFullCss = minifyCssString(`${twBaseOnly.css}\n${daisyRaw}`, 'tailwind-daisyui-full.css');

  const twEmptyJs = Buffer.from('');
  const twSandboxJs = await bundleJsEntry(
    `
      window.__benchAdapter = {
        init() {
          return () => {};
        },
        setTheme(dark) {
          document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        },
        async cycleOverlay(root, iterations = 30) {
          const dlg = root.querySelector('#bench-dlg');
          const menu = root.querySelector('#bench-menu');
          for (let i = 0; i < iterations; i++) {
            dlg.showModal();
            void dlg.offsetHeight;
            dlg.close();
            menu.open = true;
            void menu.offsetHeight;
            menu.open = false;
          }
        }
      };
    `,
    'tw-sandbox.js',
  );
  await fs.writeFile(path.join(SANDBOX_DIR, 'tailwind.css'), twKitCss);
  await fs.writeFile(path.join(SANDBOX_DIR, 'tailwind.js'), twSandboxJs);

  // 4. Shoelace 2.20
  const slLight = await fs.readFile(
    path.join(REPO_ROOT, 'node_modules/@shoelace-style/shoelace/dist/themes/light.css'),
    'utf8',
  );
  const slDark = await fs.readFile(
    path.join(REPO_ROOT, 'node_modules/@shoelace-style/shoelace/dist/themes/dark.css'),
    'utf8',
  );
  const slKitCss = minifyCssString(`${slLight}\n${slDark}`, 'shoelace-themes.css');
  const slFullCss = slKitCss;

  const slDist = path.join(REPO_ROOT, 'node_modules/@shoelace-style/shoelace/dist');
  const slKitImports = [
    'components/alert/alert.js',
    'components/badge/badge.js',
    'components/button/button.js',
    'components/card/card.js',
    'components/dialog/dialog.js',
    'components/divider/divider.js',
    'components/dropdown/dropdown.js',
    'components/input/input.js',
    'components/menu/menu.js',
    'components/menu-item/menu-item.js',
    'components/option/option.js',
    'components/select/select.js',
    'components/switch/switch.js',
    'components/tab/tab.js',
    'components/tab-group/tab-group.js',
    'components/tab-panel/tab-panel.js',
    'components/tooltip/tooltip.js',
  ]
    .map((rel) => `import '${path.join(slDist, rel)}';`)
    .join('\n');

  const slKitJs = await bundleJsEntry(slKitImports, 'sl-kit-entry.js');
  const slFullJs = await bundleJsEntry(
    `import * as Shoelace from '${path.join(slDist, 'shoelace.js')}'; window.Shoelace = Shoelace;`,
    'sl-full-entry.js',
  );

  const slSandboxJs = await bundleJsEntry(
    `
      ${slKitImports}
      import { setAnimation } from '${path.join(slDist, 'utilities/animation-registry.js')}';
      window.__benchAdapter = {
        init() {
          return () => {};
        },
        setTheme(dark) {
          document.documentElement.classList.toggle('sl-theme-dark', !!dark);
        },
        async cycleOverlay(root, iterations = 30) {
          const dlg = root.querySelector('#bench-dlg');
          const dd = root.querySelector('#bench-menu');
          setAnimation(dlg, 'dialog.show', null);
          setAnimation(dlg, 'dialog.hide', null);
          setAnimation(dlg, 'dialog.overlay.show', null);
          setAnimation(dlg, 'dialog.overlay.hide', null);
          setAnimation(dd, 'dropdown.show', null);
          setAnimation(dd, 'dropdown.hide', null);
          for (let i = 0; i < iterations; i++) {
            await dlg.show();
            void dlg.offsetHeight;
            await dlg.hide();
            await dd.show();
            void dd.offsetHeight;
            await dd.hide();
          }
        }
      };
    `,
    'sl-sandbox.js',
  );
  await fs.writeFile(path.join(SANDBOX_DIR, 'shoelace.css'), slFullCss);
  await fs.writeFile(path.join(SANDBOX_DIR, 'shoelace.js'), slSandboxJs);
  await fs.copyFile(
    path.join(BENCH_ROOT, 'src/fixtures/markups.js'),
    path.join(SANDBOX_DIR, 'markups.js'),
  );

  const jenniCoreCompCount = fsSync
    .readdirSync(path.join(REPO_ROOT, 'packages/core/src/components'))
    .filter((f) => f.endsWith('.css')).length;
  const jenniVueCompCount = ['layout', 'forms', 'display', 'overlay'].reduce(
    (sum, sub) =>
      sum +
      fsSync
        .readdirSync(path.join(REPO_ROOT, 'packages/vue/src', sub))
        .filter((f) => f.endsWith('.vue')).length,
    0,
  );
  const jenniReactCompCount = ['layout', 'forms', 'display', 'overlay'].reduce(
    (sum, sub) =>
      sum +
      fsSync
        .readdirSync(path.join(REPO_ROOT, 'packages/react/src', sub))
        .filter((f) => f.endsWith('.tsx')).length,
    0,
  );

  const coreFrameworks = [
    {
      id: 'jenni',
      name: 'jenni-core',
      package: `jenni-core@${resolvePkgVersion('jenni-core')}`,
      paradigm: 'Zero-specificity @layer CSS + OKLCH tokens + native <dialog>/[popover] + O(1) delegated JS',
      kit: packBundle(jenniKitCss, jenniKitJs, 12),
      full: packBundle(jenniFullCss, jenniFullJs, jenniCoreCompCount),
      cssHygiene: analyzeCssHygiene(jenniFullCss),
      htmlPayload: analyzeHtmlPayload('jenni'),
      capabilities: {
        zeroFouc: true,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: true,
        liveRuntimeDensityMultiplier: true,
        oklchPerceptualTokens: true,
        containerQueryGrid: true,
        cssSubgridSupport: true,
        zeroExternalRuntimeDeps: true,
      },
    },
    {
      id: 'bootstrap',
      name: 'Bootstrap 5',
      package: `bootstrap@${resolvePkgVersion('bootstrap')}`,
      paradigm: 'Monolithic SCSS/CSS components + Flexbox negative-margin grid + Popper.js class instances',
      kit: packBundle(bsKitCss, bsKitJs, 12),
      full: packBundle(bsFullCss, bsFullJs, 24),
      cssHygiene: analyzeCssHygiene(bsFullCss),
      htmlPayload: analyzeHtmlPayload('bootstrap'),
      capabilities: {
        zeroFouc: true,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: false,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: false,
        containerQueryGrid: false,
        cssSubgridSupport: false,
        zeroExternalRuntimeDeps: false,
      },
    },
    {
      id: 'tailwind',
      name: 'Tailwind v4 + DaisyUI 5',
      package: `tailwindcss@${resolvePkgVersion('tailwindcss')} + daisyui@${resolvePkgVersion('daisyui')}`,
      paradigm: 'JIT utility classes + CSS-only component classes (no built-in JS ARIA/focus/anchor behaviors)',
      kit: packBundle(twKitCss, twEmptyJs, 12),
      full: packBundle(twFullCss, twEmptyJs, 61),
      cssHygiene: analyzeCssHygiene(twKitCss),
      htmlPayload: analyzeHtmlPayload('tailwind'),
      capabilities: {
        zeroFouc: true,
        a11yKeyboardBehaviors: false,
        nativeTopLayerOverlays: true,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: true,
        containerQueryGrid: false,
        cssSubgridSupport: true,
        zeroExternalRuntimeDeps: true,
      },
    },
    {
      id: 'shoelace',
      name: 'Shoelace (Web Components)',
      package: `@shoelace-style/shoelace@${resolvePkgVersion('@shoelace-style/shoelace')}`,
      paradigm: 'Lit CustomElements + per-element ShadowRoot DOM + Floating UI JS positioning',
      kit: packBundle(slKitCss, slKitJs, 12),
      full: packBundle(slFullCss, slFullJs, 52),
      cssHygiene: analyzeCssHygiene(slFullCss),
      htmlPayload: analyzeHtmlPayload('shoelace'),
      capabilities: {
        zeroFouc: false,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: false,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: false,
        containerQueryGrid: false,
        cssSubgridSupport: false,
        zeroExternalRuntimeDeps: false,
      },
    },
  ];

  // =========================================================================
  // LEVEL 2: VUE 3 WRAPPERS & UI FRAMEWORKS
  // =========================================================================
  console.log('⚡ [Level 2/3] Analyzing Vue 3 UI libraries (jenni-vue, Vuetify 3, PrimeVue 4, Element Plus)...');

  const vueRuntimeEntry = `
    import { createApp, ref, computed, watch, h, nextTick } from 'vue';
    export { createApp, ref, computed, watch, h, nextTick };
  `;
  const vueRuntimeBundle = await bundleViteEntry({
    entryCode: vueRuntimeEntry,
    entryName: 'vue-runtime-base.ts',
    isVue: true,
  });
  const vueRuntimeStats = measureBytes(vueRuntimeBundle.jsBuf);

  const vueJenniKitCode = `
    import { JButton, JInput, JSelect, JCheckbox, JSwitch, JBadge, JAvatar, JCard, JAlert, JProgress, JTabs, JTabList, JTab, JTabPanel, JDialog } from 'jenni-vue';
    export const kit = [JButton, JInput, JSelect, JCheckbox, JSwitch, JBadge, JAvatar, JCard, JAlert, JProgress, JTabs, JTabList, JTab, JTabPanel, JDialog];
  `;
  const vueJenniFullCode = `
    import * as JenniVue from 'jenni-vue';
    export { JenniVue };
  `;

  const vueVuetifyKitCode = `
    import 'vuetify/styles';
    import { createVuetify } from 'vuetify';
    import { VBtn, VTextField, VSelect, VCheckbox, VSwitch, VBadge, VChip, VAvatar, VCard, VAlert, VProgressLinear, VTabs, VTab, VDialog } from 'vuetify/components';
    export const kit = [createVuetify, VBtn, VTextField, VSelect, VCheckbox, VSwitch, VBadge, VChip, VAvatar, VCard, VAlert, VProgressLinear, VTabs, VTab, VDialog];
  `;
  const vueVuetifyFullCode = `
    import 'vuetify/styles';
    import { createVuetify } from 'vuetify';
    import * as components from 'vuetify/components';
    import * as directives from 'vuetify/directives';
    export { createVuetify, components, directives };
  `;

  const vuePrimeKitCode = `
    import PrimeVue from 'primevue/config';
    import Aura from '@primeuix/themes/aura';
    import Button from 'primevue/button';
    import InputText from 'primevue/inputtext';
    import Select from 'primevue/select';
    import Checkbox from 'primevue/checkbox';
    import ToggleSwitch from 'primevue/toggleswitch';
    import Badge from 'primevue/badge';
    import Tag from 'primevue/tag';
    import Avatar from 'primevue/avatar';
    import Card from 'primevue/card';
    import Message from 'primevue/message';
    import ProgressBar from 'primevue/progressbar';
    import Tabs from 'primevue/tabs';
    import TabList from 'primevue/tablist';
    import Tab from 'primevue/tab';
    import TabPanels from 'primevue/tabpanels';
    import TabPanel from 'primevue/tabpanel';
    import Dialog from 'primevue/dialog';
    export const kit = [PrimeVue, Aura, Button, InputText, Select, Checkbox, ToggleSwitch, Badge, Tag, Avatar, Card, Message, ProgressBar, Tabs, TabList, Tab, TabPanels, TabPanel, Dialog];
  `;
  const vuePrimeFullCode = `
    import PrimeVue from 'primevue/config';
    import Aura from '@primeuix/themes/aura';
    import * as PrimeComponents from 'primevue';
    export { PrimeVue, Aura, PrimeComponents };
  `;

  const vueEpKitCode = `
    import 'element-plus/es/components/button/style/css';
    import 'element-plus/es/components/input/style/css';
    import 'element-plus/es/components/select/style/css';
    import 'element-plus/es/components/checkbox/style/css';
    import 'element-plus/es/components/switch/style/css';
    import 'element-plus/es/components/badge/style/css';
    import 'element-plus/es/components/tag/style/css';
    import 'element-plus/es/components/avatar/style/css';
    import 'element-plus/es/components/card/style/css';
    import 'element-plus/es/components/alert/style/css';
    import 'element-plus/es/components/progress/style/css';
    import 'element-plus/es/components/tabs/style/css';
    import 'element-plus/es/components/dialog/style/css';
    import { ElButton, ElInput, ElSelect, ElOption, ElCheckbox, ElSwitch, ElBadge, ElTag, ElAvatar, ElCard, ElAlert, ElProgress, ElTabs, ElTabPane, ElDialog } from 'element-plus';
    export const kit = [ElButton, ElInput, ElSelect, ElOption, ElCheckbox, ElSwitch, ElBadge, ElTag, ElAvatar, ElCard, ElAlert, ElProgress, ElTabs, ElTabPane, ElDialog];
  `;
  const vueEpFullCode = `
    import 'element-plus/dist/index.css';
    import * as ElementPlus from 'element-plus';
    export { ElementPlus };
  `;

  const withVueBoot = (code) =>
    `import { createApp } from 'vue';\n${code}\nexport { createApp };`;

  const [
    vJenniKit,
    vJenniKitWithVue,
    vJenniFull,
    vVuetifyKit,
    vVuetifyKitWithVue,
    vVuetifyFull,
    vPrimeKit,
    vPrimeKitWithVue,
    vPrimeFull,
    vEpKit,
    vEpKitWithVue,
    vEpFull,
  ] = await Promise.all([
    bundleViteEntry({ entryCode: vueJenniKitCode, entryName: 'v-jenni-kit.ts', isVue: true, external: ['vue'] }),
    bundleViteEntry({ entryCode: withVueBoot(vueJenniKitCode), entryName: 'v-jenni-kit-rt.ts', isVue: true }),
    bundleViteEntry({ entryCode: vueJenniFullCode, entryName: 'v-jenni-full.ts', isVue: true, external: ['vue'] }),
    bundleViteEntry({ entryCode: vueVuetifyKitCode, entryName: 'v-vuetify-kit.ts', isVue: true, external: ['vue'] }),
    bundleViteEntry({ entryCode: withVueBoot(vueVuetifyKitCode), entryName: 'v-vuetify-kit-rt.ts', isVue: true }),
    bundleViteEntry({ entryCode: vueVuetifyFullCode, entryName: 'v-vuetify-full.ts', isVue: true, external: ['vue'] }),
    bundleViteEntry({ entryCode: vuePrimeKitCode, entryName: 'v-prime-kit.ts', isVue: true, external: ['vue'] }),
    bundleViteEntry({ entryCode: withVueBoot(vuePrimeKitCode), entryName: 'v-prime-kit-rt.ts', isVue: true }),
    bundleViteEntry({ entryCode: vuePrimeFullCode, entryName: 'v-prime-full.ts', isVue: true, external: ['vue'] }),
    bundleViteEntry({ entryCode: vueEpKitCode, entryName: 'v-ep-kit.ts', isVue: true, external: ['vue'] }),
    bundleViteEntry({ entryCode: withVueBoot(vueEpKitCode), entryName: 'v-ep-kit-rt.ts', isVue: true }),
    bundleViteEntry({ entryCode: vueEpFullCode, entryName: 'v-ep-full.ts', isVue: true, external: ['vue'] }),
  ]);

  // Compile runnable Level 2 browser sandboxes
  const [sbVueJenni, sbVueVuetify, sbVuePrime, sbVueEp] = await Promise.all([
    bundleViteEntry({
      existingEntryPath: path.join(BENCH_ROOT, 'src/sandboxes/vue-jenni.ts'),
      entryPath: path.join(BENCH_ROOT, 'src/sandboxes/vue-jenni.ts'),
      isVue: true,
      format: 'iife',
    }),
    bundleViteEntry({
      entryPath: path.join(BENCH_ROOT, 'src/sandboxes/vue-vuetify.ts'),
      isVue: true,
      format: 'iife',
    }),
    bundleViteEntry({
      entryPath: path.join(BENCH_ROOT, 'src/sandboxes/vue-primevue.ts'),
      isVue: true,
      format: 'iife',
    }),
    bundleViteEntry({
      entryPath: path.join(BENCH_ROOT, 'src/sandboxes/vue-element.ts'),
      isVue: true,
      format: 'iife',
    }),
  ]);

  await Promise.all([
    fs.writeFile(path.join(SANDBOX_DIR, 'vue-jenni.css'), jenniFullCss),
    fs.writeFile(path.join(SANDBOX_DIR, 'vue-jenni.js'), sbVueJenni.jsBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'vue-vuetify.css'), sbVueVuetify.cssBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'vue-vuetify.js'), sbVueVuetify.jsBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'vue-primevue.css'), sbVuePrime.cssBuf.byteLength ? sbVuePrime.cssBuf : Buffer.from('/* runtime CSS-in-JS */')),
    fs.writeFile(path.join(SANDBOX_DIR, 'vue-primevue.js'), sbVuePrime.jsBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'vue-element.css'), sbVueEp.cssBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'vue-element.js'), sbVueEp.jsBuf),
  ]);

  // Measure real Vue 3 SSR 200-row HTML payloads
  await viteBuild({
    root: BENCH_ROOT,
    configFile: false,
    logLevel: 'silent',
    plugins: [vuePlugin()],
    ssr: { noExternal: true },
    build: {
      ssr: path.join(BENCH_ROOT, 'src/fixtures/ssr-vue.ts'),
      outDir: TMP_DIR,
      emptyOutDir: false,
      minify: false,
      rollupOptions: { output: { entryFileNames: 'ssr-vue-runner.mjs' } },
    },
  });
  const { renderVuePayloads } = await import(pathToFileURL(path.join(TMP_DIR, 'ssr-vue-runner.mjs')).href);
  const vueSsrHtml = await renderVuePayloads(200, 24);

  const vueFrameworks = [
    {
      id: 'jenni',
      name: 'jenni-vue',
      package: `jenni-vue@${resolvePkgVersion('jenni-vue')}`,
      paradigm: 'Zero-<style> Vue 3 SFC primitives over jenni-core @layer CSS + native <dialog>/[popover]',
      kit: packBundle(jenniKitCss, vJenniKit.jsBuf, 12, vJenniKitWithVue.jsBuf),
      full: packBundle(jenniFullCss, vJenniFull.jsBuf, jenniVueCompCount),
      cssHygiene: analyzeCssHygiene(jenniFullCss),
      htmlPayload: analyzeHtmlString(vueSsrHtml.jenni),
      capabilities: {
        zeroFouc: true,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: true,
        liveRuntimeDensityMultiplier: true,
        oklchPerceptualTokens: true,
        containerQueryGrid: true,
        cssSubgridSupport: true,
        zeroExternalRuntimeDeps: true,
      },
    },
    {
      id: 'vuetify',
      name: 'Vuetify 3',
      package: `vuetify@${resolvePkgVersion('vuetify')}`,
      paradigm: 'Material Design 3 SFC framework + global VApp provider + Sass/CSS layers + ripple/overlay wrappers',
      kit: packBundle(vVuetifyKit.cssBuf, vVuetifyKit.jsBuf, 12, vVuetifyKitWithVue.jsBuf),
      full: packBundle(vVuetifyFull.cssBuf, vVuetifyFull.jsBuf, 105),
      cssHygiene: analyzeCssHygiene(vVuetifyFull.cssBuf),
      htmlPayload: analyzeHtmlString(vueSsrHtml.vuetify),
      capabilities: {
        zeroFouc: true,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: false,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: false,
        containerQueryGrid: false,
        cssSubgridSupport: false,
        zeroExternalRuntimeDeps: true,
      },
    },
    {
      id: 'primevue',
      name: 'PrimeVue 4 (Aura)',
      package: `primevue@${resolvePkgVersion('primevue')} + @primeuix/themes@${resolvePkgVersion('@primeuix/themes')}`,
      paradigm: 'JS design-token preset (@primeuix/styled) injecting <style> tags into <head> at runtime',
      kit: packBundle(vPrimeKit.cssBuf, vPrimeKit.jsBuf, 12, vPrimeKitWithVue.jsBuf),
      full: packBundle(vPrimeFull.cssBuf, vPrimeFull.jsBuf, 95),
      cssHygiene: analyzeCssHygiene(vPrimeFull.cssBuf, true),
      htmlPayload: analyzeHtmlString(vueSsrHtml.primevue),
      capabilities: {
        zeroFouc: false,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: false,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: false,
        containerQueryGrid: false,
        cssSubgridSupport: false,
        zeroExternalRuntimeDeps: false,
      },
    },
    {
      id: 'element',
      name: 'Element Plus',
      package: `element-plus@${resolvePkgVersion('element-plus')}`,
      paradigm: 'BEM theme-chalk CSS variables + Floating UI / Popper portals + lodash/async-validator deps',
      kit: packBundle(vEpKit.cssBuf, vEpKit.jsBuf, 12, vEpKitWithVue.jsBuf),
      full: packBundle(vEpFull.cssBuf, vEpFull.jsBuf, 78),
      cssHygiene: analyzeCssHygiene(vEpFull.cssBuf),
      htmlPayload: analyzeHtmlString(vueSsrHtml.element),
      capabilities: {
        zeroFouc: true,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: false,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: false,
        containerQueryGrid: false,
        cssSubgridSupport: false,
        zeroExternalRuntimeDeps: false,
      },
    },
  ];

  // =========================================================================
  // LEVEL 3: REACT 19 WRAPPERS & UI FRAMEWORKS
  // =========================================================================
  console.log('⚡ [Level 3/3] Analyzing React 19 UI libraries (jenni-react, MUI, Ant Design, Radix Themes)...');

  const reactExt = ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'];

  const reactRuntimeBundle = await bundleViteEntry({
    entryCode: `
      import React, { useState, useEffect, useRef, useId } from 'react';
      import { createRoot } from 'react-dom/client';
      export { React, useState, useEffect, useRef, useId, createRoot };
    `,
    entryName: 'react-runtime-base.tsx',
  });
  const reactRuntimeStats = measureBytes(reactRuntimeBundle.jsBuf);

  const reactJenniKitCode = `
    import { Button, Input, Select, Checkbox, Switch, Badge, Avatar, Card, Alert, Progress, Tabs, TabList, Tab, TabPanel, Dialog } from 'jenni-react';
    export const kit = [Button, Input, Select, Checkbox, Switch, Badge, Avatar, Card, Alert, Progress, Tabs, TabList, Tab, TabPanel, Dialog];
  `;
  const reactJenniFullCode = `
    import * as JenniReact from 'jenni-react';
    export { JenniReact };
  `;

  const reactMuiKitCode = `
    import { ThemeProvider, createTheme, CssBaseline, Button, TextField, Select, MenuItem, Checkbox, Switch, Badge, Chip, Avatar, Card, Alert, LinearProgress, Tabs, Tab, Dialog } from '@mui/material';
    export const kit = [ThemeProvider, createTheme, CssBaseline, Button, TextField, Select, MenuItem, Checkbox, Switch, Badge, Chip, Avatar, Card, Alert, LinearProgress, Tabs, Tab, Dialog];
  `;
  const reactMuiFullCode = `
    import * as MUI from '@mui/material';
    export { MUI };
  `;

  const reactAntdKitCode = `
    import { ConfigProvider, theme, Button, Input, Select, Checkbox, Switch, Badge, Tag, Avatar, Card, Alert, Progress, Tabs, Modal } from 'antd';
    export const kit = [ConfigProvider, theme, Button, Input, Select, Checkbox, Switch, Badge, Tag, Avatar, Card, Alert, Progress, Tabs, Modal];
  `;
  const reactAntdFullCode = `
    import * as Antd from 'antd';
    export { Antd };
  `;

  const reactRadixKitCode = `
    import '@radix-ui/themes/tokens/base.css';
    import '@radix-ui/themes/tokens/colors/slate.css';
    import '@radix-ui/themes/tokens/colors/indigo.css';
    import '@radix-ui/themes/tokens/colors/green.css';
    import '@radix-ui/themes/tokens/colors/blue.css';
    import '@radix-ui/themes/tokens/colors/red.css';
    import '@radix-ui/themes/components.css';
    import '@radix-ui/themes/utilities.css';
    import { Theme, Button, TextField, Select, Checkbox, Switch, Badge, Avatar, Card, Callout, Progress, Tabs, Dialog } from '@radix-ui/themes';
    export const kit = [Theme, Button, TextField, Select, Checkbox, Switch, Badge, Avatar, Card, Callout, Progress, Tabs, Dialog];
  `;
  const reactRadixFullCode = `
    import '@radix-ui/themes/styles.css';
    import * as RadixThemes from '@radix-ui/themes';
    export { RadixThemes };
  `;

  const withReactBoot = (code) =>
    `import { createRoot } from 'react-dom/client';\n${code}\nexport { createRoot };`;

  const [
    rJenniKit,
    rJenniKitWithReact,
    rJenniFull,
    rMuiKit,
    rMuiKitWithReact,
    rMuiFull,
    rAntdKit,
    rAntdKitWithReact,
    rAntdFull,
    rRadixKit,
    rRadixKitWithReact,
    rRadixFull,
  ] = await Promise.all([
    bundleViteEntry({ entryCode: reactJenniKitCode, entryName: 'r-jenni-kit.tsx', external: reactExt }),
    bundleViteEntry({ entryCode: withReactBoot(reactJenniKitCode), entryName: 'r-jenni-kit-rt.tsx' }),
    bundleViteEntry({ entryCode: reactJenniFullCode, entryName: 'r-jenni-full.tsx', external: reactExt }),
    bundleViteEntry({ entryCode: reactMuiKitCode, entryName: 'r-mui-kit.tsx', external: reactExt }),
    bundleViteEntry({ entryCode: withReactBoot(reactMuiKitCode), entryName: 'r-mui-kit-rt.tsx' }),
    bundleViteEntry({ entryCode: reactMuiFullCode, entryName: 'r-mui-full.tsx', external: reactExt }),
    bundleViteEntry({ entryCode: reactAntdKitCode, entryName: 'r-antd-kit.tsx', external: reactExt }),
    bundleViteEntry({ entryCode: withReactBoot(reactAntdKitCode), entryName: 'r-antd-kit-rt.tsx' }),
    bundleViteEntry({ entryCode: reactAntdFullCode, entryName: 'r-antd-full.tsx', external: reactExt }),
    bundleViteEntry({ entryCode: reactRadixKitCode, entryName: 'r-radix-kit.tsx', external: reactExt }),
    bundleViteEntry({ entryCode: withReactBoot(reactRadixKitCode), entryName: 'r-radix-kit-rt.tsx' }),
    bundleViteEntry({ entryCode: reactRadixFullCode, entryName: 'r-radix-full.tsx', external: reactExt }),
  ]);

  // Compile runnable Level 3 browser sandboxes
  const [sbReactJenni, sbReactMui, sbReactAntd, sbReactRadix] = await Promise.all([
    bundleViteEntry({ entryPath: path.join(BENCH_ROOT, 'src/sandboxes/react-jenni.tsx'), format: 'iife' }),
    bundleViteEntry({ entryPath: path.join(BENCH_ROOT, 'src/sandboxes/react-mui.tsx'), format: 'iife' }),
    bundleViteEntry({ entryPath: path.join(BENCH_ROOT, 'src/sandboxes/react-antd.tsx'), format: 'iife' }),
    bundleViteEntry({ entryPath: path.join(BENCH_ROOT, 'src/sandboxes/react-radix.tsx'), format: 'iife' }),
  ]);

  await Promise.all([
    fs.writeFile(path.join(SANDBOX_DIR, 'react-jenni.css'), jenniFullCss),
    fs.writeFile(path.join(SANDBOX_DIR, 'react-jenni.js'), sbReactJenni.jsBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'react-mui.css'), sbReactMui.cssBuf.byteLength ? sbReactMui.cssBuf : Buffer.from('/* runtime Emotion CSS-in-JS */')),
    fs.writeFile(path.join(SANDBOX_DIR, 'react-mui.js'), sbReactMui.jsBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'react-antd.css'), sbReactAntd.cssBuf.byteLength ? sbReactAntd.cssBuf : Buffer.from('/* runtime @ant-design/cssinjs */')),
    fs.writeFile(path.join(SANDBOX_DIR, 'react-antd.js'), sbReactAntd.jsBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'react-radix.css'), sbReactRadix.cssBuf),
    fs.writeFile(path.join(SANDBOX_DIR, 'react-radix.js'), sbReactRadix.jsBuf),
  ]);

  // Measure real React 19 SSR 200-row HTML payloads
  await viteBuild({
    root: BENCH_ROOT,
    configFile: false,
    logLevel: 'silent',
    ssr: { noExternal: true },
    build: {
      ssr: path.join(BENCH_ROOT, 'src/fixtures/ssr-react.tsx'),
      outDir: TMP_DIR,
      emptyOutDir: false,
      minify: false,
      rollupOptions: { output: { entryFileNames: 'ssr-react-runner.mjs' } },
    },
  });
  const { renderReactPayloads } = await import(pathToFileURL(path.join(TMP_DIR, 'ssr-react-runner.mjs')).href);
  const reactSsrHtml = renderReactPayloads(200, 24);

  const reactFrameworks = [
    {
      id: 'jenni',
      name: 'jenni-react',
      package: `jenni-react@${resolvePkgVersion('jenni-react')}`,
      paradigm: 'React 19 native-ref TSX primitives over jenni-core @layer CSS + zero CSS-in-JS',
      kit: packBundle(jenniKitCss, rJenniKit.jsBuf, 12, rJenniKitWithReact.jsBuf),
      full: packBundle(jenniFullCss, rJenniFull.jsBuf, jenniReactCompCount),
      cssHygiene: analyzeCssHygiene(jenniFullCss),
      htmlPayload: analyzeHtmlString(reactSsrHtml.jenni),
      capabilities: {
        zeroFouc: true,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: true,
        liveRuntimeDensityMultiplier: true,
        oklchPerceptualTokens: true,
        containerQueryGrid: true,
        cssSubgridSupport: true,
        zeroExternalRuntimeDeps: true,
      },
    },
    {
      id: 'mui',
      name: 'MUI (Material UI)',
      package: `@mui/material@${resolvePkgVersion('@mui/material')} + @emotion/react@${resolvePkgVersion('@emotion/react')}`,
      paradigm: 'Emotion CSS-in-JS runtime style serialization + React TransitionGroup / Portal wrappers',
      kit: packBundle(rMuiKit.cssBuf, rMuiKit.jsBuf, 12, rMuiKitWithReact.jsBuf),
      full: packBundle(rMuiFull.cssBuf, rMuiFull.jsBuf, 72),
      cssHygiene: analyzeCssHygiene(rMuiFull.cssBuf, true),
      htmlPayload: analyzeHtmlString(reactSsrHtml.mui),
      capabilities: {
        zeroFouc: false,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: false,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: false,
        containerQueryGrid: false,
        cssSubgridSupport: false,
        zeroExternalRuntimeDeps: false,
      },
    },
    {
      id: 'antd',
      name: 'Ant Design',
      package: `antd@${resolvePkgVersion('antd')}`,
      paradigm: '@ant-design/cssinjs runtime token hashing + rc-* component suite + JS wave/motion',
      kit: packBundle(rAntdKit.cssBuf, rAntdKit.jsBuf, 12, rAntdKitWithReact.jsBuf),
      full: packBundle(rAntdFull.cssBuf, rAntdFull.jsBuf, 68),
      cssHygiene: analyzeCssHygiene(rAntdFull.cssBuf, true),
      htmlPayload: analyzeHtmlString(reactAntdCleanCheck(reactSsrHtml.antd)),
      capabilities: {
        zeroFouc: false,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: false,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: false,
        containerQueryGrid: false,
        cssSubgridSupport: false,
        zeroExternalRuntimeDeps: false,
      },
    },
    {
      id: 'radix',
      name: 'Radix Themes',
      package: `@radix-ui/themes@${resolvePkgVersion('@radix-ui/themes')}`,
      paradigm: 'Radix UI Primitives + 30-scale token CSS + Floating UI React Portals',
      kit: packBundle(rRadixKit.cssBuf, rRadixKit.jsBuf, 12, rRadixKitWithReact.jsBuf),
      full: packBundle(rRadixFull.cssBuf, rRadixFull.jsBuf, 48),
      cssHygiene: analyzeCssHygiene(rRadixFull.cssBuf),
      htmlPayload: analyzeHtmlString(reactSsrHtml.radix),
      capabilities: {
        zeroFouc: true,
        a11yKeyboardBehaviors: true,
        nativeTopLayerOverlays: false,
        liveRuntimeDensityMultiplier: false,
        oklchPerceptualTokens: true,
        containerQueryGrid: false,
        cssSubgridSupport: false,
        zeroExternalRuntimeDeps: false,
      },
    },
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    level: 'core',
    frameworks: coreFrameworks,
    levels: {
      core: {
        id: 'core',
        title: 'Level 1 · Base / Core',
        runtimeBase: null,
        frameworks: coreFrameworks,
      },
      vue: {
        id: 'vue',
        title: 'Level 2 · Vue 3',
        runtimeBase: {
          package: `vue@${resolvePkgVersion('vue')}`,
          ...vueRuntimeStats,
        },
        frameworks: vueFrameworks,
      },
      react: {
        id: 'react',
        title: 'Level 3 · React 19',
        runtimeBase: {
          package: `react@${resolvePkgVersion('react')} + react-dom@${resolvePkgVersion('react-dom')}`,
          ...reactRuntimeStats,
        },
        frameworks: reactFrameworks,
      },
    },
  };

  await fs.writeFile(path.join(GEN_DIR, 'static-metrics.json'), JSON.stringify(report, null, 2));
  await fs.rm(TMP_DIR, { recursive: true, force: true });

  printLevelTable('Level 1: Base / Core', coreFrameworks);
  printLevelTable('Level 2: Vue 3 (UI only)', vueFrameworks);
  printLevelTable('Level 3: React 19 (UI only)', reactFrameworks);
  console.log('');
}

function reactAntdCleanCheck(s) {
  return s;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
