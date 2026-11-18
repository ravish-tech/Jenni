import {
  useEffect,
  useRef,
  type CSSProperties,
  type ComponentProps,
} from 'react';
import {
  createScrollArea,
  type ScrollAreaController,
  type ScrollAreaState,
} from '@jenni/core/behaviors/scroll-area.js';
import {
  attr,
  cx,
  mergeRefs,
  type ScrollOrientation,
  type ScrollbarVisibility,
} from './types';

export type { ScrollAreaState };

export interface ScrollAreaProps extends ComponentProps<'div'> {
  orientation?: ScrollOrientation;
  scrollbar?: ScrollbarVisibility;
  fade?: boolean;
  fadeSize?: string | number;
  maxHeight?: string | number;
  maxWidth?: string | number;
  height?: string | number;
  width?: string | number;
  bordered?: boolean;
  onScrollStateChange?: (state: ScrollAreaState) => void;
}

const toPx = (v: string | number) => (typeof v === 'number' ? `${v}px` : v);

export function ScrollArea({
  orientation = 'vertical',
  scrollbar = 'subtle',
  fade = false,
  fadeSize,
  maxHeight,
  maxWidth,
  height,
  width,
  bordered = false,
  onScrollStateChange,
  style,
  className,
  children,
  ref,
  ...rest
}: ScrollAreaProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<ScrollAreaController | null>(null);
  const onStateRef = useRef(onScrollStateChange);
  onStateRef.current = onScrollStateChange;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctrl = createScrollArea(el, {
      onStateChange: (state) => onStateRef.current?.(state),
    });
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    ctrlRef.current?.update();
  }, [orientation, fade, maxHeight, maxWidth, height, width]);

  const customVars: Record<string, string> = {};
  if (maxHeight != null) customVars['--j-scroll-max-h'] = toPx(maxHeight);
  if (maxWidth != null) customVars['--j-scroll-max-w'] = toPx(maxWidth);
  if (height != null) customVars['--j-scroll-h'] = toPx(height);
  if (width != null) customVars['--j-scroll-w'] = toPx(width);
  if (fadeSize != null) customVars['--j-scroll-fade-size'] = toPx(fadeSize);

  const mergedStyle: CSSProperties | undefined =
    Object.keys(customVars).length > 0 ? { ...style, ...customVars } : style;

  return (
    <div
      {...rest}
      ref={mergeRefs(rootRef, ref)}
      className={cx('j-scroll-area', className)}
      data-orientation={attr(orientation, 'vertical')}
      data-scrollbar={attr(scrollbar, 'subtle')}
      data-fade={fade ? '' : undefined}
      data-bordered={bordered ? '' : undefined}
      style={mergedStyle}
    >
      {children}
    </div>
  );
}
