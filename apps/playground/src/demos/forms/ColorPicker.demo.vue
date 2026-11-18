<script lang="ts">
export const meta = {
  name: 'Color Picker',
  group: 'Forms',
  order: 18,
  description: '2D SV spectrum loupe, hue/alpha sliders, HEX · OKLCH · RGB readout, and curated architectural swatches.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JColorPicker, JField, JInline, JStack } from '@jenni/vue';
import { hexToOklchString } from '@jenni/core/behaviors/color-picker.js';

const brandColor = ref('oklch(52.1% 0.193 266)');
const glassTint = ref('rgb(37 99 235 / 0.72)');
const primaryToken = ref('#4f46e5');
const borderToken = ref('#cbd5e1');
const surfaceTint = ref('rgb(13 148 136 / 0.16)');

const sizeColors = reactive({
  sm: '#0d9488',
  md: '#4f46e5',
  lg: '#ea580c',
});

const html = `<div class="j-color-picker" data-value="#4f46e5" data-alpha></div>

<div class="j-color-picker-field" data-value="#0d9488" style="max-width:220px">
  <button type="button" class="j-color-picker-field__trigger" popovertarget="cp-pop">
    <span class="j-color-picker-field__swatch"></span>
    <span class="j-color-picker-field__label">#0d9488</span>
  </button>
</div>
<div id="cp-pop" class="j-color-picker__popover" popover="auto"></div>`;
</script>

<template>
  <DemoSection
    title="Inline Architectural Inspector"
    description="Pointer-captured 2D spectrum loupe, rainbow hue slider, checkerboard alpha track, and live HEX / OKLCH / RGB switcher."
  >
    <JInline gap="group" wrap style="align-items: flex-start">
      <JStack gap="related">
        <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-medium); color: var(--j-fg-muted)">
          Perceptual OKLCH inspector
        </span>
        <JColorPicker v-model="brandColor" mode="inline" format="oklch" />
      </JStack>

      <JStack gap="related">
        <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-medium); color: var(--j-fg-muted)">
          Translucent alpha channel
        </span>
        <JColorPicker v-model="glassTint" mode="inline" format="rgb" alpha />
      </JStack>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Compact Swatch Trigger & Live Token Preview"
    description="Anchored popover mode inside form fields driving a live card surface."
  >
    <JCard title="Theme token studio" size="sm" style="width: 100%; max-width: 480px">
      <JStack gap="field">
        <JInline gap="item" wrap style="width: 100%">
          <JField label="Accent ink" style="flex: 1; min-width: 180px">
            <JColorPicker v-model="primaryToken" size="sm" />
          </JField>
          <JField label="Hairline border" style="flex: 1; min-width: 180px">
            <JColorPicker v-model="borderToken" size="sm" />
          </JField>
        </JInline>
        <JField label="Badge wash (with alpha)">
          <JColorPicker v-model="surfaceTint" format="rgb" alpha size="sm" />
        </JField>

        <div
          :style="{
            padding: 'var(--j-space-3)',
            borderRadius: 'var(--j-radius-md)',
            border: `1px solid ${borderToken}`,
            background: surfaceTint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--j-space-2)',
          }"
        >
          <span :style="{ color: primaryToken, fontWeight: 'var(--j-weight-semibold)', fontSize: 'var(--j-text-sm)' }">
            Preview swatch
          </span>
          <code style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
            {{ hexToOklchString(primaryToken) }}
          </code>
        </div>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection
    title="Trigger Sizes & Disabled State"
    description="sm · md · lg swatch triggers and disabled lock."
  >
    <JStack gap="item" style="width: 100%; max-width: 260px">
      <JColorPicker v-model="sizeColors.sm" size="sm" aria-label="Small color picker" />
      <JColorPicker v-model="sizeColors.md" aria-label="Medium color picker" />
      <JColorPicker v-model="sizeColors.lg" size="lg" aria-label="Large color picker" />
      <JColorPicker model-value="#64748b" disabled aria-label="Disabled color picker" />
    </JStack>
  </DemoSection>

  <DemoSection
    title="Plain HTML"
    description="initColorPickers() mounts both inline .j-color-picker inspectors and anchored .j-color-picker-field triggers."
  >
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
