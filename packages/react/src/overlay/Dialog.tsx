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
import { lightDismiss } from 'jenni-core/behaviors/dialog.js';
import { cx, mergeRefs, sizeAttr, useControllable, type OverlaySize } from './types';

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
      data-size={sizeAttr(size)}
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
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
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
