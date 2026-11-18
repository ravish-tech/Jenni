import type { CSSProperties, ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { attr, cx, type CanvasGrid, type CanvasToolsPlacement } from './types';

type CanvasStageOwnProps<T extends ElementType> = {
  as?: T;
  grid?: CanvasGrid;
  toolsPlacement?: CanvasToolsPlacement;
  inspectorOpen?: boolean;
  top?: ReactNode;
  tools?: ReactNode;
  inspector?: ReactNode;
  hud?: ReactNode;
  embedded?: boolean;
  height?: string | number;
  children?: ReactNode;
};

export type CanvasStageProps<T extends ElementType = 'div'> = CanvasStageOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof CanvasStageOwnProps<T>>;

export function CanvasStage<T extends ElementType = 'div'>({
  as,
  grid = 'dots',
  toolsPlacement = 'left',
  inspectorOpen,
  top,
  tools,
  inspector,
  hud,
  embedded,
  height,
  style,
  className,
  children,
  ...rest
}: CanvasStageProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const mergedStyle: CSSProperties | undefined =
    height != null
      ? {
          ...style,
          ['--j-canvas-h' as string]: typeof height === 'number' ? `${height}px` : height,
        }
      : style;

  return (
    <Tag
      {...rest}
      className={cx('j-canvas-stage', className)}
      data-grid={attr(grid, 'none')}
      data-tools-placement={attr(toolsPlacement, 'left')}
      data-inspector-open={inspectorOpen ? '' : undefined}
      data-embedded={embedded ? '' : undefined}
      style={mergedStyle}
    >
      <div className="j-canvas-stage__viewport">{children}</div>

      {top != null && <div className="j-canvas-stage__top">{top}</div>}

      {tools != null && (
        <div
          className="j-canvas-stage__tools"
          data-placement={attr(toolsPlacement, 'left')}
          role="toolbar"
          aria-label="Canvas tools"
        >
          {tools}
        </div>
      )}

      {inspector != null && (
        <aside className="j-canvas-stage__inspector" aria-label="Inspector">
          {inspector}
        </aside>
      )}

      {hud != null && <div className="j-canvas-stage__hud">{hud}</div>}
    </Tag>
  );
}
