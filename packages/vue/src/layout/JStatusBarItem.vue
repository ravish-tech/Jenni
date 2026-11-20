<script setup lang="ts">
import { computed } from 'vue';
import JIcon from '../display/JIcon.vue';
import type { JLayoutTone } from './types';

export interface JStatusBarItemProps {
  as?: string | object;
  icon?: string;
  dot?: boolean;
  tone?: JLayoutTone;
  interactive?: boolean;
  href?: string;
  title?: string;
  disabled?: boolean;
}

const props = defineProps<JStatusBarItemProps>();

const tag = computed(() => {
  if (props.as) return props.as;
  if (props.href) return 'a';
  if (props.interactive) return 'button';
  return 'span';
});

const isButton = computed(() => tag.value === 'button');
</script>

<template>
  <component
    :is="tag"
    class="j-statusbar__item"
    :type="isButton ? 'button' : undefined"
    :href="href"
    :title="title"
    :disabled="isButton && disabled ? true : undefined"
    :aria-disabled="!isButton && disabled ? 'true' : undefined"
    :data-tone="tone"
    :data-interactive="interactive && !isButton && !href ? '' : undefined"
  >
    <span v-if="dot" class="j-statusbar__dot" aria-hidden="true" />
    <slot name="icon">
      <JIcon v-if="icon" :name="icon" size="xs" />
    </slot>
    <slot />
  </component>
</template>
