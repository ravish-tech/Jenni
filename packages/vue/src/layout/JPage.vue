<script setup lang="ts">
import { computed, provide, type ComputedRef, type InjectionKey } from 'vue';
import { attr, type JPageProps } from './types';

const PAGE_STICKY_KEY = Symbol.for('jenni:page-sticky') as InjectionKey<ComputedRef<boolean>>;

const props = withDefaults(defineProps<JPageProps>(), {
  as: 'div',
  size: 'lg',
});

provide(
  PAGE_STICKY_KEY,
  computed(() => Boolean(props.stickyHeader)),
);
</script>

<template>
  <component
    :is="as"
    class="j-page"
    :data-size="attr(size, 'lg')"
    :data-sticky-header="stickyHeader ? '' : undefined"
  >
    <slot />
  </component>
</template>
