<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { ACCORDION_KEY, type JAccordionProps } from './types';

const props = withDefaults(defineProps<JAccordionProps>(), {
  variant: 'divided',
  size: 'md',
  multiple: false,
  collapsible: true,
});

const model = defineModel<string | string[]>();

function toArray(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  return val ? [val] : [];
}

const internal = ref<string[]>(toArray(props.defaultValue));
const openSet = computed(() => new Set(model.value !== undefined ? toArray(model.value) : internal.value));

function toggle(value: string) {
  const current = Array.from(openSet.value);
  const active = openSet.value.has(value);

  if (props.multiple) {
    const next = active ? current.filter((v) => v !== value) : [...current, value];
    internal.value = next;
    model.value = next;
  } else {
    if (active && !props.collapsible) return;
    const next = active ? '' : value;
    internal.value = next ? [next] : [];
    model.value = next;
  }
}

function registerDefault(value: string) {
  if (model.value !== undefined || internal.value.includes(value)) return;
  if (!props.multiple && internal.value.length > 0) return;
  internal.value = [...internal.value, value];
}

provide(ACCORDION_KEY, {
  isOpen: (value: string) => openSet.value.has(value),
  toggle,
  registerDefault,
});
</script>

<template>
  <div
    class="j-accordion"
    :data-variant="variant === 'divided' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
  >
    <slot />
  </div>
</template>
