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
import { cx, flag, mergeRefs, useControllable } from './types';

export type AlertDialogTone = 'danger' | 'warning' | 'accent' | 'info';
export type AlertDialogSize = 'sm' | 'md';

export interface AlertDialogProps
  extends Omit<ComponentProps<'dialog'>, 'title' | 'children' | 'onCancel'> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  tone?: AlertDialogTone;
  size?: AlertDialogSize;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Portal `<dialog>` into `document.body` (or selector / element); pass `false` to keep inline. */
  teleport?: boolean | string | HTMLElement;
  /** Alias for `teleport`. */
  portal?: boolean | HTMLElement;
  trigger?: ReactNode | ((api: { open: () => void }) => ReactNode);
  onConfirm?: (event: ReactMouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
  onCancel?: () => void;
  children?: ReactNode | ((api: { close: () => void; cancel: () => void }) => ReactNode);
}

function ToneIcon({ tone }: { tone: AlertDialogTone }) {
  if (tone === 'danger') {
    return (
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        shapeRendering="geometricPrecision"
      >
        <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z" />
        <path d="M12 8v4.5" />
        <path d="M12 16h.01" />
      </svg>
    );
  }
  if (tone === 'warning') {
    return (
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        shapeRendering="geometricPrecision"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }
  if (tone === 'info') {
    return (
      <svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        shapeRendering="geometricPrecision"
      >
        <circle cx={12} cy={12} r={9.5} />
        <path d="M12 16v-4.5" />
        <path d="M12 8h.01" />
      </svg>
    );
  }
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
    >
      <circle cx={12} cy={12} r={9.5} />
      <path d="m8.75 12.25 2.25 2.25 4.5-4.75" />
    </svg>
  );
}

export function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  tone = 'danger',
  size = 'sm',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  icon = true,
  closeOnBackdrop = false,
  closeOnEscape = true,
  teleport,
  portal,
  trigger,
  onConfirm,
  onCancel,
  onClose,
  className,
  children,
  ref,
  ...rest
}: AlertDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const mountedRef = useRef(false);
  const loadingRef = useRef(Boolean(loading));
  loadingRef.current = Boolean(loading);

  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const [mounted, setMounted] = useState(false);

  const preferSafeCancelFocus = tone === 'danger' || tone === 'warning';

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);
    return () => {
      mountedRef.current = false;
    };
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

  const focusInitial = useCallback(() => {
    const dlg = dialogRef.current;
    if (!dlg || !dlg.open) return;
    const userAutofocus = dlg.querySelector<HTMLElement>(
      '[autofocus]:not([data-alert-cancel]):not([data-alert-confirm])',
    );
    if (userAutofocus) {
      userAutofocus.focus({ preventScroll: true });
      return;
    }
    if (preferSafeCancelFocus && cancelBtnRef.current && !cancelBtnRef.current.disabled) {
      cancelBtnRef.current.focus({ preventScroll: true });
    } else if (!preferSafeCancelFocus && confirmBtnRef.current && !confirmBtnRef.current.disabled) {
      confirmBtnRef.current.focus({ preventScroll: true });
    }
  }, [preferSafeCancelFocus]);

  const show = useCallback(() => {
    const el = dialogRef.current;
    if (el && !el.open) {
      el.showModal();
      focusInitial();
    }
    setOpen(true);
  }, [focusInitial, setOpen]);

  const close = useCallback(() => {
    const el = dialogRef.current;
    if (el?.open) el.close();
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el || !closeOnBackdrop || loading) return;
    return lightDismiss(el);
  }, [closeOnBackdrop, loading, mounted, portalTarget, effectiveTeleport, portal]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (isOpen && !el.open) {
      el.showModal();
      focusInitial();
    } else if (!isOpen && el.open) {
      el.close();
    }
  }, [isOpen, open, mounted, portalTarget, effectiveTeleport, portal, focusInitial]);

  useEffect(() => {
    return () => {
      if (dialogRef.current?.open) dialogRef.current.close();
    };
  }, []);

  const handleDialogClose = (e: SyntheticEvent<HTMLDialogElement>) => {
    onClose?.(e);
    setOpen(false);
  };

  const handleDialogCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    if (!closeOnEscape || loading) {
      e.preventDefault();
      return;
    }
    onCancel?.();
  };

  const handleCancelClick = useCallback(() => {
    if (loadingRef.current) return;
    onCancel?.();
    close();
  }, [onCancel, close]);

  const handleConfirmClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    const res = onConfirm?.(e);
    if (e.defaultPrevented) return;
    if (res && typeof (res as PromiseLike<unknown>).then === 'function') {
      (res as PromiseLike<unknown>).then(
        () => {
          if (mountedRef.current && !loadingRef.current) close();
        },
        () => {
          /* keep dialog open on rejection so caller can display error */
        },
      );
      return;
    }
    queueMicrotask(() => {
      if (mountedRef.current && !e.defaultPrevented && !loadingRef.current) {
        close();
      }
    });
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

  const body =
    typeof children === 'function' ? children({ close, cancel: handleCancelClick }) : children;

  const dialogNode = (
    <dialog
      {...rest}
      ref={mergeRefs(dialogRef, ref)}
      className={cx('j-dialog', 'j-alert-dialog', className)}
      role="alertdialog"
      aria-modal="true"
      data-j-managed=""
      data-tone={tone}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={description != null ? descId : undefined}
      onClose={handleDialogClose}
      onCancel={handleDialogCancel}
    >
      <div className="j-alert-dialog__header">
        {icon && (
          <span className="j-alert-dialog__icon" aria-hidden="true">
            <ToneIcon tone={tone} />
          </span>
        )}
        <div className="j-alert-dialog__content">
          <h2 id={titleId} className="j-dialog__title j-alert-dialog__title">
            {title}
          </h2>
          {description != null && (
            <p id={descId} className="j-dialog__description j-alert-dialog__description">
              {description}
            </p>
          )}
        </div>
      </div>

      {body != null && <div className="j-alert-dialog__body">{body}</div>}

      <footer className="j-dialog__footer j-alert-dialog__footer">
        <button
          ref={cancelBtnRef}
          type="button"
          className="j-button"
          data-variant="outline"
          data-alert-cancel=""
          autoFocus={preferSafeCancelFocus || undefined}
          disabled={loading || undefined}
          onClick={handleCancelClick}
        >
          {cancelLabel}
        </button>
        <button
          ref={confirmBtnRef}
          type="button"
          className="j-button"
          data-alert-confirm=""
          data-tone={tone}
          data-loading={flag(loading)}
          aria-busy={loading || undefined}
          disabled={disabled || loading || undefined}
          onClick={handleConfirmClick}
        >
          {confirmLabel}
        </button>
      </footer>
    </dialog>
  );

  return (
    <>
      {renderedTrigger}
      {effectiveTeleport === false ? dialogNode : createPortal(dialogNode, portalTarget!)}
    </>
  );
}
