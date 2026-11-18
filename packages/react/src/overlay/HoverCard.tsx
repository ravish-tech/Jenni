import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
  type ToggleEvent,
} from 'react';
import { createHoverCard } from 'jenni-core/behaviors/hover-card.js';
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

export interface HoverCardProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Trigger element rendered right before the hover card. */
  trigger?: ReactNode;
  /** Element id to anchor to when `trigger` is omitted. */
  anchor?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: FloatingSide;
  align?: FloatingAlign;
  size?: OverlaySize;
  arrow?: boolean;
  /** Open delay in ms (default 320). */
  openDelay?: number;
  /** Close bridge delay in ms (default 180). */
  closeDelay?: number;
  disabled?: boolean;
  children?: ReactNode | ((api: { close: () => void }) => ReactNode);
}

export function HoverCard({
  trigger,
  anchor,
  open,
  defaultOpen,
  onOpenChange,
  side = 'bottom',
  align = 'center',
  size = 'md',
  arrow,
  openDelay = 320,
  closeDelay = 180,
  disabled,
  id: idProp,
  className,
  onToggle,
  children,
  ref,
  ...rest
}: HoverCardProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const ctlRef = useRef<ReturnType<typeof createHoverCard> | null>(null);
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const hasTrigger = trigger != null;

  const close = useCallback(() => {
    ctlRef.current?.hide();
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || disabled) {
      ctlRef.current = null;
      return;
    }
    const triggerEl = (hasTrigger
      ? card.previousElementSibling
      : anchor
        ? document.getElementById(anchor)
        : null) as HTMLElement | null;
    if (!triggerEl) {
      ctlRef.current = null;
      return;
    }
    const ctl = createHoverCard(triggerEl, card, { openDelay, closeDelay, side });
    ctlRef.current = ctl;
    if (isOpen) ctl.show();
    return () => {
      ctl.destroy();
      ctlRef.current = null;
    };
  }, [hasTrigger, anchor, openDelay, closeDelay, side, disabled]);

  useEffect(() => {
    if (open === undefined) return;
    const ctl = ctlRef.current;
    if (!ctl) return;
    if (open) ctl.show();
    else ctl.hide();
  }, [open]);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    onToggle?.(e);
    const next = e.newState === 'open';
    setOpen(next);
    if (open !== undefined && next !== open) {
      if (open) ctlRef.current?.show();
      else ctlRef.current?.hide();
    }
  };

  return (
    <>
      {trigger}
      <div
        {...rest}
        id={id}
        ref={mergeRefs(cardRef, ref)}
        className={cx('j-hover-card', className)}
        popover="manual"
        data-side={side}
        data-align={alignAttr(align)}
        data-size={sizeAttr(size)}
        data-arrow={flag(arrow)}
        onToggle={handleToggle}
      >
        {typeof children === 'function' ? children({ close }) : children}
      </div>
    </>
  );
}
