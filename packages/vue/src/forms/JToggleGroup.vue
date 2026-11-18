<script setup lang="ts">
import { computed, inject, provide } from 'vue';
import { FieldKey, ToggleGroupKey, type Size, type ToggleVariant, type Tone } from './types';

const model = defineModel<string | null | string[]>();
const props = withDefaults(
  defineProps<{
    type?: 'single' | 'multiple';
    variant?: ToggleVariant;
    size?: Size;
    tone?: Tone;
    attached?: boolean;
    fullWidth?: boolean;
    disallowEmpty?: boolean;
    disabled?: boolean;
  }>(),
  { type: 'single' },
);

const field = inject(FieldKey, null);
const isDisabled = computed(() => !!(props.disabled || field?.disabled.value));

function isPressed(value: string) {
  if (props.type === 'multiple') {
    return Array.isArray(model.value) && model.value.includes(value);
  }
  return model.value === value;
}

function toggle(value: string) {
  if (isDisabled.value) return;
  if (props.type === 'multiple') {
    const cur = Array.isArray(model.value) ? model.value : [];
    if (cur.includes(value)) {
      if (props.disallowEmpty && cur.length <= 1) return;
      model.value = cur.filter((v) => v !== value);
    } else {
      model.value = [...cur, value];
    }
  } else {
    if (model.value === value) {
      if (!props.disallowEmpty) model.value = null;
    } else {
      model.value = value;
    }
  }
}

provide(ToggleGroupKey, {
  isPressed,
  toggle,
  variant: computed(() => props.variant),
  size: computed(() => props.size),
  tone: computed(() => props.tone),
  disabled: isDisabled,
});
</script>

<template>
  <div
    class="j-toggle-group"
    role="group"
    data-j-managed=""
    :data-type="type"
    :data-tone="tone"
    :data-attached="attached ? '' : undefined"
    :data-full-width="fullWidth ? '' : undefined"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-labelledby="field?.labelId.value"
    :aria-describedby="field?.describedBy.value"
  >
    <slot />
  </div>
</template>
