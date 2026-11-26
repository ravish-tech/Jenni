import {
  useEffect,
  useRef,
  type ComponentProps,
} from 'react';
import {
  createSplitHandle,
  type SplitHandleController,
  type SplitHandleDragPayload,
  type SplitHandleOrientation,
  type SplitHandleSource,
} from 'jenni-core/behaviors/split-handle.js';
import { attr, cx, mergeRefs } from './types';

export type { SplitHandleDragPayload, SplitHandleOrientation, SplitHandleSource };

export interface SplitHandleProps
  extends Omit<ComponentProps<'div'>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  /** Split direction: `'horizontal'` (vertical 1px bar between left/right panes) or `'vertical'` (horizontal 1px bar between top/bottom panes). */
  orientation?: SplitHandleOrientation;
  /** Render a centered 9px grip pill on the 1px hairline. */
  withGrip?: boolean;
  /** Disable pointer and keyboard resizing. */
  disabled?: boolean;
  /** Keyboard arrow step in pixels (default 16). */
  step?: number;
  /** Keyboard Shift+Arrow step in pixels (default 64). */
  largeStep?: number;
  /** Accessible label for the WAI-ARIA separator. */
  ariaLabel?: string;
  /** Current separator position (`aria-valuenow`). */
  valueNow?: number;
  /** Minimum separator position (`aria-valuemin`). */
  valueMin?: number;
  /** Maximum separator position (`aria-valuemax`). */
  valueMax?: number;
  /** Fired when pointer capture begins on the handle. */
  onDragStart?: (event: PointerEvent) => void;
  /** Fired on pointer move or keyboard arrow step. */
  onDrag?: (payload: SplitHandleDragPayload) => void;
  /** Fired when pointer drag completes or is cancelled. */
  onDragEnd?: (event: PointerEvent) => void;
}

export function SplitHandle({
  orientation = 'horizontal',
  withGrip = false,
  disabled = false,
  step = 16,
  largeStep = 64,
  ariaLabel,
  'aria-label': ariaLabelAttr,
  valueNow,
  valueMin,
  valueMax,
  onDragStart,
  onDrag,
  onDragEnd,
  className,
  ref,
  ...rest
}: SplitHandleProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<SplitHandleController | null>(null);
  const callbacksRef = useRef({ onDragStart, onDrag, onDragEnd });
  callbacksRef.current = { onDragStart, onDrag, onDragEnd };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctrl = createSplitHandle(el, {
      orientation,
      disabled,
      step,
      largeStep,
      onDragStart: (e) => callbacksRef.current.onDragStart?.(e),
      onDrag: (payload) => callbacksRef.current.onDrag?.(payload),
      onDragEnd: (e) => callbacksRef.current.onDragEnd?.(e),
    });
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    ctrlRef.current?.update({
      orientation,
      disabled,
      step,
      largeStep,
      onDragStart: (e) => callbacksRef.current.onDragStart?.(e),
      onDrag: (payload) => callbacksRef.current.onDrag?.(payload),
      onDragEnd: (e) => callbacksRef.current.onDragEnd?.(e),
    });
  }, [orientation, disabled, step, largeStep]);

  const resolvedAriaLabel = ariaLabelAttr ?? ariaLabel;

  return (
    <div
      {...rest}
      ref={mergeRefs(rootRef, ref)}
      className={cx('j-resize-handle', className)}
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-label={resolvedAriaLabel || undefined}
      aria-disabled={disabled ? true : undefined}
      aria-valuenow={valueNow != null ? valueNow : undefined}
      aria-valuemin={valueMin != null ? valueMin : undefined}
      aria-valuemax={valueMax != null ? valueMax : undefined}
      data-orientation={attr(orientation, 'horizontal')}
      data-with-grip={withGrip ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
    />
  );
}
