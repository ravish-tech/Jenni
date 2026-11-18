<script setup lang="ts">
// JCombobox — accessible WAI-ARIA 1.2 combobox + anchored popover listbox.
// Supports single (`v-model: string | null`) and `multiple` (`v-model: string[]`)
// with live filtering, grouped headers, checkmark indicators, and active-descendant
// keyboard navigation without stealing focus from the input.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { anchorCombobox } from '@jenni/core/behaviors/combobox.js';
import type { ComboboxOption, ComboboxSize } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | string[] | null;
    options?: ComboboxOption[];
    multiple?: boolean;
    placeholder?: string;
    emptyText?: string;
    size?: ComboboxSize;
    clearable?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    name?: string;
    filter?: (option: ComboboxOption, query: string) => boolean;
  }>(),
  {
    options: () => [],
    emptyText: 'No matches found',
    size: 'md',
    clearable: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: any];
  change: [value: any];
}>();

const baseId = useId();
const listboxId = `${baseId}-listbox`;
const shellEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);
const listboxEl = ref<HTMLElement | null>(null);

const open = ref(false);
const query = ref('');
const isTyping = ref(false);
const activeValue = ref<string | null>(null);
let stopAnchor: (() => void) | null = null;

const selectedValues = computed<string[]>(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  }
  return typeof props.modelValue === 'string' && props.modelValue ? [props.modelValue] : [];
});

const selectedSingleOption = computed(() =>
  props.multiple
    ? undefined
    : props.options.find((o) => o.value === props.modelValue),
);

const selectedChipOptions = computed(() => {
  if (!props.multiple) return [];
  const map = new Map(props.options.map((o) => [o.value, o]));
  return selectedValues.value.map((v) => map.get(v) ?? { value: v, label: v });
});

const displayValue = computed(() => {
  if (props.multiple) return query.value;
  if (isTyping.value) return query.value;
  return selectedSingleOption.value?.label ?? '';
});

const defaultFilter = (opt: ComboboxOption, q: string) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    opt.label.toLowerCase().includes(needle) ||
    (opt.description?.toLowerCase().includes(needle) ?? false) ||
    (opt.group?.toLowerCase().includes(needle) ?? false)
  );
};

const filteredOptions = computed(() => {
  const q = isTyping.value ? query.value : '';
  if (!q.trim()) return props.options;
  const fn = props.filter ?? defaultFilter;
  return props.options.filter((opt) => fn(opt, q));
});

interface OptionBucket {
  group: string | null;
  items: ComboboxOption[];
}

const groupedBuckets = computed<OptionBucket[]>(() => {
  const buckets: OptionBucket[] = [];
  const byName = new Map<string | null, OptionBucket>();
  for (const opt of filteredOptions.value) {
    const key = opt.group ?? null;
    let bucket = byName.get(key);
    if (!bucket) {
      bucket = { group: key, items: [] };
      byName.set(key, bucket);
      buckets.push(bucket);
    }
    bucket.items.push(opt);
  }
  return buckets;
});

const enabledFiltered = computed(() => filteredOptions.value.filter((o) => !o.disabled));

const showClear = computed(() => {
  if (!props.clearable || props.disabled) return false;
  if (props.multiple) return selectedValues.value.length > 0 || query.value.length > 0;
  return Boolean(props.modelValue || query.value);
});

const optionDomId = (val: string) =>
  `${baseId}-opt-${encodeURIComponent(val).replace(/%/g, '_')}`;

const activeDescendantId = computed(() =>
  open.value && activeValue.value ? optionDomId(activeValue.value) : undefined,
);

function isSelected(val: string) {
  return selectedValues.value.includes(val);
}

function showListbox() {
  if (props.disabled || !listboxEl.value) return;
  if (!listboxEl.value.matches(':popover-open')) {
    try {
      listboxEl.value.showPopover();
    } catch {
      /* ignore */
    }
  }
}

