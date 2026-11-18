<script setup lang="ts">
import { computed } from 'vue';
import { attr, type JCanvasStageProps } from './types';

const props = withDefaults(defineProps<JCanvasStageProps>(), {
  as: 'div',
  grid: 'dots',
  toolsPlacement: 'left',
});

const stageStyle = computed(() => {
  if (props.height == null) return undefined;
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return { '--j-canvas-h': h };
});
</script>

<template>
  <component
    :is="as"
    class="j-canvas-stage"
    :data-grid="attr(grid, 'none')"
    :data-tools-placement="attr(toolsPlacement, 'left')"
    :data-inspector-open="inspectorOpen ? '' : undefined"
    :data-embedded="embedded ? '' : undefined"
    :style="stageStyle"
  >
    <div class="j-canvas-stage__viewport">
      <slot />
    </div>

    <div v-if="$slots.top" class="j-canvas-stage__top">
      <slot name="top" />
    </div>

    <div
      v-if="$slots.tools"
      class="j-canvas-stage__tools"
      :data-placement="attr(toolsPlacement, 'left')"
      role="toolbar"
      aria-label="Canvas tools"
    >
      <slot name="tools" />
    </div>

    <aside v-if="$slots.inspector" class="j-canvas-stage__inspector" aria-label="Inspector">
      <slot name="inspector" />
    </aside>

    <div v-if="$slots.hud" class="j-canvas-stage__hud">
      <slot name="hud" />
    </div>
  </component>
</template>
