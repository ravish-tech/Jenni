<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { sanitizePinChars } from '@jenni/core/behaviors/pin-input.js';
import { FieldKey, sizeAttr, type Size, type Tone } from './types';

const model = defineModel<string>({ default: '' });
const props = withDefaults(
  defineProps<{
    length?: number;
    type?: 'numeric' | 'alphanumeric';
    mask?: boolean;
    separator?: boolean | number;
    placeholder?: string;
    otp?: boolean;
    size?: Size;
    tone?: Tone;
    disabled?: boolean;
    invalid?: boolean;
  }>(),
  {
    length: 6,
    type: 'numeric',
    placeholder: '·',
    otp: true,
  },
);
const emit = defineEmits<{
  complete: [code: string];
}>();

const field = inject(FieldKey, null);
const cellRefs = ref<(HTMLInputElement | null)[]>([]);
const isDisabled = computed(() => !!(props.disabled || field?.disabled.value));
const isInvalid = computed(() => !!(props.invalid || field?.invalid.value));

const cells = computed(() => {
  const chars = sanitizePinChars(model.value ?? '', props.type);
  return Array.from({ length: props.length }, (_, i) => chars[i] ?? '');
});

function hasSeparatorAfter(index: number) {
  if (!props.separator || index >= props.length - 1) return false;
  if (typeof props.separator === 'number' && props.separator > 0) {
    return (index + 1) % props.separator === 0;
  }
  return index + 1 === Math.floor(props.length / 2);
}

function setCellRef(index: number, el: unknown) {
  cellRefs.value[index] = el instanceof HTMLInputElement ? el : null;
}

function focusCell(index: number) {
  const clamped = Math.max(0, Math.min(props.length - 1, index));
  cellRefs.value[clamped]?.focus();
}

function commitCells(next: string[]) {
  const code = next.join('');
  model.value = code;
  if (next.length === props.length && next.every((c) => c.length === 1)) {
    emit('complete', code);
  }
}

function onInput(index: number, e: Event) {
  const el = e.target as HTMLInputElement;
  const valid = sanitizePinChars(el.value, props.type);
  const next = [...cells.value];
  if (!valid.length) {
    next[index] = '';
    el.value = '';
    commitCells(next);
    return;
  }
  valid.slice(0, props.length - index).forEach((ch, offset) => {
    next[index + offset] = ch;
  });
  el.value = next[index] ?? '';
  commitCells(next);
  focusCell(Math.min(index + valid.length, props.length - 1));
}

function onKeydown(index: number, e: KeyboardEvent) {
  if (isDisabled.value) return;
  const next = [...cells.value];
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (next[index]) {
      next[index] = '';
      commitCells(next);
    } else if (index > 0) {
      next[index - 1] = '';
      commitCells(next);
      focusCell(index - 1);
    }
  } else if (e.key === 'ArrowLeft' && index > 0) {
    e.preventDefault();
    focusCell(index - 1);
  } else if (e.key === 'ArrowRight' && index + 1 < props.length) {
    e.preventDefault();
    focusCell(index + 1);
  } else if (e.key === 'Home') {
    e.preventDefault();
    focusCell(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    focusCell(props.length - 1);
  } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const valid = sanitizePinChars(e.key, props.type);
    e.preventDefault();
    if (!valid.length) return;
    next[index] = valid[0];
    commitCells(next);
    if (index + 1 < props.length) focusCell(index + 1);
  }
}

function onPaste(index: number, e: ClipboardEvent) {
  if (isDisabled.value) return;
  const text = e.clipboardData?.getData('text') ?? '';
  const valid = sanitizePinChars(text, props.type);
  if (!valid.length) return;
  e.preventDefault();
  const next = [...cells.value];
  const start = valid.length >= props.length ? 0 : index;
  valid.slice(0, props.length - start).forEach((ch, offset) => {
    next[start + offset] = ch;
  });
  commitCells(next);
  focusCell(Math.min(start + valid.length, props.length - 1));
}

function onFocus(e: FocusEvent) {
  (e.target as HTMLInputElement).select();
}

defineExpose({ focus: () => focusCell(0) });
</script>

<template>
  <div
    class="j-pin-input"
    role="group"
    data-j-managed=""
    :data-type="type"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-invalid="isInvalid ? 'true' : undefined"
    :aria-labelledby="field?.labelId.value"
    :aria-describedby="field?.describedBy.value"
  >
    <template v-for="(val, idx) in cells" :key="idx">
      <input
        :id="idx === 0 ? field?.id.value : undefined"
        :ref="(el) => setCellRef(idx, el)"
        :type="mask ? 'password' : 'text'"
        :inputmode="type === 'numeric' ? 'numeric' : 'text'"
        :autocomplete="otp && idx === 0 ? 'one-time-code' : 'off'"
        maxlength="1"
        class="j-pin-input__cell"
        :value="val"
        :placeholder="placeholder"
        :data-filled="val ? '' : undefined"
        :aria-label="`Character ${idx + 1} of ${length}`"
        :aria-invalid="isInvalid ? 'true' : undefined"
        :disabled="isDisabled || undefined"
        @input="onInput(idx, $event)"
        @keydown="onKeydown(idx, $event)"
        @paste="onPaste(idx, $event)"
        @focus="onFocus"
      />
      <span v-if="hasSeparatorAfter(idx)" class="j-pin-input__sep" aria-hidden="true">—</span>
    </template>
  </div>
</template>
