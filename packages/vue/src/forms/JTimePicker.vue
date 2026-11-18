<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue';
import {
  anchorTimePopover,
  applyDigitToSegment,
  buildHourOptions,
  buildMinuteOptions,
  formatTimeValue,
  from12HourDisplay,
  nowTimeValue,
  padTime,
  parseTimeValue,
  stepTimePart,
  to12HourDisplay,
} from '@jenni/core/behaviors/time-picker.js';
import {
  sizeAttr,
  splitAttrs,
  useFieldAttrs,
  type Size,
  type TimeFormat,
  type Tone,
} from './types';

defineOptions({ inheritAttrs: false });

const model = defineModel<string | null>({ default: null });

const props = withDefaults(
  defineProps<{
    format?: TimeFormat;
    seconds?: boolean;
    minuteStep?: number;
    clearable?: boolean;
    size?: Size;
    tone?: Tone;
    disabled?: boolean;
    invalid?: boolean;
    name?: string;
  }>(),
  {
    format: '24h',
    seconds: false,
    minuteStep: 1,
    clearable: true,
  },
);

const emit = defineEmits<{
  change: [value: string | null];
}>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const parts = computed(() => splitAttrs(attrs));

const popId = `${useId()}-time`;
const shellEl = useTemplateRef<HTMLElement>('shellEl');
const popoverEl = useTemplateRef<HTMLElement>('popoverEl');
const hourRef = useTemplateRef<HTMLButtonElement>('hourRef');
const minuteRef = useTemplateRef<HTMLButtonElement>('minuteRef');
const secondRef = useTemplateRef<HTMLButtonElement>('secondRef');
const periodRef = useTemplateRef<HTMLButtonElement>('periodRef');

const open = ref(false);
const digitBuffer = ref('');
let stopAnchor: (() => void) | null = null;

const isDisabled = computed(() => !!(props.disabled || field.value.disabled));
const isInvalid = computed(() => !!(props.invalid || field.value['aria-invalid']));

const parsed = computed(() => parseTimeValue(model.value));
const display12 = computed(() => (parsed.value ? to12HourDisplay(parsed.value.hour) : null));

const hourText = computed(() => {
  if (!parsed.value) return '--';
  return padTime(props.format === '12h' ? display12.value!.hour12 : parsed.value.hour);
});
const minuteText = computed(() => (parsed.value ? padTime(parsed.value.minute) : '--'));
const secondText = computed(() => (parsed.value ? padTime(parsed.value.second) : '--'));
const periodText = computed(() => display12.value?.period ?? 'AM');

const hourOptions = computed(() => buildHourOptions(props.format));
const minuteOptions = computed(() => buildMinuteOptions(props.minuteStep));
const secondOptions = computed(() => buildMinuteOptions(1));

const showClear = computed(() => props.clearable && !isDisabled.value && Boolean(parsed.value));

function getOrderedRefs() {
  const list: Array<HTMLButtonElement | null> = [hourRef.value, minuteRef.value];
  if (props.seconds) list.push(secondRef.value);
  if (props.format === '12h') list.push(periodRef.value);
  return list.filter((el): el is HTMLButtonElement => Boolean(el));
}

function commitParts(next: { hour: number; minute: number; second: number } | null) {
  const val = next ? formatTimeValue(next, props.seconds) : null;
  model.value = val;
  emit('change', val);
}

function onSegmentKeydown(
  segment: 'hour' | 'minute' | 'second' | 'period',
  e: KeyboardEvent,
) {
  if (isDisabled.value) return;
  const refs = getOrderedRefs();
  const idx = refs.indexOf(e.currentTarget as HTMLButtonElement);

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    digitBuffer.value = '';
    if (idx > 0) refs[idx - 1]?.focus();
    return;
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    digitBuffer.value = '';
    if (idx >= 0 && idx < refs.length - 1) refs[idx + 1]?.focus();
    return;
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    digitBuffer.value = '';
    commitParts(
      stepTimePart(parsed.value, segment, e.key === 'ArrowUp' ? 1 : -1, props.minuteStep),
    );
    return;
  }
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    digitBuffer.value = '';
    commitParts(null);
    return;
  }
  if (segment === 'period') {
    if (/^[aApP]$/.test(e.key)) {
      e.preventDefault();
      const base = parsed.value ?? { hour: 9, minute: 0, second: 0 };
      const { hour12 } = to12HourDisplay(base.hour);
      const nextPeriod = e.key.toLowerCase() === 'a' ? 'AM' : 'PM';
      commitParts({ ...base, hour: from12HourDisplay(hour12, nextPeriod) });
    } else if (e.key === ' ') {
      e.preventDefault();
      commitParts(stepTimePart(parsed.value, 'period', 1, props.minuteStep));
    }
    return;
  }
  if (/^\d$/.test(e.key)) {
    e.preventDefault();
    const res = applyDigitToSegment({
      digit: Number(e.key),
      buffer: digitBuffer.value,
      segment,
      format: props.format,
      current: parsed.value,
    });
    digitBuffer.value = res.nextBuffer;
    commitParts(res.parts);
    if (res.advance && idx >= 0 && idx < refs.length - 1) {
      refs[idx + 1]?.focus();
    }
  }
}

