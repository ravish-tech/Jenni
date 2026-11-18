<script setup lang="ts">
import { computed } from 'vue';
import { type JAiCanvasProps } from './types';

const props = withDefaults(defineProps<JAiCanvasProps>(), {
  as: 'div',
});

const artifactOpen = defineModel<boolean>('artifactOpen', { default: false });

const canvasStyle = computed(() => {
  if (props.height == null) return undefined;
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return { '--j-ai-canvas-h': h };
});

function toggleArtifact(next?: boolean) {
  artifactOpen.value = typeof next === 'boolean' ? next : !artifactOpen.value;
}
</script>

<template>
  <component
    :is="as"
    class="j-ai-canvas"
    :data-artifact-open="artifactOpen ? '' : undefined"
    :data-embedded="embedded ? '' : undefined"
    :style="canvasStyle"
  >
    <div class="j-ai-canvas__thread">
      <header v-if="$slots.header" class="j-ai-canvas__header">
        <slot name="header" :artifact-open="artifactOpen" :toggle-artifact="toggleArtifact" />
      </header>

      <div class="j-ai-canvas__messages">
        <div class="j-ai-canvas__stream">
          <slot :artifact-open="artifactOpen" :toggle-artifact="toggleArtifact" />
        </div>
      </div>

      <div v-if="$slots.composer" class="j-ai-canvas__composer-wrap">
        <div class="j-ai-canvas__composer">
          <slot name="composer" :artifact-open="artifactOpen" :toggle-artifact="toggleArtifact" />
        </div>
      </div>
    </div>

    <section class="j-ai-canvas__stage" :aria-hidden="!artifactOpen ? 'true' : undefined">
      <header
        v-if="artifactTitle || $slots['artifact-header'] || $slots['artifact-actions']"
        class="j-ai-canvas__stage-header"
      >
        <slot name="artifact-header" :close-artifact="() => toggleArtifact(false)">
          <span v-if="artifactTitle" class="j-ai-canvas__stage-title">{{ artifactTitle }}</span>
          <div v-if="$slots['artifact-actions']" class="j-ai-canvas__stage-actions">
            <slot name="artifact-actions" :close-artifact="() => toggleArtifact(false)" />
          </div>
        </slot>
      </header>
      <div class="j-ai-canvas__stage-body">
        <slot name="artifact" :close-artifact="() => toggleArtifact(false)" />
      </div>
    </section>
  </component>
</template>
