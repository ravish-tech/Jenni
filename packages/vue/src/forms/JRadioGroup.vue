<script setup lang="ts">
import { computed, inject, provide, useId } from 'vue';
import { FieldKey, RadioGroupKey, type Orientation, type Size, type Tone } from './types';

const model = defineModel<string | number>();
const props = defineProps<{
  name?: string;
  orientation?: Orientation;
  size?: Size;
  tone?: Tone;
  disabled?: boolean;
  invalid?: boolean;
}>();

const autoName = useId();
const field = inject(FieldKey, null);

provide(RadioGroupKey, {
  model,
  name: computed(() => props.name ?? `j-radio-${autoName}`),
  size: computed(() => props.size),
  tone: computed(() => props.tone),
  disabled: computed(() => props.disabled || !!field?.disabled.value),
  invalid: computed(() => props.invalid || !!field?.invalid.value),
});
</script>

<template>
  <div
    class="j-radio-group"
    role="radiogroup"
    :data-orientation="orientation === 'horizontal' ? 'horizontal' : undefined"
    :aria-labelledby="field?.labelId.value"
    :aria-describedby="field?.describedBy.value"
    :aria-invalid="invalid || field?.invalid.value ? 'true' : undefined"
    :aria-required="field?.required.value ? 'true' : undefined"
  >
    <slot />
  </div>
</template>
