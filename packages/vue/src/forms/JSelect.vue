<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { sizeAttr, useFieldAttrs, type Size, type Tone } from './types';

export type SelectOption = string | number | { label: string; value: string | number; disabled?: boolean };

defineOptions({ inheritAttrs: false });

const model = defineModel<string | number>();
const props = defineProps<{
  options?: SelectOption[];
  placeholder?: string;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
}>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const normalized = computed(() =>
  (props.options ?? []).map((o) => (typeof o === 'object' ? o : { label: String(o), value: o, disabled: false })),
);
const showPlaceholder = computed(() => !!props.placeholder);
</script>

<template>
  <select
    v-model="model"
    class="j-select"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    v-bind="{ ...field, ...attrs }"
  >
    <option v-if="showPlaceholder" :value="model === undefined ? undefined : ''" disabled hidden>{{ placeholder }}</option>
    <option v-for="o in normalized" :key="o.value" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
    <slot />
  </select>
</template>
