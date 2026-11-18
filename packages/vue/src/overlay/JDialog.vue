<script setup lang="ts">
// JDialog — native modal <dialog>. Focus trap, Esc and focus restore come from the browser.
//   <JDialog v-model:open="open" title="Edit profile" description="…">
//     …body…
//     <template #footer="{ close }"><button class="j-button" @click="close">Cancel</button></template>
//   </JDialog>
import { onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { lightDismiss } from '@jenni/core/behaviors/dialog.js';

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
  }>(),
  { size: 'md', closable: true, dismissible: true },
);

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ close: [] }>();
const slots = useSlots();
const id = useId();
const titleId = `${id}-title`;
const descId = `${id}-desc`;
const el = ref<HTMLDialogElement | null>(null);
let stopDismiss: (() => void) | null = null;

function show() {
  if (el.value && !el.value.open) el.value.showModal();
  open.value = true;
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

onMounted(() => {
  bindDismiss();
  if (open.value) show();
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
  <dialog
    ref="el"
    class="j-dialog"
    :data-size="size === 'md' ? undefined : size"
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
    <button v-if="closable" type="button" class="j-dialog__close" aria-label="Close" @click="close">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  </dialog>
</template>
