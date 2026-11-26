import type { CSSProperties, ComponentProps } from 'react';
import { attr, type DisplayTone } from './types';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
export type SpinnerVariant = 'ring' | 'arc' | 'dots';

export interface SpinnerProps extends Omit<ComponentProps<'span'>, 'children'> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  tone?: DisplayTone;
  /** Custom SVG stroke width (default calibrated optically). */
  thickness?: number | string;
  /** Accessible label. */
  label?: string;
}

const PRESET_SIZES = new Set(['xs', 'sm', 'md', 'lg', 'xl']);

export function Spinner({
  size = 'md',
  variant = 'ring',
  tone,
  thickness,
  label = 'Loading',
  className,
  style,
  ...rest
}: SpinnerProps) {
  const isPreset = typeof size === 'string' && PRESET_SIZES.has(size);
  const presetSize = isPreset ? attr(size, 'md') : undefined;

  let customStyle: (CSSProperties & Record<string, string | number>) | undefined = style as
    | (CSSProperties & Record<string, string | number>)
    | undefined;

  if ((!isPreset && size !== undefined) || thickness !== undefined) {
    const vars: Record<string, string> = {};
    if (!isPreset && size !== undefined) {
      if (typeof size === 'number') {
        vars['--j-spinner-size'] = `${size}px`;
      } else {
        const trimmed = size.trim();
        vars['--j-spinner-size'] = /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
      }
    }
    if (thickness !== undefined) {
      vars['--j-spinner-stroke'] = String(thickness);
    }
    customStyle = style ? { ...style, ...vars } : vars;
  }

  return (
    <span
      role="status"
      aria-label={label}
      {...rest}
      className={className ? `j-spinner ${className}` : 'j-spinner'}
      data-size={presetSize}
      data-variant={attr(variant, 'ring')}
      data-tone={tone}
      style={customStyle}
    >
      <svg
        className="j-spinner__svg"
        viewBox="0 0 24 24"
        fill="none"
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        {variant === 'dots' ? (
          <>
            <circle className="j-spinner__dot" cx="5" cy="12" r="2.1" fill="currentColor" />
            <circle className="j-spinner__dot" cx="12" cy="12" r="2.1" fill="currentColor" />
            <circle className="j-spinner__dot" cx="19" cy="12" r="2.1" fill="currentColor" />
          </>
        ) : variant === 'arc' ? (
          <circle
            className="j-spinner__arc"
            cx="12"
            cy="12"
            r="9.5"
            stroke="currentColor"
            strokeLinecap="round"
          />
        ) : (
          <>
            <circle className="j-spinner__track" cx="12" cy="12" r="9.5" stroke="currentColor" />
            <circle
              className="j-spinner__arc"
              cx="12"
              cy="12"
              r="9.5"
              stroke="currentColor"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </span>
  );
}
