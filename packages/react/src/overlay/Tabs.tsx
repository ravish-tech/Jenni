import {
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { syncTabIndicator, tabsKeydown } from '@jenni/core/behaviors/tabs.js';
import {
  TabsContext,
  cx,
  flag,
  mergeRefs,
  sizeAttr,
  useControllable,
  type OverlaySize,
  type TabsActivation,
  type TabsOrientation,
  type TabsVariant,
} from './types';

function slug(val: string) {
  return val.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export interface TabsProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: OverlaySize;
  orientation?: TabsOrientation;
  activation?: TabsActivation;
  full?: boolean;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  variant = 'underline',
  size = 'md',
  orientation = 'horizontal',
  activation = 'automatic',
  full,
  className,
  children,
  ...rest
}: TabsProps) {
  const baseId = useId();
  const [current, setValue] = useControllable<string | undefined>(
    value,
    defaultValue,
    onValueChange as ((v: string | undefined) => void) | undefined,
  );
  const tabElsRef = useRef(new WeakMap<HTMLElement, string>());
  const hasInitialRef = useRef(value !== undefined || defaultValue !== undefined);
  if (current !== undefined) hasInitialRef.current = true;

  const select = useCallback(
    (val: string) => {
      if (val !== current) setValue(val);
    },
    [current, setValue],
  );

  const ensureInitial = useCallback(
    (val: string) => {
      if (!hasInitialRef.current) {
        hasInitialRef.current = true;
        setValue(val);
      }
    },
    [setValue],
  );

  const registerTabEl = useCallback((el: HTMLElement | null, val: string) => {
    if (el) tabElsRef.current.set(el, val);
  }, []);

  const getTabValue = useCallback((el: HTMLElement) => tabElsRef.current.get(el), []);

  return (
    <TabsContext
      value={{
        baseId,
        value: current,
        orientation,
        activation,
        select,
        ensureInitial,
        tabId: (val) => `${baseId}-tab-${slug(val)}`,
        panelId: (val) => `${baseId}-panel-${slug(val)}`,
        registerTabEl,
        getTabValue,
      }}
    >
      <div
        {...rest}
        className={cx('j-tabs', className)}
        data-variant={variant === 'pill' ? 'pill' : undefined}
        data-size={sizeAttr(size)}
        data-orientation={orientation === 'vertical' ? 'vertical' : undefined}
        data-activation={activation === 'manual' ? 'manual' : undefined}
        data-full={flag(full)}
      >
        {children}
      </div>
    </TabsContext>
  );
}

export type TabListProps = ComponentProps<'div'>;

export function TabList({ className, onKeyDown, children, ref, ...rest }: TabListProps) {
  const ctx = use(TabsContext);
  const listRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    syncTabIndicator(el, false);
    let raf: number | null = null;
    const ro = new ResizeObserver(() => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = null;
        syncTabIndicator(el, false);
      });
    });
    ro.observe(el);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      syncTabIndicator(el, false);
      return;
    }
    syncTabIndicator(el, true);
  }, [ctx?.value, ctx?.orientation]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !listRef.current) return;
    const target = tabsKeydown(listRef.current, e.nativeEvent);
    if (target && ctx && ctx.activation !== 'manual') {
      const val = ctx.getTabValue(target);
      if (val !== undefined) ctx.select(val);
    }
  };

  return (
    <div
      {...rest}
      ref={mergeRefs(listRef, ref)}
      role="tablist"
      className={cx('j-tabs__list', className)}
      aria-orientation={ctx?.orientation === 'vertical' ? 'vertical' : undefined}
      onKeyDown={handleKeyDown}
    >
      <span className="j-tabs__indicator" aria-hidden="true" />
      {children}
    </div>
  );
}

export interface TabProps extends Omit<ComponentProps<'button'>, 'value'> {
  value: string;
}

export function Tab({ value, disabled, className, onClick, children, ref, ...rest }: TabProps) {
  const ctx = use(TabsContext);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const selected = ctx?.value === value;

  useLayoutEffect(() => {
    ctx?.registerTabEl(btnRef.current, value);
    if (!disabled) ctx?.ensureInitial(value);
  }, [ctx, value, disabled]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented && !disabled) ctx?.select(value);
  };

  return (
    <button
      {...rest}
      id={ctx?.tabId(value)}
      ref={mergeRefs(btnRef, ref)}
      type="button"
      role="tab"
      className={cx('j-tabs__tab', className)}
      aria-selected={selected}
      aria-controls={ctx?.panelId(value)}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      data-value={value}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

export interface TabPanelProps extends ComponentProps<'div'> {
  value: string;
}

export function TabPanel({ value, className, children, ...rest }: TabPanelProps) {
  const ctx = use(TabsContext);
  const selected = ctx?.value === value;

  return (
    <div
      {...rest}
      id={ctx?.panelId(value)}
      role="tabpanel"
      className={cx('j-tabs__panel', className)}
      aria-labelledby={ctx?.tabId(value)}
      tabIndex={0}
      hidden={!selected}
    >
      {children}
    </div>
  );
}
