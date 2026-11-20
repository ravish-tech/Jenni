// Date Picker & Calendar behavior.
// Supports standalone `.j-calendar` (`mode="single"` | `mode="range"`) and
// anchored `.j-date-picker` + `.j-date-picker__popover` (`popover="auto"`).

import { anchorPopover } from './anchor.js';

/**
 * @typedef {'accent' | 'neutral' | 'danger' | 'success' | 'warning' | 'info'} CalendarTone
 * @typedef {{ year: number, month: number, day: number }} DateParts
 * @typedef {{ start: string | null, end: string | null }} DateRange
 * @typedef {{
 *   iso: string,
 *   day: number,
 *   outside: boolean,
 *   today: boolean,
 *   disabled: boolean
 * }} CalendarCell
 * @typedef {{ tone?: CalendarTone, color?: string, label?: string }} NormalizedCalendarMarker
 * @typedef {CalendarTone | NormalizedCalendarMarker} CalendarMarkerItem
 * @typedef {boolean | number | CalendarMarkerItem | readonly CalendarMarkerItem[]} CalendarMarkerInput
 * @typedef {Record<string, CalendarMarkerInput> | ReadonlySet<string> | readonly string[] | ((isoDate: string) => CalendarMarkerInput | undefined | null)} CalendarMarkers
 */

const VALID_MARKER_TONES = new Set([
  'accent',
  'neutral',
  'danger',
  'success',
  'warning',
  'info',
]);

/**
 * Pad a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Number of days in `month` (1–12) of `year`.
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Parse a `YYYY-MM-DD` string into `{ year, month, day }` (1-based month), or `null`.
 * @param {string | null | undefined} raw
 * @returns {DateParts | null}
 */
export function parseIsoDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  return { year, month, day };
}

/**
 * Format `{ year, month, day }` as `YYYY-MM-DD`.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {string}
 */
