<script setup lang="ts">
import { computed } from 'vue';
import { attr } from './types';

export type JStatusBarVariant = 'subtle' | 'contrast' | 'accent';
export type JStatusBarBorder = 'top' | 'bottom' | 'none';
export type JStatusBarSize = 'sm' | 'md' | 'lg';
export type JStatusBarTextSize = 'xs' | 'sm';

export interface JStatusBarProps {
  as?: string | object;
  variant?: JStatusBarVariant;
  size?: JStatusBarSize;
  height?: number | string;
  textSize?: JStatusBarTextSize;
  mono?: boolean;
  border?: JStatusBarBorder;
  ariaLabel?: string;
  role?: string;
}

const props = withDefaults(defineProps<JStatusBarProps>(), {
  as: 'div',
  variant: 'subtle',
  size: 'md',
  textSize: 'xs',
  mono: false,
  border: 'top',
  ariaLabel: 'Status bar',
  role: 'region',
});

const toPx = (v: string | number) => (typeof v === 'number' ? `${v}px` : v);

const barStyle = computed(() =>
  props.height != null ? { '--j-statusbar-h': toPx(props.height) } : undefined,
);
</script>

<template>
  <component
    :is="as"
    class="j-statusbar"
    :role="role"
    :aria-label="ariaLabel"
    :data-variant="attr(variant, 'subtle')"
    :data-size="attr(size, 'md')"
    :data-text="attr(textSize, 'xs')"
    :data-mono="mono ? '' : undefined"
    :data-border="attr(border, 'top')"
    :style="barStyle"
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
