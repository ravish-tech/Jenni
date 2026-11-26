<script setup lang="ts">
/// <reference path="./icon-core.d.ts" />
import { computed, inject, type Component } from 'vue';
import { parseSvgIcon, resolveIcon } from 'jenni-core/behaviors/icon.js';
import { JIconKey, type JIconPresetSize, type JIconSize, type JIconTone } from './icon-context';

export interface JIconProps {
  /** Icon name resolved from subtree `provideIcons`, global `registerIcons`, or `BUILTIN_ICONS`. */
  name?: string;
  /** Preset token size (`xs`..`xl`) or explicit pixel number / CSS length. */
  size?: JIconSize;
  /** Semantic color tone. */
  tone?: JIconTone;
  /** Custom SVG stroke width (`--j-icon-stroke`). */
  strokeWidth?: number | string;
  /** Continuous rotation animation (`data-spin`). */
  spin?: boolean;
  /** Accessible label. When set, exposes `role="img"`; when omitted, sets `aria-hidden="true"`. */
  label?: string;
}

const PRESET_SIZES = new Set<string>(['xs', 'sm', 'md', 'lg', 'xl']);

const props = defineProps<JIconProps>();
const injectedResolver = inject(JIconKey, undefined);

const dataSize = computed<JIconPresetSize | undefined>(() =>
  typeof props.size === 'string' && PRESET_SIZES.has(props.size)
    ? (props.size as JIconPresetSize)
    : undefined,
);

const iconStyle = computed<Record<string, string> | undefined>(() => {
  const styles: Record<string, string> = {};
  if (props.size !== undefined && !dataSize.value) {
    styles['--j-icon-size'] = typeof props.size === 'number' ? `${props.size}px` : props.size;
  }
  if (props.strokeWidth !== undefined) {
    styles['--j-icon-stroke'] = String(props.strokeWidth);
  }
  return Object.keys(styles).length > 0 ? styles : undefined;
});

const hasLabel = computed(() => Boolean(props.label && props.label.trim().length > 0));

const resolved = computed(() =>
  props.name ? resolveIcon<Component>(props.name, injectedResolver ?? null) : null,
);

const svgDef = computed(() => (resolved.value ? parseSvgIcon(resolved.value) : null));

const compDef = computed<Component | null>(() => {
  if (!resolved.value || svgDef.value) return null;
  if (typeof resolved.value === 'function' || typeof resolved.value === 'object') {
    return resolved.value as Component;
  }
  return null;
});
</script>

<template>
  <span
    class="j-icon"
    :data-size="dataSize"
    :data-tone="tone"
    :data-spin="spin ? '' : undefined"
    :role="hasLabel ? 'img' : undefined"
    :aria-label="hasLabel ? label : undefined"
    :aria-hidden="hasLabel ? undefined : 'true'"
    :style="iconStyle"
  >
    <svg
      v-if="svgDef"
      :viewBox="svgDef.viewBox"
      :fill="svgDef.fill ?? 'none'"
      :stroke="svgDef.stroke ?? 'currentColor'"
      stroke-linecap="round"
      stroke-linejoin="round"
      shape-rendering="geometricPrecision"
      focusable="false"
      aria-hidden="true"
      v-html="svgDef.body"
    />
    <component
      :is="compDef"
      v-else-if="compDef"
      aria-hidden="true"
      focusable="false"
    />
    <slot v-else />
  </span>
</template>
