/// <reference path="./core.d.ts" />
import { useCallback, useRef, useState, type Ref } from 'react';

export type LayoutGap = 'none' | 'inline' | 'related' | 'item' | 'field' | 'group' | 'section';
export type LayoutAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type LayoutJustify = 'start' | 'center' | 'end' | 'between';
export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'prose' | 'full';
export type PageSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type GridCols =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  | 'auto-fit'
  | 'auto-fill';
export type GridSpan =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  | 'full'
  | 'auto';
export type GridStart =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export type GridRowSpan = 1 | 2 | 3 | 4 | 5 | 6 | '1' | '2' | '3' | '4' | '5' | '6' | 'full';
export type GridFlow = 'row' | 'dense' | 'col';
export type GridOrder = 'first' | 'last' | 1 | 2 | 3 | '1' | '2' | '3';
export type GridSubgrid = boolean | 'rows' | 'cols' | 'both';

export type ListVariant = 'plain' | 'divided' | 'card';
export type ListLines = 'compact' | 1 | 2 | 3 | '1' | '2' | '3';
export type LayoutTone = 'accent' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';

export type SectionLayout = 'stack' | 'split';
export type BottomBarVariant = 'tabs' | 'actions';

export type ShellLayout =
  | 'sidebar'
  | 'header-sidebar'
  | 'centered'
  | 'focus'
  | 'bars'
  | 'workspace'
  | 'studio'
  | 'ide'
  | 'copilot'
  | 'split'
  | 'dual-nav'
  | 'topnav'
  | 'three-pane'
  | 'holy-grail'
  | 'command-center'
  | 'floating-dock'
  | 'adaptive';
export type ShellVariant = 'flat' | 'inset' | 'floating' | 'contrast';
export type ShellPane = 'master' | 'detail';
export type ShellSide = 'start' | 'end';

export type BentoSpan = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12 | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '12';
export type BentoRowSpan = 1 | 2 | 3 | '1' | '2' | '3';
export type CanvasGrid = 'none' | 'dots' | 'lines';
export type CanvasToolsPlacement = 'left' | 'bottom';
export type ScrollOrientation = 'vertical' | 'horizontal' | 'both';
export type ScrollbarVisibility = 'subtle' | 'hover' | 'hidden';
export type ResizableOrientation = 'horizontal' | 'vertical';

export const attr = <T extends string>(value: T | undefined, fallback?: T): T | undefined =>
  value === fallback ? undefined : value;

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (el: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: T | null }).current = el;
    }
  };
}

export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;
  const valueRef = useRef(current);
  valueRef.current = current;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const set = useCallback(
    (v: T) => {
      if (!isControlled) setInner(v);
      onChangeRef.current?.(v);
    },
    [isControlled],
  );
  return [current, set] as const;
}
