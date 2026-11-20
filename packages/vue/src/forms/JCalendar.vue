<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import {
  addMonthsClamped,
  buildCalendarGrid,
  formatDayAriaLabel,
  formatDisplayDate,
  formatDisplayRange,
  formatMonthTitle,
  getWeekdayLabels,
  isDateDisabled,
  normalizeDayMarkers,
  parseIsoDate,
  shiftYearMonth,
  stepFocusedDate,
  todayIso,
} from 'jenni-core/behaviors/date-picker.js';
import type {
  CalendarCell,
  CalendarMarkers,
  DatePickerMode,
  DateRange,
  NormalizedCalendarMarker,
  Tone,
} from './types';

const model = defineModel<string | DateRange | null>({ default: null });

const props = withDefaults(
  defineProps<{
    mode?: DatePickerMode;
    min?: string;
    max?: string;
    weekStartsOn?: 0 | 1;
    showFooter?: boolean;
    tone?: Tone;
    disabled?: boolean;
    locale?: string;
    markers?: CalendarMarkers;
  }>(),
  {
    mode: 'single',
    weekStartsOn: 0,
    showFooter: true,
    locale: 'en-US',
  },
);

defineSlots<{
  day?: (props: { cell: CalendarCell; markers: NormalizedCalendarMarker[] }) => unknown;
}>();

const emit = defineEmits<{
  change: [value: string | DateRange | null];
  complete: [value: string | DateRange | null];
}>();

const gridEl = useTemplateRef<HTMLElement>('gridEl');
const hoverIso = ref<string | null>(null);

function resolveSeedIso(val: string | DateRange | null | undefined): string {
  if (typeof val === 'string' && parseIsoDate(val)) return val;
  if (val && typeof val === 'object') {
    if (val.start && parseIsoDate(val.start)) return val.start;
    if (val.end && parseIsoDate(val.end)) return val.end;
  }
  return todayIso();
}

const initialSeed = resolveSeedIso(model.value);
const initialParts = parseIsoDate(initialSeed) ?? { year: 2026, month: 1, day: 1 };

const viewYear = ref(initialParts.year);
const viewMonth = ref(initialParts.month);
const focusedIso = ref(initialSeed);

watch(
  () => model.value,
  (val) => {
    const nextIso =
      typeof val === 'string'
        ? val
        : val && typeof val === 'object'
          ? val.start || val.end
          : null;
    const parsed = parseIsoDate(nextIso);
    if (parsed) {
      viewYear.value = parsed.year;
      viewMonth.value = parsed.month;
      focusedIso.value = nextIso!;
    }
  },
);

const monthTitle = computed(() => formatMonthTitle(viewYear.value, viewMonth.value, props.locale));
const weekdays = computed(() => getWeekdayLabels(props.weekStartsOn, props.locale));
const weeks = computed(() =>
  buildCalendarGrid(viewYear.value, viewMonth.value, {
    weekStartsOn: props.weekStartsOn,
    min: props.min,
    max: props.max,
  }),
);

const markersByIso = computed(() => {
  const map = new Map<string, NormalizedCalendarMarker[]>();
  if (!props.markers) return map;
  for (const week of weeks.value) {
    for (const cell of week) {
      const list = normalizeDayMarkers(props.markers, cell.iso);
      if (list.length) map.set(cell.iso, list);
    }
  }
  return map;
});

function getCellMarkers(iso: string): NormalizedCalendarMarker[] {
  return markersByIso.value.get(iso) ?? [];
}

function getCellAriaLabel(iso: string): string {
  return formatDayAriaLabel(iso, props.locale, markersByIso.value.get(iso));
}

const singleSelected = computed(() =>
  props.mode === 'single' && typeof model.value === 'string' ? model.value : null,
);

const rangeState = computed<DateRange>(() => {
  if (props.mode !== 'range' || !model.value || typeof model.value !== 'object') {
    return { start: null, end: null };
  }
  return {
    start: model.value.start ?? null,
    end: model.value.end ?? null,
  };
});

