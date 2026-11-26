<script lang="ts">
declare module 'jenni-core/behaviors/dialog.js' {
  export interface DialogDefaultActionOptions {
    defaultAction?: boolean | string | (() => boolean | string | undefined);
  }
  export function resolveDialogDefaultButton(
    dialog: HTMLDialogElement,
    defaultAction?: boolean | string,
  ): HTMLElement | null;
  export function focusDialogDefaultAction(
    dialog: HTMLDialogElement,
    defaultAction?: boolean | string,
  ): boolean;
  export function bindDialogDefaultAction(
    dialog: HTMLDialogElement,
    options?: DialogDefaultActionOptions,
  ): () => void;
}
</script>

<script setup lang="ts">
// JDialog — native modal <dialog>, teleported to <body> by default.
// Focus trap, Escape, and focus restore come from the browser.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { bindDialogDefaultAction, lightDismiss } from 'jenni-core/behaviors/dialog.js';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Show the × button. */
    closable?: boolean;
    /** Close on backdrop click and Escape. */
    dismissible?: boolean;
    /** Remove `.j-dialog__body` padding for edge-to-edge lists, tables, or editors. */
    flush?: boolean;
    /** Alias for `flush`. */
    bodyFlush?: boolean;
    /**
     * Primary action triggered on `Enter` and focused on open.
     * `true` (default) discovers any footer `[data-default-action]` button (`<JButton default>`);
     * a `string` matches by `[data-action]`, `id`, `aria-label`, or trimmed button text;
     * `false` disables default Enter activation.
     */
    defaultAction?: boolean | string;
    /** Teleport <dialog> to `<body>` (or a selector / element); pass `false` to keep inline. */
    teleport?: boolean | string | HTMLElement;
  }>(),
  { size: 'md', closable: true, dismissible: true, defaultAction: true, teleport: true },
);

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ close: [] }>();
const slots = useSlots();
const id = useId();
const titleId = `${id}-title`;
const descId = `${id}-desc`;
const el = ref<HTMLDialogElement | null>(null);
let stopDismiss: (() => void) | null = null;
let stopDefaultAction: (() => void) | null = null;

const teleportTo = computed(() =>
  typeof props.teleport === 'string' ||
  (typeof HTMLElement !== 'undefined' && props.teleport instanceof HTMLElement)
    ? props.teleport
    : 'body',
);

const teleportDisabled = computed(
  () => props.teleport === false || typeof document === 'undefined',
);

function show() {
  open.value = true;
  if (el.value) {
    if (!el.value.open) el.value.showModal();
  } else {
    nextTick(() => {
      if (open.value && el.value && !el.value.open) el.value.showModal();
    });
  }
}

function close() {
  if (el.value?.open) el.value.close();
  open.value = false;
}

function onClose() {
  open.value = false;
  emit('close');
}

function onCancel(e: Event) {
  if (!props.dismissible) e.preventDefault();
}

function bindDismiss() {
  stopDismiss?.();
  stopDismiss = el.value && props.dismissible ? lightDismiss(el.value) : null;
}

function bindDefault() {
  stopDefaultAction?.();
  stopDefaultAction = el.value
    ? bindDialogDefaultAction(el.value, { defaultAction: () => props.defaultAction })
    : null;
}

onMounted(() => {
  if (el.value) {
    bindDismiss();
    bindDefault();
    if (open.value) show();
  } else {
    nextTick(() => {
      bindDismiss();
      bindDefault();
      if (open.value) show();
    });
  }
});

watch(el, () => {
  bindDismiss();
  bindDefault();
  if (open.value && el.value && !el.value.open) el.value.showModal();
});
watch(open, (v) => (v ? show() : close()));
watch(() => props.dismissible, bindDismiss);

onBeforeUnmount(() => {
  stopDismiss?.();
  stopDefaultAction?.();
  if (el.value?.open) el.value.close();
});

defineExpose({ show, close });
</script>

<template>
  <slot name="trigger" :open="show" />
  <Teleport :to="teleportTo" :disabled="teleportDisabled">
    <dialog
      ref="el"
      class="j-dialog"
      data-j-managed=""
      :data-size="size === 'md' ? undefined : size"
      :data-flush="flush || bodyFlush ? '' : undefined"
      :aria-labelledby="title || slots.header ? titleId : undefined"
      :aria-describedby="description ? descId : undefined"
      v-bind="$attrs"
      @close="onClose"
      @cancel="onCancel"
    >
      <header v-if="title || description || slots.header" class="j-dialog__header">
        <slot name="header" :title-id="titleId">
          <h2 v-if="title" :id="titleId" class="j-dialog__title">{{ title }}</h2>
          <p v-if="description" :id="descId" class="j-dialog__description">{{ description }}</p>
        </slot>
      </header>
      <div v-if="slots.default" class="j-dialog__body">
        <slot :close="close" />
      </div>
      <footer v-if="slots.footer" class="j-dialog__footer">
        <slot name="footer" :close="close" />
      </footer>
      <button
        v-if="closable"
        type="button"
        class="j-dialog__close"
        aria-label="Close"
        @click="close"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          shape-rendering="geometricPrecision"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </dialog>
  </Teleport>
</template>
