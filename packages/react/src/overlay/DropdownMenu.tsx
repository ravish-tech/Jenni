import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ElementType,
  type ReactNode,
  type ToggleEvent,
} from 'react';
import { createMenu, createSubmenu } from 'jenni-core/behaviors/menu.js';
import {
  alignAttr,
  cx,
  flag,
  mergeRefs,
  useControllable,
  type FloatingAlign,
  type FloatingSide,
  type MenuItemRole,
  type MenuItemTone,
} from './types';

export interface DropdownMenuProps extends Omit<ComponentProps<'div'>, 'children' | 'onSelect'> {
  /** Trigger button rendered right before the menu popover. */
  trigger?: ReactNode;
  /** Element id to anchor to when `trigger` is omitted. */
  anchor?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (event: CustomEvent) => void;
  side?: FloatingSide;
  align?: FloatingAlign;
  arrow?: boolean;
  loop?: boolean;
  children?: ReactNode | ((api: { close: () => void }) => ReactNode);
}

export function DropdownMenu({
  trigger,
  anchor,
  open,
  defaultOpen,
  onOpenChange,
  onSelect,
  side = 'bottom',
  align = 'start',
  arrow,
  loop = true,
  id: idProp,
  className,
  onToggle,
  children,
  ref,
  ...rest
}: DropdownMenuProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
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
    if (!menu) return;
    const triggerEl = (hasTrigger
      ? menu.previousElementSibling
      : anchor
        ? document.getElementById(anchor)
        : null) as HTMLElement | null;
    if (!triggerEl) return;
    return createMenu(triggerEl, menu, { side, loop, manageChecked: false });
  }, [hasTrigger, anchor, side, loop]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const listener = (e: Event) => onSelectRef.current?.(e as CustomEvent);
    menu.addEventListener('j-select', listener);
    return () => menu.removeEventListener('j-select', listener);
  }, []);

  useEffect(() => {
    const el = menuRef.current;
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
    if (e.target !== menuRef.current) return;
    onToggle?.(e);
    setOpen(e.newState === 'open');
  };

  return (
    <>
      {trigger}
      <div
        {...rest}
        id={id}
        ref={mergeRefs(menuRef, ref)}
        className={cx('j-menu', className)}
        popover="auto"
        role="menu"
        data-side={side}
        data-align={alignAttr(align)}
        data-arrow={flag(arrow)}
        onToggle={handleToggle}
      >
        {typeof children === 'function' ? children({ close }) : children}
      </div>
    </>
  );
}

type DropdownItemOwnProps<T extends ElementType> = {
  as?: T;
  href?: string;
  role?: MenuItemRole;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onSelect?: (event: CustomEvent) => void;
  icon?: ReactNode;
  shortcut?: ReactNode;
  tone?: MenuItemTone;
  inset?: boolean;
  disabled?: boolean;
  keepOpen?: boolean;
  closeOnSelect?: boolean;
  textValue?: string;
};

export type DropdownItemProps<T extends ElementType = 'button'> = DropdownItemOwnProps<T> &
  Omit<ComponentProps<T>, keyof DropdownItemOwnProps<T>>;

export function DropdownItem<T extends ElementType = 'button'>({
  as,
  href,
  role = 'menuitem',
  checked,
  defaultChecked,
  onCheckedChange,
  onSelect,
  icon,
  shortcut,
  tone,
  inset,
  disabled,
  keepOpen,
  closeOnSelect,
  textValue,
  className,
  children,
  ref,
  ...rest
}: DropdownItemProps<T>) {
  const Tag: ElementType = as ?? (href ? 'a' : 'button');
  const itemRef = useRef<HTMLElement | null>(null);
  const [isChecked, setChecked] = useControllable(checked, defaultChecked ?? false, onCheckedChange);

  const stateRef = useRef({ role, disabled, isChecked, setChecked, onSelect });
  stateRef.current = { role, disabled, isChecked, setChecked, onSelect };

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const listener = (e: Event) => {
      const s = stateRef.current;
      if (s.disabled) {
        e.preventDefault();
        return;
      }
      if (s.role === 'menuitemcheckbox') {
        s.setChecked(!s.isChecked);
      } else if (s.role === 'menuitemradio' && !s.isChecked) {
        s.setChecked(true);
      }
      s.onSelect?.(e as CustomEvent);
    };
    el.addEventListener('j-select', listener);
    return () => el.removeEventListener('j-select', listener);
  }, []);

  return (
    <Tag
      {...rest}
      ref={mergeRefs(itemRef, ref as never)}
      type={Tag === 'button' ? 'button' : undefined}
      href={href}
      role={role}
      className={cx('j-menu__item', className)}
      aria-checked={role === 'menuitem' ? undefined : isChecked}
      disabled={Tag === 'button' && disabled ? true : undefined}
      aria-disabled={disabled || undefined}
      data-tone={tone}
      data-inset={flag(inset)}
      data-keep-open={flag(keepOpen)}
      data-close={flag(closeOnSelect)}
      data-text-value={textValue}
    >
      {icon}
      {children}
      {shortcut != null && <kbd className="j-menu__shortcut">{shortcut}</kbd>}
    </Tag>
  );
}

export interface DropdownSubProps extends Omit<ComponentProps<'div'>, 'children'> {
  label?: ReactNode;
  icon?: ReactNode;
  inset?: boolean;
  disabled?: boolean;
  textValue?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function DropdownSub({
  label,
  icon,
  inset,
  disabled,
  textValue,
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
  ref,
  ...rest
}: DropdownSubProps) {
  const subId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const subMenuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);

  useEffect(() => {
    const triggerEl = triggerRef.current;
    const subMenuEl = subMenuRef.current;
    if (!triggerEl || !subMenuEl) return;
    return createSubmenu(triggerEl, subMenuEl, { manageChecked: false });
  }, []);

  useEffect(() => {
    const el = subMenuRef.current;
    if (!el) return;
    const domOpen = el.matches(':popover-open');
    if (isOpen && !domOpen && !disabled) {
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
  }, [isOpen, open, disabled]);

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    if (e.target !== subMenuRef.current) return;
    setOpen(e.newState === 'open');
  };

  const resolvedTextValue =
    textValue ?? (typeof label === 'string' || typeof label === 'number' ? String(label) : undefined);

  return (
    <div {...rest} ref={ref} className={cx('j-menu__sub', className)}>
      <button
        ref={triggerRef}
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={subId}
        disabled={disabled || undefined}
        aria-disabled={disabled || undefined}
        data-inset={flag(inset)}
        data-text-value={resolvedTextValue}
        className="j-menu__item j-menu__sub-trigger"
      >
        {icon}
        {label}
        <svg
          className="j-menu__sub-chevron"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 4 4 4-4 4" />
        </svg>
      </button>
      <div
        id={subId}
        ref={subMenuRef}
        className="j-menu j-menu__sub-content"
        role="menu"
        popover="manual"
        data-side="right"
        data-align="start"
        onToggle={handleToggle}
      >
        {children}
      </div>
    </div>
  );
}

export interface DropdownLabelProps extends ComponentProps<'div'> {
  inset?: boolean;
}

export function DropdownLabel({ inset, className, ...rest }: DropdownLabelProps) {
  return (
    <div
      role="presentation"
      className={cx('j-menu__label', className)}
      data-inset={flag(inset)}
      {...rest}
    />
  );
}

export type DropdownSeparatorProps = ComponentProps<'hr'>;

export function DropdownSeparator({ className, ...rest }: DropdownSeparatorProps) {
  return <hr role="separator" className={cx('j-menu__separator', className)} {...rest} />;
}
