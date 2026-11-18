/// <reference path="./core.d.ts" />
// Shared types + helpers for the React overlay group.
import { createContext, useCallback, useState, type ReactNode, type Ref } from 'react';
import type {
  ToastAction,
  ToastItem,
  ToastOptions,
  ToasterPosition,
  ToastTone,
} from '@jenni/core/behaviors/toast.js';

export type FloatingSide = 'top' | 'right' | 'bottom' | 'left';
export type FloatingAlign = 'start' | 'center' | 'end';
export type OverlaySize = 'sm' | 'md' | 'lg';
export type DrawerSide = 'right' | 'left' | 'bottom' | 'top';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';
export type ComboboxSize = 'sm' | 'md' | 'lg';
export type MenuItemRole = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
export type MenuItemTone = 'danger';
export type TabsVariant = 'underline' | 'pill';
export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivation = 'automatic' | 'manual';

export type { ToastTone, ToasterPosition, ToastAction, ToastOptions, ToastItem };

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  disabled?: boolean;
}

export interface CommandItem {
  id?: string;
  value: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  shortcut?: string | string[];
  icon?: ReactNode | string;
  disabled?: boolean;
  keepOpen?: boolean;
  children?: CommandItem[];
  onSelect?: (item: CommandItem) => void;
}

export interface CommandGroup {
  id?: string;
  label: string;
  items: CommandItem[];
}

export const sizeAttr = (size?: OverlaySize | DrawerSize) => (size && size !== 'md' ? size : undefined);
export const alignAttr = (align?: FloatingAlign) => (align && align !== 'center' ? align : undefined);
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

export interface TabsContextValue {
  baseId: string;
  value: string | undefined;
  orientation: TabsOrientation;
  activation: TabsActivation;
  select: (val: string) => void;
  ensureInitial: (val: string) => void;
  tabId: (val: string) => string;
  panelId: (val: string) => string;
  registerTabEl: (el: HTMLElement | null, val: string) => void;
  getTabValue: (el: HTMLElement) => string | undefined;
}

export const TabsContext = createContext<TabsContextValue | null>(null);
