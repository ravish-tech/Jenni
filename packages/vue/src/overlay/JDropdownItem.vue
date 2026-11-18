<script setup lang="ts">
// JDropdownItem — action, checkbox or radio item inside JDropdownMenu.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { MenuItemRole, MenuItemTone } from './types';

const checked = defineModel<boolean>('checked', { default: false });

const props = withDefaults(
  defineProps<{
    as?: 'button' | 'a';
    href?: string;
    role?: MenuItemRole;
    shortcut?: string;
    tone?: MenuItemTone;
    inset?: boolean;
    disabled?: boolean;
    keepOpen?: boolean;
    closeOnSelect?: boolean;
    textValue?: string;
  }>(),
  { role: 'menuitem' },
);

const emit = defineEmits<{ select: [event: CustomEvent] }>();
defineSlots<{ default?(): unknown; icon?(): unknown; shortcut?(): unknown }>();

const el = ref<HTMLElement | null>(null);
const tag = computed(() => props.as ?? (props.href ? 'a' : 'button'));

function onSelect(e: Event) {
  if (props.disabled) {
    e.preventDefault();
    return;
  }
  if (props.role === 'menuitemcheckbox') {
    checked.value = !checked.value;
  } else if (props.role === 'menuitemradio' && !checked.value) {
    checked.value = true;
  }
  emit('select', e as CustomEvent);
}

onMounted(() => el.value?.addEventListener('j-select', onSelect));
onBeforeUnmount(() => el.value?.removeEventListener('j-select', onSelect));
</script>

<template>
  <component
    :is="tag"
    ref="el"
    class="j-menu__item"
    :type="tag === 'button' ? 'button' : undefined"
    :href="href"
    :role="role"
    :aria-checked="role === 'menuitem' ? undefined : checked ? 'true' : 'false'"
    :disabled="tag === 'button' && disabled ? true : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :data-tone="tone"
    :data-inset="inset ? '' : undefined"
    :data-keep-open="keepOpen ? '' : undefined"
    :data-close="closeOnSelect ? '' : undefined"
    :data-text-value="textValue"
  >
    <slot name="icon" />
    <slot />
    <kbd v-if="shortcut || $slots.shortcut" class="j-menu__shortcut">
      <slot name="shortcut">{{ shortcut }}</slot>
    </kbd>
  </component>
</template>
