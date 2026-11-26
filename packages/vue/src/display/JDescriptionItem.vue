<script setup lang="ts">
export type DescriptionItemSpan = 1 | 2 | 3;

export interface JDescriptionItemProps {
  /** Metadata key / label. */
  term?: string;
  /** Metadata value when default slot is omitted. */
  details?: string | number;
  /** Render value in monospace with `tabular-nums`. */
  mono?: boolean;
  /** Column span (1..3) when parent `JDescriptionList` uses `layout="grid"`. */
  span?: DescriptionItemSpan;
}

defineOptions({ name: 'JDescriptionItem' });

withDefaults(defineProps<JDescriptionItemProps>(), {
  mono: false,
});
</script>

<template>
  <div
    class="j-dl__item"
    :data-mono="mono ? '' : undefined"
    :data-span="span && span > 1 ? String(span) : undefined"
  >
    <dt class="j-dl__term">
      <slot name="term">{{ term }}</slot>
    </dt>
    <dd class="j-dl__details">
      <slot>{{ details }}</slot>
    </dd>
  </div>
</template>
