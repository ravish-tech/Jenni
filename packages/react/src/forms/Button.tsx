import { use, type ComponentProps, type MouseEvent } from 'react';
import { ButtonGroupContext, cx, flag, sizeAttr, type ButtonVariant, type Size, type Tone } from './types';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: Size;
  tone?: Tone;
  loading?: boolean;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant,
  size,
  tone,
  loading,
  iconOnly,
  fullWidth,
  disabled,
  type = 'button',
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const group = use(ButtonGroupContext);
  const v = variant ?? group?.variant;
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  return (
    <button
      type={type}
      className={cx('j-button', className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      data-variant={v && v !== 'solid' ? v : undefined}
      data-size={sizeAttr(size ?? group?.size)}
      data-tone={tone ?? group?.tone}
      data-loading={flag(loading)}
      data-icon-only={flag(iconOnly)}
      data-full-width={flag(fullWidth)}
      onClick={handleClick}
      {...rest}
    />
  );
}

export interface ButtonGroupProps extends ComponentProps<'div'> {
  variant?: ButtonVariant;
  size?: Size;
  tone?: Tone;
  fullWidth?: boolean;
}

export function ButtonGroup({ variant, size, tone, fullWidth, className, ...rest }: ButtonGroupProps) {
  return (
    <ButtonGroupContext value={{ variant, size, tone }}>
      <div role="group" className={cx('j-button-group', className)} data-full-width={flag(fullWidth)} {...rest} />
    </ButtonGroupContext>
  );
}
