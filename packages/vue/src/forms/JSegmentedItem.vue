<script setup lang="ts">
import { computed, inject } from 'vue';
import { SegmentedKey } from './types';

const props = defineProps<{
  value: string;
  disabled?: boolean;
}>();

const group = inject(SegmentedKey, null);
if (group && group.model.value === undefined && !props.disabled && !group.disabled.value) {
  group.model.value = props.value;
}
const checked = computed(() => group?.model.value === props.value);
const isDisabled = computed(() => !!(props.disabled || group?.disabled.value));

function onClick() {
  if (!isDisabled.value) group?.select(props.value);
}
</script>

<template>
  <button
    type="button"
    class="j-segmented__item"
    role="radio"
    :data-value="value"
    :aria-checked="checked ? 'true' : 'false'"
    :tabindex="checked ? 0 : -1"
    :disabled="isDisabled || undefined"
    @click="onClick"
  >
    <slot />
  </button>
</template>
