import type { CSSProperties, ComponentProps, ReactNode } from 'react';
import { attr, type DisplayTone } from './types';

export type ProgressRingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
export type ProgressRingTone = DisplayTone;

export interface ProgressRingProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Omit or pass `null` for calm indeterminate sweep. */
  value?: number | null;
  max?: number;
  size?: ProgressRingSize;
  /** Stroke width in the 40×40 viewBox coordinate space (default: 3.5). */
  thickness?: number;
  tone?: ProgressRingTone;
  /** Display rounded percentage in the center when determinate. */
  showValue?: boolean;
  /** Accessible label (`aria-label`). */
  label?: string;
  children?: ReactNode;
}

const PRESET_SIZES = new Set(['xs', 'sm', 'md', 'lg', 'xl']);

export function ProgressRing({
  value,
  max = 100,
  size = 'md',
  thickness,
  tone,
  showValue = false,
  label,
  className,
  style,
  children,
  ...rest
}: ProgressRingProps) {
  const strokeVal =
    thickness !== undefined && Number.isFinite(thickness) && thickness > 0 ? thickness : 3.5;
  const radius = Math.max(4, (40 - strokeVal) / 2 - 0.5);
  const circumference = Number((2 * Math.PI * radius).toFixed(2));
  const effectiveMax = max !== undefined && Number.isFinite(max) && max > 0 ? max : 100;

  const isIndeterminate = value === null || value === undefined || !Number.isFinite(value);
  const clampedValue = isIndeterminate ? 0 : Math.max(0, Math.min(effectiveMax, value));
  const ratio = isIndeterminate ? 0 : clampedValue / effectiveMax;
  const dashOffset = Number((circumference * (1 - ratio)).toFixed(2));
  const displayPercent = `${Math.round(ratio * 100)}%`;

  const isPreset = typeof size === 'string' && PRESET_SIZES.has(size);
  const presetSize = isPreset ? attr(size, 'md') : undefined;

  const vars: Record<string, string> = {
    '--_circ': String(circumference),
    '--_offset': String(dashOffset),
  };
  if (!isPreset && size !== undefined) {
    if (typeof size === 'number') {
      vars['--j-progress-ring-size'] = `${size}px`;
    } else {
      const trimmed = size.trim();
      vars['--j-progress-ring-size'] = /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
    }
  }
  if (thickness !== undefined) {
    vars['--j-progress-ring-stroke'] = String(strokeVal);
  }

  const ringStyle: CSSProperties & Record<string, string | number> = style
    ? { ...style, ...vars }
    : vars;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={effectiveMax}
      aria-valuenow={isIndeterminate ? undefined : clampedValue}
      aria-label={label}
      {...rest}
      className={className ? `j-progress-ring ${className}` : 'j-progress-ring'}
      data-size={presetSize}
      data-tone={tone}
      data-indeterminate={isIndeterminate ? '' : undefined}
      style={ringStyle}
    >
      <svg
        className="j-progress-ring__svg"
        viewBox="0 0 40 40"
        fill="none"
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <circle className="j-progress-ring__track" cx="20" cy="20" r={radius} />
        <circle className="j-progress-ring__fill" cx="20" cy="20" r={radius} />
      </svg>
      {(children != null || (showValue && !isIndeterminate)) && (
        <span className="j-progress-ring__label">{children ?? displayPercent}</span>
      )}
    </div>
  );
}
