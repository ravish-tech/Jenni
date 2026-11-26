<script setup lang="ts">
import JTimelineItem, { type TimelineLine, type TimelineTone } from './JTimelineItem.vue';

export type TimelineSize = 'sm' | 'md';

export interface TimelineEntry {
  id?: string | number;
  title?: string;
  time?: string;
  description?: string;
  tone?: TimelineTone;
  icon?: string;
  active?: boolean;
  line?: TimelineLine;
}

export interface JTimelineProps {
  /** Compact (`sm`) or default (`md`) event spacing and typography. */
  size?: TimelineSize;
  /** Connector rail style across items. */
  line?: TimelineLine;
  /** Optional data-driven shorthand items. */
  items?: TimelineEntry[];
}

defineOptions({ name: 'JTimeline' });

withDefaults(defineProps<JTimelineProps>(), {
  size: 'md',
  line: 'solid',
});
</script>

<template>
  <ol
    class="j-timeline"
    :data-size="size === 'md' ? undefined : size"
    :data-line="line === 'solid' ? undefined : line"
  >
    <template v-if="items && items.length">
      <JTimelineItem
        v-for="(entry, idx) in items"
        :key="entry.id ?? idx"
        :title="entry.title"
        :time="entry.time"
        :description="entry.description"
        :tone="entry.tone"
        :icon="entry.icon"
        :active="entry.active"
        :line="entry.line"
      />
    </template>
    <slot v-else />
  </ol>
</template>
