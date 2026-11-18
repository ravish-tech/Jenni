<script setup lang="ts">
import { computed, inject, onBeforeUnmount, useId } from 'vue';
import { STEPPER_KEY, type JStepProps, type JStepStatus } from './types';

const props = withDefaults(defineProps<JStepProps>(), {
  disabled: false,
});

const id = useId();
const stepper = inject(STEPPER_KEY, null);
const claimed = props.index === undefined && stepper ? stepper.claimIndex(id) : 0;

onBeforeUnmount(() => {
  if (props.index === undefined) stepper?.releaseIndex(id);
});

const stepIndex = computed(() => props.index ?? claimed);

const resolvedStatus = computed<JStepStatus>(() => {
  if (props.status) return props.status;
  const cur = stepper ? stepper.currentStep() : 0;
  if (stepIndex.value < cur) return 'complete';
  if (stepIndex.value === cur) return 'current';
  return 'upcoming';
});

const isClickable = computed(() => Boolean(stepper?.clickable()));
const isLocked = computed(() =>
  isClickable.value ? !stepper?.canSelect(stepIndex.value, props.disabled) : props.disabled,
);

function handleClick() {
  if (!isClickable.value || isLocked.value) return;
  stepper?.selectStep(stepIndex.value, props.disabled);
}
</script>

<template>
  <li
    class="j-stepper__step"
    :data-status="resolvedStatus"
    :aria-current="resolvedStatus === 'current' ? 'step' : undefined"
  >
    <component
      :is="isClickable ? 'button' : 'div'"
      :type="isClickable ? 'button' : undefined"
      class="j-stepper__trigger"
      :disabled="isClickable && isLocked ? true : undefined"
      :aria-disabled="!isClickable && disabled ? 'true' : undefined"
      @click="isClickable ? handleClick() : undefined"
    >
      <span class="j-stepper__indicator" aria-hidden="true">
        <slot name="icon">
          <svg
            v-if="resolvedStatus === 'complete'"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3.5 8.25 6.5 11.25 12.5 5" />
          </svg>
          <svg
            v-else-if="resolvedStatus === 'error'"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 4.5v4M8 11.5h.01" />
          </svg>
          <template v-else>{{ stepIndex + 1 }}</template>
        </slot>
      </span>
      <span v-if="title || description || $slots.default || $slots.description" class="j-stepper__body">
        <span v-if="title || $slots.default" class="j-stepper__title">
          <slot>{{ title }}</slot>
        </span>
        <span v-if="description || $slots.description" class="j-stepper__description">
          <slot name="description">{{ description }}</slot>
        </span>
      </span>
    </component>
    <div class="j-stepper__connector" aria-hidden="true">
      <span class="j-stepper__connector-fill" />
    </div>
  </li>
</template>
