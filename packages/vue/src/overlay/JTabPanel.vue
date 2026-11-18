<script setup lang="ts">
// JTabPanel — content panel linked to a JTab with matching `value`.
import { computed, inject } from 'vue';
import { TabsKey } from './types';

const props = defineProps<{
  value: string | number;
}>();

const ctx = inject(TabsKey, null);
const selected = computed(() => ctx?.value.value === props.value);
</script>

<template>
  <div
    :id="ctx?.panelId(value)"
    class="j-tabs__panel"
    role="tabpanel"
    :aria-labelledby="ctx?.tabId(value)"
    tabindex="0"
    :hidden="!selected ? true : undefined"
  >
    <slot />
  </div>
</template>
