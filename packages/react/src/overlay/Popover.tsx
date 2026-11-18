import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
  type ToggleEvent,
} from 'react';
import { createPopover } from '@jenni/core/behaviors/popover.js';
import {
  alignAttr,
  cx,
  flag,
  mergeRefs,
  sizeAttr,
  useControllable,
  type FloatingAlign,
  type FloatingSide,
  type OverlaySize,
} from './types';

export interface PopoverProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Trigger element rendered right before the popover panel. */
  trigger?: ReactNode;
  /** Element id to anchor to when `trigger` is omitted. */
  anchor?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: FloatingSide;
  align?: FloatingAlign;
  size?: OverlaySize;
  padding?: 'none';
  arrow?: boolean;
  children?: ReactNode | ((api: { close: () => void }) => ReactNode);
}

export function Popover({
  trigger,
  anchor,
  open,
  defaultOpen,
  onOpenChange,
  side = 'bottom',
  align = 'center',
  size = 'md',
  padding,
  arrow,
  id: idProp,
  className,
  onToggle,
  children,
  ref,
  ...rest
}: PopoverProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const hasTrigger = trigger != null;

  const close = useCallback(() => {
    const el = panelRef.current;
    if (el?.matches(':popover-open')) {
      try {
        el.hidePopover();
      } catch {
        /* already hidden */
      }
    }
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const triggerEl = (hasTrigger
      ? panel.previousElementSibling
      : anchor
        ? document.getElementById(anchor)
        : null) as HTMLElement | null;
    if (!triggerEl) return;
    return createPopover(triggerEl, panel, { side });
  }, [hasTrigger, anchor, side]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const domOpen = el.matches(':popover-open');
    if (isOpen && !domOpen) {
      try {
        el.showPopover();
      } catch {
        /* ignore */
      }
    } else if (!isOpen && domOpen) {
      try {
        el.hidePopover();
      } catch {
        /* ignore */
      }
    }
  }, [isOpen, open]);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    onToggle?.(e);
    const next = e.newState === 'open';
    setOpen(next);
  };

  return (
    <>
      {trigger}
      <div
        {...rest}
        id={id}
        ref={mergeRefs(panelRef, ref)}
        className={cx('j-popover', className)}
        popover="auto"
        data-side={side}
        data-align={alignAttr(align)}
        data-size={sizeAttr(size)}
        data-padding={padding}
        data-arrow={flag(arrow)}
        onToggle={handleToggle}
      >
        {typeof children === 'function' ? children({ close }) : children}
      </div>
    </>
  );
}
