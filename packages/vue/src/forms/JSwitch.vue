<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { sizeAttr, splitAttrs, useFieldAttrs, type Size, type Tone } from './types';

defineOptions({ inheritAttrs: false });

const checked = defineModel<boolean>({ default: false });
const props = defineProps<{
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  label?: string;
  description?: string;
  /** Put the switch after the text (settings-row layout). */
  placement?: 'start' | 'end';
}>();
defineSlots<{ default?(): unknown; description?(): unknown }>();

const attrs = useAttrs();
const slots = useSlots();
const field = useFieldAttrs(() => props.invalid);
const parts = computed(() => splitAttrs(attrs));
const hasLabel = computed(() => !!(slots.default || props.label));

function onChange(e: Event) {
  checked.value = (e.target as HTMLInputElement).checked;
}
</script>

<template>
  <label v-if="hasLabel" class="j-choice" :data-placement="placement === 'end' ? 'end' : undefined" v-bind="parts.root">
    <input
      type="checkbox"
      role="switch"
      class="j-switch"
      :data-size="sizeAttr(size)"
      :data-tone="tone"
      :checked="checked"
      v-bind="{ ...field, ...parts.control }"
      @change="onChange"
    />
    <span class="j-choice__body">
      <span class="j-choice__label"><slot>{{ label }}</slot></span>
      <span v-if="description || $slots.description" class="j-choice__description">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>
  <input
    v-else
    type="checkbox"
    role="switch"
    class="j-switch"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :checked="checked"
    v-bind="{ ...field, ...attrs }"
    @change="onChange"
  />
</template>
