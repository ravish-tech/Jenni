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
    viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  if (tone === 'success') return <svg {...common}><circle cx="8" cy="8" r="6.25" /><path d="m5.5 8.25 1.75 1.75 3.25-3.75" /></svg>;
  if (tone === 'warning') return <svg {...common}><path d="M7.13 2.5a1 1 0 0 1 1.74 0l5.4 9.5a1 1 0 0 1-.87 1.5H2.6a1 1 0 0 1-.87-1.5z" /><path d="M8 6.5v2.75M8 11.25v.01" /></svg>;
  if (tone === 'danger') return <svg {...common}><circle cx="8" cy="8" r="6.25" /><path d="M8 4.75v3.75M8 10.75v.01" /></svg>;
  return <svg {...common}><circle cx="8" cy="8" r="6.25" /><path d="M8 7.25v3.5M8 5.25v.01" /></svg>;
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