const effectiveRange = computed<{ start: string | null; end: string | null }>(() => {
  const s = rangeState.value.start;
  const e = s && !rangeState.value.end && hoverIso.value ? hoverIso.value : rangeState.value.end;
  if (s && e && e < s) return { start: e, end: s };
  return { start: s, end: e };
});

const todayDisabled = computed(() => isDateDisabled(todayIso(), props.min, props.max));

const hasSelection = computed(() =>
  props.mode === 'single'
    ? Boolean(singleSelected.value)
    : Boolean(rangeState.value.start || rangeState.value.end),
);

const summaryText = computed(() => {
  if (props.mode === 'single') {
    return singleSelected.value ? formatDisplayDate(singleSelected.value, props.locale) : 'No date';
  }
  return rangeState.value.start || rangeState.value.end
    ? formatDisplayRange(rangeState.value, props.locale)
    : 'Select range';
});

function isCellSelected(iso: string) {
  if (props.mode === 'single') return singleSelected.value === iso;
  const { start, end } = effectiveRange.value;
  return Boolean((start && iso === start) || (end && iso === end) || (start && end && iso >= start && iso <= end));
}

function isRangeStart(iso: string) {
  return props.mode === 'range' && effectiveRange.value.start === iso;
}

function isRangeEnd(iso: string) {
  return props.mode === 'range' && effectiveRange.value.end === iso;
}

function isInRange(iso: string) {
  if (props.mode !== 'range') return false;
  const { start, end } = effectiveRange.value;
  return Boolean(start && end && iso >= start && iso <= end);
}

