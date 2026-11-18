<script setup lang="ts">
import { computed, inject } from 'vue';
import { sizeAttr, ToggleGroupKey, type Size, type ToggleVariant, type Tone } from './types';

const model = defineModel<boolean>({ default: false });
const props = defineProps<{
  value?: string;
  variant?: ToggleVariant;
  size?: Size;
  tone?: Tone;
  iconOnly?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}>();

const group = inject(ToggleGroupKey, null);
const inGroup = computed(() => !!(group && props.value !== undefined));
const pressed = computed(() => (inGroup.value ? group!.isPressed(props.value!) : model.value));
const isDisabled = computed(() => !!(props.disabled || group?.disabled.value));

function onClick() {
  if (isDisabled.value) return;
  if (inGroup.value) group!.toggle(props.value!);
  else model.value = !model.value;
}
</script>

<template>
  <button
    type="button"
    class="j-toggle"
    data-j-managed=""
    :data-value="value"
    :data-variant="variant ?? group?.variant.value"
    :data-size="sizeAttr(size ?? group?.size.value)"
    :data-tone="tone ?? group?.tone.value"
    :data-icon-only="iconOnly ? '' : undefined"
    :data-full-width="fullWidth ? '' : undefined"
    :aria-pressed="pressed ? 'true' : 'false'"
    :disabled="isDisabled || undefined"
    @click="onClick"
  >
    <slot />
  </button>
</template>
