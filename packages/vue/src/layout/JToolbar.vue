<script setup lang="ts">
/// <reference path="./toolbar-core.d.ts" />
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';
import { createToolbar } from 'jenni-core/behaviors/toolbar.js';
import { attr } from './types';

export type JToolbarSize = 'sm' | 'md' | 'lg';
export type JToolbarOrientation = 'horizontal' | 'vertical';
export type JToolbarBorder = 'bottom' | 'top' | 'all' | 'none';
export type JToolbarSurface = 1 | 2 | '1' | '2' | 'transparent';

export interface JToolbarProps {
  as?: string | object;
  size?: JToolbarSize;
  orientation?: JToolbarOrientation;
  border?: JToolbarBorder;
  surface?: JToolbarSurface;
  sticky?: boolean;
  translucent?: boolean;
  wrap?: boolean;
  loop?: boolean;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<JToolbarProps>(), {
  as: 'div',
  size: 'md',
  orientation: 'horizontal',
  border: 'bottom',
  surface: 1,
  loop: true,
  ariaLabel: 'Toolbar',
});

const slots = useSlots();
const rootRef = ref<HTMLElement | { $el?: unknown } | null>(null);
let cleanup: (() => void) | null = null;

function resolveEl(): HTMLElement | null {
  const val = rootRef.value;
  if (!val) return null;
  if (typeof HTMLElement !== 'undefined' && val instanceof HTMLElement) return val;
  const maybeEl = (val as { $el?: unknown }).$el;
  return typeof HTMLElement !== 'undefined' && maybeEl instanceof HTMLElement ? maybeEl : null;
}

const surfaceAttr = computed(() => {
  const s = String(props.surface);
  return s === '1' ? undefined : s;
});

const hasSectionSlots = computed(() => Boolean(slots.start || slots.center || slots.end));

function bindToolbar() {
  cleanup?.();
  cleanup = null;
  const el = resolveEl();
  if (!el) return;
  cleanup = createToolbar(el, {
    orientation: props.orientation,
    loop: props.loop,
  });
}

onMounted(bindToolbar);

watch(
  () => [props.orientation, props.loop],
  () => bindToolbar(),
  { flush: 'post' },
);

onBeforeUnmount(() => {
  cleanup?.();
  cleanup = null;
});
</script>

<template>
  <component
    :is="as"
    ref="rootRef"
    class="j-toolbar"
    role="toolbar"
    :aria-label="ariaLabel"
    :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
    :data-size="attr(size, 'md')"
    :data-orientation="attr(orientation, 'horizontal')"
    :data-border="attr(border, 'bottom')"
    :data-surface="surfaceAttr"
    :data-sticky="sticky ? '' : undefined"
    :data-translucent="translucent ? '' : undefined"
    :data-wrap="wrap ? '' : undefined"
  >
    <template v-if="hasSectionSlots">
      <div
        v-if="$slots.start || $slots.default"
        class="j-toolbar__section"
        data-section="start"
      >
        <slot name="start" />
        <slot />
      </div>
      <div v-if="$slots.center" class="j-toolbar__section" data-section="center">
        <slot name="center" />
      </div>
      <div v-if="$slots.end" class="j-toolbar__section" data-section="end">
        <slot name="end" />
      </div>
    </template>
    <slot v-else />
  </component>
</template>
