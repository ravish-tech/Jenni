/// <reference path="./overlay/core.d.ts" />
import {
  getCurrentInstance,
  getCurrentScope,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue';
import {
  getChartPalette,
  getSyntaxTheme,
  getTerminalTheme,
  getThemeTokens,
  getXtermTheme,
  onThemeChange,
  resolveCssColor,
  type ChartPalette,
  type OnThemeChangeOptions,
  type SyntaxTheme,
  type TerminalTheme,
  type ThemeDensity,
  type ThemeTokens,
} from 'jenni-core/behaviors/theme.js';
import {
  createShortcutRegistry,
  formatShortcut,
  isElementActiveAndVisible,
  registerShortcut,
  shortcuts,
  type FormatShortcutOptions,
  type ShortcutHandler,
  type ShortcutOptions,
  type ShortcutRegistry,
} from 'jenni-core/behaviors/shortcuts.js';

export {
  resolveCssColor,
  getChartPalette,
  getSyntaxTheme,
  getTerminalTheme,
  getXtermTheme,
  getThemeTokens,
  onThemeChange,
  isElementActiveAndVisible,
  formatShortcut,
  createShortcutRegistry,
  shortcuts,
  registerShortcut,
};

export type {
  ChartPalette,
  SyntaxTheme,
  TerminalTheme,
  ThemeDensity,
  ThemeTokens,
  OnThemeChangeOptions,
  ShortcutHandler,
  ShortcutOptions,
  FormatShortcutOptions,
  ShortcutRegistry,
};

type ScopeTarget =
  | HTMLElement
  | { $el?: unknown }
  | null
  | undefined;

export interface UseThemeTokensOptions {
  /** Optional root element or template ref to observe (defaults to `document.documentElement`). */
  root?: MaybeRefOrGetter<HTMLElement | null | undefined>;
}

export interface UseShortcutOptions
  extends Omit<ShortcutOptions, 'scope' | 'enabled'> {
  /** Scope element, template ref, component ref, or getter. Ignored automatically when hidden or in an inactive tab. */
  scope?: Ref<ScopeTarget> | (() => ScopeTarget) | ScopeTarget;
  /** Reactive or static enable flag (default `true`). */
  enabled?: MaybeRefOrGetter<boolean>;
  /** Optional custom registry instance (defaults to shared document `shortcuts`). */
  registry?: ShortcutRegistry;
}

export interface ShortcutBindingEntry extends UseShortcutOptions {
  combo: string | readonly string[];
  handler: ShortcutHandler;
}

export type ShortcutBindingValue =
  | ShortcutHandler
  | ({ handler: ShortcutHandler } & UseShortcutOptions);

export type ShortcutBindingMap = Record<string, ShortcutBindingValue>;

function unwrapElement(val: unknown): HTMLElement | null {
  if (!val) return null;
  if (typeof HTMLElement !== 'undefined' && val instanceof HTMLElement) return val;
  if (typeof val === 'object' && '$el' in (val as Record<string, unknown>)) {
    const el = (val as { $el?: unknown }).$el;
    return typeof HTMLElement !== 'undefined' && el instanceof HTMLElement ? el : null;
  }
  return null;
}

function resolveScopeOption(
  scope: UseShortcutOptions['scope'],
): (() => HTMLElement | null) | undefined {
  if (scope === undefined) return undefined;
  return () => unwrapElement(toValue(scope as MaybeRefOrGetter<ScopeTarget>));
}

function registerLifecycleCleanup(cleanup: () => void) {
  if (getCurrentInstance()) {
    onBeforeUnmount(cleanup);
  } else if (getCurrentScope()) {
    onScopeDispose(cleanup);
  }
}

/**
 * Reactive theme tokens composable (`#rrggbb` / `rgba(...)`), including `charts`, `syntax`,
 * and `terminal` (`xterm.js` `ITheme`) palettes. Automatically updates when `data-theme`,
 * `data-tone`, `data-density`, inline CSS knobs, or OS `prefers-color-scheme` change.
 */
export function useThemeTokens(
  options: UseThemeTokensOptions = {},
): Readonly<ShallowRef<ThemeTokens>> {
  const getRoot = () => toValue(options.root) ?? undefined;
  const tokens = shallowRef<ThemeTokens>(getThemeTokens(getRoot()));
  let stopObserver: (() => void) | null = null;

  const bind = () => {
    stopObserver?.();
    const rootEl = getRoot();
    tokens.value = getThemeTokens(rootEl);
    stopObserver = onThemeChange(
      (next) => {
        tokens.value = next;
      },
      { root: rootEl },
    );
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      bind();
      if (options.root !== undefined) {
        watch(() => toValue(options.root), bind);
      }
    });
  } else if (typeof window !== 'undefined') {
    bind();
    if (options.root !== undefined && getCurrentScope()) {
      watch(() => toValue(options.root), bind);
    }
  }

  registerLifecycleCleanup(() => {
    stopObserver?.();
    stopObserver = null;
  });

  return tokens;
}