function hideListbox() {
  if (listboxEl.value?.matches(':popover-open')) {
    try {
      listboxEl.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
}

function scrollActiveIntoView() {
  nextTick(() => {
    if (!activeValue.value || !listboxEl.value) return;
    const node = listboxEl.value.querySelector(`[data-value="${CSS.escape(activeValue.value)}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  });
}

function pickInitialHighlight(preferLast = false) {
  const list = enabledFiltered.value;
  if (!list.length) {
    activeValue.value = null;
    return;
  }
  if (preferLast) {
    activeValue.value = list[list.length - 1]!.value;
  } else {
    const sel = list.find((o) => isSelected(o.value));
    activeValue.value = (sel ?? list[0])!.value;
  }
  scrollActiveIntoView();
}

function onToggle(e: Event) {
  const opened = (e as ToggleEvent).newState === 'open';
  open.value = opened;
  if (opened) {
    if (activeValue.value == null) pickInitialHighlight(false);
  } else {
    isTyping.value = false;
    query.value = '';
    activeValue.value = null;
  }
}

function commitValue(next: string | string[] | null) {
  emit('update:modelValue', next);
  emit('change', next);
}

function selectOption(opt: ComboboxOption) {
  if (opt.disabled || props.disabled) return;
  if (props.multiple) {
    const cur = selectedValues.value;
    const next = cur.includes(opt.value)
      ? cur.filter((v) => v !== opt.value)
      : [...cur, opt.value];
    query.value = '';
    isTyping.value = false;
    commitValue(next);
    inputEl.value?.focus();
  } else {
    isTyping.value = false;
    query.value = '';
    commitValue(opt.value);
    hideListbox();
    inputEl.value?.focus();
  }
}

function removeChip(val: string) {
  if (props.disabled || !props.multiple) return;
  commitValue(selectedValues.value.filter((v) => v !== val));
  inputEl.value?.focus();
}

function clearAll() {
  if (props.disabled) return;
  query.value = '';
  isTyping.value = false;
  commitValue(props.multiple ? [] : null);
  inputEl.value?.focus();
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  query.value = val;
  isTyping.value = true;
  if (!open.value) showListbox();
  const list = enabledFiltered.value;
  if (!list.some((o) => o.value === activeValue.value)) {
    activeValue.value = list[0]?.value ?? null;
  }
  scrollActiveIntoView();
}

function onKeyDown(e: KeyboardEvent) {
  if (props.disabled) return;
  const list = enabledFiltered.value;
  const idx = list.findIndex((o) => o.value === activeValue.value);

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (!open.value) {
        pickInitialHighlight(false);
        showListbox();
      } else if (list.length) {
        activeValue.value = list[idx < list.length - 1 ? idx + 1 : 0]!.value;
        scrollActiveIntoView();
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!open.value) {
        pickInitialHighlight(true);
        showListbox();
      } else if (list.length) {
        activeValue.value = list[idx > 0 ? idx - 1 : list.length - 1]!.value;
        scrollActiveIntoView();
      }
      break;
    case 'Home':
      if (open.value && list.length) {
        e.preventDefault();
        activeValue.value = list[0]!.value;
        scrollActiveIntoView();
      }
      break;
    case 'End':
      if (open.value && list.length) {
        e.preventDefault();
        activeValue.value = list[list.length - 1]!.value;
        scrollActiveIntoView();
      }
      break;
    case 'Enter':
      if (open.value && idx >= 0) {
        e.preventDefault();
        selectOption(list[idx]!);
      }
      break;
    case 'Escape':
      if (open.value) {
        e.preventDefault();
        e.stopPropagation();
        hideListbox();
      }
      break;
    case 'Tab':
      if (open.value) hideListbox();
      break;
    case 'Backspace':
      if (props.multiple && !query.value && selectedValues.value.length > 0) {
        commitValue(selectedValues.value.slice(0, -1));
      }
      break;
    default:
      break;
  }
}

function onShellClick(e: MouseEvent) {
  if (props.disabled) return;
  const target = e.target as HTMLElement | null;
  if (target?.closest('.j-combobox__clear, .j-combobox__chevron, .j-combobox__chip-remove')) return;
  inputEl.value?.focus();
  showListbox();
}

function toggleChevron() {
  if (props.disabled) return;
  inputEl.value?.focus();
  if (open.value) hideListbox();
  else showListbox();
}

onMounted(() => {
  if (shellEl.value && listboxEl.value) {
    stopAnchor = anchorCombobox(shellEl.value, listboxEl.value);
  }
});

watch(enabledFiltered, (list) => {
  if (!open.value) return;
  if (!list.some((o) => o.value === activeValue.value)) {
    activeValue.value = list[0]?.value ?? null;
  }
});

onBeforeUnmount(() => stopAnchor?.());
</script>

<template>
  <div
    ref="shellEl"
    class="j-combobox"
    :data-size="size === 'md' ? undefined : size"
    :data-multiple="multiple ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :aria-invalid="invalid ? 'true' : undefined"
    v-bind="$attrs"
    @click="onShellClick"
  >
    <input
      v-if="name && !multiple"
      type="hidden"
      :name="name"
      :value="typeof modelValue === 'string' ? modelValue : ''"
    />
    <template v-if="name && multiple">
      <input v-for="v in selectedValues" :key="v" type="hidden" :name="name" :value="v" />
    </template>

    <span v-if="multiple && selectedChipOptions.length" class="j-combobox__chips">
      <span v-for="chip in selectedChipOptions" :key="chip.value" class="j-combobox__chip">
        <span class="j-combobox__chip-label">{{ chip.label }}</span>
        <button
          v-if="!disabled"
          type="button"
          tabindex="-1"
          class="j-combobox__chip-remove"
          :aria-label="`Remove ${chip.label}`"
          @pointerdown.prevent
          @click.stop="removeChip(chip.value)"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </span>
    </span>

    <input
      ref="inputEl"
      type="text"
      class="j-combobox__input"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="listboxId"
      :aria-activedescendant="activeDescendantId"
      :aria-invalid="invalid ? 'true' : undefined"
      :placeholder="multiple && selectedChipOptions.length ? '' : placeholder"
      :disabled="disabled"
      :value="displayValue"
      @input="onInput"
      @keydown="onKeyDown"
    />

    <div class="j-combobox__controls">
      <button
        v-if="showClear"
        type="button"
        tabindex="-1"
        class="j-combobox__clear"
        aria-label="Clear selection"
        @pointerdown.prevent
        @click="clearAll"
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
      <button
        type="button"
        tabindex="-1"
        class="j-combobox__chevron"
        aria-label="Toggle options"
        :disabled="disabled"
        @pointerdown.prevent
        @click="toggleChevron"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
        </svg>
      </button>
    </div>
  </div>

  <div
    :id="listboxId"
    ref="listboxEl"
    class="j-combobox__listbox"
    popover="auto"
    role="listbox"
    :aria-multiselectable="multiple ? 'true' : undefined"
    @pointerdown.prevent
    @toggle="onToggle"
  >
    <template v-if="groupedBuckets.length">
      <template v-for="(bucket, bIdx) in groupedBuckets" :key="bucket.group ?? `__ungrouped_${bIdx}`">
        <div v-if="bucket.group" class="j-combobox__group" role="group" :aria-label="bucket.group">
          <div class="j-combobox__group-label">{{ bucket.group }}</div>
          <div
            v-for="opt in bucket.items"
            :id="optionDomId(opt.value)"
            :key="opt.value"
            class="j-combobox__option"
            role="option"
            :data-value="opt.value"
            :data-highlighted="activeValue === opt.value ? '' : undefined"
            :aria-selected="isSelected(opt.value) ? 'true' : 'false'"
            :aria-disabled="opt.disabled ? 'true' : undefined"
            @pointerenter="opt.disabled ? undefined : (activeValue = opt.value)"
            @click="selectOption(opt)"
          >
            <div class="j-combobox__option-body">
              <span class="j-combobox__option-label">{{ opt.label }}</span>
              <span v-if="opt.description" class="j-combobox__option-description">
                {{ opt.description }}
              </span>
            </div>
          </div>
        </div>
        <template v-else>
          <div
            v-for="opt in bucket.items"
            :id="optionDomId(opt.value)"
            :key="opt.value"
            class="j-combobox__option"
            role="option"
            :data-value="opt.value"
            :data-highlighted="activeValue === opt.value ? '' : undefined"
            :aria-selected="isSelected(opt.value) ? 'true' : 'false'"
            :aria-disabled="opt.disabled ? 'true' : undefined"
            @pointerenter="opt.disabled ? undefined : (activeValue = opt.value)"
            @click="selectOption(opt)"
          >
            <div class="j-combobox__option-body">
              <span class="j-combobox__option-label">{{ opt.label }}</span>
              <span v-if="opt.description" class="j-combobox__option-description">
                {{ opt.description }}
              </span>
            </div>
          </div>
        </template>
      </template>
    </template>
    <div v-else class="j-combobox__empty">{{ emptyText }}</div>
  </div>
</template>
