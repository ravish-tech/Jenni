<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue';
import { ButtonGroupKey, sizeAttr, type ButtonVariant, type Size, type Tone } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: Size;
    tone?: Tone;
    loading?: boolean;
    disabled?: boolean;
    iconOnly?: boolean;
    fullWidth?: boolean;
    /** Marks this button as the dialog's primary default Enter action (`data-default-action`). */
    default?: boolean;
    type?: 'button' | 'submit' | 'reset';
    /** Render as another element, e.g. "a" or a RouterLink component. */
    as?: string | object;
  }>(),
  { type: 'button', as: 'button' },
);

const attrs = useAttrs();
const group = inject(ButtonGroupKey, null);
const isNative = computed(() => props.as === 'button');
const variant = computed(() => props.variant ?? group?.variant.value);
const size = computed(() => props.size ?? group?.size.value);
const tone = computed(() => props.tone ?? group?.tone.value);
const blocked = computed(() => props.disabled || props.loading);

const passthrough = computed(() => {
  const { onClick: _ignored, ...rest } = attrs;
  return rest;
});

type ClickHandler = (e: MouseEvent) => void;
function onClick(e: MouseEvent) {
  if (blocked.value) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return;
  }
  const handler = attrs.onClick as ClickHandler | ClickHandler[] | undefined;
  if (Array.isArray(handler)) handler.forEach((h) => h(e));
  else handler?.(e);
}
</script>

<template>
  <component
    :is="as"
    class="j-button"
    :type="isNative ? type : undefined"
    :disabled="isNative ? disabled || undefined : undefined"
    :aria-disabled="!isNative && disabled ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :data-variant="variant && variant !== 'solid' ? variant : undefined"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :data-loading="loading || undefined"
    :data-icon-only="iconOnly || undefined"
    :data-full-width="fullWidth || undefined"
    :data-default-action="props.default ? '' : undefined"
    v-bind="passthrough"
    @click="onClick"
  >
    <slot />
  </component>
</template>
