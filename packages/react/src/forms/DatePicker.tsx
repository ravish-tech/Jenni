import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  addMonthsClamped,
  anchorDatePopover,
  buildCalendarGrid,
  formatDisplayDate,
  formatDisplayRange,
  formatMonthTitle,
  getWeekdayLabels,
  isDateDisabled,
  parseIsoDate,
  shiftYearMonth,
  stepFocusedDate,
  todayIso,
} from '@jenni/core/behaviors/date-picker.js';
import {
  cx,
  flag,
  mergeRefs,
  sizeAttr,
  useControllable,
  type DatePickerMode,
  type DateRange,
  type Size,
  type Tone,
} from './types';
import { useFieldProps } from './useFieldProps';

export type { DatePickerMode, DateRange };

export interface CalendarProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  mode?: DatePickerMode;
  value?: string | DateRange | null;
  defaultValue?: string | DateRange | null;
  onValueChange?: (value: string | DateRange | null) => void;
  onComplete?: (value: string | DateRange | null) => void;
  min?: string;
  max?: string;
  weekStartsOn?: 0 | 1;
  showFooter?: boolean;
  tone?: Tone;
  disabled?: boolean;
  locale?: string;
}

function resolveSeedIso(val: string | DateRange | null | undefined): string {
  if (typeof val === 'string' && parseIsoDate(val)) return val;
  if (val && typeof val === 'object') {
    if (val.start && parseIsoDate(val.start)) return val.start;
    if (val.end && parseIsoDate(val.end)) return val.end;
  }
  return todayIso();
}

