<script setup lang="ts">
// JHoverCard — rich interactive preview card opened on pointer hover or keyboard
// focus after a calm 320ms delay, bridged across a 180ms close delay.
import { onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { createHoverCard } from '@jenni/core/behaviors/hover-card.js';
import type { FloatingAlign, FloatingSide, OverlaySize } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    side?: FloatingSide;
    align?: FloatingAlign;
    size?: OverlaySize;
    arrow?: boolean;
    /** Open delay in ms (default 320). */
    openDelay?: number;
    /** Close bridge delay in ms (default 180). */
    closeDelay?: number;
    disabled?: boolean;
    /** Element id to anchor to when no #trigger slot is used. */
    anchor?: string;
  }>(),
  { side: 'bottom', align: 'center', size: 'md', openDelay: 320, closeDelay: 180 },
);

const open = defineModel<boolean>('open', { default: false });
const slots = useSlots();
const id = useId();
const el = ref<HTMLElement | null>(null);
let ctl: ReturnType<typeof createHoverCard> | null = null;

function show() {
  ctl?.show();
}

function hide() {
  ctl?.hide();
}

function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open';
}

function setup() {
  ctl?.destroy();
  ctl = null;
  if (props.disabled || !el.value) return;
  const trigger = (slots.trigger
    ? el.value.previousElementSibling
    : props.anchor
      ? document.getElementById(props.anchor)
      : null) as HTMLElement | null;
  if (!trigger) return;
  ctl = createHoverCard(trigger, el.value, {
    openDelay: props.openDelay,
    closeDelay: props.closeDelay,
    side: props.side,
  });
  if (open.value) ctl.show();
}

onMounted(setup);
watch(() => [props.disabled, props.openDelay, props.closeDelay, props.side, props.anchor], setup);
watch(open, (v) => (v ? show() : hide()));
onBeforeUnmount(() => ctl?.destroy());

defineExpose({ show, hide });
</script>

<template>
  <slot name="trigger" />
  <div
    :id="id"
    ref="el"
    class="j-hover-card"
    popover="manual"
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
