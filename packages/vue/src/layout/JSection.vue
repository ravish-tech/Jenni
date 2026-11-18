<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { attr, type JSectionProps } from './types';

const props = withDefaults(defineProps<JSectionProps>(), {
  as: 'section',
  layout: 'stack',
});
const slots = useSlots();
const hasHeader = computed(
  () => !!(props.title || props.description || slots.title || slots.description || slots.actions || slots.header),
);
</script>

<template>
  <component
    :is="as"
    class="j-section"
    :data-layout="attr(layout, 'stack')"
    :data-bordered="bordered ? '' : undefined"
  >
    <slot name="header">
      <header v-if="hasHeader" class="j-section__header">
        <div class="j-section__heading">
          <h2 v-if="title || $slots.title" class="j-section__title">
            <slot name="title">{{ title }}</slot>
          </h2>
          <p v-if="description || $slots.description" class="j-section__description">
            <slot name="description">{{ description }}</slot>
          </p>
        </div>
        <div v-if="$slots.actions" class="j-section__actions">
          <slot name="actions" />
        </div>
      </header>
    </slot>
    <div class="j-section__body">
      <slot />
    </div>
  </component>
</template>
