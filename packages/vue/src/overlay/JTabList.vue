<script setup lang="ts">
// JTabList — tablist container managing roving focus + FLIP sliding indicator.
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { syncTabIndicator, tabsKeydown } from '@jenni/core/behaviors/tabs.js';
import { TabsKey } from './types';

const ctx = inject(TabsKey, null);
const el = ref<HTMLElement | null>(null);
let ro: ResizeObserver | null = null;
let raf: number | null = null;

function onKeydown(e: KeyboardEvent) {
  if (!el.value) return;
  const target = tabsKeydown(el.value, e);
  if (target && ctx && ctx.activation.value !== 'manual') {
    const val = ctx.getTabValue(target);
    if (val !== undefined) ctx.select(val);
  }
}

onMounted(() => {
  if (!el.value) return;
  syncTabIndicator(el.value, false);
  ro = new ResizeObserver(() => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = null;
      if (el.value) syncTabIndicator(el.value, false);
    });
  });
  ro.observe(el.value);
});

watch(
  () => [ctx?.value.value, ctx?.orientation.value],
  () => {
    nextTick(() => {
      if (el.value) syncTabIndicator(el.value, true);
    });
  },
);

onBeforeUnmount(() => {
  if (raf !== null) cancelAnimationFrame(raf);
  ro?.disconnect();
});
</script>

<template>
  <div
    ref="el"
    class="j-tabs__list"
    role="tablist"
    :aria-orientation="ctx?.orientation.value === 'vertical' ? 'vertical' : undefined"
    @keydown="onKeydown"
  >
    <span class="j-tabs__indicator" aria-hidden="true" />
    <slot />
  </div>
</template>
