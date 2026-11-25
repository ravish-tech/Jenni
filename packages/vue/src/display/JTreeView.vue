<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { treeKeydown } from 'jenni-core/behaviors/tree-view.js';
import JTreeItem from './JTreeItem.vue';
import { TREE_VIEW_KEY, type JTreeNode, type JTreeViewProps } from './types';

const props = withDefaults(defineProps<JTreeViewProps>(), {
  multiple: false,
  guides: true,
  size: 'md',
  label: 'Tree',
  expandOnClick: true,
});

const emit = defineEmits<{
  load: [node: JTreeNode, children?: JTreeNode[]];
  'load-error': [error: unknown, node: JTreeNode];
}>();

const model = defineModel<string | string[]>();
const expandedModel = defineModel<string[]>('expanded');

function toArray(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  return val ? [val] : [];
}

const internalSelected = ref<string[]>(toArray(props.defaultValue));
const internalExpanded = ref<string[]>(props.defaultExpanded ? [...props.defaultExpanded] : []);
const focusedValue = ref<string | undefined>(toArray(model.value ?? props.defaultValue)[0]);
const loadingSet = ref<Set<string>>(new Set());
const loadedChildrenMap = ref<Record<string, JTreeNode[]>>({});
const inFlightMap = new Map<string, Promise<void>>();
const nodeRegistry = new Map<string, JTreeNode>();
const registeredDefaults = new Set<string>();

const selectedSet = computed(
  () => new Set(model.value !== undefined ? toArray(model.value) : internalSelected.value),
);

const expandedSet = computed(
  () => new Set(expandedModel.value !== undefined ? expandedModel.value : internalExpanded.value),
);

function findInList(list: JTreeNode[] | undefined, targetId: string): JTreeNode | undefined {
  if (!list) return undefined;
  for (const n of list) {
    if (n.id === targetId) return n;
    const nested =
      findInList(n.children, targetId) ?? findInList(loadedChildrenMap.value[n.id], targetId);
    if (nested) return nested;
  }
  return undefined;
}

function resolveNode(
  value: string,
  explicitNode?: JTreeNode,
  itemEl?: HTMLElement | null,
): JTreeNode | undefined {
  const found = explicitNode ?? findInList(props.nodes, value) ?? nodeRegistry.get(value);
  if (found) return found;
  if (itemEl?.hasAttribute('data-lazy')) {
    const labelText = itemEl.querySelector('.j-tree__label')?.textContent?.trim() ?? value;
    return { id: value, label: labelText, lazy: true };
  }
  return undefined;
}

function registerNode(value: string, node: JTreeNode) {
  nodeRegistry.set(value, node);
}

function unregisterNode(value: string) {
  nodeRegistry.delete(value);
}

function setLoadingState(value: string, active: boolean) {
  const next = new Set(loadingSet.value);
  if (active) next.add(value);
  else next.delete(value);
  loadingSet.value = next;
}

function setNodeExpanded(value: string, nextOpen: boolean) {
  const current = Array.from(expandedSet.value);
  const currentlyOpen = expandedSet.value.has(value);
  if (nextOpen === currentlyOpen) return;

  const next = nextOpen ? [...current, value] : current.filter((v) => v !== value);
  internalExpanded.value = next;
  expandedModel.value = next;
}

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

function toggleExpand(
  value: string,
  force?: boolean,
  explicitNode?: JTreeNode,
  itemEl?: HTMLElement | null,
): void | Promise<void> {
  const existingTask = inFlightMap.get(value);
  if (existingTask) return existingTask;

  const currentlyOpen = expandedSet.value.has(value);
  const nextOpen = force !== undefined ? force : !currentlyOpen;
  if (!nextOpen) {
    setNodeExpanded(value, false);
    return;
  }

  const node = resolveNode(value, explicitNode, itemEl);
  const isLazy = Boolean(node?.lazy || node?.hasChildren);
  const hasStaticChildren = Boolean(node?.children && node.children.length > 0);
  const hasCachedChildren = Object.prototype.hasOwnProperty.call(loadedChildrenMap.value, value);

  if (isLazy && !hasStaticChildren && !hasCachedChildren && node) {
    if (props.loadChildren) {
      setLoadingState(value, true);
      const task = Promise.resolve()
        .then(() => props.loadChildren!(node))
        .then(
          (result) => {
            inFlightMap.delete(value);
            setLoadingState(value, false);
            if (Array.isArray(result)) {
              loadedChildrenMap.value = {
                ...loadedChildrenMap.value,
                [value]: result,
              };
              setNodeExpanded(value, true);
              emit('load', node, result);
            } else {
              setNodeExpanded(value, true);
              emit('load', node);
            }
          },
          (err) => {
            inFlightMap.delete(value);
            setLoadingState(value, false);
            setNodeExpanded(value, false);
            emit('load-error', err, node);
          },
        );
      inFlightMap.set(value, task);
      return task;
    }

    emit('load', node);
    setNodeExpanded(value, true);
    return;
  }

  setNodeExpanded(value, true);
}

function registerDefaultExpanded(value: string) {
  if (registeredDefaults.has(value)) return;
  registeredDefaults.add(value);
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
  isLoading: (value: string) => loadingSet.value.has(value),
  getLoadedChildren: (value: string) => loadedChildrenMap.value[value],
  hasLazyLoader: () => Boolean(props.loadChildren),
  expandOnClick: () => props.expandOnClick,
  registerNode,
  unregisterNode,
  select,
  toggleExpand: (value: string, force?: boolean, node?: JTreeNode) =>
    toggleExpand(value, force, node),
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
    void toggleExpand(val, true, undefined, res.item);
  } else if (res.action === 'collapse') {
    void toggleExpand(val, false, undefined, res.item);
  } else if (res.action === 'select') {
    if (
      event.key === 'Enter' &&
      props.expandOnClick &&
      res.item.hasAttribute('aria-expanded')
    ) {
      void toggleExpand(val, undefined, undefined, res.item);
    }
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
