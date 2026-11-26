/// <reference path="./core.d.ts" />
/// <reference path="./entity-color-core.d.ts" />
// Shared prop types for the display group.
import type { InjectionKey } from 'vue';

export type JDisplayTone = 'accent' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';
export type JDisplaySize = 'sm' | 'md' | 'lg';

export interface JBadgeProps {
  variant?: 'soft' | 'solid' | 'outline';
  size?: JDisplaySize;
  tone?: JDisplayTone;
  /** Show a leading status dot. */
  dot?: boolean;
  /** Render a trailing `×` remove button and emit `remove`. */
  removable?: boolean;
  /** Alias for `removable`. */
  closable?: boolean;
  /** Accessible label for the remove button (default: 'Remove'). */
  removeLabel?: string;
  /** Deterministic per-entity color seed (`true` hashes badge text). */
  colorSeed?: string | boolean;
  /** Alias for `colorSeed={true}`. */
  autoColor?: boolean;
}

export type JAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type JAvatarStatus = 'online' | 'busy' | 'away' | 'offline';

export interface JAvatarProps {
  src?: string;
  alt?: string;
  /** Full name — used for initials and as default alt text. */
  name?: string;
  /** Override computed initials. */
  initials?: string;
  size?: JAvatarSize;
  shape?: 'circle' | 'square';
  tone?: JDisplayTone;
  status?: JAvatarStatus;
  /** Deterministic per-author/entity color seed (`true` hashes `name || initials || alt`). */
  colorSeed?: string | boolean;
  /** Alias for `colorSeed={true}`. */
  autoColor?: boolean;
}

export interface JAvatarGroupProps {
  size?: JAvatarSize;
  /** Show at most this many avatars, then a "+N" chip. */
  max?: number;
  /** Total count when not all avatars are rendered (for the "+N" chip). */
  total?: number;
}

export interface JCardProps {
  /** Element to render. `a` and `button` make the card interactive. */
  as?: string;
  variant?: 'surface' | 'outline' | 'ghost' | 'elevated';
  size?: JDisplaySize;
  title?: string;
  description?: string;
  /** Force the interactive hover state (e.g. a clickable div). */
  interactive?: boolean;
  /** Footer on a tinted band with a top border. */
  footerDivider?: boolean;
  /** Remove `.j-card__body` padding for edge-to-edge grids, lists, editors, or terminals. */
  flush?: boolean;
  /** Alias for `flush`. */
  bodyFlush?: boolean;
}

export interface JAlertProps {
  variant?: 'soft' | 'outline';
  tone?: JDisplayTone;
  title?: string;
  description?: string;
  /** `false` hides the icon. Default: a tone-matched icon. */
  icon?: boolean;
}

export type JSpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
export type JSpinnerVariant = 'ring' | 'arc' | 'dots';

export interface JSpinnerProps {
  size?: JSpinnerSize;
  variant?: JSpinnerVariant;
  tone?: JDisplayTone;
  /** Custom SVG stroke width (default calibrated optically). */
  thickness?: number | string;
  /** Accessible label. */
  label?: string;
}

export interface ProgressSegment {
  value: number;
  tone?: JDisplayTone;
  color?: string;
  colorSeed?: string;
  label?: string;
}

export type JProgressSegment = ProgressSegment;

export interface JProgressProps {
  /** Omit (or null) for indeterminate. */
  value?: number | null;
  max?: number;
  size?: JDisplaySize;
  tone?: JDisplayTone;
  label?: string;
  /** Multi-segment stacked progress items. */
  segments?: ProgressSegment[];
  /** Discrete stepped progress cells. */
  steps?: number;
}

export interface JSkeletonProps {
  shape?: 'rect' | 'text' | 'circle';
  width?: string | number;
  height?: string | number;
  /** Render N text lines (last one shorter). */
  lines?: number;
}

export interface JKbdProps {
  size?: JDisplaySize;
}

export interface JSeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  align?: 'start' | 'center' | 'end';
  /** Purely visual — hidden from assistive tech. */
  decorative?: boolean;
}

export type JAccordionVariant = 'divided' | 'card' | 'separated' | 'ghost';

