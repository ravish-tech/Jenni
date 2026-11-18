import { Children, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { attr, type DisplayTone } from './types';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'busy' | 'away' | 'offline';

export interface AvatarProps extends Omit<ComponentProps<'span'>, 'children'> {
  src?: string;
  alt?: string;
  /** Full name — used for initials and as default alt text. */
  name?: string;
  /** Override computed initials. */
  initials?: string;
  size?: AvatarSize;
  shape?: 'circle' | 'square';
  tone?: DisplayTone;
  status?: AvatarStatus;
  /** Custom fallback content (e.g. an icon). */
  fallback?: ReactNode;
}

type LoadState = 'loading' | 'loaded' | 'error';

function getInitials(name?: string, initials?: string) {
  if (initials) return initials.slice(0, 2);
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : '';
  return (first + last).toUpperCase();
}

export function Avatar({
  src, alt, name, initials, size = 'md', shape = 'circle', tone, status, fallback, className, ...rest
}: AvatarProps) {
  const [state, setState] = useState<LoadState>('loading');
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Cached images may finish before React attaches listeners.
    const el = img.current;
    setState(el?.complete ? (el.naturalWidth > 0 ? 'loaded' : 'error') : 'loading');
  }, [src]);

  const showImage = !!src && state !== 'error';
  const text = getInitials(name, initials);

  return (
    <span
      {...rest}
      className={className ? `j-avatar ${className}` : 'j-avatar'}
      data-size={attr(size, 'md')}
      data-shape={attr(shape, 'circle')}
      data-tone={tone}
      role={showImage ? undefined : 'img'}
      aria-label={showImage ? undefined : (alt ?? name)}
    >
      {showImage && (
        <img
          ref={img}
          className="j-avatar__image"
          src={src}
          alt={alt ?? name ?? ''}
          data-state={state === 'loading' ? 'loading' : undefined}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}
      <span className="j-avatar__fallback" aria-hidden="true">
        {fallback ?? (text || (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.6-8 5.5 0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5 0-2.9-3.6-5.5-8-5.5Z" />
          </svg>
        ))}
      </span>
      {status && <span className="j-avatar__status" data-status={status} role="img" aria-label={status} />}
    </span>
  );
}

export interface AvatarGroupProps extends ComponentProps<'div'> {
  size?: AvatarSize;
  /** Show at most this many avatars, then a "+N" chip. */
  max?: number;
  /** Total count when not all avatars are rendered. */
  total?: number;
}

export function AvatarGroup({ size = 'md', max, total, className, children, ...rest }: AvatarGroupProps) {
  const all = Children.toArray(children);
  const visible = max != null && max >= 0 ? all.slice(0, max) : all;
  const extra = Math.max(total ?? all.length, all.length) - visible.length;

  return (
    <div
      role="group"
      {...rest}
      className={className ? `j-avatar-group ${className}` : 'j-avatar-group'}
      data-size={attr(size, 'md')}
    >
      {visible}
      {extra > 0 && (
        <span className="j-avatar j-avatar-group__more" role="img" aria-label={`${extra} more`}>
          <span className="j-avatar__fallback" aria-hidden="true">+{extra}</span>
        </span>
      )}
    </div>
  );
}
