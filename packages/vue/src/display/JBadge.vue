<script setup lang="ts">
import { computed, useSlots, type VNode } from 'vue';
import { getEntityHue } from 'jenni-core/behaviors/entity-color.js';
import type { JBadgeProps } from './types';

const props = withDefaults(defineProps<JBadgeProps>(), {
  variant: 'soft',
  size: 'md',
  removeLabel: 'Remove',
});
const emit = defineEmits<{ remove: [event: MouseEvent] }>();
const slots = useSlots();

function extractVNodeText(nodes: VNode[] | undefined): string {
  if (!nodes) return '';
  let out = '';
  for (const n of nodes) {
    if (typeof n.children === 'string') out += n.children;
    else if (Array.isArray(n.children)) out += extractVNodeText(n.children as VNode[]);
  }
  return out;
}

const entityHue = computed<number | undefined>(() => {
  if (props.tone) return undefined;
  if (typeof props.colorSeed === 'string' && props.colorSeed.trim()) {
    return getEntityHue(props.colorSeed.trim());
  }
  if (props.colorSeed === true || props.autoColor === true) {
    const text = extractVNodeText(slots.default?.()).trim();
    if (text) return getEntityHue(text);
  }
  return undefined;
});
</script>

<template>
  <span
    class="j-badge"
    :data-variant="variant"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
    :data-entity-color="entityHue !== undefined ? '' : undefined"
    :style="entityHue !== undefined ? { '--j-entity-hue': String(entityHue) } : undefined"
  >
    <span v-if="dot" class="j-badge__dot" aria-hidden="true" />
    <slot name="icon" />
    <slot />
    <button
      v-if="removable || closable"
      type="button"
      class="j-badge__remove"
      :aria-label="removeLabel"
      @click.stop="emit('remove', $event)"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
      </svg>
    </button>
  </span>
</template>
