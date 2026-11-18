import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { attr, type DisplaySize } from './types';

export type AccordionVariant = 'divided' | 'card' | 'separated' | 'ghost';

interface AccordionContextValue {
  openSet: Set<string>;
  toggle: (value: string) => void;
  registerDefault: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function toArray(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  return val ? [val] : [];
}

export interface AccordionProps extends Omit<ComponentProps<'div'>, 'defaultValue'> {
  variant?: AccordionVariant;
  size?: DisplaySize;
  /** Allow multiple items open simultaneously. */
  multiple?: boolean;
  /** In single-open mode, allow closing the active item (default: true). */
  collapsible?: boolean;
  /** Controlled open item value(s). */
  value?: string | string[];
  /** Initial open item value(s) when uncontrolled. */
  defaultValue?: string | string[];
  /** Called whenever open item(s) change. */
  onValueChange?: (value: string | string[]) => void;
}

export function Accordion({
  variant = 'divided',
  size = 'md',
  multiple = false,
  collapsible = true,
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...rest
}: AccordionProps) {
  const [internal, setInternal] = useState<string[]>(() => toArray(defaultValue));
  const isControlled = value !== undefined;

  const openSet = useMemo(
    () => new Set(isControlled ? toArray(value) : internal),
    [isControlled, value, internal],
  );

  const ctx = useMemo<AccordionContextValue>(
    () => ({
      openSet,
      toggle: (itemValue: string) => {
        const current = Array.from(openSet);
        const active = openSet.has(itemValue);

        if (multiple) {
          const next = active ? current.filter((v) => v !== itemValue) : [...current, itemValue];
          if (!isControlled) setInternal(next);
          onValueChange?.(next);
        } else {
          if (active && !collapsible) return;
          const next = active ? '' : itemValue;
          if (!isControlled) setInternal(next ? [next] : []);
          onValueChange?.(next);
        }
      },
      registerDefault: (itemValue: string) => {
        if (isControlled) return;
        setInternal((prev) => {
          if (prev.includes(itemValue)) return prev;
          if (!multiple && prev.length > 0) return prev;
          return [...prev, itemValue];
        });
      },
    }),
    [openSet, multiple, collapsible, isControlled, onValueChange],
  );

  return (
    <AccordionContext value={ctx}>
      <div
        {...rest}
        className={className ? `j-accordion ${className}` : 'j-accordion'}
        data-variant={attr(variant, 'divided')}
        data-size={attr(size, 'md')}
      >
        {children}
      </div>
    </AccordionContext>
  );
}

export interface AccordionItemProps extends Omit<ComponentProps<'details'>, 'title' | 'onToggle'> {
  /** Unique item key within the accordion. */
  value?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  indicator?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export function AccordionItem({
  value,
  title,
  subtitle,
  icon,
  indicator,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
  children,
  ...rest
}: AccordionItemProps) {
  const autoId = useId();
  const itemKey = value ?? autoId;
  const group = useContext(AccordionContext);
  const [localOpen, setLocalOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen && group) {
      group.registerDefault(itemKey);
    }
  }, [defaultOpen, group, itemKey]);

  const isOpen =
    open !== undefined ? open : group ? group.openSet.has(itemKey) : localOpen;

  const handleSummaryClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (disabled) return;
    if (open !== undefined) {
      onOpenChange?.(!open);
    } else if (group) {
      group.toggle(itemKey);
      onOpenChange?.(!isOpen);
    } else {
      const next = !localOpen;
      setLocalOpen(next);
      onOpenChange?.(next);
    }
  };

  return (
    <details
      {...rest}
      open={isOpen}
      className={className ? `j-accordion__item ${className}` : 'j-accordion__item'}
      data-disabled={disabled ? '' : undefined}
      aria-disabled={disabled ? 'true' : undefined}
    >
      <summary
        className="j-accordion__trigger"
        aria-disabled={disabled ? 'true' : undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={handleSummaryClick}
      >
        {icon}
        <span className="j-accordion__title">{title}</span>
        {subtitle != null && <span className="j-accordion__subtitle">{subtitle}</span>}
        {indicator != null && (
          <span className="j-accordion__indicator" aria-hidden="true">
            {indicator}
          </span>
        )}
      </summary>
      <div className="j-accordion__content">{children}</div>
    </details>
  );
}

export type CollapsibleVariant = 'ghost' | 'card' | 'subtle';

export interface CollapsibleProps extends Omit<ComponentProps<'details'>, 'title' | 'onToggle'> {
  variant?: CollapsibleVariant;
  size?: DisplaySize;
  title?: ReactNode;
  trigger?: ReactNode;
  icon?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export function Collapsible({
  variant = 'ghost',
  size = 'md',
  title,
  trigger,
  icon,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
  children,
  ...rest
}: CollapsibleProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : localOpen;

  const handleTriggerClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    if (disabled) return;
    const next = !isOpen;
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <details
      {...rest}
      open={isOpen}
      className={className ? `j-collapsible ${className}` : 'j-collapsible'}
      data-variant={attr(variant, 'ghost')}
      data-size={attr(size, 'md')}
      data-disabled={disabled ? '' : undefined}
      aria-disabled={disabled ? 'true' : undefined}
    >
      <summary
        className="j-collapsible__trigger"
        aria-disabled={disabled ? 'true' : undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={handleTriggerClick}
      >
        {icon}
        {trigger ?? <span>{title}</span>}
      </summary>
      <div className="j-collapsible__content">{children}</div>
    </details>
  );
}
