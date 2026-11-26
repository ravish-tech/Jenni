import type { ComponentProps, ReactNode } from 'react';
import { attr, type DisplayTone } from './types';

export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
  variant?: 'soft' | 'outline';
  tone?: DisplayTone;
  title?: ReactNode;
  description?: ReactNode;
  /** Custom icon, or `false` to hide it. Default: a tone-matched icon. */
  icon?: ReactNode | false;
  actions?: ReactNode;
}

function ToneIcon({ tone }: { tone?: DisplayTone }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    shapeRendering: 'geometricPrecision' as const,
  };
  if (tone === 'success') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9.25" />
        <path d="m8.25 12.25 2.5 2.5 5-5.5" />
      </svg>
    );
  }
  if (tone === 'warning') {
    return (
      <svg {...common}>
        <path d="M10.44 4.2a1.8 1.8 0 0 1 3.12 0l7.2 12.47A1.8 1.8 0 0 1 19.2 19.37H4.8a1.8 1.8 0 0 1-1.56-2.7Z" />
        <path d="M12 9.25v4.25M12 16.5h.01" />
      </svg>
    );
  }
  if (tone === 'danger') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9.25" />
        <path d="M12 7.75v4.75M12 15.75h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export function Alert({ variant = 'soft', tone, title, description, icon, actions, className, children, ...rest }: AlertProps) {
  // Urgent tones interrupt screen readers; others are polite. Override via `role`.
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';
  const body = children ?? description;

  return (
    <div
      role={role}
      {...rest}
      className={className ? `j-alert ${className}` : 'j-alert'}
      data-variant={attr(variant, 'soft')}
      data-tone={tone}
    >
      {icon !== false && (
        <span className="j-alert__icon" aria-hidden="true">{icon ?? <ToneIcon tone={tone} />}</span>
      )}
      <div className="j-alert__content">
        {title != null && <p className="j-alert__title">{title}</p>}
        {body != null && <div className="j-alert__description">{body}</div>}
      </div>
      {actions != null && <div className="j-alert__actions">{actions}</div>}
    </div>
  );
}
