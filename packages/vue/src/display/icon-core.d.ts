declare module 'jenni-core/behaviors/icon.js' {
  export interface SvgIconDefinition {
    viewBox?: string;
    body: string;
    fill?: string;
    stroke?: string;
  }

  export interface ParsedSvgIcon {
    viewBox: string;
    body: string;
    fill?: string;
    stroke?: string;
  }

  export type IconDefinition<TComponent = unknown> = string | SvgIconDefinition | TComponent;
  export type IconMap<TComponent = unknown> = Record<string, IconDefinition<TComponent>>;
  export type IconResolverFn<TComponent = unknown> = (
    name: string,
  ) => IconDefinition<TComponent> | null | undefined;
  export type IconRegistrySource<TComponent = unknown> =
    | IconMap<TComponent>
    | IconResolverFn<TComponent>;

  export const BUILTIN_ICONS: Readonly<Record<string, ParsedSvgIcon>>;

  export function isSvgIconDefinition(def: unknown): def is string | SvgIconDefinition;
  export function sanitizeSvgMarkup(raw: string): string;
  export function parseSvgIcon(def: unknown): Readonly<ParsedSvgIcon> | null;
  export function registerIcons<TComponent = unknown>(
    iconsOrResolver: IconRegistrySource<TComponent>,
  ): () => void;
  export function clearRegisteredIcons(): void;
  export function resolveIcon<TComponent = unknown>(
    name: string | null | undefined,
    customResolver?: IconRegistrySource<TComponent> | null,
  ): ParsedSvgIcon | TComponent | null;
  export function listBuiltinIcons(): string[];
}
