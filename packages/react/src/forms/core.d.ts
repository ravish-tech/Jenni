declare module '@jenni/core/behaviors/segmented.js' {
  export function getSegmentedItems(root: HTMLElement): HTMLElement[];
  export function syncSegmentedIndicator(root: HTMLElement, animate?: boolean): void;
  export function segmentedKeydown(root: HTMLElement, e: KeyboardEvent): HTMLElement | null;
  export function createSegmented(root: HTMLElement): () => void;
  export function initSegmented(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/number-input.js' {
  export interface NumberBounds {
    min?: number;
    max?: number;
    step?: number;
  }
  export function clampNumberValue(value: number, opts?: NumberBounds): number;
  export function stepNumberValue(
    current: number | null | undefined,
    deltaSteps: number,
    opts?: NumberBounds,
  ): number;
  export function createNumberInput(root: HTMLElement): () => void;
  export function initNumberInputs(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/pin-input.js' {
  export function sanitizePinChars(raw: string, type?: 'numeric' | 'alphanumeric'): string[];
  export function createPinInput(root: HTMLElement): () => void;
  export function initPinInputs(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/file-upload.js' {
  export interface UploadValidationOptions {
    maxSize?: number;
    accept?: string;
  }
  export function formatFileSize(bytes: number): string;
  export function validateUploadFile(
    file: { name: string; size: number; type?: string },
    opts?: UploadValidationOptions,
  ): string | null;
  export function createFileUpload(root: HTMLElement): () => void;
  export function initFileUploads(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/date-picker.js' {
  export interface DateParts {
    year: number;
    month: number;
    day: number;
  }
  export interface DateRange {
    start: string | null;
    end: string | null;
  }
  export interface CalendarCell {
    iso: string;
    day: number;
    outside: boolean;
    today: boolean;
    disabled: boolean;
  }
  export function daysInMonth(year: number, month: number): number;
  export function parseIsoDate(raw: string | null | undefined): DateParts | null;
  export function formatIsoDate(year: number, month: number, day: number): string;
  export function todayIso(): string;
  export function isDateDisabled(iso: string, min?: string, max?: string): boolean;
  export function addDaysIso(iso: string, deltaDays: number): string;
  export function addMonthsClamped(iso: string, deltaMonths: number): string;
  export function shiftYearMonth(
    year: number,
    month: number,
    deltaMonths: number,
  ): { year: number; month: number };
  export function stepFocusedDate(
    focusedIso: string,
    key: string,
    shiftKey: boolean,
    weekStartsOn?: 0 | 1,
  ): string | null;
  export function buildCalendarGrid(
    year: number,
    month: number,
    opts?: { weekStartsOn?: 0 | 1; min?: string; max?: string; today?: string },
  ): CalendarCell[][];
  export function getWeekdayLabels(
    weekStartsOn?: 0 | 1,
    locale?: string,
  ): { short: string; long: string }[];
  export function formatMonthTitle(year: number, month: number, locale?: string): string;
  export function formatDisplayDate(iso: string | null | undefined, locale?: string): string;
  export function formatDisplayRange(range: DateRange | null | undefined, locale?: string): string;
  export function anchorDatePopover(
    shell: HTMLElement,
    popover: HTMLElement,
    options?: { side?: string },
  ): () => void;
  export function createCalendar(
    root: HTMLElement,
    options?: Record<string, unknown>,
  ): {
    destroy: () => void;
    setValue: (v: string | DateRange | null) => void;
    getValue: () => string | DateRange | null;
  };
  export function createDatePicker(
    root: HTMLElement,
    options?: Record<string, unknown>,
  ): {
    destroy: () => void;
    open: () => void;
    close: () => void;
    setValue: (v: string | DateRange | null) => void;
    getValue: () => string | DateRange | null;
  };
  export function initDatePickers(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/time-picker.js' {
  export interface TimeParts {
    hour: number;
    minute: number;
    second: number;
  }
  export function padTime(n: number): string;
  export function parseTimeValue(raw: string | null | undefined): TimeParts | null;
  export function formatTimeValue(parts: TimeParts, includeSeconds?: boolean): string;
  export function nowTimeValue(includeSeconds?: boolean, minuteStep?: number): string;
  export function to12HourDisplay(hour24: number): { hour12: number; period: 'AM' | 'PM' };
  export function from12HourDisplay(hour12: number, period: 'AM' | 'PM'): number;
  export function buildHourOptions(format: '24h' | '12h'): number[];
  export function buildMinuteOptions(step?: number): number[];
  export function stepTimePart(
    parts: TimeParts | null,
    segment: 'hour' | 'minute' | 'second' | 'period',
    delta: number,
    minuteStep?: number,
  ): TimeParts;
  export function applyDigitToSegment(ctx: {
    digit: number;
    buffer: string;
    segment: 'hour' | 'minute' | 'second';
    format: '24h' | '12h';
    current: TimeParts | null;
  }): { parts: TimeParts; nextBuffer: string; advance: boolean };
  export function anchorTimePopover(
    shell: HTMLElement,
    popover: HTMLElement,
    options?: { side?: string },
  ): () => void;
  export function createTimePicker(
    root: HTMLElement,
    options?: Record<string, unknown>,
  ): { destroy: () => void; setValue: (v: string | null) => void; getValue: () => string | null };
  export function initTimePickers(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/color-picker.js' {
  export interface HsvaColor {
    h: number;
    s: number;
    v: number;
    a: number;
  }
  export interface RgbaColor {
    r: number;
    g: number;
    b: number;
    a: number;
  }
  export type ColorFormat = 'hex' | 'oklch' | 'rgb';
  export const DEFAULT_OKLCH_SWATCHES: string[];
  export function hsvToRgb(h: number, s: number, v: number, a?: number): RgbaColor;
  export function rgbToHsv(r: number, g: number, b: number, a?: number): HsvaColor;
  export function hsvToHex(h: number, s: number, v: number, a?: number): string;
  export function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number };
  export function oklchToRgb(lPct: number, c: number, hDeg: number): { r: number; g: number; b: number };
  export function hexToOklchString(hex: string): string;
  export function parseColor(input: string | null | undefined): HsvaColor | null;
  export function formatColor(
    hsva: HsvaColor,
    format?: ColorFormat,
    includeAlpha?: boolean,
  ): string;
  export function anchorColorPopover(
    shell: HTMLElement,
    popover: HTMLElement,
    options?: { side?: string },
  ): () => void;
  export function bindPointerDrag(
    el: HTMLElement,
    onMove: (nx: number, ny: number) => void,
  ): () => void;
  export function createColorPicker(
    root: HTMLElement,
    options?: Record<string, unknown>,
  ): { destroy: () => void; setValue: (v: string) => void; getValue: () => string };
  export function initColorPickers(root?: ParentNode): () => void;
}

declare module '@jenni/core/behaviors/rich-text.js' {
  export type RichTextAction =
    | 'p'
    | 'h2'
    | 'h3'
    | 'blockquote'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'code'
    | 'bulletList'
    | 'orderedList'
    | 'link'
    | 'clear'
    | 'undo'
    | 'redo';
  export interface ActiveFormats {
    block: 'p' | 'h2' | 'h3' | 'blockquote';
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    code: boolean;
    bulletList: boolean;
    orderedList: boolean;
    link: boolean;
    linkHref: string;
  }
  export const DEFAULT_TOOLBAR_GROUPS: RichTextAction[][];
  export const TOOLBAR_META: Record<RichTextAction, { label: string; short: string }>;
  export function isEditorEmpty(editor: HTMLElement): boolean;
  export function countProseStats(source: HTMLElement | string): { words: number; chars: number };
  export function saveSelectionRange(editor: HTMLElement): Range | null;
  export function restoreSelectionRange(editor: HTMLElement, range: Range | null): void;
  export function readActiveFormats(editor: HTMLElement): ActiveFormats;
  export function toggleInlineCode(editor: HTMLElement): void;
  export function normalizeLinkHref(raw: string): string;
  export function applyLinkAtRange(
    editor: HTMLElement,
    savedRange: Range | null,
    rawUrl: string,
  ): void;
  export function removeLinkAtRange(editor: HTMLElement, savedRange: Range | null): void;
  export function execRichTextAction(
    editor: HTMLElement,
    action: Exclude<RichTextAction, 'link'>,
  ): void;
  export function createRichTextEditor(
    root: HTMLElement,
    options?: Record<string, unknown>,
  ): { destroy: () => void; getHTML: () => string; setHTML: (html: string) => void; focus: () => void };
  export function initRichTextEditors(root?: ParentNode): () => void;
}
