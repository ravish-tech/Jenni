import type { ComponentProps, ReactNode } from 'react';

export interface SeparatorProps extends ComponentProps<'div'> {
  orientation?: 'horizontal' | 'vertical';
  label?: ReactNode;
  align?: 'start' | 'center' | 'end';
  /** Purely visual — hidden from assistive tech. */
  decorative?: boolean;
}

export function Separator({
  orientation = 'horizontal', label, align = 'center', decorative, className, children, ...rest
}: SeparatorProps) {
  const content = children ?? label;
  const vertical = orientation === 'vertical';
  return (
    <div
      {...rest}
      className={className ? `j-separator ${className}` : 'j-separator'}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={!decorative && vertical ? 'vertical' : undefined}
      data-orientation={vertical ? 'vertical' : undefined}
      data-align={align === 'center' ? undefined : align}
    >
      {content != null && <span className="j-separator__label">{content}</span>}
    </div>
  );
}
