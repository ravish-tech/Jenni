/// <reference path="./core.d.ts" />
import type { InjectionKey } from 'vue';
import type { ResizableGroupController } from 'jenni-core/behaviors/resizable.js';
import type { ScrollAreaState } from 'jenni-core/behaviors/scroll-area.js';

export type { ScrollAreaState };
export type ResizableGroupHandle = ResizableGroupController;

export type JGap = 'none' | 'inline' | 'related' | 'item' | 'field' | 'group' | 'section';
export type JAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type JJustify = 'start' | 'center' | 'end' | 'between';
export type JContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'prose' | 'full';
export type JPageSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type JGridCols =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  | 'auto-fit'
  | 'auto-fill';
export type JGridSpan =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  | 'full'
  | 'auto';
export type JGridStart =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export type JGridRowSpan = 1 | 2 | 3 | 4 | 5 | 6 | '1' | '2' | '3' | '4' | '5' | '6' | 'full';
export type JGridFlow = 'row' | 'dense' | 'col';
export type JGridOrder = 'first' | 'last' | 1 | 2 | 3 | '1' | '2' | '3';
export type JGridSubgrid = boolean | 'rows' | 'cols' | 'both';

export type JListVariant = 'plain' | 'divided' | 'card';
export type JListLines = 'compact' | 1 | 2 | 3 | '1' | '2' | '3';
export type JLayoutTone = 'accent' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';

export type JSectionLayout = 'stack' | 'split';
export type JBottomBarVariant = 'tabs' | 'actions';

export type JShellLayout =
  | 'sidebar'
  | 'header-sidebar'
  | 'centered'
  | 'focus'
  | 'bars'
  | 'workspace'
  | 'studio'
  | 'ide'
  | 'copilot'
  | 'split'
  | 'dual-nav'
  | 'topnav'
  | 'three-pane'
  | 'holy-grail'
  | 'command-center'
  | 'floating-dock'
  | 'adaptive';
export type JShellVariant = 'flat' | 'inset' | 'floating' | 'contrast';
export type JShellPane = 'master' | 'detail';
export type JShellSide = 'start' | 'end';

export type JBentoSpan = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12 | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '12';
export type JBentoRowSpan = 1 | 2 | 3 | '1' | '2' | '3';
export type JCanvasGrid = 'none' | 'dots' | 'lines';
export type JCanvasToolsPlacement = 'left' | 'bottom';
export type JScrollOrientation = 'vertical' | 'horizontal' | 'both';
export type JScrollbarVisibility = 'subtle' | 'hover' | 'hidden';
export type JResizableOrientation = 'horizontal' | 'vertical';

export const attr = <T extends string>(value: T | undefined, fallback?: T): T | undefined =>
  value === fallback ? undefined : value;

export interface JStackProps {
  as?: string | object;
  gap?: JGap;
  align?: JAlign;
  justify?: JJustify;
}

export interface JInlineProps {
  as?: string | object;
  gap?: JGap;
  align?: JAlign;
  justify?: JJustify;
  nowrap?: boolean;
}

export interface JGridProps {
  as?: string | object;
  cols?: JGridCols;
  minCellWidth?: string | number;
  gap?: JGap;
  colGap?: JGap;
  rowGap?: JGap;
  flow?: JGridFlow;
  align?: JAlign;
  justify?: JJustify;
  container?: boolean;
  guides?: boolean;
}

export interface JColProps {
  as?: string | object;
  span?: JGridSpan;
  sm?: JGridSpan;
  md?: JGridSpan;
  lg?: JGridSpan;
  start?: JGridStart;
  rowSpan?: JGridRowSpan;
  order?: JGridOrder;
  align?: JAlign;
  subgrid?: JGridSubgrid;
}

export type JGridItemProps = JColProps;

export interface JContainerProps {
  as?: string | object;
  size?: JContainerSize;
  padded?: boolean;
}

export interface JListProps {
  as?: string | object;
  variant?: JListVariant;
  lines?: JListLines;
  insetDivider?: boolean;
  tone?: JLayoutTone;
}

