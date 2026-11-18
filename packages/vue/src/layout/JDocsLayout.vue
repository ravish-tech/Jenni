<script setup lang="ts">
import { computed } from 'vue';
import { type JDocsLayoutProps } from './types';

const props = withDefaults(defineProps<JDocsLayoutProps>(), {
  as: 'div',
});

const docsStyle = computed(() => {
  if (props.height == null) return undefined;
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return { '--j-docs-h': h };
});
</script>

<template>
  <component
    :is="as"
    class="j-docs-layout"
    :data-embedded="embedded ? '' : undefined"
    :style="docsStyle"
  >
    <aside v-if="$slots.nav" class="j-docs-layout__nav" aria-label="Documentation navigation">
      <div class="j-docs-layout__nav-inner">
        <slot name="nav" />
      </div>
    </aside>

    <article class="j-docs-layout__main">
      <div class="j-docs-layout__prose">
        <slot />
      </div>
    </article>

    <aside v-if="$slots.toc" class="j-docs-layout__toc" aria-label="On this page">
      <div class="j-docs-layout__toc-inner">
        <div v-if="tocTitle" class="j-docs-layout__toc-title">{{ tocTitle }}</div>
        <slot name="toc" />
      </div>
    </aside>
  </component>
</template>
