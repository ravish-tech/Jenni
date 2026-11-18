// Jenni — Carousel behavior (scroll-snap sync, prev/next, pill dots, keyboard, loop, autoplay).

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Wire one `.j-carousel` root for plain-HTML usage. Skips `[data-j-managed]`.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function createCarousel(root) {
  if (root.hasAttribute('data-j-managed')) return () => {};

  const viewport = /** @type {HTMLElement | null} */ (
    [...root.querySelectorAll('.j-carousel__viewport')].find((v) => v.closest('.j-carousel') === root) ?? null
  );
  if (!viewport) return () => {};

  const getSlides = () =>
    /** @type {HTMLElement[]} */ (
      [...viewport.querySelectorAll(':scope > .j-carousel__slide')]
    );

  const getDots = () =>
    /** @type {HTMLElement[]} */ (
      [...root.querySelectorAll('.j-carousel__dot')].filter((d) => d.closest('.j-carousel') === root)
    );

  const prevBtns = /** @type {HTMLButtonElement[]} */ (
    [...root.querySelectorAll('.j-carousel__prev')].filter(
      (b) => b instanceof HTMLButtonElement && b.closest('.j-carousel') === root,
    )
  );
  const nextBtns = /** @type {HTMLButtonElement[]} */ (
    [...root.querySelectorAll('.j-carousel__next')].filter(
      (b) => b instanceof HTMLButtonElement && b.closest('.j-carousel') === root,
    )
  );
  const counterEl = /** @type {HTMLElement | null} */ (
    [...root.querySelectorAll('.j-carousel__counter')].find((c) => c.closest('.j-carousel') === root) ?? null
  );

  const isVertical = () => root.dataset.orientation === 'vertical';
  const isLoop = () => root.hasAttribute('data-loop');
  const getPerView = () => {
    const raw = Number(root.dataset.perView || getComputedStyle(root).getPropertyValue('--j-carousel-per-view') || 1);
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
  };

  let activeIndex = 0;
  /** @type {number | null} */
  let programmaticTarget = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let programmaticTimer = null;

  const clearProgrammatic = () => {
    programmaticTarget = null;
    if (programmaticTimer !== null) {
      clearTimeout(programmaticTimer);
      programmaticTimer = null;
    }
  };

  const getMaxIndex = () => {
    const slides = getSlides();
    return Math.max(0, slides.length - getPerView());
  };

  const syncChrome = (notify = false) => {
    const maxIdx = getMaxIndex();
    const clamped = Math.min(Math.max(0, activeIndex), maxIdx);
    activeIndex = clamped;

    const loop = isLoop() && maxIdx > 0;
    prevBtns.forEach((btn) => {
      btn.disabled = !loop && activeIndex <= 0;
    });
    nextBtns.forEach((btn) => {
      btn.disabled = !loop && activeIndex >= maxIdx;
    });

    const dots = getDots();
    dots.forEach((dot, idx) => {
      const selected = idx === activeIndex;
      dot.setAttribute('aria-selected', String(selected));
      dot.tabIndex = selected ? 0 : -1;
    });

    if (counterEl) {
      const total = maxIdx + 1;
      counterEl.textContent = `${activeIndex + 1} / ${Math.max(1, total)}`;
    }

    if (notify) {
      root.dispatchEvent(
        new CustomEvent('j-change', { bubbles: true, detail: { index: activeIndex } }),
      );
    }
  };

  /**
   * @param {number} targetIndex
   * @param {boolean} [smooth]
   */
  const scrollToSlide = (targetIndex, smooth = true) => {
    const slides = getSlides();
    const maxIdx = getMaxIndex();
    if (!slides.length) return;

    let next = targetIndex;
    if (isLoop() && maxIdx > 0) {
      if (next < 0) next = maxIdx;
      else if (next > maxIdx) next = 0;
    } else {
      next = Math.min(Math.max(0, next), maxIdx);
    }

    const slide = slides[next];
    if (!slide) return;

    activeIndex = next;
    syncChrome(true);

    const behavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto';
    if (behavior === 'smooth') {
      clearProgrammatic();
      programmaticTarget = next;
      programmaticTimer = setTimeout(clearProgrammatic, 420);
    }
    if (isVertical()) {
      viewport.scrollTo({ top: slide.offsetTop, behavior });
    } else {
      viewport.scrollTo({ left: slide.offsetLeft, behavior });
    }
  };

  /** @type {number | null} */
  let scrollRaf = null;
  const onScroll = () => {
    if (scrollRaf !== null) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      const slides = getSlides();
      if (!slides.length) return;
      const pos = isVertical() ? viewport.scrollTop : viewport.scrollLeft;
      const maxIdx = getMaxIndex();
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i <= maxIdx; i++) {
        const s = slides[i];
        if (!s) continue;
        const offset = isVertical() ? s.offsetTop : s.offsetLeft;
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

      if (bestIdx !== activeIndex) {
        activeIndex = bestIdx;
        syncChrome(true);
      }
    });
  };

  const onPrev = () => scrollToSlide(activeIndex - 1, true);
  const onNext = () => scrollToSlide(activeIndex + 1, true);

  /** @param {MouseEvent} event */
  const onClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const dot = target.closest('.j-carousel__dot');
    if (dot instanceof HTMLElement && dot.closest('.j-carousel') === root) {
      const idx = getDots().indexOf(dot);
      if (idx >= 0) scrollToSlide(idx, true);
    }
  };

  /** @param {KeyboardEvent} event */
  const onKeydown = (event) => {
    const vertical = isVertical();
    const rtl = !vertical && getComputedStyle(root).direction === 'rtl';
    const prevKey = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const nextKey = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';

    if (event.key === prevKey) {
      event.preventDefault();
      scrollToSlide(activeIndex - 1, true);
    } else if (event.key === nextKey) {
      event.preventDefault();
      scrollToSlide(activeIndex + 1, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      scrollToSlide(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      scrollToSlide(getMaxIndex(), true);
    }
  };

  // Optional autoplay (pauses on hover/focus and respects prefers-reduced-motion)
  const rawAutoplay = root.dataset.autoplay;
  const autoplayMs =
    rawAutoplay === '' || rawAutoplay === 'true'
      ? 4500
      : rawAutoplay && Number(rawAutoplay) > 0
        ? Number(rawAutoplay)
        : 0;

  /** @type {ReturnType<typeof setInterval> | null} */
  let timer = null;
  let paused = false;

  const stopAutoplay = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (!autoplayMs || paused || prefersReducedMotion()) return;
    timer = setInterval(() => {
      const maxIdx = getMaxIndex();
      if (maxIdx <= 0) return;
      const next = activeIndex >= maxIdx ? 0 : activeIndex + 1;
      scrollToSlide(next, true);
    }, autoplayMs);
  };

  const onPause = () => {
    paused = true;
    stopAutoplay();
  };
  const onResume = () => {
    if (root.matches(':hover') || root.contains(document.activeElement)) return;
    paused = false;
    startAutoplay();
  };

  /** @type {number | null} */
  let roRaf = null;
  const ro = new ResizeObserver(() => {
    if (roRaf !== null) cancelAnimationFrame(roRaf);
    roRaf = requestAnimationFrame(() => {
      roRaf = null;
      syncChrome(false);
    });
  });
  ro.observe(viewport);

  syncChrome(false);
  startAutoplay();

  viewport.addEventListener('scroll', onScroll, { passive: true });
  prevBtns.forEach((b) => b.addEventListener('click', onPrev));
  nextBtns.forEach((b) => b.addEventListener('click', onNext));
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  root.addEventListener('pointerenter', onPause);
  root.addEventListener('pointerleave', onResume);
  root.addEventListener('focusin', onPause);
  root.addEventListener('focusout', onResume);

  return () => {
    stopAutoplay();
    clearProgrammatic();
    if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
    if (roRaf !== null) cancelAnimationFrame(roRaf);
    ro.disconnect();
    viewport.removeEventListener('scroll', onScroll);
    prevBtns.forEach((b) => b.removeEventListener('click', onPrev));
    nextBtns.forEach((b) => b.removeEventListener('click', onNext));
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeydown);
    root.removeEventListener('pointerenter', onPause);
    root.removeEventListener('pointerleave', onResume);
    root.removeEventListener('focusin', onPause);
    root.removeEventListener('focusout', onResume);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every `.j-carousel` inside `root`. Idempotent.
 * @param {ParentNode} [root=document]
 * @returns {() => void} cleanup
 */
export function initCarousels(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-carousel').forEach((el) => {
    const carousel = /** @type {HTMLElement} */ (el);
    if (carousel.hasAttribute('data-j-managed') || bound.has(carousel)) return;
    bound.set(carousel, createCarousel(carousel));
    made.push(carousel);
  });
  return () =>
    made.forEach((c) => {
      bound.get(c)?.();
      bound.delete(c);
    });
}
