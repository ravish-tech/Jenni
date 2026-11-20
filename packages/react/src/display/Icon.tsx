/// <reference path="./icon-core.d.ts" />
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from 'react';
import {
  BUILTIN_ICONS,
  clearRegisteredIcons,
  isSvgIconDefinition,
  listBuiltinIcons,
  parseSvgIcon,
  registerIcons,
  resolveIcon,
  sanitizeSvgMarkup,
  type IconDefinition,
  type IconMap,
  type IconRegistrySource,
  type IconResolverFn,
  type ParsedSvgIcon,
  type SvgIconDefinition,
} from 'jenni-core/behaviors/icon.js';
import type { DisplayTone } from './types';

export type IconPresetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconSize = IconPresetSize | number | string;
export type IconTone = DisplayTone;

export type ReactIconComponent = ComponentType<SVGProps<SVGSVGElement> & Record<string, unknown>>;
export type ReactIconEntry = ReactIconComponent | ReactElement;
export type ReactIconDefinition = IconDefinition<ReactIconEntry>;
export type ReactIconMap = IconMap<ReactIconEntry>;
export type ReactIconResolverFn = IconResolverFn<ReactIconEntry>;
export type ReactIconRegistrySource = IconRegistrySource<ReactIconEntry>;
export type IconResolver = ReactIconResolverFn;
export type IconSource = ReactIconRegistrySource;

const PRESET_SIZES = new Set<string>(['xs', 'sm', 'md', 'lg', 'xl']);

const IconContext = createContext<ReactIconResolverFn | null>(null);

function lookupReactIcon(
  source: ReactIconRegistrySource,
  name: string,
): ReactIconDefinition | null | undefined {
  if (typeof source === 'function') {
    return (source as ReactIconResolverFn)(name);
  }
  if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, name)) {
    return source[name];
  }
  return undefined;
}

export interface IconProviderProps {
  /** Icon map or `(name) => icon` resolver scoped to this React subtree. */
  icons?: ReactIconRegistrySource;
  /** Alias for `icons` (kept for backwards compatibility). */
  resolver?: ReactIconRegistrySource;
  children?: ReactNode;
}

export function IconProvider({ icons, resolver, children }: IconProviderProps) {
  const parentResolver = useContext(IconContext);
  const activeSource = icons ?? resolver;
  const chained = useCallback<ReactIconResolverFn>(
    (name: string) => {
      const local = activeSource ? lookupReactIcon(activeSource, name) : undefined;
      if (local != null) return local;
      return parentResolver ? parentResolver(name) : undefined;
    },
    [activeSource, parentResolver],
  );

  return <IconContext value={chained}>{children}</IconContext>;
}

export interface IconProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** Icon name resolved from `<IconProvider>`, global `registerIcons`, or `BUILTIN_ICONS`. */
  name?: string;
  /** Preset token size (`xs`..`xl`) or explicit pixel number / CSS length. */
  size?: IconSize;
  /** Semantic color tone. */
  tone?: IconTone;
  /** Custom SVG stroke width (`--j-icon-stroke`). */
  strokeWidth?: number | string;
  /** Continuous rotation animation (`data-spin`). */
  spin?: boolean;
  /** Accessible label. When set, exposes `role="img"`; when omitted, sets `aria-hidden="true"`. */
  label?: string;
  /** Custom fallback SVG or element rendered when `name` is omitted or unresolved. */
  children?: ReactNode;
}

function isReactComponentLike(val: unknown): val is ReactIconComponent {
  if (typeof val === 'function') return true;
  if (val !== null && typeof val === 'object' && '$$typeof' in val && !isValidElement(val)) {
    return true;
  }
  return false;
}

export function Icon({
  name,
  size,
  tone,
  strokeWidth,
  spin,
  label,
  className,
  style,
  children,
  ...rest
}: IconProps) {
  const contextResolver = useContext(IconContext);

  const isPreset = typeof size === 'string' && PRESET_SIZES.has(size);
  const dataSize = isPreset ? (size as IconPresetSize) : undefined;

  let mergedStyle: CSSProperties | undefined = style;
  if ((size !== undefined && !isPreset) || strokeWidth !== undefined) {
    const customVars: Record<string, string> = {};
    if (size !== undefined && !isPreset) {
      customVars['--j-icon-size'] = typeof size === 'number' ? `${size}px` : size;
    }
    if (strokeWidth !== undefined) {
      customVars['--j-icon-stroke'] = String(strokeWidth);
    }
    mergedStyle = style ? { ...customVars, ...style } : (customVars as CSSProperties);
  }

  const hasLabel = Boolean(label && label.trim().length > 0);
  const resolved = name ? resolveIcon<ReactIconEntry>(name, contextResolver) : null;
  const svgDef = resolved ? parseSvgIcon(resolved) : null;

  let content: ReactNode = children;
  if (svgDef) {
    content = (
      <svg
        viewBox={svgDef.viewBox}
        fill={svgDef.fill ?? 'none'}
        stroke={svgDef.stroke ?? 'currentColor'}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svgDef.body }}
      />
    );
  } else if (resolved) {
    if (isValidElement(resolved)) {
      content = resolved;
    } else if (isReactComponentLike(resolved)) {
      const ResolvedComp = resolved;
      content = <ResolvedComp aria-hidden="true" focusable="false" />;
    }
  }

  return (
    <span
      {...rest}
      className={className ? `j-icon ${className}` : 'j-icon'}
      data-size={dataSize}
      data-tone={tone}
      data-spin={spin ? '' : undefined}
      role={hasLabel ? 'img' : undefined}
      aria-label={hasLabel ? label : undefined}
      aria-hidden={hasLabel ? undefined : true}
      style={mergedStyle}
    >
      {content}
    </span>
  );
}

export {
  BUILTIN_ICONS,
  clearRegisteredIcons,
  isSvgIconDefinition,
  listBuiltinIcons,
  parseSvgIcon,
  registerIcons,
  resolveIcon,
  sanitizeSvgMarkup,
  type IconDefinition,
  type IconMap,
  type IconRegistrySource,
  type IconResolverFn,
  type ParsedSvgIcon,
  type SvgIconDefinition,
};
