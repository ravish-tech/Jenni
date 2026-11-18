# Jenni — Architecture & Conventions

**Jenni** *(pronounced “yenni”, `/ˈjɛni/`)* is a web UI framework driven by **beauty, simplicity, and performance** — built in loving memory of Jenni, and shaped by **mature elegance, architectural calm, and spatial precision**.
This file is the contract every contributor (human or agent) follows.

## Aesthetic, Motion & Spatial Principles

1. **Mature Elegance — Never Toy-Like**:
   - **Zero overshoot / zero bounce**: Never use bouncy springs (`> 1.0` overshoot), rubbery thumb stretching (`scaleX(1.18)`), rotated checkmarks (`rotate(-12deg)`), or button/control squishing (`scale(0.92)`–`scale(0.97)`).
   - **Weighted, damped glide**: Motion uses poised deceleration curves (`--j-ease-out`: `cubic-bezier(0.19, 1, 0.22, 1)` and `--j-ease-emphasized`: `cubic-bezier(0.16, 1, 0.3, 1)`) at measured, unhurried durations (`150ms` tint, `220ms` state, `300ms` spatial glide). Interactive elements feel like precision-machined hardware, never bouncy rubber.
   - **Poised color & tailored radii**: Colors use ink-rich, composed chroma rather than neon candy; radii are architectural (`4–14px`), and surfaces rely on crisp `1px` hairlines and quiet diffused depth rather than glossy gradients or loud halos.
2. **Spatial System First ([LAYOUT.md](./LAYOUT.md))**:
   - Never hardcode arbitrary gaps (`10px`, `14px`, `18px`). Use semantic relationship tokens (`--j-gap-inline` `6px`, `--j-gap-related` `8px`, `--j-gap-item` `12px`, `--j-gap-field` `16px`, `--j-gap-group` `24px`, `--j-gap-section` `40px`), canonical heights (`--j-control-*`, `--j-list-h-*`, `--j-topbar-h`, `--j-bottombar-h`), and layout primitives (`Stack`, `Inline`, `Grid`, `List`, `Page`, `AppShell`).

## Layers

```
jenni-core   → tokens.css + base.css + component CSS + tiny vanilla JS behaviors
                Works in plain HTML. Zero framework. This is the source of truth.
jenni-vue    → Vue 3 components. Render core markup. Add state, v-model, a11y wiring.
jenni-react  → React 19 components. Same markup, same props names where possible.
(future)      → svelte, solid, web-components… all thin wrappers over core.
apps/playground → Dev-only showcase + design lab with feedback notes.
```

Rule: **all visuals live in core CSS.** Framework layers never add styles
(no `<style>` blocks in Vue/React components). If a wrapper needs a visual,
add it to core.

## Markup contract (core)

- Block class: `j-<name>` (e.g. `j-button`, `j-switch`).
- Parts: `j-<name>__<part>` (e.g. `j-switch__thumb`).
- Options use **data attributes**, not modifier classes:
  - `data-variant` — e.g. `solid | soft | outline | ghost | link`
  - `data-size` — `sm | md | lg` (md is the default; omit attribute for md)
  - `data-tone` — `accent | neutral | danger | success | warning | info`
- State uses native attributes/pseudo-classes first (`:disabled`, `:checked`,
  `[aria-expanded="true"]`, `[aria-selected="true"]`, `:open`, `:popover-open`),
  then `data-state="…"` if needed. Never `.is-active` classes.
- Prefer **native elements**: `<button>`, `<input type=checkbox>`, `<dialog>`,
  `popover` attribute, `<details>`, `<progress>`, `<select>`. Use CSS anchor
  positioning for floating UI where possible.
- Each component reads tone via `--j-tone`, `--j-tone-hover`, `--j-tone-fg`,
  `--j-tone-soft`, `--j-tone-soft-fg` (set by `[data-tone]`, default accent).
- Component-local custom properties are prefixed `--_` (private) and may be
  overridden via documented public `--j-<name>-*` props.

## CSS rules

- Wrap every component in `@layer jenni.components { … }`.
- Use `:where()` for low specificity so users can override easily.
- Only use tokens from `tokens.css` (`var(--j-*)`). No raw colors except in tokens.
- Modern CSS is fine: nesting, `oklch`, `color-mix`, `light-dark`, `:has`,
  `@starting-style`, anchor positioning, `transition-behavior: allow-discrete`.
- Animate only `transform`, `opacity`, `background-color`, `box-shadow`, `color`.
- Respect `prefers-reduced-motion` (durations collapse to 0 via tokens).
- One file per component: `packages/core/src/components/<name>.css`,
  imported from its group file (`forms.css`, `display.css`, `overlay.css`).

## Vanilla behaviors (core JS)

- Only where HTML/CSS cannot do it (e.g. roving tabindex for tabs).
- Pattern: `export function initTabs(root = document) { … return cleanup }`.
- Must be idempotent, tree-shakable, no dependencies, no globals.
- Files: `packages/core/src/behaviors/<name>.js`, exported from group file.

## Vue layer

- Component names: `J<Name>` (e.g. `JButton`). File: `packages/vue/src/<group>/J<Name>.vue`.
- `<script setup lang="ts">`, `defineModel` for v-model, `defineProps` with TS types.
- Props mirror data attributes: `variant`, `size`, `tone`. Pass through attrs.
- No `<style>` blocks. Export from the group index (`src/forms.ts`, …).

## React layer

- Component names: `<Name>` (e.g. `Button`). File: `packages/react/src/<group>/<Name>.tsx`.
- Function components, `forwardRef` not needed (React 19 `ref` prop).
- Controlled + uncontrolled support (`value`/`defaultValue`, `onValueChange`).
- Same prop names as Vue. Export from group index.

## Playground demos

- One demo per component: `apps/playground/src/demos/<group>/<Name>.demo.vue`.
- Each demo file has a normal `<script lang="ts">` block exporting `meta`:
  ```ts
  export const meta = { name: 'Button', group: 'Forms', order: 1,
                        description: 'Triggers an action.', status: 'draft' }
  ```
  plus a `<script setup lang="ts">` block for the demo itself.
- Use `<DemoSection title="Variants">` from `@/kit` to group examples.
  Each section gets its own feedback thread automatically.
- Optionally include a plain-HTML snippet using `<DemoCode lang="html">` to
  prove the core layer works without Vue.
- `status`: `planned | draft | review | stable`.

## Feedback loop

- Notes written in the playground are saved to `feedback/notes.json`
  (via a Vite dev-server endpoint) and mirrored to `feedback/TODO.md`.
- The agent reads `feedback/TODO.md`, works on open items, then marks them
  `done` in `notes.json` with a short `resolution`.
