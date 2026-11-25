<script setup lang="ts">
// JCombobox — accessible WAI-ARIA 1.2 combobox + anchored popover listbox.
// Supports single (`v-model: string | null`) and `multiple` (`v-model: string[]`)
// with live or server-driven filtering, grouped headers, free-text custom values,
// inline creatable options, and active-descendant keyboard navigation.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { anchorCombobox } from 'jenni-core/behaviors/combobox.js';
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
    filter?: boolean | ((option: ComboboxOption, query: string) => boolean);
    allowCustomValue?: boolean;
    freeSolo?: boolean;
    commitOnBlur?: boolean;
    creatable?: boolean | ((query: string) => string);
    loading?: boolean;
    loadingText?: string;
    debounce?: number;
    search?: string;
  }>(),
  {
    options: () => [],
    emptyText: 'No matches found',
    loadingText: 'Searching…',
    size: 'md',
    clearable: true,
    filter: true,
    commitOnBlur: undefined,
    creatable: false,
    debounce: 0,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: any];
  change: [value: any];
  'update:search': [query: string];
  search: [query: string];
  create: [value: string];
}>();

const baseId = useId();
const listboxId = `${baseId}-listbox`;
const shellEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);
const listboxEl = ref<HTMLElement | null>(null);

const open = ref(false);
const query = ref(props.search ?? '');
const isTyping = ref(Boolean(props.search));
const activeValue = ref<string | null>(null);
let stopAnchor: (() => void) | null = null;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let lastInternalSearch: string | undefined = props.search;

const knownOptions = new Map<string, ComboboxOption>();
watch(
  () => props.options,
  (list) => {
    for (const opt of list) {
      knownOptions.set(opt.value, opt);
    }
  },
  { immediate: true },
);

watch(
  () => props.search,
  (next) => {
    const resolved = next ?? '';
    if (resolved !== query.value) {
      query.value = resolved;
    }
    if (next !== lastInternalSearch) {
      lastInternalSearch = next;
      isTyping.value = Boolean(next && next.length > 0);
    }
  },
);

const isFreeSolo = computed(() => Boolean(props.allowCustomValue || props.freeSolo));

const effectiveCommitOnBlur = computed(() =>
  props.commitOnBlur !== undefined ? props.commitOnBlur : !props.multiple && isFreeSolo.value,
);

function clearSearchTimer() {
  if (searchTimer !== null) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
}

function updateQuery(next: string, emitImmediateSearch = false, emitDebouncedSearch = false) {
  const changed = query.value !== next;
  query.value = next;
  lastInternalSearch = next;
  if (changed || props.search !== undefined) {
    if (changed || props.search !== next) {
      emit('update:search', next);
    }
  }
  if (emitImmediateSearch) {
    clearSearchTimer();
    emit('search', next);
  } else if (emitDebouncedSearch) {
    clearSearchTimer();
    const ms = props.debounce ?? 0;
    if (ms <= 0) {
      emit('search', next);
    } else {
      searchTimer = setTimeout(() => {
        searchTimer = null;
        emit('search', next);
      }, ms);
    }
  }
}

const selectedValues = computed<string[]>(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : [];
  }
  return typeof props.modelValue === 'string' && props.modelValue ? [props.modelValue] : [];
});

const selectedSingleOption = computed(() => {
  if (props.multiple || typeof props.modelValue !== 'string' || !props.modelValue) {
    return undefined;
  }
  return props.options.find((o) => o.value === props.modelValue) ?? knownOptions.get(props.modelValue);
});

const selectedChipOptions = computed(() => {
  if (!props.multiple) return [];
  const map = new Map(props.options.map((o) => [o.value, o]));
  return selectedValues.value.map((v) => map.get(v) ?? knownOptions.get(v) ?? { value: v, label: v });
});

