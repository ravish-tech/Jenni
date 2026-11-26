import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
  type Ref,
  type ToggleEvent,
} from 'react';
import { createMenubar, type MenubarController } from 'jenni-core/behaviors/menubar.js';
import { cx, mergeRefs, useControllable } from './types';

export type MenubarSize = 'sm' | 'md';
export type MenubarVariant = 'plain' | 'surface' | 'bordered';

export interface MenubarHandle {
  open: (index: number) => void;
  close: (restoreFocus?: boolean) => void;
  refresh: () => void;
  readonly el: HTMLDivElement | null;
}

interface MenubarContextValue {
  openForTrigger: (trigger: HTMLElement | null) => void;
  closeForTrigger: (trigger: HTMLElement | null) => void;
}

const MenubarContext = createContext<MenubarContextValue | null>(null);

export interface MenubarProps extends Omit<ComponentProps<'div'>, 'onSelect'> {
  size?: MenubarSize;
  variant?: MenubarVariant;
  loop?: boolean;
  ariaLabel?: string;
  /** Optional imperative controller handle (`{ open, close, refresh, el }`). */
  menubarRef?: Ref<MenubarHandle>;
  onSelect?: (event: CustomEvent) => void;
}

export function Menubar({
  size = 'md',
  variant = 'bordered',
  loop = true,
  ariaLabel,
  'aria-label': ariaLabelAttr,
  menubarRef,
  onSelect,
  className,
  children,
  ref,
  ...rest
}: MenubarProps) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<MenubarController | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ctrl = createMenubar(el, { loop, manageChecked: false });
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      if (ctrlRef.current === ctrl) ctrlRef.current = null;
    };
  }, [loop]);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const listener = (e: Event) => onSelectRef.current?.(e as CustomEvent);
    el.addEventListener('j-select', listener);
    return () => el.removeEventListener('j-select', listener);
  }, []);

  const getTriggerIndex = useCallback((trigger: HTMLElement | null) => {
    const bar = barRef.current;
    if (!trigger || !bar) return -1;
    const triggers = [...bar.querySelectorAll('.j-menubar__trigger')];
    return triggers.indexOf(trigger);
  }, []);

  const openForTrigger = useCallback(
    (trigger: HTMLElement | null) => {
      const ctrl = ctrlRef.current;
      if (!ctrl) return;
      ctrl.refresh();
      const idx = getTriggerIndex(trigger);
      if (idx !== -1 && ctrl.getActiveIndex() !== idx) {
        ctrl.open(idx, null);
      }
    },
    [getTriggerIndex],
  );

  const closeForTrigger = useCallback(
    (trigger: HTMLElement | null) => {
      const ctrl = ctrlRef.current;
      if (!ctrl) return;
      const idx = getTriggerIndex(trigger);
      if (idx !== -1 && ctrl.getActiveIndex() === idx) {
        ctrl.close(false);
      }
    },
    [getTriggerIndex],
  );

  useImperativeHandle(
    menubarRef,
    () => ({
      open: (index: number) => {
        ctrlRef.current?.refresh();
        ctrlRef.current?.open(index, null);
      },
      close: (restoreFocus = false) => {
        ctrlRef.current?.close(restoreFocus);
      },
      refresh: () => {
        ctrlRef.current?.refresh();
      },
      get el() {
        return barRef.current;
      },
    }),
    [],
  );

  const ctxValue = useMemo<MenubarContextValue>(
    () => ({ openForTrigger, closeForTrigger }),
    [openForTrigger, closeForTrigger],
  );

  return (
    <MenubarContext value={ctxValue}>
      <div
        {...rest}
        ref={mergeRefs(barRef, ref)}
        className={cx('j-menubar', className)}
        role="menubar"
        aria-label={ariaLabelAttr ?? ariaLabel ?? 'Menu bar'}
        data-size={size === 'md' ? undefined : size}
        data-variant={variant === 'bordered' ? undefined : variant}
      >
        {children}
      </div>
    </MenubarContext>
  );
}

export interface MenubarMenuProps
  extends Omit<ComponentProps<'div'>, 'children' | 'onSelect'> {
  label: ReactNode;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (event: CustomEvent) => void;
  children?: ReactNode | ((api: { close: () => void }) => ReactNode);
}

function isMenuPopoverOpen(el: HTMLElement | null): boolean {
  if (!el) return false;
  try {
    return el.matches(':popover-open');
  } catch {
    return el.hasAttribute('data-open');
  }
}

export function MenubarMenu({
  label,
  disabled,
  open,
  defaultOpen,
  onOpenChange,
  onSelect,
  className,
  onToggle,
  children,
  ref,
  ...rest
}: MenubarMenuProps) {
  const menubarCtx = useContext(MenubarContext);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const close = useCallback(() => {
    if (menubarCtx && triggerRef.current) {
      menubarCtx.closeForTrigger(triggerRef.current);
    }
    const el = menuRef.current;
    if (el && isMenuPopoverOpen(el)) {
      try {
        el.hidePopover();
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }, [menubarCtx, setOpen]);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    if (isOpen) {
      if (!isMenuPopoverOpen(el)) {
        if (menubarCtx && triggerRef.current) {
          menubarCtx.openForTrigger(triggerRef.current);
        } else {
          try {
            el.showPopover();
          } catch {
            /* ignore */
          }
        }
      }
    } else if (isMenuPopoverOpen(el)) {
      if (menubarCtx && triggerRef.current) {
        menubarCtx.closeForTrigger(triggerRef.current);
      } else {
        try {
          el.hidePopover();
        } catch {
          /* ignore */
        }
      }
    }
  }, [isOpen, menubarCtx]);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const listener = (e: Event) => onSelectRef.current?.(e as CustomEvent);
    el.addEventListener('j-select', listener);
    return () => el.removeEventListener('j-select', listener);
  }, []);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    if (e.target !== menuRef.current) return;
    onToggle?.(e);
    setOpen(e.newState === 'open');
  };

  return (
    <div className="j-menubar__menu" role="none">
      <button
        ref={triggerRef}
        type="button"
        className="j-menubar__trigger"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={disabled || undefined}
        aria-disabled={disabled || undefined}
      >
        {label}
      </button>
      <div
        {...rest}
        id={menuId}
        ref={mergeRefs(menuRef, ref)}
        className={cx('j-menu', 'j-menubar__content', className)}
        role="menu"
        popover="manual"
        data-side="bottom"
        data-align="start"
        onToggle={handleToggle}
      >
        {typeof children === 'function' ? children({ close }) : children}
      </div>
    </div>
  );
}
