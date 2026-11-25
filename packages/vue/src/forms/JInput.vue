<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { sizeAttr, splitAttrs, useFieldAttrs, type Size, type Tone } from './types';

export interface JInputProps {
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  clearable?: boolean;
  clearLabel?: string;
}

defineOptions({ inheritAttrs: false });

const model = defineModel<string | number>();
const props = withDefaults(defineProps<JInputProps>(), {
  clearLabel: 'Clear input',
});
const emit = defineEmits<{ clear: [] }>();
defineSlots<{ prefix?(): unknown; suffix?(): unknown }>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const input = useTemplateRef<HTMLInputElement>('input');
const parts = computed(() => splitAttrs(attrs));

const isTruthyAttr = (val: unknown) => val === '' || Boolean(val);
const isDisabled = computed(
  () => isTruthyAttr(attrs.disabled) || Boolean(field.value.disabled),
);
const isReadonly = computed(
  () => isTruthyAttr(attrs.readonly) || isTruthyAttr(attrs.readOnly),
);
const showClear = computed(
  () =>
    Boolean(props.clearable) &&
    String(model.value ?? attrs.value ?? '').length > 0 &&
    !isDisabled.value &&
    !isReadonly.value,
);

/** Clicking the group's padding or a text addon focuses the input. */
function focusInput(e: PointerEvent) {
  const target = e.target as Element;
  if (target === input.value || target.closest('button, a, input, select, textarea, [tabindex]')) return;
  e.preventDefault();
  input.value?.focus();
}

function handleClear() {
  model.value = '';
  if (input.value && input.value.value !== '') {
    input.value.value = '';
  }
  emit('clear');
  input.value?.focus();
}

defineExpose({ focus: () => input.value?.focus(), input });
</script>

<template>
  <div
    v-if="clearable || $slots.prefix || $slots.suffix"
    class="j-input-group"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    v-bind="parts.root"
    @pointerdown="focusInput"
  >
    <span v-if="$slots.prefix" class="j-input-group__addon"><slot name="prefix" /></span>
    <input ref="input" v-model="model" class="j-input" v-bind="{ ...field, ...parts.control }" />
    <button
      v-if="showClear"
      type="button"
      class="j-input-group__clear"
      :aria-label="clearLabel"
      @click="handleClear"
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
        <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
      </svg>
    </button>
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
