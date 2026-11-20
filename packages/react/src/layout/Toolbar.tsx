/// <reference path="./toolbar-core.d.ts" />
import {
  useEffect,
  useRef,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type Ref,
} from 'react';
import { createToolbar } from 'jenni-core/behaviors/toolbar.js';
import { attr, cx, mergeRefs } from './types';

export type ToolbarSize = 'sm' | 'md' | 'lg';
export type ToolbarOrientation = 'horizontal' | 'vertical';
export type ToolbarBorder = 'bottom' | 'top' | 'all' | 'none';
export type ToolbarSurface = 1 | 2 | '1' | '2' | 'transparent';

type ToolbarOwnProps<T extends ElementType> = {
  as?: T;
  ref?: Ref<HTMLElement>;
  size?: ToolbarSize;
  orientation?: ToolbarOrientation;
  border?: ToolbarBorder;
  surface?: ToolbarSurface;
  sticky?: boolean;
  translucent?: boolean;
  wrap?: boolean;
  loop?: boolean;
  ariaLabel?: string;
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
};

export type ToolbarProps<T extends ElementType = 'div'> = ToolbarOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ToolbarOwnProps<T>>;

export function Toolbar<T extends ElementType = 'div'>({
  as,
  ref,
  size = 'md',
  orientation = 'horizontal',
  border = 'bottom',
  surface = 1,
  sticky,
  translucent,
  wrap,
  loop = true,
  ariaLabel,
  'aria-label': ariaLabelAttr,
  start,
  center,
  end,
  className,
  children,
  ...rest
}: ToolbarProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    return createToolbar(el, { orientation, loop });
  }, [orientation, loop]);

  const surfaceStr = String(surface);
  const surfaceAttr = surfaceStr === '1' ? undefined : surfaceStr;
  const resolvedLabel = ariaLabelAttr ?? ariaLabel ?? 'Toolbar';
  const hasSections = start != null || center != null || end != null;

  return (
    <Tag
      {...rest}
      ref={mergeRefs(rootRef, ref)}
      role="toolbar"
      aria-label={resolvedLabel}
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      className={cx('j-toolbar', className)}
      data-size={attr(size, 'md')}
      data-orientation={attr(orientation, 'horizontal')}
      data-border={attr(border, 'bottom')}
      data-surface={surfaceAttr}
      data-sticky={sticky ? '' : undefined}
      data-translucent={translucent ? '' : undefined}
      data-wrap={wrap ? '' : undefined}
    >
      {hasSections ? (
        <>
          {(start != null || children != null) && (
            <div className="j-toolbar__section" data-section="start">
              {start}
              {children}
            </div>
          )}
          {center != null && (
            <div className="j-toolbar__section" data-section="center">
              {center}
            </div>
          )}
          {end != null && (
            <div className="j-toolbar__section" data-section="end">
              {end}
            </div>
          )}
        </>
      ) : (
        children
      )}
    </Tag>
  );
}

export interface ToolbarGroupProps extends ComponentProps<'div'> {
  ariaLabel?: string;
}

export function ToolbarGroup({
  ariaLabel,
  'aria-label': ariaLabelAttr,
  className,
  ...rest
}: ToolbarGroupProps) {
  return (
    <div
      {...rest}
      role="group"
      aria-label={ariaLabelAttr ?? ariaLabel}
      className={cx('j-toolbar__group', className)}
    />
  );
}

export interface ToolbarSeparatorProps extends ComponentProps<'span'> {
  orientation?: 'vertical' | 'horizontal';
}

export function ToolbarSeparator({
  orientation = 'vertical',
  className,
  ...rest
}: ToolbarSeparatorProps) {
  return (
    <span
      {...rest}
      role="separator"
      aria-orientation={orientation}
      className={cx('j-toolbar__separator', className)}
    />
  );
}

export type ToolbarSpacerProps = ComponentProps<'span'>;

export function ToolbarSpacer({ className, ...rest }: ToolbarSpacerProps) {
  return <span {...rest} aria-hidden="true" className={cx('j-toolbar__spacer', className)} />;
}
