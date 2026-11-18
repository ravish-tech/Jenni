// Jenni — Time Picker behavior (segmented spinbutton + auto-advance + anchored column popover).

import { anchorPopover } from './anchor.js';

/**
 * @typedef {{ hour: number, minute: number, second: number }} TimeParts
 */

/**
 * Pad a number to 2 digits.
 * @param {number} n
 * @returns {string}
 */
export function padTime(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

/**
 * Parse a `HH:MM`, `HH:MM:SS`, or `H:MM AM/PM` string into 24-hour `{ hour, minute, second }`.
 * @param {string | null | undefined} raw
 * @returns {TimeParts | null}
 */
export function parseTimeValue(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  const m12 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(s);
  if (m12) {
    let h = Number(m12[1]);
    const min = Number(m12[2]);
    const sec = m12[3] != null ? Number(m12[3]) : 0;
    const mer = m12[4].toUpperCase();
    if (h < 1 || h > 12 || min > 59 || sec > 59) return null;
    if (mer === 'AM') h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
    return { hour: h, minute: min, second: sec };
  }
  const m24 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m24) return null;
  const hour = Number(m24[1]);
  const minute = Number(m24[2]);
  const second = m24[3] != null ? Number(m24[3]) : 0;
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { hour, minute, second };
}

/**
 * Format `{ hour, minute, second }` into canonical `HH:MM` or `HH:MM:SS`.
 * @param {TimeParts} parts
 * @param {boolean} [includeSeconds]
 * @returns {string}
 */
export function formatTimeValue(parts, includeSeconds = false) {
  const hh = padTime(parts.hour % 24);
  const mm = padTime(parts.minute % 60);
  if (!includeSeconds) return `${hh}:${mm}`;
  return `${hh}:${mm}:${padTime(parts.second % 60)}`;
}

/**
 * Return current local time as `HH:MM` or `HH:MM:SS`, snapped to `minuteStep` if desired.
 * @param {boolean} [includeSeconds]
 * @param {number} [minuteStep]
 * @returns {string}
 */
export function nowTimeValue(includeSeconds = false, minuteStep = 1) {
  const now = new Date();
  const step = Math.max(1, Math.floor(minuteStep));
  const minute = step > 1 ? Math.floor(now.getMinutes() / step) * step : now.getMinutes();
  return formatTimeValue(
    { hour: now.getHours(), minute, second: now.getSeconds() },
    includeSeconds,
  );
}

/**
 * Convert 24-hour `0..23` to `{ hour12: 1..12, period: 'AM' | 'PM' }`.
 * @param {number} hour24
 * @returns {{ hour12: number, period: 'AM' | 'PM' }}
 */
export function to12HourDisplay(hour24) {
  const h = ((hour24 % 24) + 24) % 24;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return { hour12, period };
}

/**
 * Convert `1..12` + `'AM' | 'PM'` back to `0..23`.
 * @param {number} hour12
 * @param {'AM' | 'PM'} period
 * @returns {number}
 */
export function from12HourDisplay(hour12, period) {
  const clamped = Math.min(12, Math.max(1, hour12));
  if (period === 'AM') return clamped === 12 ? 0 : clamped;
  return clamped === 12 ? 12 : clamped + 12;
}

/**
 * Build hour option numbers for `24h` (`0..23`) or `12h` (`1..12`).
 * @param {'24h' | '12h'} format
 * @returns {number[]}
 */
