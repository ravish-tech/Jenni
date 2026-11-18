<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { CAROUSEL_KEY, type JCarouselProps } from './types';

const props = withDefaults(defineProps<JCarouselProps>(), {
  defaultValue: 0,
  slidesPerView: 1,
  loop: false,
  autoplay: false,
  arrows: true,
  dots: true,
  showCounter: true,
  orientation: 'horizontal',
  label: 'Carousel',
});

const model = defineModel<number>();
const internalIndex = ref(props.defaultValue);

const rootEl = ref<HTMLElement | null>(null);
const viewportEl = ref<HTMLElement | null>(null);
const registeredIds = ref<string[]>([]);
const domSlideCount = ref(0);

function registerSlide(id: string): number {
  const existing = registeredIds.value.indexOf(id);
  if (existing >= 0) return existing;
  registeredIds.value = [...registeredIds.value, id];
  return registeredIds.value.length - 1;
}

function unregisterSlide(id: string) {
  registeredIds.value = registeredIds.value.filter((x) => x !== id);
}

const totalSlides = computed(() => Math.max(registeredIds.value.length, domSlideCount.value));

provide(CAROUSEL_KEY, {
  registerSlide,
  unregisterSlide,
  totalSlides: () => totalSlides.value,
});

const perView = computed(() => Math.max(1, Math.floor(Number(props.slidesPerView) || 1)));
const maxIndex = computed(() => Math.max(0, totalSlides.value - perView.value));
const snapCount = computed(() => (totalSlides.value > 0 ? maxIndex.value + 1 : 0));

const currentIndex = computed(() => {
  const raw = model.value ?? internalIndex.value;
  return Math.min(Math.max(0, raw), maxIndex.value);
});

const canPrev = computed(() => (props.loop && maxIndex.value > 0) || currentIndex.value > 0);
const canNext = computed(
  () => (props.loop && maxIndex.value > 0) || currentIndex.value < maxIndex.value,
);

const floatingArrows = computed(() => props.arrows === true || props.arrows === 'floating');
const footerArrows = computed(() => props.arrows === 'footer');

const rootStyle = computed(() => {
  const s: Record<string, string> = {};
  if (perView.value !== 1) s['--j-carousel-per-view'] = String(perView.value);
  if (props.gap != null) {
    s['--j-carousel-gap'] = typeof props.gap === 'number' ? `${props.gap}px` : props.gap;
  }
  if (props.height != null) {
    s['--j-carousel-height'] = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  return Object.keys(s).length ? s : undefined;
});

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
}

let programmaticTarget: number | null = null;
let programmaticTimer: ReturnType<typeof setTimeout> | null = null;

function clearProgrammatic() {
  programmaticTarget = null;
  if (programmaticTimer !== null) {
    clearTimeout(programmaticTimer);
    programmaticTimer = null;
  }
}

function getSlideElements(): HTMLElement[] {
  if (!viewportEl.value) return [];
  return Array.from(viewportEl.value.querySelectorAll<HTMLElement>(':scope > .j-carousel__slide'));
}

function scrollViewportTo(index: number, smooth: boolean) {
  const vp = viewportEl.value;
  const slides = getSlideElements();
  const target = slides[index];
  if (!vp || !target) return;

  const behavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto';
  if (behavior === 'smooth') {
    clearProgrammatic();
    programmaticTarget = index;
    programmaticTimer = setTimeout(clearProgrammatic, 420);
  }

  if (props.orientation === 'vertical') {
    vp.scrollTo({ top: target.offsetTop, behavior });
  } else {
    vp.scrollTo({ left: target.offsetLeft, behavior });
  }
}

let suppressWatchScroll = false;

function goTo(rawIndex: number, smooth = true) {
  const max = maxIndex.value;
  let next = rawIndex;
  if (props.loop && max > 0) {
    if (next < 0) next = max;
    else if (next > max) next = 0;
  } else {
    next = Math.min(Math.max(0, next), max);
  }

  suppressWatchScroll = true;
  internalIndex.value = next;
  model.value = next;
  scrollViewportTo(next, smooth);
  nextTick(() => {
    suppressWatchScroll = false;
  });
}

watch(
  () => model.value,
  (val) => {
    if (suppressWatchScroll || val === undefined) return;
    const clamped = Math.min(Math.max(0, val), maxIndex.value);
    internalIndex.value = clamped;
    scrollViewportTo(clamped, true);
  },
);

let scrollRaf: number | null = null;

function onScroll() {
  if (scrollRaf !== null) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null;
    const vp = viewportEl.value;
    if (!vp) return;
    const slides = getSlideElements();
    if (!slides.length) return;

    const pos = props.orientation === 'vertical' ? vp.scrollTop : vp.scrollLeft;
    const max = maxIndex.value;
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i <= max; i++) {
      const s = slides[i];
      if (!s) continue;
      const offset = props.orientation === 'vertical' ? s.offsetTop : s.offsetLeft;
      const dist = Math.abs(offset - pos);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (programmaticTarget !== null) {
      if (bestIdx === programmaticTarget && bestDist < 4) clearProgrammatic();
      return;
    }

    if (bestIdx !== currentIndex.value) {
      suppressWatchScroll = true;
      internalIndex.value = bestIdx;
      model.value = bestIdx;
      nextTick(() => {
        suppressWatchScroll = false;
      });
    }
  });
}

