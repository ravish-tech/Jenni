<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';
import { createMenu } from 'jenni-core/behaviors/menu.js';
import type { FloatingAlign, FloatingSide } from '../overlay/types';
import { sizeAttr, type Size, type Tone } from './types';

export type SplitButtonVariant = 'solid' | 'soft' | 'outline';

export interface JSplitButtonProps {
  label?: string;
  /** Visual style (`'solid' | 'soft' | 'outline'`, default `'solid'`). */
  variant?: SplitButtonVariant;
  size?: Size;
  tone?: Tone;
  disabled?: boolean;
  loading?: boolean;
  menuDisabled?: boolean;
  menuLabel?: string;
  side?: FloatingSide;
  align?: FloatingAlign;
  type?: 'button' | 'submit' | 'reset';
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<JSplitButtonProps>(), {
  variant: 'solid',
  size: 'md',
  menuLabel: 'More actions',
  side: 'bottom',
  align: 'end',
  type: 'button',
});

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{
  click: [event: MouseEvent];
  select: [event: CustomEvent];
}>();

defineSlots<{
  default?(props: { close: () => void }): unknown;
  menu?(props: { close: () => void }): unknown;
}>();

const slots = useSlots();
const menuId = useId();
const rootEl = ref<HTMLDivElement | null>(null);
const primaryEl = ref<HTMLButtonElement | null>(null);
const triggerEl = ref<HTMLButtonElement | null>(null);
const menuEl = ref<HTMLDivElement | null>(null);
let cleanup: (() => void) | null = null;

const hasExplicitMenuSlot = computed(() => Boolean(slots.menu));
const defaultSlotIsMenu = computed(
  () => !hasExplicitMenuSlot.value && props.label !== undefined && Boolean(slots.default),
);
const buttonVariantAttr = computed(() =>
  props.variant && props.variant !== 'solid' ? props.variant : undefined,
);
const triggerBlocked = computed(() => Boolean(props.disabled || props.menuDisabled));

const isOpen = () => Boolean(menuEl.value?.matches(':popover-open'));

function show() {
  if (triggerBlocked.value) return;
  if (menuEl.value && !isOpen()) {
    try {
      menuEl.value.showPopover();
    } catch {
      /* ignore */
    }
  }
}

function hide() {
  if (menuEl.value && isOpen()) {
    try {
      menuEl.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
}

function onPrimaryClick(e: MouseEvent) {
  if (props.disabled || props.loading) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return;
  }
  emit('click', e);
}

function onToggle(e: Event) {
  if (e.target !== menuEl.value) return;
  open.value = (e as ToggleEvent).newState === 'open';
}

function onSelect(e: Event) {
  emit('select', e as CustomEvent);
}

function setup() {
  cleanup?.();
  cleanup = null;
  if (triggerEl.value && menuEl.value) {
    cleanup = createMenu(triggerEl.value, menuEl.value, {
      side: props.side,
      loop: true,
      manageChecked: false,
      anchor: rootEl.value,
    });
  }
}

onMounted(() => {
  setup();
  menuEl.value?.addEventListener('j-select', onSelect);
  if (open.value) show();
});

watch(() => props.side, setup);
watch(open, (v) => (v ? show() : hide()));
watch(triggerBlocked, (blocked) => {
  if (blocked) hide();
});

onBeforeUnmount(() => {
  menuEl.value?.removeEventListener('j-select', onSelect);
  cleanup?.();
  cleanup = null;
});

defineExpose({ show, hide, primary: primaryEl, trigger: triggerEl });
</script>

<template>
  <div
    ref="rootEl"
    class="j-split-button"
    :data-variant="variant"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    v-bind="$attrs"
  >
    <button
      ref="primaryEl"
      :type="type"
      class="j-button j-split-button__primary"
      :disabled="disabled || undefined"
      :aria-busy="loading ? 'true' : undefined"
      :data-variant="buttonVariantAttr"
      :data-size="sizeAttr(size)"
      :data-tone="tone"
      :data-loading="loading || undefined"
      @click="onPrimaryClick"
    >
      <template v-if="defaultSlotIsMenu">{{ label }}</template>
      <slot v-else :close="hide">{{ label }}</slot>
    </button>

    <button
      ref="triggerEl"
      type="button"
      class="j-button j-split-button__trigger"
      :aria-label="menuLabel"
      :disabled="triggerBlocked || undefined"
      :data-variant="buttonVariantAttr"
      :data-size="sizeAttr(size)"
      :data-tone="tone"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
      </svg>
    </button>

    <div
      :id="menuId"
      ref="menuEl"
      class="j-menu"
      popover="auto"
      role="menu"
      :data-side="side"
      :data-align="align === 'center' ? undefined : align"
      @toggle="onToggle"
    >
      <slot v-if="hasExplicitMenuSlot" name="menu" :close="hide" />
      <slot v-else-if="defaultSlotIsMenu" :close="hide" />
    </div>
  </div>
</template>
