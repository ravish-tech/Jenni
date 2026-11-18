/**
 * Production package builder for jenni-core, jenni-vue, and jenni-react.
 * Emits ESM bundles, standalone CSS/IIFE CDN bundles, TypeScript declarations (.d.ts),
 * and copies LICENSE into each publishable package.
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build as viteBuild } from 'vite';
import vuePlugin from '@vitejs/plugin-vue';

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

async function buildCore() {
  console.log('📦 [1/3] Building jenni-core...');
  const pkgDir = path.join(ROOT, 'packages/core');
  const distDir = path.join(pkgDir, 'dist');
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });

  // 1. Standalone flattened & minified CSS bundle (dist/jenni.css)
  const tmpCssEntry = path.join(distDir, '__css_entry.js');
  await fs.writeFile(tmpCssEntry, `import '../src/index.css';\n`, 'utf8');
  await viteBuild({
    root: pkgDir,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: true,
      cssMinify: true,
      cssCodeSplit: false,
      lib: {
        entry: tmpCssEntry,
        formats: ['es'],
        fileName: () => '__css_entry.out.js',
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) =>
            assetInfo.name?.endsWith('.css') ? 'jenni.css' : '[name][extname]',
        },
      },
    },
  });
  await fs.rm(tmpCssEntry, { force: true });
  await fs.rm(path.join(distDir, '__css_entry.out.js'), { force: true });
  // Rename default Vite CSS output if emitted as core.css or style.css
  for (const f of await fs.readdir(distDir)) {
    if (f.endsWith('.css') && f !== 'jenni.css') {
      await fs.rename(path.join(distDir, f), path.join(distDir, 'jenni.css'));
    }
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

  // 1. ESM bundle preserving tree-shakable structure (externalizing vue & jenni-core)
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

  // 2. TypeScript .d.ts declarations via vue-tsc
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

  // Copy ambient core.d.ts references into dist subdirectories so relative /// <reference path="./core.d.ts" /> resolves
  for (const sub of ['layout', 'forms', 'display', 'overlay']) {
    const srcCoreDts = path.join(pkgDir, 'src', sub, 'core.d.ts');
    const dstSubDir = path.join(distDir, sub);
    if (fsSync.existsSync(srcCoreDts) && fsSync.existsSync(dstSubDir)) {
      await fs.copyFile(srcCoreDts, path.join(dstSubDir, 'core.d.ts'));
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

  // 1. ESM bundle externalizing react, react-dom, and jenni-core
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

  // 2. TypeScript .d.ts declarations via tsc
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
    const srcCoreDts = path.join(pkgDir, 'src', sub, 'core.d.ts');
    const dstSubDir = path.join(distDir, sub);
    if (fsSync.existsSync(srcCoreDts) && fsSync.existsSync(dstSubDir)) {
      await fs.copyFile(srcCoreDts, path.join(dstSubDir, 'core.d.ts'));
    }
  }

  await copyLicense(pkgDir);
}

await buildCore();
await buildVue();
await buildReact();
console.log('✅ All 3 publishable packages (jenni-core, jenni-vue, jenni-react) built in packages/*/dist.');
