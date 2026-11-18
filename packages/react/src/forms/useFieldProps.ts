import { use } from 'react';
import { FieldContext } from './types';

/**
 * Native attrs a control should carry when inside a <Field>.
 * Spread first, so explicit props passed by the user still win.
 */
export function useFieldProps(invalid?: boolean) {
  const field = use(FieldContext);
  return {
    id: field?.id,
    'aria-describedby': field?.describedBy,
    'aria-invalid': invalid || field?.invalid ? (true as const) : undefined,
    disabled: field?.disabled || undefined,
    required: field?.required || undefined,
  };
}
