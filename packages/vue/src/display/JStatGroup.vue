<script setup lang="ts">
export type StatGroupCols = 2 | 3 | 4;
export type StatGroupVariant = 'cards' | 'divided';

export interface JStatGroupProps {
  /** Target column count at full container width (`@container` responsive). */
  cols?: StatGroupCols;
  /** Separate cards or a unified surface strip with 1px internal hairlines. */
  variant?: StatGroupVariant;
}

defineOptions({ name: 'JStatGroup' });

withDefaults(defineProps<JStatGroupProps>(), {
  cols: 4,
  variant: 'cards',
});
</script>

<template>
  <div
    class="j-stat-group"
    :data-cols="cols === 4 ? undefined : String(cols)"
    :data-variant="variant === 'cards' ? undefined : variant"
  >
    <slot />
  </div>
</template>
