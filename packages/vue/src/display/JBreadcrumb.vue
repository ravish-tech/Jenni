<script setup lang="ts">
import { Comment, Fragment, computed, ref, type VNode } from 'vue';
import type { JBreadcrumbProps } from './types';

const props = withDefaults(defineProps<JBreadcrumbProps>(), {
  size: 'md',
  label: 'Breadcrumb',
  itemsBeforeCollapse: 1,
  itemsAfterCollapse: 2,
});

const slots = defineSlots<{ default?: () => VNode[] }>();
const expanded = ref(false);

const resolvedSeparator = computed(() => props.separator ?? props.variant ?? 'chevron');

function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap((n) =>
    n.type === Fragment && Array.isArray(n.children)
      ? flatten(n.children as VNode[])
      : n.type === Comment
        ? []
        : [n],
  );
}

function layout() {
  const all = flatten(slots.default?.() ?? []);
  if (
    expanded.value ||
    props.maxItems == null ||
    props.maxItems < 2 ||
    all.length <= props.maxItems
  ) {
    return { collapsed: false, head: all, tail: [] as VNode[] };
  }
  const before = Math.max(1, props.itemsBeforeCollapse);
  const after = Math.max(1, props.itemsAfterCollapse);
  if (before + after >= all.length) {
    return { collapsed: false, head: all, tail: [] as VNode[] };
  }
  return {
    collapsed: true,
    head: all.slice(0, before),
    tail: all.slice(all.length - after),
  };
}
</script>

<template>
  <nav
    class="j-breadcrumb"
    :aria-label="label"
    :data-separator="resolvedSeparator === 'chevron' ? undefined : resolvedSeparator"
    :data-size="size === 'md' ? undefined : size"
  >
    <ol class="j-breadcrumb__list">
      <template v-for="(view, vi) in [layout()]" :key="vi">
        <component :is="node" v-for="(node, i) in view.head" :key="node.key ?? `h-${i}`" />
        <li v-if="view.collapsed" class="j-breadcrumb__item">
          <button
            type="button"
            class="j-breadcrumb__ellipsis"
            aria-label="Show hidden breadcrumbs"
            @click="expanded = true"
          >
            …
          </button>
        </li>
        <component :is="node" v-for="(node, i) in view.tail" :key="node.key ?? `t-${i}`" />
      </template>
    </ol>
  </nav>
</template>
