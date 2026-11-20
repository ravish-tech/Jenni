/**
 * Production package builder for jenni-core, jenni-vue, and jenni-react.
 * Emits:
 *   - Standalone minified full CSS (`dist/jenni.css`) + granular per-component CSS (`dist/css/*.css`)
 *   - ESM & CDN IIFE JS bundles + TypeScript declarations (`.d.ts`)
 *   - Machine-readable Component & Token API manifests (`manifest.json`)
 *   - LICENSE in each publishable package
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build as viteBuild } from 'vite';
import vuePlugin from '@vitejs/plugin-vue';
import { COMPONENT_CSS_DEPS, generateManifests } from './generate-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAYGROUND_MODULES = path.join(ROOT, 'apps/playground/node_modules');

function findBin(name) {
  for (const base of [
    path.join(ROOT, 'node_modules/.bin'),
    path.join(PLAYGROUND_MODULES, '.bin'),
  ]) {
    const candidate = path.join(base, name);
    if (fsSync.existsSync(candidate)) return candidate;
  }
  return name;
}

const tscBin = findBin('tsc');
const vueTscBin = findBin('vue-tsc');

async function copyLicense(pkgDir) {
  const src = path.join(ROOT, 'LICENSE');
  if (fsSync.existsSync(src)) {
    await fs.copyFile(src, path.join(pkgDir, 'LICENSE'));
  }
}

/**
 * Compile a CSS entry file with Vite (resolving @import and minifying via LightningCSS).
 * @param {string} pkgDir
 * @param {string} cssImportBody
 * @param {string} outFile
 */
async function compileMinifiedCss(pkgDir, cssImportBody, outFile) {
  const tmpDir = path.join(pkgDir, 'dist/.tmp-css');
  await fs.mkdir(tmpDir, { recursive: true });
  const entryJs = path.join(tmpDir, 'entry.js');
  const entryCss = path.join(tmpDir, 'entry.css');
  await fs.writeFile(entryCss, cssImportBody, 'utf8');
  await fs.writeFile(entryJs, `import './entry.css';\n`, 'utf8');

  const res = await viteBuild({
    root: pkgDir,
    configFile: false,
    logLevel: 'silent',
    css: { transformer: 'lightningcss' },
    build: {
      write: false,
      minify: true,
      cssMinify: 'lightningcss',
      cssCodeSplit: false,
      lib: {
        entry: entryJs,
        formats: ['es'],
        fileName: () => 'out.js',
      },
    },
  });

  const outs = Array.isArray(res) ? res[0].output : res.output;
  const cssAsset = outs.find((o) => o.type === 'asset' && o.fileName.endsWith('.css'));
  if (cssAsset) {
    const buf = Buffer.isBuffer(cssAsset.source)
      ? cssAsset.source
      : Buffer.from(String(cssAsset.source), 'utf8');
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, buf);
  }
  await fs.rm(tmpDir, { recursive: true, force: true });
}

async function buildCore() {
  console.log('📦 [1/3] Building jenni-core (full + granular CSS + ESM/IIFE + .d.ts)...');
  const pkgDir = path.join(ROOT, 'packages/core');
  const distDir = path.join(pkgDir, 'dist');
  const distCssDir = path.join(distDir, 'css');
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distCssDir, { recursive: true });

  // 1A. Full standalone minified CSS bundle (dist/jenni.css)
  await compileMinifiedCss(
    pkgDir,
    `@layer jenni.tokens, jenni.base, jenni.components;\n@import "../../src/index.css";\n`,
    path.join(distDir, 'jenni.css'),
  );

  // 1B. Granular foundation CSS (tokens + base) & individual standalone component CSS bundles
  await compileMinifiedCss(
    pkgDir,
    `@layer jenni.tokens, jenni.base, jenni.components;\n@import "../../src/tokens.css";\n@import "../../src/base.css";\n`,
    path.join(distCssDir, 'foundation.css'),
  );
  await compileMinifiedCss(
    pkgDir,
    `@layer jenni.tokens;\n@import "../../src/tokens.css";\n`,
    path.join(distCssDir, 'tokens.css'),
  );
  await compileMinifiedCss(
    pkgDir,
    `@layer jenni.base;\n@import "../../src/base.css";\n`,
    path.join(distCssDir, 'base.css'),
  );

  const compSrcDir = path.join(pkgDir, 'src/components');
  const compFiles = (await fs.readdir(compSrcDir)).filter((f) => f.endsWith('.css')).sort();
  for (const file of compFiles) {
    const slug = file.replace(/\.css$/, '');
    const deps = COMPONENT_CSS_DEPS[slug] || [file];
    const imports = deps.map((d) => `@import "../../src/components/${d}";`).join('\n');
    await compileMinifiedCss(
      pkgDir,
      `@layer jenni.tokens, jenni.base, jenni.components;\n${imports}\n`,
      path.join(distCssDir, file),
    );
  }

  // 2. ESM + IIFE JS bundles (dist/index.js + dist/jenni.iife.js)
  await viteBuild({
    root: pkgDir,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: true,
      lib: {
        entry: path.join(pkgDir, 'src/index.js'),
        name: 'Jenni',
        formats: ['es', 'iife'],
        fileName: (format) => (format === 'es' ? 'index.js' : 'jenni.iife.js'),
      },
    },
  });

  // 3. TypeScript declarations from JSDoc (dist/index.d.ts + dist/behaviors/*.d.ts)
  execFileSync(
    tscBin,
    [
      '--allowJs',
      '--declaration',
      '--emitDeclarationOnly',
      '--moduleResolution',
      'bundler',
      '--target',
      'ES2022',
      '--outDir',
      distDir,
      '--rootDir',
      path.join(pkgDir, 'src'),
      path.join(pkgDir, 'src/index.js'),
    ],
    { cwd: pkgDir, stdio: 'inherit' },
  );

  await copyLicense(pkgDir);
}

