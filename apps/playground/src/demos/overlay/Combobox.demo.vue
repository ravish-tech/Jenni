<script lang="ts">
export const meta = {
  name: 'Combobox',
  group: 'Overlay',
  order: 6,
  description: 'WAI-ARIA 1.2 autocomplete input + anchored popover listbox with grouped filtering, checkmarks, and multi-select chips.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JCombobox,
  JField,
  JBadge,
  JCard,
  JStack,
  JInline,
  type ComboboxOption,
} from '@jenni/vue';

const region = ref<string | null>('eu-central-1');
const reviewers = ref<string[]>(['ada', 'dieter']);
const sizeVal = ref<string | null>('vue');
const invalidVal = ref<string | null>(null);

const regions: ComboboxOption[] = [
  { value: 'eu-central-1', label: 'Frankfurt (eu-central-1)', description: 'Primary low-latency cluster · 6ms', group: 'Europe' },
  { value: 'eu-west-1', label: 'Dublin (eu-west-1)', description: 'Read replica · 14ms', group: 'Europe' },
  { value: 'eu-north-1', label: 'Stockholm (eu-north-1)', description: 'Hydro-powered · 19ms', group: 'Europe' },
  { value: 'us-east-1', label: 'Virginia (us-east-1)', description: 'North America primary · 78ms', group: 'Americas' },
  { value: 'us-west-2', label: 'Oregon (us-west-2)', description: 'West coast edge · 132ms', group: 'Americas' },
  { value: 'ap-northeast-1', label: 'Tokyo (ap-northeast-1)', description: 'APAC primary · 198ms', group: 'Asia Pacific' },
  { value: 'sa-east-1', label: 'São Paulo (sa-east-1)', description: 'Maintenance window active', group: 'Americas', disabled: true },
];

const people: ComboboxOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'Principal Systems Architect', group: 'Core Architecture' },
  { value: 'dieter', label: 'Dieter Rams', description: 'Industrial Design Lead', group: 'Design Systems' },
  { value: 'grace', label: 'Grace Hopper', description: 'Compiler Infrastructure', group: 'Core Architecture' },
  { value: 'margaret', label: 'Margaret Hamilton', description: 'Fault-Tolerant Runtime', group: 'Reliability' },
  { value: 'alan', label: 'Alan Kay', description: 'Interactive Environments', group: 'Design Systems' },
];

const frameworks: ComboboxOption[] = [
  { value: 'html', label: 'Vanilla HTML + CSS' },
  { value: 'vue', label: 'Vue 3' },
  { value: 'react', label: 'React 19' },
  { value: 'svelte', label: 'Svelte 5 (Planned)', disabled: true },
];

const html = `<div style="max-width:18rem">
  <div class="j-combobox" data-j-combobox="demo-html-cb-list">
    <input
      class="j-combobox__input"
      placeholder="Select runtime…"
      aria-label="Select runtime"
    />
    <div class="j-combobox__controls">
      <button type="button" class="j-combobox__clear" tabindex="-1" aria-label="Clear" hidden>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>
      </button>
      <button type="button" class="j-combobox__chevron" tabindex="-1" aria-label="Toggle">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 6.5 3.5 3.5 3.5-3.5"/></svg>
      </button>
    </div>
  </div>
  <div class="j-combobox__listbox" id="demo-html-cb-list" popover="auto" role="listbox">
    <div class="j-combobox__group">
      <div class="j-combobox__group-label">Runtimes</div>
      <div class="j-combobox__option" role="option" data-value="node" aria-selected="true">
        <div class="j-combobox__option-body"><span class="j-combobox__option-label">Node.js 22 LTS</span></div>
      </div>
      <div class="j-combobox__option" role="option" data-value="bun">
        <div class="j-combobox__option-body"><span class="j-combobox__option-label">Bun 1.2</span></div>
      </div>
      <div class="j-combobox__option" role="option" data-value="deno">
        <div class="j-combobox__option-body"><span class="j-combobox__option-label">Deno 2.1</span></div>
      </div>
    </div>
    <div class="j-combobox__empty" hidden>No matching runtime</div>
  </div>
</div>`;
</script>

<template>
  <DemoSection
    title="Grouped autocomplete"
    description="ArrowDown / ArrowUp navigate via aria-activedescendant while keeping typing focus inside the input."
  >
    <JStack gap="item" style="max-width:24rem">
      <JField label="Deployment region" hint="Type to filter by city, region code, or continent.">
        <JCombobox
          v-model="region"
          :options="regions"
          placeholder="Search deployment regions…"
        />
      </JField>
      <JInline gap="related">
        <JBadge variant="soft" tone="neutral">Selected: {{ region ?? 'none' }}</JBadge>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Multiple selection with chips"
    description="Select several options into removable inline chips; press Backspace on an empty query to pop the last chip."
  >
    <JStack gap="item" style="max-width:26rem">
      <JField label="Specification reviewers" hint="Selections toggle in place without closing the listbox.">
        <JCombobox
          v-model="reviewers"
          multiple
          :options="people"
          placeholder="Add reviewers…"
        />
      </JField>
      <JInline gap="inline">
        <JBadge size="sm" variant="outline" tone="neutral">{{ reviewers.length }} assigned</JBadge>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Sizes & validation states"
    description="Matches .j-input canonical control heights: sm (28px) · md (34px) · lg (42px), plus invalid and disabled."
  >
    <JCard variant="outline" style="max-width:24rem">
      <JStack gap="field">
        <JField label="Small (sm)">
          <JCombobox v-model="sizeVal" size="sm" :options="frameworks" placeholder="Framework…" />
        </JField>
        <JField label="Default (md)">
          <JCombobox v-model="sizeVal" size="md" :options="frameworks" placeholder="Framework…" />
        </JField>
        <JField label="Large (lg)">
          <JCombobox v-model="sizeVal" size="lg" :options="frameworks" placeholder="Framework…" />
        </JField>
        <JField label="Invalid" :error="invalidVal ? undefined : 'Please choose a supported target adapter.'">
          <JCombobox v-model="invalidVal" :invalid="!invalidVal" :options="frameworks" placeholder="Required adapter…" />
        </JField>
        <JField label="Disabled">
          <JCombobox model-value="vue" disabled :options="frameworks" />
        </JField>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Zero-framework [data-j-combobox] + initComboboxes().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
