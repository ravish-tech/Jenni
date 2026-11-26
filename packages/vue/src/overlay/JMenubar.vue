<script setup lang="ts">
// JMenubar — WAI-ARIA role="menubar" horizontal application menu bar.
import { onBeforeUnmount, onMounted, provide, ref, watch, type InjectionKey } from 'vue';
import { createMenubar, type MenubarController } from 'jenni-core/behaviors/menubar.js';

export type MenubarSize = 'sm' | 'md';
export type MenubarVariant = 'plain' | 'surface' | 'bordered';

export interface JMenubarProps {
  size?: MenubarSize;
  variant?: MenubarVariant;
  loop?: boolean;
  ariaLabel?: string;
}

export interface JMenubarHandle {
  open: (index: number) => void;
  close: (restoreFocus?: boolean) => void;
  refresh: () => void;
}

interface MenubarProvideContext {
  openForTrigger: (trigger: HTMLElement | null) => void;
  closeForTrigger: (trigger: HTMLElement | null) => void;
}

const MENUBAR_KEY = Symbol.for('jenni:menubar') as InjectionKey<MenubarProvideContext>;

const props = withDefaults(defineProps<JMenubarProps>(), {
  size: 'md',
  variant: 'bordered',
  loop: true,
  ariaLabel: 'Menu bar',
});

const emit = defineEmits<{
  select: [event: CustomEvent];
}>();

const el = ref<HTMLDivElement | null>(null);
let controller: MenubarController | null = null;

function onSelect(e: Event) {
  emit('select', e as CustomEvent);
}

function getTriggerIndex(trigger: HTMLElement | null): number {
  if (!trigger || !el.value) return -1;
  const triggers = [...el.value.querySelectorAll('.j-menubar__trigger')];
  return triggers.indexOf(trigger);
}

function openForTrigger(trigger: HTMLElement | null) {
  if (!controller) return;
  controller.refresh();
  const idx = getTriggerIndex(trigger);
  if (idx !== -1 && controller.getActiveIndex() !== idx) {
    controller.open(idx, null);
  }
}

function closeForTrigger(trigger: HTMLElement | null) {
  if (!controller) return;
  const idx = getTriggerIndex(trigger);
  if (idx !== -1 && controller.getActiveIndex() === idx) {
    controller.close(false);
  }
}

function setup() {
  controller?.destroy();
  controller = null;
  if (el.value) {
    controller = createMenubar(el.value, {
      loop: props.loop,
      manageChecked: false,
    });
  }
}

function open(index: number) {
  controller?.refresh();
  controller?.open(index, null);
}

function close(restoreFocus = false) {
  controller?.close(restoreFocus);
}

function refresh() {
  controller?.refresh();
}

provide(MENUBAR_KEY, {
  openForTrigger,
  closeForTrigger,
});

onMounted(() => {
  setup();
  el.value?.addEventListener('j-select', onSelect);
});

watch(() => props.loop, setup);

onBeforeUnmount(() => {
  el.value?.removeEventListener('j-select', onSelect);
  controller?.destroy();
  controller = null;
});

defineExpose<JMenubarHandle>({ open, close, refresh });
</script>

<template>
  <div
    ref="el"
    class="j-menubar"
    role="menubar"
    :aria-label="ariaLabel"
    :data-size="size === 'md' ? undefined : size"
    :data-variant="variant === 'bordered' ? undefined : variant"
  >
    <slot />
  </div>
</template>
