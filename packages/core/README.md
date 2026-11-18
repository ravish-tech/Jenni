# `@jenni/core`

Foundational CSS design tokens (OKLCH, `light-dark()`, continuous `0.65×–1.15×` `--j-density` scaling), 57 `@layer`-scoped component stylesheets (`0 !important`), 16 `@container`-query application shells, and lightweight delegated WAI-ARIA behaviors.

## Usage

```ts
import '@jenni/core/css';
import { initJenni } from '@jenni/core';

// Optional: enhance plain HTML interactive components (<dialog>, [popover], tabs, menus, shells)
initJenni();
```

Or import granularly:

```css
@import '@jenni/core/tokens.css';
@import '@jenni/core/base.css';
@import '@jenni/core/components/button.css';
@import '@jenni/core/components/shell.css';
```

## License

[Apache-2.0](../../LICENSE)
