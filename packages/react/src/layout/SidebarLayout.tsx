import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Icon } from '../display/Icon';
import { ContextMenu, type ContextMenuHandle } from '../overlay/ContextMenu';
import { DropdownItem } from '../overlay/DropdownMenu';
import { Tooltip } from '../overlay/Tooltip';
import type { FloatingSide } from '../overlay/types';
import { SplitHandle, type SplitHandleDragPayload } from './SplitHandle';
import { cx, mergeRefs } from './types';

export type SidebarState = 'open' | 'rail' | 'hidden';

export interface SidebarLayoutContextValue {
  state: SidebarState;
  width: number;
  hasRail: boolean;
  toggleLabel: string;
  toggle: () => void;
  setState: (next: SidebarState) => void;
  setWidth: (next: number) => void;
}

export const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null);

export interface SidebarLayoutHandle {
  readonly state: SidebarState;
  toggle: () => void;
  setState: (next: SidebarState) => void;
  readonly width: number;
  setWidth: (next: number) => void;
}

export interface SidebarLayoutProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Optional `localStorage` key persisting `{ state, width }` JSON safely. */
  storageKey?: string;
  /** Default open sidebar width in pixels when uncontrolled and unpersisted (default `260`). */
  defaultWidth?: number;
  /** Minimum resizable sidebar width in pixels (default `180`). */
  min?: number;
  /** Maximum resizable sidebar width in pixels (default `600`). */
  max?: number;
  /** Initial state when uncontrolled and nothing is stored in `storageKey` (default `'open'`). */
  initialState?: SidebarState;
  /** Controlled sidebar state. */
  state?: SidebarState;
  /** Called whenever sidebar state changes. */
  onStateChange?: (state: SidebarState) => void;
  /** Controlled sidebar open width in pixels. */
  width?: number;
  /** Called whenever sidebar open width changes. */
  onWidthChange?: (width: number) => void;
  /** Target noun used in toggle tooltips (`"Hide <toggleLabel>"` / `"Show <toggleLabel>"`, default `'sidebar'`). */
  toggleLabel?: string;
  /** Accessible `aria-label` on the `<aside>` landmark (default `'Sidebar'`). */
  sidebarAriaLabel?: string;
  /** Explicit block-size (`--j-sidebar-layout-h`), e.g. `520` or `'100dvh'`. */
  height?: string | number;
  /** Optional 1px framed border + radius around the layout container. */
  bordered?: boolean;
  /** Optional header rendered above the open sidebar body. */
  sidebarHeader?: ReactNode;
  /** Primary sidebar content rendered when `state === 'open'`. */
  sidebar?: ReactNode;
  /** Compact rail content rendered when `state === 'rail'`. */
  rail?: ReactNode;
  /** Optional header rendered above the main content area (host `<SidebarToggle />` here). */
  mainHeader?: ReactNode;
  /** Primary workspace content. */
  children?: ReactNode;
  /** Optional ref to the underlying root `<div>` element. */
  elementRef?: Ref<HTMLDivElement>;
  /** Optional imperative handle alias when `ref` is used elsewhere. */
  apiRef?: Ref<SidebarLayoutHandle | null>;
}

const clampNum = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function isValidState(val: unknown): val is SidebarState {
  return val === 'open' || val === 'rail' || val === 'hidden';
}

function normalizeState(candidate: SidebarState, allowRail: boolean): SidebarState {
  if (candidate === 'rail' && !allowRail) return 'hidden';
  return isValidState(candidate) ? candidate : 'open';
}

function readPersisted(key: string | undefined): { state?: SidebarState; width?: number } | null {
  if (!key || typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: unknown; width?: unknown };
    if (!parsed || typeof parsed !== 'object') return null;
    const out: { state?: SidebarState; width?: number } = {};
    if (isValidState(parsed.state)) out.state = parsed.state;
    if (typeof parsed.width === 'number' && Number.isFinite(parsed.width)) {
      out.width = parsed.width;
    }
    return out;
  } catch {
    return null;
  }
}

