<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { sizeAttr, useFieldAttrs, type Size, type Tone } from './types';

const model = defineModel<number>();
const props = withDefaults(
  defineProps<{
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number | 'any';
    size?: Size;
    tone?: Tone;
    invalid?: boolean;
  }>(),
  { min: 0, max: 100, step: 1 },
);

if (model.value === undefined) {
  model.value = props.defaultValue ?? props.min;
}

const current = computed(() => model.value ?? props.defaultValue ?? props.min);
const field = useFieldAttrs(() => props.invalid);
const progress = computed(() => {
  const span = props.max - props.min;
  return span > 0 ? Math.min(1, Math.max(0, (current.value - props.min) / span)) : 0;
});

function onInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const next = input.valueAsNumber;
  model.value = next;
  nextTick(() => {
    if (input.valueAsNumber !== current.value) {
      input.value = String(current.value);
    }
  });
}
</script>

<template>
  <input
    type="range"
    class="j-slider"
    :min="min"
    :max="max"
    :step="step"
    :value="current"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :style="{ '--j-slider-progress': progress }"
    v-bind="field"
    @input="onInput"
  />
</template>
