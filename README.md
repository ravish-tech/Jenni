# Jenni

**Jenni** *(pronounced “yenni”, `/ˈjɛni/`)* is a web UI framework driven by **beauty, simplicity, and performance** — built in loving memory of Jenni, as a tribute to her grace and elegance.

- **Live Design Lab & Benchmarks**: [https://ravish-tech.github.io/Jenni/](https://ravish-tech.github.io/Jenni/)
- **License**: [Apache-2.0](./LICENSE)

## Packages

| Package | Description | 12-Component Kit (gzip) |
|---|---|---:|
| [`@jenni/core`](./packages/core) | OKLCH design tokens, `@layer` CSS primitives (`0 !important`), 16 container-query app shells, and delegated WAI-ARIA behaviors | **17.7 kB** |
| [`@jenni/vue`](./packages/vue) | Zero-`<style>` Vue 3 SFC components over `@jenni/core` markup | **20.1 kB** |
| [`@jenni/react`](./packages/react) | Zero-CSS-in-JS React 19 native-ref TSX components over `@jenni/core` markup | **23.3 kB** |

## Quick Start

### Install from GitHub Releases (works immediately)

```sh
# Vue 3
npm install \
  https://github.com/ravish-tech/Jenni/releases/latest/download/jenni-core.tgz \
  https://github.com/ravish-tech/Jenni/releases/latest/download/jenni-vue.tgz

# React 19
npm install \
  https://github.com/ravish-tech/Jenni/releases/latest/download/jenni-core.tgz \
  https://github.com/ravish-tech/Jenni/releases/latest/download/jenni-react.tgz
```

```ts
// Import styles once at your application root
import '@jenni/core/css';
```

## Monorepo Commands

```sh
npm install
npm run dev              # Interactive Design Lab at http://localhost:5173
npm run typecheck        # Type-check Vue 3, React 19, and Design Lab
npm run build:packages   # Build ESM + .d.ts + CDN bundles for core, vue, and react
npm run bench            # Compile & measure Level 1 (Core), Level 2 (Vue), Level 3 (React)
npm run build            # Build packages + static Design Lab
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — aesthetic principles, weighted motion, and markup conventions.
- [LAYOUT.md](./LAYOUT.md) — `4px`/`8px` spatial grid, `0.65×–1.15×` density scaling, 16 app shells × 4 surface variants, and 18 canonical screen architectures.
- [COMPONENTS.md](./COMPONENTS.md) — complete 57-component inventory across Layout, Forms, Display, and Overlay.
