<script setup lang="ts">
import { computed } from 'vue';
import type { JListItemProps } from './types';

const props = withDefaults(defineProps<JListItemProps>(), {
  as: 'div',
});

const isButton = computed(() => props.as === 'button');
const ariaCurrent = computed(() => {
  if (props.current === 'page' || props.current === true) return 'page';
  return undefined;
});
</script>

<template>
  <component
    :is="as"
    class="j-list-item"
    :type="isButton ? 'button' : undefined"
    :role="as === 'div' && !interactive && !selected ? 'listitem' : undefined"
    :disabled="isButton && disabled ? true : undefined"
    :aria-disabled="!isButton && disabled ? 'true' : undefined"
    :aria-selected="selected ? 'true' : undefined"
    :aria-current="ariaCurrent"
    :data-lines="lines != null ? String(lines) : undefined"
    :data-interactive="interactive ? '' : undefined"
    :data-tone="tone"
  >
    <span v-if="$slots.leading" class="j-list-item__leading">
      <slot name="leading" />
    </span>
    <span class="j-list-item__body">
      <slot>
        <span v-if="title || $slots.title" class="j-list-item__title">
          <slot name="title">{{ title }}</slot>
        </span>
        <span v-if="description || $slots.description" class="j-list-item__description">
          <slot name="description">{{ description }}</slot>
        </span>
      </slot>
    </span>
    <span v-if="$slots.trailing" class="j-list-item__trailing">
      <slot name="trailing" />
    </span>
  </component>
</template>
