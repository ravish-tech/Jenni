import {
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
  type ToggleEvent,
} from 'react';
import { createTooltip } from 'jenni-core/behaviors/tooltip.js';
import {
  alignAttr,
  cx,
  flag,
  mergeRefs,
  useControllable,
  type FloatingAlign,
  type FloatingSide,
} from './types';

export interface TooltipProps extends Omit<ComponentProps<'div'>, 'content'> {
  /** Tooltip label / content rendered inside the floating bubble. */
  content?: ReactNode;
  /** Single trigger element wrapped by the tooltip. */
  children: ReactNode;
  side?: FloatingSide;
  align?: FloatingAlign;
  arrow?: boolean;
  /** Open delay in ms (default 450). Moving between warm tooltips is instant. */
  delay?: number;
  /** Keyboard shortcut hint, e.g. "⌘K" or ['⌘', 'K']. */
  kbd?: string | string[];
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  arrow,
  delay,
  kbd,
  disabled,
  open,
  defaultOpen,
  onOpenChange,
  id: idProp,
  className,
  onToggle,
  ref,
  ...rest
}: TooltipProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const tipRef = useRef<HTMLDivElement | null>(null);
  const ctlRef = useRef<ReturnType<typeof createTooltip> | null>(null);
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);

  useEffect(() => {
    const tip = tipRef.current;
    const trigger = tip?.previousElementSibling as HTMLElement | null;
    if (!tip || !trigger || disabled) {
      ctlRef.current = null;
      return;
    }
    const ctl = createTooltip(trigger, tip, { delay, side });
    ctlRef.current = ctl;
    if (isOpen) ctl.show(true);
    return () => {
      ctl.destroy();
      ctlRef.current = null;
    };
  }, [disabled, delay, side]);

  useEffect(() => {
    if (open === undefined) return;
    const ctl = ctlRef.current;
    if (!ctl) return;
    if (open) ctl.show(true);
    else ctl.hide();
  }, [open]);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    onToggle?.(e);
    const next = e.newState === 'open';
    setOpen(next);
    if (open !== undefined && next !== open) {
      if (open) ctlRef.current?.show(true);
      else ctlRef.current?.hide();
    }
  };

  const keys = kbd == null ? [] : Array.isArray(kbd) ? kbd : [kbd];

  return (
    <>
      {children}
      <div
        {...rest}
        id={id}
        ref={mergeRefs(tipRef, ref)}
        className={cx('j-tooltip', className)}
        popover="manual"
        role="tooltip"
        data-side={side}
        data-align={alignAttr(align)}
        data-arrow={flag(arrow)}
        onToggle={handleToggle}
      >
        {content}
        {keys.map((k, i) => (
          <kbd key={`${k}-${i}`} className="j-tooltip__kbd">
            {k}
          </kbd>
        ))}
      </div>
    </>
  );
}
