<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
} from 'vue';
import type { JPageHeaderProps } from './types';

defineOptions({ inheritAttrs: false });

const PAGE_STICKY_KEY = Symbol.for('jenni:page-sticky') as InjectionKey<ComputedRef<boolean>>;

const props = withDefaults(defineProps<JPageHeaderProps>(), {
  sticky: undefined,
});

const inheritedSticky = inject(PAGE_STICKY_KEY, null);
const isSticky = computed(() =>
  props.sticky !== undefined ? Boolean(props.sticky) : Boolean(inheritedSticky?.value),
);

const sentinelRef = ref<HTMLElement | null>(null);
const isStuck = ref(false);
let observer: IntersectionObserver | null = null;

function findNearestScrollParent(el: HTMLElement | null): Element | null {
  if (!el || typeof window === 'undefined') return null;
  let cur: HTMLElement | null = el.parentElement;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(cur);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

function disconnectObserver() {
  observer?.disconnect();
  observer = null;
}

function setupObserver() {
  disconnectObserver();
  if (!isSticky.value) {
    isStuck.value = false;
    return;
  }
  const sentinel = sentinelRef.value;
  if (!sentinel || typeof IntersectionObserver === 'undefined') return;

  const scrollRoot = findNearestScrollParent(sentinel);
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      const rootTop =
        entry.rootBounds?.top ?? (scrollRoot ? scrollRoot.getBoundingClientRect().top : 0);
      isStuck.value =
        entry.intersectionRatio === 0 && entry.boundingClientRect.top <= rootTop + 2;
    },
    { threshold: 0, root: scrollRoot },
  );
  observer.observe(sentinel);
}

onMounted(() => {
  setupObserver();
});

watch(
  [isSticky, sentinelRef],
  () => {
    nextTick(setupObserver);
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  disconnectObserver();
});
</script>

<template>
  <div
    v-if="isSticky"
    ref="sentinelRef"
    class="j-page-header__sentinel"
    aria-hidden="true"
  />
  <header
    v-bind="$attrs"
    class="j-page-header"
    :data-bordered="bordered ? '' : undefined"
    :data-sticky="isSticky ? '' : undefined"
    :data-stuck="isSticky && isStuck ? '' : undefined"
  >
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
