import type { ComponentProps, ReactNode } from 'react';
import { attr } from './types';

export type StatTrend = 'up' | 'down' | 'neutral';
export type StatVariant = 'surface' | 'outline' | 'ghost';
export type StatTrendTone = 'auto' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
export type StatSize = 'sm' | 'md' | 'lg';
export type StatGroupCols = 2 | 3 | 4;
export type StatGroupVariant = 'cards' | 'divided';

export interface StatProps extends Omit<ComponentProps<'div'>, 'prefix'> {
  /** Metric title / KPI label. */
  label: string;
  /** Formatted metric reading. */
  value?: string | number;
  /** Leading unit or currency symbol (e.g. "$"). */
  prefix?: string;
  /** Trailing unit symbol (e.g. "ms", "%"). */
  suffix?: string;
  /** Comparative delta reading (e.g. "+12.4%", "-4.2 ms"). */
  delta?: string | number;
  /** Directional trend indicator arrow. */
  trend?: StatTrend;
  /** Semantic tone for the delta badge (`'auto'` maps up->success, down->danger, neutral->neutral). */
  trendTone?: StatTrendTone;
  /** Secondary context or comparison period label. */
  helpText?: string;
  /** Visual container treatment. */
  variant?: StatVariant;
  /** Density & typographic scale. */
  size?: StatSize;
  /** Optional header icon badge. */
  icon?: ReactNode;
  /** Optional custom trend content overriding default arrow + delta text. */
  trendContent?: ReactNode;
  /** Trailing or bottom micro-chart (e.g. `<Sparkline />`). */
  chart?: ReactNode;
  /** Optional footer metadata strip. */
  footer?: ReactNode;
}

export interface StatGroupProps extends ComponentProps<'div'> {
  /** Target column count at full container width (`@container` responsive). */
  cols?: StatGroupCols;
  /** Separate cards or a unified surface strip with 1px internal hairlines. */
  variant?: StatGroupVariant;
}

function TrendArrow({ trend }: { trend: StatTrend }) {
  return (
    <svg
      className="j-stat__trend-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
    >
      {trend === 'up' ? (
        <path d="M7 17 17 7M9 7h8v8" />
      ) : trend === 'down' ? (
        <path d="M7 7l10 10M17 9v8H9" />
      ) : (
        <path d="M6 12h12" />
      )}
    </svg>
  );
}

export function Stat({
  label,
  value,
  prefix,
  suffix,
  delta,
  trend,
  trendTone = 'auto',
  helpText,
  variant = 'outline',
  size = 'md',
  icon,
  trendContent,
  chart,
  footer,
  className,
  children,
  ...rest
}: StatProps) {
  const resolvedTone: Exclude<StatTrendTone, 'auto'> =
    trendTone !== 'auto'
      ? trendTone
      : trend === 'up'
        ? 'success'
        : trend === 'down'
          ? 'danger'
          : 'neutral';

  const hasValue = value !== undefined || children != null;
  const hasDelta = delta !== undefined || trend !== undefined || trendContent != null;
  const hasMeta = hasDelta || Boolean(helpText);

  return (
    <div
      {...rest}
      className={className ? `j-stat ${className}` : 'j-stat'}
      data-variant={attr(variant, 'outline')}
      data-size={attr(size, 'md')}
    >
      <div className="j-stat__header">
        <span className="j-stat__label">{label}</span>
        {icon != null && (
          <span className="j-stat__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <div className="j-stat__body">
        <div className="j-stat__primary">
          {hasValue && (
            <div className="j-stat__value">
              {children ?? (
                <>
                  {prefix && <span className="j-stat__affix">{prefix}</span>}
                  <span>{value}</span>
                  {suffix && <span className="j-stat__affix">{suffix}</span>}
                </>
              )}
            </div>
          )}

          {hasMeta && (
            <div className="j-stat__meta">
              {hasDelta && (
                <span
                  className="j-stat__delta"
                  data-trend={trend}
                  data-tone={resolvedTone}
                >
                  {trendContent ?? (
                    <>
                      {trend && <TrendArrow trend={trend} />}
                      {delta !== undefined && <span>{delta}</span>}
                    </>
                  )}
                </span>
              )}
              {helpText && <span className="j-stat__help">{helpText}</span>}
            </div>
          )}
        </div>

        {chart != null && <div className="j-stat__chart">{chart}</div>}
      </div>

      {footer != null && <div className="j-stat__footer">{footer}</div>}
    </div>
  );
}

export function StatGroup({
  cols = 4,
  variant = 'cards',
  className,
  children,
  ...rest
}: StatGroupProps) {
  return (
    <div
      {...rest}
      className={className ? `j-stat-group ${className}` : 'j-stat-group'}
      data-cols={cols === 4 ? undefined : String(cols)}
      data-variant={attr(variant, 'cards')}
    >
      {children}
    </div>
  );
}
