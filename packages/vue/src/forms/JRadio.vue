<script setup lang="ts">
import { computed, inject, useAttrs, useSlots } from 'vue';
import { RadioGroupKey, sizeAttr, splitAttrs, type Size, type Tone } from './types';

defineOptions({ inheritAttrs: false });

/** Standalone use only; inside JRadioGroup the group's v-model is used. */
const model = defineModel<string | number>();
const props = defineProps<{
  value: string | number;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
}>();
defineSlots<{ default?(): unknown; description?(): unknown }>();

const attrs = useAttrs();
const slots = useSlots();
const group = inject(RadioGroupKey, null);
const parts = computed(() => splitAttrs(attrs));
const hasLabel = computed(() => !!(slots.default || props.label));

const isChecked = computed(() => (group ? group.model.value : model.value) === props.value);
const control = computed(() => ({
  type: 'radio',
  class: 'j-radio',
  name: group?.name.value,
  value: props.value,
  checked: isChecked.value,
  disabled: props.disabled || group?.disabled.value || undefined,
  'aria-invalid': props.invalid || group?.invalid.value ? ('true' as const) : undefined,
  'data-size': sizeAttr(props.size ?? group?.size.value),
  'data-tone': props.tone ?? group?.tone.value,
}));

function onChange(e: Event) {
  if (!(e.target as HTMLInputElement).checked) return;
  if (group) group.model.value = props.value;
  else model.value = props.value;
}
</script>

<template>
  <label v-if="hasLabel" class="j-choice" v-bind="parts.root">
    <input v-bind="{ ...control, ...parts.control }" @change="onChange" />
    <span class="j-choice__body">
      <span class="j-choice__label"><slot>{{ label }}</slot></span>
      <span v-if="description || $slots.description" class="j-choice__description">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>
  <input v-else v-bind="{ ...control, ...attrs }" @change="onChange" />
</template>
