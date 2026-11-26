import type {
  AriaRole,
  CSSProperties,
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from 'react';
import { Icon } from '../display/Icon';
import { attr, cx, type LayoutTone } from './types';

export type StatusBarVariant = 'subtle' | 'contrast' | 'accent';
export type StatusBarBorder = 'top' | 'bottom' | 'none';
export type StatusBarSize = 'sm' | 'md' | 'lg';
export type StatusBarTextSize = 'xs' | 'sm';

type StatusBarOwnProps<T extends ElementType> = {
  as?: T;
  variant?: StatusBarVariant;
  size?: StatusBarSize;
  height?: number | string;
  textSize?: StatusBarTextSize;
  mono?: boolean;
  border?: StatusBarBorder;
  ariaLabel?: string;
  role?: AriaRole;
  style?: CSSProperties;
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
};

export type StatusBarProps<T extends ElementType = 'div'> = StatusBarOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof StatusBarOwnProps<T>>;

const toPx = (v: string | number) => (typeof v === 'number' ? `${v}px` : v);

export function StatusBar<T extends ElementType = 'div'>({
  as,
  variant = 'subtle',
  size = 'md',
  height,
  textSize = 'xs',
  mono = false,
  border = 'top',
  ariaLabel,
  'aria-label': ariaLabelAttr,
  role = 'region',
  style,
  start,
  center,
  end,
  className,
  children,
  ...rest
}: StatusBarProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const startNode = start ?? children;
  const resolvedLabel = ariaLabelAttr ?? ariaLabel ?? 'Status bar';

  const customVars: Record<string, string> = {};
  if (height != null) customVars['--j-statusbar-h'] = toPx(height);
  const mergedStyle: CSSProperties | undefined =
    Object.keys(customVars).length > 0 ? { ...style, ...customVars } : style;

  return (
    <Tag
      {...rest}
      role={role}
      aria-label={resolvedLabel}
      className={cx('j-statusbar', className)}
      data-variant={attr(variant, 'subtle')}
      data-size={attr(size, 'md')}
      data-text={attr(textSize, 'xs')}
      data-mono={mono ? '' : undefined}
      data-border={attr(border, 'top')}
      style={mergedStyle}
    >
      {startNode != null && (
        <div className="j-statusbar__section" data-section="start">
          {startNode}
        </div>
      )}
      {center != null && (
        <div className="j-statusbar__section" data-section="center">
          {center}
        </div>
      )}
      {end != null && (
        <div className="j-statusbar__section" data-section="end">
          {end}
        </div>
      )}
    </Tag>
  );
}

type StatusBarItemOwnProps<T extends ElementType> = {
  as?: T;
  icon?: string | ReactNode;
  dot?: boolean;
  tone?: LayoutTone;
  interactive?: boolean;
  href?: string;
  title?: string;
  disabled?: boolean;
  /** Render a trailing vertical separator rule after this item. */
  separator?: boolean;
  children?: ReactNode;
};

export type StatusBarItemProps<T extends ElementType = 'span'> = StatusBarItemOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof StatusBarItemOwnProps<T>>;

export function StatusBarItem<T extends ElementType = 'span'>({
  as,
  icon,
  dot,
  tone,
  interactive,
  href,
  title,
  disabled,
  separator,
  className,
  children,
  ...rest
}: StatusBarItemProps<T>) {
  const Tag: ElementType = as ?? (href ? 'a' : interactive ? 'button' : 'span');
  const isButton = Tag === 'button';

  const node = (
    <Tag
      {...rest}
      type={isButton ? 'button' : undefined}
      href={href}
      title={title}
      disabled={isButton && disabled ? true : undefined}
      aria-disabled={!isButton && disabled ? true : undefined}
      className={cx('j-statusbar__item', className)}
      data-tone={tone}
      data-interactive={interactive && !isButton && !href ? '' : undefined}
    >
      {dot && <span className="j-statusbar__dot" aria-hidden="true" />}
      {typeof icon === 'string' ? <Icon name={icon} size="xs" /> : icon}
      {children}
    </Tag>
  );

  if (!separator) return node;

  return (
    <>
      {node}
      <StatusBarSeparator />
    </>
  );
}

export interface StatusBarSeparatorProps extends ComponentProps<'span'> {}

export function StatusBarSeparator({ className, ...rest }: StatusBarSeparatorProps) {
  return (
    <span
      {...rest}
      role="separator"
      aria-orientation="vertical"
      aria-hidden="true"
      className={cx('j-statusbar__sep', className)}
    />
  );
}
