import type { ComponentProps, CSSProperties } from 'react';

export interface SkeletonProps extends ComponentProps<'div'> {
  shape?: 'rect' | 'text' | 'circle';
  width?: string | number;
  height?: string | number;
  /** Render N text lines (last one shorter). */
  lines?: number;
}

const toLength = (v?: string | number) => (typeof v === 'number' ? `${v}px` : v);

export function Skeleton({ shape = 'rect', width, height, lines, className, style, children, ...rest }: SkeletonProps) {
  const w = toLength(width);
  const h = toLength(height);

  if (lines && lines > 1) {
    return (
      <div
        aria-hidden="true"
        {...rest}
        className={className ? `j-skeleton-lines ${className}` : 'j-skeleton-lines'}
        style={{ inlineSize: w, ...style }}
      >
        {Array.from({ length: lines }, (_, i) => <div key={i} className="j-skeleton" data-shape="text" />)}
      </div>
    );
  }

  const size: CSSProperties = shape === 'circle' && (w || h)
    ? ({ '--j-skeleton-size': w ?? h } as CSSProperties)
    : { inlineSize: w, blockSize: h };

  return (
    <div
      aria-hidden="true"
      {...rest}
      className={className ? `j-skeleton ${className}` : 'j-skeleton'}
      data-shape={shape === 'rect' ? undefined : shape}
      style={{ ...size, ...style }}
    >
      {children}
    </div>
  );
}
