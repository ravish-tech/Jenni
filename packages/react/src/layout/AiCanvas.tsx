import {
  useCallback,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react';
import { cx, useControllable } from './types';

type ThreadRenderApi = {
  artifactOpen: boolean;
  toggleArtifact: (next?: boolean) => void;
};

type ArtifactRenderApi = {
  closeArtifact: () => void;
};

type AiCanvasOwnProps<T extends ElementType> = {
  as?: T;
  artifactOpen?: boolean;
  defaultArtifactOpen?: boolean;
  onArtifactOpenChange?: (open: boolean) => void;
  artifactTitle?: ReactNode;
  header?: ReactNode | ((api: ThreadRenderApi) => ReactNode);
  composer?: ReactNode | ((api: ThreadRenderApi) => ReactNode);
  artifactHeader?: ReactNode | ((api: ArtifactRenderApi) => ReactNode);
  artifactActions?: ReactNode | ((api: ArtifactRenderApi) => ReactNode);
  artifact?: ReactNode | ((api: ArtifactRenderApi) => ReactNode);
  embedded?: boolean;
  height?: string | number;
  children?: ReactNode | ((api: ThreadRenderApi) => ReactNode);
};

export type AiCanvasProps<T extends ElementType = 'div'> = AiCanvasOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof AiCanvasOwnProps<T>>;

export function AiCanvas<T extends ElementType = 'div'>({
  as,
  artifactOpen,
  defaultArtifactOpen = false,
  onArtifactOpenChange,
  artifactTitle,
  header,
  composer,
  artifactHeader,
  artifactActions,
  artifact,
  embedded,
  height,
  style,
  className,
  children,
  ...rest
}: AiCanvasProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const [isOpen, setOpen] = useControllable(artifactOpen, defaultArtifactOpen, onArtifactOpenChange);

  const toggleArtifact = useCallback(
    (next?: boolean) => {
      setOpen(typeof next === 'boolean' ? next : !isOpen);
    },
    [isOpen, setOpen],
  );

  const closeArtifact = useCallback(() => setOpen(false), [setOpen]);

  const mergedStyle: CSSProperties | undefined =
    height != null
      ? {
          ...style,
          ['--j-ai-canvas-h' as string]: typeof height === 'number' ? `${height}px` : height,
        }
      : style;

  const threadApi: ThreadRenderApi = { artifactOpen: isOpen, toggleArtifact };
  const artifactApi: ArtifactRenderApi = { closeArtifact };

  const headerNode = typeof header === 'function' ? header(threadApi) : header;
  const childrenNode = typeof children === 'function' ? children(threadApi) : children;
  const composerNode = typeof composer === 'function' ? composer(threadApi) : composer;
  const artifactHeaderNode =
    typeof artifactHeader === 'function' ? artifactHeader(artifactApi) : artifactHeader;
  const artifactActionsNode =
    typeof artifactActions === 'function' ? artifactActions(artifactApi) : artifactActions;
  const artifactNode = typeof artifact === 'function' ? artifact(artifactApi) : artifact;

  const hasStageHeader =
    artifactHeader != null || artifactTitle != null || artifactActions != null;

  return (
    <Tag
      {...rest}
      className={cx('j-ai-canvas', className)}
      data-artifact-open={isOpen ? '' : undefined}
      data-embedded={embedded ? '' : undefined}
      style={mergedStyle}
    >
      <div className="j-ai-canvas__thread">
        {header != null && <header className="j-ai-canvas__header">{headerNode}</header>}

        <div className="j-ai-canvas__messages">
          <div className="j-ai-canvas__stream">{childrenNode}</div>
        </div>

        {composer != null && (
          <div className="j-ai-canvas__composer-wrap">
            <div className="j-ai-canvas__composer">{composerNode}</div>
          </div>
        )}
      </div>

      <section className="j-ai-canvas__stage" aria-hidden={!isOpen ? 'true' : undefined}>
        {hasStageHeader && (
          <header className="j-ai-canvas__stage-header">
            {artifactHeader != null ? (
              artifactHeaderNode
            ) : (
              <>
                {artifactTitle != null && (
                  <span className="j-ai-canvas__stage-title">{artifactTitle}</span>
                )}
                {artifactActions != null && (
                  <div className="j-ai-canvas__stage-actions">{artifactActionsNode}</div>
                )}
              </>
            )}
          </header>
        )}
        <div className="j-ai-canvas__stage-body">{artifactNode}</div>
      </section>
    </Tag>
  );
}
