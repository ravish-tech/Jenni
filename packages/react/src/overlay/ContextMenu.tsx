import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
  type ToggleEvent,
} from 'react';
import { createContextMenu } from '@jenni/core/behaviors/context-menu.js';
import { cx, mergeRefs, useControllable } from './types';

export interface ContextMenuProps extends Omit<ComponentProps<'div'>, 'children' | 'onSelect'> {
  /** Right-click target region rendered inside `.j-context-menu-trigger`. */
  trigger?: ReactNode;
  /** Element id to bind right-click onto when `trigger` is omitted. */
  target?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (event: CustomEvent) => void;
  loop?: boolean;
  disabled?: boolean;
  children?: ReactNode | ((api: { close: () => void }) => ReactNode);
}

export function ContextMenu({
  trigger,
  target,
  open,
  defaultOpen,
  onOpenChange,
  onSelect,
  loop = true,
  disabled,
  id: idProp,
  className,
  onToggle,
  children,
  ref,
  ...rest
}: ContextMenuProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const targetWrapRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const hasTrigger = trigger != null;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const close = useCallback(() => {
    const el = menuRef.current;
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
    const menu = menuRef.current;
    if (!menu || disabled) return;
    const targetEl = (hasTrigger
      ? targetWrapRef.current
      : target
        ? document.getElementById(target)
        : null) as HTMLElement | null;
    if (!targetEl) return;
    return createContextMenu(targetEl, menu, { loop, manageChecked: false });
  }, [hasTrigger, target, loop, disabled]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const listener = (e: Event) => onSelectRef.current?.(e as CustomEvent);
    menu.addEventListener('j-select', listener);
    return () => menu.removeEventListener('j-select', listener);
  }, []);

  useEffect(() => {
    const el = menuRef.current;
    if (!el || isOpen) return;
    if (el.matches(':popover-open')) {
      try {
        el.hidePopover();
      } catch {
        /* ignore */
      }
    }
  }, [isOpen, open]);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    onToggle?.(e);
    setOpen(e.newState === 'open');
  };

  return (
    <>
      {hasTrigger && (
        <div ref={targetWrapRef} className="j-context-menu-trigger">
          {trigger}
        </div>
      )}
      <div
        {...rest}
        id={id}
        ref={mergeRefs(menuRef, ref)}
        className={cx('j-menu', className)}
        popover="auto"
        role="menu"
        data-context-menu=""
        onToggle={handleToggle}
      >
        {typeof children === 'function' ? children({ close }) : children}
      </div>
    </>
  );
}
