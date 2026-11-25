import { useId, useMemo, type CSSProperties, type ComponentProps } from 'react';
import {
  computeSparkline,
  type SparklinePoint,
  type SparklineVariant,
} from 'jenni-core/behaviors/sparkline.js';
import { attr, type DisplayTone } from './types';

export type { SparklineVariant };
export type SparklineTone = DisplayTone;

export interface SparklineProps extends Omit<ComponentProps<'span'>, 'children' | 'color'> {
  data: readonly number[];
  variant?: SparklineVariant;
  width?: number | string;
  height?: number | string;
  tone?: SparklineTone;
  color?: string;
  smooth?: boolean;
  strokeWidth?: number;
  min?: number;
  max?: number;
  showEndDot?: boolean;
  showMinMax?: boolean;
  fillOpacity?: number;
  label?: string;
}

function resolveDimension(val: number | string | undefined, fallback: number): number {
  if (typeof val === 'number' && Number.isFinite(val) && val > 0) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.endsWith('%')) return fallback;
    const parsed = Number.parseFloat(trimmed);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

interface MarkerDot {
  key: string;
  kind: 'end' | 'min' | 'max';
  x: number;
  y: number;
}

export function Sparkline({
  data,
  variant = 'line',
  width = 88,
  height = 24,
  tone,
  color,
  smooth = false,
  strokeWidth = 1.5,
  min,
  max,
  showEndDot = false,
  showMinMax = false,
  fillOpacity = 0.16,
  label,
  className,
  style,
  ...rest
}: SparklineProps) {
  const rawId = useId();
  const gradientId = `j-spark-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const areaFillUrl = `url(#${gradientId})`;

  const numericWidth = resolveDimension(width, 88);
  const numericHeight = resolveDimension(height, 24);
  const padding =
    showEndDot || showMinMax
      ? Math.max(2.5, strokeWidth + 1)
      : Math.max(2, strokeWidth);

  const geometry = useMemo(
    () =>
      computeSparkline(data, {
        width: numericWidth,
        height: numericHeight,
        strokeWidth,
        padding,
        variant,
        smooth,
        min,
        max,
      }),
    [data, numericWidth, numericHeight, strokeWidth, padding, variant, smooth, min, max],
  );

  const hasLabel = Boolean(label && label.trim().length > 0);
  const dotRadius = Math.max(1.75, strokeWidth + 0.5);

  const dots = useMemo<MarkerDot[]>(() => {
    if (variant === 'bar') return [];
    const list: MarkerDot[] = [];
    const used = new Set<number>();

    const pushDot = (pt: SparklinePoint | null, kind: 'end' | 'min' | 'max') => {
      if (!pt || used.has(pt.index)) return;
      used.add(pt.index);
      list.push({ key: `${kind}-${pt.index}`, kind, x: pt.x, y: pt.y });
    };

    if (showEndDot) pushDot(geometry.lastPoint, 'end');
    if (showMinMax) {
      pushDot(geometry.maxPoint, 'max');
      pushDot(geometry.minPoint, 'min');
    }
    return list;
  }, [variant, showEndDot, showMinMax, geometry]);

  let mergedStyle: CSSProperties | undefined = style;
  if (color) {
    mergedStyle = {
      ...style,
      ['--j-sparkline-color' as string]: color,
    } as CSSProperties;
  }

  return (
    <span
      {...rest}
      data-j-managed=""
      className={className ? `j-sparkline ${className}` : 'j-sparkline'}
      data-variant={attr(variant, 'line')}
      data-tone={tone}
      role={hasLabel ? 'img' : undefined}
      aria-label={hasLabel ? label : undefined}
      aria-hidden={hasLabel ? undefined : true}
      style={mergedStyle}
    >
      <svg
        className="j-sparkline__svg"
        width={width}
        height={height}
        viewBox={geometry.viewBox}
        focusable="false"
        aria-hidden="true"
      >
        {variant === 'area' && geometry.areaPath && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={fillOpacity} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
        )}

        {variant === 'bar' ? (
          geometry.bars.map((bar) => (
            <rect
              key={bar.index}
              className="j-sparkline__bar"
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx={bar.width >= 3 ? 1 : 0.5}
              data-last={bar.isLast ? '' : undefined}
              data-min={bar.isMin ? '' : undefined}
              data-max={bar.isMax ? '' : undefined}
            />
          ))
        ) : (
          <>
            {variant === 'area' && geometry.areaPath && (
              <path
                className="j-sparkline__area"
                d={geometry.areaPath}
                fill={areaFillUrl}
              />
            )}
            {geometry.linePath && (
              <path
                className="j-sparkline__line"
                d={geometry.linePath}
                strokeWidth={strokeWidth}
              />
            )}
            {dots.map((dot) => (
              <circle
                key={dot.key}
                className="j-sparkline__dot"
                cx={dot.x}
                cy={dot.y}
                r={dotRadius}
                data-end={dot.kind === 'end' ? '' : undefined}
                data-min={dot.kind === 'min' ? '' : undefined}
                data-max={dot.kind === 'max' ? '' : undefined}
              />
            ))}
          </>
        )}
      </svg>
    </span>
  );
}
