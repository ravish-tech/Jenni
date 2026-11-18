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
  export type ToastTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
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
    duration?: number;
    action?: ToastAction;
    closable?: boolean;
  }
  export interface ToastItem {
    id: string;
    title: string;
    description?: string;
    tone: ToastTone;
    duration: number;
    action?: ToastAction;
    closable: boolean;
    state: 'open' | 'closing';
    createdAt: number;
  }
  export interface ToastCallable {
    (input: string | ToastOptions, extra?: Partial<ToastOptions>): string;
    success: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    error: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    danger: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    warning: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    info: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    accent: (input: string | Omit<ToastOptions, 'tone'>, extra?: Partial<ToastOptions>) => string;
    dismiss: (id?: string) => void;
    pause: () => void;
    resume: () => void;
    subscribe: (listener: (list: ToastItem[]) => void) => () => void;
    getToasts: () => ToastItem[];
  }
  export const toast: ToastCallable;
  export function dismissToast(id?: string): void;
  export function pauseToasts(): void;
  export function resumeToasts(): void;
  export function subscribeToasts(listener: (list: ToastItem[]) => void): () => void;
  export function getToasts(): ToastItem[];
  export function registerToastHost(): () => void;
  export function promoteToaster(toaster: HTMLElement, hasToasts: boolean, repromote?: boolean): void;
  export function syncToasterLayout(toaster: HTMLElement, maxVisible?: number): void;
  export function bindToasterInteractions(toaster: HTMLElement, options?: { max?: number }): () => void;
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
  export function createContextMenu(
    target: HTMLElement,
    menu: HTMLElement,
    options?: ContextMenuOptions,
  ): () => void;
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
