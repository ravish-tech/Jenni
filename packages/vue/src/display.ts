// Group index for "display" components.
export { default as JIcon, type JIconProps } from './display/JIcon.vue';
export {
  JIconKey,
  provideIcons,
  registerIcons,
  clearRegisteredIcons,
  resolveIcon,
  parseSvgIcon,
  listBuiltinIcons,
  BUILTIN_ICONS,
  type JIconSize,
  type JIconPresetSize,
  type JIconTone,
  type JIconResolver,
  type JIconSource,
} from './display/icon-context';
export {
  ENTITY_HUE_RING,
  hashEntitySeed,
  getEntityHue,
  getEntityColorVars,
} from 'jenni-core/behaviors/entity-color.js';
export { default as JBadge } from './display/JBadge.vue';
export { default as JAvatar } from './display/JAvatar.vue';
export { default as JAvatarGroup } from './display/JAvatarGroup.vue';
export { default as JCard } from './display/JCard.vue';
export { default as JAlert } from './display/JAlert.vue';
export { default as JSpinner } from './display/JSpinner.vue';
export { default as JProgress } from './display/JProgress.vue';
export {
  default as JSparkline,
  type JSparklineProps,
  type JSparklineVariant,
  type JSparklineTone,
} from './display/JSparkline.vue';
export { computeSparkline } from 'jenni-core/behaviors/sparkline.js';
export { default as JSkeleton } from './display/JSkeleton.vue';
export { default as JKbd } from './display/JKbd.vue';
export { default as JSeparator } from './display/JSeparator.vue';
export { default as JAccordion } from './display/JAccordion.vue';
export { default as JAccordionItem } from './display/JAccordionItem.vue';
export { default as JCollapsible } from './display/JCollapsible.vue';
export { default as JBreadcrumb } from './display/JBreadcrumb.vue';
export { default as JBreadcrumbItem } from './display/JBreadcrumbItem.vue';
export { default as JPagination } from './display/JPagination.vue';
export { default as JEmptyState } from './display/JEmptyState.vue';
export { default as JTable, type JTableHandle } from './display/JTable.vue';
export { default as JTableSection, type JTableSectionProps } from './display/JTableSection.vue';
export { default as JDataTable } from './display/JDataTable.vue';
export {
  default as JVirtualList,
  type JVirtualListProps,
  type JVirtualListHandle,
  type VirtualScrollAlign,
  type VirtualizerState,
} from './display/JVirtualList.vue';
export {
  default as JDataGrid,
  type JDataGridProps,
  type JDataGridHandle,
  type JDataGridColumn,
  type JDataGridSort,
  type DataGridColumn,
  type DataGridSort,
  type DataGridSelectable,
  type DataGridAlign,
  type DataGridSortDirection,
} from './display/JDataGrid.vue';
export { default as JStepper } from './display/JStepper.vue';
export { default as JStep } from './display/JStep.vue';
export { default as JTreeView } from './display/JTreeView.vue';
export { default as JTreeItem } from './display/JTreeItem.vue';
export { default as JCarousel } from './display/JCarousel.vue';
export { default as JCarouselSlide } from './display/JCarouselSlide.vue';
export {
  default as JBanner,
  type JBannerProps,
  type BannerTone,
  type BannerVariant,
  type BannerAlign,
} from './display/JBanner.vue';
export {
  default as JCodeBlock,
  type JCodeBlockProps,
  type CodeBlockVariant,
} from './display/JCodeBlock.vue';
export {
  default as JCopyButton,
  type JCopyButtonProps,
  type CopyButtonSize,
  type CopyButtonVariant,
} from './display/JCopyButton.vue';
export {
  copyToClipboard,
  tokenizeCodeLines,
  normalizeCodeLanguage,
} from 'jenni-core/behaviors/code-block.js';
export {
  default as JDescriptionList,
  type JDescriptionListProps,
  type DescriptionListLayout,
  type DescriptionListVariant,
  type DescriptionListSize,
  type DescriptionListCols,
  type DescriptionListEntry,
} from './display/JDescriptionList.vue';
export {
  default as JDescriptionItem,
  type JDescriptionItemProps,
  type DescriptionItemSpan,
} from './display/JDescriptionItem.vue';
export {
  default as JProgressRing,
  type JProgressRingProps,
  type JProgressRingSize,
  type JProgressRingTone,
} from './display/JProgressRing.vue';
export {
  default as JStat,
  type JStatProps,
  type StatTrend,
  type StatVariant,
  type StatTrendTone,
  type StatSize,
} from './display/JStat.vue';
export {
  default as JStatGroup,
  type JStatGroupProps,
  type StatGroupCols,
  type StatGroupVariant,
} from './display/JStatGroup.vue';
export {
  default as JTimeline,
  type JTimelineProps,
  type TimelineSize,
  type TimelineEntry,
} from './display/JTimeline.vue';
export {
  default as JTimelineItem,
  type JTimelineItemProps,
  type TimelineTone,
  type TimelineLine,
} from './display/JTimelineItem.vue';
export type {
  JDisplayTone,
  JDisplaySize,
  JBadgeProps,
  JAvatarProps,
  JAvatarSize,
  JAvatarStatus,
  JAvatarGroupProps,
  JCardProps,
  JAlertProps,
  JSpinnerSize,
  JSpinnerVariant,
  JSpinnerProps,
  ProgressSegment,
  JProgressProps,
  JSkeletonProps,
  JKbdProps,
  JSeparatorProps,
  JAccordionVariant,
  JAccordionProps,
  JAccordionItemProps,
  JCollapsibleVariant,
  JCollapsibleProps,
  JBreadcrumbSeparator,
  JBreadcrumbProps,
  JBreadcrumbItemProps,
  JPaginationVariant,
  JPaginationProps,
  JEmptyStateVariant,
  JEmptyStateProps,
  JTableVariant,
  JTableAlign,
  JTableSortDirection,
  JTableProps,
  JDataTableColumn,
  JDataTableProps,
  JStepStatus,
  JStepperOrientation,
  JStepItem,
  JStepperProps,
  JStepProps,
  JTreeNode,
  JTreeViewProps,
  JTreeItemProps,
  JCarouselOrientation,
  JCarouselArrows,
  JCarouselProps,
  JCarouselSlideProps,
} from './display/types';
