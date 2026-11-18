<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue';
import {
  DEFAULT_OKLCH_SWATCHES,
  anchorColorPopover,
  bindPointerDrag,
  formatColor,
  hsvToHex,
  parseColor,
  type HsvaColor,
} from '@jenni/core/behaviors/color-picker.js';
import {
  sizeAttr,
  splitAttrs,
  useFieldAttrs,
  type ColorFormat,
  type ColorPickerMode,
  type Size,
  type Tone,
} from './types';

defineOptions({ inheritAttrs: false });

const model = defineModel<string>({ default: '#4f46e5' });

const props = withDefaults(
  defineProps<{
    mode?: ColorPickerMode;
    inline?: boolean;
    format?: ColorFormat;
    alpha?: boolean;
    swatches?: string[];
    size?: Size;
    tone?: Tone;
    disabled?: boolean;
    invalid?: boolean;
    name?: string;
  }>(),
  {
    mode: 'popover',
    inline: false,
    format: 'hex',
    alpha: false,
    swatches: () => DEFAULT_OKLCH_SWATCHES,
  },
);

const emit = defineEmits<{
  change: [value: string];
}>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const parts = computed(() => splitAttrs(attrs));

const popId = `${useId()}-cp`;
const shellEl = useTemplateRef<HTMLElement>('shellEl');
const popoverEl = useTemplateRef<HTMLElement>('popoverEl');
const spectrumEl = useTemplateRef<HTMLElement>('spectrumEl');
const hueTrackEl = useTemplateRef<HTMLElement>('hueTrackEl');
const alphaTrackEl = useTemplateRef<HTMLElement>('alphaTrackEl');

const isInline = computed(() => props.inline || props.mode === 'inline');
const isDisabled = computed(() => !!(props.disabled || field.value.disabled));
const isInvalid = computed(() => !!(props.invalid || field.value['aria-invalid']));

const activeFormat = ref<ColorFormat>(props.format);
watch(
  () => props.format,
  (f) => {
    activeFormat.value = f;
  },
);

const hsva = ref<HsvaColor>(
  parseColor(model.value) ?? { h: 243, s: 69, v: 90, a: 1 },
);
const inputFocused = ref(false);
const draftText = ref(formatColor(hsva.value, activeFormat.value, props.alpha));
const copied = ref(false);
const open = ref(false);

let copyTimer = 0;
let cleanups: Array<() => void> = [];

watch(
  () => model.value,
  (val) => {
    const incoming = parseColor(val);
    if (!incoming) return;
    const curOut = formatColor(hsva.value, activeFormat.value, props.alpha);
    if (val !== curOut) {
      hsva.value = {
        h: incoming.s < 0.5 ? hsva.value.h : incoming.h,
        s: incoming.s,
        v: incoming.v,
        a: incoming.a,
      };
      if (!inputFocused.value) {
        draftText.value = formatColor(hsva.value, activeFormat.value, props.alpha);
      }
    }
  },
);

const solidHex = computed(() => hsvToHex(hsva.value.h, hsva.value.s, hsva.value.v, 1));
const previewCss = computed(() => formatColor(hsva.value, 'rgb', props.alpha));
const formattedValue = computed(() =>
  formatColor(hsva.value, activeFormat.value, props.alpha),
);

const inspectorVars = computed(() => ({
  '--_cp-hue': String(hsva.value.h),
  '--_cp-sat': `${hsva.value.s}%`,
  '--_cp-val': `${hsva.value.v}%`,
  '--_cp-solid': solidHex.value,
  '--_cp-preview': previewCss.value,
}));

function commitHsva(next: HsvaColor, syncDraft = true) {
  if (isDisabled.value) return;
  hsva.value = next;
  const out = formatColor(next, activeFormat.value, props.alpha);
  if (syncDraft && !inputFocused.value) {
    draftText.value = out;
  }
  model.value = out;
  emit('change', out);
}

