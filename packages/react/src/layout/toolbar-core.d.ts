declare module 'jenni-core/behaviors/toolbar.js' {
  export interface ToolbarOptions {
    orientation?: 'horizontal' | 'vertical';
    loop?: boolean;
  }

  export function getToolbarItems(toolbar: HTMLElement): HTMLElement[];
  export function createToolbar(el: HTMLElement, options?: ToolbarOptions): () => void;
  export function initToolbars(root?: ParentNode): () => void;
}
