/// <reference path="./virtual-grid-core.d.ts" />
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react';
import {
  createVirtualizer,
  type VirtualScrollAlign,
  type VirtualizerController,
  type VirtualizerState,
} from 'jenni-core/behaviors/virtual-list.js';

export type { VirtualScrollAlign, VirtualizerState };

export interface VirtualListHandle {
  scrollToIndex: (index: number, align?: VirtualScrollAlign, behavior?: ScrollBehavior) => void;
  scrollToOffset: (offset: number, behavior?: ScrollBehavior) => void;
  refresh: (clearCache?: boolean) => void;
  readonly element: HTMLDivElement | null;
}

export interface VirtualListProps<T = any>
  extends Omit<ComponentProps<'div'>, 'children' | 'role' | 'ref'> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  itemHeight?: number | ((index: number) => number);
  estimateHeight?: number;
  height?: number | string;
  overscan?: number;
  keyField?: string | ((item: T, index: number) => string | number);
  divided?: boolean;
  role?: string;
  ariaLabel?: string;
  ref?: Ref<VirtualListHandle>;
}

interface SliceState {
  visibleIndices: number[];
  offsetY: number;
  totalHeight: number;
}

function buildInitialSlice(
  count: number,
  itemHeight: number | ((index: number) => number) | undefined,
  estimateHeight: number,
  height: number | string,
  overscan: number,
): SliceState {
  if (count <= 0) {
    return { visibleIndices: [], offsetY: 0, totalHeight: 0 };
  }
  const vpH = typeof height === 'number' && height > 0 ? height : 400;
  if (typeof itemHeight === 'function') {
    const visibleIndices: number[] = [];
    let acc = 0;
    let lastVisible = 0;
    for (let i = 0; i < count; i += 1) {
      const raw = Number(itemHeight(i));
      const h = Number.isFinite(raw) && raw > 0 ? raw : estimateHeight;
      if (acc < vpH) lastVisible = i;
      acc += h;
    }
    const end = Math.min(count - 1, lastVisible + overscan);
    for (let i = 0; i <= end; i += 1) visibleIndices.push(i);
    return { visibleIndices, offsetY: 0, totalHeight: acc };
  }
  const unitH = Math.max(1, itemHeight ?? estimateHeight);
  const end = Math.min(count - 1, Math.ceil(vpH / unitH) - 1 + overscan);
  const visibleIndices: number[] = [];
  for (let i = 0; i <= end; i += 1) visibleIndices.push(i);
  return {
    visibleIndices,
    offsetY: 0,
    totalHeight: count * unitH,
  };
}

export function VirtualList<T = any>({
  items,
  renderItem,
  empty,
  itemHeight,
  estimateHeight = 36,
  height = 400,
  overscan = 6,
  keyField,
  divided = false,
  role = 'list',
  ariaLabel,
  className,
  style,
  ref,
  ...rest
}: VirtualListProps<T>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<VirtualizerController | null>(null);

  const [slice, setSlice] = useState<SliceState>(() =>
    buildInitialSlice(items.length, itemHeight, estimateHeight, height, overscan),
  );

  const handleStateChange = useCallback((next: VirtualizerState) => {
    setSlice((prev) => {
      if (
        prev.visibleIndices === next.visibleIndices &&
        prev.offsetY === next.offsetY &&
        prev.totalHeight === next.totalHeight
      ) {
        return prev;
      }
      return {
        visibleIndices: next.visibleIndices,
        offsetY: next.offsetY,
        totalHeight: next.totalHeight,
      };
    });
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ctrl = createVirtualizer(vp, {
      count: items.length,
      itemHeight,
      estimateHeight,
      overscan,
      onChange: handleStateChange,
    });
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    ctrlRef.current?.setOptions({
      count: items.length,
      itemHeight,
      estimateHeight,
      overscan,
      onChange: handleStateChange,
    });
  }, [items.length, itemHeight, estimateHeight, overscan, handleStateChange]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, align, behavior) =>
        ctrlRef.current?.scrollToIndex(index, align, behavior),
      scrollToOffset: (offset, behavior) => ctrlRef.current?.scrollToOffset(offset, behavior),
      refresh: (clearCache?: boolean) => ctrlRef.current?.refresh(clearCache),
      get element() {
        return viewportRef.current;
      },
    }),
    [],
  );

  const resolveKey = (item: T, index: number): string | number => {
    if (typeof keyField === 'function') return keyField(item, index);
    if (typeof keyField === 'string' && item != null && typeof item === 'object') {
      const val = (item as Record<string, unknown>)[keyField];
      if (typeof val === 'string' || typeof val === 'number') return val;
    }
    return index;
  };

  const mergedStyle = useMemo<CSSProperties>(
    () => ({
      ...style,
      ...(height != null
        ? ({
            '--j-virtual-h': typeof height === 'number' ? `${height}px` : height,
          } as CSSProperties)
        : undefined),
    }),
    [style, height],
  );

  const spacerStyle: CSSProperties = {
    '--_total-h': `${slice.totalHeight}px`,
    blockSize: `${slice.totalHeight}px`,
  } as CSSProperties;

  const itemsStyle: CSSProperties = {
    '--_offset-y': `${slice.offsetY}px`,
  } as CSSProperties;

  const getItemStyle = (idx: number): CSSProperties | undefined => {
    if (itemHeight == null) return undefined;
    const h = typeof itemHeight === 'function' ? itemHeight(idx) : itemHeight;
    return { blockSize: `${h}px` };
  };

  const itemRole =
    role === 'list' ? 'listitem' : role === 'listbox' ? 'option' : undefined;

  return (
    <div
      {...rest}
      ref={viewportRef}
      role={role}
      aria-label={ariaLabel ?? rest['aria-label']}
      data-j-managed=""
      className={className ? `j-virtual-list ${className}` : 'j-virtual-list'}
      data-divided={divided ? '' : undefined}
      style={mergedStyle}
    >
      {items.length === 0 ? (
        <div className="j-virtual-list__empty">{empty}</div>
      ) : (
        <div className="j-virtual-list__spacer" style={spacerStyle}>
          <div className="j-virtual-list__items" style={itemsStyle}>
            {slice.visibleIndices.map((idx) => {
              if (idx < 0 || idx >= items.length) return null;
              const item = items[idx];
              return (
                <div
                  key={resolveKey(item, idx)}
                  ref={
                    itemHeight == null
                      ? (el) => {
                          ctrlRef.current?.measureElement(el, idx);
                        }
                      : undefined
                  }
                  className="j-virtual-list__item"
                  role={itemRole}
                  aria-posinset={itemRole ? idx + 1 : undefined}
                  aria-setsize={itemRole ? items.length : undefined}
                  data-v-index={idx}
                  style={getItemStyle(idx)}
                >
                  {renderItem(item, idx)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
