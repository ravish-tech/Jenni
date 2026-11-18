import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  anchorTimePopover,
  applyDigitToSegment,
  buildHourOptions,
  buildMinuteOptions,
  formatTimeValue,
  from12HourDisplay,
  nowTimeValue,
  padTime,
  parseTimeValue,
  stepTimePart,
  to12HourDisplay,
} from '@jenni/core/behaviors/time-picker.js';
import {
  cx,
  flag,
  mergeRefs,
  sizeAttr,
  useControllable,
  type Size,
  type TimeFormat,
  type Tone,
} from './types';
import { useFieldProps } from './useFieldProps';

export type { TimeFormat };

export interface TimePickerProps
  extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  format?: TimeFormat;
  seconds?: boolean;
  minuteStep?: number;
  clearable?: boolean;
  size?: Size;
  tone?: Tone;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
}

export function TimePicker({
  value,
  defaultValue = null,
  onValueChange,
  format = '24h',
  seconds = false,
  minuteStep = 1,
  clearable = true,
  size,
  tone,
  disabled,
  invalid,
  name,
  className,
  style,
  ref,
  ...rest
}: TimePickerProps) {
  const field = useFieldProps(invalid);
  const popId = `${useId()}-time`;
  const shellRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const hourRef = useRef<HTMLButtonElement | null>(null);
  const minuteRef = useRef<HTMLButtonElement | null>(null);
  const secondRef = useRef<HTMLButtonElement | null>(null);
  const periodRef = useRef<HTMLButtonElement | null>(null);

  const [current, setCurrent] = useControllable<string | null>(
    value,
    defaultValue,
    onValueChange,
  );
  const [open, setOpen] = useState(false);
  const digitBufferRef = useRef('');

  const isDisabled = !!(disabled || field.disabled);
  const isInvalid = !!(invalid || field['aria-invalid']);

  const parsed = parseTimeValue(current);
  const display12 = parsed ? to12HourDisplay(parsed.hour) : null;

  const hourText = parsed
    ? padTime(format === '12h' ? display12!.hour12 : parsed.hour)
    : '--';
  const minuteText = parsed ? padTime(parsed.minute) : '--';
  const secondText = parsed ? padTime(parsed.second) : '--';
  const periodText = display12?.period ?? 'AM';

  const hourOptions = buildHourOptions(format);
  const minuteOptions = buildMinuteOptions(minuteStep);
  const secondOptions = buildMinuteOptions(1);

  useEffect(() => {
    const shell = shellRef.current;
    const pop = popoverRef.current;
    if (!shell || !pop) return;
    const stopAnchor = anchorTimePopover(shell, pop);
    const onToggle = (e: Event) => {
      const opened = (e as ToggleEvent).newState === 'open';
      setOpen(opened);
      if (opened) {
        requestAnimationFrame(() => {
          pop
            .querySelectorAll<HTMLElement>('.j-time-picker__cell[aria-selected="true"]')
            .forEach((el) => el.scrollIntoView({ block: 'nearest' }));
        });
      }
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

  const getOrderedRefs = () => {
    const list: Array<HTMLButtonElement | null> = [hourRef.current, minuteRef.current];
    if (seconds) list.push(secondRef.current);
    if (format === '12h') list.push(periodRef.current);
    return list.filter((el): el is HTMLButtonElement => Boolean(el));
  };

  const commitParts = (next: { hour: number; minute: number; second: number } | null) => {
    setCurrent(next ? formatTimeValue(next, seconds) : null);
  };

  const handleSegmentKeyDown = (
    segment: 'hour' | 'minute' | 'second' | 'period',
    e: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (isDisabled) return;
    const refs = getOrderedRefs();
    const idx = refs.indexOf(e.currentTarget);

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      digitBufferRef.current = '';
      if (idx > 0) refs[idx - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      digitBufferRef.current = '';
      if (idx >= 0 && idx < refs.length - 1) refs[idx + 1]?.focus();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      digitBufferRef.current = '';
      commitParts(stepTimePart(parsed, segment, e.key === 'ArrowUp' ? 1 : -1, minuteStep));
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      digitBufferRef.current = '';
      commitParts(null);
      return;
    }
    if (segment === 'period') {
      if (/^[aApP]$/.test(e.key)) {
        e.preventDefault();
        const base = parsed ?? { hour: 9, minute: 0, second: 0 };
        const { hour12 } = to12HourDisplay(base.hour);
        const nextPeriod = e.key.toLowerCase() === 'a' ? 'AM' : 'PM';
        commitParts({ ...base, hour: from12HourDisplay(hour12, nextPeriod) });
      } else if (e.key === ' ') {
        e.preventDefault();
        commitParts(stepTimePart(parsed, 'period', 1, minuteStep));
      }
      return;
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const res = applyDigitToSegment({
        digit: Number(e.key),
        buffer: digitBufferRef.current,
        segment,
        format,
        current: parsed,
      });
      digitBufferRef.current = res.nextBuffer;
      commitParts(res.parts);
      if (res.advance && idx >= 0 && idx < refs.length - 1) {
        refs[idx + 1]?.focus();
      }
    }
  };

  return (
    <>
      <div
        ref={mergeRefs(shellRef, ref)}
        className={cx('j-time-picker', className)}
        style={style}
        data-j-managed=""
        data-format={format}
        data-size={sizeAttr(size)}
        data-tone={tone}
        data-open={flag(open)}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-invalid={isInvalid ? 'true' : undefined}
        onClick={(e) => {
          if (e.target === shellRef.current) hourRef.current?.focus();
        }}
        {...rest}
      >
        {name && <input type="hidden" name={name} value={current ?? ''} />}

        <div
          className="j-time-picker__segments"
          role="group"
          aria-describedby={field['aria-describedby']}
        >
          <button
            id={field.id}
            ref={hourRef}
            type="button"
            role="spinbutton"
            className="j-time-picker__segment"
            data-segment="hour"
            aria-label="Hours"
            data-empty={flag(!parsed)}
            aria-valuemin={format === '12h' ? 1 : 0}
            aria-valuemax={format === '12h' ? 12 : 23}
            aria-valuenow={
              parsed ? (format === '12h' ? display12!.hour12 : parsed.hour) : undefined
            }
            aria-invalid={field['aria-invalid']}
            disabled={isDisabled || undefined}
            onBlur={() => {
              digitBufferRef.current = '';
            }}
            onKeyDown={(e) => handleSegmentKeyDown('hour', e)}
          >
            {hourText}
          </button>

          <span className="j-time-picker__sep" aria-hidden="true">
            :
          </span>

          <button
            ref={minuteRef}
            type="button"
            role="spinbutton"
            className="j-time-picker__segment"
            data-segment="minute"
            aria-label="Minutes"
            data-empty={flag(!parsed)}
            aria-valuemin={0}
            aria-valuemax={59}
            aria-valuenow={parsed?.minute}
            disabled={isDisabled || undefined}
            onBlur={() => {
              digitBufferRef.current = '';
            }}
            onKeyDown={(e) => handleSegmentKeyDown('minute', e)}
          >
            {minuteText}
          </button>

          {seconds && (
            <>
              <span className="j-time-picker__sep" aria-hidden="true">
                :
              </span>
              <button
                ref={secondRef}
                type="button"
                role="spinbutton"
                className="j-time-picker__segment"
                data-segment="second"
                aria-label="Seconds"
                data-empty={flag(!parsed)}
                aria-valuemin={0}
                aria-valuemax={59}
                aria-valuenow={parsed?.second}
                disabled={isDisabled || undefined}
                onBlur={() => {
                  digitBufferRef.current = '';
                }}
                onKeyDown={(e) => handleSegmentKeyDown('second', e)}
              >
                {secondText}
              </button>
            </>
          )}

          {format === '12h' && (
            <button
              ref={periodRef}
              type="button"
              role="spinbutton"
              className="j-time-picker__segment"
              data-segment="period"
              aria-label="AM or PM"
              data-empty={flag(!parsed)}
              aria-valuetext={periodText}
              disabled={isDisabled || undefined}
              onBlur={() => {
                digitBufferRef.current = '';
              }}
              onKeyDown={(e) => handleSegmentKeyDown('period', e)}
            >
              {periodText}
            </button>
          )}
        </div>

        <div className="j-time-picker__controls">
          {clearable && !isDisabled && Boolean(parsed) && (
            <button
              type="button"
              className="j-time-picker__clear"
              aria-label="Clear time"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                digitBufferRef.current = '';
                commitParts(null);
                hourRef.current?.focus();
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

          <button
            type="button"
            className="j-time-picker__trigger"
            aria-label="Open time picker"
            aria-haspopup="dialog"
            aria-expanded={open ? 'true' : 'false'}
            aria-controls={popId}
            disabled={isDisabled || undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (open) hidePopover();
              else showPopover();
            }}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="5.75" />
              <path d="M8 4.75V8l2.25 1.5" />
            </svg>
          </button>
        </div>
      </div>

      <div
        id={popId}
        ref={popoverRef}
        className="j-time-picker__popover"
        popover="auto"
        data-align="start"
        data-tone={tone}
      >
        <div className="j-time-picker__columns">
          <div className="j-time-picker__col">
            <div className="j-time-picker__col-label">HR</div>
            <div className="j-time-picker__col-list">
              {hourOptions.map((h) => (
                <button
                  key={h}
                  type="button"
                  className="j-time-picker__cell"
                  aria-selected={
                    parsed && (format === '12h' ? display12!.hour12 === h : parsed.hour === h)
                      ? 'true'
                      : 'false'
                  }
                  onClick={() => {
                    const base = parsed ?? { hour: 9, minute: 0, second: 0 };
                    if (format === '12h') {
                      const { period } = to12HourDisplay(base.hour);
                      commitParts({ ...base, hour: from12HourDisplay(h, period) });
                    } else {
                      commitParts({ ...base, hour: h });
                    }
                  }}
                >
                  {padTime(h)}
                </button>
              ))}
            </div>
          </div>

          <div className="j-time-picker__col">
            <div className="j-time-picker__col-label">MIN</div>
            <div className="j-time-picker__col-list">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="j-time-picker__cell"
                  aria-selected={parsed && parsed.minute === m ? 'true' : 'false'}
                  onClick={() => {
                    const base = parsed ?? { hour: 9, minute: 0, second: 0 };
                    commitParts({ ...base, minute: m });
                  }}
                >
                  {padTime(m)}
                </button>
              ))}
            </div>
          </div>

          {seconds && (
            <div className="j-time-picker__col">
              <div className="j-time-picker__col-label">SEC</div>
              <div className="j-time-picker__col-list">
                {secondOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="j-time-picker__cell"
                    aria-selected={parsed && parsed.second === s ? 'true' : 'false'}
                    onClick={() => {
                      const base = parsed ?? { hour: 9, minute: 0, second: 0 };
                      commitParts({ ...base, second: s });
                    }}
                  >
                    {padTime(s)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {format === '12h' && (
            <div className="j-time-picker__col">
              <div className="j-time-picker__col-label">MER</div>
              <div className="j-time-picker__col-list">
                {(['AM', 'PM'] as const).map((per) => (
                  <button
                    key={per}
                    type="button"
                    className="j-time-picker__cell"
                    aria-selected={parsed && display12!.period === per ? 'true' : 'false'}
                    onClick={() => {
                      const base = parsed ?? { hour: 9, minute: 0, second: 0 };
                      const { hour12 } = to12HourDisplay(base.hour);
                      commitParts({ ...base, hour: from12HourDisplay(hour12, per) });
                    }}
                  >
                    {per}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="j-time-picker__footer">
          <button
            type="button"
            className="j-time-picker__action"
            disabled={!parsed || undefined}
            onClick={() => {
              digitBufferRef.current = '';
              commitParts(null);
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="j-time-picker__action"
            data-primary=""
            onClick={() => {
              setCurrent(nowTimeValue(seconds, minuteStep));
              hidePopover();
            }}
          >
            Now
          </button>
        </div>
      </div>
    </>
  );
}
