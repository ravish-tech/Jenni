<script setup lang="ts">
import { attr } from './types';

export type JStatusBarVariant = 'subtle' | 'contrast' | 'accent';
export type JStatusBarBorder = 'top' | 'bottom' | 'none';

export interface JStatusBarProps {
  as?: string | object;
  variant?: JStatusBarVariant;
  border?: JStatusBarBorder;
  ariaLabel?: string;
  role?: string;
}

withDefaults(defineProps<JStatusBarProps>(), {
  as: 'div',
  variant: 'subtle',
  border: 'top',
  ariaLabel: 'Status bar',
  role: 'region',
});
</script>

<template>
  <component
    :is="as"
    class="j-statusbar"
    :role="role"
    :aria-label="ariaLabel"
    :data-variant="attr(variant, 'subtle')"
    :data-border="attr(border, 'top')"
  >
    <div
      v-if="$slots.start || $slots.default"
      class="j-statusbar__section"
      data-section="start"
    >
      <slot name="start"><slot /></slot>
    </div>
    <div v-if="$slots.center" class="j-statusbar__section" data-section="center">
      <slot name="center" />
    </div>
    <div v-if="$slots.end" class="j-statusbar__section" data-section="end">
      <slot name="end" />
    </div>
  </component>
</template>
