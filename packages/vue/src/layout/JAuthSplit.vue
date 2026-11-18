<script setup lang="ts">
import { computed } from 'vue';
import { type JAuthSplitProps } from './types';

const props = withDefaults(defineProps<JAuthSplitProps>(), {
  as: 'div',
});

const authStyle = computed(() => {
  if (props.height == null) return undefined;
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return { '--j-auth-h': h };
});
</script>

<template>
  <component
    :is="as"
    class="j-auth-split"
    :data-reverse="reverse ? '' : undefined"
    :data-stack-showcase="stackShowcase ? '' : undefined"
    :data-embedded="embedded ? '' : undefined"
    :style="authStyle"
  >
    <div class="j-auth-split__form">
      <header v-if="$slots.header" class="j-auth-split__header">
        <slot name="header" />
      </header>
      <div class="j-auth-split__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="j-auth-split__footer">
        <slot name="footer" />
      </footer>
    </div>

    <aside v-if="$slots.showcase" class="j-auth-split__showcase">
      <slot name="showcase" />
    </aside>
  </component>
</template>
