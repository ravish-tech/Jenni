import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type ComponentProps,
  type ReactNode,
  type Ref,
  type ToggleEvent,
} from 'react';
import {
  createContextMenu,
  type ContextMenuController,
  type ContextMenuEventLike,
  type ContextMenuOpenAtOptions,
  type ContextMenuOpenForOptions,
} from 'jenni-core/behaviors/context-menu.js';
import { cx, mergeRefs, useControllable, type ContextMenuHandle } from './types';

export type { ContextMenuHandle };

export interface ContextMenuTriggerApi {
  openAt: (x: number, y: number, opts?: ContextMenuOpenAtOptions | boolean) => void;
  openFor: (anchorEl: HTMLElement, opts?: ContextMenuOpenForOptions) => void;
  openFromEvent: (e: MouseEvent | KeyboardEvent | ContextMenuEventLike) => void;
  close: () => void;
}

export interface ContextMenuProps
  extends Omit<ComponentProps<'div'>, 'children' | 'onSelect' | 'ref'> {
  /** Right-click target region rendered inside `.j-context-menu-trigger`. */
  trigger?: ReactNode | ((api: ContextMenuTriggerApi) => ReactNode);
  /** Element id to bind right-click onto when `trigger` is omitted. */
  target?: string;
  /** Optional handle ref alias when not using standard `ref`. */
  menuRef?: Ref<ContextMenuHandle>;
  /** Optional ref to the underlying `.j-menu` `<div>` element. */
  elementRef?: Ref<HTMLDivElement>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (event: CustomEvent) => void;
  loop?: boolean;
  disabled?: boolean;
  children?: ReactNode | ((api: ContextMenuTriggerApi) => ReactNode);
}

export const ContextMenu = forwardRef<ContextMenuHandle, ContextMenuProps>(function ContextMenu(
  {
    trigger,
    target,
    menuRef: menuHandleRef,
    elementRef,
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
    ...rest
  },
  forwardedRef,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const targetWrapRef = useRef<HTMLDivElement | null>(null);
  const menuElRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<ContextMenuController | null>(null);
  const [isOpenState, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const hasTrigger = trigger != null;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const hide = useCallback(() => {
    if (ctrlRef.current) {
      ctrlRef.current.close();
    } else {
      const el = menuElRef.current;
      if (el?.matches(':popover-open')) {
        try {
          el.hidePopover();
        } catch {
          /* already hidden */
        }
      }
    }
    setOpen(false);
  }, [setOpen]);

  const openAt = useCallback(
    (x: number, y: number, opts?: ContextMenuOpenAtOptions | boolean) => {
      if (disabled) return;
      ctrlRef.current?.openAt(x, y, opts);
    },
    [disabled],
  );

  const openFor = useCallback(
    (anchorEl: HTMLElement, opts?: ContextMenuOpenForOptions) => {
      if (disabled) return;
      ctrlRef.current?.openFor(anchorEl, opts);
    },
    [disabled],
  );

  const openFromEvent = useCallback(
    (e: MouseEvent | KeyboardEvent | ContextMenuEventLike) => {
      if (disabled) return;
      ctrlRef.current?.openFromEvent(e);
    },
    [disabled],
  );

  const checkIsOpen = useCallback((): boolean => {
    return ctrlRef.current
      ? ctrlRef.current.isOpen()
      : Boolean(menuElRef.current?.matches(':popover-open'));
  }, []);

  const buildHandle = useCallback(
    (): ContextMenuHandle => ({
      openAt,
      openFor,
      openFromEvent,
      show: openAt,
      hide,
      close: hide,
      isOpen: checkIsOpen,
    }),
    [openAt, openFor, openFromEvent, hide, checkIsOpen],
  );

  useImperativeHandle(forwardedRef, buildHandle, [buildHandle]);
  useImperativeHandle(menuHandleRef, buildHandle, [buildHandle]);

  useEffect(() => {
    const menu = menuElRef.current;
    if (!menu || disabled) {
      ctrlRef.current = null;
      return;
    }
    const targetEl = (hasTrigger
      ? targetWrapRef.current
      : target && typeof document !== 'undefined'
        ? document.getElementById(target)
        : null) as HTMLElement | null;

    const ctrl = createContextMenu(targetEl, menu, { loop, manageChecked: false });
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      if (ctrlRef.current === ctrl) ctrlRef.current = null;
    };
  }, [hasTrigger, target, loop, disabled]);

  useEffect(() => {
    const menu = menuElRef.current;
    if (!menu) return;
    const listener = (e: Event) => onSelectRef.current?.(e as CustomEvent);
    menu.addEventListener('j-select', listener);
    return () => menu.removeEventListener('j-select', listener);
  }, []);

  useEffect(() => {
    const el = menuElRef.current;
    if (!el || isOpenState) return;
    if (el.matches(':popover-open')) {
      try {
        el.hidePopover();
      } catch {
        /* ignore */
      }
    }
  }, [isOpenState, open]);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    onToggle?.(e);
    setOpen(e.newState === 'open');
  };

  const api: ContextMenuTriggerApi = {
    openAt,
    openFor,
    openFromEvent,
    close: hide,
  };

  return (
    <>
      {hasTrigger && (
        <div ref={targetWrapRef} className="j-context-menu-trigger">
          {typeof trigger === 'function' ? trigger(api) : trigger}
        </div>
      )}
      <div
        {...rest}
        id={id}
        ref={mergeRefs(menuElRef, elementRef)}
        className={cx('j-menu', className)}
        popover="auto"
        role="menu"
        data-context-menu=""
        onToggle={handleToggle}
      >
        {typeof children === 'function' ? children(api) : children}
      </div>
    </>
  );
});
