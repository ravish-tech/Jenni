<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { copyToClipboard } from 'jenni-core/behaviors/code-block.js';

export type CopyButtonSize = 'xs' | 'sm' | 'md';
export type CopyButtonVariant = 'ghost' | 'outline' | 'soft';

export interface JCopyButtonProps {
  /** Text string written to the clipboard when activated. */
  value: string;
  /** Control height & icon scale. */
  size?: CopyButtonSize;
  /** Visual surface treatment. */
  variant?: CopyButtonVariant;
  /** Optional visible text label beside the icon. */
  label?: string;
  /** Accessible label announced before copying. */
  ariaLabel?: string;
  /** Accessible (and visible, when `label` is set) text shown after copying. */
  copiedLabel?: string;
  /** Reset delay in milliseconds for the transient copied state. */
  timeout?: number;
  /** Disable button interaction. */
  disabled?: boolean;
}

defineOptions({ name: 'JCopyButton' });

const props = withDefaults(defineProps<JCopyButtonProps>(), {
  size: 'sm',
  variant: 'ghost',
  ariaLabel: 'Copy to clipboard',
  copiedLabel: 'Copied',
  timeout: 1600,
  disabled: false,
});

const emit = defineEmits<{
  copy: [value: string];
}>();

const copied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | null = null;

function clearResetTimer() {
  if (resetTimer !== null) {
    clearTimeout(resetTimer);
    resetTimer = null;
  }
}

async function handleClick() {
  if (props.disabled) return;
  const ok = await copyToClipboard(props.value);
  if (!ok) return;

  copied.value = true;
  emit('copy', props.value);

  clearResetTimer();
  const duration = Math.max(200, props.timeout ?? 1600);
  resetTimer = setTimeout(() => {
    copied.value = false;
    resetTimer = null;
  }, duration);
}

onBeforeUnmount(clearResetTimer);
</script>

<template>
  <button
    type="button"
    class="j-copy-button"
    data-j-managed=""
    :data-size="size === 'sm' ? undefined : size"
    :data-variant="variant === 'ghost' ? undefined : variant"
    :data-copied="copied ? '' : undefined"
    :disabled="disabled"
    :aria-label="copied ? copiedLabel : ariaLabel"
    @click="handleClick"
  >
    <span class="j-copy-button__icons" aria-hidden="true">
      <svg
        class="j-copy-button__icon j-copy-button__icon--copy"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        shape-rendering="geometricPrecision"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <svg
        class="j-copy-button__icon j-copy-button__icon--check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        shape-rendering="geometricPrecision"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
    <span v-if="label || $slots.default" class="j-copy-button__label">
      <template v-if="copied">{{ copiedLabel }}</template>
      <slot v-else>{{ label }}</slot>
    </span>
  </button>
</template>
