<script setup lang="ts">
// JPopover — a floating panel opened by its trigger (click). Light-dismiss + Esc are native.
//   <JPopover v-model:open="open" align="start">
//     <template #trigger><button class="j-button">Share</button></template>
//     …panel content…
//   </JPopover>
import { onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { createPopover } from 'jenni-core/behaviors/popover.js';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    size?: 'sm' | 'md' | 'lg';
    arrow?: boolean;
    /** Element id to anchor to when no #trigger slot is used. */
    anchor?: string;
  }>(),
  { side: 'bottom', align: 'center', size: 'md' },
);

const open = defineModel<boolean>('open', { default: false });
const slots = useSlots();
const id = useId();
const el = ref<HTMLElement | null>(null);
let cleanup: (() => void) | null = null;

const isOpen = () => !!el.value?.matches(':popover-open');
function show() { if (el.value && !isOpen()) el.value.showPopover(); }
function hide() { if (el.value && isOpen()) el.value.hidePopover(); }

function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open';
}

onMounted(() => {
  const trigger = (slots.trigger
    ? el.value?.previousElementSibling
    : props.anchor ? document.getElementById(props.anchor) : null) as HTMLElement | null;
  if (el.value && trigger) cleanup = createPopover(trigger, el.value, { side: props.side });
  if (open.value) show();
});
watch(open, (v) => (v ? show() : hide()));
onBeforeUnmount(() => cleanup?.());

defineExpose({ show, hide });
</script>

<template>
  <slot name="trigger" />
  <div
    :id="id"
    ref="el"
    class="j-popover"
    popover="auto"
    :data-side="side"
    :data-align="align === 'center' ? undefined : align"
    :data-size="size === 'md' ? undefined : size"
    :data-arrow="arrow ? '' : undefined"
    v-bind="$attrs"
    @toggle="onToggle"
  >
    <slot :close="hide" />
  </div>
</template>