export function Calendar({
  mode = 'single',
  value,
  defaultValue = null,
  onValueChange,
  onComplete,
  min,
  max,
  weekStartsOn = 0,
  showFooter = true,
  tone,
  disabled = false,
  locale = 'en-US',
  className,
  ...rest
}: CalendarProps) {
  const [current, setCurrent] = useControllable<string | DateRange | null>(
    value,
    defaultValue,
    onValueChange,
  );
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  const initialSeed = resolveSeedIso(current);
  const initialParts = parseIsoDate(initialSeed) ?? { year: 2026, month: 1, day: 1 };
  const [viewYear, setViewYear] = useState(initialParts.year);
  const [viewMonth, setViewMonth] = useState(initialParts.month);
  const [focusedIso, setFocusedIso] = useState(initialSeed);

  useEffect(() => {
    const nextIso =
      typeof current === 'string'
        ? current
        : current && typeof current === 'object'
          ? current.start || current.end
          : null;
    const parsed = parseIsoDate(nextIso);
    if (parsed && nextIso) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
      setFocusedIso(nextIso);
    }
  }, [current]);

  const monthTitle = formatMonthTitle(viewYear, viewMonth, locale);
  const weekdays = getWeekdayLabels(weekStartsOn, locale);
  const weeks = buildCalendarGrid(viewYear, viewMonth, { weekStartsOn, min, max });

  const singleSelected = mode === 'single' && typeof current === 'string' ? current : null;
  const rangeState: DateRange =
    mode === 'range' && current && typeof current === 'object'
      ? { start: current.start ?? null, end: current.end ?? null }
      : { start: null, end: null };

  const rawEnd =
    rangeState.start && !rangeState.end && hoverIso ? hoverIso : rangeState.end;
  const effectiveRange =
    rangeState.start && rawEnd && rawEnd < rangeState.start
      ? { start: rawEnd, end: rangeState.start }
      : { start: rangeState.start, end: rawEnd };

  const todayDisabled = isDateDisabled(todayIso(), min, max);
  const hasSelection =
    mode === 'single'
      ? Boolean(singleSelected)
      : Boolean(rangeState.start || rangeState.end);

  const summaryText =
    mode === 'single'
      ? singleSelected
        ? formatDisplayDate(singleSelected, locale)
        : 'No date'
      : rangeState.start || rangeState.end
        ? formatDisplayRange(rangeState, locale)
        : 'Select range';

  const focusCell = (iso: string) => {
    requestAnimationFrame(() => {
      const btn = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`);
      btn?.focus();
    });
  };

  const navigateMonth = (delta: number) => {
    if (disabled) return;
    const next = shiftYearMonth(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
    setFocusedIso((prev) => addMonthsClamped(prev, delta));
  };

  const selectDate = (iso: string) => {
    if (disabled || isDateDisabled(iso, min, max)) return;
    const p = parseIsoDate(iso);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
    setFocusedIso(iso);

    if (mode === 'single') {
      setCurrent(iso);
      onComplete?.(iso);
    } else if (!rangeState.start || (rangeState.start && rangeState.end)) {
      const next: DateRange = { start: iso, end: null };
      setHoverIso(null);
      setCurrent(next);
    } else {
      const next: DateRange =
        iso < rangeState.start
          ? { start: iso, end: rangeState.start }
          : { start: rangeState.start, end: iso };
      setHoverIso(null);
      setCurrent(next);
      onComplete?.(next);
    }
    focusCell(iso);
  };

  const handleGridKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const nextIso = stepFocusedDate(focusedIso, e.key, e.shiftKey, weekStartsOn);
    if (!nextIso) return;
    e.preventDefault();
    setFocusedIso(nextIso);
    const p = parseIsoDate(nextIso);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
    focusCell(nextIso);
  };

  const pickToday = () => {
    if (disabled || todayDisabled) return;
    const t = todayIso();
    if (mode === 'single') {
      selectDate(t);
    } else {
      const p = parseIsoDate(t);
      if (p) {
        setViewYear(p.year);
        setViewMonth(p.month);
      }
      setFocusedIso(t);
      const next: DateRange = { start: t, end: t };
      setHoverIso(null);
      setCurrent(next);
      onComplete?.(next);
    }
  };

  const clearSelection = () => {
    if (disabled) return;
    setHoverIso(null);
    setCurrent(mode === 'single' ? null : { start: null, end: null });
  };

  return (
    <div
      className={cx('j-calendar', className)}
      data-j-managed=""
      data-mode={mode}
      data-tone={tone}
      aria-disabled={disabled ? 'true' : undefined}
      {...rest}
    >
      <div className="j-calendar__header">
        <div className="j-calendar__title" aria-live="polite">
          {monthTitle}
        </div>
        <div className="j-calendar__nav">
          <button
            type="button"
            className="j-calendar__nav-btn"
            aria-label="Previous month"
            disabled={disabled || undefined}
            onClick={() => navigateMonth(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="j-calendar__nav-btn"
            aria-label="Next month"
            disabled={disabled || undefined}
            onClick={() => navigateMonth(1)}
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={gridRef}
        className="j-calendar__grid"
        role="grid"
        aria-label={monthTitle}
        onPointerLeave={() => setHoverIso(null)}
        onKeyDown={handleGridKeyDown}
      >
        <div className="j-calendar__weekdays" role="row">
          {weekdays.map((w) => (
            <div
              key={w.long}
              className="j-calendar__weekday"
              role="columnheader"
              aria-label={w.long}
            >
              {w.short}
            </div>
          ))}
        </div>

        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="j-calendar__row" role="row">
            {week.map((cell) => {
              const isStart = mode === 'range' && effectiveRange.start === cell.iso;
              const isEnd = mode === 'range' && effectiveRange.end === cell.iso;
              const inRange = Boolean(
                mode === 'range' &&
                  effectiveRange.start &&
                  effectiveRange.end &&
                  cell.iso >= effectiveRange.start &&
                  cell.iso <= effectiveRange.end,
              );
              const isSelected =
                mode === 'single' ? singleSelected === cell.iso : isStart || isEnd || inRange;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  role="gridcell"
                  className="j-calendar__day"
                  data-date={cell.iso}
                  data-outside={flag(cell.outside)}
                  data-today={flag(cell.today)}
                  data-selected={flag(mode === 'single' && singleSelected === cell.iso)}
                  data-in-range={flag(inRange)}
                  data-range-start={flag(isStart)}
                  data-range-end={flag(isEnd)}
                  tabIndex={cell.iso === focusedIso ? 0 : -1}
                  disabled={disabled || cell.disabled || undefined}
                  aria-disabled={cell.disabled ? 'true' : undefined}
                  aria-selected={isSelected ? 'true' : 'false'}
                  aria-label={formatDisplayDate(cell.iso, locale)}
                  onPointerEnter={() => {
                    if (
                      mode === 'range' &&
                      !cell.disabled &&
                      rangeState.start &&
                      !rangeState.end
                    ) {
                      setHoverIso(cell.iso);
                    }
                  }}
                  onFocus={() => setFocusedIso(cell.iso)}
                  onClick={() => selectDate(cell.iso)}
                >
                  <span className="j-calendar__day-num">{cell.day}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {showFooter && (
        <div className="j-calendar__footer">
          <span className="j-calendar__summary">{summaryText}</span>
          <div className="j-calendar__footer-actions">
            <button
              type="button"
              className="j-calendar__action"
              disabled={disabled || !hasSelection || undefined}
              onClick={clearSelection}
            >
              Clear
            </button>
            <button
              type="button"
              className="j-calendar__action"
              data-primary=""
              disabled={disabled || todayDisabled || undefined}
              onClick={pickToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface DatePickerProps
  extends Omit<ComponentProps<'button'>, 'value' | 'defaultValue' | 'onChange'> {
  mode?: DatePickerMode;
  value?: string | DateRange | null;
  defaultValue?: string | DateRange | null;
  onValueChange?: (value: string | DateRange | null) => void;
  min?: string;
  max?: string;
  weekStartsOn?: 0 | 1;
  placeholder?: string;
  clearable?: boolean;
  showFooter?: boolean;
  size?: Size;
  tone?: Tone;
  invalid?: boolean;
  name?: string;
  locale?: string;
}

export function DatePicker({
  mode = 'single',
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  weekStartsOn = 0,
  placeholder,
  clearable = true,
  showFooter = true,
  size,
  tone,
  invalid,
  disabled,
  name,
  locale = 'en-US',
  className,
  style,
  ref,
  ...rest
}: DatePickerProps) {
  const field = useFieldProps(invalid);
  const popId = `${useId()}-cal`;
  const shellRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [current, setCurrent] = useControllable<string | DateRange | null>(
    value,
    defaultValue,
    onValueChange,
  );
  const [open, setOpen] = useState(false);

  const isDisabled = !!(disabled || field.disabled);
  const isInvalid = !!(invalid || field['aria-invalid']);

  useEffect(() => {
    const shell = shellRef.current;
    const pop = popoverRef.current;
    if (!shell || !pop) return;
    const stopAnchor = anchorDatePopover(shell, pop);
    const onToggle = (e: Event) => {
      setOpen((e as ToggleEvent).newState === 'open');
    };
    pop.addEventListener('toggle', onToggle);
    return () => {
      stopAnchor();
      pop.removeEventListener('toggle', onToggle);
    };
  }, []);

  const showPopover = () => {
    if (isDisabled || !popoverRef.current) return;
    if (!popoverRef.current.matches(':popover-open')) {
      try {
        popoverRef.current.showPopover();
      } catch {
        /* ignore */
      }
    }
  };

  const hidePopover = () => {
    if (popoverRef.current?.matches(':popover-open')) {
      try {
        popoverRef.current.hidePopover();
      } catch {
        /* ignore */
      }
    }
  };

  const displayLabel =
    mode === 'single'
      ? typeof current === 'string' && current
        ? formatDisplayDate(current, locale)
        : ''
      : current && typeof current === 'object'
        ? formatDisplayRange(current, locale)
        : '';

  const effectivePlaceholder =
    placeholder ?? (mode === 'range' ? 'Select date range' : 'Select date');

  const hiddenVal =
    mode === 'single'
      ? typeof current === 'string'
        ? current
        : ''
      : current && typeof current === 'object'
        ? current.start || current.end
          ? `${current.start ?? ''}/${current.end ?? ''}`
          : ''
        : '';

  return (
    <>
      <div
        ref={shellRef}
        className={cx('j-date-picker', className)}
        style={style}
        data-j-managed=""
        data-size={sizeAttr(size)}
        data-tone={tone}
        data-open={flag(open)}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-invalid={isInvalid ? 'true' : undefined}
      >
        {name && <input type="hidden" name={name} value={hiddenVal} />}
        <button
          {...field}
          ref={mergeRefs(triggerRef, ref)}
          type="button"
          className="j-date-picker__trigger"
          aria-haspopup="dialog"
          aria-expanded={open ? 'true' : 'false'}
          aria-controls={popId}
          disabled={isDisabled || undefined}
          onClick={() => (open ? hidePopover() : showPopover())}
          {...rest}
        >
          <span className="j-date-picker__icon" aria-hidden="true">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="1.75" />
              <path d="M5.25 1.75v2.5M10.75 1.75v2.5M2.25 6.75h11.5" />
            </svg>
          </span>
          <span
            className="j-date-picker__value"
            data-placeholder={displayLabel ? undefined : ''}
          >
            {displayLabel || effectivePlaceholder}
          </span>
        </button>

        {clearable && !isDisabled && Boolean(displayLabel) && (
          <button
            type="button"
            className="j-date-picker__clear"
            aria-label="Clear date"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setCurrent(mode === 'single' ? null : { start: null, end: null });
              triggerRef.current?.focus();
            }}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
            </svg>
          </button>
        )}
      </div>

      <div
        id={popId}
        ref={popoverRef}
        className="j-date-picker__popover"
        popover="auto"
        data-align="start"
        data-tone={tone}
      >
        <Calendar
          mode={mode}
          value={current}
          onValueChange={setCurrent}
          onComplete={() => {
            hidePopover();
            triggerRef.current?.focus();
          }}
          min={min}
          max={max}
          weekStartsOn={weekStartsOn}
          showFooter={showFooter}
          tone={tone}
          disabled={isDisabled}
          locale={locale}
        />
      </div>
    </>
  );
}
