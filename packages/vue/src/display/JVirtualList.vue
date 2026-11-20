<script lang="ts">
/// <reference path="./virtual-grid-core.d.ts" />
import type { VirtualScrollAlign, VirtualizerState } from 'jenni-core/behaviors/virtual-list.js';

export type { VirtualScrollAlign, VirtualizerState };

export interface JVirtualListProps<T = any> {
  items: T[];
  itemHeight?: number | ((index: number) => number);
  estimateHeight?: number;
  height?: number | string;
  overscan?: number;
  keyField?: string | ((item: T, index: number) => string | number);
  divided?: boolean;
  role?: string;
  ariaLabel?: string;
}

export interface JVirtualListHandle {
  scrollToIndex: (index: number, align?: VirtualScrollAlign, behavior?: ScrollBehavior) => void;
  scrollToOffset: (offset: number, behavior?: ScrollBehavior) => void;
  refresh: (clearCache?: boolean) => void;
  readonly element: HTMLElement | null;
}
</script>

<script setup lang="ts" generic="T = any">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type ComponentPublicInstance,
} from 'vue';
import {
  createVirtualizer,
  type VirtualizerController,
} from 'jenni-core/behaviors/virtual-list.js';

const props = withDefaults(defineProps<JVirtualListProps<T>>(), {
  estimateHeight: 36,
  height: 400,
  overscan: 6,
  divided: false,
  role: 'list',
});

defineSlots<{
  default?: (props: { item: T; index: number }) => any;
  empty?: () => any;
}>();

const viewportEl = ref<HTMLElement | null>(null);
let ctrl: VirtualizerController | null = null;

function computeInitialSlice() {
  const total = props.items.length;
  if (total <= 0) {
    return { indices: [] as number[], offsetY: 0, totalHeight: 0 };
  }
  const vpH = typeof props.height === 'number' && props.height > 0 ? props.height : 400;
  const overscan = props.overscan ?? 6;
  if (typeof props.itemHeight === 'function') {
    const indices: number[] = [];
    let acc = 0;
    let lastVisible = 0;
    for (let i = 0; i < total; i += 1) {
      const raw = Number(props.itemHeight(i));
      const h = Number.isFinite(raw) && raw > 0 ? raw : (props.estimateHeight ?? 36);
      if (acc < vpH) lastVisible = i;
      acc += h;
    }
    const end = Math.min(total - 1, lastVisible + overscan);
    for (let i = 0; i <= end; i += 1) indices.push(i);
    return { indices, offsetY: 0, totalHeight: acc };
  }
  const unitH = Math.max(1, props.itemHeight ?? props.estimateHeight ?? 36);
  const end = Math.min(total - 1, Math.ceil(vpH / unitH) - 1 + overscan);
  const indices: number[] = [];
  for (let i = 0; i <= end; i += 1) indices.push(i);
  return {
    indices,
    offsetY: 0,
    totalHeight: total * unitH,
  };
}

const initial = computeInitialSlice();
const visibleIndices = shallowRef<number[]>(initial.indices);
const offsetY = ref(initial.offsetY);
const totalHeight = ref(initial.totalHeight);

function applyState(state: VirtualizerState) {
  if (visibleIndices.value !== state.visibleIndices) {
    visibleIndices.value = state.visibleIndices;
  }
  if (offsetY.value !== state.offsetY) {
    offsetY.value = state.offsetY;
  }
  if (totalHeight.value !== state.totalHeight) {
    totalHeight.value = state.totalHeight;
  }
}

onMounted(() => {
  if (!viewportEl.value) return;
  ctrl = createVirtualizer(viewportEl.value, {
    count: props.items.length,
    itemHeight: props.itemHeight,
    estimateHeight: props.estimateHeight,
    overscan: props.overscan,
    onChange: applyState,
  });
});

watch(
  () => [props.items.length, props.itemHeight, props.estimateHeight, props.overscan] as const,
  ([count, itemHeight, estimateHeight, overscan]) => {
    if (ctrl) {
      ctrl.setOptions({ count, itemHeight, estimateHeight, overscan });
    } else {
      const next = computeInitialSlice();
      visibleIndices.value = next.indices;
      offsetY.value = next.offsetY;
      totalHeight.value = next.totalHeight;
    }
  },
);

onBeforeUnmount(() => {
  ctrl?.destroy();
  ctrl = null;
});

function resolveKey(item: T, index: number): string | number {
  if (typeof props.keyField === 'function') return props.keyField(item, index);
  if (typeof props.keyField === 'string' && item != null && typeof item === 'object') {
    const val = (item as Record<string, unknown>)[props.keyField];
    if (typeof val === 'string' || typeof val === 'number') return val;
  }
  return index;
}

function bindItemRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (props.itemHeight != null || !ctrl) return;
  const domEl = el instanceof HTMLElement ? el : null;
  ctrl.measureElement(domEl, index);
}

const rootStyle = computed(() => {
  if (props.height == null) return undefined;
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return { '--j-virtual-h': h };
});

const spacerStyle = computed(() => ({
  '--_total-h': `${totalHeight.value}px`,
  blockSize: `${totalHeight.value}px`,
}));

const itemsStyle = computed(() => ({
  '--_offset-y': `${offsetY.value}px`,
}));

function getItemStyle(index: number) {
  if (props.itemHeight == null) return undefined;
  const h = typeof props.itemHeight === 'function' ? props.itemHeight(index) : props.itemHeight;
  return { blockSize: `${h}px` };
}

const renderedRows = computed(() => {
  const list = props.items;
  const len = list.length;
  const out: Array<{ idx: number; item: T; key: string | number }> = [];
  for (const idx of visibleIndices.value) {
    if (idx < 0 || idx >= len) continue;
    const item = list[idx];
    out.push({ idx, item, key: resolveKey(item, idx) });
  }
  return out;
});

const itemRole = computed(() => {
  if (props.role === 'list') return 'listitem';
  if (props.role === 'listbox') return 'option';
  return undefined;
});

function scrollToIndex(index: number, align?: VirtualScrollAlign, behavior?: ScrollBehavior) {
  ctrl?.scrollToIndex(index, align, behavior);
}

function scrollToOffset(offset: number, behavior?: ScrollBehavior) {
  ctrl?.scrollToOffset(offset, behavior);
}

function refresh(clearCache?: boolean) {
  ctrl?.refresh(clearCache);
}

defineExpose({
  scrollToIndex,
  scrollToOffset,
  refresh,
  element: viewportEl,
});
</script>

<template>
  <div
    ref="viewportEl"
    class="j-virtual-list"
    data-j-managed=""
    :role="role"
    :aria-label="ariaLabel"
    :data-divided="divided ? '' : undefined"
    :style="rootStyle"
  >
    <div v-if="items.length === 0" class="j-virtual-list__empty">
      <slot name="empty" />
    </div>
    <div v-else class="j-virtual-list__spacer" :style="spacerStyle">
      <div class="j-virtual-list__items" :style="itemsStyle">
        <div
          v-for="row in renderedRows"
          :key="row.key"
          :ref="(el) => bindItemRef(el, row.idx)"
          class="j-virtual-list__item"
          :role="itemRole"
          :aria-posinset="itemRole ? row.idx + 1 : undefined"
          :aria-setsize="itemRole ? items.length : undefined"
          :data-v-index="row.idx"
          :style="getItemStyle(row.idx)"
        >
          <slot :item="row.item" :index="row.idx" />
        </div>
      </div>
    </div>
  </div>
</template>
