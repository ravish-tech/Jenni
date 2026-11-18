import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  attr,
  type CarouselArrows,
  type CarouselOrientation,
  type DisplayTone,
} from './types';

export type { CarouselOrientation, CarouselArrows };

interface CarouselContextValue {
  totalSlides: number;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
}

export interface CarouselProps extends Omit<ComponentProps<'section'>, 'defaultValue' | 'onChange'> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (index: number) => void;
  slidesPerView?: number;
  gap?: string | number;
  loop?: boolean;
  autoplay?: boolean | number;
  arrows?: CarouselArrows;
  dots?: boolean;
  showCounter?: boolean;
  orientation?: CarouselOrientation;
  tone?: DisplayTone;
  height?: string | number;
  label?: string;
  footer?: ReactNode;
}

export function Carousel({
  value,
  defaultValue = 0,
  onValueChange,
  slidesPerView = 1,
  gap,
  loop = false,
  autoplay = false,
  arrows = true,
  dots = true,
  showCounter = true,
  orientation = 'horizontal',
  tone,
  height,
  label = 'Carousel',
  footer,
  className,
  style,
  children,
  onKeyDown,
  ...rest
}: CarouselProps) {
  const [internalIndex, setInternalIndex] = useState(defaultValue);
  const [domSlideCount, setDomSlideCount] = useState(0);
  const [paused, setPaused] = useState(false);

  const rootRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const programmaticTargetRef = useRef<number | null>(null);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const childArray = useMemo(() => Children.toArray(children), [children]);
  const totalSlides = Math.max(childArray.length, domSlideCount);
  const perView = Math.max(1, Math.floor(Number(slidesPerView) || 1));
  const maxIndex = Math.max(0, totalSlides - perView);
  const snapCount = totalSlides > 0 ? maxIndex + 1 : 0;

  const isControlled = value !== undefined;
  const currentIndex = Math.min(Math.max(0, isControlled ? value : internalIndex), maxIndex);

  const canPrev = (loop && maxIndex > 0) || currentIndex > 0;
  const canNext = (loop && maxIndex > 0) || currentIndex < maxIndex;

  const floatingArrows = arrows === true || arrows === 'floating';
  const footerArrows = arrows === 'footer';

  const clearProgrammatic = useCallback(() => {
    programmaticTargetRef.current = null;
    if (programmaticTimerRef.current !== null) {
      clearTimeout(programmaticTimerRef.current);
      programmaticTimerRef.current = null;
    }
  }, []);

  const scrollViewportTo = useCallback(
    (index: number, smooth: boolean) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const slides = vp.querySelectorAll<HTMLElement>(':scope > .j-carousel__slide');
      const target = slides[index];
      if (!target) return;

      const behavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto';
      if (behavior === 'smooth') {
        clearProgrammatic();
        programmaticTargetRef.current = index;
        programmaticTimerRef.current = setTimeout(clearProgrammatic, 420);
      }

      if (orientation === 'vertical') {
        vp.scrollTo({ top: target.offsetTop, behavior });
      } else {
        vp.scrollTo({ left: target.offsetLeft, behavior });
      }
    },
    [orientation, clearProgrammatic],
  );

  const goTo = useCallback(
    (rawIndex: number, smooth = true) => {
      let next = rawIndex;
      if (loop && maxIndex > 0) {
        if (next < 0) next = maxIndex;
        else if (next > maxIndex) next = 0;
      } else {
        next = Math.min(Math.max(0, next), maxIndex);
      }

      if (!isControlled) setInternalIndex(next);
      onValueChange?.(next);
      scrollViewportTo(next, smooth);
    },
    [loop, maxIndex, isControlled, onValueChange, scrollViewportTo],
  );

  useEffect(() => {
    if (!isControlled || value === undefined) return;
    const clamped = Math.min(Math.max(0, value), maxIndex);
    scrollViewportTo(clamped, true);
  }, [isControlled, value, maxIndex, scrollViewportTo]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    setDomSlideCount(vp.querySelectorAll(':scope > .j-carousel__slide').length);
    if (currentIndex > 0) scrollViewportTo(currentIndex, false);

    let roRaf: number | null = null;
    const ro = new ResizeObserver(() => {
      if (roRaf !== null) cancelAnimationFrame(roRaf);
      roRaf = requestAnimationFrame(() => {
        roRaf = null;
        if (viewportRef.current) {
          setDomSlideCount(
            viewportRef.current.querySelectorAll(':scope > .j-carousel__slide').length,
          );
        }
      });
    });
    ro.observe(vp);

    return () => {
      if (roRaf !== null) cancelAnimationFrame(roRaf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      clearProgrammatic();
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [clearProgrammatic]);

  const autoplayMs = !autoplay ? 0 : autoplay === true ? 4500 : autoplay > 0 ? autoplay : 0;

  useEffect(() => {
    if (!autoplayMs || paused || maxIndex <= 0 || prefersReducedMotion()) return;
    const timer = setInterval(() => {
      const next = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      goTo(next, true);
    }, autoplayMs);
    return () => clearInterval(timer);
  }, [autoplayMs, paused, currentIndex, maxIndex, goTo]);

  const handleScroll = () => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const vp = viewportRef.current;
      if (!vp) return;
      const slides = vp.querySelectorAll<HTMLElement>(':scope > .j-carousel__slide');
      if (!slides.length) return;

      const pos = orientation === 'vertical' ? vp.scrollTop : vp.scrollLeft;
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i <= maxIndex; i++) {
        const s = slides[i];
        if (!s) continue;
        const offset = orientation === 'vertical' ? s.offsetTop : s.offsetLeft;
        const dist = Math.abs(offset - pos);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      if (programmaticTargetRef.current !== null) {
        if (bestIdx === programmaticTargetRef.current && bestDist < 4) clearProgrammatic();
        return;
      }

      if (bestIdx !== currentIndex) {
        if (!isControlled) setInternalIndex(bestIdx);
        onValueChange?.(bestIdx);
      }
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const vertical = orientation === 'vertical';
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';

    if (event.key === prevKey) {
      event.preventDefault();
      goTo(currentIndex - 1, true);
    } else if (event.key === nextKey) {
      event.preventDefault();
      goTo(currentIndex + 1, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(maxIndex, true);
    }
  };

  const mergedStyle: CSSProperties = {
    ...style,
    ...(perView !== 1 ? ({ '--j-carousel-per-view': String(perView) } as CSSProperties) : undefined),
    ...(gap != null
      ? ({ '--j-carousel-gap': typeof gap === 'number' ? `${gap}px` : gap } as CSSProperties)
      : undefined),
    ...(height != null
      ? ({ '--j-carousel-height': typeof height === 'number' ? `${height}px` : height } as CSSProperties)
      : undefined),
  };

  let slideIdx = 0;
  const indexedChildren = Children.map(children, (child) => {
    if (isValidElement<CarouselSlideProps>(child)) {
      const assigned = child.props.index ?? slideIdx;
      slideIdx += 1;
      return cloneElement(child as ReactElement<CarouselSlideProps>, { index: assigned });
    }
    return child;
  });

  const ctx = useMemo<CarouselContextValue>(() => ({ totalSlides }), [totalSlides]);

  const handleResume = () => {
    const root = rootRef.current;
    if (root && (root.matches(':hover') || root.contains(document.activeElement))) return;
    setPaused(false);
  };

  return (
    <CarouselContext value={ctx}>
      <section
        ref={rootRef}
        aria-roledescription="carousel"
        aria-label={label}
        {...rest}
        data-j-managed=""
        className={className ? `j-carousel ${className}` : 'j-carousel'}
        data-orientation={attr(orientation, 'horizontal')}
        data-tone={tone}
        data-loop={loop ? '' : undefined}
        style={mergedStyle}
        onKeyDown={handleKeyDown}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={handleResume}
        onFocus={() => setPaused(true)}
        onBlur={handleResume}
      >
        <div className="j-carousel__stage">
          <div
            ref={viewportRef}
            className="j-carousel__viewport"
            tabIndex={0}
            onScroll={handleScroll}
            onPointerDown={clearProgrammatic}
            onWheel={clearProgrammatic}
          >
            {indexedChildren}
          </div>

          {floatingArrows && snapCount > 1 && (
            <>
              <button
                type="button"
                className="j-carousel__prev"
                aria-label="Previous slide"
                disabled={!canPrev}
                onClick={() => goTo(currentIndex - 1, true)}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d={
                      orientation === 'vertical'
                        ? 'M4.25 9.75 8 6l3.75 3.75'
                        : 'M9.75 4.25 6 8l3.75 3.75'
                    }
                  />
                </svg>
              </button>
              <button
                type="button"
                className="j-carousel__next"
                aria-label="Next slide"
                disabled={!canNext}
                onClick={() => goTo(currentIndex + 1, true)}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d={
                      orientation === 'vertical'
                        ? 'M4.25 6.25 8 10l3.75-3.75'
                        : 'M6.25 4.25 10 8l-3.75 3.75'
                    }
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {((dots && snapCount > 1) ||
          (showCounter && snapCount > 0) ||
          (footerArrows && snapCount > 1) ||
          footer != null) && (
          <div className="j-carousel__footer">
            {footer ?? (
              <>
                {showCounter && snapCount > 0 && (
                  <span className="j-carousel__counter" aria-live="polite">
                    {currentIndex + 1} / {snapCount}
                  </span>
                )}

                {dots && snapCount > 1 && (
                  <div className="j-carousel__dots" role="tablist" aria-label="Choose slide">
                    {Array.from({ length: snapCount }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        className="j-carousel__dot"
                        role="tab"
                        aria-selected={i === currentIndex ? 'true' : 'false'}
                        aria-label={`Go to slide ${i + 1}`}
                        tabIndex={i === currentIndex ? 0 : -1}
                        onClick={() => goTo(i, true)}
                      />
                    ))}
                  </div>
                )}

                {footerArrows && snapCount > 1 && (
                  <div className="j-carousel__nav">
                    <button
                      type="button"
                      className="j-carousel__prev"
                      aria-label="Previous slide"
                      disabled={!canPrev}
                      onClick={() => goTo(currentIndex - 1, true)}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9.75 4.25 6 8l3.75 3.75" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="j-carousel__next"
                      aria-label="Next slide"
                      disabled={!canNext}
                      onClick={() => goTo(currentIndex + 1, true)}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M6.25 4.25 10 8l-3.75 3.75" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </CarouselContext>
  );
}

export interface CarouselSlideProps extends ComponentProps<'div'> {
  label?: string;
  index?: number;
}

export function CarouselSlide({
  label,
  index = 0,
  className,
  children,
  ...rest
}: CarouselSlideProps) {
  const carousel = useContext(CarouselContext);
  const ariaLabel =
    label ??
    (carousel && carousel.totalSlides > 0
      ? `${index + 1} of ${carousel.totalSlides}`
      : undefined);

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={ariaLabel}
      {...rest}
      className={className ? `j-carousel__slide ${className}` : 'j-carousel__slide'}
    >
      {children}
    </div>
  );
}
