<script setup lang="ts">
// JContextMenu — right-click (`contextmenu`), Shift+F10, or imperative menu controller
// that opens a `.j-menu` popover clamped cleanly inside the viewport.
import { onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import {
  createContextMenu,
  type ContextMenuController,
  type ContextMenuEventLike,
  type ContextMenuOpenAtOptions,
  type ContextMenuOpenForOptions,
} from 'jenni-core/behaviors/context-menu.js';

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
let ctrl: ContextMenuController | null = null;

function openAt(x: number, y: number, opts?: ContextMenuOpenAtOptions | boolean) {
  if (props.disabled) return;
  if (!ctrl) setup();
  ctrl?.openAt(x, y, opts);
}

function openFor(anchorEl: HTMLElement, opts?: ContextMenuOpenForOptions) {
  if (props.disabled) return;
  if (!ctrl) setup();
  ctrl?.openFor(anchorEl, opts);
}

function openFromEvent(e: MouseEvent | KeyboardEvent | ContextMenuEventLike) {
  if (props.disabled) return;
  if (!ctrl) setup();
  ctrl?.openFromEvent(e);
}

function hide() {
  if (ctrl) {
    ctrl.close();
    return;
  }
  if (menuEl.value?.matches(':popover-open')) {
    try {
      menuEl.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
}

function isOpen(): boolean {
  return ctrl ? ctrl.isOpen() : Boolean(menuEl.value?.matches(':popover-open'));
}

function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open';
}

function onSelect(e: Event) {
  emit('select', e as CustomEvent);
}

function setup() {
  ctrl?.destroy();
  ctrl = null;
  if (props.disabled || !menuEl.value) return;
  const targetEl = slots.trigger
    ? targetWrap.value
    : props.target && typeof document !== 'undefined'
      ? document.getElementById(props.target)
      : null;
  ctrl = createContextMenu(targetEl, menuEl.value, {
    loop: props.loop,
    manageChecked: false,
  });
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
  ctrl?.destroy();
  ctrl = null;
});

defineExpose({
  openAt,
  openFor,
  openFromEvent,
  show: openAt,
  hide,
  close: hide,
  isOpen,
});
</script>

<template>
  <div v-if="slots.trigger" ref="targetWrap" class="j-context-menu-trigger">
    <slot
      name="trigger"
      :openAt="openAt"
      :openFor="openFor"
      :openFromEvent="openFromEvent"
      :close="hide"
    />
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
    <slot
      :close="hide"
      :openAt="openAt"
      :openFor="openFor"
      :openFromEvent="openFromEvent"
    />
  </div>
</template>
