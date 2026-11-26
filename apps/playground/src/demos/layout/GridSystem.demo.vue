<script lang="ts">
export const meta = {
  name: 'Grid System',
  group: 'Layout',
  order: 4,
  description:
    '12-column CSS Grid with @container responsive spans, column offsets, auto-fit/auto-fill intrinsic tracks, independent axis gaps, and CSS Subgrid.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JGrid,
  JCol,
  JStack,
  JInline,
  JCard,
  JButton,
  JBadge,
  JSwitch,
  JSegmentedControl,
  JField,
  JInput,
  type JGap,
} from 'jenni-vue';

const showGuides = ref(true);
const gridGap = ref<JGap>('field');

const simWidth = ref<'100%' | '800px' | '560px' | '360px'>('100%');
const simPresets: Array<{ value: '100%' | '800px' | '560px' | '360px'; label: string }> = [
  { value: '100%', label: 'Full (≥960 → 4 cols)' },
  { value: '800px', label: '800px (md → 3 cols)' },
  { value: '560px', label: '560px (sm → 2 cols)' },
  { value: '360px', label: '360px (base → 1 col)' },
];

const autoMode = ref<'auto-fit' | 'auto-fill'>('auto-fill');
const autoCount = ref(2);

const cellStyle = {
  padding: 'var(--j-space-2) var(--j-space-3)',
  borderRadius: 'var(--j-radius-sm)',
  background: 'var(--j-surface-1)',
  boxShadow: 'inset 0 0 0 1px var(--j-border-strong), var(--j-shadow-xs)',
  fontFamily: 'var(--j-font-mono)',
  fontSize: 'var(--j-text-xs)',
  textAlign: 'center' as const,
  color: 'var(--j-fg)',
};

const accentCellStyle = {
  ...cellStyle,
  background: 'var(--j-accent-soft)',
  color: 'var(--j-accent-soft-fg)',
  boxShadow: 'inset 0 0 0 1px color-mix(in oklch, var(--j-accent) 35%, transparent)',
  fontWeight: 'var(--j-weight-medium)',
};

const plans = [
  {
    name: 'Starter',
    price: '$0',
    desc: 'Essential spatial tokens and primitives for personal prototypes.',
    cta: 'Start free',
    variant: 'outline' as const,
  },
  {
    name: 'Studio',
    price: '$24',
    desc: 'Full 47-component design system, container-responsive 12-column grids, canonical app shells, and multi-brand OKLCH themes for product teams.',
    cta: 'Upgrade to Studio',
    variant: 'solid' as const,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'Dedicated design-token governance and SLA support.',
    cta: 'Contact sales',
    variant: 'outline' as const,
  },
];

const htmlCode = `<!-- 1. 12-Column Container-Responsive Grid -->
<div class="j-grid" data-cols="12" data-gap="group" data-guides>
  <div class="j-col" data-md="8">Main content (12 → 8 cols at ≥720px)</div>
  <div class="j-col" data-md="4">Aside rail (12 → 4 cols at ≥720px)</div>
  <div class="j-col" data-start="3" data-md="8">Centered 8-col editorial block (starts at col 3)</div>
</div>

<!-- 2. Intrinsic Auto-Fill Grid (no breakpoints needed) -->
<div class="j-grid" data-cols="auto-fill" style="--j-grid-min: 220px" data-gap="field">
  <article class="j-card">Tile 1</article>
  <article class="j-card">Tile 2</article>
</div>`;

const vueCode = `<JGrid :cols="12" col-gap="group" row-gap="field" :guides="showGuides">
  <JCol :sm="6" :md="4" :lg="3">Metric A</JCol>
  <JCol :sm="6" :md="4" :lg="3">Metric B</JCol>
  <JCol :sm="6" :md="4" :lg="3">Metric C</JCol>
  <JCol :sm="6" :md="12" :lg="3">Metric D</JCol>

  <!-- Centered 8-column measure starting at track 3 (no empty spacer divs) -->
  <JCol :md="8" :start="3">Centered editorial section</JCol>
</JGrid>`;
</script>