export interface JAccordionProps {
  variant?: JAccordionVariant;
  size?: JDisplaySize;
  /** Allow multiple items open simultaneously. */
  multiple?: boolean;
  /** In single-open mode, allow closing the active item (default: true). */
  collapsible?: boolean;
  /** Initial open item value(s) when uncontrolled. */
  defaultValue?: string | string[];
  /** Optional native `<details name>` group identifier. */
  name?: string;
}

export interface JAccordionItemProps {
  /** Unique item key within the accordion. */
  value?: string;
  title?: string;
  subtitle?: string;
  /** Initial open state when used standalone or uncontrolled. */
  defaultOpen?: boolean;
  disabled?: boolean;
}

export interface JAccordionContext {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  registerDefault: (value: string) => void;
}

export const ACCORDION_KEY: InjectionKey<JAccordionContext> = Symbol('JAccordion');

export type JCollapsibleVariant = 'ghost' | 'card' | 'subtle';

export interface JCollapsibleProps {
  variant?: JCollapsibleVariant;
  size?: JDisplaySize;
  title?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
}

export type JBreadcrumbSeparator = 'chevron' | 'slash';

export interface JBreadcrumbProps {
  separator?: JBreadcrumbSeparator;
  /** Alias for `separator`. */
  variant?: JBreadcrumbSeparator;
  size?: 'sm' | 'md';
  /** Accessible `<nav>` label (default: 'Breadcrumb'). */
  label?: string;
  /** Collapse middle items behind an interactive `…` button when count exceeds `maxItems`. */
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
}

export interface JBreadcrumbItemProps {
  href?: string;
  /** Marks the active destination (`aria-current="page"`). */
  current?: boolean;
  /** Renders a collapsed `…` trigger button. */
  ellipsis?: boolean;
  /** Accessible label for ellipsis trigger. */
  label?: string;
}

export type JPaginationVariant = 'outline' | 'soft' | 'solid' | 'simple';

export interface JPaginationProps {
  /** Total item count (used with `pageSize` when `totalPages` is omitted). */
  total?: number;
  /** Items per page (default: 10). */
  pageSize?: number;
  /** Explicit page count (overrides `total / pageSize`). */
  totalPages?: number;
  /** Initial 1-indexed page when uncontrolled. */
  defaultPage?: number;
  /** Sibling pages shown on each side of active page (default: 1). */
  siblingCount?: number;
  /** Boundary pages pinned at start and end (default: 1). */
  boundaryCount?: number;
  variant?: JPaginationVariant;
  size?: 'sm' | 'md';
  tone?: JDisplayTone;
  /** Show text labels next to Previous / Next chevrons. */
  showLabels?: boolean;
  disabled?: boolean;
  /** Accessible `<nav>` label (default: 'Pagination'). */
  label?: string;
}

export type JEmptyStateVariant = 'surface' | 'dashed' | 'ghost';

export interface JEmptyStateProps {
  variant?: JEmptyStateVariant;
  size?: JDisplaySize;
  tone?: JDisplayTone;
  title?: string;
  description?: string;
}

/* ---- Table & Data Table ---- */

export type JTableVariant = 'surface' | 'outline' | 'striped' | 'plain';
export type JTableAlign = 'start' | 'center' | 'end';
export type JTableSortDirection = 'asc' | 'desc';

export interface JTableProps {
  variant?: JTableVariant;
  size?: JDisplaySize;
  hover?: boolean;
  stickyHeader?: boolean;
  pinFirst?: boolean;
  pinLast?: boolean;
  caption?: string;
  maxHeight?: string | number;
}

export interface JDataTableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: JTableAlign;
  numeric?: boolean;
  width?: string | number;
  pin?: 'start' | 'end';
  format?: (value: any, row: T, index: number) => string;
}

export interface JDataTableProps<T = any> {
  columns: JDataTableColumn<T>[];
  rows: T[];
  rowKey?: string | ((row: T, index: number) => string | number);
  selectable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  variant?: JTableVariant;
  size?: JDisplaySize;
  hover?: boolean;
  stickyHeader?: boolean;
  pinFirst?: boolean;
  pinLast?: boolean;
  maxHeight?: string | number;
  emptyTitle?: string;
  emptyDescription?: string;
  caption?: string;
}

