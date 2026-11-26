<script lang="ts">
export const meta = {
  name: 'Segmented Control',
  group: 'Forms',
  order: 3,
  description: 'Architectural capsule radiogroup with a damped 300ms gliding indicator.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JInline, JSegmentedControl, JSegmentedItem, JStack } from 'jenni-vue';

const period = ref('week');
const view = ref('board');
const billing = ref('annual');
const sizeDemo = ref('md');
const toneVal = ref('active');

const periodOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const html = `<div class="j-segmented" role="radiogroup" aria-label="Timeframe">
  <button type="button" class="j-segmented__item" role="radio" data-value="day" aria-checked="true">Day</button>
  <button type="button" class="j-segmented__item" role="radio" data-value="week" aria-checked="false">Week</button>
  <button type="button" class="j-segmented__item" role="radio" data-value="month" aria-checked="false">Month</button>
</div>`;
</script>

<template>
  <DemoSection title="Basic" description="Options prop or compound JSegmentedItem children with roving arrow-key focus.">
    <JStack gap="field" align="center">
      <JSegmentedControl v-model="period" :options="periodOptions" aria-label="Timeframe" />
      <JSegmentedControl v-model="view" aria-label="Layout view">
        <JSegmentedItem value="list">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M3 4.5h10M3 8h10M3 11.5h10" />
          </svg>
          List
        </JSegmentedItem>
        <JSegmentedItem value="board">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2.5" y="3" width="4.2" height="10" rx="1" />
            <rect x="9.3" y="3" width="4.2" height="6.5" rx="1" />
          </svg>
          Board
        </JSegmentedItem>
        <JSegmentedItem value="timeline">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M2.5 5h6M5.5 8h8M4 11h6.5" />
          </svg>
          Timeline
        </JSegmentedItem>
      </JSegmentedControl>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes" description="Matches canonical control heights: sm (28px) · md (34px) · lg (42px).">
    <JStack gap="item" align="center">
      <JSegmentedControl
        v-for="s in (['sm', 'md', 'lg'] as const)"
        :key="s"
        v-model="sizeDemo"
        :size="s"
        :options="[
          { value: 'sm', label: 'Compact' },
          { value: 'md', label: 'Default' },
          { value: 'lg', label: 'Comfortable' },
        ]"
        :aria-label="`Density ${s}`"
      />
    </JStack>
  </DemoSection>

  <DemoSection title="Tones & States" description="Subtle tonal tinting on active capsule, individual disabled option, or disabled group.">
    <JStack gap="item" align="center">
      <JInline gap="item" justify="center">
        <JSegmentedControl
          v-model="toneVal"
          tone="accent"
          :options="[
            { value: 'active', label: 'Active' },
            { value: 'queued', label: 'Queued' },
            { value: 'archived', label: 'Archived', disabled: true },
          ]"
          aria-label="Issue filter"
        />
        <JSegmentedControl
          model-value="locked"
          disabled
          :options="[
            { value: 'locked', label: 'Locked' },
            { value: 'editable', label: 'Editable' },
          ]"
          aria-label="Disabled control"
        />
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Full Width & Composition" description="Equal-width segments inside a billing summary card.">
    <JCard title="Workspace plan" description="Switch billing cadence at any time." style="width: 100%; max-width: 400px">
      <JStack gap="field">
        <JSegmentedControl
          v-model="billing"
          full-width
          :options="[
            { value: 'monthly', label: 'Monthly' },
            { value: 'annual', label: 'Annual (−20%)' },
          ]"
          aria-label="Billing cycle"
        />
        <JInline justify="between" align="baseline">
          <span style="color: var(--j-fg-muted); font-size: var(--j-text-sm)">Pro workspace · 5 seats</span>
          <span style="font-size: var(--j-text-xl); font-weight: var(--j-weight-semibold); font-variant-numeric: tabular-nums">
            {{ billing === 'annual' ? '$16 / mo' : '$20 / mo' }}
          </span>
        </JInline>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Static CSS fallback works immediately; initSegmented() adds roving keys and FLIP glide.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
