import {
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { segmentedKeydown, syncSegmentedIndicator } from '@jenni/core/behaviors/segmented.js';
import {
  FieldContext,
  SegmentedContext,
  cx,
  flag,
  mergeRefs,
  sizeAttr,
  useControllable,
  type SegmentedOption,
  type Size,
  type Tone,
} from './types';

export interface SegmentedControlProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: SegmentedOption[];
  size?: Size;
  tone?: Tone;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function SegmentedControl({
  value,
  defaultValue,
  onValueChange,
  options,
  size,
  tone,
  fullWidth,
  disabled = false,
  onKeyDown,
  className,
  children,
  ref,
  ...rest
}: SegmentedControlProps) {
  const field = use(FieldContext);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);
  const [current, setCurrent] = useControllable<string | undefined>(
    value,
    defaultValue ?? options?.[0]?.value,
    onValueChange as ((v: string | undefined) => void) | undefined,
  );

  const isDisabled = disabled || !!field?.disabled;

  const select = (next: string) => {
    if (isDisabled || current === next) return;
    setCurrent(next);
  };

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    syncSegmentedIndicator(el, mountedRef.current);
    mountedRef.current = true;
  }, [current, size, fullWidth, options?.length]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf: number | null = null;
    const ro = new ResizeObserver(() => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = null;
        syncSegmentedIndicator(el, false);
      });
    });
    ro.observe(el);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !rootRef.current || isDisabled) return;
    const target = segmentedKeydown(rootRef.current, e.nativeEvent);
    const val = target?.dataset.value;
    if (val !== undefined) select(val);
  };

  return (
    <SegmentedContext value={{ value: current, select, disabled: isDisabled }}>
      <div
        ref={mergeRefs(rootRef, ref)}
        role="radiogroup"
        className={cx('j-segmented', className)}
        data-j-managed=""
        data-size={sizeAttr(size)}
        data-tone={tone}
        data-full-width={flag(fullWidth)}
        aria-disabled={isDisabled ? 'true' : undefined}
        aria-labelledby={field?.labelId}
        aria-describedby={field?.describedBy}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <span className="j-segmented__indicator" aria-hidden="true" />
        {options?.length
          ? options.map((opt) => {
              const checked = current === opt.value;
              const itemDisabled = isDisabled || !!opt.disabled;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  className="j-segmented__item"
                  data-value={opt.value}
                  aria-checked={checked ? 'true' : 'false'}
                  tabIndex={checked ? 0 : -1}
                  disabled={itemDisabled || undefined}
                  onClick={() => select(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })
          : children}
      </div>
    </SegmentedContext>
  );
}

export interface SegmentedItemProps extends Omit<ComponentProps<'button'>, 'value'> {
  value: string;
}

export function SegmentedItem({ value, disabled, onClick, className, children, ...rest }: SegmentedItemProps) {
  const group = use(SegmentedContext);
  const checked = group?.value === value;
  const isDisabled = !!(disabled || group?.disabled);

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented && !isDisabled) group?.select(value);
  };

  return (
    <button
      type="button"
      role="radio"
      className={cx('j-segmented__item', className)}
      data-value={value}
      aria-checked={checked ? 'true' : 'false'}
      tabIndex={checked ? 0 : -1}
      disabled={isDisabled || undefined}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  );
}