function selectFormat(fmt: ColorFormat) {
  if (isDisabled.value) return;
  activeFormat.value = fmt;
  const out = formatColor(hsva.value, fmt, props.alpha);
  draftText.value = out;
  model.value = out;
  emit('change', out);
}

function selectSwatch(sw: string) {
  if (isDisabled.value) return;
  const p = parseColor(sw);
  if (!p) return;
  commitHsva({ ...p, a: props.alpha ? hsva.value.a : 1 }, true);
}

function onDraftInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  draftText.value = raw;
  const parsed = parseColor(raw);
  if (parsed) {
    commitHsva(parsed, false);
  }
}

function onDraftBlur() {
  inputFocused.value = false;
  draftText.value = formattedValue.value;
}

function copyValue() {
  if (isDisabled.value) return;
  navigator.clipboard?.writeText(formattedValue.value).catch(() => {});
  copied.value = true;
  window.clearTimeout(copyTimer);
  copyTimer = window.setTimeout(() => {
    copied.value = false;
  }, 1200);
}

function onSpectrumKeydown(e: KeyboardEvent) {
  if (isDisabled.value) return;
  const step = e.shiftKey ? 10 : 2;
  let { s, v } = hsva.value;
  if (e.key === 'ArrowLeft') s = Math.max(0, s - step);
  else if (e.key === 'ArrowRight') s = Math.min(100, s + step);
  else if (e.key === 'ArrowUp') v = Math.min(100, v + step);
  else if (e.key === 'ArrowDown') v = Math.max(0, v - step);
  else return;
  e.preventDefault();
  commitHsva({ ...hsva.value, s, v }, true);
}

function onHueKeydown(e: KeyboardEvent) {
  if (isDisabled.value) return;
  const step = e.shiftKey ? 15 : 3;
  let h = hsva.value.h;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') h = (h - step + 360) % 360;
  else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') h = (h + step) % 360;
  else return;
  e.preventDefault();
  commitHsva({ ...hsva.value, h }, true);
}

function onAlphaKeydown(e: KeyboardEvent) {
  if (isDisabled.value) return;
  const step = e.shiftKey ? 0.1 : 0.02;
  let a = hsva.value.a;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') a = Math.max(0, Number((a - step).toFixed(2)));
  else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') a = Math.min(1, Number((a + step).toFixed(2)));
  else return;
  e.preventDefault();
  commitHsva({ ...hsva.value, a }, true);
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
  open.value = (e as ToggleEvent).newState === 'open';
}

function wireInteractiveSurfaces() {
  cleanups.forEach((fn) => fn());
  cleanups = [];

  if (!isInline.value && shellEl.value && popoverEl.value) {
    cleanups.push(anchorColorPopover(shellEl.value, popoverEl.value));
  }
  if (spectrumEl.value) {
    cleanups.push(
      bindPointerDrag(spectrumEl.value, (nx, ny) => {
        commitHsva(
          {
            ...hsva.value,
            s: Number((nx * 100).toFixed(1)),
            v: Number(((1 - ny) * 100).toFixed(1)),
          },
          true,
        );
      }),
    );
  }
  if (hueTrackEl.value) {
    cleanups.push(
      bindPointerDrag(hueTrackEl.value, (nx) => {
        commitHsva({ ...hsva.value, h: Number((nx * 360).toFixed(1)) }, true);
      }),
    );
  }
  if (alphaTrackEl.value) {
    cleanups.push(
      bindPointerDrag(alphaTrackEl.value, (nx) => {
        commitHsva({ ...hsva.value, a: Number(nx.toFixed(2)) }, true);
      }),
    );
  }
}

onMounted(wireInteractiveSurfaces);
watch([isInline, () => props.alpha], () => {
  setTimeout(wireInteractiveSurfaces, 0);
});

onBeforeUnmount(() => {
  cleanups.forEach((fn) => fn());
  window.clearTimeout(copyTimer);
});
</script>

