<script lang="ts">
export const meta = {
  name: 'Combobox',
  group: 'Overlay',
  order: 6,
  description:
    'WAI-ARIA 1.2 autocomplete input + anchored popover listbox with grouped filtering, free-text & creatable values, multi-select chips, and debounced async search.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JCombobox,
  JField,
  JBadge,
  JCard,
  JStack,
  JInline,
  type ComboboxOption,
} from 'jenni-vue';

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

// ---- Free-text & creatable demo state ----
const targetRef = ref<string | null>('release/v2.4');
const branchPresets = ref<ComboboxOption[]>([
  { value: 'main', label: 'main', description: 'Default protected branch' },
  { value: 'release/v2.4', label: 'release/v2.4', description: 'Active release train' },
  { value: 'staging', label: 'staging', description: 'Pre-production canary' },
]);
const lastCreatedRef = ref<string | null>(null);

function handleCreateBranch(val: string) {
  lastCreatedRef.value = val;
  if (!branchPresets.value.some((b) => b.value.toLowerCase() === val.toLowerCase())) {
    branchPresets.value = [
      ...branchPresets.value,
      { value: val, label: val, description: 'Custom branch reference' },
    ];
  }
}

const issueTags = ref<string[]>(['a11y', 'tokens']);
const tagCatalog = ref<ComboboxOption[]>([
  { value: 'a11y', label: 'a11y', description: 'Keyboard & screen-reader parity' },
  { value: 'tokens', label: 'tokens', description: 'Semantic OKLCH & density tokens' },
  { value: 'overlay', label: 'overlay', description: 'Popover, dialog & focus management' },
  { value: 'performance', label: 'performance', description: '60fps rendering & bundle budget' },
]);

function handleCreateTag(val: string) {
  lastCreatedRef.value = val;
  if (!tagCatalog.value.some((t) => t.value.toLowerCase() === val.toLowerCase())) {
    tagCatalog.value = [...tagCatalog.value, { value: val, label: val, description: 'Created inline' }];
  }
}

// ---- Async server search demo state ----
const SERVER_DIRECTORY: ComboboxOption[] = [
  { value: 'branch:main', label: 'main', description: 'HEAD · 8f41c2a · Protected', group: 'Branches' },
  { value: 'branch:release/v2.4', label: 'release/v2.4', description: 'Release candidate · 14 commits ahead', group: 'Branches' },
  { value: 'branch:feat/combobox-async', label: 'feat/combobox-async', description: 'Async search + creatable options', group: 'Branches' },
  { value: 'branch:feat/grid-pinning', label: 'feat/grid-pinning', description: 'Sticky left/right column pinning', group: 'Branches' },
  { value: 'branch:fix/anchor-flip', label: 'fix/anchor-flip', description: 'Viewport collision fallback', group: 'Branches' },
  { value: 'branch:perf/virtual-scroll', label: 'perf/virtual-scroll', description: 'Zero-allocation row recycling', group: 'Branches' },
  { value: 'user:ada', label: '@ada · Ada Lovelace', description: 'Core Architecture · London', group: 'Maintainers' },
  { value: 'user:dieter', label: '@dieter · Dieter Rams', description: 'Design Systems · Kronberg', group: 'Maintainers' },
  { value: 'user:grace', label: '@grace · Grace Hopper', description: 'Compiler Infrastructure · Arlington', group: 'Maintainers' },
  { value: 'user:margaret', label: '@margaret · Margaret Hamilton', description: 'Fault-Tolerant Runtime · Cambridge', group: 'Maintainers' },
  { value: 'user:alan', label: '@alan · Alan Kay', description: 'Interactive Environments · Palo Alto', group: 'Maintainers' },
];

const asyncTarget = ref<string | null>('branch:feat/combobox-async');
const asyncSearchQuery = ref('');
const asyncResults = ref<ComboboxOption[]>(SERVER_DIRECTORY.slice(0, 6));
const isSearching = ref(false);
let activeRequestId = 0;
let networkTimer: ReturnType<typeof setTimeout> | null = null;

function runAsyncSearch(q: string) {
  const reqId = ++activeRequestId;
  if (networkTimer !== null) {
    clearTimeout(networkTimer);
    networkTimer = null;
  }
  isSearching.value = true;
  networkTimer = setTimeout(() => {
    if (reqId !== activeRequestId) return;
    const needle = q.trim().toLowerCase();
    asyncResults.value = !needle
      ? SERVER_DIRECTORY.slice(0, 6)
      : SERVER_DIRECTORY.filter(
          (item) =>
            item.label.toLowerCase().includes(needle) ||
            item.value.toLowerCase().includes(needle) ||
            (item.description?.toLowerCase().includes(needle) ?? false) ||
            (item.group?.toLowerCase().includes(needle) ?? false),
        );
    isSearching.value = false;
    networkTimer = null;
  }, 260);
}

onBeforeUnmount(() => {
  if (networkTimer !== null) clearTimeout(networkTimer);
});

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
    title="Free-text & creatable values"
    description="Combine allow-custom-value and creatable to accept arbitrary git refs or mint new multi-select tags inline via Enter, click, or blur."
  >
    <JStack gap="field" style="max-width:26rem">
      <JField
        label="Target branch or commit SHA (single)"
        hint="Pick an existing branch, click Create, or type any ref and press Enter or Tab."
      >
        <JCombobox
          v-model="targetRef"
          :options="branchPresets"
          allow-custom-value
          creatable
          placeholder="e.g. feat/custom-ref or a1b2c3d…"
          @create="handleCreateBranch"
        />
      </JField>

      <JField
        label="Issue labels (multi-select creatable)"
        hint="Type a new label name and press Enter or click the + Create row."
      >
        <JCombobox
          v-model="issueTags"
          multiple
          allow-custom-value
          :creatable="(q) => `Create tag '${q}'`"
          :options="tagCatalog"
          placeholder="Add or create labels…"
          @create="handleCreateTag"
        />
      </JField>

      <JInline gap="related">
        <JBadge variant="soft" tone="neutral">Ref: {{ targetRef ?? 'none' }}</JBadge>
        <JBadge variant="outline" tone="neutral">{{ issueTags.length }} labels</JBadge>
        <JBadge v-if="lastCreatedRef" variant="soft" tone="accent">Created: {{ lastCreatedRef }}</JBadge>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Async server search"
    description="Disable client filtering (:filter='false'), debounce @search by 220ms, and surface an inline spinner while a 260ms server lookup resolves."
  >
    <JStack gap="item" style="max-width:26rem">
      <JField
        label="Jump to branch or maintainer"
        hint="Try searching 'feat', 'perf', 'ada', or 'kronberg'."
      >
        <JCombobox
          v-model="asyncTarget"
          v-model:search="asyncSearchQuery"
          :options="asyncResults"
          :filter="false"
          :loading="isSearching"
          :debounce="220"
          loading-text="Querying repository index…"
          placeholder="Search branches & maintainers…"
          @search="runAsyncSearch"
        />
      </JField>
      <JInline gap="related">
        <JBadge variant="soft" tone="neutral">Selected: {{ asyncTarget ?? 'none' }}</JBadge>
        <JBadge variant="outline" :tone="isSearching ? 'accent' : 'neutral'">
          {{ isSearching ? 'Fetching…' : `${asyncResults.length} results` }}
        </JBadge>
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
