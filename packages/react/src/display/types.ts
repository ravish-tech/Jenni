/// <reference path="./core.d.ts" />
/// <reference path="./entity-color-core.d.ts" />
// Shared prop types for the display group.
export type DisplayTone = 'accent' | 'neutral' | 'danger' | 'success' | 'warning' | 'info';
export type DisplaySize = 'sm' | 'md' | 'lg';

export interface ProgressSegment {
  value: number;
  tone?: DisplayTone;
  color?: string;
  colorSeed?: string;
  label?: string;
}

export type TableVariant = 'surface' | 'outline' | 'striped' | 'plain';
export type TableAlign = 'start' | 'center' | 'end';
export type TableSortDirection = 'asc' | 'desc';

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';
export type StepperOrientation = 'horizontal' | 'vertical';

export type CarouselOrientation = 'horizontal' | 'vertical';
export type CarouselArrows = boolean | 'floating' | 'footer';

/** Omit the attribute for the default value (md, default variant…). */
export const attr = <T extends string>(value: T | undefined, fallback?: T): T | undefined =>
  value === fallback ? undefined : value;