function focusCell(iso: string) {
  nextTick(() => {
    const el = gridEl.value?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`);
    el?.focus();
  });
}

function navigateMonth(delta: number) {
  if (props.disabled) return;
  const next = shiftYearMonth(viewYear.value, viewMonth.value, delta);
  viewYear.value = next.year;
  viewMonth.value = next.month;
  focusedIso.value = addMonthsClamped(focusedIso.value, delta);
}

function selectDate(iso: string) {
  if (props.disabled || isDateDisabled(iso, props.min, props.max)) return;
  const p = parseIsoDate(iso);
  if (p) {
    viewYear.value = p.year;
    viewMonth.value = p.month;
  }
  focusedIso.value = iso;

  if (props.mode === 'single') {
    model.value = iso;
    emit('change', iso);
    emit('complete', iso);
  } else {
    const cur = rangeState.value;
    if (!cur.start || (cur.start && cur.end)) {
      const next: DateRange = { start: iso, end: null };
      hoverIso.value = null;
      model.value = next;
      emit('change', next);
    } else {
      const next: DateRange =
        iso < cur.start ? { start: iso, end: cur.start } : { start: cur.start, end: iso };
      hoverIso.value = null;
      model.value = next;
      emit('change', next);
      emit('complete', next);
    }
  }
  focusCell(iso);
}

function onCellHover(iso: string, cellDisabled: boolean) {
  if (props.mode !== 'range' || cellDisabled || !rangeState.value.start || rangeState.value.end) {
    return;
  }
  hoverIso.value = iso;
}

function onGridKeydown(e: KeyboardEvent) {
  if (props.disabled) return;
  const nextIso = stepFocusedDate(focusedIso.value, e.key, e.shiftKey, props.weekStartsOn);
  if (!nextIso) return;
  e.preventDefault();
  focusedIso.value = nextIso;
  const p = parseIsoDate(nextIso);
  if (p) {
    viewYear.value = p.year;
    viewMonth.value = p.month;
  }
  focusCell(nextIso);
}

function pickToday() {
  if (props.disabled || todayDisabled.value) return;
  const t = todayIso();
  if (props.mode === 'single') {
    selectDate(t);
  } else {
    const p = parseIsoDate(t);
    if (p) {
      viewYear.value = p.year;
      viewMonth.value = p.month;
    }
    focusedIso.value = t;
    const next: DateRange = { start: t, end: t };
    hoverIso.value = null;
    model.value = next;
    emit('change', next);
    emit('complete', next);
  }
}

function clearSelection() {
  if (props.disabled) return;
  hoverIso.value = null;
  const next = props.mode === 'single' ? null : { start: null, end: null };
  model.value = next;
  emit('change', next);
}
</script>

<template>
  <div
    class="j-calendar"
    data-j-managed=""
    :data-mode="mode"
    :data-tone="tone"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <div class="j-calendar__header">
      <div class="j-calendar__title" aria-live="polite">{{ monthTitle }}</div>
      <div class="j-calendar__nav">
        <button
          type="button"
          class="j-calendar__nav-btn"
          aria-label="Previous month"
          :disabled="disabled || undefined"
          @click="navigateMonth(-1)"
        >
          ‹
        </button>
        <button
          type="button"
          class="j-calendar__nav-btn"
          aria-label="Next month"
          :disabled="disabled || undefined"
          @click="navigateMonth(1)"
        >
          ›
        </button>
      </div>
    </div>

    <div
      ref="gridEl"
      class="j-calendar__grid"
      role="grid"
      :aria-label="monthTitle"
      @pointerleave="hoverIso = null"
      @keydown="onGridKeydown"
    >
      <div class="j-calendar__weekdays" role="row">
        <div
          v-for="w in weekdays"
          :key="w.long"
          class="j-calendar__weekday"
          role="columnheader"
          :aria-label="w.long"
        >
          {{ w.short }}
        </div>
      </div>

      <div v-for="(week, wIdx) in weeks" :key="wIdx" class="j-calendar__row" role="row">
        <button
          v-for="cell in week"
          :key="cell.iso"
          type="button"
          role="gridcell"
          class="j-calendar__day"
          :data-date="cell.iso"
          :data-outside="cell.outside ? '' : undefined"
          :data-today="cell.today ? '' : undefined"
          :data-selected="mode === 'single' && singleSelected === cell.iso ? '' : undefined"
          :data-in-range="isInRange(cell.iso) ? '' : undefined"
          :data-range-start="isRangeStart(cell.iso) ? '' : undefined"
          :data-range-end="isRangeEnd(cell.iso) ? '' : undefined"
          :tabindex="cell.iso === focusedIso ? 0 : -1"
          :disabled="disabled || cell.disabled || undefined"
          :aria-disabled="cell.disabled ? 'true' : undefined"
          :aria-selected="isCellSelected(cell.iso) ? 'true' : 'false'"
          :aria-label="getCellAriaLabel(cell.iso)"
          @pointerenter="onCellHover(cell.iso, cell.disabled)"
          @focus="focusedIso = cell.iso"
          @click="selectDate(cell.iso)"
        >
          <slot name="day" :cell="cell" :markers="getCellMarkers(cell.iso)">
            <span class="j-calendar__day-num">{{ cell.day }}</span>
            <span
              v-if="getCellMarkers(cell.iso).length"
              class="j-calendar__dots"
              aria-hidden="true"
            >
              <span
                v-for="(m, mIdx) in getCellMarkers(cell.iso)"
                :key="mIdx"
                class="j-calendar__dot"
                :data-tone="m.tone"
                :style="m.color ? { '--_dot-color': m.color } : undefined"
              />
            </span>
          </slot>
        </button>
      </div>
    </div>

    <div v-if="showFooter" class="j-calendar__footer">
      <span class="j-calendar__summary">{{ summaryText }}</span>
      <div class="j-calendar__footer-actions">
        <button
          type="button"
          class="j-calendar__action"
          :disabled="disabled || !hasSelection || undefined"
          @click="clearSelection"
        >
          Clear
        </button>
        <button
          type="button"
          class="j-calendar__action"
          data-primary=""
          :disabled="disabled || todayDisabled || undefined"
          @click="pickToday"
        >
          Today
        </button>
      </div>
    </div>
  </div>
</template>
