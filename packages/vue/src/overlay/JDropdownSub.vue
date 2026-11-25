<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { createSubmenu } from 'jenni-core/behaviors/menu.js';

export interface JDropdownSubProps {
  label?: string;
  inset?: boolean;
  disabled?: boolean;
  textValue?: string;
}

const props = defineProps<JDropdownSubProps>();
const open = defineModel<boolean>('open', { default: false });

defineSlots<{
  default?(): unknown;
  trigger?(): unknown;
  icon?(): unknown;
}>();

const subId = useId();
const triggerEl = ref<HTMLButtonElement | null>(null);
const subMenuEl = ref<HTMLDivElement | null>(null);
let cleanup: (() => void) | null = null;

const isOpen = () => Boolean(subMenuEl.value?.matches(':popover-open'));

function show() {
  if (props.disabled) return;
  if (subMenuEl.value && !isOpen()) {
    try {
      subMenuEl.value.showPopover();
    } catch {
      /* ignore */
    }
  }
}

function hide() {
  if (subMenuEl.value && isOpen()) {
    try {
      subMenuEl.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
}

function onToggle(e: Event) {
  if (e.target !== subMenuEl.value) return;
  open.value = (e as ToggleEvent).newState === 'open';
}

function setup() {
  cleanup?.();
  cleanup = null;
  if (triggerEl.value && subMenuEl.value) {
    cleanup = createSubmenu(triggerEl.value, subMenuEl.value, {
      manageChecked: false,
    });
  }
}

onMounted(() => {
  setup();
  if (open.value) show();
});

watch(open, (v) => (v ? show() : hide()));

onBeforeUnmount(() => {
  cleanup?.();
  cleanup = null;
});

defineExpose({ show, hide });
</script>

<template>
  <div class="j-menu__sub">
    <button
      ref="triggerEl"
      type="button"
      role="menuitem"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="subId"
      :disabled="disabled || undefined"
      :aria-disabled="disabled ? 'true' : undefined"
      :data-inset="inset ? '' : undefined"
      :data-text-value="textValue ?? label"
      class="j-menu__item j-menu__sub-trigger"
    >
      <slot name="icon" />
      <slot name="trigger">{{ label }}</slot>
      <svg
        class="j-menu__sub-chevron"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 4 4 4-4 4" />
      </svg>
    </button>
    <div
      :id="subId"
      ref="subMenuEl"
      class="j-menu j-menu__sub-content"
      role="menu"
      popover="manual"
      data-side="right"
      data-align="start"
      @toggle="onToggle"
    >
      <slot />
    </div>
  </div>
</template>
