import type { ComponentProps, ReactNode } from 'react';
import { attr, type DisplaySize, type DisplayTone } from './types';

export type EmptyStateVariant = 'surface' | 'dashed' | 'ghost';

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  variant?: EmptyStateVariant;
  size?: DisplaySize;
  tone?: DisplayTone;
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function EmptyState({
  variant = 'surface',
  size = 'md',
  tone,
  icon,
  title,
  description,
  actions,
  className,
  children,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      {...rest}
      className={className ? `j-empty-state ${className}` : 'j-empty-state'}
      data-variant={attr(variant, 'surface')}
      data-size={attr(size, 'md')}
      data-tone={tone}
    >
      {icon != null && (
        <div className="j-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      {title != null && <h3 className="j-empty-state__title">{title}</h3>}
      {description != null && <p className="j-empty-state__description">{description}</p>}
      {children}
      {actions != null && <div className="j-empty-state__actions">{actions}</div>}
    </div>
  );
}
