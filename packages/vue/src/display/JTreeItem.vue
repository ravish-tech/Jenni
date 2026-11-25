<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { TREE_VIEW_KEY, type JTreeItemProps, type JTreeNode } from './types';

defineOptions({ name: 'JTreeItem' });

const props = withDefaults(defineProps<JTreeItemProps>(), {
  disabled: false,
  defaultExpanded: false,
  lazy: false,
  hasChildren: false,
  loading: false,
});

const slots = useSlots();
const autoId = useId();
const groupId = `${autoId}-group`;
const tree = inject(TREE_VIEW_KEY, null);

const itemKey = computed(() => props.node?.id ?? props.value ?? autoId);
const itemLabel = computed(() => props.node?.label ?? props.label ?? '');
const itemMeta = computed(() => props.node?.meta ?? props.meta);
const itemDisabled = computed(() => Boolean(props.node?.disabled ?? props.disabled));

const isLazy = computed(() =>
  Boolean(props.node?.lazy || props.node?.hasChildren || props.lazy || props.hasChildren),
);
const staticChildren = computed(() => props.node?.children);
const loadedChildren = computed(() => tree?.getLoadedChildren(itemKey.value));
const effectiveChildren = computed(() =>
  staticChildren.value && staticChildren.value.length > 0
    ? staticChildren.value
    : loadedChildren.value,
);
const hasLoadedEmpty = computed(
  () =>
    loadedChildren.value !== undefined &&
    loadedChildren.value.length === 0 &&
    (!staticChildren.value || staticChildren.value.length === 0),
);
const hasSlotChildren = computed(() => Boolean(slots.default || slots.children));
const hasBranch = computed(() =>
  Boolean(
    (effectiveChildren.value && effectiveChildren.value.length > 0) ||
      hasSlotChildren.value ||
      (isLazy.value && !hasLoadedEmpty.value),
  ),
);
const hasRenderedChildren = computed(() =>
  Boolean((effectiveChildren.value && effectiveChildren.value.length > 0) || hasSlotChildren.value),
);
const isLoading = computed(() =>
  Boolean(props.node?.loading || props.loading || tree?.isLoading(itemKey.value)),
);

const effectiveNode = computed<JTreeNode>(
  () =>
    props.node ?? {
      id: itemKey.value,
      label: itemLabel.value,
      icon: props.icon,
      meta: props.meta,
      disabled: itemDisabled.value,
      lazy: isLazy.value,
      hasChildren: props.hasChildren,
      loading: props.loading,
    },
);

const resolvedIcon = computed(() => {
  const raw = props.node?.icon ?? props.icon;
  if (raw) return raw;
  return hasBranch.value || isLazy.value ? 'folder' : 'file';
});

if (props.defaultExpanded && tree) {
  tree.registerDefaultExpanded(itemKey.value);
}
if (!itemDisabled.value && tree) {
  tree.ensureInitialFocus(itemKey.value);
}

watch(
  [itemKey, effectiveNode],
  ([key, node], [prevKey]) => {
    if (!tree) return;
    if (prevKey !== undefined && prevKey !== key) {
      tree.unregisterNode(prevKey);
    }
    tree.registerNode(key, node);
  },
  { immediate: true },
);

onMounted(() => {
  if (
    tree &&
    tree.hasLazyLoader() &&
    isLazy.value &&
    (!staticChildren.value || staticChildren.value.length === 0) &&
    loadedChildren.value === undefined &&
    tree.isExpanded(itemKey.value)
  ) {
    void tree.toggleExpand(itemKey.value, true, effectiveNode.value);
  }
});

onBeforeUnmount(() => {
  tree?.unregisterNode(itemKey.value);
});

const localExpanded = ref(props.defaultExpanded);
const localSelected = ref(false);

const isExpanded = computed(() =>
  tree ? tree.isExpanded(itemKey.value) : localExpanded.value,
);
const isSelected = computed(() =>
  tree ? tree.isSelected(itemKey.value) : localSelected.value,
);
const tabIndex = computed(() => {
  if (itemDisabled.value) return -1;
  if (!tree) return 0;
  return tree.isFocusable(itemKey.value) ? 0 : -1;
});

function onChevronClick(event: MouseEvent) {
  event.stopPropagation();
  if (itemDisabled.value || !hasBranch.value || isLoading.value) return;
  if (tree) {
    tree.setFocused(itemKey.value);
    void tree.toggleExpand(itemKey.value, undefined, effectiveNode.value);
  } else {
    localExpanded.value = !localExpanded.value;
  }
}

function onRowClick() {
  if (itemDisabled.value) return;
  if (tree) {
    tree.setFocused(itemKey.value);
    if (hasBranch.value && tree.expandOnClick() && !isLoading.value) {
      void tree.toggleExpand(itemKey.value, undefined, effectiveNode.value);
    }
    tree.select(itemKey.value);
  } else {
    if (hasBranch.value) localExpanded.value = !localExpanded.value;
    localSelected.value = !localSelected.value;
  }
}
</script>

<template>
  <li class="j-tree__node" role="none">
    <div
      class="j-tree__item"
      role="treeitem"
      :data-value="itemKey"
      :data-lazy="isLazy ? '' : undefined"
      :data-loaded-empty="hasLoadedEmpty ? '' : undefined"
      :aria-expanded="hasBranch ? (isExpanded ? 'true' : 'false') : undefined"
      :aria-busy="isLoading ? 'true' : undefined"
      :aria-owns="hasRenderedChildren ? groupId : undefined"
      :aria-selected="isSelected ? 'true' : 'false'"
      :aria-disabled="itemDisabled ? 'true' : undefined"
      :tabindex="tabIndex"
      @click="onRowClick"
      @focus="!itemDisabled && tree?.setFocused(itemKey)"
    >
      <button
        v-if="hasBranch || isLoading"
        type="button"
        class="j-tree__chevron j-tree__toggle"
        :data-loading="isLoading ? '' : undefined"
        tabindex="-1"
        aria-hidden="true"
        @click="onChevronClick"
      >
        <span v-if="isLoading" class="j-tree__spinner" aria-hidden="true" />
        <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6.25 4.25 10 8l-3.75 3.75" />
        </svg>
      </button>
      <span v-else class="j-tree__spacer" aria-hidden="true" />

      <span v-if="$slots.icon || resolvedIcon !== 'none'" class="j-tree__icon" aria-hidden="true">
        <slot name="icon">
          <svg
            v-if="resolvedIcon === 'folder'"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.88a1.5 1.5 0 0 1 1.06.44l.94.94a1 1 0 0 0 .7.29h3.42A1.5 1.5 0 0 1 14 6.17v5.33A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5v-7Z" />
          </svg>
          <svg
            v-else
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9.5 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6L9.5 2Z" />
            <path d="M9 2v4h4" />
          </svg>
        </slot>
      </span>

      <span class="j-tree__label">
        <slot name="label">{{ itemLabel }}</slot>
      </span>

      <span v-if="itemMeta || $slots.meta" class="j-tree__meta">
        <slot name="meta">{{ itemMeta }}</slot>
      </span>
    </div>

    <div v-if="hasRenderedChildren" class="j-tree__branch" role="none">
      <ul :id="groupId" class="j-tree__group" role="group">
        <template v-if="effectiveChildren && effectiveChildren.length">
          <JTreeItem v-for="child in effectiveChildren" :key="child.id" :node="child" />
        </template>
        <slot v-else name="children">
          <slot />
        </slot>
      </ul>
    </div>
  </li>
</template>
