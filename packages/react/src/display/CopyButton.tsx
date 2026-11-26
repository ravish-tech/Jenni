import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { copyToClipboard } from 'jenni-core/behaviors/code-block.js';
import { attr } from './types';

export type CopyButtonSize = 'xs' | 'sm' | 'md';
export type CopyButtonVariant = 'ghost' | 'outline' | 'soft';

export interface CopyButtonProps
  extends Omit<ComponentProps<'button'>, 'value' | 'onCopy'> {
  /** Text string written to the clipboard when activated. */
  value: string;
  /** Control height & icon scale. */
  size?: CopyButtonSize;
  /** Visual surface treatment. */
  variant?: CopyButtonVariant;
  /** Optional visible text label beside the icon. */
  label?: string;
  /** Accessible label announced before copying. */
  ariaLabel?: string;
  /** Accessible (and visible, when `label` is set) text shown after copying. */
  copiedLabel?: string;
  /** Reset delay in milliseconds for the transient copied state. */
  timeout?: number;
  /** Disable button interaction. */
  disabled?: boolean;
  /** Fired after `value` is copied to the clipboard. */
  onCopy?: (value: string) => void;
}

export function CopyButton({
  value,
  size = 'sm',
  variant = 'ghost',
  label,
  ariaLabel = 'Copy to clipboard',
  copiedLabel = 'Copied',
  timeout = 1600,
  disabled = false,
  onCopy,
  onClick,
  className,
  children,
  ...rest
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClick = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;

    const ok = await copyToClipboard(value);
    if (!ok) return;

    setCopied(true);
    onCopy?.(value);

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    const duration = Math.max(200, timeout ?? 1600);
    timerRef.current = setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, duration);
  };

  const hasLabelContent = Boolean(label) || children != null;

  return (
    <button
      type="button"
      {...rest}
      data-j-managed=""
      className={className ? `j-copy-button ${className}` : 'j-copy-button'}
      data-size={attr(size, 'sm')}
      data-variant={attr(variant, 'ghost')}
      data-copied={copied ? '' : undefined}
      disabled={disabled}
      aria-label={copied ? copiedLabel : ariaLabel}
      onClick={handleClick}
    >
      <span className="j-copy-button__icons" aria-hidden="true">
        <svg
          className="j-copy-button__icon j-copy-button__icon--copy"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          shapeRendering="geometricPrecision"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg
          className="j-copy-button__icon j-copy-button__icon--check"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          shapeRendering="geometricPrecision"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {hasLabelContent && (
        <span className="j-copy-button__label">
          {copied ? copiedLabel : (children ?? label)}
        </span>
      )}
    </button>
  );
}
