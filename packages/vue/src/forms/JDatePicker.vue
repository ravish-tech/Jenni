<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';
import {
  anchorDatePopover,
  formatDisplayDate,
  formatDisplayRange,
} from 'jenni-core/behaviors/date-picker.js';
import JCalendar from './JCalendar.vue';
import {
  sizeAttr,
  splitAttrs,
  useFieldAttrs,
  type DatePickerMode,
  type DateRange,
  type Size,
  type Tone,
} from './types';

defineOptions({ inheritAttrs: false });

const model = defineModel<string | DateRange | null>({ default: null });

const props = withDefaults(
  defineProps<{
    mode?: DatePickerMode;
    min?: string;
    max?: string;
    weekStartsOn?: 0 | 1;
    placeholder?: string;
    clearable?: boolean;
    showFooter?: boolean;
    size?: Size;
    tone?: Tone;
    disabled?: boolean;
    invalid?: boolean;
    name?: string;
    locale?: string;
  }>(),
  {
    mode: 'single',
    weekStartsOn: 0,
    clearable: true,
    showFooter: true,
    locale: 'en-US',
  },
);

const emit = defineEmits<{
  change: [value: string | DateRange | null];
}>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const parts = computed(() => splitAttrs(attrs));

const popId = `${useId()}-cal`;
const shellEl = useTemplateRef<HTMLElement>('shellEl');
const triggerEl = useTemplateRef<HTMLButtonElement>('triggerEl');
const popoverEl = useTemplateRef<HTMLElement>('popoverEl');

const open = ref(false);
let stopAnchor: (() => void) | null = null;

const isDisabled = computed(() => !!(props.disabled || field.value.disabled));
const isInvalid = computed(() => !!(props.invalid || field.value['aria-invalid']));

const displayLabel = computed(() => {
  if (props.mode === 'single') {
    return typeof model.value === 'string' && model.value
      ? formatDisplayDate(model.value, props.locale)
      : '';
  }
  if (model.value && typeof model.value === 'object') {
    return formatDisplayRange(model.value, props.locale);
  }
  return '';
});

const effectivePlaceholder = computed(
  () => props.placeholder ?? (props.mode === 'range' ? 'Select date range' : 'Select date'),
);

const showClear = computed(() => props.clearable && !isDisabled.value && Boolean(displayLabel.value));

const hiddenInputValue = computed(() => {
  if (props.mode === 'single') {
    return typeof model.value === 'string' ? model.value : '';
  }
  if (model.value && typeof model.value === 'object') {
    const s = model.value.start ?? '';
    const e = model.value.end ?? '';
    return s || e ? `${s}/${e}` : '';
  }
  return '';
});

function showPopover() {
  if (isDisabled.value || !popoverEl.value) return;
  if (!popoverEl.value.matches(':popover-open')) {
    try {
      popoverEl.value.showPopover();
    } catch {
      /* ignore */
    }
  }
}

function hidePopover() {
  if (popoverEl.value?.matches(':popover-open')) {
    try {
      popoverEl.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
}

function togglePopover() {
  if (isDisabled.value) return;
  if (open.value) hidePopover();
  else showPopover();
}

function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open';
}

function onComplete(val: string | DateRange | null) {
  emit('change', val);
  hidePopover();
  triggerEl.value?.focus();
}

function onChange(val: string | DateRange | null) {
  emit('change', val);
}

function clearValue() {
  if (isDisabled.value) return;
  const next = props.mode === 'single' ? null : { start: null, end: null };
  model.value = next;
  emit('change', next);
  triggerEl.value?.focus();
}

watch(isDisabled, (dis) => {
  if (dis && open.value) hidePopover();
});

onMounted(() => {
  if (shellEl.value && popoverEl.value) {
    stopAnchor = anchorDatePopover(shellEl.value, popoverEl.value);
  }
});

onBeforeUnmount(() => stopAnchor?.());

defineExpose({ focus: () => triggerEl.value?.focus(), show: showPopover, hide: hidePopover });
</script>

<template>
  <div
    ref="shellEl"
    class="j-date-picker"
    data-j-managed=""
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :data-open="open ? '' : undefined"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-invalid="isInvalid ? 'true' : undefined"
    v-bind="parts.root"
  >
    <input v-if="name" type="hidden" :name="name" :value="hiddenInputValue" />
    <button
      ref="triggerEl"
      type="button"
      class="j-date-picker__trigger"
      aria-haspopup="dialog"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="popId"
      v-bind="{ ...field, ...parts.control, disabled: isDisabled || undefined }"
      @click="togglePopover"
    >
      <span class="j-date-picker__icon" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="1.75" />
          <path d="M5.25 1.75v2.5M10.75 1.75v2.5M2.25 6.75h11.5" />
        </svg>
      </span>
      <span
        class="j-date-picker__value"
        :data-placeholder="displayLabel ? undefined : ''"
      >
        {{ displayLabel || effectivePlaceholder }}
      </span>
    </button>

    <button
      v-if="showClear"
      type="button"
      class="j-date-picker__clear"
      aria-label="Clear date"
      tabindex="-1"
      @click.stop="clearValue"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
      </svg>
    </button>
  </div>

  <div
    :id="popId"
    ref="popoverEl"
    class="j-date-picker__popover"
    popover="auto"
    data-align="start"
    :data-tone="tone"
    @toggle="onToggle"
  >
    <JCalendar
      v-model="model"
      :mode="mode"
      :min="min"
      :max="max"
      :week-starts-on="weekStartsOn"
      :show-footer="showFooter"
      :tone="tone"
      :disabled="isDisabled"
      :locale="locale"
      @change="onChange"
      @complete="onComplete"
    />
  </div>
</template>
