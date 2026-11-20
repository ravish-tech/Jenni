// Group index for "display" components.
export {
  Icon,
  IconProvider,
  registerIcons,
  clearRegisteredIcons,
  resolveIcon,
  parseSvgIcon,
  listBuiltinIcons,
  BUILTIN_ICONS,
  type IconProps,
  type IconProviderProps,
  type IconSize,
  type IconPresetSize,
  type IconTone,
  type IconResolver,
  type IconSource,
} from './display/Icon';
export {
  ENTITY_HUE_RING,
  hashEntitySeed,
  getEntityHue,
  getEntityColorVars,
} from 'jenni-core/behaviors/entity-color.js';
export { Badge, type BadgeProps } from './display/Badge';
export { Avatar, AvatarGroup, type AvatarProps, type AvatarGroupProps, type AvatarSize, type AvatarStatus } from './display/Avatar';
export { Card, type CardProps } from './display/Card';
export { Alert, type AlertProps } from './display/Alert';
export { Spinner, type SpinnerProps } from './display/Spinner';
export { Progress, type ProgressProps } from './display/Progress';
export { Skeleton, type SkeletonProps } from './display/Skeleton';
export { Kbd, type KbdProps } from './display/Kbd';
export { Separator, type SeparatorProps } from './display/Separator';
export {
  Accordion,
  AccordionItem,
  Collapsible,
  type AccordionProps,
  type AccordionItemProps,
  type CollapsibleProps,
  type AccordionVariant,
  type CollapsibleVariant,
} from './display/Accordion';
export {
  Breadcrumb,
  BreadcrumbItem,
  type BreadcrumbProps,
  type BreadcrumbItemProps,
  type BreadcrumbSeparator,
} from './display/Breadcrumb';
export {
  Pagination,
  type PaginationProps,
  type PaginationVariant,
} from './display/Pagination';
export {
  EmptyState,
  type EmptyStateProps,
  type EmptyStateVariant,
} from './display/EmptyState';
export {
  Table,
  DataTable,
  type TableProps,
  type DataTableProps,
  type DataTableColumn,
  type TableVariant,
  type TableAlign,
  type TableSortDirection,
} from './display/Table';
export {
  VirtualList,
  type VirtualListProps,
  type VirtualListHandle,
  type VirtualScrollAlign,
  type VirtualizerState,
} from './display/VirtualList';
export {
  DataGrid,
  type DataGridProps,
  type DataGridHandle,
  type DataGridColumn,
  type DataGridSort,
  type DataGridSelectable,
  type DataGridAlign,
  type DataGridSortDirection,
  type DataGridCellRenderParams,
  type DataGridFooterRenderParams,
} from './display/DataGrid';
export {
  Stepper,
  Step,
  type StepperProps,
  type StepProps,
  type StepItem,
  type StepStatus,
  type StepperOrientation,
} from './display/Stepper';
export {
  TreeView,
  TreeItem,
  type TreeViewProps,
  type TreeItemProps,
  type TreeNode,
} from './display/TreeView';
export {
  Carousel,
  CarouselSlide,
  type CarouselProps,
  type CarouselSlideProps,
  type CarouselOrientation,
  type CarouselArrows,
} from './display/Carousel';
export type { DisplayTone, DisplaySize, ProgressSegment } from './display/types';
