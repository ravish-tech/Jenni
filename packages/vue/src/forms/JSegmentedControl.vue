<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, useTemplateRef, watch } from 'vue';
import { segmentedKeydown, syncSegmentedIndicator } from 'jenni-core/behaviors/segmented.js';
import { FieldKey, SegmentedKey, sizeAttr, type SegmentedOption, type Size, type Tone } from './types';

const model = defineModel<string>();
const props = defineProps<{
  defaultValue?: string;
  options?: SegmentedOption[];
  size?: Size;
  tone?: Tone;
  fullWidth?: boolean;
  disabled?: boolean;
}>();

if (model.value === undefined) {
  const init = props.defaultValue ?? props.options?.find((o) => !o.disabled)?.value;
  if (init !== undefined) model.value = init;
}

const field = inject(FieldKey, null);
const root = useTemplateRef<HTMLElement>('root');
const isDisabled = computed(() => !!(props.disabled || field?.disabled.value));

function select(value: string) {
  if (isDisabled.value || model.value === value) return;
  model.value = value;
}

provide(SegmentedKey, {
  model,
  disabled: isDisabled,
  select,
});

function onKeydown(e: KeyboardEvent) {
  if (!root.value || isDisabled.value) return;
  const target = segmentedKeydown(root.value, e);
  const val = target?.dataset.value;
  if (val !== undefined) select(val);
}

let ro: ResizeObserver | null = null;
let raf: number | null = null;

onMounted(() => {
  if (!root.value) return;
  syncSegmentedIndicator(root.value, false);
  ro = new ResizeObserver(() => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = null;
      if (root.value) syncSegmentedIndicator(root.value, false);
    });
  });
  ro.observe(root.value);
});

watch(
  () => [model.value, props.size, props.fullWidth, props.options?.length],
  async (_, prev) => {
    await nextTick();
    if (root.value) syncSegmentedIndicator(root.value, prev !== undefined);
  },
);

onBeforeUnmount(() => {
  if (raf !== null) cancelAnimationFrame(raf);
  ro?.disconnect();
});
</script>

<template>
  <div
    ref="root"
    class="j-segmented"
    role="radiogroup"
    data-j-managed=""
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :data-full-width="fullWidth ? '' : undefined"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-labelledby="field?.labelId.value"
    :aria-describedby="field?.describedBy.value"
    @keydown="onKeydown"
  >
    <span class="j-segmented__indicator" aria-hidden="true" />
    <template v-if="options?.length">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="j-segmented__item"
        role="radio"
        :data-value="opt.value"
        :aria-checked="model === opt.value ? 'true' : 'false'"
        :tabindex="model === opt.value ? 0 : -1"
        :disabled="isDisabled || opt.disabled || undefined"
        @click="select(opt.value)"
      >
        {{ opt.label }}
      </button>
    </template>
    <slot v-else />
  </div>
</template>
