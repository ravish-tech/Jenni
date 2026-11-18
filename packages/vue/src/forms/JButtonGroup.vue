<script setup lang="ts">
import { computed, provide } from 'vue';
import { ButtonGroupKey, type ButtonVariant, type Size, type Tone } from './types';

const props = defineProps<{
  variant?: ButtonVariant;
  size?: Size;
  tone?: Tone;
  fullWidth?: boolean;
}>();

provide(ButtonGroupKey, {
  variant: computed(() => props.variant),
  size: computed(() => props.size),
  tone: computed(() => props.tone),
});
</script>

<template>
  <div class="j-button-group" role="group" :data-full-width="fullWidth || undefined">
    <slot />
  </div>
</template>
