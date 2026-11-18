<script setup lang="ts">
import { computed, inject, ref, useTemplateRef } from 'vue';
import { formatFileSize, validateUploadFile } from '@jenni/core/behaviors/file-upload.js';
import { FieldKey, type Tone } from './types';

export interface RejectedFileEntry {
  file: File;
  error: string;
}

const model = defineModel<File[]>({ default: () => [] });
const props = withDefaults(
  defineProps<{
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    variant?: 'dropzone' | 'compact';
    tone?: Tone;
    label?: string;
    hint?: string;
    disabled?: boolean;
    invalid?: boolean;
  }>(),
  { multiple: true, variant: 'dropzone' },
);
const emit = defineEmits<{
  reject: [rejected: RejectedFileEntry[]];
}>();

const field = inject(FieldKey, null);
const inputEl = useTemplateRef<HTMLInputElement>('inputEl');
const dragging = ref(false);
let dragDepth = 0;

const rejected = ref<RejectedFileEntry[]>([]);
const isDisabled = computed(() => !!(props.disabled || field?.disabled.value));
const isInvalid = computed(() => !!(props.invalid || field?.invalid.value || rejected.value.length > 0));

const defaultHint = computed(() => {
  if (props.hint) return props.hint;
  const parts: string[] = [];
  if (props.accept) parts.push(props.accept);
  if (props.maxSize) parts.push(`up to ${formatFileSize(props.maxSize)}`);
  return parts.join(' · ');
});

function processFiles(incoming: FileList | File[]) {
  if (isDisabled.value) return;
  const validNext: File[] = props.multiple ? [...model.value] : [];
  const nextRejected: RejectedFileEntry[] = props.multiple ? [...rejected.value] : [];
  const newlyRejected: RejectedFileEntry[] = [];

  for (const file of Array.from(incoming)) {
    const err = validateUploadFile(file, { maxSize: props.maxSize, accept: props.accept });
    if (err) {
      const entry = { file, error: err };
      nextRejected.push(entry);
      newlyRejected.push(entry);
      continue;
    }
    if (props.maxFiles !== undefined && validNext.length >= props.maxFiles) {
      const entry = { file, error: `Maximum ${props.maxFiles} files allowed` };
      nextRejected.push(entry);
      newlyRejected.push(entry);
      continue;
    }
    validNext.push(file);
    if (!props.multiple) break;
  }

  model.value = validNext;
  rejected.value = nextRejected;
  if (newlyRejected.length) emit('reject', newlyRejected);
  if (inputEl.value) inputEl.value.value = '';
}

function removeValid(index: number) {
  if (isDisabled.value) return;
  model.value = model.value.filter((_, i) => i !== index);
}

function removeRejected(index: number) {
  if (isDisabled.value) return;
  rejected.value = rejected.value.filter((_, i) => i !== index);
}

function onInputChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files?.length) processFiles(files);
}

function onDragEnter(e: DragEvent) {
  e.preventDefault();
  if (isDisabled.value) return;
  dragDepth += 1;
  dragging.value = true;
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  if (!isDisabled.value && e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
}

function onDragLeave(e: DragEvent) {
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragging.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  dragDepth = 0;
  dragging.value = false;
  if (e.dataTransfer?.files?.length) processFiles(e.dataTransfer.files);
}
</script>

<template>
  <div
    class="j-file-upload"
    data-j-managed=""
    :data-variant="variant === 'compact' ? 'compact' : undefined"
    :data-tone="tone"
    :data-dragging="dragging ? '' : undefined"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-invalid="isInvalid ? 'true' : undefined"
  >
    <label
      class="j-file-upload__dropzone"
      :data-dragging="dragging ? '' : undefined"
      :aria-disabled="isDisabled ? 'true' : undefined"
      :aria-invalid="isInvalid ? 'true' : undefined"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <input
        :id="field?.id.value"
        ref="inputEl"
        type="file"
        class="j-file-upload__input"
        :accept="accept"
        :multiple="multiple || undefined"
        :disabled="isDisabled || undefined"
        :aria-describedby="field?.describedBy.value"
        @change="onInputChange"
      />

      <template v-if="variant === 'compact'">
        <span class="j-file-upload__lead">
          <span class="j-file-upload__icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 10.5V3M5 5.5 8 2.5l3 3" />
              <path d="M2.5 11v1.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V11" />
            </svg>
          </span>
          <span class="j-file-upload__content">
            <span class="j-file-upload__title">{{ label || 'Attach files or drop here' }}</span>
            <span v-if="defaultHint" class="j-file-upload__hint">{{ defaultHint }}</span>
          </span>
        </span>
        <span class="j-file-upload__cta">Browse</span>
      </template>

      <template v-else>
        <span class="j-file-upload__icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 10.5V3M5 5.5 8 2.5l3 3" />
            <path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />
          </svg>
        </span>
        <span class="j-file-upload__content">
          <span class="j-file-upload__title">
            <template v-if="label">{{ label }}</template>
            <template v-else>Drop files here or <span class="j-file-upload__browse">browse</span></template>
          </span>
          <span v-if="defaultHint" class="j-file-upload__hint">{{ defaultHint }}</span>
        </span>
      </template>
    </label>

    <ul v-if="model.length || rejected.length" class="j-file-upload__list">
      <li v-for="(file, idx) in model" :key="`ok-${file.name}-${idx}`" class="j-file-upload__item">
        <span class="j-file-upload__file-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.5 2H4.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.5L9.5 2Z" />
            <path d="M9.5 2v3.5H13" />
          </svg>
        </span>
        <div class="j-file-upload__meta">
          <span class="j-file-upload__name">{{ file.name }}</span>
          <span class="j-file-upload__size">{{ formatFileSize(file.size) }}</span>
        </div>
        <button
          type="button"
          class="j-file-upload__remove"
          :aria-label="`Remove ${file.name}`"
          :disabled="isDisabled || undefined"
          @click="removeValid(idx)"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
          </svg>
        </button>
      </li>

      <li
        v-for="(item, idx) in rejected"
        :key="`err-${item.file.name}-${idx}`"
        class="j-file-upload__item"
        data-invalid=""
      >
        <span class="j-file-upload__file-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5M8 11h.01" />
          </svg>
        </span>
        <div class="j-file-upload__meta">
          <span class="j-file-upload__name">{{ item.file.name }}</span>
          <span class="j-file-upload__error">{{ formatFileSize(item.file.size) }} · {{ item.error }}</span>
        </div>
        <button
          type="button"
          class="j-file-upload__remove"
          :aria-label="`Dismiss ${item.file.name}`"
          :disabled="isDisabled || undefined"
          @click="removeRejected(idx)"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>