function selectHourCell(h: number) {
  if (isDisabled.value) return;
  const base = parsed.value ?? { hour: 9, minute: 0, second: 0 };
  if (props.format === '12h') {
    const { period } = to12HourDisplay(base.hour);
    commitParts({ ...base, hour: from12HourDisplay(h, period) });
  } else {
    commitParts({ ...base, hour: h });
  }
}

function selectMinuteCell(m: number) {
  if (isDisabled.value) return;
  const base = parsed.value ?? { hour: 9, minute: 0, second: 0 };
  commitParts({ ...base, minute: m });
}

function selectSecondCell(s: number) {
  if (isDisabled.value) return;
  const base = parsed.value ?? { hour: 9, minute: 0, second: 0 };
  commitParts({ ...base, second: s });
}

function selectPeriodCell(p: 'AM' | 'PM') {
  if (isDisabled.value) return;
  const base = parsed.value ?? { hour: 9, minute: 0, second: 0 };
  const { hour12 } = to12HourDisplay(base.hour);
  commitParts({ ...base, hour: from12HourDisplay(hour12, p) });
}

function pickNow() {
  if (isDisabled.value) return;
  const next = nowTimeValue(props.seconds, props.minuteStep);
  model.value = next;
  emit('change', next);
  hidePopover();
}

function clearTime() {
  if (isDisabled.value) return;
  digitBuffer.value = '';
  commitParts(null);
  hourRef.value?.focus();
}

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
  const opened = (e as ToggleEvent).newState === 'open';
  open.value = opened;
  if (opened) {
    nextTick(() => {
      popoverEl.value
        ?.querySelectorAll<HTMLElement>('.j-time-picker__cell[aria-selected="true"]')
        .forEach((el) => el.scrollIntoView({ block: 'nearest' }));
    });
  }
}

watch(isDisabled, (dis) => {
  if (dis && open.value) hidePopover();
});

onMounted(() => {
  if (shellEl.value && popoverEl.value) {
    stopAnchor = anchorTimePopover(shellEl.value, popoverEl.value);
  }
});

onBeforeUnmount(() => stopAnchor?.());

defineExpose({ focus: () => hourRef.value?.focus(), show: showPopover, hide: hidePopover });
</script>

