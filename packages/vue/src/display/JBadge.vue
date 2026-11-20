<script setup lang="ts">
import { computed, useSlots, type VNode } from 'vue';
import { getEntityHue } from 'jenni-core/behaviors/entity-color.js';
import type { JBadgeProps } from './types';

const props = withDefaults(defineProps<JBadgeProps>(), { variant: 'soft', size: 'md' });
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
  </span>
</template>
