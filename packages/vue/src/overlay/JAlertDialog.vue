<script setup lang="ts">
// JAlertDialog — WAI-ARIA role="alertdialog" confirmation modal built on native <dialog>.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { lightDismiss } from 'jenni-core/behaviors/dialog.js';

defineOptions({ inheritAttrs: false });

export type AlertDialogTone = 'danger' | 'warning' | 'accent' | 'info';
export type AlertDialogSize = 'sm' | 'md';

export interface JAlertDialogProps {
  title: string;
  description?: string;
  tone?: AlertDialogTone;
  size?: AlertDialogSize;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Teleport `<dialog>` to `<body>` (or selector / element); pass `false` to keep inline. */
  teleport?: boolean | string | HTMLElement;
}

const props = withDefaults(defineProps<JAlertDialogProps>(), {
  tone: 'danger',
  size: 'sm',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  loading: false,
  disabled: false,
  icon: true,
  closeOnBackdrop: false,
  closeOnEscape: true,
  teleport: true,
});

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{
  confirm: [event: MouseEvent];
  cancel: [];
}>();

const slots = useSlots();
const id = useId();
const titleId = `${id}-title`;
const descId = `${id}-desc`;

const el = ref<HTMLDialogElement | null>(null);
const cancelBtn = ref<HTMLButtonElement | null>(null);
const confirmBtn = ref<HTMLButtonElement | null>(null);
let stopDismiss: (() => void) | null = null;

const teleportTo = computed(() =>
  typeof props.teleport === 'string' ||
  (typeof HTMLElement !== 'undefined' && props.teleport instanceof HTMLElement)
    ? props.teleport
    : 'body',
);

const teleportDisabled = computed(
  () => props.teleport === false || typeof document === 'undefined',
);

const preferSafeCancelFocus = computed(
  () => props.tone === 'danger' || props.tone === 'warning',
);

function applyInitialFocus() {
  const dlg = el.value;
  if (!dlg || !dlg.open) return;
  const userAutofocus = dlg.querySelector<HTMLElement>(
    '[autofocus]:not([data-alert-cancel]):not([data-alert-confirm])',
  );
  if (userAutofocus) {
    userAutofocus.focus({ preventScroll: true });
    return;
  }
  if (preferSafeCancelFocus.value && cancelBtn.value && !cancelBtn.value.disabled) {
    cancelBtn.value.focus({ preventScroll: true });
  } else if (!preferSafeCancelFocus.value && confirmBtn.value && !confirmBtn.value.disabled) {
    confirmBtn.value.focus({ preventScroll: true });
  }
}

function openModalElement() {
  const dlg = el.value;
  if (!dlg) return;
  if (!dlg.open) {
    dlg.showModal();
    applyInitialFocus();
    nextTick(applyInitialFocus);
  }
}

function show() {
  open.value = true;
  if (el.value) {
    openModalElement();
  } else {
    nextTick(() => {
      if (open.value) openModalElement();
    });
  }
}

function close() {
  if (el.value?.open) el.value.close();
  open.value = false;
}

function onDialogClose() {
  open.value = false;
}

function onDialogCancel(e: Event) {
  if (!props.closeOnEscape || props.loading) {
    e.preventDefault();
    return;
  }
  emit('cancel');
}

function onCancelClick() {
  if (props.loading) return;
  emit('cancel');
  close();
}

function onConfirmClick(e: MouseEvent) {
  if (props.loading || props.disabled) {
    e.preventDefault();
    return;
  }
  emit('confirm', e);
  if (e.defaultPrevented) return;
  nextTick(() => {
    if (!e.defaultPrevented && !props.loading) {
      close();
    }
  });
}

function bindDismiss() {
  stopDismiss?.();
  stopDismiss =
    el.value && props.closeOnBackdrop && !props.loading ? lightDismiss(el.value) : null;
}

onMounted(() => {
  if (el.value) {
    bindDismiss();
    if (open.value) show();
  } else {
    nextTick(() => {
      bindDismiss();
      if (open.value) show();
    });
  }
});

watch(el, () => {
  bindDismiss();
  if (open.value) openModalElement();
});

watch(open, (v) => (v ? show() : close()));
watch(() => [props.closeOnBackdrop, props.loading], bindDismiss);

onBeforeUnmount(() => {
  stopDismiss?.();
  if (el.value?.open) el.value.close();
});

defineExpose({ show, close });
</script>

<template>
  <slot name="trigger" :open="show" />
  <Teleport :to="teleportTo" :disabled="teleportDisabled">
    <dialog
      ref="el"
      class="j-dialog j-alert-dialog"
      role="alertdialog"
      aria-modal="true"
      data-j-managed=""
      :data-tone="tone"
      :data-size="size"
      :aria-labelledby="titleId"
      :aria-describedby="description ? descId : undefined"
      v-bind="$attrs"
      @close="onDialogClose"
      @cancel="onDialogCancel"
    >
      <div class="j-alert-dialog__header">
        <span v-if="icon" class="j-alert-dialog__icon" aria-hidden="true">
          <svg
            v-if="tone === 'danger'"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            shape-rendering="geometricPrecision"
          >
            <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z" />
            <path d="M12 8v4.5" />
            <path d="M12 16h.01" />
          </svg>
          <svg
            v-else-if="tone === 'warning'"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            shape-rendering="geometricPrecision"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <svg
            v-else-if="tone === 'info'"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            shape-rendering="geometricPrecision"
          >
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 16v-4.5" />
            <path d="M12 8h.01" />
          </svg>
          <svg
            v-else
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            shape-rendering="geometricPrecision"
          >
            <circle cx="12" cy="12" r="9.5" />
            <path d="m8.75 12.25 2.25 2.25 4.5-4.75" />
          </svg>
        </span>

        <div class="j-alert-dialog__content">
          <h2 :id="titleId" class="j-dialog__title j-alert-dialog__title">{{ title }}</h2>
          <p v-if="description" :id="descId" class="j-dialog__description j-alert-dialog__description">
            {{ description }}
          </p>
        </div>
      </div>

      <div v-if="slots.default" class="j-alert-dialog__body">
        <slot :close="close" :cancel="onCancelClick" />
      </div>

      <footer class="j-dialog__footer j-alert-dialog__footer">
        <button
          ref="cancelBtn"
          type="button"
          class="j-button"
          data-variant="outline"
          data-alert-cancel=""
          :autofocus="preferSafeCancelFocus ? true : undefined"
          :disabled="loading || undefined"
          @click="onCancelClick"
        >
          {{ cancelLabel }}
        </button>
        <button
          ref="confirmBtn"
          type="button"
          class="j-button"
          data-alert-confirm=""
          :data-tone="tone"
          :data-loading="loading ? '' : undefined"
          :aria-busy="loading ? 'true' : undefined"
          :disabled="disabled || loading || undefined"
          @click="onConfirmClick"
        >
          {{ confirmLabel }}
        </button>
      </footer>
    </dialog>
  </Teleport>
</template>
