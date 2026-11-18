declare module 'jenni-core/behaviors/shell.js' {
  export interface ShellOptions {
    onOpenChange?: (open: boolean) => void;
    onAsideOpenChange?: (open: boolean) => void;
    onAsideDrawerChange?: (open: boolean) => void;
    onDockOpenChange?: (open: boolean) => void;
    onEffectiveAsideChange?: (open: boolean) => void;
  }
  export interface ShellController {
    isOpen: () => boolean;
    open: () => void;
    close: () => void;
    toggle: (next?: boolean) => void;
    isAsideDrawerOpen: () => boolean;
    toggleAsideDrawer: (next?: boolean) => void;
    toggleAside: (next?: boolean) => void;
    toggleDock: (force?: boolean) => boolean;
    isEffectiveAsideOpen: () => boolean;
    destroy: () => void;
  }
  export function createShell(shell: HTMLElement, options?: ShellOptions): ShellController;
  export function initShells(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/scroll-area.js' {
  export interface ScrollAreaState {
    canScrollStart: boolean;
    canScrollEnd: boolean;
    canScrollInlineStart: boolean;
    canScrollInlineEnd: boolean;
  }
  export interface ScrollAreaOptions {
    onStateChange?: (state: ScrollAreaState) => void;
  }
  export interface ScrollAreaController {
    getState: () => ScrollAreaState;
    update: () => void;
    scrollTo: (options: ScrollToOptions) => void;
    destroy: () => void;
  }
  export function createScrollArea(el: HTMLElement, options?: ScrollAreaOptions): ScrollAreaController;
  export function initScrollAreas(root?: ParentNode): () => void;
}

declare module 'jenni-core/behaviors/resizable.js' {
  export interface ResizableGroupOptions {
    orientation?: 'horizontal' | 'vertical';
    autoSaveId?: string;
    storageKey?: string;
    step?: number;
    onLayout?: (sizes: number[]) => void;
    onPanelCollapse?: (panelId: string, collapsed: boolean) => void;
  }
  export interface ResizableGroupController {
    getLayout: () => number[];
    setLayout: (sizes: number[]) => void;
    collapsePanel: (idOrIndex: string | number) => void;
    expandPanel: (idOrIndex: string | number) => void;
    togglePanel: (idOrIndex: string | number) => boolean;
    isPanelCollapsed: (idOrIndex: string | number) => boolean;
    resetLayout: () => void;
    refresh: () => void;
    destroy: () => void;
  }
  export function createResizableGroup(
    root: HTMLElement,
    opts?: ResizableGroupOptions,
  ): ResizableGroupController;
  export function initResizableGroups(root?: ParentNode): () => void;
}
