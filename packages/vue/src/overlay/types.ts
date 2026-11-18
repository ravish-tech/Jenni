/// <reference path="./core.d.ts" />
import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type {
  ToastAction,
  ToastItem,
  ToastOptions,
  ToasterPosition,
  ToastTone,
} from 'jenni-core/behaviors/toast.js';

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
  icon?: string;
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

export interface JCommandPaletteProps {
  items?: CommandItem[];
  groups?: CommandGroup[];
  placeholder?: string;
  emptyText?: string;
  shortcut?: string | false;
  inline?: boolean;
  closeOnSelect?: boolean;
  dismissible?: boolean;
  showFooter?: boolean;
  showEsc?: boolean;
  ariaLabel?: string;
  breadcrumbs?: string[];
  filter?: (item: CommandItem, query: string) => boolean;
}

export interface TabsContextValue {
  baseId: string;
  value: Ref<string | number | undefined>;
  orientation: ComputedRef<TabsOrientation>;
  activation: ComputedRef<TabsActivation>;
  select: (val: string | number) => void;
  tabId: (val: string | number) => string;
  panelId: (val: string | number) => string;
  registerTab: (el: HTMLElement | null, val: string | number, disabled?: boolean) => void;
  getTabValue: (el: HTMLElement) => string | number | undefined;
}

export const TabsKey: InjectionKey<TabsContextValue> = Symbol('JTabs');
