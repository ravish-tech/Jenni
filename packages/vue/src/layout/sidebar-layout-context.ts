import type { InjectionKey, Ref } from 'vue';

export type JSidebarState = 'open' | 'rail' | 'hidden';

export interface JSidebarLayoutProps {
  /** Optional root element or component tag (default `'div'`). */
  as?: string | object;
  /** Optional `localStorage` key persisting `{ state, width }` JSON safely. */
  storageKey?: string;
  /** Default open sidebar width in pixels when uncontrolled and unpersisted (default `260`). */
  defaultWidth?: number;
  /** Minimum resizable sidebar width in pixels (default `180`). */
  min?: number;
  /** Maximum resizable sidebar width in pixels (default `600`). */
  max?: number;
  /** Initial state when uncontrolled and nothing is stored in `storageKey` (default `'open'`). */
  initialState?: JSidebarState;
  /** Controlled sidebar state (`v-model:state`). */
  state?: JSidebarState;
  /** Controlled sidebar open width in pixels (`v-model:width`). */
  width?: number;
  /** Target noun used in toggle tooltips (`"Hide <toggleLabel>"` / `"Show <toggleLabel>"`, default `'sidebar'`). */
  toggleLabel?: string;
  /** Accessible `aria-label` on the `<aside>` landmark (default `'Sidebar'`). */
  sidebarAriaLabel?: string;
  /** Explicit block-size (`--j-sidebar-layout-h`), e.g. `520` or `'100dvh'`. */
  height?: string | number;
  /** Optional 1px framed border + radius around the layout container. */
  bordered?: boolean;
}

export interface JSidebarToggleProps {
  /** Optional override for the layout's `toggleLabel` noun. */
  label?: string;
  /** Optional keyboard shortcut hint displayed in the tooltip. */
  kbd?: string | string[];
  /** Tooltip placement side (default `'bottom'`). */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  /** Disable the toggle button. */
  disabled?: boolean;
}

export interface JSidebarLayoutContextValue {
  state: Readonly<Ref<JSidebarState>>;
  width: Readonly<Ref<number>>;
  hasRail: Readonly<Ref<boolean>>;
  toggleLabel: Readonly<Ref<string>>;
  toggle: () => void;
  setState: (next: JSidebarState) => void;
  setWidth: (next: number) => void;
}

export interface JSidebarLayoutExpose {
  readonly state: JSidebarState;
  toggle: () => void;
  setState: (next: JSidebarState) => void;
  readonly width: number;
  setWidth: (next: number) => void;
}

export const JSidebarLayoutKey: InjectionKey<JSidebarLayoutContextValue> =
  Symbol('JSidebarLayout');