<template>
  <DemoSection
    title="12-Column Architectural Grid & Column Offsets"
    description="Built on native CSS Grid rather than legacy Flexbox percentage math: zero negative-margin hacks, sub-pixel column guides, and explicit start offsets without spacer divs."
  >
    <JStack gap="field" style="width: 100%">
      <JInline justify="between" gap="item" style="width: 100%">
        <JInline gap="related">
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Gutter:</span>
          <JButton
            v-for="g in (['related', 'item', 'field', 'group'] as const)"
            :key="g"
            size="sm"
            :variant="gridGap === g ? 'soft' : 'ghost'"
            :tone="gridGap === g ? 'accent' : 'neutral'"
            @click="gridGap = g"
          >
            {{ g }}
          </JButton>
        </JInline>
        <JSwitch v-model="showGuides" size="sm">12-column guides</JSwitch>
      </JInline>

      <JGrid :cols="12" :gap="gridGap" :guides="showGuides">
        <JCol :span="12"><div :style="cellStyle">span="12" (full row)</div></JCol>

        <JCol :span="6"><div :style="cellStyle">span="6"</div></JCol>
        <JCol :span="6"><div :style="cellStyle">span="6"</div></JCol>

        <JCol :span="4"><div :style="cellStyle">span="4"</div></JCol>
        <JCol :span="4"><div :style="cellStyle">span="4"</div></JCol>
        <JCol :span="4"><div :style="cellStyle">span="4"</div></JCol>

        <JCol :span="4"><div :style="accentCellStyle">span="4" (Sidebar)</div></JCol>
        <JCol :span="8"><div :style="accentCellStyle">span="8" (Primary canvas)</div></JCol>

        <JCol :span="8" :start="3">
          <div :style="accentCellStyle">start="3" span="8" (Centered editorial column — no spacer divs)</div>
        </JCol>
      </JGrid>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Container-Responsive Spans (@container sm / md / lg)"
    description="Columns respond to the grid's actual container width (sm ≥ 480px · md ≥ 720px · lg ≥ 960px) rather than viewport width — so grids reflow accurately inside sidebars, split panes, and drawers."
  >
    <JStack gap="field" style="width: 100%">
      <JSegmentedControl v-model="simWidth" :options="simPresets" size="sm" aria-label="Simulated container width" />

      <div
        :style="{
          width: '100%',
          maxWidth: simWidth,
          marginInline: 'auto',
          padding: 'var(--j-space-4)',
          borderRadius: 'var(--j-radius-md)',
          background: 'var(--j-surface-2)',
          boxShadow: 'inset 0 0 0 1px var(--j-border)',
          transition: 'max-width var(--j-duration-slow) var(--j-ease-emphasized)',
        }"
      >
        <JGrid :cols="12" gap="item" :guides="showGuides">
          <JCol v-for="n in 4" :key="n" :sm="6" :md="4" :lg="3">
            <JCard size="sm" :title="`Node 0${n}`" description="sm=6 · md=4 · lg=3">
              <JBadge size="sm" variant="soft" tone="success">99.98%</JBadge>
            </JCard>
          </JCol>
        </JGrid>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Intrinsic Auto-Fill vs. Auto-Fit (Zero Breakpoints)"
    description="When items have an ideal minimum width, auto-fill preserves empty column tracks so 1–2 filtered results stay card-sized, while auto-fit stretches items to fill the row."
  >
    <JStack gap="field" style="width: 100%">
      <JInline justify="between" gap="item" style="width: 100%">
        <JSegmentedControl
          v-model="autoMode"
          size="sm"
          :options="[
            { value: 'auto-fill', label: 'auto-fill (preserve tracks)' },
            { value: 'auto-fit', label: 'auto-fit (stretch items)' },
          ]"
          aria-label="Auto grid mode"
        />
        <JInline gap="inline">
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Items:</span>
          <JButton
            v-for="c in [1, 2, 3, 5]"
            :key="c"
            size="sm"
            :variant="autoCount === c ? 'solid' : 'outline'"
            :tone="autoCount === c ? 'accent' : 'neutral'"
            @click="autoCount = c"
          >
            {{ c }}
          </JButton>
        </JInline>
      </JInline>

      <JGrid :cols="autoMode" :min-cell-width="200" gap="field">
        <JCard v-for="i in autoCount" :key="i" size="sm" :title="`Artifact 0${i}`" description="minCellWidth: 200px">
          <JBadge size="sm" variant="outline" tone="neutral">{{ autoMode }}</JBadge>
        </JCard>
      </JGrid>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Independent Axis Gaps (colGap × rowGap)"
    description="Multi-column forms pair a wider horizontal column gutter (col-gap='group' = 24px) with tighter vertical field rhythm (row-gap='field' = 16px)."
  >
    <JCard title="Organization profile" description="12-column form layout with distinct horizontal and vertical rhythm." style="width: 100%">
      <JGrid :cols="12" col-gap="group" row-gap="field">
        <JCol :md="6">
          <JField label="Workspace name" required>
            <JInput model-value="Meridian Design Studio" />
          </JField>
        </JCol>
        <JCol :md="6">
          <JField label="Slug">
            <JInput model-value="meridian-studio" />
          </JField>
        </JCol>
        <JCol :md="8">
          <JField label="Billing address">
            <JInput model-value="440 Terry Ave N, Seattle" />
          </JField>
        </JCol>
        <JCol :md="4">
          <JField label="Postal code">
            <JInput model-value="98109" />
          </JField>
        </JCol>
      </JGrid>
    </JCard>
  </DemoSection>

  <DemoSection
    title="CSS Subgrid Alignment (subgrid)"
    description="Something Flexbox rows cannot do natively: subgrid locks headers, variable-length descriptions, and bottom action buttons onto identical horizontal baselines across columns."
  >
    <JGrid :cols="12" col-gap="group" row-gap="item">
      <JCol
        v-for="p in plans"
        :key="p.name"
        :md="4"
        :row-span="3"
        subgrid
        :style="{
          padding: 'var(--j-space-5)',
          borderRadius: 'var(--j-radius-lg)',
          background: 'var(--j-surface-1)',
          boxShadow: '0 0 0 1px var(--j-border), var(--j-shadow-xs)',
        }"
      >
        <JInline justify="between" align="baseline">
          <strong style="font-size: var(--j-text-md)">{{ p.name }}</strong>
          <span style="font-size: var(--j-text-xl); font-weight: var(--j-weight-semibold); font-variant-numeric: tabular-nums">{{ p.price }}</span>
        </JInline>
        <p style="font-size: var(--j-text-sm); color: var(--j-fg-muted); line-height: 1.5">{{ p.desc }}</p>
        <JButton :variant="p.variant" style="width: 100%">{{ p.cta }}</JButton>
      </JCol>
    </JGrid>
  </DemoSection>

  <DemoSection title="Vue & Plain HTML">
    <JStack gap="field" style="width: 100%">
      <DemoCode lang="vue" :code="vueCode" />
      <DemoCode lang="html" :code="htmlCode" />
    </JStack>
  </DemoSection>
</template>
