<script lang="ts">
export const meta = {
  name: 'Slider',
  group: 'Forms',
  order: 14,
  description: 'Precision <input type="range"> with a crisp circular thumb and filled track.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JInline, JSlider, JStack } from 'jenni-vue';

const tones = ['accent', 'neutral', 'danger', 'success', 'warning', 'info'] as const;
const volume = ref(40);
const sizeVals = reactive({ sm: 30, md: 50, lg: 70 });
const toneVals = reactive<Record<(typeof tones)[number], number>>({
  accent: 20,
  neutral: 32,
  danger: 44,
  success: 56,
  warning: 68,
  info: 80,
});
const radius = ref(1);
const price = ref(120);
const label = computed(() => `$${price.value}`);

const html = `<div class="j-stack" data-gap="field" style="width:100%;max-width:360px">
  <input type="range" class="j-slider" value="30" style="--j-slider-progress: 0.3" aria-label="Volume">
  <input type="range" class="j-slider" data-tone="success" data-size="lg" value="70" style="--j-slider-progress: 0.7" aria-label="Progress">
</div>
<!-- import { initSliders } from 'jenni-core'; initSliders(); keeps the fill in sync -->`;
</script>

<template>
  <DemoSection title="Basic" description="Drag, click the track, or use arrow keys.">
    <JStack gap="item" style="width: 100%; max-width: 360px">
      <JSlider v-model="volume" aria-label="Volume" />
      <span style="color: var(--j-fg-muted); font-size: var(--j-text-sm)">Volume: {{ volume }}</span>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes" description="sm (2px track / 12px thumb) · md (3px / 15px) · lg (4px / 18px).">
    <JStack gap="field" style="width: 100%; max-width: 360px">
      <JSlider v-model="sizeVals.sm" size="sm" aria-label="Small" />
      <JSlider v-model="sizeVals.md" aria-label="Medium" />
      <JSlider v-model="sizeVals.lg" size="lg" aria-label="Large" />
    </JStack>
  </DemoSection>

  <DemoSection title="Tones">
    <JStack gap="field" style="width: 100%; max-width: 360px">
      <JSlider v-for="t in tones" :key="t" v-model="toneVals[t]" :tone="t" :aria-label="t" />
    </JStack>
  </DemoSection>

  <DemoSection title="States" description="Hover border deepen, 3px optical active ring (zero thumb scaling), focus ring, and disabled.">
    <JStack gap="field" style="width: 100%; max-width: 360px">
      <JSlider :model-value="60" disabled aria-label="Disabled" />
    </JStack>
  </DemoSection>

  <DemoSection title="Composition" description="Labelled controls with live tabular readouts; drives the card radius below.">
    <JCard
      size="sm"
      :style="{
        width: '100%',
        maxWidth: '380px',
        '--j-card-radius': `calc(10px * ${radius})`,
      }"
    >
      <JStack gap="field">
        <JStack as="label" gap="related">
          <JInline as="span" justify="between" style="font-size: var(--j-text-sm); font-weight: var(--j-weight-medium)">
            <span>Radius factor</span>
            <span style="color: var(--j-fg-muted); font-variant-numeric: tabular-nums">{{ radius.toFixed(2) }}</span>
          </JInline>
          <JSlider v-model="radius" :min="0" :max="2" :step="0.05" />
        </JStack>
        <JStack as="label" gap="related">
          <JInline as="span" justify="between" style="font-size: var(--j-text-sm); font-weight: var(--j-weight-medium)">
            <span>Max price</span>
            <span style="color: var(--j-fg-muted); font-variant-numeric: tabular-nums">{{ label }}</span>
          </JInline>
          <JSlider v-model="price" :min="0" :max="500" :step="10" tone="success" />
        </JStack>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Set --j-slider-progress (0…1) yourself, or call initSliders() from jenni-core.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