const displayValue = computed(() => {
  if (props.multiple) return query.value;
  if (isTyping.value) return query.value;
  return selectedSingleOption.value?.label ?? (typeof props.modelValue === 'string' ? props.modelValue : '');
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

const activeQuery = computed(() =>
  isTyping.value || props.search !== undefined ? query.value : '',
);

const filteredOptions = computed(() => {
  if (props.filter === false) return props.options;
  const q = activeQuery.value;
  if (!q.trim()) return props.options;
  const fn = typeof props.filter === 'function' ? props.filter : defaultFilter;
  return props.options.filter((opt) => fn(opt, q));
});

const creatableOption = computed<ComboboxOption | null>(() => {
  if (!props.creatable || props.loading) return null;
  const trimmed = activeQuery.value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const exists = props.options.some(
    (opt) => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower,
  );
  if (exists) return null;
  const label =
    typeof props.creatable === 'function' ? props.creatable(trimmed) : `Create "${trimmed}"`;
  return { value: trimmed, label };
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

const enabledFiltered = computed<ComboboxOption[]>(() => {
  const regular = filteredOptions.value.filter((o) => !o.disabled);
  return creatableOption.value ? [...regular, creatableOption.value] : regular;
});

const showClear = computed(() => {
  if (!props.clearable || props.disabled) return false;
  if (props.multiple) return selectedValues.value.length > 0 || query.value.length > 0;
  return Boolean(props.modelValue || query.value);
});

const optionDomId = (val: string) =>
  `${baseId}-opt-${val.length ? Array.from(val, (c) => c.codePointAt(0)!.toString(36)).join('_') : '_'}`;

const activeDescendantId = computed(() =>
  open.value && activeValue.value !== null ? optionDomId(activeValue.value) : undefined,
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

function escapeSelectorVal(val: string) {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(val)
    : val.replace(/["\\]/g, '\\$&');
}

function scrollActiveIntoView() {
  nextTick(() => {
    if (activeValue.value === null || !listboxEl.value) return;
    const node = listboxEl.value.querySelector(
      `[data-value="${escapeSelectorVal(activeValue.value)}"]`,
    );
    node?.scrollIntoView?.({ block: 'nearest' });
  });
}

function pickInitialHighlight(preferLast = false, fromKeyboard = false) {
  const list = enabledFiltered.value;
  if (!list.length) {
    activeValue.value = null;
    return;
  }
  if (preferLast) {
    activeValue.value = list[list.length - 1]!.value;
  } else {
    const sel = list.find((o) => isSelected(o.value));
    if (sel) {
      activeValue.value = sel.value;
    } else if (isFreeSolo.value && !fromKeyboard) {
      activeValue.value = null;
      return;
    } else {
      activeValue.value = list[0]!.value;
    }
  }
  scrollActiveIntoView();
}

function commitValue(next: string | string[] | null) {
  emit('update:modelValue', next);
  emit('change', next);
}

function commitCustomValue(raw: string, emitCreateIfNew = false) {
  const trimmed = raw.trim();
  if (!trimmed || props.disabled) return;

  if (emitCreateIfNew && props.creatable && !props.loading) {
    const lower = trimmed.toLowerCase();
    const exists = props.options.some(
      (opt) => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower,
    );
    if (!exists) emit('create', trimmed);
  }

  clearSearchTimer();
  isTyping.value = false;
  updateQuery('');

  if (props.multiple) {
    const cur = selectedValues.value;
    const next = cur.includes(trimmed) ? cur : [...cur, trimmed];
    commitValue(next);
  } else {
    commitValue(trimmed);
    hideListbox();
  }
}

function commitPendingIfNeeded(): boolean {
  if (isTyping.value && effectiveCommitOnBlur.value) {
    const trimmed = query.value.trim();
    if (trimmed) {
      commitCustomValue(trimmed, true);
      return true;
    }
  }
  return false;
}

function onToggle(e: Event) {
  const opened = (e as ToggleEvent).newState === 'open';
  open.value = opened;
  if (opened) {
    if (activeValue.value == null && !isTyping.value) {
      pickInitialHighlight(false, false);
    }
  } else {
    activeValue.value = null;
    if (commitPendingIfNeeded()) return;
    clearSearchTimer();
    isTyping.value = false;
    updateQuery('');
  }
}

function selectCreatableOption(opt: ComboboxOption) {
  if (props.disabled) return;
  clearSearchTimer();
  isTyping.value = false;
  updateQuery('');
  emit('create', opt.value);
  if (props.multiple) {
    const cur = selectedValues.value;
    const next = cur.includes(opt.value) ? cur : [...cur, opt.value];
    commitValue(next);
    inputEl.value?.focus();
  } else {
    commitValue(opt.value);
    hideListbox();
    inputEl.value?.focus();
  }
}

function selectOption(opt: ComboboxOption) {
  if (opt.disabled || props.disabled) return;
  if (creatableOption.value && opt === creatableOption.value) {
    selectCreatableOption(opt);
    return;
  }
  clearSearchTimer();
  isTyping.value = false;
  updateQuery('');
  if (props.multiple) {
    const cur = selectedValues.value;
    const next = cur.includes(opt.value)
      ? cur.filter((v) => v !== opt.value)
      : [...cur, opt.value];
    commitValue(next);
    inputEl.value?.focus();
  } else {
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
  const hadQuery = query.value.length > 0;
  isTyping.value = false;
  updateQuery('', hadQuery, false);
  commitValue(props.multiple ? [] : null);
  inputEl.value?.focus();
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  isTyping.value = true;
  updateQuery(val, false, true);
  if (!open.value) showListbox();

  if (isFreeSolo.value) {
    if (filteredOptions.value.length === 0 && creatableOption.value) {
      activeValue.value = creatableOption.value.value;
      scrollActiveIntoView();
    } else {
      activeValue.value = null;
    }
    return;
  }

  const list = enabledFiltered.value;
  if (!list.some((o) => o.value === activeValue.value)) {
    activeValue.value = list[0]?.value ?? null;
  }
  scrollActiveIntoView();
}

function onInputBlur(e: FocusEvent) {
  const related = e.relatedTarget as Node | null;
  if (related && (shellEl.value?.contains(related) || listboxEl.value?.contains(related))) {
    return;
  }
  if (commitPendingIfNeeded()) return;
  if (isTyping.value) {
    clearSearchTimer();
    isTyping.value = false;
    updateQuery('');
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (props.disabled) return;
  const list = enabledFiltered.value;
  const idx = list.findIndex((o) => o.value === activeValue.value);

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (!open.value) {
        pickInitialHighlight(false, true);
        showListbox();
      } else if (list.length) {
        activeValue.value = list[idx < list.length - 1 ? idx + 1 : 0]!.value;
        scrollActiveIntoView();
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!open.value) {
        pickInitialHighlight(true, true);
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
      } else if (isFreeSolo.value && query.value.trim()) {
        e.preventDefault();
        commitCustomValue(query.value, true);
        inputEl.value?.focus();
      }
      break;
    case 'Escape':
      if (open.value || isTyping.value) {
        e.preventDefault();
        e.stopPropagation();
        clearSearchTimer();
        isTyping.value = false;
        updateQuery('');
        activeValue.value = null;
        hideListbox();
      }
      break;
    case 'Tab':
      commitPendingIfNeeded();
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
  if (activeValue.value === null) {
    if (!isFreeSolo.value) {
      activeValue.value = list[0]?.value ?? null;
    }
    return;
  }
  if (!list.some((o) => o.value === activeValue.value)) {
    activeValue.value = isFreeSolo.value ? null : (list[0]?.value ?? null);
  }
});

onBeforeUnmount(() => {
  clearSearchTimer();
  stopAnchor?.();
});
</script>

<template>
  <div
    ref="shellEl"
    class="j-combobox"
    :data-size="size === 'md' ? undefined : size"
    :data-multiple="multiple ? '' : undefined"
    :data-loading="loading ? '' : undefined"
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
      @blur="onInputBlur"
      @keydown="onKeyDown"
    />

    <div class="j-combobox__controls">
      <span v-if="loading" class="j-combobox__spinner" aria-hidden="true" />
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
    :aria-busy="loading ? 'true' : undefined"
    @pointerdown.prevent
    @toggle="onToggle"
  >
    <div
      v-if="loading && groupedBuckets.length"
      class="j-combobox__loading"
      data-inline=""
      role="status"
      aria-live="polite"
    >
      <span class="j-combobox__spinner" aria-hidden="true" />
      <span>{{ loadingText }}</span>
    </div>

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

    <div
      v-else-if="loading"
      class="j-combobox__loading"
      role="status"
      aria-live="polite"
    >
      <span class="j-combobox__spinner" aria-hidden="true" />
      <span>{{ loadingText }}</span>
    </div>

    <div
      v-if="creatableOption"
      :id="optionDomId(creatableOption.value)"
      class="j-combobox__option j-combobox__create"
      role="option"
      :data-value="creatableOption.value"
      :data-highlighted="activeValue === creatableOption.value ? '' : undefined"
      aria-selected="false"
      @pointerenter="activeValue = creatableOption.value"
      @click="selectCreatableOption(creatableOption)"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M8 3.5v9M3.5 8h9" />
      </svg>
      <div class="j-combobox__option-body">
        <span class="j-combobox__option-label">{{ creatableOption.label }}</span>
      </div>
    </div>

    <div v-if="!loading && !groupedBuckets.length && !creatableOption" class="j-combobox__empty">
      {{ emptyText }}
    </div>
  </div>
</template>
