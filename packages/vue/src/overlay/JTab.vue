<script setup lang="ts">
// JTab — individual tab button inside JTabList.
import { computed, inject, onMounted, ref, watch } from 'vue';
import { TabsKey } from './types';

const props = defineProps<{
  value: string | number;
  disabled?: boolean;
}>();

const ctx = inject(TabsKey, null);
const el = ref<HTMLButtonElement | null>(null);

if (ctx && ctx.value.value === undefined && !props.disabled) {
  ctx.registerTab(null, props.value, props.disabled);
}

const selected = computed(() => ctx?.value.value === props.value);

onMounted(() => {
  ctx?.registerTab(el.value, props.value, props.disabled);
});

watch(
  () => props.value,
  (val) => ctx?.registerTab(el.value, val, props.disabled),
);

function onClick() {
  if (props.disabled) return;
  ctx?.select(props.value);
}
</script>

<template>
  <button
    :id="ctx?.tabId(value)"
    ref="el"
    type="button"
    class="j-tabs__tab"
    role="tab"
    :aria-selected="selected ? 'true' : 'false'"
    :aria-controls="ctx?.panelId(value)"
    :tabindex="selected ? 0 : -1"
    :disabled="disabled || undefined"
    :data-value="String(value)"
    @click="onClick"
  >
    <slot />
  </button>
</template>
