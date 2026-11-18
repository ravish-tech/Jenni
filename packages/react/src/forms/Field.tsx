import { useId, type ComponentProps, type ReactNode } from 'react';
import { FieldContext, cx } from './types';

export interface FieldProps extends Omit<ComponentProps<'div'>, 'children'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** id for the control; auto-generated when omitted. */
  controlId?: string;
  children?: ReactNode;
}

/** Label + control + hint + error. Wires id / aria-describedby / aria-invalid into form controls. */
export function Field({
  label,
  hint,
  error,
  required = false,
  disabled = false,
  invalid = false,
  controlId,
  className,
  children,
  ...rest
}: FieldProps) {
  const autoId = useId();
  const id = controlId ?? `j-field-${autoId}`;
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasHint = hint != null && hint !== false;
  const hasError = error != null && error !== false;
  const describedBy = [hasHint && hintId, hasError && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext
      value={{ id, labelId, describedBy, invalid: invalid || hasError, disabled, required }}
    >
      <div className={cx('j-field', className)} {...rest}>
        {label != null && (
          <label id={labelId} className="j-label" htmlFor={id} data-required={required ? '' : undefined}>
            {label}
          </label>
        )}
        {children}
        {hasHint && (
          <p id={hintId} className="j-field__hint">
            {hint}
          </p>
        )}
        {hasError && (
          <p id={errorId} className="j-field__error" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    </FieldContext>
  );
}

export interface LabelProps extends ComponentProps<'label'> {
  required?: boolean;
}

export function Label({ required, className, ...rest }: LabelProps) {
  return <label className={cx('j-label', className)} data-required={required ? '' : undefined} {...rest} />;
}
