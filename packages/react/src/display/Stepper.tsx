import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  attr,
  type DisplaySize,
  type DisplayTone,
  type StepStatus,
  type StepperOrientation,
} from './types';

export type { StepStatus, StepperOrientation };

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
  status?: StepStatus;
  disabled?: boolean;
  icon?: ReactNode;
}

interface StepperContextValue {
  current: number;
  clickable: boolean;
  canSelect: (index: number, disabled?: boolean) => boolean;
  selectStep: (index: number, disabled?: boolean) => void;
}

const StepperContext = createContext<StepperContextValue | null>(null);

export interface StepperProps extends Omit<ComponentProps<'ol'>, 'defaultValue' | 'onChange'> {
  steps?: StepItem[];
  value?: number;
  defaultValue?: number;
  onValueChange?: (step: number) => void;
  orientation?: StepperOrientation;
  size?: DisplaySize;
  tone?: DisplayTone;
  clickable?: boolean;
  linear?: boolean;
  label?: string;
}

export function Stepper({
  steps,
  value,
  defaultValue = 0,
  onValueChange,
  orientation = 'horizontal',
  size = 'md',
  tone,
  clickable = false,
  linear = false,
  label = 'Progress',
  className,
  children,
  onKeyDown,
  ...rest
}: StepperProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = Math.max(0, value !== undefined ? value : internal);
  const [maxReached, setMaxReached] = useState(current);

  useEffect(() => {
    if (current > maxReached) setMaxReached(current);
  }, [current, maxReached]);

  const ctx = useMemo<StepperContextValue>(() => {
    const canSelect = (index: number, disabled = false) => {
      if (!clickable || disabled) return false;
      if (linear && index > maxReached) return false;
      return true;
    };

    return {
      current,
      clickable,
      canSelect,
      selectStep: (index: number, disabled = false) => {
        if (!canSelect(index, disabled) || index === current) return;
        if (value === undefined) setInternal(index);
        onValueChange?.(index);
      },
    };
  }, [current, clickable, linear, maxReached, value, onValueChange]);

  const handleKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !clickable) return;

    const active = document.activeElement;
    if (!(active instanceof HTMLButtonElement)) return;
    const root = event.currentTarget;
    const vertical = orientation === 'vertical';
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';

    const buttons = Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        ':scope > .j-stepper__step > button.j-stepper__trigger:not(:disabled)',
      ),
    );
    const pos = buttons.indexOf(active);
    if (pos < 0) return;

    let target: HTMLButtonElement | undefined;
    if (event.key === nextKey) target = buttons[(pos + 1) % buttons.length];
    else if (event.key === prevKey) target = buttons[(pos - 1 + buttons.length) % buttons.length];
    else if (event.key === 'Home') target = buttons[0];
    else if (event.key === 'End') target = buttons[buttons.length - 1];

    if (target) {
      event.preventDefault();
      target.focus();
    }
  };

  let indexedChildren: ReactNode = children;
  if (!steps?.length && children != null) {
    let stepIdx = 0;
    indexedChildren = Children.map(children, (child) => {
      if (isValidElement<StepProps>(child)) {
        const assigned = child.props.index ?? stepIdx;
        stepIdx += 1;
        return cloneElement(child as ReactElement<StepProps>, { index: assigned });
      }
      return child;
    });
  }

  return (
    <StepperContext value={ctx}>
      <ol
        aria-label={label}
        {...rest}
        data-j-managed=""
        className={className ? `j-stepper ${className}` : 'j-stepper'}
        data-orientation={attr(orientation, 'horizontal')}
        data-size={attr(size, 'md')}
        data-tone={tone}
        data-clickable={clickable ? '' : undefined}
        data-linear={linear ? '' : undefined}
        onKeyDown={handleKeyDown}
      >
        {steps && steps.length > 0
          ? steps.map((step, idx) => (
              <Step
                key={idx}
                index={idx}
                title={step.title}
                description={step.description}
                status={step.status}
                disabled={step.disabled}
                icon={step.icon}
              />
            ))
          : indexedChildren}
      </ol>
    </StepperContext>
  );
}

export interface StepProps extends Omit<ComponentProps<'li'>, 'title'> {
  index?: number;
  title?: ReactNode;
  description?: ReactNode;
  status?: StepStatus;
  disabled?: boolean;
  icon?: ReactNode;
}

export function Step({
  index = 0,
  title,
  description,
  status,
  disabled = false,
  icon,
  className,
  children,
  ...rest
}: StepProps) {
  const stepper = useContext(StepperContext);
  const resolvedStatus: StepStatus =
    status ??
    (stepper
      ? index < stepper.current
        ? 'complete'
        : index === stepper.current
          ? 'current'
          : 'upcoming'
      : 'upcoming');

  const isClickable = Boolean(stepper?.clickable);
  const isLocked = isClickable ? !stepper?.canSelect(index, disabled) : disabled;

  const indicatorContent =
    icon ??
    (resolvedStatus === 'complete' ? (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 8.25 6.5 11.25 12.5 5" />
      </svg>
    ) : resolvedStatus === 'error' ? (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 4.5v4M8 11.5h.01" />
      </svg>
    ) : (
      index + 1
    ));

  const body = (title != null || description != null || children != null) && (
    <span className="j-stepper__body">
      {(title != null || children != null) && (
        <span className="j-stepper__title">{children ?? title}</span>
      )}
      {description != null && <span className="j-stepper__description">{description}</span>}
    </span>
  );

  return (
    <li
      {...rest}
      className={className ? `j-stepper__step ${className}` : 'j-stepper__step'}
      data-status={resolvedStatus}
      aria-current={resolvedStatus === 'current' ? 'step' : undefined}
    >
      {isClickable ? (
        <button
          type="button"
          className="j-stepper__trigger"
          disabled={isLocked}
          onClick={() => !isLocked && stepper?.selectStep(index, disabled)}
        >
          <span className="j-stepper__indicator" aria-hidden="true">
            {indicatorContent}
          </span>
          {body}
        </button>
      ) : (
        <div
          className="j-stepper__trigger"
          aria-disabled={disabled ? 'true' : undefined}
        >
          <span className="j-stepper__indicator" aria-hidden="true">
            {indicatorContent}
          </span>
          {body}
        </div>
      )}
      <div className="j-stepper__connector" aria-hidden="true">
        <span className="j-stepper__connector-fill" />
      </div>
    </li>
  );
}
