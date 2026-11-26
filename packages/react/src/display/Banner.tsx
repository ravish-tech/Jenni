import {
  useState,
  type ComponentProps,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { Icon } from './Icon';
import { attr } from './types';

export type BannerTone = 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BannerVariant = 'soft' | 'solid' | 'surface';
export type BannerAlign = 'start' | 'center';

export interface BannerProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Semantic tone palette. */
  tone?: BannerTone;
  /** Visual fill & border treatment. */
  variant?: BannerVariant;
  /** Edge-to-edge mode (`border-radius: 0; border-inline: 0; border-top: 0;`) for shell top bars. */
  flush?: boolean;
  /** Content alignment across the banner row. */
  align?: BannerAlign;
  /** Named `Icon`, `true` for tone-matched icon, `false` to hide, or custom `ReactNode`. */
  icon?: string | boolean | ReactNode;
  /** Primary announcement headline. */
  title?: ReactNode;
  /** Supporting message copy when `children` is omitted. */
  description?: ReactNode;
  /** Trailing action controls. */
  actions?: ReactNode;
  /** Show trailing dismiss button. */
  dismissible?: boolean;
  /** Accessible label for the dismiss button. */
  closeLabel?: string;
  /** Controlled visibility state. */
  open?: boolean;
  /** Initial visibility state when uncontrolled. */
  defaultOpen?: boolean;
  /** Fired when visibility changes (e.g. dismissed). */
  onOpenChange?: (open: boolean) => void;
  /** Fired when the dismiss button is clicked. */
  onDismiss?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

function defaultToneIconName(tone: BannerTone): string {
  if (tone === 'success') return 'check-circle';
  if (tone === 'warning') return 'alert-triangle';
  if (tone === 'danger') return 'alert-circle';
  if (tone === 'accent') return 'sparkles';
  return 'info';
}

export function Banner({
  tone = 'info',
  variant = 'soft',
  flush = false,
  align = 'start',
  icon = true,
  title,
  description,
  actions,
  dismissible = false,
  closeLabel = 'Dismiss banner',
  open,
  defaultOpen = true,
  onOpenChange,
  onDismiss,
  className,
  children,
  ...rest
}: BannerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;

  if (!isOpen) return null;

  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';
  const body = children ?? description;

  let renderedIcon: ReactNode = null;
  if (icon !== false) {
    if (icon === true || icon === undefined) {
      renderedIcon = <Icon name={defaultToneIconName(tone)} size="md" />;
    } else if (typeof icon === 'string') {
      renderedIcon = icon.trim() ? <Icon name={icon.trim()} size="md" /> : null;
    } else {
      renderedIcon = icon;
    }
  }

  const handleClose = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (open === undefined) setUncontrolledOpen(false);
    onOpenChange?.(false);
    onDismiss?.(e);
  };

  return (
    <div
      role={role}
      {...rest}
      className={className ? `j-banner ${className}` : 'j-banner'}
      data-tone={tone}
      data-variant={attr(variant, 'soft')}
      data-align={attr(align, 'start')}
      data-flush={flush ? '' : undefined}
    >
      <div className="j-banner__inner">
        {renderedIcon != null && (
          <span className="j-banner__icon" aria-hidden="true">
            {renderedIcon}
          </span>
        )}

        {(title != null || body != null) && (
          <div className="j-banner__content">
            {title != null && <span className="j-banner__title">{title}</span>}
            {body != null && <span className="j-banner__description">{body}</span>}
          </div>
        )}

        {actions != null && <div className="j-banner__actions">{actions}</div>}
      </div>

      {dismissible && (
        <button
          type="button"
          className="j-banner__close"
          aria-label={closeLabel}
          onClick={handleClose}
        >
          <Icon name="x" size="sm" />
        </button>
      )}
    </div>
  );
}
