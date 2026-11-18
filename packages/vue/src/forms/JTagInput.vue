<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef } from 'vue';
import { sizeAttr, splitAttrs, useFieldAttrs, type Size, type Tone } from './types';

defineOptions({ inheritAttrs: false });

const model = defineModel<string[]>({ default: () => [] });
const props = defineProps<{
  maxTags?: number;
  allowDuplicates?: boolean;
  placeholder?: string;
  size?: Size;
  tone?: Tone;
  disabled?: boolean;
  invalid?: boolean;
}>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const parts = computed(() => splitAttrs(attrs));
const inputEl = useTemplateRef<HTMLInputElement>('inputEl');
const draft = ref('');

const isDisabled = computed(() => !!(props.disabled || field.value.disabled));
const isInvalid = computed(() => !!(props.invalid || field.value['aria-invalid']));
const atLimit = computed(() => props.maxTags !== undefined && model.value.length >= props.maxTags);

function addTags(candidates: string[]) {
  if (isDisabled.value) return false;
  const next = [...model.value];
  let added = false;
  for (const raw of candidates) {
    const clean = raw.trim().replace(/,+$/, '').trim();
    if (!clean) continue;
    if (props.maxTags !== undefined && next.length >= props.maxTags) break;
    if (!props.allowDuplicates && next.some((t) => t.toLowerCase() === clean.toLowerCase())) continue;
    next.push(clean);
    added = true;
  }
  if (added) model.value = next;
  return added;
}

function removeAt(index: number) {
  if (isDisabled.value) return;
  model.value = model.value.filter((_, i) => i !== index);
  inputEl.value?.focus();
}

function onKeydown(e: KeyboardEvent) {
  if (isDisabled.value) return;
  if (e.key === 'Enter' || e.key === ',') {
    if (e.key === 'Enter' && !draft.value.trim()) return;
    e.preventDefault();
    if (addTags([draft.value])) {
      draft.value = '';
    } else if (e.key === ',') {
      draft.value = draft.value.replace(/,+$/, '');
    }
  } else if (e.key === 'Backspace' && draft.value === '' && model.value.length > 0) {
    e.preventDefault();
    model.value = model.value.slice(0, -1);
  }
}

function onPaste(e: ClipboardEvent) {
  if (isDisabled.value) return;
  const text = e.clipboardData?.getData('text') ?? '';
  if (!text.includes(',')) return;
  e.preventDefault();
  addTags(text.split(','));
  draft.value = '';
}

function onShellClick(e: MouseEvent) {
  const target = e.target as Element;
  if (target === inputEl.value || target.closest('button')) return;
  if (!isDisabled.value) inputEl.value?.focus();
}

defineExpose({ focus: () => inputEl.value?.focus(), input: inputEl });
</script>

<template>
  <div
    class="j-tag-input"
    data-j-managed=""
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :data-max-tags="maxTags"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-invalid="isInvalid ? 'true' : undefined"
    v-bind="parts.root"
    @click="onShellClick"
  >
    <span v-for="(tag, idx) in model" :key="`${tag}-${idx}`" class="j-tag-input__tag" :data-value="tag">
      <span class="j-tag-input__tag-label">{{ tag }}</span>
      <button
        type="button"
        class="j-tag-input__remove"
        :aria-label="`Remove ${tag}`"
        :disabled="isDisabled || undefined"
        @click.stop="removeAt(idx)"
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
    </span>
    <input
      ref="inputEl"
      v-model="draft"
      type="text"
      class="j-tag-input__field"
      :placeholder="atLimit ? '' : placeholder"
      v-bind="{ ...field, ...parts.control, disabled: isDisabled || undefined }"
      @keydown="onKeydown"
      @paste="onPaste"
    />
  </div>
</template>
