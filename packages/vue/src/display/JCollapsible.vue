<script setup lang="ts">
import { computed, ref } from 'vue';
import type { JCollapsibleProps } from './types';

const props = withDefaults(defineProps<JCollapsibleProps>(), {
  variant: 'ghost',
  size: 'md',
  defaultOpen: false,
  disabled: false,
});

const model = defineModel<boolean | undefined>({ default: undefined });
const localOpen = ref(props.defaultOpen);
const isOpen = computed(() => (model.value !== undefined ? model.value : localOpen.value));

function onTriggerClick(event: MouseEvent) {
  event.preventDefault();
  if (props.disabled) return;
  const next = !isOpen.value;
  localOpen.value = next;
  model.value = next;
}
</script>

<template>
  <details
    class="j-collapsible"
    :open="isOpen || undefined"
    :data-variant="variant === 'ghost' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-disabled="disabled ? '' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <summary
      class="j-collapsible__trigger"
      :aria-disabled="disabled ? 'true' : undefined"
      :tabindex="disabled ? -1 : undefined"
      @click="onTriggerClick"
    >
      <slot name="icon" />
      <slot name="trigger">
        <span>{{ title }}</span>
      </slot>
    </summary>
    <div class="j-collapsible__content">
      <slot />
    </div>
  </details>
</template>
