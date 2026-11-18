<script setup lang="ts">
import type { JPageHeaderProps } from './types';

defineProps<JPageHeaderProps>();
</script>

<template>
  <header class="j-page-header" :data-bordered="bordered ? '' : undefined">
    <div v-if="eyebrow || $slots.eyebrow" class="j-page-header__eyebrow">
      <slot name="eyebrow">{{ eyebrow }}</slot>
    </div>
    <div class="j-page-header__main">
      <div class="j-page-header__text">
        <h1 v-if="title || $slots.title" class="j-page-header__title">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="description || $slots.description" class="j-page-header__description">
          <slot name="description">{{ description }}</slot>
        </p>
        <slot />
      </div>
      <div v-if="$slots.actions" class="j-page-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
