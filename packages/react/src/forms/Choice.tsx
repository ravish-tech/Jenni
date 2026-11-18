import type { CSSProperties, ReactNode } from 'react';
import { cx } from './types';

/** Internal: <label class="j-choice"> wrapper shared by Checkbox, Radio and Switch. */
export function Choice({
  control,
  label,
  description,
  placement,
  className,
  style,
}: {
  control: ReactNode;
  label?: ReactNode;
  description?: ReactNode;
  placement?: 'start' | 'end';
  className?: string;
  style?: CSSProperties;
}) {
  if (label == null) return <>{control}</>;
  return (
    <label className={cx('j-choice', className)} style={style} data-placement={placement === 'end' ? 'end' : undefined}>
      {control}
      <span className="j-choice__body">
        <span className="j-choice__label">{label}</span>
        {description != null && <span className="j-choice__description">{description}</span>}
      </span>
    </label>
  );
}