async function buildVue() {
  console.log('📦 [2/3] Building jenni-vue...');
  const pkgDir = path.join(ROOT, 'packages/vue');
  const distDir = path.join(pkgDir, 'dist');
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });

  await viteBuild({
    root: pkgDir,
    configFile: false,
    logLevel: 'warn',
    plugins: [vuePlugin()],
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: path.join(pkgDir, 'src/index.ts'),
        formats: ['es'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        external: ['vue', /^jenni-core(\/.*)?$/],
      },
    },
  });

  const tmpTsconfig = path.join(pkgDir, 'tsconfig.build.json');
  await fs.writeFile(
    tmpTsconfig,
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          declaration: true,
          emitDeclarationOnly: true,
          skipLibCheck: true,
          outDir: './dist',
          rootDir: './src',
        },
        include: ['src/**/*'],
      },
      null,
      2,
    ),
    'utf8',
  );
  try {
    execFileSync(vueTscBin, ['-p', tmpTsconfig], { cwd: pkgDir, stdio: 'inherit' });
  } finally {
    await fs.rm(tmpTsconfig, { force: true });
  }

  for (const sub of ['layout', 'forms', 'display', 'overlay']) {
    const srcSub = path.join(pkgDir, 'src', sub);
    const dstSub = path.join(distDir, sub);
    if (!fsSync.existsSync(srcSub) || !fsSync.existsSync(dstSub)) continue;
    for (const f of await fs.readdir(srcSub)) {
      if (f.endsWith('.d.ts')) {
        await fs.copyFile(path.join(srcSub, f), path.join(dstSub, f));
      }
    }
  }

  await copyLicense(pkgDir);
}

async function buildReact() {
  console.log('📦 [3/3] Building jenni-react...');
  const pkgDir = path.join(ROOT, 'packages/react');
  const distDir = path.join(pkgDir, 'dist');
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });

  await viteBuild({
    root: pkgDir,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: path.join(pkgDir, 'src/index.ts'),
        formats: ['es'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          /^jenni-core(\/.*)?$/,
        ],
      },
    },
  });

  execFileSync(
    tscBin,
    [
      '--jsx',
      'react-jsx',
      '--module',
      'ESNext',
      '--moduleResolution',
      'bundler',
      '--target',
      'ES2022',
      '--lib',
      'ES2022,DOM,DOM.Iterable',
      '--strict',
      '--declaration',
      '--emitDeclarationOnly',
      '--skipLibCheck',
      '--outDir',
      distDir,
      '--rootDir',
      path.join(pkgDir, 'src'),
      path.join(pkgDir, 'src/index.ts'),
    ],
    { cwd: pkgDir, stdio: 'inherit' },
  );

  for (const sub of ['layout', 'forms', 'display', 'overlay']) {
    const srcSub = path.join(pkgDir, 'src', sub);
    const dstSub = path.join(distDir, sub);
    if (!fsSync.existsSync(srcSub) || !fsSync.existsSync(dstSub)) continue;
    for (const f of await fs.readdir(srcSub)) {
      if (f.endsWith('.d.ts')) {
        await fs.copyFile(path.join(srcSub, f), path.join(dstSub, f));
      }
    }
  }

  await copyLicense(pkgDir);
}

await buildCore();
await buildVue();
await buildReact();
const manifest = generateManifests();
console.log(
  `✅ Built jenni-core, jenni-vue, jenni-react + manifest (${manifest.componentCount} components, ${manifest.tokens.length} CSS tokens).`,
);
