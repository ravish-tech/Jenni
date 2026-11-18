<script setup lang="ts">
import { computed, inject, ref, useId } from 'vue';
import { ACCORDION_KEY, type JAccordionItemProps } from './types';

const props = withDefaults(defineProps<JAccordionItemProps>(), {
  defaultOpen: false,
  disabled: false,
});

const model = defineModel<boolean | undefined>('open', { default: undefined });
const autoId = useId();
const itemKey = computed(() => props.value ?? autoId);

const group = inject(ACCORDION_KEY, null);
if (props.defaultOpen && group) {
  group.registerDefault(itemKey.value);
}

const localOpen = ref(props.defaultOpen);

const isOpen = computed(() => {
  if (model.value !== undefined) return model.value;
  if (group) return group.isOpen(itemKey.value);
  return localOpen.value;
});

function onTriggerClick(event: MouseEvent) {
  event.preventDefault();
  if (props.disabled) return;
  if (model.value !== undefined) {
    model.value = !model.value;
  } else if (group) {
    group.toggle(itemKey.value);
  } else {
    localOpen.value = !localOpen.value;
  }
}
</script>

<template>
  <details
    class="j-accordion__item"
    :open="isOpen || undefined"
    :data-disabled="disabled ? '' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <summary
      class="j-accordion__trigger"
      :aria-disabled="disabled ? 'true' : undefined"
      :tabindex="disabled ? -1 : undefined"
      @click="onTriggerClick"
    >
      <slot name="icon" />
      <span class="j-accordion__title">
        <slot name="title">{{ title }}</slot>
      </span>
      <span v-if="subtitle || $slots.subtitle" class="j-accordion__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </span>
      <span v-if="$slots.indicator" class="j-accordion__indicator" aria-hidden="true">
        <slot name="indicator" />
      </span>
    </summary>
    <div class="j-accordion__content">
      <slot />
    </div>
  </details>
</template>
