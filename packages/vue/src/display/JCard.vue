<script setup lang="ts">
import { computed, useSlots } from 'vue';
import type { JCardProps } from './types';

const props = withDefaults(defineProps<JCardProps>(), { as: 'div', variant: 'surface', size: 'md' });
const slots = useSlots();

// Headings are not valid inside <button>; fall back to phrasing content there.
const titleTag = computed(() => (props.as === 'button' ? 'span' : 'h3'));
const partTag = computed(() => (props.as === 'button' ? 'span' : 'div'));
const hasHeader = computed(() => !!(props.title || props.description || slots.action));
</script>

<template>
  <component
    :is="as"
    class="j-card"
    :data-variant="variant === 'surface' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-interactive="interactive ? '' : undefined"
  >
    <component :is="partTag" v-if="$slots.media" class="j-card__media"><slot name="media" /></component>
    <slot name="header">
      <component :is="partTag" v-if="hasHeader" class="j-card__header">
        <component :is="titleTag" v-if="title" class="j-card__title">{{ title }}</component>
        <span v-if="description" class="j-card__description">{{ description }}</span>
        <slot name="action" />
      </component>
    </slot>
    <component :is="partTag" v-if="$slots.default" class="j-card__body"><slot /></component>
    <component :is="partTag" v-if="$slots.footer" class="j-card__footer" :data-divider="footerDivider ? '' : undefined">
      <slot name="footer" />
    </component>
  </component>
</template>
