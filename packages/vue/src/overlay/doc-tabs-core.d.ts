declare module 'jenni-core/behaviors/doc-tabs.js' {
  export interface DocTabsOverflowState {
    hasOverflow: boolean;
    overflowStart: boolean;
    overflowEnd: boolean;
    hiddenCount: number;
  }

  export interface DocTabsOptions {
    reorderable?: boolean;
    middleClickClose?: boolean;
    activation?: 'automatic' | 'manual';
    onSelect?: (id: string, tab: HTMLElement) => void;
    onClose?: (id: string, tab: HTMLElement) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    onOverflowChange?: (state: DocTabsOverflowState) => void;
  }

  export interface DocTabsController {
    getState: () => DocTabsOverflowState;
    sync: () => void;
    scrollActiveIntoView: (instant?: boolean) => void;
    destroy: () => void;
  }

  export function getDocTabElements(scroller: HTMLElement): HTMLElement[];
  export function createDocTabs(root: HTMLElement, options?: DocTabsOptions): DocTabsController;
  export function initDocTabs(root?: ParentNode): () => void;
}
