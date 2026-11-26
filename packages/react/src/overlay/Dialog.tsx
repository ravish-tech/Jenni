import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { bindDialogDefaultAction, lightDismiss } from 'jenni-core/behaviors/dialog.js';
import { cx, mergeRefs, sizeAttr, useControllable, type OverlaySize } from './types';

declare module 'jenni-core/behaviors/dialog.js' {
  export interface DialogDefaultActionOptions {
    defaultAction?: boolean | string | (() => boolean | string | undefined);
  }
  export function resolveDialogDefaultButton(
    dialog: HTMLDialogElement,
    defaultAction?: boolean | string,
  ): HTMLElement | null;
  export function focusDialogDefaultAction(
    dialog: HTMLDialogElement,
    defaultAction?: boolean | string,
  ): boolean;
  export function bindDialogDefaultAction(
    dialog: HTMLDialogElement,
    options?: DialogDefaultActionOptions,
  ): () => void;
}

export interface DialogProps extends Omit<ComponentProps<'dialog'>, 'title' | 'children'> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  header?: ReactNode | ((api: { titleId: string }) => ReactNode);
  footer?: ReactNode | ((api: { close: () => void }) => ReactNode);
  trigger?: ReactNode | ((api: { open: () => void }) => ReactNode);
  size?: OverlaySize;
  /** Show the top-right × close button (default true). */
  closable?: boolean;
  /** Close on backdrop click and Escape (default true). */
  dismissible?: boolean;
  /** Remove `.j-dialog__body` padding for edge-to-edge lists, tables, or editors. */
  flush?: boolean;
  /** Alias for `flush`. */
  bodyFlush?: boolean;
  /**
   * Primary action triggered on `Enter` and focused on open.
   * `true` (default) discovers any footer `[data-default-action]` button (`<Button default>`);
   * a `string` matches by `[data-action]`, `id`, `aria-label`, or trimmed button text;
   * `false` disables default Enter activation.
   */
  defaultAction?: boolean | string;
  /** Portal `<dialog>` into `document.body` (or selector / element); pass `false` to keep inline. */
  teleport?: boolean | string | HTMLElement;
  /** Alias for `teleport`. */
  portal?: boolean | HTMLElement;
  children?: ReactNode | ((api: { close: () => void }) => ReactNode);
}

export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  header,
  footer,
  trigger,
  size = 'md',
  closable = true,
  dismissible = true,
  flush,
  bodyFlush,
  defaultAction = true,
  teleport,
  portal,
  className,
  onClose,
  onCancel,
  children,
  ref,
  ...rest
}: DialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const defaultActionRef = useRef(defaultAction);
  defaultActionRef.current = defaultAction;
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveTeleport = teleport ?? portal ?? true;
  const portalTarget =
    effectiveTeleport !== false && mounted && typeof document !== 'undefined'
      ? typeof effectiveTeleport === 'string'
        ? document.querySelector(effectiveTeleport) ?? document.body
        : typeof HTMLElement !== 'undefined' && effectiveTeleport instanceof HTMLElement
          ? effectiveTeleport
          : typeof HTMLElement !== 'undefined' && portal instanceof HTMLElement
            ? portal
            : document.body
      : null;

  const show = useCallback(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
    setOpen(true);
  }, [setOpen]);

  const close = useCallback(() => {
    const el = dialogRef.current;
    if (el?.open) el.close();
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el || !dismissible) return;
    return lightDismiss(el);
  }, [dismissible, mounted, portalTarget, effectiveTeleport, portal]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    return bindDialogDefaultAction(el, {
      defaultAction: () => defaultActionRef.current,
    });
  }, [mounted, portalTarget, effectiveTeleport, portal]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (isOpen && !el.open) el.showModal();
    else if (!isOpen && el.open) el.close();
  }, [isOpen, open, mounted, portalTarget, effectiveTeleport, portal]);

  useEffect(() => {
    return () => {
      if (dialogRef.current?.open) dialogRef.current.close();
    };
  }, []);

  const handleClose = (e: SyntheticEvent<HTMLDialogElement>) => {
    onClose?.(e);
    setOpen(false);
  };

  const handleCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    onCancel?.(e);
    if (!dismissible) e.preventDefault();
  };

  const renderedTrigger =
    typeof trigger === 'function'
      ? trigger({ open: show })
      : isValidElement<{ onClick?: (e: ReactMouseEvent<HTMLElement>) => void }>(trigger)
        ? cloneElement(trigger, {
            onClick: (e: ReactMouseEvent<HTMLElement>) => {
              trigger.props.onClick?.(e);
              if (!e.defaultPrevented) show();
            },
          })
        : trigger;

  if (effectiveTeleport !== false && (!mounted || !portalTarget)) {
    return <>{renderedTrigger}</>;
  }

  const hasHeader = title != null || description != null || header != null;
  const body = typeof children === 'function' ? children({ close }) : children;

  const dialogNode = (
    <dialog
      {...rest}
      ref={mergeRefs(dialogRef, ref)}
      className={cx('j-dialog', className)}
      data-j-managed=""
      data-size={sizeAttr(size)}
      data-flush={flush || bodyFlush ? '' : undefined}
      aria-labelledby={title != null || header != null ? titleId : undefined}
      aria-describedby={description != null ? descId : undefined}
      onClose={handleClose}
      onCancel={handleCancel}
    >
      {hasHeader && (
        <header className="j-dialog__header">
          {header != null ? (
            typeof header === 'function' ? (
              header({ titleId })
            ) : (
              header
            )
          ) : (
            <>
              {title != null && (
                <h2 id={titleId} className="j-dialog__title">
                  {title}
                </h2>
              )}
              {description != null && (
                <p id={descId} className="j-dialog__description">
                  {description}
                </p>
              )}
            </>
          )}
        </header>
      )}
      {body != null && <div className="j-dialog__body">{body}</div>}
      {footer != null && (
        <footer className="j-dialog__footer">
          {typeof footer === 'function' ? footer({ close }) : footer}
        </footer>
      )}
      {closable && (
        <button type="button" className="j-dialog__close" aria-label="Close" onClick={close}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            shapeRendering="geometricPrecision"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </dialog>
  );

  return (
    <>
      {renderedTrigger}
      {effectiveTeleport === false ? dialogNode : createPortal(dialogNode, portalTarget!)}
    </>
  );
}