export function buildHourOptions(format) {
  if (format === '12h') return [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Build minute/second option numbers stepped by `step`.
 * @param {number} [step]
 * @returns {number[]}
 */
export function buildMinuteOptions(step = 1) {
  const safe = Math.max(1, Math.min(30, Math.floor(step)));
  /** @type {number[]} */
  const out = [];
  for (let m = 0; m < 60; m += safe) out.push(m);
  return out;
}

/**
 * Step one segment of `parts` (`hour`, `minute`, `second`, `period`).
 * @param {TimeParts | null} parts
 * @param {'hour' | 'minute' | 'second' | 'period'} segment
 * @param {number} delta
 * @param {number} [minuteStep]
 * @returns {TimeParts}
 */
export function stepTimePart(parts, segment, delta, minuteStep = 1) {
  const base = parts ?? { hour: 9, minute: 0, second: 0 };
  if (segment === 'hour') {
    return { ...base, hour: (((base.hour + delta) % 24) + 24) % 24 };
  }
  if (segment === 'minute') {
    const step = Math.max(1, Math.floor(minuteStep));
    const snapped =
      delta > 0
        ? (Math.floor(base.minute / step) + delta) * step
        : (Math.ceil(base.minute / step) + delta) * step;
    return { ...base, minute: ((snapped % 60) + 60) % 60 };
  }
  if (segment === 'second') {
    return { ...base, second: (((base.second + delta) % 60) + 60) % 60 };
  }
  return { ...base, hour: (base.hour + 12) % 24 };
}

/**
 * Handle a numeric digit keystroke on a spinbutton segment, returning updated `parts`
 * and whether focus should auto-advance to the next segment.
 * @param {{
 *   digit: number,
 *   buffer: string,
 *   segment: 'hour' | 'minute' | 'second',
 *   format: '24h' | '12h',
 *   current: TimeParts | null
 * }} ctx
 * @returns {{ parts: TimeParts, nextBuffer: string, advance: boolean }}
 */
export function applyDigitToSegment(ctx) {
  const base = ctx.current ?? { hour: 0, minute: 0, second: 0 };
  const d = ctx.digit;

  if (ctx.segment === 'hour') {
    if (ctx.format === '12h') {
      const { period } = to12HourDisplay(base.hour);
      if (ctx.buffer === '1' && d <= 2) {
        const h12 = 10 + d;
        return {
          parts: { ...base, hour: from12HourDisplay(h12, period) },
          nextBuffer: '',
          advance: true,
        };
      }
      if (d === 0) {
        return { parts: base, nextBuffer: '0', advance: false };
      }
      if (d === 1) {
        return {
          parts: { ...base, hour: from12HourDisplay(1, period) },
          nextBuffer: '1',
          advance: false,
        };
      }
      return {
        parts: { ...base, hour: from12HourDisplay(d, period) },
        nextBuffer: '',
        advance: true,
      };
    }

    // 24h hour
    if (ctx.buffer !== '') {
      const combined = Number(ctx.buffer) * 10 + d;
      if (combined <= 23) {
        return {
          parts: { ...base, hour: combined },
          nextBuffer: '',
          advance: true,
        };
      }
    }
    if (d <= 2) {
      return {
        parts: { ...base, hour: d },
        nextBuffer: String(d),
        advance: false,
      };
    }
    return {
      parts: { ...base, hour: d },
      nextBuffer: '',
      advance: true,
    };
  }

  // minute or second (0..59)
  const key = ctx.segment;
  if (ctx.buffer !== '') {
    const combined = Number(ctx.buffer) * 10 + d;
    if (combined <= 59) {
      return {
        parts: { ...base, [key]: combined },
        nextBuffer: '',
        advance: true,
      };
    }
  }
  if (d <= 5) {
    return {
      parts: { ...base, [key]: d },
      nextBuffer: String(d),
      advance: false,
    };
  }
  return {
    parts: { ...base, [key]: d },
    nextBuffer: '',
    advance: true,
  };
}

/**
 * Wire anchor positioning for a `.j-time-picker` shell and its `[popover]` panel.
 * @param {HTMLElement} shell
 * @param {HTMLElement} popover
 * @param {{ side?: string }} [options]
 * @returns {() => void}
 */
export function anchorTimePopover(shell, popover, options = {}) {
  if (!popover.hasAttribute('popover')) popover.setAttribute('popover', 'auto');
  if (!popover.dataset.align) popover.dataset.align = 'start';
  return anchorPopover(shell, popover, { side: options.side || 'bottom' });
}

/**
 * Hydrate an unmanaged `.j-time-picker` element (and optional `.j-time-picker__popover`) for plain HTML.
 * @param {HTMLElement} root
 * @param {HTMLElement} [popoverEl]
 * @returns {() => void}
 */
export function createTimePicker(root, popoverEl) {
  const format = /** @type {'24h' | '12h'} */ (root.dataset.format === '12h' ? '12h' : '24h');
  const includeSeconds = root.dataset.seconds === 'true' || root.hasAttribute('data-seconds');
  const minuteStep = Math.max(1, Number(root.dataset.minuteStep || 1) || 1);

  /** @type {TimeParts | null} */
  let current = parseTimeValue(root.dataset.value || null);
  let digitBuffer = '';

  const segHour = /** @type {HTMLElement | null} */ (root.querySelector('[data-segment="hour"]'));
  const segMin = /** @type {HTMLElement | null} */ (root.querySelector('[data-segment="minute"]'));
  const segSec = /** @type {HTMLElement | null} */ (root.querySelector('[data-segment="second"]'));
  const segPer = /** @type {HTMLElement | null} */ (root.querySelector('[data-segment="period"]'));
  const triggerBtn = /** @type {HTMLButtonElement | null} */ (
    root.querySelector('.j-time-picker__trigger')
  );
  const clearBtn = /** @type {HTMLButtonElement | null} */ (
    root.querySelector('.j-time-picker__clear')
  );

  const popId =
    triggerBtn?.getAttribute('popovertarget') ||
    triggerBtn?.getAttribute('aria-controls') ||
    root.dataset.jTimePicker;
  const popover =
    popoverEl ||
    (popId ? document.getElementById(popId) : null) ||
    /** @type {HTMLElement | null} */ (
      root.nextElementSibling?.classList.contains('j-time-picker__popover')
        ? root.nextElementSibling
        : null
    );

  const orderedSegments = [segHour, segMin, segSec, segPer].filter(
    /** @returns {el is HTMLElement} */ (el) => Boolean(el),
  );

  function syncSegments() {
    if (!current) {
      if (segHour) {
        segHour.textContent = '--';
        segHour.dataset.empty = '';
      }
      if (segMin) {
        segMin.textContent = '--';
        segMin.dataset.empty = '';
      }
      if (segSec) {
        segSec.textContent = '--';
        segSec.dataset.empty = '';
      }
      if (segPer) {
        segPer.textContent = 'AM';
        segPer.dataset.empty = '';
      }
      if (clearBtn) clearBtn.hidden = true;
      return;
    }

    const d12 = to12HourDisplay(current.hour);
    if (segHour) {
      segHour.textContent = padTime(format === '12h' ? d12.hour12 : current.hour);
      delete segHour.dataset.empty;
    }
    if (segMin) {
      segMin.textContent = padTime(current.minute);
      delete segMin.dataset.empty;
    }
    if (segSec) {
      segSec.textContent = padTime(current.second);
      delete segSec.dataset.empty;
    }
    if (segPer) {
      segPer.textContent = d12.period;
      delete segPer.dataset.empty;
    }
    if (clearBtn) clearBtn.hidden = false;
  }

  /** @param {TimeParts | null} next */
  function commit(next) {
    current = next;
    const formatted = next ? formatTimeValue(next, includeSeconds) : '';
    root.dataset.value = formatted;
    syncSegments();
    syncPopoverSelection();
    root.dispatchEvent(
      new CustomEvent('j-change', {
        bubbles: true,
        detail: { value: formatted || null },
      }),
    );
  }

  /** @param {HTMLElement} seg */
  function focusNextSegment(seg) {
    const idx = orderedSegments.indexOf(seg);
    if (idx >= 0 && idx < orderedSegments.length - 1) {
      orderedSegments[idx + 1]?.focus();
    }
  }

  /** @param {KeyboardEvent} e */
  const onSegmentKeydown = (e) => {
    const seg = /** @type {HTMLElement | null} */ (
      e.target instanceof Element ? e.target.closest('.j-time-picker__segment') : null
    );
    if (!seg) return;
    const type = /** @type {'hour' | 'minute' | 'second' | 'period'} */ (
      seg.dataset.segment || 'hour'
    );
    const idx = orderedSegments.indexOf(seg);

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      digitBuffer = '';
      if (idx > 0) orderedSegments[idx - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      digitBuffer = '';
      if (idx < orderedSegments.length - 1) orderedSegments[idx + 1]?.focus();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      digitBuffer = '';
      commit(stepTimePart(current, type, e.key === 'ArrowUp' ? 1 : -1, minuteStep));
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      digitBuffer = '';
      commit(null);
      return;
    }
    if (type === 'period') {
      if (/^[aApP]$/.test(e.key)) {
        e.preventDefault();
        const base = current ?? { hour: 9, minute: 0, second: 0 };
        const { hour12 } = to12HourDisplay(base.hour);
        const nextPer = e.key.toLowerCase() === 'a' ? 'AM' : 'PM';
        commit({ ...base, hour: from12HourDisplay(hour12, nextPer) });
      } else if (e.key === ' ') {
        e.preventDefault();
        commit(stepTimePart(current, 'period', 1, minuteStep));
      }
      return;
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const res = applyDigitToSegment({
        digit: Number(e.key),
        buffer: digitBuffer,
        segment: type,
        format,
        current,
      });
      digitBuffer = res.nextBuffer;
      commit(res.parts);
      if (res.advance) focusNextSegment(seg);
    }
  };

  const onSegmentFocusOut = () => {
    digitBuffer = '';
  };

  function buildPopoverContent() {
    if (!popover) return;
    const colsWrap = document.createElement('div');
    colsWrap.className = 'j-time-picker__columns';

    /**
     * @param {string} label
     * @param {string} colType
     * @param {Array<{ value: string, text: string }>} items
     */
    const addCol = (label, colType, items) => {
      const col = document.createElement('div');
      col.className = 'j-time-picker__col';
      col.dataset.col = colType;
      const head = document.createElement('div');
      head.className = 'j-time-picker__col-label';
      head.textContent = label;
      const list = document.createElement('div');
      list.className = 'j-time-picker__col-list';
      for (const item of items) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'j-time-picker__cell';
        btn.dataset.col = colType;
        btn.dataset.val = item.value;
        btn.textContent = item.text;
        list.appendChild(btn);
      }
      col.append(head, list);
      colsWrap.appendChild(col);
    };

    addCol(
      'HR',
      'hour',
      buildHourOptions(format).map((h) => ({ value: String(h), text: padTime(h) })),
    );
    addCol(
      'MIN',
      'minute',
      buildMinuteOptions(minuteStep).map((m) => ({ value: String(m), text: padTime(m) })),
    );
    if (includeSeconds) {
      addCol(
        'SEC',
        'second',
        buildMinuteOptions(1).map((s) => ({ value: String(s), text: padTime(s) })),
      );
    }
    if (format === '12h') {
      addCol('MER', 'period', [
        { value: 'AM', text: 'AM' },
        { value: 'PM', text: 'PM' },
      ]);
    }

    const footer = document.createElement('div');
    footer.className = 'j-time-picker__footer';
    const clearPopBtn = document.createElement('button');
    clearPopBtn.type = 'button';
    clearPopBtn.className = 'j-time-picker__action';
    clearPopBtn.dataset.action = 'clear';
    clearPopBtn.textContent = 'Clear';
    const nowBtn = document.createElement('button');
    nowBtn.type = 'button';
    nowBtn.className = 'j-time-picker__action';
    nowBtn.dataset.primary = '';
    nowBtn.dataset.action = 'now';
    nowBtn.textContent = 'Now';
    footer.append(clearPopBtn, nowBtn);

    popover.replaceChildren(colsWrap, footer);
  }

  function syncPopoverSelection() {
    if (!popover) return;
    const d12 = current ? to12HourDisplay(current.hour) : null;
    popover.querySelectorAll('.j-time-picker__cell').forEach((node) => {
      const btn = /** @type {HTMLElement} */ (node);
      const col = btn.dataset.col;
      const val = btn.dataset.val;
      let sel = false;
      if (current) {
        if (col === 'hour') {
          sel = Number(val) === (format === '12h' ? d12?.hour12 : current.hour);
        } else if (col === 'minute') {
          sel = Number(val) === current.minute;
        } else if (col === 'second') {
          sel = Number(val) === current.second;
        } else if (col === 'period') {
          sel = val === d12?.period;
        }
      }
      btn.setAttribute('aria-selected', sel ? 'true' : 'false');
    });
  }

  /** @param {MouseEvent} e */
  const onPopoverClick = (e) => {
    if (!popover) return;
    const target = e.target instanceof Element ? e.target : null;
    const actionBtn = /** @type {HTMLElement | null} */ (target?.closest('[data-action]'));
    if (actionBtn) {
      if (actionBtn.dataset.action === 'now') {
        commit(parseTimeValue(nowTimeValue(includeSeconds, minuteStep)));
      } else if (actionBtn.dataset.action === 'clear') {
        commit(null);
      }
      return;
    }
    const cell = /** @type {HTMLElement | null} */ (target?.closest('.j-time-picker__cell'));
    if (!cell) return;
    const base = current ?? { hour: 9, minute: 0, second: 0 };
    const col = cell.dataset.col;
    const val = cell.dataset.val || '0';
    if (col === 'hour') {
      const num = Number(val);
      if (format === '12h') {
        const { period } = to12HourDisplay(base.hour);
        commit({ ...base, hour: from12HourDisplay(num, period) });
      } else {
        commit({ ...base, hour: num });
      }
    } else if (col === 'minute') {
      commit({ ...base, minute: Number(val) });
    } else if (col === 'second') {
      commit({ ...base, second: Number(val) });
    } else if (col === 'period') {
      const { hour12 } = to12HourDisplay(base.hour);
      commit({ ...base, hour: from12HourDisplay(hour12, val === 'PM' ? 'PM' : 'AM') });
    }
  };

  /** @type {null | (() => void)} */
  let stopAnchor = null;
  if (popover) {
    buildPopoverContent();
    stopAnchor = anchorTimePopover(root, popover);
    popover.addEventListener('click', onPopoverClick);
  }

  const onTriggerClick = () => {
    if (!popover) return;
    if (popover.matches(':popover-open')) popover.hidePopover();
    else popover.showPopover();
  };

  /** @param {Event} e */
  const onToggle = (e) => {
    const open = /** @type {ToggleEvent} */ (e).newState === 'open';
    triggerBtn?.setAttribute('aria-expanded', String(open));
    if (open) {
      root.dataset.open = '';
      syncPopoverSelection();
    } else {
      delete root.dataset.open;
    }
  };

  const onClear = () => {
    commit(null);
    segHour?.focus();
  };

  syncSegments();
  syncPopoverSelection();

  root.addEventListener('keydown', onSegmentKeydown);
  root.addEventListener('focusout', onSegmentFocusOut);
  triggerBtn?.addEventListener('click', onTriggerClick);
  clearBtn?.addEventListener('click', onClear);
  popover?.addEventListener('toggle', onToggle);

  return () => {
    stopAnchor?.();
    root.removeEventListener('keydown', onSegmentKeydown);
    root.removeEventListener('focusout', onSegmentFocusOut);
    triggerBtn?.removeEventListener('click', onTriggerClick);
    clearBtn?.removeEventListener('click', onClear);
    popover?.removeEventListener('click', onPopoverClick);
    popover?.removeEventListener('toggle', onToggle);
  };
}

/** @type {WeakMap<HTMLElement, () => void>} */
const bound = new WeakMap();

/**
 * Init every unmanaged `.j-time-picker` inside `root`. Idempotent.
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initTimePickers(root = document) {
  /** @type {HTMLElement[]} */
  const made = [];
  root.querySelectorAll('.j-time-picker:not([data-j-managed])').forEach((el) => {
    const tp = /** @type {HTMLElement} */ (el);
    if (bound.has(tp)) return;
    bound.set(tp, createTimePicker(tp));
    made.push(tp);
  });
  return () =>
    made.forEach((tp) => {
      bound.get(tp)?.();
      bound.delete(tp);
    });
}
