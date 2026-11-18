<script lang="ts">
export const meta = {
  name: 'Carousel',
  group: 'Display',
  order: 17,
  description: 'Hardware-accelerated CSS scroll-snap gallery with elongated pill pagination, multi-card viewports, and synced controls.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JCarousel,
  JCarouselSlide,
  JCard,
  JBadge,
  JButton,
  JStack,
  JInline,
} from 'jenni-vue';

const heroSlide = ref(0);

const heroSlides = [
  {
    eyebrow: '01 · Spatial Precision',
    title: 'Proportional density scaling from compact terminals to editorial reading.',
    summary: 'One continuous --j-density knob recalibrates control heights, paddings, and type floors without layout jitter.',
    metric: '24px compact floor · 4px grid',
    tint: 'color-mix(in oklch, var(--j-accent-soft) 75%, var(--j-surface-1))',
  },
  {
    eyebrow: '02 · Perceptual Color',
    title: 'OKLCH surfaces and composed status chroma across light and obsidian dark.',
    summary: 'Every border, elevation shadow, and soft badge adapts natively via CSS light-dark() with zero theme flash.',
    metric: '100% OKLCH · WCAG AA contrast',
    tint: 'color-mix(in oklch, var(--j-info-soft) 75%, var(--j-surface-1))',
  },
  {
    eyebrow: '03 · Zero-Overshoot Motion',
    title: 'Weighted 300ms deceleration curves that respect reduced-motion preferences.',
    summary: 'Hardware-accelerated scroll-snap and transform-only indicators keep interaction latency crisp on every device.',
    metric: 'cubic-bezier(0.16, 1, 0.3, 1)',
    tint: 'color-mix(in oklch, var(--j-success-soft) 75%, var(--j-surface-1))',
  },
  {
    eyebrow: '04 · Sovereign Architecture',
    title: 'Pure CSS @layer foundations paired with idiomatic Vue 3 and React 19 primitives.',
    summary: 'Author semantic HTML directly or bind typed v-model and controlled state with identical DOM output.',
    metric: 'Zero specificity wars · :where()',
    tint: 'color-mix(in oklch, var(--j-warning-soft) 70%, var(--j-surface-1))',
  },
];

const galleryCards = [
  { code: 'TOK-01', title: 'Color Primitives', meta: 'OKLCH + light-dark()', tag: 'Foundation' },
  { code: 'LYT-04', title: 'Bento & Subgrid', meta: '12-col responsive', tag: 'Spatial' },
  { code: 'FRM-09', title: 'Segmented Control', meta: 'FLIP pill indicator', tag: 'Input' },
  { code: 'DSP-14', title: 'High-Density Table', meta: 'Sticky + tabular-nums', tag: 'Data' },
  { code: 'DSP-16', title: 'WAI-ARIA Tree View', meta: 'Roving focus + guides', tag: 'Hierarchy' },
  { code: 'OVL-08', title: 'Anchored Combobox', meta: 'Top-layer popover', tag: 'Overlay' },
];

const syncedIndex = ref(0);
const chapters = [
  { id: 'ingest', label: '1. Edge Ingest', region: 'Global Anycast · 310 POPs', detail: 'TLS 1.3 termination and deterministic request signing within 4ms of client origin.' },
  { id: 'verify', label: '2. Policy Gate', region: 'Zero-Trust Enclave', detail: 'Hardware-backed token verification and per-tenant rate concurrency enforcement.' },
  { id: 'compute', label: '3. Isolate Execution', region: 'Sub-millisecond Cold Start', detail: 'Sandboxed V8 & Wasm workers co-located with read-replicated sovereign storage.' },
  { id: 'observe', label: '4. Audit Telemetry', region: 'OpenTelemetry Stream', detail: 'Structured trace spans and cryptographic ledger receipts exported in real time.' },
];