/* ---- Stepper ---- */

export type JStepStatus = 'complete' | 'current' | 'upcoming' | 'error';
export type JStepperOrientation = 'horizontal' | 'vertical';

export interface JStepItem {
  title: string;
  description?: string;
  status?: JStepStatus;
  disabled?: boolean;
}

export interface JStepperProps {
  steps?: JStepItem[];
  defaultValue?: number;
  orientation?: JStepperOrientation;
  size?: JDisplaySize;
  tone?: JDisplayTone;
  clickable?: boolean;
  linear?: boolean;
  label?: string;
}

export interface JStepProps {
  index?: number;
  title?: string;
  description?: string;
  status?: JStepStatus;
  disabled?: boolean;
}

export interface JStepperContext {
  currentStep: () => number;
  clickable: () => boolean;
  canSelect: (index: number, disabled?: boolean) => boolean;
  selectStep: (index: number, disabled?: boolean) => void;
  claimIndex: (id: string) => number;
  releaseIndex: (id: string) => void;
}

export const STEPPER_KEY: InjectionKey<JStepperContext> = Symbol('JStepper');

/* ---- Tree View ---- */

export interface JTreeNode {
  id: string;
  label: string;
  icon?: 'folder' | 'file' | string;
  meta?: string;
  disabled?: boolean;
  /** Marks a node whose children are loaded asynchronously on first expand. */
  lazy?: boolean;
  /** Alias indicating this node has expandable children even before `children` are loaded. */
  hasChildren?: boolean;
  /** Explicit loading spinner override for this node. */
  loading?: boolean;
  children?: JTreeNode[];
}

export interface JTreeViewProps {
  nodes?: JTreeNode[];
  multiple?: boolean;
  guides?: boolean;
  size?: JDisplaySize;
  tone?: JDisplayTone;
  label?: string;
  defaultValue?: string | string[];
  defaultExpanded?: string[];
  expandOnClick?: boolean;
  /** Async loader invoked when expanding a `lazy` / `hasChildren` node whose children haven't loaded yet. */
  loadChildren?: (node: JTreeNode) => Promise<JTreeNode[] | void>;
}

export interface JTreeItemProps {
  value?: string;
  label?: string;
  icon?: 'folder' | 'file' | string;
  meta?: string;
  disabled?: boolean;
  defaultExpanded?: boolean;
  lazy?: boolean;
  hasChildren?: boolean;
  loading?: boolean;
  node?: JTreeNode;
}

export interface JTreeViewContext {
  isSelected: (value: string) => boolean;
  isExpanded: (value: string) => boolean;
  isFocusable: (value: string) => boolean;
  isLoading: (value: string) => boolean;
  getLoadedChildren: (value: string) => JTreeNode[] | undefined;
  hasLazyLoader: () => boolean;
  expandOnClick: () => boolean;
  registerNode: (value: string, node: JTreeNode) => void;
  unregisterNode: (value: string) => void;
  select: (value: string) => void;
  toggleExpand: (value: string, force?: boolean, node?: JTreeNode) => void | Promise<void>;
  registerDefaultExpanded: (value: string) => void;
  setFocused: (value: string) => void;
  ensureInitialFocus: (value: string) => void;
}

export const TREE_VIEW_KEY: InjectionKey<JTreeViewContext> = Symbol('JTreeView');

/* ---- Carousel ---- */

export type JCarouselOrientation = 'horizontal' | 'vertical';
export type JCarouselArrows = boolean | 'floating' | 'footer';

export interface JCarouselProps {
  defaultValue?: number;
  slidesPerView?: number;
  gap?: string | number;
  loop?: boolean;
  autoplay?: boolean | number;
  arrows?: JCarouselArrows;
  dots?: boolean;
  showCounter?: boolean;
  orientation?: JCarouselOrientation;
  tone?: JDisplayTone;
  height?: string | number;
  label?: string;
}

export interface JCarouselSlideProps {
  label?: string;
  index?: number;
}

export interface JCarouselContext {
  registerSlide: (id: string) => number;
  unregisterSlide: (id: string) => void;
  totalSlides: () => number;
}

export const CAROUSEL_KEY: InjectionKey<JCarouselContext> = Symbol('JCarousel');
