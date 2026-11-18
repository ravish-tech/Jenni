/// <reference path="./core.d.ts" />
// Shared types + helpers for the React forms group.
import { createContext, useCallback, useState, type ReactNode, type Ref } from 'react';

export type Size = 'sm' | 'md' | 'lg';
export type Tone = 'accent' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';
export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
export type ToggleVariant = 'outline' | 'ghost' | 'soft';
export type Orientation = 'vertical' | 'horizontal';

export type DatePickerMode = 'single' | 'range';
export interface DateRange {
  start: string | null;
  end: string | null;
}

export type TimeFormat = '24h' | '12h';

export type ColorFormat = 'hex' | 'oklch' | 'rgb';
export type ColorPickerMode = 'inline' | 'popover';

export type RichTextAction =
  | 'p'
  | 'h2'
  | 'h3'
  | 'blockquote'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'bulletList'
  | 'orderedList'
  | 'link'
  | 'clear'
  | 'undo'
  | 'redo';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/** md is the default and is expressed by omitting data-size. */
export const sizeAttr = (size?: Size) => (size && size !== 'md' ? size : undefined);

/** Boolean → present-or-absent data attribute. */
export const flag = (on?: boolean) => (on ? '' : undefined);

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (el: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: T | null }).current = el;
    }
  };
}

/** Controlled + uncontrolled state in one hook. */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = useCallback(
    (v: T) => {
      if (!controlled) setInner(v);
      onChange?.(v);
    },
    [controlled, onChange],
  );
  return [current, set] as const;
}

/* ---- Field context ---- */
export interface FieldContextValue {
  id: string;
  labelId: string;
  describedBy?: string;
  invalid: boolean;
  disabled: boolean;
  required: boolean;
}
export const FieldContext = createContext<FieldContextValue | null>(null);

/* ---- Radio group context ---- */
export interface RadioGroupContextValue {
  value: string | undefined;
  setValue: (v: string) => void;
  name: string;
  size?: Size;
  tone?: Tone;
  disabled: boolean;
  invalid: boolean;
}
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/* ---- Button group context ---- */
export interface ButtonGroupContextValue {
  variant?: ButtonVariant;
  size?: Size;
  tone?: Tone;
}
export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

/* ---- Segmented control context ---- */
export interface SegmentedContextValue {
  value: string | undefined;
  select: (value: string) => void;
  disabled: boolean;
}
export const SegmentedContext = createContext<SegmentedContextValue | null>(null);

/* ---- Toggle group context ---- */
export interface ToggleGroupContextValue {
  isPressed: (value: string) => boolean;
  toggle: (value: string) => void;
  variant?: ToggleVariant;
  size?: Size;
  tone?: Tone;
  disabled: boolean;
}
export const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);
