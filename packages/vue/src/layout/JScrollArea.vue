<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  createScrollArea,
  type ScrollAreaController,
  type ScrollAreaState,
} from '@jenni/core/behaviors/scroll-area.js';
import { attr, type JScrollAreaProps } from './types';

const props = withDefaults(defineProps<JScrollAreaProps>(), {
  as: 'div',
  orientation: 'vertical',
  scrollbar: 'subtle',
  fade: false,
  bordered: false,
});

const emit = defineEmits<{
  scrollStateChange: [state: ScrollAreaState];
}>();

const rootRef = ref<HTMLElement | { $el?: unknown } | null>(null);
let ctrl: ScrollAreaController | null = null;

function resolveEl(): HTMLElement | null {
  const val = rootRef.value;
  if (!val) return null;
  if (typeof HTMLElement !== 'undefined' && val instanceof HTMLElement) return val;
  const maybeEl = (val as { $el?: unknown }).$el;
  return typeof HTMLElement !== 'undefined' && maybeEl instanceof HTMLElement ? maybeEl : null;
}

const toPx = (v: string | number) => (typeof v === 'number' ? `${v}px` : v);

const areaStyle = computed(() => {
  const styles: Record<string, string> = {};
  if (props.maxHeight != null) styles['--j-scroll-max-h'] = toPx(props.maxHeight);
  if (props.maxWidth != null) styles['--j-scroll-max-w'] = toPx(props.maxWidth);
  if (props.height != null) styles['--j-scroll-h'] = toPx(props.height);
  if (props.width != null) styles['--j-scroll-w'] = toPx(props.width);
  if (props.fadeSize != null) styles['--j-scroll-fade-size'] = toPx(props.fadeSize);
  return Object.keys(styles).length ? styles : undefined;
});

onMounted(() => {
  const el = resolveEl();
  if (!el) return;
  ctrl = createScrollArea(el, {
    onStateChange: (state) => emit('scrollStateChange', state),
  });
});

watch(
  () => [props.orientation, props.fade, props.maxHeight, props.maxWidth, props.height, props.width],
  () => {
    ctrl?.update();
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  ctrl?.destroy();
  ctrl = null;
});

defineExpose({
  scrollTo: (options: ScrollToOptions) => ctrl?.scrollTo(options),
  update: () => ctrl?.update(),
  getState: () => ctrl?.getState(),
  getElement: resolveEl,
});
</script>

<template>
  <component
    :is="as"
    ref="rootRef"
    class="j-scroll-area"
    :data-orientation="attr(orientation, 'vertical')"
    :data-scrollbar="attr(scrollbar, 'subtle')"
    :data-fade="fade ? '' : undefined"
    :data-bordered="bordered ? '' : undefined"
    :style="areaStyle"
  >
    <slot />
  </component>
</template>
