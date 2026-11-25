import { useEffect, useRef, useState, type RefObject } from 'react';
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

export type ElementRefOrGetter =
  | HTMLElement
  | null
  | undefined
  | RefObject<HTMLElement | null | undefined>
  | (() => HTMLElement | null | undefined);

export interface UseThemeTokensOptions {
  /** Optional root element or React ref to observe (defaults to `document.documentElement`). */
  root?: HTMLElement | RefObject<HTMLElement | null | undefined> | null;
}

export interface UseShortcutOptions extends Omit<ShortcutOptions, 'scope' | 'enabled'> {
  /** Scope element, React `RefObject`, or getter. Automatically suppressed when hidden or in an inactive tab. */
  scope?: ElementRefOrGetter;
  /** Whether the shortcut is active (default `true`). */
  enabled?: boolean;
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

function unwrapRoot(
  root: UseThemeTokensOptions['root'],
): HTMLElement | undefined {
  if (!root) return undefined;
  if (typeof HTMLElement !== 'undefined' && root instanceof HTMLElement) return root;
  if (typeof root === 'object' && 'current' in root) {
    return root.current ?? undefined;
  }
  return undefined;
}

function unwrapScope(scope: ElementRefOrGetter): HTMLElement | null {
  if (!scope) return null;
  if (typeof scope === 'function') return scope() ?? null;
  if (typeof HTMLElement !== 'undefined' && scope instanceof HTMLElement) return scope;
  if (typeof scope === 'object' && 'current' in scope) return scope.current ?? null;
  return null;
}

/**
 * Reactive theme tokens hook (`#rrggbb` / `rgba(...)`), including `charts`, `syntax`,
 * and `terminal` (`xterm.js` `ITheme`) palettes. Automatically re-renders when `data-theme`,
 * `data-tone`, `data-density`, inline CSS knobs, or OS `prefers-color-scheme` change.
 */
export function useThemeTokens(options: UseThemeTokensOptions = {}): ThemeTokens {
  const rootProp = options.root;
  const [tokens, setTokens] = useState<ThemeTokens>(() =>
    getThemeTokens(unwrapRoot(rootProp)),
  );

  useEffect(() => {
    const el = unwrapRoot(rootProp);
    setTokens(getThemeTokens(el));
    return onThemeChange((next) => setTokens(next), { root: el });
  }, [rootProp]);

  return tokens;
}

/**
 * Register a tab- & visibility-aware keyboard shortcut tied to the React component lifecycle.
 */
export function useShortcut(
  combo: string | readonly string[],
  handler: ShortcutHandler,
  options: UseShortcutOptions = {},
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const hasScope = 'scope' in options && options.scope !== undefined;
  const enabled = options.enabled !== false;
  const registry = options.registry ?? shortcuts;
  const comboKey = typeof combo === 'string' ? combo : combo.join('\u0000');

  useEffect(() => {
    if (!enabled) return;
    const currentCombo = comboKey.includes('\u0000') ? comboKey.split('\u0000') : comboKey;
    const opts = optionsRef.current;
    const coreOpts: ShortcutOptions = {
      priority: opts.priority,
      preventDefault: opts.preventDefault,
      stopPropagation: opts.stopPropagation,
      allowInInputs: opts.allowInInputs,
      allowModInInputs: opts.allowModInInputs,
      allowInTerminal: opts.allowInTerminal,
      globalModal: opts.globalModal,
      allowRepeat: opts.allowRepeat,
      sequenceTimeout: opts.sequenceTimeout,
      description: opts.description,
      enabled: () => optionsRef.current.enabled !== false,
    };
    if (hasScope) {
      coreOpts.scope = () => unwrapScope(optionsRef.current.scope);
    }
    return registry.register(currentCombo, (e) => handlerRef.current(e), coreOpts);
  }, [
    comboKey,
    enabled,
    hasScope,
    registry,
    options.priority,
    options.preventDefault,
    options.stopPropagation,
    options.allowInInputs,
    options.allowModInInputs,
    options.allowInTerminal,
    options.globalModal,
    options.allowRepeat,
    options.sequenceTimeout,
  ]);
}

function serializeShortcutFlags(opts: UseShortcutOptions | undefined): string {
  if (!opts) return '';
  return [
    opts.priority ?? '',
    opts.preventDefault ?? '',
    opts.stopPropagation ?? '',
    opts.allowInInputs ?? '',
    opts.allowModInInputs ?? '',
    opts.allowInTerminal ?? '',
    opts.globalModal ?? '',
    opts.allowRepeat ?? '',
    opts.sequenceTimeout ?? '',
    'scope' in opts && opts.scope !== undefined ? '1' : '0',
  ].join(',');
}

function createLiveCoreOpts(
  getMerged: () => UseShortcutOptions,
  isEnabled: () => boolean,
  hasExplicitScope: boolean,
): ShortcutOptions {
  const coreOpts: ShortcutOptions = {
    get priority() {
      return getMerged().priority;
    },
    get preventDefault() {
      return getMerged().preventDefault;
    },
    get stopPropagation() {
      return getMerged().stopPropagation;
    },
    get allowInInputs() {
      return getMerged().allowInInputs;
    },
    get allowModInInputs() {
      return getMerged().allowModInInputs;
    },
    get allowInTerminal() {
      return getMerged().allowInTerminal;
    },
    get globalModal() {
      return getMerged().globalModal;
    },
    get allowRepeat() {
      return getMerged().allowRepeat;
    },
    get sequenceTimeout() {
      return getMerged().sequenceTimeout;
    },
    get description() {
      return getMerged().description;
    },
    enabled: isEnabled,
  };
  if (hasExplicitScope) {
    coreOpts.scope = () => unwrapScope(getMerged().scope);
  }
  return coreOpts;
}

/**
 * Register multiple tab- & visibility-aware shortcuts from a combo map or descriptor array.
 */
export function useShortcuts(
  bindings: ShortcutBindingMap | readonly ShortcutBindingEntry[],
  sharedOptions: UseShortcutOptions = {},
): void {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const sharedRef = useRef(sharedOptions);
  sharedRef.current = sharedOptions;

  const enabled = sharedOptions.enabled !== false;
  const registry = sharedOptions.registry ?? shortcuts;
  const sharedFlagsKey = serializeShortcutFlags(sharedOptions);

  const structureKey = Array.isArray(bindings)
    ? `${sharedFlagsKey}\u0002` +
      (bindings as readonly ShortcutBindingEntry[])
        .map(
          (b) =>
            `${Array.isArray(b.combo) ? b.combo.join('|') : b.combo}:${serializeShortcutFlags(b)}`,
        )
        .join('\u0001')
    : `${sharedFlagsKey}\u0002` +
      Object.entries(bindings as ShortcutBindingMap)
        .map(
          ([combo, val]) =>
            `${combo}:${typeof val === 'function' ? '' : serializeShortcutFlags(val)}`,
        )
        .join('\u0001');

  useEffect(() => {
    if (!enabled) return;
    const currentBindings = bindingsRef.current;
    const shared = sharedRef.current;
    const cleanups: Array<() => void> = [];

    if (Array.isArray(currentBindings)) {
      const list = currentBindings as readonly ShortcutBindingEntry[];
      list.forEach((_, idx) => {
        const initial = list[idx];
        const mergedInitial = { ...shared, ...initial };
        const hasExplicitScope = 'scope' in mergedInitial && mergedInitial.scope !== undefined;
        const itemReg = mergedInitial.registry ?? registry;

        const coreOpts = createLiveCoreOpts(
          () => {
            const curShared = sharedRef.current;
            const curList = bindingsRef.current as readonly ShortcutBindingEntry[];
            return { ...curShared, ...curList[idx] };
          },
          () => {
            const curShared = sharedRef.current;
            const curList = bindingsRef.current as readonly ShortcutBindingEntry[];
            const curItem = curList[idx];
            return curShared.enabled !== false && curItem?.enabled !== false;
          },
          hasExplicitScope,
        );

        cleanups.push(
          itemReg.register(
            initial.combo,
            (e) => {
              const curList = bindingsRef.current as readonly ShortcutBindingEntry[];
              curList[idx]?.handler(e);
            },
            coreOpts,
          ),
        );
      });
    } else {
      const map = currentBindings as ShortcutBindingMap;
      for (const combo of Object.keys(map)) {
        const val = map[combo];
        const objOpts = typeof val === 'function' ? undefined : val;
        const mergedInitial = { ...shared, ...objOpts };
        const hasExplicitScope = 'scope' in mergedInitial && mergedInitial.scope !== undefined;
        const itemReg = mergedInitial.registry ?? registry;

        const coreOpts = createLiveCoreOpts(
          () => {
            const curShared = sharedRef.current;
            const curMap = bindingsRef.current as ShortcutBindingMap;
            const curVal = curMap[combo];
            return typeof curVal === 'function' || !curVal
              ? curShared
              : { ...curShared, ...curVal };
          },
          () => {
            const curShared = sharedRef.current;
            const curMap = bindingsRef.current as ShortcutBindingMap;
            const curVal = curMap[combo];
            const itemEnabled =
              typeof curVal === 'function' || !curVal ? true : curVal.enabled !== false;
            return curShared.enabled !== false && itemEnabled;
          },
          hasExplicitScope,
        );

        cleanups.push(
          itemReg.register(
            combo,
            (e) => {
              const curMap = bindingsRef.current as ShortcutBindingMap;
              const curVal = curMap[combo];
              if (typeof curVal === 'function') curVal(e);
              else curVal?.handler(e);
            },
            coreOpts,
          ),
        );
      }
    }

    return () => {
      for (const fn of cleanups) fn();
    };
  }, [structureKey, enabled, registry]);
}