<template>
  <!-- Compact Swatch-Trigger Mode -->
  <template v-if="!isInline">
    <div
      ref="shellEl"
      class="j-color-picker-field"
      data-j-managed=""
      :data-size="sizeAttr(size)"
      :data-tone="tone"
      :data-open="open ? '' : undefined"
      :aria-disabled="isDisabled ? 'true' : undefined"
      :aria-invalid="isInvalid ? 'true' : undefined"
      v-bind="parts.root"
    >
      <input v-if="name" type="hidden" :name="name" :value="formattedValue" />
      <button
        type="button"
        class="j-color-picker-field__trigger"
        aria-haspopup="dialog"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="popId"
        v-bind="{ ...field, ...parts.control, disabled: isDisabled || undefined }"
        @click="togglePopover"
      >
        <span
          class="j-color-picker-field__swatch"
          :style="{ '--_swatch-color': previewCss }"
          aria-hidden="true"
        />
        <span class="j-color-picker-field__label">{{ formattedValue }}</span>
      </button>
    </div>

    <div
      :id="popId"
      ref="popoverEl"
      class="j-color-picker__popover"
      popover="auto"
      data-align="start"
      :data-tone="tone"
      @toggle="onToggle"
    >
      <div
        class="j-color-picker"
        data-j-managed=""
        :data-tone="tone"
        :aria-disabled="isDisabled ? 'true' : undefined"
        :style="inspectorVars"
      >
        <div
          ref="spectrumEl"
          class="j-color-picker__spectrum"
          tabindex="0"
          role="slider"
          aria-label="Color saturation and brightness"
          :aria-valuenow="Math.round(hsva.s)"
          @keydown="onSpectrumKeydown"
        >
          <span class="j-color-picker__loupe" />
        </div>

        <div class="j-color-picker__controls">
          <span class="j-color-picker__well" aria-hidden="true" />
          <div class="j-color-picker__sliders">
            <div
              ref="hueTrackEl"
              class="j-color-picker__track"
              data-track="hue"
              tabindex="0"
              role="slider"
              aria-label="Hue"
              :aria-valuemin="0"
              :aria-valuemax="360"
              :aria-valuenow="Math.round(hsva.h)"
              :style="{
                '--_track-pct': `${(hsva.h / 360) * 100}%`,
                '--_thumb-bg': `hsl(${hsva.h} 100% 50%)`,
              }"
              @keydown="onHueKeydown"
            >
              <span class="j-color-picker__thumb" />
            </div>

            <div
              v-if="alpha"
              ref="alphaTrackEl"
              class="j-color-picker__track"
              data-track="alpha"
              tabindex="0"
              role="slider"
              aria-label="Opacity"
              :aria-valuemin="0"
              :aria-valuemax="100"
              :aria-valuenow="Math.round(hsva.a * 100)"
              :style="{
                '--_track-pct': `${hsva.a * 100}%`,
                '--_thumb-bg': previewCss,
              }"
              @keydown="onAlphaKeydown"
            >
              <span class="j-color-picker__thumb" />
            </div>
          </div>
        </div>

        <div class="j-color-picker__formats" role="group" aria-label="Color format">
          <button
            v-for="fmt in (['hex', 'oklch', 'rgb'] as const)"
            :key="fmt"
            type="button"
            class="j-color-picker__format-btn"
            :aria-pressed="activeFormat === fmt ? 'true' : 'false'"
            @click="selectFormat(fmt)"
          >
            {{ fmt.toUpperCase() }}
          </button>
        </div>

        <div class="j-color-picker__readout">
          <input
            type="text"
            class="j-color-picker__input"
            aria-label="Color value"
            spellcheck="false"
            :value="inputFocused ? draftText : formattedValue"
            @focus="inputFocused = true; draftText = formattedValue"
            @input="onDraftInput"
            @blur="onDraftBlur"
          />
          <button
            type="button"
            class="j-color-picker__copy"
            :data-copied="copied ? '' : undefined"
            aria-label="Copy color value"
            @click="copyValue"
          >
            <svg
              v-if="copied"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
            </svg>
            <svg
              v-else
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
              <path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" />
            </svg>
          </button>
        </div>

        <div v-if="swatches.length" class="j-color-picker__swatches">
          <button
            v-for="sw in swatches"
            :key="sw"
            type="button"
            class="j-color-picker__swatch"
            :style="{ '--_swatch-bg': sw }"
            :aria-label="`Select ${sw}`"
            :aria-selected="solidHex.toLowerCase() === sw.toLowerCase() ? 'true' : 'false'"
            @click="selectSwatch(sw)"
          />
        </div>
      </div>
    </div>
  </template>

  <!-- Inline Architectural Card Mode -->
  <div
    v-else
    class="j-color-picker"
    data-j-managed=""
    :data-tone="tone"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :style="inspectorVars"
    v-bind="parts.root"
  >
    <input v-if="name" type="hidden" :name="name" :value="formattedValue" />
    <div
      ref="spectrumEl"
      class="j-color-picker__spectrum"
      tabindex="0"
      role="slider"
      aria-label="Color saturation and brightness"
      :aria-valuenow="Math.round(hsva.s)"
      @keydown="onSpectrumKeydown"
    >
      <span class="j-color-picker__loupe" />
    </div>

    <div class="j-color-picker__controls">
      <span class="j-color-picker__well" aria-hidden="true" />
      <div class="j-color-picker__sliders">
        <div
          ref="hueTrackEl"
          class="j-color-picker__track"
          data-track="hue"
          tabindex="0"
          role="slider"
          aria-label="Hue"
          :aria-valuemin="0"
          :aria-valuemax="360"
          :aria-valuenow="Math.round(hsva.h)"
          :style="{
            '--_track-pct': `${(hsva.h / 360) * 100}%`,
            '--_thumb-bg': `hsl(${hsva.h} 100% 50%)`,
          }"
          @keydown="onHueKeydown"
        >
          <span class="j-color-picker__thumb" />
        </div>

        <div
          v-if="alpha"
          ref="alphaTrackEl"
          class="j-color-picker__track"
          data-track="alpha"
          tabindex="0"
          role="slider"
          aria-label="Opacity"
          :aria-valuemin="0"
          :aria-valuemax="100"
          :aria-valuenow="Math.round(hsva.a * 100)"
          :style="{
            '--_track-pct': `${hsva.a * 100}%`,
            '--_thumb-bg': previewCss,
          }"
          @keydown="onAlphaKeydown"
        >
          <span class="j-color-picker__thumb" />
        </div>
      </div>
    </div>

    <div class="j-color-picker__formats" role="group" aria-label="Color format">
      <button
        v-for="fmt in (['hex', 'oklch', 'rgb'] as const)"
        :key="fmt"
        type="button"
        class="j-color-picker__format-btn"
        :aria-pressed="activeFormat === fmt ? 'true' : 'false'"
        @click="selectFormat(fmt)"
      >
        {{ fmt.toUpperCase() }}
      </button>
    </div>

    <div class="j-color-picker__readout">
      <input
        :id="field.id"
        type="text"
        class="j-color-picker__input"
        aria-label="Color value"
        spellcheck="false"
        :value="inputFocused ? draftText : formattedValue"
        @focus="inputFocused = true; draftText = formattedValue"
        @input="onDraftInput"
        @blur="onDraftBlur"
      />
      <button
        type="button"
        class="j-color-picker__copy"
        :data-copied="copied ? '' : undefined"
        aria-label="Copy color value"
        @click="copyValue"
      >
        <svg
          v-if="copied"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
        </svg>
        <svg
          v-else
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" />
        </svg>
      </button>
    </div>

    <div v-if="swatches.length" class="j-color-picker__swatches">
      <button
        v-for="sw in swatches"
        :key="sw"
        type="button"
        class="j-color-picker__swatch"
        :style="{ '--_swatch-bg': sw }"
        :aria-label="`Select ${sw}`"
        :aria-selected="solidHex.toLowerCase() === sw.toLowerCase() ? 'true' : 'false'"
        @click="selectSwatch(sw)"
      />
    </div>
  </div>
</template>
