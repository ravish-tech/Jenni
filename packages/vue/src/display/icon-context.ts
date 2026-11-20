/// <reference path="./icon-core.d.ts" />
import { inject, provide, type Component, type InjectionKey } from 'vue';
import {
  BUILTIN_ICONS,
  clearRegisteredIcons,
  isSvgIconDefinition,
  listBuiltinIcons,
  parseSvgIcon,
  registerIcons,
  resolveIcon,
  type IconDefinition,
  type IconMap,
  type IconRegistrySource,
  type IconResolverFn,
  type ParsedSvgIcon,
  type SvgIconDefinition,
} from 'jenni-core/behaviors/icon.js';

export type JIconPresetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type JIconSize = JIconPresetSize | number | string;
export type JIconTone = 'accent' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';

export type JIconDefinition = IconDefinition<Component>;
export type JIconMap = IconMap<Component>;
export type JIconResolverFn = IconResolverFn<Component>;
export type JIconRegistrySource = IconRegistrySource<Component>;
export type JIconResolver = JIconResolverFn;
export type JIconSource = JIconRegistrySource;

export const JIconKey: InjectionKey<JIconResolverFn> = Symbol('JIconRegistry');

function lookupVueIcon(
  source: JIconRegistrySource,
  name: string,
): JIconDefinition | null | undefined {
  if (typeof source === 'function') {
    return (source as JIconResolverFn)(name);
  }
  if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, name)) {
    return source[name];
  }
  return undefined;
}

/**
 * Provide a custom icon dictionary or resolver function to the current Vue
 * component subtree. Nested `provideIcons` calls chain cleanly so child scopes
 * override parent scopes before falling back to global `registerIcons` and
 * `BUILTIN_ICONS`.
 */
export function provideIcons(iconsOrResolver: JIconRegistrySource): void {
  const parentResolver = inject(JIconKey, undefined);
  const chained: JIconResolverFn = (name: string) => {
    const local = lookupVueIcon(iconsOrResolver, name);
    if (local != null) return local;
    return parentResolver ? parentResolver(name) : undefined;
  };
  provide(JIconKey, chained);
}

export {
  BUILTIN_ICONS,
  clearRegisteredIcons,
  isSvgIconDefinition,
  listBuiltinIcons,
  parseSvgIcon,
  registerIcons,
  resolveIcon,
  type IconDefinition,
  type IconMap,
  type IconRegistrySource,
  type IconResolverFn,
  type ParsedSvgIcon,
  type SvgIconDefinition,
};