/**
 * Register a tab- & visibility-aware keyboard shortcut tied to the Vue component / scope lifecycle.
 */
export function useShortcut(
  combo: MaybeRefOrGetter<string | readonly string[]>,
  handler: ShortcutHandler,
  options: UseShortcutOptions = {},
): () => void {
  let stopCurrent: (() => void) | null = null;
  let stoppedManually = false;

  const hasExplicitScope = 'scope' in options && options.scope !== undefined;
  const scopeGetter = resolveScopeOption(options.scope);

  const bind = () => {
    stopCurrent?.();
    stopCurrent = null;
    if (stoppedManually) return;
    const reg = options.registry ?? shortcuts;
    const resolvedCombo = toValue(combo);
    const coreOpts: ShortcutOptions = {
      priority: options.priority,
      preventDefault: options.preventDefault,
      stopPropagation: options.stopPropagation,
      allowInInputs: options.allowInInputs,
      allowModInInputs: options.allowModInInputs,
      allowInTerminal: options.allowInTerminal,
      globalModal: options.globalModal,
      allowRepeat: options.allowRepeat,
      sequenceTimeout: options.sequenceTimeout,
      description: options.description,
      enabled: () => toValue(options.enabled) !== false,
    };
    if (hasExplicitScope) {
      coreOpts.scope = scopeGetter;
    }
    stopCurrent = reg.register(resolvedCombo, (e) => handler(e), coreOpts);
  };

  const stop = () => {
    stoppedManually = true;
    stopCurrent?.();
    stopCurrent = null;
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      bind();
      watch(
        () => {
          const c = toValue(combo);
          return typeof c === 'string' ? c : c.join('|');
        },
        bind,
      );
    });
  } else if (typeof document !== 'undefined') {
    bind();
    if (getCurrentScope()) {
      watch(
        () => {
          const c = toValue(combo);
          return typeof c === 'string' ? c : c.join('|');
        },
        bind,
      );
    }
  }

  registerLifecycleCleanup(stop);

  return stop;
}

/**
 * Register multiple tab- & visibility-aware shortcuts from a combo map or descriptor array.
 */
export function useShortcuts(
  bindings: MaybeRefOrGetter<ShortcutBindingMap | readonly ShortcutBindingEntry[]>,
  sharedOptions: UseShortcutOptions = {},
): () => void {
  let cleanups: Array<() => void> = [];
  let stoppedManually = false;

  const clearAll = () => {
    for (const fn of cleanups) fn();
    cleanups = [];
  };

  const bindAll = () => {
    clearAll();
    if (stoppedManually) return;
    const raw = toValue(bindings);
    const reg = sharedOptions.registry ?? shortcuts;

    const entries: ShortcutBindingEntry[] = Array.isArray(raw)
      ? (raw as readonly ShortcutBindingEntry[]).slice()
      : Object.entries(raw as ShortcutBindingMap).map(([combo, val]) =>
          typeof val === 'function'
            ? { combo, handler: val }
            : { combo, ...val },
        );

    for (const item of entries) {
      const merged: UseShortcutOptions = { ...sharedOptions, ...item };
      const hasExplicitScope = 'scope' in merged && merged.scope !== undefined;
      const scopeGetter = resolveScopeOption(merged.scope);
      const itemReg = merged.registry ?? reg;

      const coreOpts: ShortcutOptions = {
        priority: merged.priority,
        preventDefault: merged.preventDefault,
        stopPropagation: merged.stopPropagation,
        allowInInputs: merged.allowInInputs,
        allowModInInputs: merged.allowModInInputs,
        allowInTerminal: merged.allowInTerminal,
        globalModal: merged.globalModal,
        allowRepeat: merged.allowRepeat,
        sequenceTimeout: merged.sequenceTimeout,
        description: merged.description,
        enabled: () =>
          toValue(sharedOptions.enabled) !== false && toValue(item.enabled) !== false,
      };
      if (hasExplicitScope) {
        coreOpts.scope = scopeGetter;
      }
      cleanups.push(itemReg.register(item.combo, (e) => item.handler(e), coreOpts));
    }
  };

  const stop = () => {
    stoppedManually = true;
    clearAll();
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      bindAll();
      watch(() => toValue(bindings), bindAll, { deep: true });
      watch(() => toValue(sharedOptions.enabled), bindAll);
    });
  } else if (typeof document !== 'undefined') {
    bindAll();
    if (getCurrentScope()) {
      watch(() => toValue(bindings), bindAll, { deep: true });
      watch(() => toValue(sharedOptions.enabled), bindAll);
    }
  }

  registerLifecycleCleanup(stop);

  return stop;
}
