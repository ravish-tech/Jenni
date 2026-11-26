<script setup lang="ts">
import { computed } from 'vue';
import JDescriptionItem, { type DescriptionItemSpan } from './JDescriptionItem.vue';

export type DescriptionListLayout = 'horizontal' | 'stacked' | 'grid';
export type DescriptionListVariant = 'divided' | 'striped' | 'bordered' | 'plain';
export type DescriptionListSize = 'sm' | 'md';
export type DescriptionListCols = 1 | 2 | 3;

export interface DescriptionListEntry {
  term: string;
  details: string | number;
  mono?: boolean;
  span?: DescriptionItemSpan;
}

export interface JDescriptionListProps {
  /** Key/value arrangement (`horizontal` | `stacked` | `grid`). */
  layout?: DescriptionListLayout;
  /** Column count when `layout="grid"` (`@container` responsive). */
  cols?: DescriptionListCols;
  /** Visual row/cell divider treatment. */
  variant?: DescriptionListVariant;
  /** Spacing & typographic density. */
  size?: DescriptionListSize;
  /** Fixed or flexible term column width in `horizontal` layout (`--j-dl-term-w`). */
  termWidth?: string | number;
  /** Optional data-driven shorthand items. */
  items?: DescriptionListEntry[];
}

defineOptions({ name: 'JDescriptionList' });

const props = withDefaults(defineProps<JDescriptionListProps>(), {
  layout: 'horizontal',
  variant: 'divided',
  size: 'md',
});

const rootStyle = computed<Record<string, string> | undefined>(() => {
  if (props.termWidth === undefined) return undefined;
  return {
    '--j-dl-term-w':
      typeof props.termWidth === 'number' ? `${props.termWidth}px` : props.termWidth,
  };
});
</script>

<template>
  <dl
    class="j-dl"
    :data-layout="layout === 'horizontal' ? undefined : layout"
    :data-cols="layout === 'grid' && cols ? String(cols) : undefined"
    :data-variant="variant === 'divided' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :style="rootStyle"
  >
    <template v-if="items && items.length">
      <JDescriptionItem
        v-for="(entry, idx) in items"
        :key="idx"
        :term="entry.term"
        :details="entry.details"
        :mono="entry.mono"
        :span="entry.span"
      />
    </template>
    <slot v-else />
  </dl>
</template>
