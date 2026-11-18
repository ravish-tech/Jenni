import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type ComponentProps,
  type Ref,
} from 'react';
import {
  createResizableGroup,
  type ResizableGroupController,
} from '@jenni/core/behaviors/resizable.js';
import { attr, cx, mergeRefs, type ResizableOrientation } from './types';

export type ResizableGroupHandle = ResizableGroupController;

const ResizableGroupContext = createContext<(() => ResizableGroupController | null) | null>(null);

export interface ResizableGroupProps extends ComponentProps<'div'> {
  orientation?: ResizableOrientation;
  autoSaveId?: string;
  step?: number;
  bordered?: boolean;
  height?: string | number;
  width?: string | number;
  onLayout?: (sizes: number[]) => void;
  onPanelCollapse?: (panelId: string, collapsed: boolean) => void;
  apiRef?: Ref<ResizableGroupHandle | null>;
}

const toCssSize = (v: string | number) => (typeof v === 'number' ? `${v}px` : v);

export function ResizableGroup({
  orientation = 'horizontal',
  autoSaveId,
  step,
  bordered = false,
  height,
  width,
  onLayout,
  onPanelCollapse,
  apiRef,
  style,
  className,
  children,
  ref,
  ...rest
}: ResizableGroupProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<ResizableGroupController | null>(null);
  const onLayoutRef = useRef(onLayout);
  const onCollapseRef = useRef(onPanelCollapse);
  onLayoutRef.current = onLayout;
  onCollapseRef.current = onPanelCollapse;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctrl = createResizableGroup(el, {
      orientation,
      autoSaveId,
      step,
      onLayout: (sizes) => onLayoutRef.current?.(sizes),
      onPanelCollapse: (panelId, collapsed) => onCollapseRef.current?.(panelId, collapsed),
    });
    ctrlRef.current = ctrl;
    onLayoutRef.current?.(ctrl.getLayout());
    return () => {
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, [orientation, autoSaveId, step]);

  useImperativeHandle(
    apiRef,
    () => ({
      getLayout: () => ctrlRef.current?.getLayout() ?? [],
      setLayout: (sizes) => ctrlRef.current?.setLayout(sizes),
      collapsePanel: (idOrIndex) => ctrlRef.current?.collapsePanel(idOrIndex),
      expandPanel: (idOrIndex) => ctrlRef.current?.expandPanel(idOrIndex),
      togglePanel: (idOrIndex) => ctrlRef.current?.togglePanel(idOrIndex) ?? false,
      isPanelCollapsed: (idOrIndex) => ctrlRef.current?.isPanelCollapsed(idOrIndex) ?? false,
      resetLayout: () => ctrlRef.current?.resetLayout(),
      refresh: () => ctrlRef.current?.refresh(),
      destroy: () => ctrlRef.current?.destroy(),
    }),
    [],
  );

  const customVars: Record<string, string> = {};
  if (height != null) customVars['--j-resizable-h'] = toCssSize(height);
  if (width != null) customVars['--j-resizable-w'] = toCssSize(width);

  const mergedStyle: CSSProperties | undefined =
    Object.keys(customVars).length > 0 ? { ...style, ...customVars } : style;

  return (
    <ResizableGroupContext.Provider value={() => ctrlRef.current}>
      <div
        {...rest}
        ref={mergeRefs(rootRef, ref)}
        className={cx('j-resizable', className)}
        data-orientation={attr(orientation, 'horizontal')}
        data-bordered={bordered ? '' : undefined}
        data-storage-key={autoSaveId || undefined}
        style={mergedStyle}
      >
        {children}
      </div>
    </ResizableGroupContext.Provider>
  );
}

export interface ResizablePanelProps extends ComponentProps<'div'> {
  defaultSize?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
  collapsible?: boolean;
  collapsedSize?: number | string;
}

export function ResizablePanel({
  id,
  defaultSize,
  minSize,
  maxSize,
  collapsible = false,
  collapsedSize,
  className,
  children,
  ref,
  ...rest
}: ResizablePanelProps) {
  const autoId = useId();
  const panelId = id || autoId;
  const getGroupCtrl = useContext(ResizableGroupContext);

  useEffect(() => {
    getGroupCtrl?.()?.refresh();
  }, [defaultSize, minSize, maxSize, collapsible, collapsedSize, getGroupCtrl]);

  return (
    <div
      {...rest}
      id={panelId}
      ref={ref}
      className={cx('j-resizable__panel', className)}
      data-panel-id={panelId}
      data-default-size={defaultSize != null ? String(defaultSize) : undefined}
      data-min-size={minSize != null ? String(minSize) : undefined}
      data-max-size={maxSize != null ? String(maxSize) : undefined}
      data-collapsible={collapsible ? '' : undefined}
      data-collapsed-size={collapsedSize != null ? String(collapsedSize) : undefined}
    >
      {children}
    </div>
  );
}

export interface ResizableHandleProps extends ComponentProps<'div'> {
  withGrip?: boolean;
  disabled?: boolean;
}

export function ResizableHandle({
  withGrip = false,
  disabled = false,
  className,
  ref,
  ...rest
}: ResizableHandleProps) {
  return (
    <div
      {...rest}
      ref={ref}
      className={cx('j-resizable__handle', className)}
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled ? true : undefined}
      data-with-grip={withGrip ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
    />
  );
}