function onKeydown(event: KeyboardEvent) {
  const vertical = props.orientation === 'vertical';
  const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
  const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';

  if (event.key === prevKey) {
    event.preventDefault();
    goTo(currentIndex.value - 1, true);
  } else if (event.key === nextKey) {
    event.preventDefault();
    goTo(currentIndex.value + 1, true);
  } else if (event.key === 'Home') {
    event.preventDefault();
    goTo(0, true);
  } else if (event.key === 'End') {
    event.preventDefault();
    goTo(maxIndex.value, true);
  }
}

const autoplayInterval = computed(() => {
  if (!props.autoplay) return 0;
  if (props.autoplay === true) return 4500;
  return props.autoplay > 0 ? props.autoplay : 0;
});

let autoplayTimer: ReturnType<typeof setInterval> | null = null;
const isPaused = ref(false);

function stopAutoplay() {
  if (autoplayTimer !== null) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function startAutoplay() {
  stopAutoplay();
  const ms = autoplayInterval.value;
  if (!ms || isPaused.value || prefersReducedMotion()) return;
  autoplayTimer = setInterval(() => {
    if (maxIndex.value <= 0) return;
    const next = currentIndex.value >= maxIndex.value ? 0 : currentIndex.value + 1;
    goTo(next, true);
  }, ms);
}

watch(autoplayInterval, () => startAutoplay());

function pause() {
  isPaused.value = true;
  stopAutoplay();
}

function resume() {
  if (
    rootEl.value &&
    (rootEl.value.matches(':hover') || rootEl.value.contains(document.activeElement))
  ) {
    return;
  }
  isPaused.value = false;
  startAutoplay();
}

let ro: ResizeObserver | null = null;
let roRaf: number | null = null;

onMounted(() => {
  domSlideCount.value = getSlideElements().length;
  if (currentIndex.value > 0) {
    scrollViewportTo(currentIndex.value, false);
  }
  if (viewportEl.value) {
    ro = new ResizeObserver(() => {
      if (roRaf !== null) cancelAnimationFrame(roRaf);
      roRaf = requestAnimationFrame(() => {
        roRaf = null;
        domSlideCount.value = getSlideElements().length;
      });
    });
    ro.observe(viewportEl.value);
  }
  startAutoplay();
});

onBeforeUnmount(() => {
  stopAutoplay();
  clearProgrammatic();
  if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
  if (roRaf !== null) cancelAnimationFrame(roRaf);
  ro?.disconnect();
});
</script>

<template>
  <section
    ref="rootEl"
    class="j-carousel"
    aria-roledescription="carousel"
    data-j-managed=""
    :aria-label="label"
    :data-orientation="orientation === 'horizontal' ? undefined : orientation"
    :data-tone="tone"
    :data-loop="loop ? '' : undefined"
    :style="rootStyle"
    @keydown="onKeydown"
    @pointerenter="pause"
    @pointerleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <div class="j-carousel__stage">
      <div
        ref="viewportEl"
        class="j-carousel__viewport"
        tabindex="0"
        @scroll.passive="onScroll"
        @pointerdown="clearProgrammatic"
        @wheel.passive="clearProgrammatic"
      >
        <slot />
      </div>

      <template v-if="floatingArrows && snapCount > 1">
        <button
          type="button"
          class="j-carousel__prev"
          aria-label="Previous slide"
          :disabled="!canPrev"
          @click="goTo(currentIndex - 1, true)"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="orientation === 'vertical' ? 'M4.25 9.75 8 6l3.75 3.75' : 'M9.75 4.25 6 8l3.75 3.75'" />
          </svg>
        </button>
        <button
          type="button"
          class="j-carousel__next"
          aria-label="Next slide"
          :disabled="!canNext"
          @click="goTo(currentIndex + 1, true)"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="orientation === 'vertical' ? 'M4.25 6.25 8 10l3.75-3.75' : 'M6.25 4.25 10 8l-3.75 3.75'" />
          </svg>
        </button>
      </template>
    </div>

    <div
      v-if="(dots && snapCount > 1) || (showCounter && snapCount > 0) || (footerArrows && snapCount > 1) || $slots.footer"
      class="j-carousel__footer"
    >
      <slot name="footer" :index="currentIndex" :count="snapCount" :go-to="goTo">
        <span v-if="showCounter && snapCount > 0" class="j-carousel__counter" aria-live="polite">
          {{ currentIndex + 1 }} / {{ snapCount }}
        </span>

        <div
          v-if="dots && snapCount > 1"
          class="j-carousel__dots"
          role="tablist"
          aria-label="Choose slide"
        >
          <button
            v-for="n in snapCount"
            :key="n"
            type="button"
            class="j-carousel__dot"
            role="tab"
            :aria-selected="n - 1 === currentIndex ? 'true' : 'false'"
            :aria-label="`Go to slide ${n}`"
            :tabindex="n - 1 === currentIndex ? 0 : -1"
            @click="goTo(n - 1, true)"
          />
        </div>

        <div v-if="footerArrows && snapCount > 1" class="j-carousel__nav">
          <button
            type="button"
            class="j-carousel__prev"
            aria-label="Previous slide"
            :disabled="!canPrev"
            @click="goTo(currentIndex - 1, true)"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9.75 4.25 6 8l3.75 3.75" />
            </svg>
          </button>
          <button
            type="button"
            class="j-carousel__next"
            aria-label="Next slide"
            :disabled="!canNext"
            @click="goTo(currentIndex + 1, true)"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6.25 4.25 10 8l-3.75 3.75" />
            </svg>
          </button>
        </div>
      </slot>
    </div>
  </section>
</template>
