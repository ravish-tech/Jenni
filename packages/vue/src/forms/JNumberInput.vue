<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { clampNumberValue, stepNumberValue } from 'jenni-core/behaviors/number-input.js';
import { sizeAttr, splitAttrs, useFieldAttrs, type Size, type Tone } from './types';

defineOptions({ inheritAttrs: false });

const model = defineModel<number | null>({ default: null });
const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    step?: number;
    controls?: 'end' | 'split';
    prefix?: string;
    suffix?: string;
    placeholder?: string;
    size?: Size;
    tone?: Tone;
    disabled?: boolean;
    invalid?: boolean;
    readonly?: boolean;
  }>(),
  { step: 1, controls: 'end' },
);
defineSlots<{ prefix?(): unknown; suffix?(): unknown }>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const parts = computed(() => splitAttrs(attrs));
const inputEl = useTemplateRef<HTMLInputElement>('inputEl');

const draft = ref(model.value != null && Number.isFinite(model.value) ? String(model.value) : '');
const focused = ref(false);

watch(
  () => model.value,
  (val) => {
    if (!focused.value) {
      draft.value = val != null && Number.isFinite(val) ? String(val) : '';
    }
  },
);

const isDisabled = computed(() => !!(props.disabled || field.value.disabled));
const isInvalid = computed(() => !!(props.invalid || field.value['aria-invalid']));
const atMin = computed(
  () => props.min !== undefined && model.value != null && Number.isFinite(model.value) && model.value <= props.min,
);
const atMax = computed(
  () => props.max !== undefined && model.value != null && Number.isFinite(model.value) && model.value >= props.max,
);

function applyStep(delta: number) {
  if (isDisabled.value || props.readonly) return;
  const next = stepNumberValue(model.value, delta, {
    min: props.min,
    max: props.max,
    step: props.step,
  });
  model.value = next;
  draft.value = String(next);
}

function onStepClick(dir: -1 | 1, e: MouseEvent) {
  const mult = e.shiftKey ? 10 : 1;
  applyStep(dir * mult);
  inputEl.value?.focus();
}

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  draft.value = raw;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
    if (trimmed === '') model.value = null;
    return;
  }
  const parsed = Number(trimmed);
  if (Number.isFinite(parsed)) {
    model.value = parsed;
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    const mult = e.shiftKey ? 10 : 1;
    applyStep(e.key === 'ArrowUp' ? mult : -mult);
  }
}

function onBlur() {
  focused.value = false;
  const trimmed = draft.value.trim();
  if (!trimmed || trimmed === '-' || trimmed === '.') {
    model.value = null;
    draft.value = '';
    return;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    draft.value = model.value != null ? String(model.value) : '';
    return;
  }
  const clamped = clampNumberValue(parsed, {
    min: props.min,
    max: props.max,
    step: props.step,
  });
  model.value = clamped;
  draft.value = String(clamped);
}

defineExpose({ focus: () => inputEl.value?.focus(), input: inputEl });
</script>

<template>
  <div
    class="j-number-input"
    data-j-managed=""
    :data-controls="controls === 'split' ? 'split' : undefined"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-invalid="isInvalid ? 'true' : undefined"
    v-bind="parts.root"
  >
    <button
      v-if="controls === 'split'"
      type="button"
      class="j-number-input__btn"
      data-step="down"
      aria-label="Decrease value"
      tabindex="-1"
      :disabled="isDisabled || readonly || atMin || undefined"
      @click="onStepClick(-1, $event)"
    >
      −
    </button>

    <span v-if="prefix || $slots.prefix" class="j-number-input__addon">
      <slot name="prefix">{{ prefix }}</slot>
    </span>

    <input
      ref="inputEl"
      type="text"
      inputmode="decimal"
      role="spinbutton"
      class="j-number-input__field"
      :value="draft"
      :placeholder="placeholder"
      :readonly="readonly || undefined"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="model ?? undefined"
      v-bind="{ ...field, ...parts.control, disabled: isDisabled || undefined }"
      @focus="focused = true"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    />

    <span v-if="suffix || $slots.suffix" class="j-number-input__addon">
      <slot name="suffix">{{ suffix }}</slot>
    </span>

    <button
      v-if="controls === 'split'"
      type="button"
      class="j-number-input__btn"
      data-step="up"
      aria-label="Increase value"
      tabindex="-1"
      :disabled="isDisabled || readonly || atMax || undefined"
      @click="onStepClick(1, $event)"
    >
      +
    </button>

    <div v-else class="j-number-input__controls">
      <button
        type="button"
        class="j-number-input__btn"
        data-step="down"
        aria-label="Decrease value"
        tabindex="-1"
        :disabled="isDisabled || readonly || atMin || undefined"
        @click="onStepClick(-1, $event)"
      >
        −
      </button>
      <button
        type="button"
        class="j-number-input__btn"
        data-step="up"
        aria-label="Increase value"
        tabindex="-1"
        :disabled="isDisabled || readonly || atMax || undefined"
        @click="onStepClick(1, $event)"
      >
        +
      </button>
    </div>
  </div>
</template>
