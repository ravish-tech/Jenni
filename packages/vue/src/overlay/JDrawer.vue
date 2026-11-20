<script setup lang="ts">
// JDrawer — native modal <dialog class="j-drawer"> sheet anchored to any viewport edge,
// teleported to <body> by default.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { createDrawer } from 'jenni-core/behaviors/drawer.js';
import type { DrawerSide, DrawerSize } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    side?: DrawerSide;
    size?: DrawerSize;
    /** Floating sheet with 8px viewport margin and 4-corner radius. */
    inset?: boolean;
    /** Show the × close button. */
    closable?: boolean;
    /** Close on backdrop click and Escape. */
    dismissible?: boolean;
    /** Teleport <dialog> to `<body>` (or a selector / element); pass `false` to keep inline. */
    teleport?: boolean | string | HTMLElement;
  }>(),
  { side: 'right', size: 'md', closable: true, dismissible: true, teleport: true },
);

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ close: [] }>();
const slots = useSlots();
const id = useId();
const titleId = `${id}-title`;
const descId = `${id}-desc`;
const el = ref<HTMLDialogElement | null>(null);
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
  stopDismiss = el.value ? createDrawer(el.value, { dismissible: props.dismissible }) : null;
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
  if (open.value && el.value && !el.value.open) el.value.showModal();
});
watch(open, (v) => (v ? show() : close()));
watch(() => props.dismissible, bindDismiss);

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
      class="j-drawer"
      :data-side="side === 'right' ? undefined : side"
      :data-size="size === 'md' ? undefined : size"
      :data-inset="inset ? '' : undefined"
      :aria-labelledby="title || slots.header ? titleId : undefined"
      :aria-describedby="description ? descId : undefined"
      v-bind="$attrs"
      @close="onClose"
      @cancel="onCancel"
    >
      <header v-if="title || description || slots.header" class="j-drawer__header">
        <slot name="header" :title-id="titleId">
          <h2 v-if="title" :id="titleId" class="j-drawer__title">{{ title }}</h2>
          <p v-if="description" :id="descId" class="j-drawer__description">{{ description }}</p>
        </slot>
      </header>
      <div v-if="slots.default" class="j-drawer__body">
        <slot :close="close" />
      </div>
      <footer v-if="slots.footer" class="j-drawer__footer">
        <slot name="footer" :close="close" />
      </footer>
      <button
        v-if="closable"
        type="button"
        class="j-drawer__close"
        aria-label="Close"
        @click="close"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </dialog>
  </Teleport>
</template>