export interface JListItemProps {
  as?: string | object;
  title?: string;
  description?: string;
  lines?: JListLines;
  interactive?: boolean;
  selected?: boolean;
  current?: boolean | 'page';
  disabled?: boolean;
  tone?: JLayoutTone;
}

export interface JPageProps {
  as?: string | object;
  size?: JPageSize;
}

export interface JPageHeaderProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  bordered?: boolean;
}

export interface JSectionProps {
  as?: string | object;
  title?: string;
  description?: string;
  layout?: JSectionLayout;
  bordered?: boolean;
}

export interface JSidebarProps {
  as?: string | object;
  tone?: JLayoutTone;
  ariaLabel?: string;
}

export interface JSidebarGroupProps {
  label?: string;
}

export interface JSidebarItemProps {
  as?: string | object;
  label?: string;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
}

export interface JTopBarProps {
  as?: string | object;
  sticky?: boolean;
  translucent?: boolean;
}

export interface JBottomBarProps {
  as?: string | object;
  variant?: JBottomBarVariant;
  sticky?: boolean;
  translucent?: boolean;
  tone?: JLayoutTone;
}

export interface JBottomBarItemProps {
  as?: string | object;
  label?: string;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
}

export interface JAppShellProps {
  layout?: JShellLayout;
  variant?: JShellVariant;
  sidebarSide?: JShellSide;
  embedded?: boolean;
  height?: string | number;
  dockHeight?: string | number;
  asideWidth?: string | number;
  railLabel?: string;
  subnavLabel?: string;
  asideLabel?: string;
  dockLabel?: string;
  bannerLabel?: string;
  masterLabel?: string;
}

export interface JAppShellHandle {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: (next?: boolean) => void;
  toggleDock: (next?: boolean) => void;
  toggleAside: (next?: boolean) => void;
  closeAside: () => void;
  setActivePane: (pane: JShellPane) => void;
  readonly element: HTMLElement | null;
}

export interface JBentoProps {
  as?: string | object;
  gap?: JGap;
  rowMinHeight?: string | number;
}

export interface JBentoCellProps {
  as?: string | object;
  span?: JBentoSpan;
  rowSpan?: JBentoRowSpan;
  surface?: boolean;
}

export interface JBoardProps {
  as?: string | object;
  gap?: JGap;
  columnWidth?: string | number;
}

export interface JBoardColumnProps {
  as?: string | object;
  title?: string;
  count?: number | string;
  tone?: JLayoutTone;
  dot?: boolean;
}

export interface JDocsLayoutProps {
  as?: string | object;
  tocTitle?: string;
  embedded?: boolean;
  height?: string | number;
}

export interface JAuthSplitProps {
  as?: string | object;
  reverse?: boolean;
  stackShowcase?: boolean;
  embedded?: boolean;
  height?: string | number;
}

export interface JAiCanvasProps {
  as?: string | object;
  artifactTitle?: string;
  embedded?: boolean;
  height?: string | number;
}

export interface JCanvasStageProps {
  as?: string | object;
  grid?: JCanvasGrid;
  toolsPlacement?: JCanvasToolsPlacement;
  inspectorOpen?: boolean;
  embedded?: boolean;
  height?: string | number;
}

export interface JScrollAreaProps {
  as?: string | object;
  orientation?: JScrollOrientation;
  scrollbar?: JScrollbarVisibility;
  fade?: boolean;
  fadeSize?: string | number;
  maxHeight?: string | number;
  maxWidth?: string | number;
  height?: string | number;
  width?: string | number;
  bordered?: boolean;
}

export interface JResizableGroupProps {
  as?: string | object;
  orientation?: JResizableOrientation;
  autoSaveId?: string;
  step?: number;
  bordered?: boolean;
  height?: string | number;
  width?: string | number;
}

export interface JResizablePanelProps {
  as?: string | object;
  id?: string;
  defaultSize?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
  collapsible?: boolean;
  collapsedSize?: number | string;
}

export interface JResizableHandleProps {
  withGrip?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface ResizableGroupContextValue {
  getController: () => ResizableGroupController | null;
}

export const ResizableGroupKey: InjectionKey<ResizableGroupContextValue> =
  Symbol('JResizableGroup');
