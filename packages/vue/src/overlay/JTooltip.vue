<script setup lang="ts">
// JTooltip — wraps ONE trigger element (default slot) and shows a hint.
//   <JTooltip content="Copy link" :kbd="['⌘', 'C']"><button class="j-button">…</button></JTooltip>
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { createTooltip } from '@jenni/core/behaviors/tooltip.js';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    content?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    arrow?: boolean;
    /** Open delay in ms (default 450). Moving between tooltips is instant. */
    delay?: number;
    /** Keyboard hint, e.g. "⌘K" or ['⌘', 'K']. */
    kbd?: string | string[];
    disabled?: boolean;
  }>(),
  { side: 'top', align: 'center' },
);

const id = useId();
const el = ref<HTMLElement | null>(null);
let ctl: ReturnType<typeof createTooltip> | null = null;

function setup() {
  ctl?.destroy();
  ctl = null;
  const trigger = el.value?.previousElementSibling as HTMLElement | null;
  if (!el.value || !trigger || props.disabled) return;
  ctl = createTooltip(trigger, el.value, { delay: props.delay, side: props.side });
}

onMounted(setup);
watch(() => [props.disabled, props.delay, props.side], setup);
onBeforeUnmount(() => ctl?.destroy());

const keys = () => (props.kbd == null ? [] : Array.isArray(props.kbd) ? props.kbd : [props.kbd]);
</script>

<template>
  <slot />
  <div
    :id="id"
    ref="el"
    class="j-tooltip"
    popover="manual"
    role="tooltip"
    :data-side="side"
    :data-align="align === 'center' ? undefined : align"
    :data-arrow="arrow ? '' : undefined"
    v-bind="$attrs"
  >
    <slot name="content">{{ content }}</slot>
    <kbd v-for="k in keys()" :key="k" class="j-tooltip__kbd">{{ k }}</kbd>
  </div>
</template>
