import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cx, useControllable, type LayoutTone } from './types';

type SidebarRenderApi = {
  collapsed: boolean;
  toggle: () => void;
};

type SidebarOwnProps<T extends ElementType> = {
  as?: T;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  tone?: LayoutTone;
  ariaLabel?: string;
  header?: ReactNode | ((api: SidebarRenderApi) => ReactNode);
  footer?: ReactNode | ((api: { collapsed: boolean }) => ReactNode);
  children?: ReactNode | ((api: { collapsed: boolean }) => ReactNode);
};

export type SidebarProps<T extends ElementType = 'div'> = SidebarOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof SidebarOwnProps<T>>;

export function Sidebar<T extends ElementType = 'div'>({
  as,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  tone,
  ariaLabel = 'Primary navigation',
  header,
  footer,
  className,
  children,
  ...rest
}: SidebarProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const isOuterNav = Tag === 'nav';
  const BodyTag: ElementType = isOuterNav ? 'div' : 'nav';
  const [isCollapsed, setCollapsed] = useControllable(collapsed, defaultCollapsed, onCollapsedChange);
  const toggle = () => setCollapsed(!isCollapsed);

  return (
    <Tag
      aria-label={isOuterNav ? ariaLabel : undefined}
      {...rest}
      className={cx('j-sidebar', className)}
      data-collapsed={isCollapsed ? '' : undefined}
      data-tone={tone}
    >
      {header != null && (
        <div className="j-sidebar__header">
          {typeof header === 'function' ? header({ collapsed: isCollapsed, toggle }) : header}
        </div>
      )}
      <BodyTag className="j-sidebar__body" aria-label={isOuterNav ? undefined : ariaLabel}>
        {typeof children === 'function' ? children({ collapsed: isCollapsed }) : children}
      </BodyTag>
      {footer != null && (
        <div className="j-sidebar__footer">
          {typeof footer === 'function' ? footer({ collapsed: isCollapsed }) : footer}
        </div>
      )}
    </Tag>
  );
}

export interface SidebarGroupProps extends ComponentPropsWithoutRef<'div'> {
  label?: ReactNode;
}

export function SidebarGroup({ label, className, children, ...rest }: SidebarGroupProps) {
  return (
    <div
      role="group"
      aria-label={typeof label === 'string' ? label : undefined}
      {...rest}
      className={cx('j-sidebar__group', className)}
    >
      {label != null && <div className="j-sidebar__label">{label}</div>}
      {children}
    </div>
  );
}

type SidebarItemOwnProps<T extends ElementType> = {
  as?: T;
  label?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  children?: ReactNode;
};

export type SidebarItemProps<T extends ElementType = 'button'> = SidebarItemOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof SidebarItemOwnProps<T>>;

export function SidebarItem<T extends ElementType = 'button'>({
  as,
  label,
  icon,
  badge,
  active,
  disabled,
  className,
  children,
  ...rest
}: SidebarItemProps<T>) {
  const Tag: ElementType = as ?? 'button';
  const isButton = Tag === 'button';

  return (
    <Tag
      type={isButton ? 'button' : undefined}
      disabled={isButton && disabled ? true : undefined}
      aria-disabled={!isButton && disabled ? 'true' : undefined}
      aria-current={active ? 'page' : undefined}
      title={label}
      {...rest}
      className={cx('j-sidebar__item', className)}
    >
      {icon != null && <span className="j-sidebar__item-icon">{icon}</span>}
      <span className="j-sidebar__item-label">{children ?? label}</span>
      {badge != null && <span className="j-sidebar__item-badge">{badge}</span>}
    </Tag>
  );
}
