<script setup lang="ts">
import { computed, inject, onBeforeUnmount, useId } from 'vue';
import { CAROUSEL_KEY, type JCarouselSlideProps } from './types';

const props = defineProps<JCarouselSlideProps>();

const id = useId();
const carousel = inject(CAROUSEL_KEY, null);
const claimedIndex = props.index === undefined && carousel ? carousel.registerSlide(id) : 0;

onBeforeUnmount(() => {
  if (props.index === undefined) carousel?.unregisterSlide(id);
});

const slideIndex = computed(() => props.index ?? claimedIndex);
const ariaLabel = computed(() => {
  if (props.label) return props.label;
  const total = carousel ? carousel.totalSlides() : 0;
  return total > 0 ? `${slideIndex.value + 1} of ${total}` : undefined;
});
</script>

<template>
  <div
    class="j-carousel__slide"
    role="group"
    aria-roledescription="slide"
    :aria-label="ariaLabel"
  >
    <slot />
  </div>
</template>