export function formatIsoDate(year, month, day) {
  return `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Return local today as `YYYY-MM-DD`.
 * @returns {string}
 */
export function todayIso() {
  const now = new Date();
  return formatIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Check whether an ISO date falls outside `[min, max]`.
 * @param {string} iso
 * @param {string | undefined} [min]
 * @param {string | undefined} [max]
 * @returns {boolean}
 */
export function isDateDisabled(iso, min, max) {
  if (min && parseIsoDate(min) && iso < min) return true;
  if (max && parseIsoDate(max) && iso > max) return true;
  return false;
}

/**
 * Add `deltaDays` to an ISO date string.
 * @param {string} iso
 * @param {number} deltaDays
 * @returns {string}
 */
export function addDaysIso(iso, deltaDays) {
  const p = parseIsoDate(iso);
  if (!p) return todayIso();
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + deltaDays));
  return formatIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Add `deltaMonths` to an ISO date string, clamping day to month length.
 * @param {string} iso
 * @param {number} deltaMonths
 * @returns {string}
 */
export function addMonthsClamped(iso, deltaMonths) {
  const p = parseIsoDate(iso);
  if (!p) return todayIso();
  const total = p.year * 12 + (p.month - 1) + deltaMonths;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12 + 1;
  const day = Math.min(p.day, daysInMonth(year, month));
  return formatIsoDate(year, month, day);
}

/**
 * Shift `{ year, month }` by `deltaMonths`.
 * @param {number} year
 * @param {number} month
 * @param {number} deltaMonths
 * @returns {{ year: number, month: number }}
 */
export function shiftYearMonth(year, month, deltaMonths) {
  const total = year * 12 + (month - 1) + deltaMonths;
  return {
    year: Math.floor(total / 12),
    month: ((total % 12) + 12) % 12 + 1,
  };
}

/**
 * Compute next focused ISO date from a WAI-ARIA calendar grid key press, or `null` if unhandled.
 * @param {string} focusedIso
 * @param {string} key
 * @param {boolean} shiftKey
 * @param {0 | 1} [weekStartsOn]
 * @returns {string | null}
 */
export function stepFocusedDate(focusedIso, key, shiftKey, weekStartsOn = 0) {
  switch (key) {
    case 'ArrowLeft':
      return addDaysIso(focusedIso, -1);
    case 'ArrowRight':
      return addDaysIso(focusedIso, 1);
    case 'ArrowUp':
      return addDaysIso(focusedIso, -7);
    case 'ArrowDown':
      return addDaysIso(focusedIso, 7);
    case 'PageUp':
      return addMonthsClamped(focusedIso, shiftKey ? -12 : -1);
    case 'PageDown':
      return addMonthsClamped(focusedIso, shiftKey ? 12 : 1);
    case 'Home': {
      const p = parseIsoDate(focusedIso);
      if (!p) return null;
      const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
      const offset = (dow - weekStartsOn + 7) % 7;
      return addDaysIso(focusedIso, -offset);
    }
    case 'End': {
      const p = parseIsoDate(focusedIso);
      if (!p) return null;
      const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
      const offset = 6 - ((dow - weekStartsOn + 7) % 7);
      return addDaysIso(focusedIso, offset);
    }
    default:
      return null;
  }
}

/**
 * Build a 6-row × 7-column calendar matrix for `(year, month)`.
 * @param {number} year
 * @param {number} month
 * @param {{ weekStartsOn?: 0 | 1, min?: string, max?: string, today?: string }} [opts]
 * @returns {CalendarCell[][]}
 */
export function buildCalendarGrid(year, month, opts = {}) {
  const weekStartsOn = opts.weekStartsOn ?? 0;
  const today = opts.today ?? todayIso();
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const lead = (firstDow - weekStartsOn + 7) % 7;
  const firstCellDate = new Date(Date.UTC(year, month - 1, 1 - lead));

  /** @type {CalendarCell[][]} */
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    /** @type {CalendarCell[]} */
    const row = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(
        Date.UTC(
          firstCellDate.getUTCFullYear(),
          firstCellDate.getUTCMonth(),
          firstCellDate.getUTCDate() + w * 7 + d,
        ),
      );
      const cy = cur.getUTCFullYear();
      const cm = cur.getUTCMonth() + 1;
      const cd = cur.getUTCDate();
      const iso = formatIsoDate(cy, cm, cd);
      row.push({
        iso,
        day: cd,
        outside: cy !== year || cm !== month,
        today: iso === today,
        disabled: isDateDisabled(iso, opts.min, opts.max),
      });
    }
    weeks.push(row);
  }
  return weeks;
}

/**
 * Short 2-character weekday headers starting on `weekStartsOn`.
 * @param {0 | 1} [weekStartsOn]
 * @param {string} [locale]
 * @returns {{ short: string, long: string }[]}
 */
export function getWeekdayLabels(weekStartsOn = 0, locale = 'en-US') {
  const shortFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const longFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
  /** @type {{ short: string, long: string }[]} */
  const labels = [];
  // 2023-01-01 was a Sunday in UTC.
  for (let i = 0; i < 7; i++) {
    const dow = (weekStartsOn + i) % 7;
    const d = new Date(Date.UTC(2023, 0, 1 + dow));
    labels.push({
      short: shortFmt.format(d).slice(0, 2),
      long: longFmt.format(d),
    });
  }
  return labels;
}

/**
 * Format `(year, month)` into a localized header title (e.g. "November 2026").
 * @param {number} year
 * @param {number} month
 * @param {string} [locale]
 * @returns {string}
 */
export function formatMonthTitle(year, month, locale = 'en-US') {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * Format an ISO date for trigger/accessible labels (e.g. "Nov 12, 2026").
 * @param {string | null | undefined} iso
 * @param {string} [locale]
 * @returns {string}
 */
export function formatDisplayDate(iso, locale = 'en-US') {
  const p = parseIsoDate(iso);
  if (!p) return '';
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * Format a `{ start, end }` range for trigger display.
 * @param {DateRange | null | undefined} range
 * @param {string} [locale]
 * @returns {string}
 */
export function formatDisplayRange(range, locale = 'en-US') {
  if (!range || (!range.start && !range.end)) return '';
  const s = range.start ? formatDisplayDate(range.start, locale) : '…';
  const e = range.end ? formatDisplayDate(range.end, locale) : '…';
  return `${s} – ${e}`;
}

/**
 * Normalize day activity markers for `iso` (`YYYY-MM-DD`) into up to 3 `{ tone, color, label }` items.
 * @param {CalendarMarkers | null | undefined} markers
 * @param {string} iso
 * @returns {NormalizedCalendarMarker[]}
 */
export function normalizeDayMarkers(markers, iso) {
  if (!markers || !iso) return [];
  const raw =
    typeof markers === 'function'
      ? markers(iso)
      : markers instanceof Set
        ? markers.has(iso)
        : Array.isArray(markers)
          ? markers.includes(iso)
          : markers[iso];
  if (raw == null || raw === false || raw === 0) return [];
  if (raw === true) return [{ tone: 'accent' }];
  if (typeof raw === 'number') {
    const count = Math.max(0, Math.min(3, Math.floor(raw)));
    /** @type {NormalizedCalendarMarker[]} */
    const out = [];
    for (let i = 0; i < count; i++) out.push({ tone: 'accent' });
    return out;
  }
  const items = Array.isArray(raw) ? raw : [raw];
  /** @type {NormalizedCalendarMarker[]} */
  const result = [];
  for (const item of items) {
    if (result.length >= 3) break;
    if (!item) continue;
    if (typeof item === 'string') {
      if (VALID_MARKER_TONES.has(item)) {
        result.push({ tone: /** @type {CalendarTone} */ (item) });
      } else {
        result.push({ color: item });
      }
    } else if (typeof item === 'object') {
      /** @type {NormalizedCalendarMarker} */
      const norm = {};
      if (typeof item.tone === 'string' && VALID_MARKER_TONES.has(item.tone)) {
        norm.tone = /** @type {CalendarTone} */ (item.tone);
      } else if (!item.color) {
        norm.tone = 'accent';
      }
      if (typeof item.color === 'string' && item.color) norm.color = item.color;
      if (typeof item.label === 'string' && item.label) norm.label = item.label;
      result.push(norm);
    }
  }
  return result;
}

/**
 * Format an accessible label for a calendar day cell, appending marker labels or counts when present.
 * @param {string} iso
 * @param {string} [locale]
 * @param {NormalizedCalendarMarker[]} [dayMarkers]
 * @returns {string}
 */
export function formatDayAriaLabel(iso, locale = 'en-US', dayMarkers = []) {
  const base = formatDisplayDate(iso, locale);
  if (!dayMarkers || dayMarkers.length === 0) return base;
  const labels = dayMarkers.map((m) => m.label).filter(Boolean);
  if (labels.length === dayMarkers.length) {
    return `${base}, ${labels.join(', ')}`;
  }
  if (labels.length > 0) {
    return `${base}, ${labels.join(', ')} (${dayMarkers.length} markers)`;
  }
  return `${base}, ${dayMarkers.length} ${dayMarkers.length === 1 ? 'marker' : 'markers'}`;
}

/**
 * Wire anchor positioning for a DatePicker shell and its `[popover]` panel.
 * @param {HTMLElement} shell
 * @param {HTMLElement} popover
 * @param {{ side?: string }} [options]
 * @returns {() => void}
 */
export function anchorDatePopover(shell, popover, options = {}) {
  if (!popover.hasAttribute('popover')) popover.setAttribute('popover', 'auto');
  if (!popover.dataset.align) popover.dataset.align = 'start';
  return anchorPopover(shell, popover, { side: options.side || 'bottom' });
}

/**
 * Create an interactive standalone `.j-calendar` inside `root` for plain HTML.
 * @param {HTMLElement} root
 * @param {{
 *   mode?: 'single' | 'range',
 *   value?: string | DateRange | null,
 *   min?: string,
 *   max?: string,
 *   weekStartsOn?: 0 | 1,
 *   showFooter?: boolean,
 *   locale?: string,
 *   markers?: CalendarMarkers,
 *   onSelect?: (val: string | DateRange | null, complete: boolean) => void
 * }} [options]
 * @returns {{ destroy: () => void, setValue: (v: string | DateRange | null) => void, getValue: () => string | DateRange | null }}
 */
export function createCalendar(root, options = {}) {
  const mode = /** @type {'single' | 'range'} */ (
    options.mode || root.dataset.mode || 'single'
  );
  const min = options.min ?? root.dataset.min;
  const max = options.max ?? root.dataset.max;
  const weekStartsOn = /** @type {0 | 1} */ (
    options.weekStartsOn ?? (root.dataset.weekStartsOn === '1' ? 1 : 0)
  );
  const showFooter = options.showFooter ?? root.dataset.footer !== 'false';
  const locale = options.locale || root.dataset.locale || 'en-US';

  /** @type {string | null} */
  let singleVal =
    mode === 'single'
      ? typeof options.value === 'string'
        ? options.value
        : root.dataset.value || null
      : null;

  /** @type {DateRange} */
  let rangeVal =
    mode === 'range'
      ? options.value && typeof options.value === 'object'
        ? { start: options.value.start ?? null, end: options.value.end ?? null }
        : { start: root.dataset.start || null, end: root.dataset.end || null }
      : { start: null, end: null };

  /** @type {string | null} */
  let hoverIso = null;

  const seedIso =
    (mode === 'single' ? singleVal : rangeVal.start || rangeVal.end) || todayIso();
  const seedParts = parseIsoDate(seedIso) || parseIsoDate(todayIso()) || {
    year: 2026,
    month: 1,
    day: 1,
  };

  let viewYear = seedParts.year;
  let viewMonth = seedParts.month;
  let focusedIso = formatIsoDate(seedParts.year, seedParts.month, seedParts.day);

  const header = document.createElement('div');
  header.className = 'j-calendar__header';
  const titleEl = document.createElement('div');
  titleEl.className = 'j-calendar__title';
  titleEl.setAttribute('aria-live', 'polite');

  const nav = document.createElement('div');
  nav.className = 'j-calendar__nav';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'j-calendar__nav-btn';
  prevBtn.setAttribute('aria-label', 'Previous month');
  prevBtn.textContent = '‹';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'j-calendar__nav-btn';
  nextBtn.setAttribute('aria-label', 'Next month');
  nextBtn.textContent = '›';
  nav.append(prevBtn, nextBtn);
  header.append(titleEl, nav);

  const grid = document.createElement('div');
  grid.className = 'j-calendar__grid';
  grid.setAttribute('role', 'grid');

  const weekdaysRow = document.createElement('div');
  weekdaysRow.className = 'j-calendar__weekdays';
  weekdaysRow.setAttribute('role', 'row');
  for (const w of getWeekdayLabels(weekStartsOn, locale)) {
    const th = document.createElement('div');
    th.className = 'j-calendar__weekday';
    th.setAttribute('role', 'columnheader');
    th.setAttribute('aria-label', w.long);
    th.textContent = w.short;
    weekdaysRow.appendChild(th);
  }

  const rowsWrap = document.createElement('div');
  rowsWrap.style.display = 'contents';
  grid.append(weekdaysRow, rowsWrap);

  const footer = document.createElement('div');
  footer.className = 'j-calendar__footer';
  const summaryEl = document.createElement('span');
  summaryEl.className = 'j-calendar__summary';
  const actionsWrap = document.createElement('div');
  actionsWrap.className = 'j-calendar__footer-actions';
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'j-calendar__action';
  clearBtn.textContent = 'Clear';
  const todayBtn = document.createElement('button');
  todayBtn.type = 'button';
  todayBtn.className = 'j-calendar__action';
  todayBtn.dataset.primary = '';
  todayBtn.textContent = 'Today';
  actionsWrap.append(clearBtn, todayBtn);
  footer.append(summaryEl, actionsWrap);

  root.replaceChildren(header, grid);
  if (showFooter) root.appendChild(footer);

  /**
   * @param {boolean} [focusActive]
   */
  function render(focusActive = false) {
    titleEl.textContent = formatMonthTitle(viewYear, viewMonth, locale);
    grid.setAttribute('aria-label', titleEl.textContent);

    const weeks = buildCalendarGrid(viewYear, viewMonth, { weekStartsOn, min, max });
    const frag = document.createDocumentFragment();

    const effStart = rangeVal.start;
    const effEnd =
      rangeVal.start && !rangeVal.end && hoverIso ? hoverIso : rangeVal.end;
    const normStart = effStart && effEnd && effEnd < effStart ? effEnd : effStart;
    const normEnd = effStart && effEnd && effEnd < effStart ? effStart : effEnd;

    for (const week of weeks) {
      const rowEl = document.createElement('div');
      rowEl.className = 'j-calendar__row';
      rowEl.setAttribute('role', 'row');
      for (const cell of week) {
        const dayMarkers = normalizeDayMarkers(options.markers, cell.iso);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'j-calendar__day';
        btn.setAttribute('role', 'gridcell');
        btn.dataset.date = cell.iso;
        btn.tabIndex = cell.iso === focusedIso ? 0 : -1;
        btn.setAttribute('aria-label', formatDayAriaLabel(cell.iso, locale, dayMarkers));
        if (cell.outside) btn.dataset.outside = '';
        if (cell.today) btn.dataset.today = '';
        if (cell.disabled) {
          btn.disabled = true;
          btn.setAttribute('aria-disabled', 'true');
        }

        if (mode === 'single') {
          const sel = singleVal === cell.iso;
          btn.setAttribute('aria-selected', sel ? 'true' : 'false');
          if (sel) btn.dataset.selected = '';
        } else {
          const isStart = Boolean(normStart && cell.iso === normStart);
          const isEnd = Boolean(normEnd && cell.iso === normEnd);
          const inRange = Boolean(
            normStart && normEnd && cell.iso >= normStart && cell.iso <= normEnd,
          );
          btn.setAttribute('aria-selected', isStart || isEnd || inRange ? 'true' : 'false');
          if (inRange) btn.dataset.inRange = '';
          if (isStart) btn.dataset.rangeStart = '';
          if (isEnd) btn.dataset.rangeEnd = '';
        }

        const span = document.createElement('span');
        span.className = 'j-calendar__day-num';
        span.textContent = String(cell.day);
        btn.appendChild(span);

        if (dayMarkers.length > 0) {
          const dotsWrap = document.createElement('span');
          dotsWrap.className = 'j-calendar__dots';
          dotsWrap.setAttribute('aria-hidden', 'true');
          for (const m of dayMarkers) {
            const dot = document.createElement('span');
            dot.className = 'j-calendar__dot';
            if (m.tone) dot.dataset.tone = m.tone;
            if (m.color) dot.style.setProperty('--_dot-color', m.color);
            dotsWrap.appendChild(dot);
          }
          btn.appendChild(dotsWrap);
        }

        rowEl.appendChild(btn);
      }
      frag.appendChild(rowEl);
    }
    rowsWrap.replaceChildren(frag);

    if (showFooter) {
      const today = todayIso();
      todayBtn.disabled = isDateDisabled(today, min, max);
      const hasVal =
        mode === 'single' ? Boolean(singleVal) : Boolean(rangeVal.start || rangeVal.end);
      clearBtn.disabled = !hasVal;
      summaryEl.textContent =
        mode === 'single'
          ? singleVal
            ? formatDisplayDate(singleVal, locale)
            : 'No date'
          : rangeVal.start || rangeVal.end
            ? formatDisplayRange(rangeVal, locale)
            : 'Select range';
    }

    if (focusActive) {
      const target = /** @type {HTMLElement | null} */ (
        rowsWrap.querySelector(`[data-date="${focusedIso}"]`)
      );
      target?.focus();
    }
  }

  /**
   * @param {boolean} complete
   */
  function emitChange(complete) {
    const val = mode === 'single' ? singleVal : { ...rangeVal };
    options.onSelect?.(val, complete);
    root.dispatchEvent(
      new CustomEvent('j-change', {
        bubbles: true,
        detail: { value: val, complete },
      }),
    );
  }

  /**
   * @param {string} iso
   */
  function selectIso(iso) {
    if (isDateDisabled(iso, min, max)) return;
    const p = parseIsoDate(iso);
    if (p) {
      viewYear = p.year;
      viewMonth = p.month;
    }
    focusedIso = iso;
    if (mode === 'single') {
      singleVal = iso;
      render(true);
      emitChange(true);
    } else {
      if (!rangeVal.start || (rangeVal.start && rangeVal.end)) {
        rangeVal = { start: iso, end: null };
        hoverIso = null;
        render(true);
        emitChange(false);
      } else {
        const s = rangeVal.start;
        rangeVal = iso < s ? { start: iso, end: s } : { start: s, end: iso };
        hoverIso = null;
        render(true);
        emitChange(true);
      }
    }
  }

  const onPrev = () => {
    const next = shiftYearMonth(viewYear, viewMonth, -1);
    viewYear = next.year;
    viewMonth = next.month;
    focusedIso = addMonthsClamped(focusedIso, -1);
    render(false);
  };

  const onNext = () => {
    const next = shiftYearMonth(viewYear, viewMonth, 1);
    viewYear = next.year;
    viewMonth = next.month;
    focusedIso = addMonthsClamped(focusedIso, 1);
    render(false);
  };

  /** @param {MouseEvent} e */
  const onGridClick = (e) => {
    const btn = /** @type {HTMLButtonElement | null} */ (
      e.target instanceof Element ? e.target.closest('.j-calendar__day') : null
    );
    if (!btn || btn.disabled || !btn.dataset.date) return;
    selectIso(btn.dataset.date);
  };

  /** @param {PointerEvent} e */
  const onGridOver = (e) => {
    if (mode !== 'range' || !rangeVal.start || rangeVal.end) return;
    const btn = /** @type {HTMLButtonElement | null} */ (
      e.target instanceof Element ? e.target.closest('.j-calendar__day') : null
    );
    const iso = btn && !btn.disabled ? btn.dataset.date || null : null;
    if (iso && iso !== hoverIso) {
      hoverIso = iso;
      render(false);
    }
  };

  const onGridLeave = () => {
    if (hoverIso) {
      hoverIso = null;
      render(false);
    }
  };

  /** @param {KeyboardEvent} e */
  const onGridKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const btn = /** @type {HTMLButtonElement | null} */ (
        e.target instanceof Element ? e.target.closest('.j-calendar__day') : null
      );
      if (btn?.dataset.date && !btn.disabled) {
        e.preventDefault();
        selectIso(btn.dataset.date);
      }
      return;
    }
    const nextIso = stepFocusedDate(focusedIso, e.key, e.shiftKey, weekStartsOn);
    if (!nextIso) return;
    e.preventDefault();
    focusedIso = nextIso;
    const np = parseIsoDate(nextIso);
    if (np) {
      viewYear = np.year;
      viewMonth = np.month;
    }
    render(true);
  };

  const onToday = () => {
    const t = todayIso();
    if (isDateDisabled(t, min, max)) return;
    if (mode === 'single') {
      selectIso(t);
    } else {
      const tp = parseIsoDate(t);
      if (tp) {
        viewYear = tp.year;
        viewMonth = tp.month;
      }
      focusedIso = t;
      rangeVal = { start: t, end: t };
      render(false);
      emitChange(true);
    }
  };

  const onClear = () => {
    if (mode === 'single') singleVal = null;
    else rangeVal = { start: null, end: null };
    hoverIso = null;
    render(false);
    emitChange(false);
  };

  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  grid.addEventListener('click', onGridClick);
  grid.addEventListener('pointerover', onGridOver);
  grid.addEventListener('pointerleave', onGridLeave);
  grid.addEventListener('keydown', onGridKeydown);
  todayBtn.addEventListener('click', onToday);
  clearBtn.addEventListener('click', onClear);

  render(false);

  return {
    destroy() {
      prevBtn.removeEventListener('click', onPrev);
      nextBtn.removeEventListener('click', onNext);
      grid.removeEventListener('click', onGridClick);
      grid.removeEventListener('pointerover', onGridOver);
      grid.removeEventListener('pointerleave', onGridLeave);
      grid.removeEventListener('keydown', onGridKeydown);
      todayBtn.removeEventListener('click', onToday);
      clearBtn.removeEventListener('click', onClear);
    },
    /** @param {string | DateRange | null} v */
    setValue(v) {
      if (mode === 'single') {
        singleVal = typeof v === 'string' && v ? v : null;
        const p = parseIsoDate(singleVal);
        if (p) {
          viewYear = p.year;
          viewMonth = p.month;
          focusedIso = singleVal || focusedIso;
        }
      } else {
        rangeVal =
          v && typeof v === 'object'
            ? { start: v.start ?? null, end: v.end ?? null }
            : { start: null, end: null };
        const p = parseIsoDate(rangeVal.start || rangeVal.end);
        if (p) {
          viewYear = p.year;
          viewMonth = p.month;
        }
      }
      render(false);
    },
    getValue() {
      return mode === 'single' ? singleVal : { ...rangeVal };
    },
  };
}

/**
 * Connect a `.j-date-picker` trigger shell and its `.j-date-picker__popover` for plain HTML.
 * @param {HTMLElement} root
 * @param {HTMLElement} [popoverEl]
 * @returns {() => void}
 */
export function createDatePicker(root, popoverEl) {
  const trigger = /** @type {HTMLButtonElement | null} */ (
    root.querySelector('.j-date-picker__trigger')
  );
  const valueEl = /** @type {HTMLElement | null} */ (
    root.querySelector('.j-date-picker__value')
  );
  const clearBtn = /** @type {HTMLButtonElement | null} */ (
    root.querySelector('.j-date-picker__clear')
  );
  const popId =
    trigger?.getAttribute('popovertarget') ||
    trigger?.getAttribute('aria-controls') ||
    root.dataset.jDatePicker;
  const popover =
    popoverEl ||
    (popId ? document.getElementById(popId) : null) ||
    /** @type {HTMLElement | null} */ (
      root.nextElementSibling?.classList.contains('j-date-picker__popover')
        ? root.nextElementSibling
        : null
    );
  if (!trigger || !popover) return () => {};

  const mode = /** @type {'single' | 'range'} */ (root.dataset.mode || 'single');
  const placeholder =
    root.dataset.placeholder || (mode === 'range' ? 'Select date range' : 'Select date');
  const locale = root.dataset.locale || 'en-US';

  let calEl = /** @type {HTMLElement | null} */ (popover.querySelector('.j-calendar'));
  if (!calEl) {
    calEl = document.createElement('div');
    calEl.className = 'j-calendar';
    popover.appendChild(calEl);
  }

  /** @param {string | DateRange | null} val */
  const syncTriggerText = (val) => {
    const label =
      mode === 'single'
        ? typeof val === 'string' && val
          ? formatDisplayDate(val, locale)
          : ''
        : val && typeof val === 'object'
          ? formatDisplayRange(val, locale)
          : '';
    if (valueEl) {
      valueEl.textContent = label || placeholder;
      if (label) delete valueEl.dataset.placeholder;
      else valueEl.dataset.placeholder = '';
    }
    if (clearBtn) clearBtn.hidden = !label;
  };

  const cal = createCalendar(calEl, {
    mode,
    min: root.dataset.min,
    max: root.dataset.max,
    locale,
    onSelect(val, complete) {
      syncTriggerText(val);
      root.dispatchEvent(
        new CustomEvent('j-change', { bubbles: true, detail: { value: val } }),
      );
      if (complete && popover.matches(':popover-open')) {
        popover.hidePopover();
        trigger.focus();
      }
    },
  });

  syncTriggerText(cal.getValue());

  const stopAnchor = anchorDatePopover(root, popover);
  const onTriggerClick = () => {
    if (trigger.disabled) return;
    if (popover.matches(':popover-open')) popover.hidePopover();
    else popover.showPopover();
  };
  /** @param {Event} e */
  const onToggle = (e) => {
    const open = /** @type {ToggleEvent} */ (e).newState === 'open';
    trigger.setAttribute('aria-expanded', String(open));
    if (open) root.dataset.open = '';
    else delete root.dataset.open;
  };
  /** @param {MouseEvent} e */
  const onClearClick = (e) => {
    e.stopPropagation();
    cal.setValue(null);
    syncTriggerText(null);
    root.dispatchEvent(
      new CustomEvent('j-change', { bubbles: true, detail: { value: null } }),
    );
    trigger.focus();
  };

  trigger.addEventListener('click', onTriggerClick);
  popover.addEventListener('toggle', onToggle);
  clearBtn?.addEventListener('click', onClearClick);

  return () => {
    stopAnchor();
    cal.destroy();
    trigger.removeEventListener('click', onTriggerClick);
    popover.removeEventListener('toggle', onToggle);
    clearBtn?.removeEventListener('click', onClearClick);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const boundCalendars = new WeakMap();
/** @type {WeakMap<HTMLElement, () => void>} */
const boundPickers = new WeakMap();

/**
 * Init unmanaged `.j-date-picker` and standalone `.j-calendar` elements inside `root`.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initDatePickers(root = document) {
  /** @type {Array<() => void>} */
  const cleanups = [];

  root.querySelectorAll('.j-date-picker:not([data-j-managed])').forEach((el) => {
    const dp = /** @type {HTMLElement} */ (el);
    if (boundPickers.has(dp)) return;
    const stop = createDatePicker(dp);
    boundPickers.set(dp, stop);
    cleanups.push(() => {
      stop();
      boundPickers.delete(dp);
    });
  });

  root.querySelectorAll('.j-calendar:not([data-j-managed])').forEach((el) => {
    const cal = /** @type {HTMLElement} */ (el);
    if (cal.closest('.j-date-picker__popover') || boundCalendars.has(cal)) return;
    const ctrl = createCalendar(cal);
    const stop = () => ctrl.destroy();
    boundCalendars.set(cal, stop);
    cleanups.push(() => {
      stop();
      boundCalendars.delete(cal);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