<template>
  <div
    ref="shellEl"
    class="j-time-picker"
    data-j-managed=""
    :data-format="format"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :data-open="open ? '' : undefined"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-invalid="isInvalid ? 'true' : undefined"
    v-bind="parts.root"
    @click="($event.target === shellEl) && hourRef?.focus()"
  >
    <input v-if="name" type="hidden" :name="name" :value="model ?? ''" />

    <div
      class="j-time-picker__segments"
      role="group"
      :aria-describedby="field['aria-describedby']"
      v-bind="parts.control"
    >
      <button
        :id="field.id"
        ref="hourRef"
        type="button"
        role="spinbutton"
        class="j-time-picker__segment"
        data-segment="hour"
        aria-label="Hours"
        :data-empty="parsed ? undefined : ''"
        :aria-valuemin="format === '12h' ? 1 : 0"
        :aria-valuemax="format === '12h' ? 12 : 23"
        :aria-valuenow="parsed ? (format === '12h' ? display12!.hour12 : parsed.hour) : undefined"
        :aria-invalid="field['aria-invalid']"
        :disabled="isDisabled || undefined"
        @blur="digitBuffer = ''"
        @keydown="onSegmentKeydown('hour', $event)"
      >
        {{ hourText }}
      </button>

      <span class="j-time-picker__sep" aria-hidden="true">:</span>

      <button
        ref="minuteRef"
        type="button"
        role="spinbutton"
        class="j-time-picker__segment"
        data-segment="minute"
        aria-label="Minutes"
        :data-empty="parsed ? undefined : ''"
        :aria-valuemin="0"
        :aria-valuemax="59"
        :aria-valuenow="parsed?.minute"
        :disabled="isDisabled || undefined"
        @blur="digitBuffer = ''"
        @keydown="onSegmentKeydown('minute', $event)"
      >
        {{ minuteText }}
      </button>

      <template v-if="seconds">
        <span class="j-time-picker__sep" aria-hidden="true">:</span>
        <button
          ref="secondRef"
          type="button"
          role="spinbutton"
          class="j-time-picker__segment"
          data-segment="second"
          aria-label="Seconds"
          :data-empty="parsed ? undefined : ''"
          :aria-valuemin="0"
          :aria-valuemax="59"
          :aria-valuenow="parsed?.second"
          :disabled="isDisabled || undefined"
          @blur="digitBuffer = ''"
          @keydown="onSegmentKeydown('second', $event)"
        >
          {{ secondText }}
        </button>
      </template>

      <button
        v-if="format === '12h'"
        ref="periodRef"
        type="button"
        role="spinbutton"
        class="j-time-picker__segment"
        data-segment="period"
        aria-label="AM or PM"
        :data-empty="parsed ? undefined : ''"
        :aria-valuetext="periodText"
        :disabled="isDisabled || undefined"
        @blur="digitBuffer = ''"
        @keydown="onSegmentKeydown('period', $event)"
      >
        {{ periodText }}
      </button>
    </div>

    <div class="j-time-picker__controls">
      <button
        v-if="showClear"
        type="button"
        class="j-time-picker__clear"
        aria-label="Clear time"
        tabindex="-1"
        @click.stop="clearTime"
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
        class="j-time-picker__trigger"
        aria-label="Open time picker"
        aria-haspopup="dialog"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="popId"
        :disabled="isDisabled || undefined"
        @click.stop="togglePopover"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="5.75" />
          <path d="M8 4.75V8l2.25 1.5" />
        </svg>
      </button>
    </div>
  </div>

  <div
    :id="popId"
    ref="popoverEl"
    class="j-time-picker__popover"
    popover="auto"
    data-align="start"
    :data-tone="tone"
    @toggle="onToggle"
  >
    <div class="j-time-picker__columns">
      <div class="j-time-picker__col">
        <div class="j-time-picker__col-label">HR</div>
        <div class="j-time-picker__col-list">
          <button
            v-for="h in hourOptions"
            :key="h"
            type="button"
            class="j-time-picker__cell"
            :aria-selected="
              parsed && (format === '12h' ? display12!.hour12 === h : parsed.hour === h)
                ? 'true'
                : 'false'
            "
            @click="selectHourCell(h)"
          >
            {{ padTime(h) }}
          </button>
        </div>
      </div>

      <div class="j-time-picker__col">
        <div class="j-time-picker__col-label">MIN</div>
        <div class="j-time-picker__col-list">
          <button
            v-for="m in minuteOptions"
            :key="m"
            type="button"
            class="j-time-picker__cell"
            :aria-selected="parsed && parsed.minute === m ? 'true' : 'false'"
            @click="selectMinuteCell(m)"
          >
            {{ padTime(m) }}
          </button>
        </div>
      </div>

      <div v-if="seconds" class="j-time-picker__col">
        <div class="j-time-picker__col-label">SEC</div>
        <div class="j-time-picker__col-list">
          <button
            v-for="s in secondOptions"
            :key="s"
            type="button"
            class="j-time-picker__cell"
            :aria-selected="parsed && parsed.second === s ? 'true' : 'false'"
            @click="selectSecondCell(s)"
          >
            {{ padTime(s) }}
          </button>
        </div>
      </div>

      <div v-if="format === '12h'" class="j-time-picker__col">
        <div class="j-time-picker__col-label">MER</div>
        <div class="j-time-picker__col-list">
          <button
            v-for="per in (['AM', 'PM'] as const)"
            :key="per"
            type="button"
            class="j-time-picker__cell"
            :aria-selected="parsed && display12!.period === per ? 'true' : 'false'"
            @click="selectPeriodCell(per)"
          >
            {{ per }}
          </button>
        </div>
      </div>
    </div>

    <div class="j-time-picker__footer">
      <button
        type="button"
        class="j-time-picker__action"
        :disabled="!parsed || undefined"
        @click="clearTime"
      >
        Clear
      </button>
      <button
        type="button"
        class="j-time-picker__action"
        data-primary=""
        @click="pickNow"
      >
        Now
      </button>
    </div>
  </div>
</template>