function writePersisted(key: string | undefined, nextState: SidebarState, nextWidth: number) {
  if (!key || typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ state: nextState, width: nextWidth }));
  } catch {
    /* ignore storage quota or security restrictions */
  }
}

export const SidebarLayout = forwardRef<SidebarLayoutHandle, SidebarLayoutProps>(
  function SidebarLayout(
    {
      storageKey,
      defaultWidth = 260,
      min = 180,
      max = 600,
      initialState = 'open',
      state: stateProp,
      onStateChange,
      width: widthProp,
      onWidthChange,
      toggleLabel = 'sidebar',
      sidebarAriaLabel = 'Sidebar',
      height,
      bordered = false,
      sidebarHeader,
      sidebar,
      rail,
      mainHeader,
      children,
      elementRef,
      apiRef,
      className,
      style,
      ...rest
    },
    forwardedRef,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const edgeMenuRef = useRef<ContextMenuHandle | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const resolvedMin = Math.max(80, Number(min) || 180);
    const resolvedMax = Math.max(resolvedMin, Number(max) || 600);
    const hasRail = rail != null && rail !== false;

    const clampWidth = useCallback(
      (raw: number) => {
        const n = Number.isFinite(raw) ? raw : defaultWidth;
        return Math.round(clampNum(n, resolvedMin, resolvedMax));
      },
      [defaultWidth, resolvedMin, resolvedMax],
    );

    const [innerState, setInnerState] = useState<SidebarState>(() =>
      normalizeState(initialState, hasRail),
    );

    const [innerWidth, setInnerWidth] = useState<number>(() =>
      Math.round(clampNum(Number.isFinite(defaultWidth) ? defaultWidth : 260, resolvedMin, resolvedMax)),
    );

    const currentState = normalizeState(stateProp !== undefined ? stateProp : innerState, hasRail);
    const currentWidth = clampWidth(widthProp !== undefined ? widthProp : innerWidth);

    const callbacksRef = useRef({ onStateChange, onWidthChange });
    callbacksRef.current = { onStateChange, onWidthChange };

    const stateSnapshotRef = useRef({
      currentState,
      currentWidth,
      hasRail,
      storageKey,
      isStateControlled: stateProp !== undefined,
      isWidthControlled: widthProp !== undefined,
    });
    stateSnapshotRef.current = {
      currentState,
      currentWidth,
      hasRail,
      storageKey,
      isStateControlled: stateProp !== undefined,
      isWidthControlled: widthProp !== undefined,
    };

    const setState = useCallback((next: SidebarState) => {
      const snap = stateSnapshotRef.current;
      const normalized = normalizeState(next, snap.hasRail);
      if (!snap.isStateControlled) {
        setInnerState(normalized);
      }
      writePersisted(snap.storageKey, normalized, snap.currentWidth);
      if (normalized !== snap.currentState || snap.isStateControlled) {
        callbacksRef.current.onStateChange?.(normalized);
      }
    }, []);

    const setWidth = useCallback(
      (next: number) => {
        const snap = stateSnapshotRef.current;
        const clamped = clampWidth(next);
        if (!snap.isWidthControlled) {
          setInnerWidth(clamped);
        }
        writePersisted(snap.storageKey, snap.currentState, clamped);
        if (clamped !== snap.currentWidth || snap.isWidthControlled) {
          callbacksRef.current.onWidthChange?.(clamped);
        }
      },
      [clampWidth],
    );

    const toggle = useCallback(() => {
      const snap = stateSnapshotRef.current;
      if (snap.currentState === 'open') {
        setState(snap.hasRail ? 'rail' : 'hidden');
      } else {
        setState('open');
      }
    }, [setState]);

    useEffect(() => {
      if (!storageKey) return;
      const saved = readPersisted(storageKey);
      if (!saved) return;
      const snap = stateSnapshotRef.current;
      if (saved.state !== undefined) {
        const restoredState = normalizeState(saved.state, hasRail);
        if (!snap.isStateControlled) {
          setInnerState(restoredState);
        }
        if (restoredState !== snap.currentState) {
          callbacksRef.current.onStateChange?.(restoredState);
        }
      }
      if (saved.width != null) {
        const restoredWidth = clampWidth(saved.width);
        if (!snap.isWidthControlled) {
          setInnerWidth(restoredWidth);
        }
        if (restoredWidth !== snap.currentWidth) {
          callbacksRef.current.onWidthChange?.(restoredWidth);
        }
      }
    }, [storageKey, hasRail, clampWidth]);

    useEffect(() => {
      if (!hasRail && innerState === 'rail') {
        setInnerState('hidden');
      }
    }, [hasRail, innerState]);

    useEffect(() => {
      setInnerWidth((prev) => clampWidth(prev));
    }, [clampWidth]);

    const handleDragStart = useCallback(() => {
      setIsDragging(true);
    }, []);

    const handleDrag = useCallback(
      (payload: SplitHandleDragPayload) => {
        if (payload.source === 'keyboard') {
          setWidth(stateSnapshotRef.current.currentWidth + payload.delta);
          return;
        }
        const layoutEl = rootRef.current;
        if (!layoutEl) return;
        const rect = layoutEl.getBoundingClientRect();
        const isRtl =
          typeof getComputedStyle === 'function' && getComputedStyle(layoutEl).direction === 'rtl';
        const rawWidth = isRtl ? rect.right - payload.clientX : payload.clientX - rect.left;
        setWidth(rawWidth);
      },
      [setWidth],
    );

    const handleDragEnd = useCallback(() => {
      setIsDragging(false);
      const snap = stateSnapshotRef.current;
      writePersisted(snap.storageKey, snap.currentState, snap.currentWidth);
    }, []);

    const handleEdgeContextMenu = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
      edgeMenuRef.current?.openFromEvent(e.nativeEvent);
    }, []);

    const handleEdgeKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        edgeMenuRef.current?.openFromEvent(e.nativeEvent);
      }
    }, []);

    const buildHandle = useCallback(
      (): SidebarLayoutHandle => ({
        get state() {
          return stateSnapshotRef.current.currentState;
        },
        toggle,
        setState,
        get width() {
          return stateSnapshotRef.current.currentWidth;
        },
        setWidth,
      }),
      [toggle, setState, setWidth],
    );

    useImperativeHandle(forwardedRef, buildHandle, [buildHandle]);
    useImperativeHandle(apiRef, buildHandle, [buildHandle]);

    const resolvedToggleLabel = toggleLabel.trim() || 'sidebar';
    const edgeTooltipText =
      currentState === 'open' ? `Hide ${resolvedToggleLabel}` : `Show ${resolvedToggleLabel}`;

    const ctxValue = useMemo<SidebarLayoutContextValue>(
      () => ({
        state: currentState,
        width: currentWidth,
        hasRail,
        toggleLabel: resolvedToggleLabel,
        toggle,
        setState,
        setWidth,
      }),
      [currentState, currentWidth, hasRail, resolvedToggleLabel, toggle, setState, setWidth],
    );

    const customVars: Record<string, string> = {
      '--_sidebar-w': `${currentWidth}px`,
    };
    if (height != null) {
      customVars['--j-sidebar-layout-h'] = typeof height === 'number' ? `${height}px` : height;
    }
    const mergedStyle: CSSProperties = style
      ? { ...customVars, ...style }
      : (customVars as CSSProperties);

    return (
      <SidebarLayoutContext.Provider value={ctxValue}>
        <div
          {...rest}
          ref={mergeRefs(rootRef, elementRef)}
          className={cx('j-sidebar-layout', className)}
          data-state={currentState}
          data-bordered={bordered ? '' : undefined}
          data-dragging={isDragging ? '' : undefined}
          style={mergedStyle}
        >
          <aside
            className="j-sidebar-layout__sidebar"
            aria-label={sidebarAriaLabel}
            inert={currentState === 'hidden' ? true : undefined}
            aria-hidden={currentState === 'hidden' ? true : undefined}
          >
            {hasRail && currentState === 'rail' ? (
              <div className="j-sidebar-layout__rail">{rail}</div>
            ) : (
              <div className="j-sidebar-layout__sidebar-pane">
                {sidebarHeader != null && (
                  <header className="j-sidebar-layout__sidebar-header">{sidebarHeader}</header>
                )}
                <div className="j-sidebar-layout__sidebar-body">{sidebar}</div>
              </div>
            )}
          </aside>

          <div
            className="j-sidebar-layout__edge"
            onContextMenu={handleEdgeContextMenu}
            onKeyDown={handleEdgeKeyDown}
          >
            {currentState === 'open' ? (
              <SplitHandle
                orientation="horizontal"
                ariaLabel={`Resize ${resolvedToggleLabel}`}
                valueNow={currentWidth}
                valueMin={resolvedMin}
                valueMax={resolvedMax}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
              />
            ) : (
              <div className="j-sidebar-layout__edge-zone" aria-hidden="true" />
            )}

            <Tooltip content={edgeTooltipText} side="right">
              <button
                type="button"
                className="j-sidebar-layout__edge-btn"
                aria-label={edgeTooltipText}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={toggle}
              >
                <Icon
                  name={currentState === 'open' ? 'chevron-left' : 'chevron-right'}
                  size="xs"
                />
              </button>
            </Tooltip>
          </div>

          <div className="j-sidebar-layout__main">
            {mainHeader != null && (
              <header className="j-sidebar-layout__main-header">{mainHeader}</header>
            )}
            <div className="j-sidebar-layout__content">{children}</div>
          </div>

          <ContextMenu ref={edgeMenuRef}>
            <DropdownItem
              role="menuitemradio"
              checked={currentState === 'open'}
              onSelect={() => setState('open')}
            >
              Show sidebar
            </DropdownItem>
            {hasRail && (
              <DropdownItem
                role="menuitemradio"
                checked={currentState === 'rail'}
                onSelect={() => setState('rail')}
              >
                Rail
              </DropdownItem>
            )}
            <DropdownItem
              role="menuitemradio"
              checked={currentState === 'hidden'}
              onSelect={() => setState('hidden')}
            >
              Hide sidebar
            </DropdownItem>
          </ContextMenu>
        </div>
      </SidebarLayoutContext.Provider>
    );
  },
);

