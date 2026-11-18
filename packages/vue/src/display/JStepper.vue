<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import JStep from './JStep.vue';
import { STEPPER_KEY, type JStepperProps } from './types';

const props = withDefaults(defineProps<JStepperProps>(), {
  defaultValue: 0,
  orientation: 'horizontal',
  size: 'md',
  clickable: false,
  linear: false,
  label: 'Progress',
});

const model = defineModel<number>();
const internal = ref(props.defaultValue);

const current = computed(() => Math.max(0, model.value ?? internal.value));
const maxReached = ref(current.value);

watch(current, (val) => {
  if (val > maxReached.value) maxReached.value = val;
});

const claimedIds = new Map<string, number>();

function claimIndex(id: string): number {
  const existing = claimedIds.get(id);
  if (existing !== undefined) return existing;
  const idx = claimedIds.size;
  claimedIds.set(id, idx);
  return idx;
}

function releaseIndex(id: string) {
  claimedIds.delete(id);
}

function canSelect(index: number, disabled = false): boolean {
  if (!props.clickable || disabled) return false;
  if (props.linear && index > maxReached.value) return false;
  return true;
}

function selectStep(index: number, disabled = false) {
  if (!canSelect(index, disabled)) return;
  if (index === current.value) return;
  internal.value = index;
  model.value = index;
}

provide(STEPPER_KEY, {
  currentStep: () => current.value,
  clickable: () => props.clickable,
  canSelect,
  selectStep,
  claimIndex,
  releaseIndex,
});

function onKeydown(event: KeyboardEvent) {
  if (!props.clickable) return;
  const active = document.activeElement;
  const root = event.currentTarget as HTMLElement | null;
  if (!(active instanceof HTMLButtonElement) || !root) return;

  const vertical = props.orientation === 'vertical';
  const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
  const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';

  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(':scope > .j-stepper__step > button.j-stepper__trigger:not(:disabled)'),
  );
  const pos = buttons.indexOf(active);
  if (pos < 0) return;

  let target: HTMLButtonElement | undefined;
  if (event.key === nextKey) target = buttons[(pos + 1) % buttons.length];
  else if (event.key === prevKey) target = buttons[(pos - 1 + buttons.length) % buttons.length];
  else if (event.key === 'Home') target = buttons[0];
  else if (event.key === 'End') target = buttons[buttons.length - 1];

  if (target) {
    event.preventDefault();
    target.focus();
  }
}
</script>

<template>
  <ol
    class="j-stepper"
    data-j-managed=""
    :aria-label="label"
    :data-orientation="orientation === 'horizontal' ? undefined : orientation"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
    :data-clickable="clickable ? '' : undefined"
    :data-linear="linear ? '' : undefined"
    @keydown="onKeydown"
  >
    <template v-if="steps && steps.length">
      <JStep
        v-for="(step, idx) in steps"
        :key="idx"
        :index="idx"
        :title="step.title"
        :description="step.description"
        :status="step.status"
        :disabled="step.disabled"
      />
    </template>
    <slot v-else />
  </ol>
</template>
