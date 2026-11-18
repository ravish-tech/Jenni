import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import {
  bindToasterInteractions,
  dismissToast,
  promoteToaster,
  registerToastHost,
  subscribeToasts,
  syncToasterLayout,
  toast,
  type ToastItem,
  type ToasterPosition,
} from '@jenni/core/behaviors/toast.js';
import { cx, flag, mergeRefs } from './types';

export { toast };

export interface ToasterProps extends ComponentProps<'div'> {
  position?: ToasterPosition;
  /** Maximum visible stacked cards (default 3). */
  max?: number;
  /** Keep the toast deck expanded continuously. */
  expanded?: boolean;
}

function ToneIcon({ tone }: { tone: ToastItem['tone'] }) {
  if (tone === 'success') {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="m5.5 8.2 1.7 1.7 3.4-3.7" />
      </svg>
    );
  }
  if (tone === 'danger') {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5.2v3.3M8 10.8h.01" />
      </svg>
    );
  }
  if (tone === 'warning') {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 2.4 14.2 13a.8.8 0 0 1-.7 1.2H2.5a.8.8 0 0 1-.7-1.2L8 2.4Z" />
        <path d="M8 6.5v3M8 11.6h.01" />
      </svg>
    );
  }
  if (tone === 'info') {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 7.4v3.4M8 5.2h.01" />
      </svg>
    );
  }
  return <span className="j-toast__dot" />;
}

export function Toaster({
  position = 'bottom-end',
  max = 3,
  expanded,
  className,
  ref,
  ...rest
}: ToasterProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const prevTopIdRef = useRef('');
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    const stopHost = registerToastHost();
    const stopSub = subscribeToasts((next) => {
      setList(next);
    });
    return () => {
      stopSub();
      stopHost();
    };
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    return bindToasterInteractions(el, { max });
  }, [max]);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const topId = list[0]?.id ?? '';
    const addedNew = Boolean(topId && topId !== prevTopIdRef.current);
    prevTopIdRef.current = topId;
    promoteToaster(el, list.length > 0, addedNew);
    const frame = requestAnimationFrame(() => {
      if (hostRef.current) syncToasterLayout(hostRef.current, max);
    });
    return () => cancelAnimationFrame(frame);
  }, [list, position, max, expanded]);

  return (
    <div
      {...rest}
      ref={mergeRefs(hostRef, ref)}
      className={cx('j-toaster', className)}
      popover="manual"
      role="region"
      aria-label="Notifications"
      data-position={position === 'bottom-end' ? undefined : position}
      data-expanded={flag(expanded)}
    >
      {list.map((item) => (
        <div
          key={item.id}
          className="j-toast"
          role={item.tone === 'danger' ? 'alert' : 'status'}
          aria-live={item.tone === 'danger' ? 'assertive' : 'polite'}
          data-tone={item.tone}
          data-state={item.state}
        >
          <div className="j-toast__inner">
            <span className="j-toast__indicator" aria-hidden="true">
              <ToneIcon tone={item.tone} />
            </span>

            <div className="j-toast__body">
              <p className="j-toast__title">{item.title}</p>
              {item.description && <p className="j-toast__description">{item.description}</p>}
            </div>

            {(item.action || item.closable) && (
              <div className="j-toast__actions">
                {item.action && (
                  <button
                    type="button"
                    className="j-toast__action"
                    onClick={() => {
                      item.action?.onClick?.();
                      dismissToast(item.id);
                    }}
                  >
                    {item.action.label}
                  </button>
                )}
                {item.closable && (
                  <button
                    type="button"
                    className="j-toast__close"
                    aria-label="Dismiss notification"
                    onClick={() => dismissToast(item.id)}
                  >
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
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
