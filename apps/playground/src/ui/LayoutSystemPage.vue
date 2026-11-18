<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { JAvatar, JBadge, JButton, JCard, JCheckbox, JField, JInput, JKbd, JSwitch } from '@jenni/vue';
import { DemoSection } from '@/kit';
import { DEMO_CONTEXT, sectionId } from '@/kit/context';
import { openCount } from '@/lib/feedback';
import { prefs } from '@/lib/prefs';
import { findDemo } from '@/lib/registry';
import { href } from '@/lib/router';
import Icon from './Icon.vue';
import StatusPill from './StatusPill.vue';

const componentName = computed(() => 'Layout System');
const sections = ref<string[]>([]);

provide(DEMO_CONTEXT, {
  component: componentName,
  sections,
  register(title) {
    if (!sections.value.includes(title)) sections.value.push(title);
  },
  unregister(title) {
    sections.value = sections.value.filter((t) => t !== title);
  },
});

const open = computed(() => openCount(componentName.value));
const density = computed(() => prefs.knobs.density);

function px(base: number): string {
  const scaled = Math.round(base * density.value * 10) / 10;
  return `${scaled}px`;
}

function pxNum(base: number): number {
  return Math.round(base * density.value * 10) / 10;
}

function jump(title: string) {
  document.getElementById(sectionId(title))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Section 1: Base grid & density presets
const densityPresets = [
  { label: 'Compact', value: 0.65, tag: '0.65×', hint: 'High-density IDEs, financial tables, Linear-style lists' },
  { label: 'Default', value: 1, tag: '1.00×', hint: 'Balanced web apps, standard SaaS forms' },
  { label: 'Comfortable', value: 1.15, tag: '1.15×', hint: 'Touch-first surfaces, spacious editorial flows' },
] as const;

const spaceScale = [
  { token: '--j-space-0-5', base: 2, grid: 'sub-grid', alias: '', note: 'Optical hairline nudge' },
  { token: '--j-space-1', base: 4, grid: '4px unit', alias: '', note: 'Micro-grid base unit' },
  { token: '--j-space-1-5', base: 6, grid: 'sub-grid', alias: '--j-gap-inline', note: 'Icon + label, status dot + text' },
  { token: '--j-space-2', base: 8, grid: '8px rhythm', alias: '--j-gap-related', note: 'Structural unit · sibling buttons' },
  { token: '--j-space-3', base: 12, grid: '4px × 3', alias: '--j-gap-item', note: 'Row slot gap · list horizontal padding' },
  { token: '--j-space-4', base: 16, grid: '8px × 2', alias: '--j-gap-field', note: 'Form field stack · compact card pad' },
  { token: '--j-space-5', base: 20, grid: '4px × 5', alias: '', note: 'Standard card & dialog padding' },
  { token: '--j-space-6', base: 24, grid: '8px × 3', alias: '--j-gap-group', note: 'Card grid gutter · sub-group break' },
  { token: '--j-space-8', base: 32, grid: '8px × 4', alias: '', note: 'Major cluster separation' },
  { token: '--j-space-10', base: 40, grid: '8px × 5', alias: '--j-gap-section', note: 'Vertical page section rhythm' },
  { token: '--j-space-12', base: 48, grid: '8px × 6', alias: '', note: 'Hero header to body break' },
  { token: '--j-space-16', base: 64, grid: '8px × 8', alias: '', note: 'Editorial chapter break' },
  { token: '--j-space-20', base: 80, grid: '8px × 10', alias: '', note: 'Landing / monument spacing' },
] as const;

// Section 2: Semantic component gaps
const showRedlines = ref(true);
const fieldWorkspace = ref('Design Studio');
const fieldSlug = ref('design-studio');

// Section 3: Canonical heights & list item anatomy
const showHeightRedlines = ref(true);
const insetDivider = ref(true);
const listNotifyToggle = ref(true);
const activeListRow = ref<'compact' | '1' | '2' | '3'>('2');

const controlTiers = [
  { token: '--j-control-sm', size: 'sm' as const, base: 28, label: 'Small (sm)', usage: 'Toolbar actions, filter chips, dense table inputs' },
  { token: '--j-control-md', size: 'md' as const, base: 34, label: 'Default (md)', usage: 'Standard buttons, form inputs, selects, segmented tabs' },
  { token: '--j-control-lg', size: 'lg' as const, base: 42, label: 'Large (lg)', usage: 'Primary hero CTAs, sign-in fields, command search' },
] as const;

const chromeBars = [
  { token: '--j-subbar-h', px: 40, name: 'SubBar', role: 'Secondary filter bar, view tabs, or Contextual breadcrumbs' },
  { token: '--j-topbar-h', px: 52, name: 'TopBar', role: 'Sticky primary application header & global actions' },
  { token: '--j-bottombar-h', px: 60, name: 'BottomBar', role: 'Mobile tab navigation or sticky checkout bar (+ safe-area)' },
] as const;

const keylineOffsetPx = computed(() => pxNum(52));

// Section 4: Content containers & keylines
type ContainerKey = 'prose' | 'sm' | 'md' | 'lg' | 'xl';
const activeContainer = ref<ContainerKey>('md');

const containers: {
  key: ContainerKey;
  token: string;
  size: string;
  pxApprox: number;
  ratioPct: number;
  usage: string;
  examples: string;
}[] = [
  {
    key: 'prose',
    token: '--j-measure-prose',
    size: '65ch',
    pxApprox: 560,
    ratioPct: 40,
    usage: 'Optimal reading measure (60–70 characters per line)',
    examples: 'Documentation, release notes, long-form articles, legal copy',
  },
  {
    key: 'sm',
    token: '--j-container-sm',
    size: '640px',
    pxApprox: 640,
    ratioPct: 45.7,
    usage: 'Focused single-column flows with zero peripheral distraction',
    examples: 'Authentication, onboarding wizards, focused account preferences',
  },
  {
    key: 'md',
    token: '--j-container-md',
    size: '880px',
    pxApprox: 880,
    ratioPct: 62.9,
    usage: 'Standard content & settings canvas',
    examples: 'Settings pages, structured forms, specification documents',
  },
  {
    key: 'lg',
    token: '--j-container-lg',
    size: '1160px',
    pxApprox: 1160,
    ratioPct: 82.9,
    usage: 'Multi-card SaaS overview & two/three-column layouts',
    examples: 'Project overview, team directory, billing & usage dashboards',
  },
  {
    key: 'xl',
    token: '--j-container-xl',
    size: '1400px',
    pxApprox: 1400,
    ratioPct: 100,
    usage: 'High-density wide workspaces & multi-pane analytics',
    examples: 'Metrics dashboards, kanban boards, wide data tables',
  },
];

const selectedContainer = computed(() => containers.find((c) => c.key === activeContainer.value) ?? containers[2]!);

// Section 5: Container-Query Window Size Classes
type SizeClassId = 'compact' | 'medium' | 'expanded' | 'large';
const simViewport = ref(1180);

const sizeClasses: {
  id: SizeClassId;
  name: string;
  range: string;
  sampleWidth: number;
  gutter: number;
  columns: number;
  navChrome: string;
  panes: string;
  summary: string;
}[] = [
  {
    id: 'compact',
    name: 'Compact',
    range: '< 720px',
    sampleWidth: 390,
    gutter: 16,
    columns: 1,
    navChrome: 'TopBar (52px) + BottomBar (60px) or modal Drawer',
    panes: 'Single fluid pane · split drill-down',
    summary: 'Phones & narrow split windows. Sidebars move off-canvas; actions anchor to bottom reach zone.',
  },
  {
    id: 'medium',
    name: 'Medium',
    range: '720px – 1099px',
    sampleWidth: 840,
    gutter: 24,
    columns: 2,
    navChrome: 'Collapsed 60px Icon Rail + TopBar',
    panes: 'Rail (60px) + Fluid Main',
    summary: 'Tablets & split-screen laptops. Navigation compresses to a 60px icon rail; secondary TOC/inspector hides.',
  },
  {
    id: 'expanded',
    name: 'Expanded',
    range: '1100px – 1439px',
    sampleWidth: 1240,
    gutter: 32,
    columns: 3,
    navChrome: 'Persistent 248px Sidebar (or 60px + 220px Dual-Nav)',
    panes: 'Sidebar (248px) + Fluid Main',
    summary: 'Standard desktop workspaces. Full labeled sidebar or dual-rail navigation stays docked.',
  },
  {
    id: 'large',
    name: 'Large',
    range: '≥ 1440px',
    sampleWidth: 1520,
    gutter: 40,
    columns: 4,
    navChrome: 'Persistent 248px Sidebar + 320px Right Aside / Copilot',
    panes: 'Sidebar (248px) + Main + Aside (320px)',
    summary: 'Wide desktop monitors. Unlocks persistent right inspectors, AI Copilot sidecars, and 3-column docs.',
  },
];

const activeSizeClass = computed(() => {
  const w = simViewport.value;
  if (w < 720) return sizeClasses[0]!;
  if (w < 1100) return sizeClasses[1]!;
  if (w < 1440) return sizeClasses[2]!;
  return sizeClasses[3]!;
});

function selectSizeClass(c: (typeof sizeClasses)[number]) {
  simViewport.value = c.sampleWidth;
}

// Section 6: High-Level Application Shells
type ArchetypeId = 'sidebar' | 'centered' | 'bars' | 'workspace' | 'split';
type ViewportMode = 'desktop' | 'tablet' | 'mobile';

const activeArchetypeId = ref<ArchetypeId>('workspace');
const viewportMode = ref<ViewportMode>('desktop');

const allShellArchetypes = [
  'sidebar',
  'header-sidebar',
  'dual-nav',
  'adaptive',
  'topnav',
  'ide',
  'copilot',
  'studio / workspace',
  'command-center',
  'split',
  'three-pane',
  'holy-grail',
  'centered',
  'floating-dock',
  'focus',
  'bars',
] as const;

const shellSurfaceVariants = [
  { id: 'flat', label: 'flat', desc: '1px hairline edge-to-edge panes' },
  { id: 'inset', label: 'inset', desc: 'Recessed --j-surface-2 frame + rounded workspace island' },
  { id: 'floating', label: 'floating', desc: 'Independent rounded --j-surface-1 islands on 8px canvas' },
  { id: 'contrast', label: 'contrast', desc: 'Obsidian dark navigation chrome + crisp light/dark stage' },
] as const;

const archetypes: {
  id: ArchetypeId;
  name: string;
  shortName: string;
  attr: string;
  dims: string;
  useCases: string;
  collapseRule: string;
}[] = [
  {
    id: 'sidebar',
    name: 'Sidebar + Content',
    shortName: 'Sidebar',
    attr: 'data-layout="sidebar"',
    dims: '248px Sidebar · 1fr Fluid Canvas',
    useCases: 'SaaS dashboards, admin consoles, documentation portals, settings hubs',
    collapseRule: 'Driven by @container j-shell: off-canvas modal drawer with scrim below 720px.',
  },
  {
    id: 'centered',
    name: 'Content Only / Centered',
    shortName: 'Centered',
    attr: 'data-layout="centered"',
    dims: 'Optional 52px TopBar · 640px / 880px Column',
    useCases: 'Sign-in & onboarding wizards, blog articles, focused checkout or form flows',
    collapseRule: 'Maintains centered max-width column until container shrinks to 16px keyline gutters.',
  },
  {
    id: 'bars',
    name: 'Top Bar + Content + Bottom Bar',
    shortName: 'Top + Bottom Bars',
    attr: 'data-layout="bars"',
    dims: '52px Sticky TopBar · 1fr Body · 60px BottomBar',
    useCases: 'Mobile-first web apps, step wizards with sticky footer CTAs, media/player shells',
    collapseRule: 'Top and bottom bars stay pinned to 100dvh edges; BottomBar adds env(safe-area-inset-bottom).',
  },
  {
    id: 'workspace',
    name: 'Workspace / Studio / IDE',
    shortName: 'Workspace',
    attr: 'data-layout="workspace"',
    dims: '248px Sidebar · 52px TopBar · 1fr Canvas · 320px Aside',
    useCases: 'Design labs, IDE workbenches, AI Copilot sidecars, analytics studios',
    collapseRule: '320px right inspector becomes a slide-over sheet below 960px; sidebar moves off-canvas below 720px.',
  },
  {
    id: 'split',
    name: 'Master–Detail & Three-Pane',
    shortName: 'Master–Detail',
    attr: 'data-layout="split"',
    dims: '60px Rail / 200px Nav · 320px List · 1fr Detail',
    useCases: 'Email & notification inboxes, triage queues, messaging, API log explorers',
    collapseRule: 'Below 720px, activePane="master | detail" drills into a single pane at a time.',
  },
];

const activeArchetype = computed(
  () => archetypes.find((a) => a.id === activeArchetypeId.value) ?? archetypes[0]!,
);

const appShellHref = computed(() => {
  const demo = findDemo('app-shell') ?? findDemo('appshell');
  return href(demo ? demo.slug : 'app-shell');
});

// Section 7: Motion & Tactile Restraint
const tintLit = ref(false);
const motionSwSm = ref(true);
const motionSwMd = ref(true);
const motionSwLg = ref(false);
const motionChkSm = ref(true);
const motionChkMd = ref(true);
const motionChkLg = ref(false);
const motionGlideStop = ref<0 | 1 | 2>(2);
const motionSso = ref(true);
const motionAudit = ref(true);

const glideStops: Array<{ stop: 0 | 1 | 2; label: string; pct: string }> = [
  { stop: 0, label: 'Origin', pct: '0%' },
  { stop: 1, label: 'Midpoint', pct: '50%' },
  { stop: 2, label: 'Target', pct: '100%' },
];

function cycleMotionBench() {
  tintLit.value = !tintLit.value;
  motionSwSm.value = !motionSwSm.value;
  motionSwMd.value = !motionSwMd.value;
  motionSwLg.value = !motionSwLg.value;
  motionChkSm.value = !motionChkSm.value;
  motionChkMd.value = !motionChkMd.value;
  motionChkLg.value = !motionChkLg.value;
  motionGlideStop.value = ((motionGlideStop.value + 1) % 3) as 0 | 1 | 2;
}
</script>

<template>
  <article class="pg-page is-wide pg-ls">
    <header class="pg-page__head">
      <p class="pg-eyebrow">Foundations · Spatial Specification</p>
      <div class="pg-page__title-row">
        <h1 class="pg-page__title">Layout &amp; Spatial System</h1>
        <StatusPill status="stable" />
        <span class="pg-ls-density-pill" title="Live --j-density token">
          <Icon name="ruler" :size="13" />
          <code>--j-density: {{ density.toFixed(2) }}×</code>
        </span>
        <span v-if="open" class="pg-pill is-notes">
          <Icon name="message" :size="12" /> {{ open }} open
        </span>
      </div>
      <p class="pg-page__lede">
        Components are anchored to a <code>4px</code> micro-grid and <code>8px</code> structural rhythm,
        spacing is chosen by semantic relationship, controls and list items lock to canonical heights,
        full-viewport application shells compose cleanly, and tactile motion is governed by weighted zero-overshoot deceleration.
        Adjust <strong>Density</strong> in the top bar (or below) to watch every redline recalculate live.
      </p>

      <nav v-if="sections.length > 1" class="pg-toc" aria-label="Specification sections">
        <button v-for="s in sections" :key="s" class="pg-toc__item" @click="jump(s)">{{ s }}</button>
      </nav>
    </header>

    <div class="pg-demo">
      <!-- ================================================================
           SECTION 1 — BASE GRID & DENSITY MULTIPLIER
      ================================================================= -->
      <DemoSection
        title="1. Base Grid & Density Multiplier"
        description="A 4px micro-grid (--j-space-1) handles optical alignment while an 8px structural grid (--j-space-2) drives layout rhythm — all scaled continuously by --j-density."
      >
        <div class="pg-ls-block">
          <div class="pg-ls-density-bar">
            <div class="pg-ls-density-bar__presets" role="radiogroup" aria-label="Density presets">
              <button
                v-for="preset in densityPresets"
                :key="preset.label"
                type="button"
                role="radio"
                class="pg-ls-preset-btn"
                :aria-checked="Math.abs(density - preset.value) < 0.005"
                @click="prefs.knobs.density = preset.value"
              >
                <span class="pg-ls-preset-btn__top">
                  <strong>{{ preset.label }}</strong>
                  <code>{{ preset.tag }}</code>
                </span>
                <span class="pg-ls-preset-btn__hint">{{ preset.hint }}</span>
              </button>
            </div>

            <div class="pg-ls-density-bar__slider">
              <div class="pg-ls-density-bar__readout">
                <span>Live multiplier <code>--j-density</code></span>
                <div class="pg-ls-density-bar__val">
                  <output>{{ density.toFixed(2) }}×</output>
                  <button
                    type="button"
                    class="pg-btn"
                    data-size="sm"
                    data-variant="ghost"
                    :disabled="density === 1"
                    :style="{ visibility: density === 1 ? 'hidden' : 'visible' }"
                    @click="prefs.knobs.density = 1"
                  >
                    <Icon name="reset" :size="12" /> Reset
                  </button>
                </div>
              </div>
              <input
                v-model.number="prefs.knobs.density"
                class="pg-range"
                type="range"
                min="0.6"
                max="1.25"
                step="0.01"
                aria-label="Density multiplier"
              />
              <div class="pg-ls-density-bar__meta">
                <span>Formula: <code>calc(base × var(--j-density))</code> · Attribute: <code>data-density="compact | default | comfortable"</code></span>
                <span>Coarse pointer floor: <code>--j-hit-min: 44px</code></span>
              </div>
            </div>
          </div>

          <div class="pg-ls-scale" role="table" aria-label="Spatial scale tokens">
            <div class="pg-ls-scale__head" role="row">
              <span role="columnheader">Token</span>
              <span role="columnheader">Base</span>
              <span role="columnheader">Live<span class="pg-muted"> ({{ density.toFixed(2) }}×)</span></span>
              <span role="columnheader">Visual ruler (4px / 8px grid)</span>
              <span role="columnheader">Semantic role</span>
            </div>

            <div
              v-for="s in spaceScale"
              :key="s.token"
              class="pg-ls-scale__row"
              :data-major="s.base % 8 === 0 || undefined"
              role="row"
            >
              <code class="pg-ls-token" role="cell">{{ s.token }}</code>
              <span class="pg-ls-mono pg-muted" role="cell">{{ s.base }}px</span>
              <span class="pg-ls-mono pg-ls-live-px" role="cell">{{ px(s.base) }}</span>
              <div class="pg-ls-scale__track" role="cell">
                <span class="pg-ls-scale__bar" :style="{ width: `var(${s.token})` }" />
                <span class="pg-ls-scale__cap">{{ px(s.base) }}</span>
              </div>
              <span class="pg-ls-scale__note" role="cell">
                <code v-if="s.alias" class="pg-ls-alias">{{ s.alias }}</code>
                {{ s.note }}
              </span>
            </div>
          </div>
        </div>
      </DemoSection>

      <!-- ================================================================
           SECTION 2 — SEMANTIC COMPONENT GAPS
      ================================================================= -->
      <DemoSection
        title="2. Semantic Component Gaps"
        description="Width and height between two components are never arbitrary magic numbers — they are chosen by how closely the two elements belong together."
      >
        <div class="pg-ls-block" :data-redlines="showRedlines">
          <div class="pg-ls-toolbar">
            <div class="pg-ls-toolbar__legend">
              <span class="pg-ls-legend-swatch" aria-hidden="true" />
              <span>Shaded zone = live CSS gap token (scales with <code>--j-density</code>)</span>
            </div>
            <JSwitch v-model="showRedlines" size="sm">Show redline rulers</JSwitch>
          </div>

          <div class="pg-ls-gap-grid">
            <!-- 1. --j-gap-inline -->
            <div class="pg-ls-specimen">
              <div class="pg-ls-specimen__head">
                <div>
                  <div class="pg-ls-specimen__titles">
                    <code>--j-gap-inline</code>
                    <span class="pg-ls-prop-tag">gap="inline"</span>
                  </div>
                  <p class="pg-ls-specimen__desc">Tightly bound peers read as a single unit: icon + label, status dot + text, label + shortcut.</p>
                </div>
                <span class="pg-ls-dim-badge">{{ px(6) }} <small>base 6px</small></span>
              </div>

              <div class="pg-ls-specimen__canvas is-inline-clusters">
                <!-- Button with icon + label -->
                <JButton variant="outline">
                  <span class="pg-ls-inline-demo">
                    <Icon name="sparkle" :size="14" />
                    <span class="pg-ls-gap-h" style="width: var(--j-gap-inline)" :title="px(6)" />
                    <span>Generate</span>
                  </span>
                </JButton>

                <!-- Status dot + text -->
                <span class="pg-ls-status-cluster">
                  <span class="pg-ls-live-dot" />
                  <span class="pg-ls-gap-h" style="width: var(--j-gap-inline)" :title="px(6)" />
                  <span>Systems operational</span>
                </span>

                <!-- Label + JKbd -->
                <span class="pg-ls-kbd-cluster">
                  <span>Quick actions</span>
                  <span class="pg-ls-gap-h" style="width: var(--j-gap-inline)" :title="px(6)" />
                  <JKbd size="sm">⌘K</JKbd>
                </span>
              </div>
            </div>

            <!-- 2. --j-gap-related -->
            <div class="pg-ls-specimen">
              <div class="pg-ls-specimen__head">
                <div>
                  <div class="pg-ls-specimen__titles">
                    <code>--j-gap-related</code>
                    <span class="pg-ls-prop-tag">gap="related"</span>
                  </div>
                  <p class="pg-ls-specimen__desc">Sibling controls in one cluster — the canonical horizontal width between two buttons.</p>
                </div>
                <span class="pg-ls-dim-badge">{{ px(8) }} <small>base 8px</small></span>
              </div>

              <div class="pg-ls-specimen__canvas">
                <div class="pg-ls-measured-row">
                  <JButton variant="outline">Cancel</JButton>
                  <span class="pg-ls-gap-h is-tall" style="width: var(--j-gap-related)" :title="px(8)" />
                  <JButton variant="solid">Save changes</JButton>
                </div>
              </div>
            </div>

            <!-- 3. --j-gap-item -->
            <div class="pg-ls-specimen">
              <div class="pg-ls-specimen__head">
                <div>
                  <div class="pg-ls-specimen__titles">
                    <code>--j-gap-item</code>
                    <span class="pg-ls-prop-tag">gap="item"</span>
                  </div>
                  <p class="pg-ls-specimen__desc">Internal horizontal slot spacing inside a list item, member row, or card header.</p>
                </div>
                <span class="pg-ls-dim-badge">{{ px(12) }} <small>base 12px</small></span>
              </div>

              <div class="pg-ls-specimen__canvas">
                <div class="pg-ls-item-row-box">
                  <JAvatar name="Elena Rostova" size="sm" status="online" />
                  <span class="pg-ls-gap-h is-tall" style="width: var(--j-gap-item)" :title="px(12)" />
                  <div class="pg-ls-item-row-box__text">
                    <strong>Elena Rostova</strong>
                    <span>Design Systems Lead</span>
                  </div>
                  <span class="pg-ls-gap-h is-tall" style="width: var(--j-gap-item)" :title="px(12)" />
                  <JBadge tone="success" dot>Active</JBadge>
                </div>
              </div>
            </div>

            <!-- 4. --j-gap-field -->
            <div class="pg-ls-specimen">
              <div class="pg-ls-specimen__head">
                <div>
                  <div class="pg-ls-specimen__titles">
                    <code>--j-gap-field</code>
                    <span class="pg-ls-prop-tag">gap="field"</span>
                  </div>
                  <p class="pg-ls-specimen__desc">Vertical rhythm between stacked form fields so labels clearly bind to their own input.</p>
                </div>
                <span class="pg-ls-dim-badge">{{ px(16) }} <small>base 16px</small></span>
              </div>

              <div class="pg-ls-specimen__canvas is-stretch">
                <div class="pg-ls-measured-col">
                  <JField label="Workspace name">
                    <JInput v-model="fieldWorkspace" />
                  </JField>
                  <div class="pg-ls-gap-v" style="height: var(--j-gap-field)">
                    <span class="pg-ls-callout">{{ px(16) }}</span>
                  </div>
                  <JField label="URL namespace" hint="Used in shareable preview links.">
                    <JInput v-model="fieldSlug">
                      <template #prefix>studio.app/</template>
                    </JInput>
                  </JField>
                </div>
              </div>
            </div>

            <!-- 5. --j-gap-group -->
            <div class="pg-ls-specimen is-span-2">
              <div class="pg-ls-specimen__head">
                <div>
                  <div class="pg-ls-specimen__titles">
                    <code>--j-gap-group</code>
                    <span class="pg-ls-prop-tag">gap="group"</span>
                  </div>
                  <p class="pg-ls-specimen__desc">Gutter between distinct <code>JCard</code> surfaces in a multi-column grid or separate sub-groups.</p>
                </div>
                <span class="pg-ls-dim-badge">{{ px(24) }} <small>base 24px</small></span>
              </div>

              <div class="pg-ls-specimen__canvas is-stretch">
                <div class="pg-ls-card-pair">
                  <JCard title="Spatial tokens" description="13 grid steps + 6 relationship gaps">
                    <div class="pg-ls-card-metric">
                      <strong>100%</strong>
                      <span>Driven by <code>--j-density</code></span>
                    </div>
                  </JCard>

                  <div class="pg-ls-gap-h is-card-gutter" style="width: var(--j-gap-group)" :title="px(24)" />

                  <JCard title="Shell primitives" description="16 archetypes × 4 surface variants">
                    <div class="pg-ls-card-metric">
                      <strong>0 px</strong>
                      <span>Hardcoded magic margins</span>
                    </div>
                  </JCard>
                </div>
              </div>
            </div>

            <!-- 6. --j-gap-section -->
            <div class="pg-ls-specimen is-span-2">
              <div class="pg-ls-specimen__head">
                <div>
                  <div class="pg-ls-specimen__titles">
                    <code>--j-gap-section</code>
                    <span class="pg-ls-prop-tag">gap="section"</span>
                  </div>
                  <p class="pg-ls-specimen__desc">Major vertical breathing room separating independent topic sections on a page.</p>
                </div>
                <span class="pg-ls-dim-badge">{{ px(40) }} <small>base 40px</small></span>
              </div>

              <div class="pg-ls-specimen__canvas is-stretch">
                <div class="pg-ls-measured-col">
                  <div class="pg-ls-mini-section">
                    <div>
                      <strong>Section A · Profile &amp; Identity</strong>
                      <p>Display name, avatar, and public handle visible across workspaces.</p>
                    </div>
                    <JButton size="sm" variant="outline">Edit profile</JButton>
                  </div>

                  <div class="pg-ls-gap-v" style="height: var(--j-gap-section)">
                    <span class="pg-ls-callout">{{ px(40) }} · section break</span>
                  </div>

                  <div class="pg-ls-mini-section">
                    <div>
                      <strong>Section B · Security &amp; Passkeys</strong>
                      <p>Hardware security keys, active sessions, and two-factor verification.</p>
                    </div>
                    <JBadge tone="info">2 passkeys</JBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DemoSection>

      <!-- ================================================================
           SECTION 3 — CANONICAL HEIGHTS: CONTROLS, LIST ITEMS & BARS
      ================================================================= -->
      <DemoSection
        title="3. Canonical Heights: Controls, List Items & Bars"
        description="Controls, list rows, and chrome bars lock to deterministic height tiers so buttons match inputs and list rows establish crisp horizontal and vertical keylines."
      >
        <div class="pg-ls-block" :data-redlines="showHeightRedlines">
          <div class="pg-ls-toolbar">
            <div class="pg-ls-toolbar__legend">
              <span class="pg-ls-legend-swatch" aria-hidden="true" />
              <span>Controls &amp; list heights scale with density; application chrome stays rock-steady in px.</span>
            </div>
            <div class="pg-ls-toolbar__switches">
              <JSwitch v-model="insetDivider" size="sm">Keyline inset divider</JSwitch>
              <JSwitch v-model="showHeightRedlines" size="sm">Show height rulers</JSwitch>
            </div>
          </div>

          <!-- Part A: Control Heights -->
          <div class="pg-ls-subblock">
            <div class="pg-ls-subblock__head">
              <h4>Control Height Tiers &amp; Coarse-Pointer Floor</h4>
              <span>Buttons and inputs of the same <code>size</code> share identical outer box heights.</span>
            </div>

            <div class="pg-ls-controls-stage">
              <div v-for="tier in controlTiers" :key="tier.token" class="pg-ls-control-col">
                <div class="pg-ls-control-col__specimen">
                  <div class="pg-ls-v-ruler" :style="{ height: `var(${tier.token})` }">
                    <span>{{ px(tier.base) }}</span>
                  </div>
                  <div class="pg-ls-control-pair">
                    <JButton :size="tier.size" variant="solid">{{ tier.size.toUpperCase() }}</JButton>
                    <JInput :size="tier.size" :model-value="`${px(tier.base)} control`" readonly />
                  </div>
                </div>
                <div class="pg-ls-control-col__meta">
                  <code>{{ tier.token }}</code>
                  <strong>{{ tier.label }} · {{ px(tier.base) }} <small>(base {{ tier.base }}px)</small></strong>
                  <p>{{ tier.usage }}</p>
                </div>
              </div>

              <!-- Touch target 44px -->
              <div class="pg-ls-control-col is-touch">
                <div class="pg-ls-control-col__specimen">
                  <div class="pg-ls-v-ruler is-fixed" style="height: 44px">
                    <span>44px</span>
                  </div>
                  <div class="pg-ls-touch-target">
                    <JButton size="sm" variant="outline">Tap target</JButton>
                    <span class="pg-ls-touch-target__label">44×44 hit area</span>
                  </div>
                </div>
                <div class="pg-ls-control-col__meta">
                  <code>--j-hit-min</code>
                  <strong>Touch Minimum · 44px <small>(unscaled floor)</small></strong>
                  <p>On <code>pointer: coarse</code> devices, interactive hit targets never shrink below 44px.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Part B: List Item Anatomy & Canonical Heights -->
          <div class="pg-ls-subblock">
            <div class="pg-ls-subblock__head">
              <h4>List Item Anatomy &amp; Canonical Row Heights (<code>32 / 44 / 60 / 76px</code>)</h4>
              <span>
                Padding <code>--j-list-px: {{ px(12) }}</code> · Slot gap <code>--j-list-gap: {{ px(12) }}</code> ·
                Keyline divider indent <code>{{ px(40) }} + {{ px(12) }} = {{ keylineOffsetPx }}px</code>
              </span>
            </div>

            <div class="pg-ls-list-showcase" :data-inset="insetDivider">
              <!-- Anatomy Top Keyline Header -->
              <div v-if="showHeightRedlines" class="pg-ls-list-anatomy-bar" aria-hidden="true">
                <span class="pg-ls-anat-pad" :style="{ width: 'var(--j-list-px)' }" />
                <span class="pg-ls-anat-lead">{{ px(28) }}</span>
                <span class="pg-ls-anat-gap" :style="{ width: 'var(--j-list-gap)' }" />
                <span class="pg-ls-anat-text">
                  ← Keyline start: <code>px ({{ px(12) }}) + slot ({{ px(28) }}) + gap ({{ px(12) }}) = {{ keylineOffsetPx }}px</code>
                </span>
                <span class="pg-ls-anat-pad" :style="{ width: 'var(--j-list-px)' }" />
              </div>

              <!-- 1. Compact (32px) -->
              <div
                class="pg-ls-list-row is-compact"
                :data-active="activeListRow === 'compact'"
                @click="activeListRow = 'compact'"
              >
                <span class="pg-ls-pad-guide is-left" />
                <span class="pg-ls-lead-slot">
                  <Icon name="layout" :size="15" />
                </span>
                <span class="pg-ls-slot-guide" />
                <div class="pg-ls-list-row__body">
                  <span class="pg-ls-list-row__title">Compact navigation / command item</span>
                </div>
                <span class="pg-ls-slot-guide" />
                <div class="pg-ls-list-row__trail">
                  <code class="pg-ls-row-token">--j-list-h-compact</code>
                  <JKbd size="sm">⌘1</JKbd>
                </div>
                <span class="pg-ls-pad-guide is-right" />
                <span class="pg-ls-row-height-pill">{{ px(32) }}</span>
              </div>

              <!-- 2. 1-Line (44px) -->
              <div
                class="pg-ls-list-row is-1line"
                :data-active="activeListRow === '1'"
                @click="activeListRow = '1'"
              >
                <span class="pg-ls-pad-guide is-left" />
                <span class="pg-ls-lead-slot">
                  <JAvatar name="Mina Park" size="xs" />
                </span>
                <span class="pg-ls-slot-guide" />
                <div class="pg-ls-list-row__body">
                  <span class="pg-ls-list-row__title">1-Line row · Single label with leading avatar &amp; trailing switch</span>
                </div>
                <span class="pg-ls-slot-guide" />
                <div class="pg-ls-list-row__trail" @click.stop>
                  <code class="pg-ls-row-token">--j-list-h-1</code>
                  <JSwitch v-model="listNotifyToggle" size="sm" aria-label="Enable notifications" />
                </div>
                <span class="pg-ls-pad-guide is-right" />
                <span class="pg-ls-row-height-pill">{{ px(44) }}</span>
              </div>

              <!-- 3. 2-Line (60px) -->
              <div
                class="pg-ls-list-row is-2line"
                :data-active="activeListRow === '2'"
                @click="activeListRow = '2'"
              >
                <span class="pg-ls-pad-guide is-left" />
                <span class="pg-ls-lead-slot">
                  <JAvatar name="Devon Brooks" size="sm" tone="info" />
                </span>
                <span class="pg-ls-slot-guide" />
                <div class="pg-ls-list-row__body">
                  <span class="pg-ls-list-row__title">2-Line row · Production API Gateway</span>
                  <span class="pg-ls-list-row__sub">Primary title + 1-line secondary metadata description</span>
                </div>
                <span class="pg-ls-slot-guide" />
                <div class="pg-ls-list-row__trail">
                  <code class="pg-ls-row-token">--j-list-h-2</code>
                  <JBadge tone="success" size="sm" dot>Healthy</JBadge>
                </div>
                <span class="pg-ls-pad-guide is-right" />
                <span class="pg-ls-row-height-pill">{{ px(60) }}</span>
              </div>

              <!-- 4. 3-Line (76px) -->
              <div
                class="pg-ls-list-row is-3line"
                :data-active="activeListRow === '3'"
                @click="activeListRow = '3'"
              >
                <span class="pg-ls-pad-guide is-left" />
                <span class="pg-ls-lead-slot is-top">
                  <JAvatar name="Sora Takahashi" size="sm" status="online" />
                </span>
                <span class="pg-ls-slot-guide" />
                <div class="pg-ls-list-row__body">
                  <span class="pg-ls-list-row__title">3-Line row · Spatial specification sign-off</span>
                  <span class="pg-ls-list-row__sub is-clamp-2">
                    Inbox &amp; activity feeds lock to {{ px(76) }} so two-line message previews never cause uneven vertical rhythm, while keyline dividers keep avatars uncluttered.
                  </span>
                </div>
                <span class="pg-ls-slot-guide" />
                <div class="pg-ls-list-row__trail is-top">
                  <code class="pg-ls-row-token">--j-list-h-3</code>
                  <span class="pg-ls-time">2m ago</span>
                </div>
                <span class="pg-ls-pad-guide is-right" />
                <span class="pg-ls-row-height-pill">{{ px(76) }}</span>
              </div>
            </div>
          </div>

          <!-- Part C: Application Chrome Bars -->
          <div class="pg-ls-subblock">
            <div class="pg-ls-subblock__head">
              <h4>Application Chrome Bars &amp; Pane Widths (Unscaled Structural Tokens)</h4>
              <span>Shell chrome stays fixed in px so toggling compact/roomy content density never shifts global navigation.</span>
            </div>

            <div class="pg-ls-chrome-grid">
              <div v-for="bar in chromeBars" :key="bar.token" class="pg-ls-chrome-card">
                <div class="pg-ls-chrome-bar-preview" :style="{ height: `${bar.px}px` }">
                  <strong>{{ bar.name }}</strong>
                  <span class="pg-ls-dim-badge is-solid">{{ bar.px }}px</span>
                </div>
                <code>{{ bar.token }}</code>
                <p>{{ bar.role }}</p>
              </div>
            </div>

            <div class="pg-ls-pane-pills">
              <span><code>--j-sidebar-rail-w</code> <strong>60px</strong> collapsed rail</span>
              <span><code>--j-sidebar-w</code> <strong>248px</strong> expanded sidebar</span>
              <span><code>--j-split-master-w</code> <strong>320px</strong> master list pane</span>
              <span><code>--j-aside-w</code> <strong>320px</strong> right inspector</span>
            </div>
          </div>
        </div>
      </DemoSection>

      <!-- ================================================================
           SECTION 4 — CONTENT CONTAINERS, READING MEASURE & KEYLINES
      ================================================================= -->
      <DemoSection
        title="4. Content Containers, Reading Measure & Keylines"
        description="Concentric container widths cap line length and prevent wide monitors from stretching forms or prose across 2000 pixels."
      >
        <div class="pg-ls-block">
          <div class="pg-ls-container-tabs" role="tablist" aria-label="Container tiers">
            <button
              v-for="c in containers"
              :key="c.key"
              type="button"
              role="tab"
              class="pg-ls-container-tab"
              :aria-selected="activeContainer === c.key"
              @click="activeContainer = c.key"
            >
              <code>{{ c.key }}</code>
              <span>{{ c.size }}</span>
            </button>
          </div>

          <!-- Proportional Blueprint Diagram -->
          <div class="pg-ls-blueprint-frame">
            <div class="pg-ls-gutter-band is-left" title="--j-page-gutter: clamp(16px, 4vw, 40px)">
              <span>gutter<br />16→40px</span>
            </div>

            <div class="pg-ls-blueprint-stage">
              <div class="pg-ls-blueprint-py">
                <span><code>--j-page-py</code> · {{ px(28) }} top / bottom canvas breathing room</span>
              </div>

              <div class="pg-ls-concentric-stack">
                <button
                  v-for="c in containers"
                  :key="c.key"
                  type="button"
                  class="pg-ls-concentric-bar"
                  :data-active="activeContainer === c.key"
                  :style="{ width: `${c.ratioPct}%` }"
                  @click="activeContainer = c.key"
                >
                  <span class="pg-ls-concentric-bar__token">{{ c.token }}</span>
                  <span class="pg-ls-concentric-bar__size">{{ c.size }}</span>
                </button>
              </div>

              <div class="pg-ls-selected-container-detail">
                <div>
                  <span class="pg-eyebrow">Selected container</span>
                  <h4><code>{{ selectedContainer.token }}</code> — {{ selectedContainer.size }}</h4>
                  <p>{{ selectedContainer.usage }}</p>
                </div>
                <div class="pg-ls-selected-container-detail__right">
                  <span class="pg-muted">Typical views</span>
                  <strong>{{ selectedContainer.examples }}</strong>
                </div>
              </div>
            </div>

            <div class="pg-ls-gutter-band is-right" title="--j-page-gutter: clamp(16px, 4vw, 40px)">
              <span>gutter<br />16→40px</span>
            </div>
          </div>

          <!-- Token Reference Table -->
          <div class="pg-ls-table-wrap">
            <table class="pg-ls-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Scaling behavior</th>
                  <th>Where to apply</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in containers"
                  :key="c.token"
                  :data-highlight="activeContainer === c.key || undefined"
                  @click="activeContainer = c.key"
                >
                  <td><code>{{ c.token }}</code></td>
                  <td class="pg-ls-mono"><strong>{{ c.size }}</strong></td>
                  <td>Character / viewport max-width</td>
                  <td>{{ c.examples }}</td>
                </tr>
                <tr>
                  <td><code>--j-page-gutter</code></td>
                  <td class="pg-ls-mono"><strong>clamp(16px, 4vw, 40px)</strong></td>
                  <td><code>16px → 24px → 32px → 40px</code> keylines</td>
                  <td>Left &amp; right horizontal padding on every page container</td>
                </tr>
                <tr>
                  <td><code>--j-page-py</code></td>
                  <td class="pg-ls-mono"><strong>{{ px(28) }}</strong> <span class="pg-muted">(28px × density)</span></td>
                  <td>Scales with <code>--j-density</code></td>
                  <td>Top and bottom vertical padding inside scrollable main panes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DemoSection>

      <!-- ================================================================
           SECTION 5 — CONTAINER-QUERY WINDOW SIZE CLASSES
      ================================================================= -->
      <DemoSection
        title="5. Container-Query Window Size Classes"
        description="Four @container j-shell window classes (< 720px Compact, 720–1099px Medium, 1100–1439px Expanded, ≥ 1440px Large) govern page gutters (16→40px), grid columns (1→4), and how navigation chrome adapts whether full-viewport or embedded."
      >
        <div class="pg-ls-block">
          <!-- Interactive Viewport Slider + Class Buttons -->
          <div class="pg-ls-vp-controls">
            <div class="pg-ls-vp-controls__top">
              <div class="pg-segmented" role="tablist" aria-label="Window size classes">
                <button
                  v-for="sc in sizeClasses"
                  :key="sc.id"
                  type="button"
                  role="tab"
                  :aria-checked="activeSizeClass.id === sc.id"
                  @click="selectSizeClass(sc)"
                >
                  {{ sc.name }}
                </button>
              </div>
              <div class="pg-ls-vp-readout">
                <span>Simulated viewport:</span>
                <strong>{{ simViewport }}px</strong>
                <JBadge tone="accent" size="sm">{{ activeSizeClass.name }} ({{ activeSizeClass.range }})</JBadge>
              </div>
            </div>

            <input
              v-model.number="simViewport"
              class="pg-range"
              type="range"
              min="360"
              max="1680"
              step="4"
              aria-label="Simulated viewport width in pixels"
            />
            <div class="pg-ls-vp-ticks">
              <span>360px</span>
              <span>720px (Medium)</span>
              <span>1100px (Expanded)</span>
              <span>1440px (Large)</span>
              <span>1680px</span>
            </div>
          </div>

          <!-- Live Adaptive Preview Stage -->
          <div class="pg-ls-adaptive-stage-outer">
            <div
              class="pg-ls-adaptive-frame"
              :data-class="activeSizeClass.id"
              :style="{ width: `${Math.min(100, Math.max(28, (simViewport / 1680) * 100))}%` }"
            >
              <!-- Left Sidebar or Rail -->
              <aside v-if="activeSizeClass.id === 'medium'" class="pg-ls-af-rail">
                <span class="pg-ls-af-pill">60px</span>
                <i /><i /><i />
              </aside>
              <aside v-else-if="activeSizeClass.id === 'expanded' || activeSizeClass.id === 'large'" class="pg-ls-af-sidebar">
                <div class="pg-ls-af-head">
                  <strong>Sidebar</strong>
                  <span class="pg-ls-af-pill">248px</span>
                </div>
                <i /><i /><i /><i />
              </aside>

              <!-- Center Column -->
              <div class="pg-ls-af-center">
                <header class="pg-ls-af-topbar">
                  <span>TopBar · 52px</span>
                  <span>Gutter: <strong>{{ activeSizeClass.gutter }}px</strong> · {{ activeSizeClass.columns }} col{{ activeSizeClass.columns > 1 ? 's' : '' }}</span>
                </header>

                <div
                  class="pg-ls-af-body"
                  :style="{
                    paddingInline: `${activeSizeClass.gutter * 0.65}px`,
                    gridTemplateColumns: `repeat(${activeSizeClass.columns}, minmax(0, 1fr))`,
                  }"
                >
                  <div v-for="n in activeSizeClass.columns * 2" :key="n" class="pg-ls-af-card">
                    <span>Col {{ ((n - 1) % activeSizeClass.columns) + 1 }}</span>
                  </div>
                </div>

                <footer v-if="activeSizeClass.id === 'compact'" class="pg-ls-af-bottombar">
                  <span>BottomBar · 60px (+ safe-area) · Off-canvas Drawer</span>
                </footer>
              </div>

              <!-- Optional Right Inspector on Large -->
              <aside v-if="activeSizeClass.id === 'large'" class="pg-ls-af-aside">
                <div class="pg-ls-af-head">
                  <strong>Inspector</strong>
                  <span class="pg-ls-af-pill">320px</span>
                </div>
                <i /><i /><i />
              </aside>
            </div>
          </div>

          <!-- 4-Column Spec Matrix -->
          <div class="pg-ls-class-matrix">
            <button
              v-for="sc in sizeClasses"
              :key="sc.id"
              type="button"
              class="pg-ls-class-card"
              :data-active="activeSizeClass.id === sc.id"
              @click="selectSizeClass(sc)"
            >
              <div class="pg-ls-class-card__top">
                <strong>{{ sc.name }}</strong>
                <code>{{ sc.range }}</code>
              </div>
              <dl class="pg-ls-class-card__specs">
                <div><dt>Gutter</dt><dd>{{ sc.gutter }}px</dd></div>
                <div><dt>Grid</dt><dd>{{ sc.columns }} {{ sc.columns === 1 ? 'column' : 'columns' }}</dd></div>
                <div><dt>Panes</dt><dd>{{ sc.panes }}</dd></div>
              </dl>
              <p class="pg-ls-class-card__desc">{{ sc.summary }}</p>
            </button>
          </div>
        </div>
      </DemoSection>

      <!-- ================================================================
           SECTION 6 — HIGH-LEVEL APPLICATION SHELLS (16 ARCHETYPES × 4 VARIANTS)
      ================================================================= -->
      <DemoSection
        title="6. High-Level Application Shells (16 Archetypes × 4 Variants)"
        description="JAppShell provides 16 container-query shell archetypes and 4 surface treatments (flat, inset, floating, contrast). Inspect 5 core structural blueprints below, or test all 16 × 4 combinations live in the AppShell Lab."
      >
        <div class="pg-ls-block">
          <div class="pg-ls-arch-controls">
            <div class="pg-ls-arch-tabs" role="tablist" aria-label="Page layout archetypes">
              <button
                v-for="(arch, idx) in archetypes"
                :key="arch.id"
                type="button"
                role="tab"
                class="pg-ls-arch-tab"
                :aria-selected="activeArchetypeId === arch.id"
                @click="activeArchetypeId = arch.id"
              >
                <span class="pg-ls-arch-tab__num">{{ idx + 1 }}</span>
                <span>{{ arch.shortName }}</span>
              </button>
            </div>

            <div class="pg-segmented" role="radiogroup" aria-label="Viewport mode">
              <button
                type="button"
                role="radio"
                :aria-checked="viewportMode === 'desktop'"
                @click="viewportMode = 'desktop'"
              >
                <Icon name="monitor" :size="13" /> Desktop
              </button>
              <button
                type="button"
                role="radio"
                :aria-checked="viewportMode === 'tablet'"
                @click="viewportMode = 'tablet'"
              >
                <Icon name="tablet" :size="13" /> Tablet
              </button>
              <button
                type="button"
                role="radio"
                :aria-checked="viewportMode === 'mobile'"
                @click="viewportMode = 'mobile'"
              >
                <Icon name="smartphone" :size="13" /> Mobile
              </button>
            </div>
          </div>

          <!-- Interactive Miniature App Wireframe -->
          <div class="pg-ls-wireframe-stage">
            <div
              class="pg-ls-device"
              :data-archetype="activeArchetypeId"
              :data-viewport="viewportMode"
            >
              <!-- Browser / Device Window Header -->
              <div class="pg-ls-device__chrome">
                <div class="pg-ls-device__dots"><span /><span /><span /></div>
                <code class="pg-ls-device__attr">&lt;JAppShell {{ activeArchetype.attr }}&gt;</code>
                <span class="pg-ls-device__vp-tag">
                  {{ viewportMode === 'desktop' ? '1440px Desktop' : viewportMode === 'tablet' ? '834px Tablet' : '390px Mobile' }}
                </span>
              </div>

              <!-- 1. SIDEBAR + CONTENT -->
              <div v-if="activeArchetypeId === 'sidebar'" class="pg-ls-wf is-sidebar">
                <aside v-if="viewportMode === 'desktop'" class="pg-ls-wf-pane is-sidebar">
                  <div class="pg-ls-wf-label"><strong>Sidebar</strong><code>248px</code></div>
                  <div class="pg-ls-wf-nav-lines"><span class="is-on" /><span /><span /><span /></div>
                </aside>
                <aside v-else-if="viewportMode === 'tablet'" class="pg-ls-wf-pane is-rail">
                  <code>60px</code>
                  <i class="is-on" /><i /><i />
                </aside>

                <div class="pg-ls-wf-col">
                  <header class="pg-ls-wf-bar is-top">
                    <span>{{ viewportMode === 'mobile' ? '☰ Off-canvas Drawer · TopBar' : 'TopBar (optional)' }}</span>
                    <code>52px</code>
                  </header>
                  <div class="pg-ls-wf-main">
                    <div class="pg-ls-wf-label">
                      <strong>Fluid Main Canvas</strong>
                      <code>1fr · py {{ px(28) }} · container-lg (1160px)</code>
                    </div>
                    <div class="pg-ls-wf-cards" :data-cols="viewportMode === 'mobile' ? 1 : 3">
                      <div /><div /><div />
                    </div>
                    <div class="pg-ls-wf-sheet" />
                  </div>
                </div>
              </div>

              <!-- 2. CONTENT ONLY / CENTERED -->
              <div v-else-if="activeArchetypeId === 'centered'" class="pg-ls-wf is-centered">
                <header class="pg-ls-wf-bar is-top">
                  <span>Minimal TopBar</span>
                  <code>52px</code>
                </header>
                <div class="pg-ls-wf-main is-centered-canvas">
                  <div class="pg-ls-wf-centered-col">
                    <div class="pg-ls-wf-label">
                      <strong>Centered Container</strong>
                      <code>{{ viewportMode === 'mobile' ? '100% (16px gutters)' : '640px sm / 880px md' }}</code>
                    </div>
                    <div class="pg-ls-wf-prose-lines">
                      <span class="is-title" />
                      <span />
                      <span class="is-short" />
                    </div>
                    <div class="pg-ls-wf-form-mock">
                      <div /><div />
                      <span class="pg-ls-wf-cta-pill">Continue →</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. TOP BAR + CONTENT + BOTTOM BAR -->
              <div v-else-if="activeArchetypeId === 'bars'" class="pg-ls-wf is-bars">
                <header class="pg-ls-wf-bar is-top">
                  <span>Sticky TopBar</span>
                  <code>52px</code>
                </header>
                <div class="pg-ls-wf-bar is-sub">
                  <span>Optional SubBar (Filters / Steps)</span>
                  <code>40px</code>
                </div>
                <div class="pg-ls-wf-main">
                  <div class="pg-ls-wf-label">
                    <strong>Scrollable Viewport Body</strong>
                    <code>flex: 1 · overflow-y: auto</code>
                  </div>
                  <div class="pg-ls-wf-list-mock">
                    <div /><div /><div />
                  </div>
                </div>
                <footer class="pg-ls-wf-bar is-bottom">
                  <span>Sticky BottomBar (Tab Nav / Checkout Actions)</span>
                  <code>60px + safe-area</code>
                </footer>
              </div>

              <!-- 4. WORKSPACE / HOLY GRAIL -->
              <div v-else-if="activeArchetypeId === 'workspace'" class="pg-ls-wf is-workspace">
                <aside v-if="viewportMode === 'desktop'" class="pg-ls-wf-pane is-sidebar">
                  <div class="pg-ls-wf-label"><strong>Sidebar</strong><code>248px</code></div>
                  <div class="pg-ls-wf-nav-lines"><span class="is-on" /><span /><span /><span /></div>
                </aside>
                <aside v-else-if="viewportMode === 'tablet'" class="pg-ls-wf-pane is-rail">
                  <code>60px</code>
                  <i class="is-on" /><i /><i />
                </aside>

                <div class="pg-ls-wf-col">
                  <header class="pg-ls-wf-bar is-top">
                    <span>{{ viewportMode === 'mobile' ? '☰ Drawer · Workspace TopBar · Inspector Sheet' : 'Sticky TopBar' }}</span>
                    <code>52px</code>
                  </header>
                  <div class="pg-ls-wf-workspace-body">
                    <div class="pg-ls-wf-main">
                      <div class="pg-ls-wf-label">
                        <strong>Fluid Canvas</strong>
                        <code>minmax(0, 1fr)</code>
                      </div>
                      <div class="pg-ls-wf-cards" :data-cols="viewportMode === 'mobile' ? 1 : 2">
                        <div /><div />
                      </div>
                      <div class="pg-ls-wf-sheet" />
                    </div>

                    <aside v-if="viewportMode === 'desktop'" class="pg-ls-wf-pane is-aside">
                      <div class="pg-ls-wf-label"><strong>Right Inspector</strong><code>320px</code></div>
                      <div class="pg-ls-wf-inspector-blocks"><div /><div /><div /></div>
                    </aside>
                  </div>
                  <footer v-if="viewportMode === 'mobile'" class="pg-ls-wf-bar is-bottom">
                    <span>Bottom Action / Tab Bar</span>
                    <code>60px</code>
                  </footer>
                </div>
              </div>

              <!-- 5. MASTER–DETAIL SPLIT -->
              <div v-else class="pg-ls-wf is-split">
                <aside v-if="viewportMode === 'desktop'" class="pg-ls-wf-pane is-rail">
                  <code>60px</code>
                  <i class="is-on" /><i /><i />
                </aside>
                <aside v-else-if="viewportMode === 'tablet'" class="pg-ls-wf-pane is-rail">
                  <code>60px</code>
                  <i class="is-on" /><i /><i />
                </aside>

                <!-- Master List Pane -->
                <section class="pg-ls-wf-pane is-master">
                  <div class="pg-ls-wf-label">
                    <strong>Master List</strong>
                    <code>{{ viewportMode === 'mobile' ? '100% pane (drills into detail)' : '320px scrollable' }}</code>
                  </div>
                  <div class="pg-ls-wf-master-rows">
                    <div class="is-selected"><span>60px 2-line item</span></div>
                    <div><span>60px 2-line item</span></div>
                    <div><span>60px 2-line item</span></div>
                    <div><span>60px 2-line item</span></div>
                  </div>
                </section>

                <!-- Detail Pane (hidden on mobile where master pushes detail) -->
                <div v-if="viewportMode !== 'mobile'" class="pg-ls-wf-col">
                  <header class="pg-ls-wf-bar is-top">
                    <span>Detail Header</span>
                    <code>52px</code>
                  </header>
                  <div class="pg-ls-wf-main">
                    <div class="pg-ls-wf-label">
                      <strong>Fluid Detail Pane</strong>
                      <code>1fr · independent scroll</code>
                    </div>
                    <div class="pg-ls-wf-prose-lines">
                      <span class="is-title" />
                      <span />
                      <span class="is-short" />
                    </div>
                    <div class="pg-ls-wf-sheet" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- All 16 JAppShell Archetypes × 4 Surface Variants Summary -->
          <div class="pg-ls-subblock">
            <div class="pg-ls-subblock__head">
              <h4>All 16 <code>JAppShell</code> Archetypes &amp; 4 Surface Variants</h4>
              <a class="pg-btn" data-variant="solid" data-size="sm" :href="appShellHref">
                Open Interactive AppShell Lab (16 × 4) <Icon name="arrow" :size="13" />
              </a>
            </div>
            <div class="pg-ls-pane-pills">
              <span v-for="v in shellSurfaceVariants" :key="v.id">
                <code>variant="{{ v.label }}"</code> {{ v.desc }}
              </span>
            </div>
            <div class="pg-ls-pane-pills">
              <span v-for="layoutId in allShellArchetypes" :key="layoutId">
                <code>{{ layoutId }}</code>
              </span>
            </div>
          </div>

          <!-- Archetype Specification Footer & Links to #/screens and #/app-shell -->
          <div class="pg-ls-arch-footer">
            <div class="pg-ls-arch-footer__info">
              <div class="pg-ls-arch-footer__title">
                <h4>{{ activeArchetype.name }}</h4>
                <code>{{ activeArchetype.attr }}</code>
                <span class="pg-ls-dim-badge">{{ activeArchetype.dims }}</span>
              </div>
              <p><strong>Best for:</strong> {{ activeArchetype.useCases }}</p>
              <p class="pg-muted"><strong>Adaptive behavior:</strong> {{ activeArchetype.collapseRule }}</p>
            </div>
            <div class="pg-ls-arch-footer__actions">
              <a class="pg-btn" data-variant="solid" :href="appShellHref">
                AppShell Lab (16 × 4) <Icon name="arrow" :size="14" />
              </a>
              <a class="pg-btn" data-variant="outline" :href="href('screens')">
                Explore all 18 canonical screen architectures →
              </a>
            </div>
          </div>
        </div>
      </DemoSection>

      <!-- ================================================================
           SECTION 7 — MOTION & TACTILE RESTRAINT
      ================================================================= -->
      <DemoSection
        title="7. Motion & Tactile Restraint"
        description="Weighted, damped deceleration (cubic-bezier(0.16, 1, 0.3, 1)) with 0% overshoot — switches, checkboxes, and shells glide like precision hardware, never bouncy toys."
      >
        <div class="pg-ls-block">
          <div class="pg-ls-toolbar">
            <div class="pg-ls-toolbar__legend">
              <span class="pg-ls-live-dot" aria-hidden="true" />
              <span>
                <strong>0% overshoot policy:</strong> no spring bounce, no thumb stretching, no button scale squishing.
                Collapses to <code>0ms</code> under <code>prefers-reduced-motion</code>.
              </span>
            </div>
            <JButton size="sm" variant="outline" tone="neutral" @click="cycleMotionBench">
              Cycle all specimens
            </JButton>
          </div>

          <!-- 3 Calibrated Motion Tiers -->
          <div class="pg-ls-motion-tiers">
            <!-- Tier 1: 150ms Surface Tint -->
            <div class="pg-ls-motion-card">
              <div class="pg-ls-motion-card__head">
                <div class="pg-ls-motion-card__top">
                  <h4>1 · Surface Tint</h4>
                  <span class="pg-ls-dim-badge is-solid">150ms</span>
                </div>
                <div class="pg-ls-motion-card__curve">
                  <code>--j-duration-fast</code> · <code>--j-ease-out</code>
                </div>
                <p class="pg-ls-motion-card__desc">
                  Hover, focus, and hairline transitions shift color calmly on plane — zero <code>translateY</code> jumps or scale hops.
                </p>
              </div>

              <button
                type="button"
                class="pg-ls-tint-pad"
                :data-lit="tintLit"
                @click="tintLit = !tintLit"
              >
                <span>Hover or click to toggle surface tint</span>
                <code>150ms</code>
              </button>
            </div>

            <!-- Tier 2: 220ms Tactile State Settle -->
            <div class="pg-ls-motion-card">
              <div class="pg-ls-motion-card__head">
                <div class="pg-ls-motion-card__top">
                  <h4>2 · Tactile State Settle</h4>
                  <span class="pg-ls-dim-badge is-solid">220ms</span>
                </div>
                <div class="pg-ls-motion-card__curve">
                  <code>--j-duration</code> · <code>cubic-bezier(0.16, 1, 0.3, 1)</code>
                </div>
                <p class="pg-ls-motion-card__desc">
                  Binary switches and selection marks travel at a measured, composed cadence without rubbery distortion.
                </p>
              </div>

              <div class="pg-ls-tactile-matrix">
                <div class="pg-ls-tactile-row">
                  <span class="pg-ls-tactile-row__label">JSwitch (sm · md · lg)</span>
                  <div class="pg-ls-tactile-row__controls">
                    <JSwitch v-model="motionSwSm" size="sm" aria-label="Small switch specimen" />
                    <JSwitch v-model="motionSwMd" aria-label="Default switch specimen" />
                    <JSwitch v-model="motionSwLg" size="lg" aria-label="Large switch specimen" />
                  </div>
                </div>
                <div class="pg-ls-tactile-row">
                  <span class="pg-ls-tactile-row__label">JCheckbox (sm · md · lg)</span>
                  <div class="pg-ls-tactile-row__controls">
                    <JCheckbox v-model="motionChkSm" size="sm" aria-label="Small checkbox specimen" />
                    <JCheckbox v-model="motionChkMd" aria-label="Default checkbox specimen" />
                    <JCheckbox v-model="motionChkLg" size="lg" aria-label="Large checkbox specimen" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Tier 3: 300ms Damped Spatial Glide Curve -->
            <div class="pg-ls-motion-card">
              <div class="pg-ls-motion-card__head">
                <div class="pg-ls-motion-card__top">
                  <h4>3 · Damped Spatial Glide</h4>
                  <span class="pg-ls-dim-badge is-solid">300ms</span>
                </div>
                <div class="pg-ls-motion-card__curve">
                  <code>--j-duration-slow</code> · <code>--j-ease-emphasized</code>
                </div>
                <p class="pg-ls-motion-card__desc">
                  Immediate departure followed by a long asymptotic settle onto the <code>1.00</code> target ceiling (<code>0.0%</code> overshoot).
                </p>
              </div>

              <div class="pg-ls-curve-box">
                <svg class="pg-ls-curve-svg" viewBox="0 0 200 64" fill="none" aria-label="cubic-bezier(0.16, 1, 0.3, 1) zero-overshoot curve">
                  <!-- 1.00 Target ceiling rule (0% overshoot) -->
                  <line x1="0" y1="8" x2="200" y2="8" stroke="var(--pg-redline-line)" stroke-width="1" stroke-dasharray="3 3" />
                  <!-- 0.00 Origin baseline -->
                  <line x1="0" y1="56" x2="200" y2="56" stroke="var(--j-border-strong)" stroke-width="1" />
                  <!-- Control handle tangents -->
                  <line x1="0" y1="56" x2="32" y2="8" stroke="var(--j-fg-subtle)" stroke-opacity="0.45" stroke-width="1" />
                  <line x1="200" y1="8" x2="60" y2="8" stroke="var(--j-fg-subtle)" stroke-opacity="0.45" stroke-width="1" />
                  <!-- Damped bezier path: M(0,56) C(32,8 60,8 200,8) -->
                  <path d="M 0 56 C 32 8, 60 8, 200 8" stroke="var(--j-accent)" stroke-width="2.2" stroke-linecap="round" />
                  <circle cx="32" cy="8" r="2.6" fill="var(--j-accent)" />
                  <circle cx="60" cy="8" r="2.6" fill="var(--j-accent)" />
                </svg>
                <div class="pg-ls-curve-box__meta">
                  <span>P1(0.16, 1.00) · P2(0.30, 1.00)</span>
                  <span>Overshoot: 0.0%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Interactive Damped Glide Track + Real-World Tactile Form Specimen -->
          <div class="pg-ls-motion-bench">
            <div class="pg-ls-glide-stage">
              <div class="pg-ls-glide-stage__head">
                <div>
                  <h4>Calibrated Spatial Glide Track (<code>300ms</code>)</h4>
                  <p class="pg-ls-glide-stage__sub">
                    Same weighted curve driving <code>JSidebar</code> rail collapse and <code>JAppShell</code> drawers.
                  </p>
                </div>
                <div class="pg-segmented" role="radiogroup" aria-label="Glide track stop">
                  <button
                    v-for="g in glideStops"
                    :key="g.stop"
                    type="button"
                    role="radio"
                    :aria-checked="motionGlideStop === g.stop"
                    @click="motionGlideStop = g.stop"
                  >
                    {{ g.label }} ({{ g.pct }})
                  </button>
                </div>
              </div>

              <div class="pg-ls-glide-track-wrap">
                <div class="pg-ls-glide-track">
                  <div class="pg-ls-glide-carriage" :data-stop="motionGlideStop">
                    <span>Shuttle</span>
                    <span class="pg-ls-glide-carriage__pip" />
                  </div>
                </div>
                <div class="pg-ls-glide-ticks">
                  <span>0% Origin</span>
                  <span>50% Midpoint</span>
                  <span>100% Docked (0px bounce)</span>
                </div>
              </div>
            </div>

            <div class="pg-ls-tactile-settings">
              <div class="pg-ls-glide-stage__head">
                <div>
                  <h4>In-Context Tactile Controls (<code>220ms</code>)</h4>
                  <p class="pg-ls-glide-stage__sub">
                    Test switches and checkboxes inside a real settings cluster and leave a feel note on this section.
                  </p>
                </div>
              </div>

              <div class="pg-ls-tactile-settings__rows">
                <JSwitch
                  v-model="motionSso"
                  placement="end"
                  label="Hardware key enforcement"
                  description="Require WebAuthn passkeys for production deployments."
                />
                <div class="pg-ls-tactile-settings__divider" />
                <JCheckbox
                  v-model="motionAudit"
                  label="Sign release artifacts automatically"
                  description="Attach cryptographic provenance attestations to every build."
                />
              </div>
            </div>
          </div>
        </div>
      </DemoSection>
    </div>
  </article>
</template>
