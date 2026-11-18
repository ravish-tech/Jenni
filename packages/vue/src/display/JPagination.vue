<script setup lang="ts">
import { computed, ref } from 'vue';
import type { JPaginationProps } from './types';

const props = withDefaults(defineProps<JPaginationProps>(), {
  pageSize: 10,
  defaultPage: 1,
  siblingCount: 1,
  boundaryCount: 1,
  variant: 'outline',
  size: 'md',
  disabled: false,
  label: 'Pagination',
});

const model = defineModel<number>();
const internalPage = ref(props.defaultPage);

const pageCount = computed(() => {
  if (props.totalPages != null) return Math.max(1, Math.floor(props.totalPages));
  if (props.total != null) return Math.max(1, Math.ceil(props.total / Math.max(1, props.pageSize)));
  return 1;
});

const currentPage = computed(() => {
  const raw = model.value ?? internalPage.value;
  return Math.min(Math.max(1, raw), pageCount.value);
});

const renderLabels = computed(() => props.showLabels ?? props.variant === 'simple');

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

type PageToken = number | 'ellipsis-start' | 'ellipsis-end';

const tokens = computed<PageToken[]>(() => {
  const total = pageCount.value;
  const sibling = Math.max(0, props.siblingCount);
  const boundary = Math.max(0, props.boundaryCount);
  const maxSlots = boundary * 2 + sibling * 2 + 3;

  if (total <= maxSlots) return range(1, total);

  const leftSibling = Math.max(currentPage.value - sibling, boundary + 1);
  const rightSibling = Math.min(currentPage.value + sibling, total - boundary);

  const showLeftDots = leftSibling > boundary + 2;
  const showRightDots = rightSibling < total - boundary - 1;

  const startPages = range(1, boundary);
  const endPages = range(total - boundary + 1, total);

  if (!showLeftDots && showRightDots) {
    const leftCount = boundary + 2 + sibling * 2;
    return [...range(1, leftCount), 'ellipsis-end', ...endPages];
  }
  if (showLeftDots && !showRightDots) {
    const rightCount = boundary + 2 + sibling * 2;
    return [...startPages, 'ellipsis-start', ...range(total - rightCount + 1, total)];
  }
  return [
    ...startPages,
    'ellipsis-start',
    ...range(leftSibling, rightSibling),
    'ellipsis-end',
    ...endPages,
  ];
});

function selectPage(next: number) {
  if (props.disabled) return;
  const clamped = Math.min(Math.max(1, next), pageCount.value);
  if (clamped === currentPage.value) return;
  internalPage.value = clamped;
  model.value = clamped;
}
</script>

<template>
  <nav
    class="j-pagination"
    :aria-label="label"
    :data-variant="variant === 'outline' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-tone="tone"
  >
    <template v-if="variant === 'simple'">
      <button
        type="button"
        class="j-pagination__item j-pagination__prev"
        :disabled="disabled || currentPage <= 1"
        aria-label="Previous page"
        @click="selectPage(currentPage - 1)"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9.75 4.25 6 8l3.75 3.75" />
        </svg>
        <span v-if="renderLabels">Previous</span>
      </button>
      <span class="j-pagination__status" aria-live="polite">
        Page <strong>{{ currentPage }}</strong> of <strong>{{ pageCount }}</strong>
      </span>
      <button
        type="button"
        class="j-pagination__item j-pagination__next"
        :disabled="disabled || currentPage >= pageCount"
        aria-label="Next page"
        @click="selectPage(currentPage + 1)"
      >
        <span v-if="renderLabels">Next</span>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6.25 4.25 10 8l-3.75 3.75" />
        </svg>
      </button>
    </template>

    <ul v-else class="j-pagination__list">
      <li>
        <button
          type="button"
          class="j-pagination__item j-pagination__prev"
          :disabled="disabled || currentPage <= 1"
          aria-label="Previous page"
          @click="selectPage(currentPage - 1)"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9.75 4.25 6 8l3.75 3.75" />
          </svg>
          <span v-if="renderLabels">Previous</span>
        </button>
      </li>

      <li v-for="token in tokens" :key="token">
        <span v-if="typeof token === 'string'" class="j-pagination__ellipsis" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="j-pagination__item"
          :disabled="disabled"
          :aria-current="token === currentPage ? 'page' : undefined"
          :aria-label="`Page ${token}`"
          @click="selectPage(token)"
        >
          {{ token }}
        </button>
      </li>

      <li>
        <button
          type="button"
          class="j-pagination__item j-pagination__next"
          :disabled="disabled || currentPage >= pageCount"
          aria-label="Next page"
          @click="selectPage(currentPage + 1)"
        >
          <span v-if="renderLabels">Next</span>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6.25 4.25 10 8l-3.75 3.75" />
          </svg>
        </button>
      </li>
    </ul>
  </nav>
</template>
