<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { treeKeydown } from 'jenni-core/behaviors/tree-view.js';
import JTreeItem from './JTreeItem.vue';
import { TREE_VIEW_KEY, type JTreeViewProps } from './types';

const props = withDefaults(defineProps<JTreeViewProps>(), {
  multiple: false,
  guides: true,
  size: 'md',
  label: 'Tree',
  expandOnClick: true,
});

const model = defineModel<string | string[]>();
const expandedModel = defineModel<string[]>('expanded');

function toArray(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  return val ? [val] : [];
}

const internalSelected = ref<string[]>(toArray(props.defaultValue));
const internalExpanded = ref<string[]>(props.defaultExpanded ? [...props.defaultExpanded] : []);
const focusedValue = ref<string | undefined>(toArray(model.value ?? props.defaultValue)[0]);

const selectedSet = computed(
  () => new Set(model.value !== undefined ? toArray(model.value) : internalSelected.value),
);

const expandedSet = computed(
  () => new Set(expandedModel.value !== undefined ? expandedModel.value : internalExpanded.value),
);

function select(value: string) {
  const current = Array.from(selectedSet.value);
  if (props.multiple) {
    const next = selectedSet.value.has(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    internalSelected.value = next;
    model.value = next;
  } else {
    internalSelected.value = [value];
    model.value = value;
  }
  focusedValue.value = value;
}

function toggleExpand(value: string, force?: boolean) {
  const current = Array.from(expandedSet.value);
  const currentlyOpen = expandedSet.value.has(value);
  const nextOpen = force !== undefined ? force : !currentlyOpen;
  if (nextOpen === currentlyOpen) return;

  const next = nextOpen ? [...current, value] : current.filter((v) => v !== value);
  internalExpanded.value = next;
  expandedModel.value = next;
}

function registerDefaultExpanded(value: string) {
  if (expandedModel.value !== undefined || internalExpanded.value.includes(value)) return;
  internalExpanded.value = [...internalExpanded.value, value];
}

function ensureInitialFocus(value: string) {
  if (focusedValue.value === undefined) {
    focusedValue.value = value;
  }
}

provide(TREE_VIEW_KEY, {
  isSelected: (value: string) => selectedSet.value.has(value),
  isExpanded: (value: string) => expandedSet.value.has(value),
  isFocusable: (value: string) => focusedValue.value === value,
  expandOnClick: () => props.expandOnClick,
  select,
  toggleExpand,
  registerDefaultExpanded,
  setFocused: (value: string) => {
    focusedValue.value = value;
  },
  ensureInitialFocus,
});

const treeEl = ref<HTMLElement | null>(null);

function onKeydown(event: KeyboardEvent) {
  if (!treeEl.value) return;
  const res = treeKeydown(treeEl.value, event);
  if (!res) return;
  const val = res.item.dataset.value;
  if (!val) return;
  if (res.action === 'focus') {
    focusedValue.value = val;
  } else if (res.action === 'expand') {
    toggleExpand(val, true);
  } else if (res.action === 'collapse') {
    toggleExpand(val, false);
  } else if (res.action === 'select') {
    select(val);
  }
}
</script>

<template>
  <ul
    ref="treeEl"
    class="j-tree"
    role="tree"
    data-j-managed=""
    :aria-label="label"
    :aria-multiselectable="multiple ? 'true' : undefined"
    :data-guides="guides ? '' : undefined"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
    @keydown="onKeydown"
  >
    <template v-if="nodes && nodes.length">
      <JTreeItem v-for="node in nodes" :key="node.id" :node="node" />
    </template>
    <slot v-else />
  </ul>
</template>
