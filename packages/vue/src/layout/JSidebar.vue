<script setup lang="ts">
import type { JSidebarProps } from './types';

withDefaults(defineProps<JSidebarProps>(), {
  as: 'div',
  ariaLabel: 'Primary navigation',
});

const collapsed = defineModel<boolean>('collapsed', { default: false });
</script>

<template>
  <component
    :is="as"
    class="j-sidebar"
    :aria-label="as === 'nav' ? ariaLabel : undefined"
    :data-collapsed="collapsed ? '' : undefined"
    :data-tone="tone"
  >
    <div v-if="$slots.header" class="j-sidebar__header">
      <slot name="header" :collapsed="collapsed" :toggle="() => (collapsed = !collapsed)" />
    </div>
    <component
      :is="as === 'nav' ? 'div' : 'nav'"
      class="j-sidebar__body"
      :aria-label="as === 'nav' ? undefined : ariaLabel"
    >
      <slot :collapsed="collapsed" />
    </component>
    <div v-if="$slots.footer" class="j-sidebar__footer">
      <slot name="footer" :collapsed="collapsed" />
    </div>
  </component>
</template>
