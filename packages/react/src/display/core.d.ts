declare module '@jenni/core/behaviors/table.js' {
  export function createDataTable(root: HTMLElement): () => void;
  export function initDataTables(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/stepper.js' {
  export function createStepper(root: HTMLElement): () => void;
  export function initSteppers(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/tree-view.js' {
  export type TreeKeyActionType = 'focus' | 'expand' | 'collapse' | 'select';
  export interface TreeKeyResult {
    action: TreeKeyActionType;
    item: HTMLElement;
  }
  export function getVisibleTreeItems(tree: HTMLElement): HTMLElement[];
  export function treeKeydown(tree: HTMLElement, event: KeyboardEvent): TreeKeyResult | null;
  export function createTreeView(root: HTMLElement): () => void;
  export function initTreeViews(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/carousel.js' {
  export function createCarousel(root: HTMLElement): () => void;
  export function initCarousels(root?: ParentNode): () => void;
}
