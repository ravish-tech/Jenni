<script setup lang="ts">
// JContextMenu — right-click (`contextmenu`) or Shift+F10 target region that opens
// a `.j-menu` popover clamped cleanly inside the viewport.
// Compose items with `JDropdownItem`, `JDropdownLabel`, and `JDropdownSeparator`.
import { onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { createContextMenu } from 'jenni-core/behaviors/context-menu.js';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    loop?: boolean;
    disabled?: boolean;
    /** Element id to bind right-click onto when no #trigger slot is used. */
    target?: string;
  }>(),
  { loop: true },
);

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ select: [event: CustomEvent] }>();
const slots = useSlots();
const id = useId();
const targetWrap = ref<HTMLElement | null>(null);
const menuEl = ref<HTMLElement | null>(null);
let cleanup: (() => void) | null = null;

function hide() {
  if (menuEl.value?.matches(':popover-open')) {
    try {
      menuEl.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
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
  if (props.disabled || !menuEl.value) return;
  const targetEl = slots.trigger
    ? targetWrap.value
    : props.target
      ? document.getElementById(props.target)
      : null;
  if (targetEl) {
    cleanup = createContextMenu(targetEl, menuEl.value, {
      loop: props.loop,
      manageChecked: false,
    });
  }
}

onMounted(() => {
  setup();
  menuEl.value?.addEventListener('j-select', onSelect);
});

watch(() => [props.loop, props.disabled, props.target], setup);
watch(open, (v) => {
  if (!v) hide();
});

onBeforeUnmount(() => {
  menuEl.value?.removeEventListener('j-select', onSelect);
  cleanup?.();
});

defineExpose({ hide });
</script>

<template>
  <div v-if="slots.trigger" ref="targetWrap" class="j-context-menu-trigger">
    <slot name="trigger" />
  </div>
  <div
    :id="id"
    ref="menuEl"
    class="j-menu"
    popover="auto"
    role="menu"
    data-context-menu
    v-bind="$attrs"
    @toggle="onToggle"
  >
    <slot :close="hide" />
  </div>
</template>