const html = `<section class="j-carousel" aria-roledescription="carousel" aria-label="Highlights">
  <div class="j-carousel__stage">
    <div class="j-carousel__viewport" tabindex="0">
      <div class="j-carousel__slide" role="group" aria-roledescription="slide" aria-label="1 of 3">
        <div class="j-card">Slide 1</div>
      </div>
      <div class="j-carousel__slide" role="group" aria-roledescription="slide" aria-label="2 of 3">
        <div class="j-card">Slide 2</div>
      </div>
      <div class="j-carousel__slide" role="group" aria-roledescription="slide" aria-label="3 of 3">
        <div class="j-card">Slide 3</div>
      </div>
    </div>
    <button type="button" class="j-carousel__prev" aria-label="Previous slide"></button>
    <button type="button" class="j-carousel__next" aria-label="Next slide"></button>
  </div>
  <div class="j-carousel__footer">
    <span class="j-carousel__counter">1 / 3</span>
    <div class="j-carousel__dots" role="tablist" aria-label="Choose slide">
      <button type="button" class="j-carousel__dot" role="tab" aria-selected="true" aria-label="Slide 1"></button>
      <button type="button" class="j-carousel__dot" role="tab" aria-selected="false" aria-label="Slide 2"></button>
      <button type="button" class="j-carousel__dot" role="tab" aria-selected="false" aria-label="Slide 3"></button>
    </div>
  </div>
</section>`;
</script>

<template>
  <DemoSection
    title="Full-bleed architectural feature deck"
    description="Floating frosted prev/next controls, active elongated pill pagination dots, tabular slide counter, and wrap-around loop."
  >
    <div style="width:100%">
      <JCarousel v-model="heroSlide" loop label="Design system pillars">
        <JCarouselSlide v-for="slide in heroSlides" :key="slide.eyebrow">
          <div
            :style="{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 'var(--j-space-6)',
              minHeight: '210px',
              padding: 'var(--j-space-8) var(--j-space-12)',
              borderRadius: 'var(--j-radius-lg)',
              border: '1px solid var(--j-border)',
              background: slide.tint,
            }"
          >
            <JStack gap="related">
              <span style="font-family:var(--j-font-mono);font-size:var(--j-text-xs);color:var(--j-fg-muted)">
                {{ slide.eyebrow }}
              </span>
              <h4 style="margin:0;max-width:46ch;font-size:var(--j-text-xl);font-weight:var(--j-weight-semibold);letter-spacing:var(--j-tracking-tight);color:var(--j-fg)">
                {{ slide.title }}
              </h4>
              <p style="margin:0;max-width:58ch;font-size:var(--j-text-sm);color:var(--j-fg-muted)">
                {{ slide.summary }}
              </p>
            </JStack>
            <JInline justify="between" align="center">
              <JBadge size="sm" variant="outline" tone="neutral">{{ slide.metric }}</JBadge>
              <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)">Swipe or use ← → keys</span>
            </JInline>
          </div>
        </JCarouselSlide>
      </JCarousel>
    </div>
  </DemoSection>

  <DemoSection
    title="Multi-card gallery (slidesPerView = 3)"
    description="Displays three equal-width cards per viewport with footer navigation buttons and snap-aligned scrolling."
  >
    <div style="width:100%">
      <JCarousel :slides-per-view="3" arrows="footer" label="Component catalog modules">
        <JCarouselSlide v-for="card in galleryCards" :key="card.code">
          <JCard size="sm" variant="surface" style="height:100%">
            <JStack gap="related">
              <JInline justify="between" align="center">
                <code style="font-family:var(--j-font-mono);font-size:var(--j-text-xs);color:var(--j-fg-subtle)">{{ card.code }}</code>
                <JBadge size="sm" variant="soft">{{ card.tag }}</JBadge>
              </JInline>
              <strong style="font-size:var(--j-text-md);color:var(--j-fg)">{{ card.title }}</strong>
              <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">{{ card.meta }}</span>
            </JStack>
          </JCard>
        </JCarouselSlide>
      </JCarousel>
    </div>
  </DemoSection>

  <DemoSection
    title="Controlled tab-synced slide switcher"
    description="Two-way v-model binding keeps external chapter selector buttons and native trackpad scroll in lockstep."
  >
    <JStack gap="item" style="width:100%">
      <JInline gap="related">
        <JButton
          v-for="(ch, idx) in chapters"
          :key="ch.id"
          size="sm"
          :variant="syncedIndex === idx ? 'solid' : 'outline'"
          @click="syncedIndex = idx"
        >
          {{ ch.label }}
        </JButton>
      </JInline>

      <JCarousel
        v-model="syncedIndex"
        :arrows="false"
        label="Request lifecycle stages"
      >
        <JCarouselSlide v-for="ch in chapters" :key="ch.id">
          <JCard size="md" :title="ch.label" :description="ch.region">
            <p style="margin:0;font-size:var(--j-text-sm);color:var(--j-fg-muted)">
              {{ ch.detail }}
            </p>
          </JCard>
        </JCarouselSlide>
      </JCarousel>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
