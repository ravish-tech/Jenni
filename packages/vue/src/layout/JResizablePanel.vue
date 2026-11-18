<script setup lang="ts">
import { inject, ref, useId, watch } from 'vue';
import { ResizableGroupKey, type JResizablePanelProps } from './types';

const props = withDefaults(defineProps<JResizablePanelProps>(), {
  as: 'div',
  collapsible: false,
});

const autoId = useId();
const panelRef = ref<HTMLElement | { $el?: unknown } | null>(null);
const group = inject(ResizableGroupKey, null);

function resolvePanelId(): string {
  return props.id || autoId;
}

watch(
  () => [props.defaultSize, props.minSize, props.maxSize, props.collapsible, props.collapsedSize],
  () => {
    group?.getController()?.refresh();
  },
  { flush: 'post' },
);

defineExpose({
  collapse: () => group?.getController()?.collapsePanel(resolvePanelId()),
  expand: () => group?.getController()?.expandPanel(resolvePanelId()),
  toggle: () => group?.getController()?.togglePanel(resolvePanelId()) ?? false,
  isCollapsed: () => group?.getController()?.isPanelCollapsed(resolvePanelId()) ?? false,
});
</script>

<template>
  <component
    :is="as"
    :id="id || autoId"
    ref="panelRef"
    class="j-resizable__panel"
    :data-panel-id="id || autoId"
    :data-default-size="defaultSize != null ? String(defaultSize) : undefined"
    :data-min-size="minSize != null ? String(minSize) : undefined"
    :data-max-size="maxSize != null ? String(maxSize) : undefined"
    :data-collapsible="collapsible ? '' : undefined"
    :data-collapsed-size="collapsedSize != null ? String(collapsedSize) : undefined"
  >
    <slot />
  </component>
</template>
