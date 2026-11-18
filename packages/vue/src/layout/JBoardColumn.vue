<script setup lang="ts">
import { type JBoardColumnProps } from './types';

withDefaults(defineProps<JBoardColumnProps>(), {
  as: 'section',
});
</script>

<template>
  <component :is="as" class="j-board__column" :data-tone="tone">
    <header v-if="title != null || count != null || $slots.header || $slots.actions" class="j-board__header">
      <slot name="header">
        <div class="j-board__heading">
          <span v-if="dot" class="j-board__dot" aria-hidden="true" />
          <span v-if="title != null" class="j-board__title">{{ title }}</span>
          <span v-if="count != null" class="j-board__count">{{ count }}</span>
        </div>
        <div v-if="$slots.actions" class="j-board__actions">
          <slot name="actions" />
        </div>
      </slot>
    </header>

    <div class="j-board__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="j-board__footer">
      <slot name="footer" />
    </footer>
  </component>
</template>
