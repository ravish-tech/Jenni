<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import {
  createResizableGroup,
  type ResizableGroupController,
} from '@jenni/core/behaviors/resizable.js';
import { attr, ResizableGroupKey, type JResizableGroupProps } from './types';

const props = withDefaults(defineProps<JResizableGroupProps>(), {
  as: 'div',
  orientation: 'horizontal',
  bordered: false,
});

const emit = defineEmits<{
  layout: [sizes: number[]];
  panelCollapse: [panelId: string, collapsed: boolean];
}>();

const rootRef = ref<HTMLElement | { $el?: unknown } | null>(null);
let ctrl: ResizableGroupController | null = null;

function resolveEl(): HTMLElement | null {
  const val = rootRef.value;
  if (!val) return null;
  if (typeof HTMLElement !== 'undefined' && val instanceof HTMLElement) return val;
  const maybeEl = (val as { $el?: unknown }).$el;
  return typeof HTMLElement !== 'undefined' && maybeEl instanceof HTMLElement ? maybeEl : null;
}

const toCssSize = (v: string | number) => (typeof v === 'number' ? `${v}px` : v);

const groupStyle = computed(() => {
  const styles: Record<string, string> = {};
  if (props.height != null) styles['--j-resizable-h'] = toCssSize(props.height);
  if (props.width != null) styles['--j-resizable-w'] = toCssSize(props.width);
  return Object.keys(styles).length ? styles : undefined;
});

function mountGroup() {
  ctrl?.destroy();
  ctrl = null;
  const el = resolveEl();
  if (!el) return;
  ctrl = createResizableGroup(el, {
    orientation: props.orientation,
    autoSaveId: props.autoSaveId,
    step: props.step,
    onLayout: (sizes) => emit('layout', sizes),
    onPanelCollapse: (panelId, collapsed) => emit('panelCollapse', panelId, collapsed),
  });
  emit('layout', ctrl.getLayout());
}

provide(ResizableGroupKey, {
  getController: () => ctrl,
});

onMounted(mountGroup);

watch(
  () => [props.orientation, props.autoSaveId, props.step],
  () => mountGroup(),
  { flush: 'post' },
);

onBeforeUnmount(() => {
  ctrl?.destroy();
  ctrl = null;
});

defineExpose({
  getLayout: () => ctrl?.getLayout() ?? [],
  setLayout: (sizes: number[]) => ctrl?.setLayout(sizes),
  collapsePanel: (idOrIndex: string | number) => ctrl?.collapsePanel(idOrIndex),
  expandPanel: (idOrIndex: string | number) => ctrl?.expandPanel(idOrIndex),
  togglePanel: (idOrIndex: string | number) => ctrl?.togglePanel(idOrIndex) ?? false,
  isPanelCollapsed: (idOrIndex: string | number) => ctrl?.isPanelCollapsed(idOrIndex) ?? false,
  resetLayout: () => ctrl?.resetLayout(),
  refresh: () => ctrl?.refresh(),
  getElement: resolveEl,
});
</script>

<template>
  <component
    :is="as"
    ref="rootRef"
    class="j-resizable"
    :data-orientation="attr(orientation, 'horizontal')"
    :data-bordered="bordered ? '' : undefined"
    :data-storage-key="autoSaveId || undefined"
    :style="groupStyle"
  >
    <slot />
  </component>
</template>
