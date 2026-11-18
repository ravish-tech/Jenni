<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { sizeAttr, splitAttrs, useFieldAttrs, type Size, type Tone } from './types';

defineOptions({ inheritAttrs: false });

const model = defineModel<string | number>();
const props = defineProps<{ size?: Size; tone?: Tone; invalid?: boolean }>();
defineSlots<{ prefix?(): unknown; suffix?(): unknown }>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const input = useTemplateRef<HTMLInputElement>('input');
const parts = computed(() => splitAttrs(attrs));

/** Clicking the group's padding or a text addon focuses the input. */
function focusInput(e: PointerEvent) {
  const target = e.target as Element;
  if (target === input.value || target.closest('button, a, input, select, textarea, [tabindex]')) return;
  e.preventDefault();
  input.value?.focus();
}

defineExpose({ focus: () => input.value?.focus(), input });
</script>

<template>
  <div
    v-if="$slots.prefix || $slots.suffix"
    class="j-input-group"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    v-bind="parts.root"
    @pointerdown="focusInput"
  >
    <span v-if="$slots.prefix" class="j-input-group__addon"><slot name="prefix" /></span>
    <input ref="input" v-model="model" class="j-input" v-bind="{ ...field, ...parts.control }" />
    <span v-if="$slots.suffix" class="j-input-group__addon"><slot name="suffix" /></span>
  </div>
  <input
    v-else
    ref="input"
    v-model="model"
    class="j-input"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    v-bind="{ ...field, ...attrs }"
  />
</template>
