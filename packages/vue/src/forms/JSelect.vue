<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { sizeAttr, splitAttrs, useFieldAttrs, type Size, type Tone } from './types';

export type SelectOption = string | number | { label: string; value: string | number; disabled?: boolean };

export interface JSelectProps {
  options?: SelectOption[];
  placeholder?: string;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  emptyValue?: string | number;
  clearLabel?: string;
  clearTooltip?: string;
}

defineOptions({ inheritAttrs: false });

const model = defineModel<string | number>();
const props = withDefaults(defineProps<JSelectProps>(), {
  emptyValue: '',
  clearLabel: 'Clear',
});
const emit = defineEmits<{ clear: [] }>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const selectEl = useTemplateRef<HTMLSelectElement>('select');
const parts = computed(() => splitAttrs(attrs));

const isTruthyAttr = (val: unknown) => val === '' || Boolean(val);
const isDisabled = computed(
  () => Boolean(props.disabled) || isTruthyAttr(attrs.disabled) || Boolean(field.value.disabled),
);
const isMultiple = computed(() => isTruthyAttr(attrs.multiple));

const currentVal = computed(() =>
  model.value !== undefined ? model.value : (attrs.value as string | number | undefined),
);

const showClear = computed(
  () =>
    Boolean(props.clearable) &&
    !isMultiple.value &&
    !isDisabled.value &&
    currentVal.value !== undefined &&
    currentVal.value !== null &&
    currentVal.value !== props.emptyValue &&
    String(currentVal.value) !== String(props.emptyValue),
);

const normalized = computed(() =>
  (props.options ?? []).map((o) =>
    typeof o === 'object' ? o : { label: String(o), value: o, disabled: false },
  ),
);
const showPlaceholder = computed(() => !!props.placeholder);

function handleClear() {
  model.value = props.emptyValue;
  if (selectEl.value) {
    selectEl.value.value = String(props.emptyValue ?? '');
    if (typeof Event === 'function') {
      selectEl.value.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  emit('clear');
  selectEl.value?.focus();
}

defineExpose({ focus: () => selectEl.value?.focus(), select: selectEl });
</script>

<template>
  <div
    v-if="clearable && !isMultiple"
    class="j-select-wrap"
    :data-size="sizeAttr(size)"
    :data-has-clear="showClear ? '' : undefined"
    v-bind="parts.root"
  >
    <select
      ref="select"
      v-model="model"
      class="j-select"
      :data-size="sizeAttr(size)"
      :data-tone="tone"
      v-bind="{ ...field, ...parts.control }"
      :disabled="isDisabled || undefined"
    >
      <option
        v-if="showPlaceholder || (clearable && !isMultiple)"
        :value="emptyValue"
        disabled
        hidden
      >
        {{ placeholder ?? '' }}
      </option>
      <option v-for="o in normalized" :key="o.value" :value="o.value" :disabled="o.disabled">
        {{ o.label }}
      </option>
      <slot />
    </select>
    <button
      v-if="showClear"
      type="button"
      class="j-select__clear"
      :aria-label="clearLabel"
      :title="clearTooltip || clearLabel"
      @click="handleClear"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        shape-rendering="geometricPrecision"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
  <select
    v-else
    ref="select"
    v-model="model"
    class="j-select"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    v-bind="{ ...field, ...attrs }"
    :disabled="isDisabled || undefined"
  >
    <option
      v-if="showPlaceholder"
      :value="emptyValue"
      disabled
      hidden
    >
      {{ placeholder }}
    </option>
    <option v-for="o in normalized" :key="o.value" :value="o.value" :disabled="o.disabled">
      {{ o.label }}
    </option>
    <slot />
  </select>
</template>
