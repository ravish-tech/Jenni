declare module 'jenni-core/behaviors/tooltip.js' {
  export interface TooltipOptions {
    delay?: number;
    closeDelay?: number;
    side?: string;
  }
  export interface TooltipController {
    show: (instant?: boolean) => void;
    hide: () => void;
    destroy: () => void;
  }
  export function createTooltip(
    trigger: HTMLElement,
    tooltip: HTMLElement,
    options?: TooltipOptions,
  ): TooltipController;
  export function initTooltips(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/popover.js' {
  export function createPopover(
    trigger: HTMLElement,
    panel: HTMLElement,
    options?: { side?: string },
  ): () => void;
  export function initPopovers(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/dialog.js' {
  export function lightDismiss(dialog: HTMLDialogElement): () => void;
  export function requestClose(dialog: HTMLDialogElement): void;
  export function initDialogs(root?: Document | HTMLElement): () => void;
}

declare module 'jenni-core/behaviors/menu.js' {
  export interface MenuOptions {
    side?: string;
    loop?: boolean;
    manageChecked?: boolean;
  }
  export function createMenu(
    trigger: HTMLElement,
    menu: HTMLElement,
    options?: MenuOptions,
  ): () => void;
  export function initMenus(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/tabs.js' {
  export function getTabs(list: HTMLElement): HTMLElement[];
  export function syncTabIndicator(list: HTMLElement, animate?: boolean): void;
  export function tabsKeydown(list: HTMLElement, e: KeyboardEvent): HTMLElement | null;
  export function createTabs(root: HTMLElement): () => void;
  export function initTabs(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/toast.js' {
  export type ToastTone =
    | 'neutral'
    | 'accent'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'loading';
  export type ToasterPosition = 'bottom-end' | 'bottom-center' | 'top-end' | 'top-center';
  export interface ToastAction {
    label: string;
    onClick?: () => void;
  }
  export interface ToastOptions {
    id?: string;
    title: string;
    description?: string;
    tone?: ToastTone;
    loading?: boolean;
    duration?: number;
    action?: ToastAction;
    closable?: boolean;
  }
  export interface ToastItem {
    id: string;
    title: string;
    description?: string;
    tone: ToastTone;
    loading: boolean;
    duration: number;
    action?: ToastAction;
    closable: boolean;
    state: 'open' | 'closing';
    createdAt: number;
  }
  export type ToastVerifyOutcome =
    | boolean
    | void
    | undefined
    | null
    | string
    | { ok: boolean; error?: string; message?: string };
  export interface ToastPromiseMessages<T = unknown> {
    id?: string;
    loading: string | Omit<ToastOptions, 'tone' | 'loading'>;
    success: string | Partial<ToastOptions> | ((data: T) => string | Partial<ToastOptions>);
    error?: string | Partial<ToastOptions> | ((err: unknown) => string | Partial<ToastOptions>);
    verify?: (data: T) => ToastVerifyOutcome | Promise<ToastVerifyOutcome>;
    autoVerifyResult?: boolean;
    throwOnError?: boolean;
    duration?: number;
  }
  export interface ResultLike<T = unknown> {
    ok: boolean;
    data?: T;
    error?: string | Error;
    message?: string;
  }
  export interface ToastResultOptions<T = unknown> {
    id?: string;
    success?:
      | string
      | Partial<ToastOptions>
      | ((data: T | undefined, result: ResultLike<T>) => string | Partial<ToastOptions>);
    error?:
      | string
      | Partial<ToastOptions>
      | ((
          errorMessage: string,
          result: ResultLike<T> | null | undefined,
        ) => string | Partial<ToastOptions>);
    verify?: (data: T | undefined, result: ResultLike<T>) => ToastVerifyOutcome;
    duration?: number;
  }
  export interface ToastCallable {
    (input: string | ToastOptions, extra?: Partial<ToastOptions>): string;
    success: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    error: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    danger: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    warning: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    info: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    accent: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    loading: (
      input: string | Omit<ToastOptions, 'loading'>,
      extra?: Partial<ToastOptions>,
    ) => string;
    update: (id: string, patch: string | Partial<ToastOptions>) => string;
    promise: <T = unknown>(
      promiseOrFn: Promise<T> | (() => Promise<T>),
      messages: ToastPromiseMessages<T>,
    ) => Promise<T>;
    fromResult: <T = unknown>(
      result: ResultLike<T> | null | undefined,
      options?: ToastResultOptions<T>,
    ) => string;
    dismiss: (id?: string) => void;
    pause: () => void;
    resume: () => void;
    subscribe: (listener: (list: ToastItem[]) => void) => () => void;
    getToasts: () => ToastItem[];
  }
  export const toast: ToastCallable;
  export function updateToast(id: string, patch: string | Partial<ToastOptions>): string;
  export function promiseToast<T = unknown>(
    promiseOrFn: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages<T>,
  ): Promise<T>;
  export function toastFromResult<T = unknown>(
    result: ResultLike<T> | null | undefined,
    options?: ToastResultOptions<T>,
  ): string;
  export function dismissToast(id?: string): void;
  export function pauseToasts(): void;
  export function resumeToasts(): void;
  export function subscribeToasts(listener: (list: ToastItem[]) => void): () => void;
  export function getToasts(): ToastItem[];
  export function registerToastHost(): () => void;
  export function promoteToaster(
    toaster: HTMLElement,
    hasToasts: boolean,
    repromote?: boolean,
  ): void;
  export function syncToasterLayout(toaster: HTMLElement, maxVisible?: number): void;
  export function bindToasterInteractions(
    toaster: HTMLElement,
    options?: { max?: number },
  ): () => void;
  export function initToasts(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/drawer.js' {
  export function lightDismiss(dialog: HTMLDialogElement): () => void;
  export function requestClose(dialog: HTMLDialogElement): void;
  export function createDrawer(
    drawer: HTMLDialogElement,
    options?: { dismissible?: boolean },
  ): () => void;
  export function initDrawers(root?: Document | HTMLElement): () => void;
}

declare module 'jenni-core/behaviors/combobox.js' {
  export function anchorCombobox(
    shell: HTMLElement,
    listbox: HTMLElement,
    options?: { side?: string },
  ): () => void;
  export function createCombobox(shell: HTMLElement, listbox: HTMLElement): () => void;
  export function initComboboxes(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/context-menu.js' {
  export interface ContextMenuOptions {
    loop?: boolean;
    manageChecked?: boolean;
  }
  export interface ContextMenuOpenAtOptions {
    keyboard?: boolean;
    anchor?: HTMLElement | null;
    returnFocusTo?: HTMLElement | null;
  }
  export interface ContextMenuOpenForOptions {
    keyboard?: boolean;
    align?: 'point' | 'bottom-start';
    returnFocusTo?: HTMLElement | null;
  }
  export interface ContextMenuEventLike {
    nativeEvent?: Event;
    preventDefault: () => void;
    currentTarget?: EventTarget | null;
    target?: EventTarget | null;
    clientX?: number;
    clientY?: number;
  }
  export interface ContextMenuMethods {
    openAt: (x: number, y: number, opts?: ContextMenuOpenAtOptions | boolean) => void;
    openFor: (anchorEl: HTMLElement, opts?: ContextMenuOpenForOptions) => void;
    openFromEvent: (e: MouseEvent | KeyboardEvent | ContextMenuEventLike) => void;
    close: () => void;
    isOpen: () => boolean;
    destroy: () => void;
  }
  export type ContextMenuController = (() => void) & ContextMenuMethods;
  export function createContextMenu(
    target: HTMLElement | null | undefined,
    menu: HTMLElement,
    options?: ContextMenuOptions,
  ): ContextMenuController;
  export function initContextMenus(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/hover-card.js' {
  export interface HoverCardOptions {
    openDelay?: number;
    closeDelay?: number;
    side?: string;
  }
  export interface HoverCardController {
    show: () => void;
    hide: () => void;
    destroy: () => void;
  }
  export function createHoverCard(
    trigger: HTMLElement,
    card: HTMLElement,
    options?: HoverCardOptions,
  ): HoverCardController;
  export function initHoverCards(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/command-palette.js' {
  export interface CommandSelectDetail {
    value: string;
    label: string;
    item: HTMLElement;
  }
  export interface CommandPaletteOptions {
    shortcut?: string | false;
    closeOnSelect?: boolean;
    dismissible?: boolean;
    loop?: boolean;
    manageFilter?: boolean;
    onSelect?: (detail: CommandSelectDetail) => void;
    onOpenChange?: (open: boolean) => void;
    onQueryChange?: (query: string) => void;
  }
  export interface CommandPaletteController {
    open: () => void;
    close: () => void;
    toggle: () => void;
    isOpen: () => boolean;
    setQuery: (query: string) => void;
    refresh: () => void;
    destroy: () => void;
  }
  export function bindCommandShortcut(
    key: string,
    handler: (e: KeyboardEvent) => void,
  ): () => void;
  export function createCommandPalette(
    el: HTMLElement,
    opts?: CommandPaletteOptions,
  ): CommandPaletteController;
  export function initCommandPalettes(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/theme.js' {
  export interface ChartPalette {
    series: [string, string, string, string, string, string, string, string];
    grid: string;
    axis: string;
    crosshair: string;
    tooltipBg: string;
    tooltipBorder: string;
  }
  export interface SyntaxTheme {
    isDark: boolean;
    bg: string;
    fg: string;
    gutterBg: string;
    gutterFg: string;
    lineActive: string;
    selection: string;
    cursor: string;
    keyword: string;
    string: string;
    number: string;
    function: string;
    type: string;
    variable: string;
    property: string;
    operator: string;
    punctuation: string;
    comment: string;
    constant: string;
    tag: string;
    attr: string;
    regexp: string;
    added: string;
    deleted: string;
  }
  export interface TerminalTheme {
    background: string;
    foreground: string;
    cursor: string;
    cursorAccent: string;
    selectionBackground: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  }
  export type ThemeDensity = 'compact' | 'default' | 'comfortable';
  export interface ThemeTokens {
    isDark: boolean;
    density: ThemeDensity;
    bg: string;
    fg: string;
    fgMuted: string;
    fgSubtle: string;
    surface1: string;
    surface2: string;
    surface3: string;
    border: string;
    borderStrong: string;
    accent: string;
    accentHover: string;
    accentSoft: string;
    danger: string;
    success: string;
    warning: string;
    info: string;
    charts: ChartPalette;
    syntax: SyntaxTheme;
    terminal: TerminalTheme;
  }
  export interface OnThemeChangeOptions {
    root?: HTMLElement;
    immediate?: boolean;
  }
  export function resolveCssColor(cssValueOrVarName: string, root?: HTMLElement): string;
  export function getChartPalette(root?: HTMLElement): ChartPalette;
  export function getSyntaxTheme(root?: HTMLElement): SyntaxTheme;
  export function getTerminalTheme(root?: HTMLElement): TerminalTheme;
  export const getXtermTheme: typeof getTerminalTheme;
  export function getThemeTokens(root?: HTMLElement): ThemeTokens;
  export function onThemeChange(
    callback: (tokens: ThemeTokens) => void,
    options?: OnThemeChangeOptions,
  ): () => void;
}

declare module 'jenni-core/behaviors/shortcuts.js' {
  export type ShortcutHandler = (e: KeyboardEvent) => void;
  export interface ShortcutOptions {
    scope?: HTMLElement | null | (() => HTMLElement | null | undefined);
    priority?: number;
    enabled?: boolean | (() => boolean);
    preventDefault?: boolean;
    stopPropagation?: boolean;
    allowInInputs?: boolean;
    allowModInInputs?: boolean;
    allowInTerminal?: boolean;
    globalModal?: boolean;
    allowRepeat?: boolean;
    sequenceTimeout?: number;
    description?: string;
  }
  export interface FormatShortcutOptions {
    mac?: boolean;
  }
  export interface ShortcutRegistry {
    register: (
      combo: string | readonly string[],
      handler: ShortcutHandler,
      options?: ShortcutOptions,
    ) => () => void;
    unregisterAll: () => void;
    clear: () => void;
    destroy: () => void;
    format: (combo: string, options?: FormatShortcutOptions) => string[];
    isElementActiveAndVisible: (el: HTMLElement | null | undefined) => boolean;
  }
  export function isElementActiveAndVisible(el: HTMLElement | null | undefined): boolean;
  export function formatShortcut(combo: string, options?: FormatShortcutOptions): string[];
  export function createShortcutRegistry(root?: Document | HTMLElement | null): ShortcutRegistry;
  export const shortcuts: ShortcutRegistry;
  export function registerShortcut(
    combo: string | readonly string[],
    handler: ShortcutHandler,
    options?: ShortcutOptions,
  ): () => void;
}
