<script setup lang="ts">
import { Comment, Fragment, type VNode } from 'vue';
import type { JAvatarGroupProps } from './types';

const props = withDefaults(defineProps<JAvatarGroupProps>(), { size: 'md' });
const slots = defineSlots<{ default?: () => VNode[] }>();

function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap((n) =>
    n.type === Fragment && Array.isArray(n.children)
      ? flatten(n.children as VNode[])
      : n.type === Comment ? [] : [n],
  );
}

// Called from the template so it re-runs on every render (slots are not reactive sources).
function layout() {
  const all = flatten(slots.default?.() ?? []);
  const visible = props.max != null && props.max >= 0 ? all.slice(0, props.max) : all;
  const total = Math.max(props.total ?? all.length, all.length);
  return { visible, extra: total - visible.length };
}
</script>

<template>
  <div class="j-avatar-group" role="group" :data-size="size === 'md' ? undefined : size">
    <template v-for="(group, gi) in [layout()]" :key="gi">
      <component :is="node" v-for="(node, i) in group.visible" :key="node.key ?? i" />
      <span
        v-if="group.extra > 0"
        class="j-avatar j-avatar-group__more"
        role="img"
        :aria-label="`${group.extra} more`"
      >
        <span class="j-avatar__fallback" aria-hidden="true">+{{ group.extra }}</span>
      </span>
    </template>
  </div>
</template>
