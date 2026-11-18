<script setup lang="ts">
// JDropdownMenu — WAI-ARIA menu button + floating menu panel.
//   <JDropdownMenu align="start">
//     <template #trigger><JButton variant="outline">Options</JButton></template>
//     <JDropdownLabel>Account</JDropdownLabel>
//     <JDropdownItem shortcut="⇧⌘P">Profile</JDropdownItem>
//   </JDropdownMenu>
import { onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { createMenu } from '@jenni/core/behaviors/menu.js';
import type { FloatingAlign, FloatingSide } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    side?: FloatingSide;
    align?: FloatingAlign;
    arrow?: boolean;
    loop?: boolean;
    /** Element id to anchor to when no #trigger slot is used. */
    anchor?: string;
  }>(),
  { side: 'bottom', align: 'start', loop: true },
);

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ select: [event: CustomEvent] }>();
const slots = useSlots();
const id = useId();
const el = ref<HTMLElement | null>(null);
let cleanup: (() => void) | null = null;

const isOpen = () => !!el.value?.matches(':popover-open');
function show() {
  if (el.value && !isOpen()) el.value.showPopover();
}
function hide() {
  if (el.value && isOpen()) el.value.hidePopover();
}

function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open';
}

function onSelect(e: Event) {
  emit('select', e as CustomEvent);
}

function setup() {
  cleanup?.();
  cleanup = null;
  const trigger = (slots.trigger
    ? el.value?.previousElementSibling
    : props.anchor
      ? document.getElementById(props.anchor)
      : null) as HTMLElement | null;
  if (el.value && trigger) {
    cleanup = createMenu(trigger, el.value, {
      side: props.side,
      loop: props.loop,
      manageChecked: false,
    });
  }
}

onMounted(() => {
  setup();
  el.value?.addEventListener('j-select', onSelect);
  if (open.value) show();
});

watch(() => [props.side, props.loop, props.anchor], setup);
watch(open, (v) => (v ? show() : hide()));

onBeforeUnmount(() => {
  el.value?.removeEventListener('j-select', onSelect);
  cleanup?.();
});

defineExpose({ show, hide });
</script>

<template>
  <slot name="trigger" />
  <div
    :id="id"
    ref="el"
    class="j-menu"
    popover="auto"
    role="menu"
    :data-side="side"
    :data-align="align === 'center' ? undefined : align"
    :data-arrow="arrow ? '' : undefined"
    v-bind="$attrs"
    @toggle="onToggle"
  >
    <slot :close="hide" />
  </div>
</template>
