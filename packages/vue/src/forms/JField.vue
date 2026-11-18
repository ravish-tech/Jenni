<script setup lang="ts">
import { computed, provide, useId, useSlots } from 'vue';
import { FieldKey } from './types';

const props = defineProps<{
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** id for the control; auto-generated when omitted. */
  id?: string;
}>();
defineSlots<{
  default?(props: { id: string; describedBy: string | undefined; invalid: boolean }): unknown;
  label?(): unknown;
  hint?(): unknown;
  error?(): unknown;
}>();

const slots = useSlots();
const autoId = useId();
const id = computed(() => props.id ?? `j-field-${autoId}`);
const labelId = computed(() => `${id.value}-label`);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);
const hasHint = computed(() => !!(props.hint || slots.hint));
const hasError = computed(() => !!(props.error || slots.error));
const invalid = computed(() => props.invalid || hasError.value);
const describedBy = computed(
  () => [hasHint.value && hintId.value, hasError.value && errorId.value].filter(Boolean).join(' ') || undefined,
);

provide(FieldKey, {
  id,
  labelId,
  describedBy,
  invalid,
  disabled: computed(() => props.disabled),
  required: computed(() => props.required),
});
</script>

<template>
  <div class="j-field">
    <label v-if="label || $slots.label" :id="labelId" class="j-label" :for="id" :data-required="required || undefined">
      <slot name="label">{{ label }}</slot>
    </label>
    <slot :id="id" :described-by="describedBy" :invalid="invalid" />
    <p v-if="hasHint" :id="hintId" class="j-field__hint"><slot name="hint">{{ hint }}</slot></p>
    <p v-if="hasError" :id="errorId" class="j-field__error" aria-live="polite"><slot name="error">{{ error }}</slot></p>
  </div>
</template>
