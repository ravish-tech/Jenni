import type { CSSProperties, ComponentProps, HTMLAttributes, Ref } from 'react';
import { getEntityHue } from 'jenni-core/behaviors/entity-color.js';
import { attr, type DisplaySize, type DisplayTone, type ProgressSegment } from './types';

export type { ProgressSegment };

export interface ProgressProps extends Omit<ComponentProps<'progress'>, 'value' | 'children'> {
  /** Omit (or null) for indeterminate. */
  value?: number | null;
  max?: number;
  size?: DisplaySize;
  tone?: DisplayTone;
  label?: string;
  /** Multi-segment stacked progress items. */
  segments?: ProgressSegment[];
  /** Discrete stepped progress cells. */
  steps?: number;
}

export function Progress({
  value,
  max,
  size = 'md',
  tone,
  label,
  segments,
  steps,
  className,
  ref,
  ...rest
}: ProgressProps) {
  if (segments && segments.length > 0) {
    let totalSegmentValue = 0;
    for (const s of segments) {
      if (Number.isFinite(s.value) && s.value > 0) totalSegmentValue += s.value;
    }
    const baseMax = max && max > 0 ? max : 100;
    const effectiveMax = Math.max(baseMax, totalSegmentValue);
    const summaryParts = segments
      .filter((s) => Boolean(s.label))
      .map((s) => `${s.label}: ${s.value}`);
    const segmentSummary = summaryParts.length ? summaryParts.join(', ') : undefined;

    return (
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={effectiveMax}
        aria-valuenow={totalSegmentValue}
        aria-label={label}
        aria-valuetext={segmentSummary}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
        ref={ref as Ref<HTMLDivElement>}
        className={className ? `j-progress-segmented ${className}` : 'j-progress-segmented'}
        data-size={attr(size, 'md')}
        data-tone={tone}
      >
        {segments
          .filter((s) => Number.isFinite(s.value) && s.value > 0)
          .map((s, idx) => {
            const pct = effectiveMax > 0 ? Math.min(100, (s.value / effectiveMax) * 100) : 0;
            const entityHue =
              !s.tone && !s.color && s.colorSeed ? getEntityHue(s.colorSeed) : undefined;
            const segStyle: CSSProperties & Record<string, string | number> = {
              width: `${pct}%`,
              flexBasis: `${pct}%`,
            };
            if (s.color) segStyle['--_seg-bg'] = s.color;
            else if (entityHue !== undefined) segStyle['--j-entity-hue'] = String(entityHue);

            return (
              <div
                key={idx}
                className="j-progress-segmented__bar"
                data-tone={s.tone}
                data-entity-color={entityHue !== undefined ? '' : undefined}
                title={s.label || undefined}
                style={segStyle}
              />
            );
          })}
      </div>
    );
  }

  if (steps && steps > 0) {
    const stepCount = Math.max(1, Math.floor(steps));
    const effectiveStepMax = max && max > 0 ? max : stepCount;
    const stepValueNow = Math.max(0, Math.min(effectiveStepMax, value ?? 0));
    const filledCount =
      effectiveStepMax > 0 ? Math.round((stepValueNow / effectiveStepMax) * stepCount) : 0;

    return (
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={effectiveStepMax}
        aria-valuenow={stepValueNow}
        aria-label={label}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
        ref={ref as Ref<HTMLDivElement>}
        className={className ? `j-progress-segmented ${className}` : 'j-progress-segmented'}
        data-steps=""
        data-size={attr(size, 'md')}
        data-tone={tone}
      >
        {Array.from({ length: stepCount }, (_, idx) => (
          <div
            key={idx}
            className="j-progress-segmented__step"
            data-filled={idx < filledCount ? '' : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <progress
      aria-label={label}
      {...rest}
      ref={ref}
      className={className ? `j-progress ${className}` : 'j-progress'}
      value={value ?? undefined}
      max={max ?? 100}
      data-size={attr(size, 'md')}
      data-tone={tone}
    />
  );
}
