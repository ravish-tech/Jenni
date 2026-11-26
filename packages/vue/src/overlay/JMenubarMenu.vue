<script setup lang="ts">
// JMenubarMenu — top-level menu item + anchored .j-menu panel inside JMenubar.
import {
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
  type InjectionKey,
} from 'vue';

defineOptions({ inheritAttrs: false });

export interface JMenubarMenuProps {
  label: string;
  disabled?: boolean;
}

interface MenubarProvideContext {
  openForTrigger: (trigger: HTMLElement | null) => void;
  closeForTrigger: (trigger: HTMLElement | null) => void;
}

const MENUBAR_KEY = Symbol.for('jenni:menubar') as InjectionKey<MenubarProvideContext>;

defineProps<JMenubarMenuProps>();

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{
  select: [event: CustomEvent];
}>();

defineSlots<{
  default?(props: { close: () => void }): unknown;
  trigger?(): unknown;
}>();

const menubarCtx = inject(MENUBAR_KEY, null);
const menuId = useId();
const triggerEl = ref<HTMLButtonElement | null>(null);
const menuEl = ref<HTMLDivElement | null>(null);

function isMenuPopoverOpen(): boolean {
  if (!menuEl.value) return false;
  try {
    return menuEl.value.matches(':popover-open');
  } catch {
    return menuEl.value.hasAttribute('data-open');
  }
}

function show() {
  if (menubarCtx && triggerEl.value) {
    menubarCtx.openForTrigger(triggerEl.value);
    return;
  }
  if (menuEl.value && !isMenuPopoverOpen()) {
    try {
      menuEl.value.showPopover();
    } catch {
      /* ignore */
    }
  }
}

function hide() {
  if (menubarCtx && triggerEl.value) {
    menubarCtx.closeForTrigger(triggerEl.value);
  }
  if (menuEl.value && isMenuPopoverOpen()) {
    try {
      menuEl.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
  open.value = false;
}

function onToggle(e: Event) {
  if (e.target !== menuEl.value) return;
  open.value = (e as ToggleEvent).newState === 'open';
}

function onSelect(e: Event) {
  emit('select', e as CustomEvent);
}

watch(open, (next) => {
  if (next) {
    if (!isMenuPopoverOpen()) show();
  } else if (isMenuPopoverOpen()) {
    hide();
  }
});

onMounted(() => {
  menuEl.value?.addEventListener('j-select', onSelect);
  if (open.value) {
    nextTick(() => {
      if (open.value && !isMenuPopoverOpen()) show();
    });
  }
});

onBeforeUnmount(() => {
  menuEl.value?.removeEventListener('j-select', onSelect);
});

defineExpose({ show, hide });
</script>

<template>
  <div class="j-menubar__menu" role="none">
    <button
      ref="triggerEl"
      type="button"
      class="j-menubar__trigger"
      role="menuitem"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="menuId"
      :disabled="disabled || undefined"
      :aria-disabled="disabled ? 'true' : undefined"
    >
      <slot name="trigger">{{ label }}</slot>
    </button>
    <div
      :id="menuId"
      ref="menuEl"
      class="j-menu j-menubar__content"
      role="menu"
      popover="manual"
      data-side="bottom"
      data-align="start"
      v-bind="$attrs"
      @toggle="onToggle"
    >
      <slot :close="hide" />
    </div>
  </div>
</template>