export interface SidebarToggleProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Optional override for the layout's `toggleLabel` noun. */
  label?: string;
  /** Optional keyboard shortcut hint displayed in the tooltip. */
  kbd?: string | string[];
  /** Tooltip placement side (default `'bottom'`). */
  tooltipSide?: FloatingSide;
}

export function SidebarToggle({
  label,
  kbd,
  tooltipSide = 'bottom',
  disabled = false,
  className,
  onClick,
  ref,
  ...rest
}: SidebarToggleProps) {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) return null;

  const resolvedNoun = (label ?? ctx.toggleLabel).trim() || 'sidebar';
  const tooltipText = ctx.state === 'open' ? `Hide ${resolvedNoun}` : `Show ${resolvedNoun}`;

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || disabled) return;
    ctx.toggle();
  };

  return (
    <Tooltip content={tooltipText} side={tooltipSide} kbd={kbd} disabled={disabled}>
      <button
        {...rest}
        ref={ref}
        type="button"
        className={cx('j-button j-sidebar-toggle', className)}
        data-variant="ghost"
        data-size="sm"
        data-icon-only=""
        disabled={disabled || undefined}
        aria-label={tooltipText}
        aria-expanded={ctx.state === 'open'}
        onClick={handleClick}
      >
        <Icon name="dock-left" />
      </button>
    </Tooltip>
  );
}
