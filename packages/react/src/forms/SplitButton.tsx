import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type ToggleEvent,
} from 'react';
import { createMenu } from 'jenni-core/behaviors/menu.js';
import { alignAttr, type FloatingAlign, type FloatingSide } from '../overlay/types';
import {
  cx,
  flag,
  mergeRefs,
  sizeAttr,
  useControllable,
  type Size,
  type Tone,
} from './types';

export type SplitButtonVariant = 'solid' | 'soft' | 'outline';

export interface SplitButtonProps
  extends Omit<ComponentProps<'div'>, 'onClick' | 'onSelect' | 'children'> {
  /** Primary button label. Alternatively pass `children` together with `menu`. */
  label?: ReactNode;
  /** Dropdown menu items (`DropdownItem`, `DropdownSeparator`, `DropdownSub`, …). */
  menu?: ReactNode | ((api: { close: () => void }) => ReactNode);
  /** Primary label when `menu` is provided, or dropdown items when `label` is provided. */
  children?: ReactNode | ((api: { close: () => void }) => ReactNode);
  variant?: SplitButtonVariant;
  size?: Size;
  tone?: Tone;
  disabled?: boolean;
  loading?: boolean;
  menuDisabled?: boolean;
  menuLabel?: string;
  side?: FloatingSide;
  align?: FloatingAlign;
  type?: 'button' | 'submit' | 'reset';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect?: (event: CustomEvent) => void;
}

export function SplitButton({
  label,
  menu: menuProp,
  children,
  variant = 'solid',
  size = 'md',
  tone,
  disabled,
  loading,
  menuDisabled,
  menuLabel = 'More actions',
  side = 'bottom',
  align = 'end',
  type = 'button',
  open,
  defaultOpen,
  onOpenChange,
  onClick,
  onSelect,
  className,
  ref,
  ...rest
}: SplitButtonProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const triggerBlocked = Boolean(disabled || menuDisabled);
  const buttonVariant = variant && variant !== 'solid' ? variant : undefined;

  const close = useCallback(() => {
    const el = menuRef.current;
    if (el?.matches(':popover-open')) {
      try {
        el.hidePopover();
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    const triggerEl = triggerRef.current;
    const menuEl = menuRef.current;
    if (!triggerEl || !menuEl) return;
    return createMenu(triggerEl, menuEl, {
      side,
      loop: true,
      manageChecked: false,
      anchor: rootRef.current,
    });
  }, [side]);

  useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const listener = (e: Event) => onSelectRef.current?.(e as CustomEvent);
    menuEl.addEventListener('j-select', listener);
    return () => menuEl.removeEventListener('j-select', listener);
  }, []);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const domOpen = el.matches(':popover-open');
    if (isOpen && !domOpen && !triggerBlocked) {
      try {
        el.showPopover();
      } catch {
        /* ignore */
      }
    } else if ((!isOpen || triggerBlocked) && domOpen) {
      try {
        el.hidePopover();
      } catch {
        /* ignore */
      }
    }
  }, [isOpen, open, triggerBlocked]);

  const handlePrimaryClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const handleToggle = (e: ToggleEvent<HTMLDivElement>) => {
    if (e.target !== menuRef.current) return;
    setOpen(e.newState === 'open');
  };

  const hasExplicitMenu = menuProp !== undefined;
  const childrenIsMenu = !hasExplicitMenu && label != null && children !== undefined;

  const primaryContent = childrenIsMenu
    ? label
    : label ?? (typeof children === 'function' ? children({ close }) : children);

  const rawMenuContent = hasExplicitMenu ? menuProp : childrenIsMenu ? children : null;
  const resolvedMenuContent =
    typeof rawMenuContent === 'function' ? rawMenuContent({ close }) : rawMenuContent;

  return (
    <div
      {...rest}
      ref={mergeRefs(rootRef, ref)}
      className={cx('j-split-button', className)}
      data-variant={variant}
      data-size={sizeAttr(size)}
      data-tone={tone}
    >
      <button
        type={type}
        className="j-button j-split-button__primary"
        disabled={disabled}
        aria-busy={loading || undefined}
        data-variant={buttonVariant}
        data-size={sizeAttr(size)}
        data-tone={tone}
        data-loading={flag(loading)}
        onClick={handlePrimaryClick}
      >
        {primaryContent}
      </button>

      <button
        ref={triggerRef}
        type="button"
        className="j-button j-split-button__trigger"
        aria-label={menuLabel}
        disabled={triggerBlocked || undefined}
        data-variant={buttonVariant}
        data-size={sizeAttr(size)}
        data-tone={tone}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
        </svg>
      </button>

      <div
        id={menuId}
        ref={menuRef}
        className="j-menu"
        popover="auto"
        role="menu"
        data-side={side}
        data-align={alignAttr(align)}
        onToggle={handleToggle}
      >
        {resolvedMenuContent}
      </div>
    </div>
  );
}
