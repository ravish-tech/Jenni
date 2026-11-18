import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  DEFAULT_OKLCH_SWATCHES,
  anchorColorPopover,
  bindPointerDrag,
  formatColor,
  hsvToHex,
  parseColor,
  type HsvaColor,
} from '@jenni/core/behaviors/color-picker.js';
import {
  cx,
  flag,
  mergeRefs,
  sizeAttr,
  useControllable,
  type ColorFormat,
  type ColorPickerMode,
  type Size,
  type Tone,
} from './types';
import { useFieldProps } from './useFieldProps';

export type { ColorFormat, ColorPickerMode };

export interface ColorPickerProps
  extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  mode?: ColorPickerMode;
  inline?: boolean;
  format?: ColorFormat;
  alpha?: boolean;
  swatches?: string[];
  size?: Size;
  tone?: Tone;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
}

export function ColorPicker({
  value,
  defaultValue = '#4f46e5',
  onValueChange,
  mode = 'popover',
  inline = false,
  format = 'hex',
  alpha = false,
  swatches = DEFAULT_OKLCH_SWATCHES,
  size,
  tone,
  disabled,
  invalid,
  name,
  className,
  style,
  ref,
  ...rest
}: ColorPickerProps) {
  const field = useFieldProps(invalid);
  const popId = `${useId()}-cp`;
  const shellRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const spectrumRef = useRef<HTMLDivElement | null>(null);
  const hueTrackRef = useRef<HTMLDivElement | null>(null);
  const alphaTrackRef = useRef<HTMLDivElement | null>(null);

  const isInline = inline || mode === 'inline';
  const isDisabled = !!(disabled || field.disabled);
  const isInvalid = !!(invalid || field['aria-invalid']);

  const [current, setCurrent] = useControllable<string>(value, defaultValue, onValueChange);
  const [activeFormat, setActiveFormat] = useState<ColorFormat>(format);
  const [hsva, setHsva] = useState<HsvaColor>(
    () => parseColor(current) ?? { h: 243, s: 69, v: 90, a: 1 },
  );
  const [inputFocused, setInputFocused] = useState(false);
  const [draftText, setDraftText] = useState(() => formatColor(hsva, activeFormat, alpha));
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const hsvaRef = useRef(hsva);
  hsvaRef.current = hsva;
  const formatRef = useRef(activeFormat);
  formatRef.current = activeFormat;
  const alphaRef = useRef(alpha);
  alphaRef.current = alpha;
  const disabledRef = useRef(isDisabled);
  disabledRef.current = isDisabled;

  useEffect(() => {
    setActiveFormat(format);
  }, [format]);

  useEffect(() => {
    const incoming = parseColor(current);
    if (!incoming) return;
    const curOut = formatColor(hsvaRef.current, formatRef.current, alphaRef.current);
    if (current !== curOut) {
      const next = {
        h: incoming.s < 0.5 ? hsvaRef.current.h : incoming.h,
        s: incoming.s,
        v: incoming.v,
        a: incoming.a,
      };
      setHsva(next);
      if (!inputFocused) {
        setDraftText(formatColor(next, formatRef.current, alphaRef.current));
      }
    }
  }, [current, inputFocused]);

  const commitHsva = (next: HsvaColor, syncDraft = true) => {
    if (disabledRef.current) return;
    setHsva(next);
    const out = formatColor(next, formatRef.current, alphaRef.current);
    if (syncDraft) setDraftText(out);
    setCurrent(out);
  };

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    if (!isInline && shellRef.current && popoverRef.current) {
      const pop = popoverRef.current;
      cleanups.push(anchorColorPopover(shellRef.current, pop));
      const onToggle = (e: Event) => setOpen((e as ToggleEvent).newState === 'open');
      pop.addEventListener('toggle', onToggle);
      cleanups.push(() => pop.removeEventListener('toggle', onToggle));
    }
    if (spectrumRef.current) {
      cleanups.push(
        bindPointerDrag(spectrumRef.current, (nx, ny) => {
          commitHsva(
            {
              ...hsvaRef.current,
              s: Number((nx * 100).toFixed(1)),
              v: Number(((1 - ny) * 100).toFixed(1)),
            },
            true,
          );
        }),
      );
    }
    if (hueTrackRef.current) {
      cleanups.push(
        bindPointerDrag(hueTrackRef.current, (nx) => {
          commitHsva({ ...hsvaRef.current, h: Number((nx * 360).toFixed(1)) }, true);
        }),
      );
    }
    if (alphaTrackRef.current) {
      cleanups.push(
        bindPointerDrag(alphaTrackRef.current, (nx) => {
          commitHsva({ ...hsvaRef.current, a: Number(nx.toFixed(2)) }, true);
        }),
      );
    }
    return () => cleanups.forEach((fn) => fn());
  }, [isInline, alpha]);

  const solidHex = hsvToHex(hsva.h, hsva.s, hsva.v, 1);
  const previewCss = formatColor(hsva, 'rgb', alpha);
  const formattedValue = formatColor(hsva, activeFormat, alpha);

  const inspectorVars = {
    '--_cp-hue': String(hsva.h),
    '--_cp-sat': `${hsva.s}%`,
    '--_cp-val': `${hsva.v}%`,
    '--_cp-solid': solidHex,
    '--_cp-preview': previewCss,
  } as CSSProperties;

  const handleSpectrumKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    const step = e.shiftKey ? 10 : 2;
    let { s, v } = hsva;
    if (e.key === 'ArrowLeft') s = Math.max(0, s - step);
    else if (e.key === 'ArrowRight') s = Math.min(100, s + step);
    else if (e.key === 'ArrowUp') v = Math.min(100, v + step);
    else if (e.key === 'ArrowDown') v = Math.max(0, v - step);
    else return;
    e.preventDefault();
    commitHsva({ ...hsva, s, v }, true);
  };

  const handleHueKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    const step = e.shiftKey ? 15 : 3;
    let h = hsva.h;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') h = (h - step + 360) % 360;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') h = (h + step) % 360;
    else return;
    e.preventDefault();
    commitHsva({ ...hsva, h }, true);
  };

  const handleAlphaKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    const step = e.shiftKey ? 0.1 : 0.02;
    let a = hsva.a;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
      a = Math.max(0, Number((a - step).toFixed(2)));
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
      a = Math.min(1, Number((a + step).toFixed(2)));
    else return;
    e.preventDefault();
    commitHsva({ ...hsva, a }, true);
  };

  const inspectorCard = (
    <div
      ref={isInline ? ref : undefined}
      className={cx('j-color-picker', isInline && className)}
      style={isInline ? { ...inspectorVars, ...style } : inspectorVars}
      data-j-managed=""
      data-tone={tone}
      aria-disabled={isDisabled ? 'true' : undefined}
      {...(isInline ? rest : {})}
    >
      {isInline && name && <input type="hidden" name={name} value={formattedValue} />}

      <div
        ref={spectrumRef}
        className="j-color-picker__spectrum"
        tabIndex={0}
        role="slider"
        aria-label="Color saturation and brightness"
        aria-valuenow={Math.round(hsva.s)}
        onKeyDown={handleSpectrumKeyDown}
      >
        <span className="j-color-picker__loupe" />
      </div>

      <div className="j-color-picker__controls">
        <span className="j-color-picker__well" aria-hidden="true" />
        <div className="j-color-picker__sliders">
          <div
            ref={hueTrackRef}
            className="j-color-picker__track"
            data-track="hue"
            tabIndex={0}
            role="slider"
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsva.h)}
            style={
              {
                '--_track-pct': `${(hsva.h / 360) * 100}%`,
                '--_thumb-bg': `hsl(${hsva.h} 100% 50%)`,
              } as CSSProperties
            }
            onKeyDown={handleHueKeyDown}
          >
            <span className="j-color-picker__thumb" />
          </div>

          {alpha && (
            <div
              ref={alphaTrackRef}
              className="j-color-picker__track"
              data-track="alpha"
              tabIndex={0}
              role="slider"
              aria-label="Opacity"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(hsva.a * 100)}
              style={
                {
                  '--_track-pct': `${hsva.a * 100}%`,
                  '--_thumb-bg': previewCss,
                } as CSSProperties
              }
              onKeyDown={handleAlphaKeyDown}
            >
              <span className="j-color-picker__thumb" />
            </div>
          )}
        </div>
      </div>

      <div className="j-color-picker__formats" role="group" aria-label="Color format">
        {(['hex', 'oklch', 'rgb'] as const).map((fmt) => (
          <button
            key={fmt}
            type="button"
            className="j-color-picker__format-btn"
            aria-pressed={activeFormat === fmt ? 'true' : 'false'}
            onClick={() => {
              if (isDisabled) return;
              setActiveFormat(fmt);
              const out = formatColor(hsva, fmt, alpha);
              setDraftText(out);
              setCurrent(out);
            }}
          >
            {fmt.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="j-color-picker__readout">
        <input
          id={isInline ? field.id : undefined}
          type="text"
          className="j-color-picker__input"
          aria-label="Color value"
          spellCheck={false}
          value={inputFocused ? draftText : formattedValue}
          onFocus={() => {
            setInputFocused(true);
            setDraftText(formattedValue);
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setDraftText(raw);
            const parsed = parseColor(raw);
            if (parsed) commitHsva(parsed, false);
          }}
          onBlur={() => {
            setInputFocused(false);
            setDraftText(formattedValue);
          }}
        />
        <button
          type="button"
          className="j-color-picker__copy"
          data-copied={flag(copied)}
          aria-label="Copy color value"
          onClick={() => {
            if (isDisabled) return;
            navigator.clipboard?.writeText(formattedValue).catch(() => {});
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? '✓' : '⧉'}
        </button>
      </div>

      {swatches.length > 0 && (
        <div className="j-color-picker__swatches">
          {swatches.map((sw) => (
            <button
              key={sw}
              type="button"
              className="j-color-picker__swatch"
              style={{ '--_swatch-bg': sw } as CSSProperties}
              aria-label={`Select ${sw}`}
              aria-selected={solidHex.toLowerCase() === sw.toLowerCase() ? 'true' : 'false'}
              onClick={() => {
                if (isDisabled) return;
                const p = parseColor(sw);
                if (p) commitHsva({ ...p, a: alpha ? hsva.a : 1 }, true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (isInline) return inspectorCard;

  return (
    <>
      <div
        ref={mergeRefs(shellRef, ref)}
        className={cx('j-color-picker-field', className)}
        style={style}
        data-j-managed=""
        data-size={sizeAttr(size)}
        data-tone={tone}
        data-open={flag(open)}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-invalid={isInvalid ? 'true' : undefined}
        {...rest}
      >
        {name && <input type="hidden" name={name} value={formattedValue} />}
        <button
          {...field}
          type="button"
          className="j-color-picker-field__trigger"
          aria-haspopup="dialog"
          aria-expanded={open ? 'true' : 'false'}
          aria-controls={popId}
          disabled={isDisabled || undefined}
          onClick={() => {
            if (isDisabled || !popoverRef.current) return;
            if (popoverRef.current.matches(':popover-open')) popoverRef.current.hidePopover();
            else popoverRef.current.showPopover();
          }}
        >
          <span
            className="j-color-picker-field__swatch"
            style={{ '--_swatch-color': previewCss } as CSSProperties}
            aria-hidden="true"
          />
          <span className="j-color-picker-field__label">{formattedValue}</span>
        </button>
      </div>

      <div
        id={popId}
        ref={popoverRef}
        className="j-color-picker__popover"
        popover="auto"
        data-align="start"
        data-tone={tone}
      >
        {inspectorCard}
      </div>
    </>
  );
}
