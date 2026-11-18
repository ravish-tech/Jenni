/// <reference path="./core.d.ts" />
// Shared types + helpers for the Vue forms group.
import { computed, inject, type ComputedRef, type HTMLAttributes, type InjectionKey, type Ref, type StyleValue } from 'vue';

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
  label: string;
  disabled?: boolean;
}

/** md is the default and is expressed by omitting data-size. */
export const sizeAttr = (size?: Size) => (size && size !== 'md' ? size : undefined);

/* ---- Field context (JField → controls) ---- */
export interface FieldContext {
  id: ComputedRef<string>;
  labelId: ComputedRef<string>;
  describedBy: ComputedRef<string | undefined>;
  invalid: ComputedRef<boolean>;
  disabled: ComputedRef<boolean>;
  required: ComputedRef<boolean>;
}
export const FieldKey: InjectionKey<FieldContext> = Symbol('JField');

/**
 * Native attrs a control should carry when inside a JField.
 * Explicit attrs passed by the user still win (spread them after).
 */
export function useFieldAttrs(invalid: () => boolean | undefined) {
  const field = inject(FieldKey, null);
  return computed(() => ({
    id: field?.id.value,
    'aria-describedby': field?.describedBy.value,
    'aria-invalid': invalid() || field?.invalid.value ? ('true' as const) : undefined,
    disabled: field?.disabled.value || undefined,
    required: field?.required.value || undefined,
  }));
}

/* ---- Radio group context ---- */
export interface RadioGroupContext {
  model: Ref<string | number | undefined>;
  name: ComputedRef<string>;
  size: ComputedRef<Size | undefined>;
  tone: ComputedRef<Tone | undefined>;
  disabled: ComputedRef<boolean>;
  invalid: ComputedRef<boolean>;
}
export const RadioGroupKey: InjectionKey<RadioGroupContext> = Symbol('JRadioGroup');

/* ---- Button group context (shared defaults) ---- */
export interface ButtonGroupContext {
  variant: ComputedRef<ButtonVariant | undefined>;
  size: ComputedRef<Size | undefined>;
  tone: ComputedRef<Tone | undefined>;
}
export const ButtonGroupKey: InjectionKey<ButtonGroupContext> = Symbol('JButtonGroup');

/* ---- Segmented control context ---- */
export interface SegmentedContext {
  model: Ref<string | undefined>;
  disabled: ComputedRef<boolean>;
  select: (value: string) => void;
}
export const SegmentedKey: InjectionKey<SegmentedContext> = Symbol('JSegmentedControl');

/* ---- Toggle group context ---- */
export interface ToggleGroupContext {
  isPressed: (value: string) => boolean;
  toggle: (value: string) => void;
  variant: ComputedRef<ToggleVariant | undefined>;
  size: ComputedRef<Size | undefined>;
  tone: ComputedRef<Tone | undefined>;
  disabled: ComputedRef<boolean>;
}
export const ToggleGroupKey: InjectionKey<ToggleGroupContext> = Symbol('JToggleGroup');

/** Split class/style (for a wrapper) from the rest (for the native control). */
export function splitAttrs(attrs: Record<string, unknown>) {
  const { class: cls, style, ...rest } = attrs;
  return {
    root: { class: cls as HTMLAttributes['class'], style: style as StyleValue },
    control: rest,
  };
}
