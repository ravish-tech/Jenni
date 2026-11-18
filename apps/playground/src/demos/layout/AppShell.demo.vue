<script lang="ts">
export const meta = {
  name: 'App Shell',
  group: 'Layout',
  order: 1,
  wide: 'full' as const,
  description:
    'Sixteen container-query shell archetypes, four surface variants (Flat, Inset, Floating, Contrast), AI Copilot sidecars, IDE workbenches, and mobile drill-down.',
  status: 'draft' as const,
};
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JAppShell,
  JSidebar,
  JSidebarGroup,
  JSidebarItem,
  JTopBar,
  JBottomBar,
  JBottomBarItem,
  JPage,
  JPageHeader,
  JSection,
  JStack,
  JInline,
  JGrid,
  JList,
  JListItem,
  JContainer,
  JCard,
  JButton,
  JBadge,
  JAvatar,
  JKbd,
  JInput,
  JProgress,
  JSegmentedControl,
  type JShellLayout,
  type JShellVariant,
  type JShellPane,
  type JShellSide,
} from '@jenni/vue';

type ShellFamily = 'all' | 'saas' | 'workbench' | 'multipane' | 'spatial';

interface ArchetypeSpec {
  id: JShellLayout;
  label: string;
  family: Exclude<ShellFamily, 'all'>;
  chrome: string;
  summary: string;
}

const activeFamily = ref<ShellFamily>('all');
const activeArchetype = ref<JShellLayout>('sidebar');
const shellVariant = ref<JShellVariant>('inset');
const sidebarSide = ref<JShellSide>('start');
const viewport = ref<'100%' | '840px' | '390px'>('100%');
const cinemaMode = ref(false);
const shellHeight = computed(() => (cinemaMode.value ? '100%' : 540));

function onWindowKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && cinemaMode.value) {
    cinemaMode.value = false;
  }
}

onMounted(() => window.addEventListener('keydown', onWindowKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onWindowKeydown));

const drawerOpen = ref(false);
const railCollapsed = ref(false);
const dockOpen = ref(true);
const asideOpen = ref(true);
const bannerVisible = ref(true);
const splitPane = ref<JShellPane>('master');

const activeNav = ref('inbox');
const activeSpace = ref('eng');
const activeSubbar = ref('overview');
const activeEditorTab = ref('JAppShell.vue');
const activeTab = ref('home');
const activeTool = ref('select');
const wizardStep = ref(2);
const selectedThread = ref('t1');
const copilotDraft = ref('');
const copilotMessages = ref([
  {
    id: 'm1',
    role: 'assistant',
    text: 'I audited 14 routes in eu-central-1. Median p95 dropped 22% after enabling edge caching.',
  },
  {
    id: 'm2',
    role: 'user',
    text: 'Draft a rollout summary for Cycle 15.',
  },
  {
    id: 'm3',
    role: 'assistant',
    text: 'Prepared 3 release highlights and pinned canary error budget (99.98%) to the overview card.',
  },
]);

const familyOptions = [
  { value: 'all', label: 'All (16)' },
  { value: 'saas', label: 'SaaS & Portals (5)' },
  { value: 'workbench', label: 'IDE, AI & Ops (4)' },
  { value: 'multipane', label: 'Multi-Pane & Editorial (4)' },
  { value: 'spatial', label: 'Canvas, Focus & Mobile (3)' },
];

const variantOptions: Array<{ id: JShellVariant; label: string }> = [
  { id: 'inset', label: 'Inset Island' },
  { id: 'floating', label: 'Floating Islands' },
  { id: 'contrast', label: 'Contrast Chrome' },
  { id: 'flat', label: 'Flat Hairline' },
];

const archetypes: ArchetypeSpec[] = [
  {
    id: 'sidebar',
    label: 'Sidebar',
    family: 'saas',
    chrome: '248px Left Sidebar · TopBar · 1fr Stage',
    summary: 'Persistent 248px sidebar + scrollable stage; off-canvas drawer below 720px.',
  },
  {
    id: 'header-sidebar',
    label: 'Global Header + Sidebar',
    family: 'saas',
    chrome: '100% Global TopBar · 240px Sidebar · 1fr Stage',
    summary: 'Full-width global header & optional announcement banner spanning above a left sidebar + workspace row (GitHub, AWS, GCP, Jira).',
  },
  {
    id: 'dual-nav',
    label: 'Dual-Nav',
    family: 'saas',
    chrome: '60px Space Rail · 220px Subnav · 1fr Stage',
    summary: '60px primary icon rail + 220px contextual subnav + 1fr stage (subnav collapses below 900px).',
  },
  {
    id: 'adaptive',
    label: 'Adaptive (M3)',
    family: 'saas',
    chrome: 'Sidebar (≥1100) → Rail (720–1099) → BottomBar (<720)',
    summary: 'Material 3 Navigation Suite: 248px Sidebar → 60px Icon Rail → mobile BottomBar from one markup.',
  },
  {
    id: 'topnav',
    label: 'TopNav + SubBar',
    family: 'saas',
    chrome: 'TopBar · 40px SubBar · Fluid Canvas',
    summary: 'Horizontal TopBar + secondary SubBar tabs + full-breadth portal workspace without side chrome.',
  },
  {
    id: 'ide',
    label: 'Workbench IDE',
    family: 'workbench',
    chrome: '38px TitleBar · 48px Rail · 232px Tree · Editor/Terminal · 24px StatusBar',
    summary: 'Full workbench shell (VS Code, Cursor, Zed): activity rail, file explorer, editor tab strip, collapsible terminal dock, right agent, and bottom status bar.',
  },
  {
    id: 'copilot',
    label: 'AI Copilot Sidecar',
    family: 'workbench',
    chrome: '224px Nav · 1fr Workspace · 360px Copilot Sidecar',
    summary: 'Primary SaaS workspace paired with a persistent, toggleable 360px AI Copilot sidecar that glides over as a sheet below 1024px.',
  },
  {
    id: 'studio',
    label: 'Studio + Dock',
    family: 'workbench',
    chrome: '60px Tool Rail · Canvas + 156px Dock · 320px Inspector',
    summary: 'Creative/engineering studio with tool rail, center stage, collapsible bottom timeline/console dock, and right inspector.',
  },
  {
    id: 'command-center',
    label: 'Command Center',
    family: 'workbench',
    chrome: '44px Ops Bar · 34px Live Ticker · 52px Rail · Matrix + Stream + Feed · StatusBar',
    summary: 'High-density NOC / telemetry / financial command matrix with live ticker bar, event stream dock, incident feed, and tabular status bar.',
  },
  {
    id: 'split',
    label: 'Split Drill-Down',
    family: 'multipane',
    chrome: '60px Rail · 320px Master · 1fr Detail',
    summary: 'Rail + 320px master list + 1fr detail pane; single-pane master/detail drill-down below 720px.',
  },
  {
    id: 'three-pane',
    label: 'Three-Pane',
    family: 'multipane',
    chrome: '200px Folder Nav · 300px List · 1fr Reader',
    summary: '200px left nav (< 1024px rail) + 300px thread list + 1fr detail reader (Apple Mail, Superhuman, Linear Triage).',
  },
  {
    id: 'holy-grail',
    label: 'Holy Grail 3-Col',
    family: 'multipane',
    chrome: 'Global Header · 220px Nav + 1fr Main + 268px Aside · Global Footer',
    summary: 'Classic full-bleed header & footer sandwiching left navigation, fluid article/feed, and right TOC/context rail.',
  },
  {
    id: 'centered',
    label: 'Centered Editorial',
    family: 'multipane',
    chrome: 'TopBar · 65ch Prose Container',
    summary: 'TopBar + centered measure container for editorial essays, changelogs, and focused reading.',
  },
  {
    id: 'floating-dock',
    label: 'Floating Pill Dock',
    family: 'spatial',
    chrome: '100% Dot-Grid Stage · Glass Top HUD · Centered Pill Dock · Floating Card',
    summary: 'Edge-to-edge spatial canvas with floating translucent top HUD, centered pill dock, and floating inspector card (FigJam, Freeform, visionOS).',
  },
  {
    id: 'focus',
    label: 'Focus / Zen Wizard',
    family: 'spatial',
    chrome: 'Borderless Header · 680px Focus Stage · Pinned Step Bar',
    summary: 'Distraction-free checkout, onboarding wizard, or composer stage with whisper-quiet progress header and pinned action footer.',
  },
  {
    id: 'bars',
    label: 'Top + Bottom Bars',
    family: 'spatial',
    chrome: 'Sticky TopBar · Scrollable Feed · Sticky BottomBar',
    summary: 'Mobile-first app shell with sticky translucent header, scrollable feed, and 4-tab bottom navigation bar.',
  },
];

const filteredArchetypes = computed(() =>
  activeFamily.value === 'all'
    ? archetypes
    : archetypes.filter((a) => a.family === activeFamily.value),
);

const viewports: Array<{ value: '100%' | '840px' | '390px'; label: string }> = [
  { value: '100%', label: 'Expanded 100%' },
  { value: '840px', label: 'Medium 840px' },
  { value: '390px', label: 'Compact 390px' },
];

const threads = [
  {
    id: 't1',
    sender: 'Elena Rostova',
    subject: 'Q4 Design Tokens Audit',
    preview: 'Updated --j-gap-* and container queries across all 16 workspace shells. Ready for review.',
    time: '2m',
    tag: 'Design',
  },
  {
    id: 't2',
    sender: 'Marcus Vance',
    subject: 'Release v2.4 rollout plan',
    preview: 'Canary traffic is at 25% with zero latency regressions in EU-West.',
    time: '18m',
    tag: 'Infra',
  },
  {
    id: 't3',
    sender: 'Sora Takahashi',
    subject: 'Mobile navigation usability notes',
    preview: 'Adaptive Navigation Suite hits 44px touch targets comfortably on iOS Safari.',
    time: '1h',
    tag: 'Mobile',
  },
  {
    id: 't4',
    sender: 'Liam Chen',
    subject: 'Billing webhook retry policy',
    preview: 'Exponential backoff capped at 15m prevents queue saturation during spikes.',
    time: '3h',
    tag: 'API',
  },
];

const editorFiles = [
  { name: 'JAppShell.vue', meta: 'Vue 3' },
  { name: 'shell.css', meta: 'CSS' },
  { name: 'tokens.css', meta: 'OKLCH' },
  { name: 'AppShell.tsx', meta: 'React 19' },
];

const editorCodeSnippet = computed(() => {
  if (activeEditorTab.value === 'shell.css') {
    return `@layer jenni.components {\n  :where(.j-shell[data-variant="floating"]) {\n    background-color: var(--j-surface-2);\n    padding: var(--j-space-2);\n    gap: var(--j-space-2);\n  }\n}`;
  }
  if (activeEditorTab.value === 'tokens.css') {
    return `[data-density="compact"] {\n  --j-density: 0.65;\n  --j-control-md: 24px;\n}`;
  }
  return `<JAppShell layout="ide" variant="${shellVariant.value}">\n  <template #rail><!-- 48px Activity Bar --></template>\n  <template #subnav><!-- 232px Explorer --></template>\n  <template #dock><!-- Terminal --></template>\n  <template #statusbar>main · 0 errors · UTF-8</template>\n</JAppShell>`;
});

const currentThread = computed(() => threads.find((t) => t.id === selectedThread.value) ?? threads[0]!);
const currentInfo = computed(() => archetypes.find((a) => a.id === activeArchetype.value) ?? archetypes[0]!);
const shellInstance = ref<{ closeAside: () => void } | null>(null);

function selectLayout(id: JShellLayout) {
  if (activeArchetype.value === id) {
    shellInstance.value?.closeAside();
  }
  activeArchetype.value = id;
  drawerOpen.value = false;
  asideOpen.value = true;
  dockOpen.value = true;
  splitPane.value = 'master';
}

function openThread(id: string) {
  selectedThread.value = id;
  splitPane.value = 'detail';
}

function sendCopilotPrompt() {
  const text = copilotDraft.value.trim();
  if (!text) return;
  copilotMessages.value.push({
    id: `u-${Date.now()}`,
    role: 'user',
    text,
  });
  copilotMessages.value.push({
    id: `a-${Date.now() + 1}`,
    role: 'assistant',
    text: `Applied "${text}" across active workspace metrics with zero layout shift.`,
  });
  copilotDraft.value = '';
}

const html = `<!-- Global Header + Left Sidebar (GitHub / Cloud Console) -->
<div class="j-shell" data-layout="header-sidebar" data-variant="contrast">
  <header class="j-topbar">…</header>
  <div class="j-shell__workspace">
    <nav class="j-sidebar" aria-label="Primary navigation">…</nav>
    <button type="button" class="j-shell__backdrop" tabindex="-1" aria-label="Close"></button>
    <div class="j-shell__body">
      <main class="j-shell__main"><div class="j-page">…</div></main>
    </div>
  </div>
  <footer class="j-shell__statusbar">eu-central-1 · 99.99% uptime</footer>
</div>

<!-- Workbench IDE + Terminal Dock + Status Bar -->
<div class="j-shell" data-layout="ide" data-variant="floating">
  <header class="j-topbar">…</header>
  <div class="j-shell__workspace">
    <nav class="j-shell__rail" aria-label="Activity rail">…</nav>
    <nav class="j-shell__subnav" aria-label="Explorer">…</nav>
    <div class="j-shell__body">
      <div class="j-shell__subbar">JAppShell.vue · shell.css</div>
      <div class="j-shell__stage">
        <div class="j-shell__center">
          <main class="j-shell__main">…</main>
          <section class="j-shell__dock" aria-label="Terminal">…</section>
        </div>
        <aside class="j-shell__aside" aria-label="Agent">…</aside>
      </div>
    </div>
  </div>
  <footer class="j-shell__statusbar">main* · 0 errors · Ln 42, Col 8</footer>
</div>`;
</script>

<template>
  <DemoSection
    title="Interactive Application Shell Lab (16 Archetypes × 4 Variants)"
    description="Filter by shell family, switch across all 16 container-query archetypes, compare 4 surface treatments (Inset, Floating, Contrast, Flat), flip sidebar side, test Expanded · Medium · Compact adaptation, or open full-viewport Cinema mode."
    flush
  >
    <JStack
      gap="field"
      :class="{ 'pg-appshell-cinema': cinemaMode }"
      :role="cinemaMode ? 'dialog' : undefined"
      :aria-modal="cinemaMode ? 'true' : undefined"
      :aria-label="cinemaMode ? 'Full-viewport shell lab' : undefined"
      style="width: 100%"
    >
      <!-- Top filter & chrome controls -->
      <JInline gap="item" justify="between" :class="{ 'pg-appshell-cinema__bar': cinemaMode }" style="width: 100%">
        <JSegmentedControl v-model="activeFamily" size="sm" :options="familyOptions" />

        <JInline gap="related">
          <JInline gap="inline">
            <JButton
              v-for="v in variantOptions"
              :key="v.id"
              size="sm"
              :variant="shellVariant === v.id ? 'soft' : 'ghost'"
              :tone="shellVariant === v.id ? 'accent' : 'neutral'"
              @click="shellVariant = v.id"
            >
              {{ v.label }}
            </JButton>
          </JInline>

          <JButton
            size="sm"
            variant="outline"
            tone="neutral"
            @click="sidebarSide = sidebarSide === 'start' ? 'end' : 'start'"
          >
            Nav: {{ sidebarSide === 'start' ? 'Left' : 'Right' }}
          </JButton>

          <JInline gap="inline">
            <JButton
              v-for="vp in viewports"
              :key="vp.value"
              size="sm"
              :variant="viewport === vp.value ? 'soft' : 'ghost'"
              :tone="viewport === vp.value ? 'info' : 'neutral'"
              @click="viewport = vp.value"
            >
              {{ vp.label }}
            </JButton>
          </JInline>

          <JButton
            size="sm"
            :variant="cinemaMode ? 'solid' : 'outline'"
            :tone="cinemaMode ? 'accent' : 'neutral'"
            @click="cinemaMode = !cinemaMode"
          >
            {{ cinemaMode ? '✕ Exit Cinema' : '⛶ Cinema' }}
          </JButton>
        </JInline>
      </JInline>

      <!-- Archetype selector pills -->
      <JInline gap="inline">
        <JButton
          v-for="a in filteredArchetypes"
          :key="a.id"
          size="sm"
          :variant="activeArchetype === a.id ? 'solid' : 'outline'"
          :tone="activeArchetype === a.id ? 'accent' : 'neutral'"
          @click="selectLayout(a.id)"
        >
          {{ a.label }}
        </JButton>
      </JInline>

      <JInline v-if="!cinemaMode" gap="item" justify="between" style="width: 100%">
        <p style="font-size: var(--j-text-sm); color: var(--j-fg-muted); margin: 0">
          <strong style="color: var(--j-fg)">{{ currentInfo.label }} ({{ shellVariant }}):</strong>
          {{ currentInfo.summary }}
        </p>
        <JBadge size="sm" variant="outline" tone="neutral">{{ currentInfo.chrome }}</JBadge>
      </JInline>

      <!-- Resizable preview stage -->
      <div
        :class="{ 'pg-appshell-cinema__stage': cinemaMode }"
        :style="{
          width: '100%',
          maxWidth: viewport,
          marginInline: 'auto',
          transition: 'max-width var(--j-duration-slow) var(--j-ease-emphasized)',
        }"
      >
        <!-- 1. SIDEBAR + CONTENT -->
        <JAppShell
          v-if="activeArchetype === 'sidebar'"
          v-model:sidebar-open="drawerOpen"
          layout="sidebar"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
        >
          <template #sidebar>
            <JSidebar v-model:collapsed="railCollapsed">
              <template #header>
                <JInline v-if="!railCollapsed" gap="inline" nowrap>
                  <JAvatar initials="NS" size="xs" shape="square" tone="accent" />
                  <strong style="font-size: var(--j-text-sm)">Northstar Cloud</strong>
                </JInline>
                <JButton
                  size="sm"
                  variant="ghost"
                  tone="neutral"
                  icon-only
                  :title="railCollapsed ? 'Expand sidebar' : 'Collapse rail'"
                  @click="railCollapsed = !railCollapsed"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M6 2.5v11"/></svg>
                </JButton>
              </template>

              <JSidebarGroup label="Workspace">
                <JSidebarItem label="Overview" :active="activeNav === 'inbox'" badge="4" @click="activeNav = 'inbox'">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Deployments" :active="activeNav === 'deploys'" badge="12" @click="activeNav = 'deploys'">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2v12M3 7l5-5 5 5"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Analytics" :active="activeNav === 'analytics'" @click="activeNav = 'analytics'">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 13.5h11M5 11V7M8.5 11V4M12 11V8.5"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Settings" :active="activeNav === 'settings'" @click="activeNav = 'settings'">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="2.5"/><path d="M8 1.8v1.7M8 12.5v1.7M1.8 8h1.7M12.5 8h1.7"/></svg>
                  </template>
                </JSidebarItem>
              </JSidebarGroup>

              <template #footer>
                <JAvatar name="Ada Lovelace" size="xs" status="online" @click="railCollapsed = false" />
                <div v-if="!railCollapsed" style="min-width: 0; flex: 1">
                  <div style="font-size: var(--j-text-xs); font-weight: 600">Ada Lovelace</div>
                  <div style="font-size: 11px; color: var(--j-fg-muted)">Pro workspace</div>
                </div>
              </template>
            </JSidebar>
          </template>

          <template #topbar>
            <JTopBar sticky translucent>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Toggle menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <span style="font-size: var(--j-text-sm); font-weight: 600">Production Overview</span>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JBadge size="sm" tone="success" dot>Healthy</JBadge>
                </span>
              </template>
              <template #end>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JKbd size="sm">⌘K</JKbd>
                </span>
                <JButton size="sm" variant="solid">New Deploy</JButton>
              </template>
            </JTopBar>
          </template>

          <JPage size="lg">
            <JPageHeader
              eyebrow="Workspace / Overview"
              title="Persistent Sidebar Architecture"
              description="Try switching between Inset Island, Floating Islands, Contrast Chrome, and Flat Hairline above."
            />
            <JGrid :min-cell-width="170" gap="item">
              <JCard size="sm" title="99.98%" description="Global uptime (30d)" />
              <JCard size="sm" title="18.4 ms" description="Median p50 edge latency" />
              <JCard size="sm" title="1,420 / s" description="Requests handled" />
            </JGrid>
          </JPage>
        </JAppShell>

        <!-- 2. GLOBAL HEADER + LEFT SIDEBAR (GitHub / AWS / GCP / Jira) -->
        <JAppShell
          v-else-if="activeArchetype === 'header-sidebar'"
          v-model:sidebar-open="drawerOpen"
          layout="header-sidebar"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
        >
          <template v-if="bannerVisible" #banner>
            <span> Cloud Region <strong>ap-northeast-1 (Tokyo)</strong> is now generally available with zero-cold-start workers.</span>
            <JButton size="sm" variant="ghost" tone="accent" @click="bannerVisible = false">Dismiss</JButton>
          </template>

          <template #topbar>
            <JTopBar sticky>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Toggle menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <JAvatar initials="CC" size="xs" shape="square" tone="accent" />
                <strong style="font-size: var(--j-text-sm)">Cloud Console</strong>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JBadge size="sm" variant="outline" tone="neutral">org / acme-corp</JBadge>
                </span>
              </template>
              <template #end>
                <JInput size="sm" placeholder="Jump to…" style="width: clamp(104px, 22cqi, 180px)" />
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JKbd size="sm">/</JKbd>
                </span>
                <JAvatar name="Ada Lovelace" size="xs" status="online" />
              </template>
            </JTopBar>
          </template>

          <template #sidebar>
            <JSidebar>
              <JSidebarGroup label="Compute & Edge">
                <JSidebarItem label="Clusters" badge="6" :active="activeNav === 'inbox'" @click="activeNav = 'inbox'" />
                <JSidebarItem label="Functions" badge="24" :active="activeNav === 'deploys'" @click="activeNav = 'deploys'" />
                <JSidebarItem label="KV Stores" :active="activeNav === 'analytics'" @click="activeNav = 'analytics'" />
              </JSidebarGroup>
              <JSidebarGroup label="Security & IAM">
                <JSidebarItem label="Zero-Trust Policies" :active="activeNav === 'settings'" @click="activeNav = 'settings'" />
                <JSidebarItem label="Audit Trail" />
              </JSidebarGroup>
            </JSidebar>
          </template>

          <template #subbar>
            <JInline gap="inline" nowrap>
              <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">acme-corp / Compute /</span>
              <strong style="font-size: var(--j-text-xs); color: var(--j-fg)">Production Clusters</strong>
            </JInline>
            <JButton v-if="!bannerVisible" size="sm" variant="ghost" tone="neutral" @click="bannerVisible = true">
              Restore Banner
            </JButton>
          </template>

          <JPage size="lg">
            <JPageHeader
              eyebrow="Global Header + Scoped Sidebar"
              title="Enterprise Console Shell"
              description="The global topbar (and dismissible announcement banner) spans 100% width across the top, while the 240px service sidebar and breadcrumb bar sit underneath."
            >
              <template #actions>
                <JButton size="sm" variant="outline" tone="neutral">Export Terraform</JButton>
                <JButton size="sm">Create Cluster</JButton>
              </template>
            </JPageHeader>
            <JGrid :min-cell-width="180" gap="item">
              <JCard size="sm" title="eu-central-1" description="Primary · 12 nodes · 11.2 ms" />
              <JCard size="sm" title="us-east-1" description="Replica · 8 nodes · 19.6 ms" />
              <JCard size="sm" title="ap-northeast-1" description="Replica · 6 nodes · 23.1 ms" />
            </JGrid>
          </JPage>

          <template #statusbar>
            <div class="j-shell__statusbar-group">
              <JBadge size="sm" tone="success" dot>API Operational</JBadge>
              <span>Terraform state synced 14s ago</span>
            </div>
            <div class="j-shell__statusbar-group">
              <span>TLS 1.3 · HTTP/3</span>
            </div>
          </template>
        </JAppShell>

        <!-- 3. DUAL-NAV (60px Rail + 220px Subnav + 1fr Stage) -->
        <JAppShell
          v-else-if="activeArchetype === 'dual-nav'"
          v-model:sidebar-open="drawerOpen"
          layout="dual-nav"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
        >
          <template #rail>
            <JAvatar initials="NS" size="sm" shape="square" tone="accent" />
            <JSidebarGroup>
              <JSidebarItem label="Engineering" :active="activeSpace === 'eng'" @click="activeSpace = 'eng'">
                <template #icon>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m5 4-3 4 3 4M11 4l3 4-3 4"/></svg>
                </template>
              </JSidebarItem>
              <JSidebarItem label="Design" :active="activeSpace === 'design'" @click="activeSpace = 'design'">
                <template #icon>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2"/></svg>
                </template>
              </JSidebarItem>
              <JSidebarItem label="Operations" :active="activeSpace === 'ops'" @click="activeSpace = 'ops'">
                <template #icon>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 13.5h11M5 11V6M8.5 11V3.5M12 11V8"/></svg>
                </template>
              </JSidebarItem>
            </JSidebarGroup>
            <div class="j-shell__rail-footer">
              <JAvatar name="Ada Lovelace" size="xs" status="online" />
            </div>
          </template>

          <template #subnav>
            <div class="j-shell__subnav-header">
              <span>{{ activeSpace === 'eng' ? 'Engineering' : activeSpace === 'design' ? 'Design System' : 'Operations' }}</span>
              <JBadge size="sm" variant="soft" tone="neutral">v2.4</JBadge>
            </div>
            <JSidebarGroup label="Views">
              <JSidebarItem label="Triage Queue" :active="activeNav === 'inbox'" badge="7" @click="activeNav = 'inbox'" />
              <JSidebarItem label="Active Cycle" :active="activeNav === 'deploys'" badge="19" @click="activeNav = 'deploys'" />
              <JSidebarItem label="Roadmaps" :active="activeNav === 'analytics'" @click="activeNav = 'analytics'" />
            </JSidebarGroup>
            <JSidebarGroup label="Streams">
              <JSidebarItem label="Core CSS" />
              <JSidebarItem label="Vue & React" />
            </JSidebarGroup>
          </template>

          <template #topbar>
            <JTopBar sticky>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Toggle navigation"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <strong style="font-size: var(--j-text-sm)">Cycle 14</strong>
                <span class="j-shell__compact-hide appshell-compact-hide" style="font-size: var(--j-text-sm); font-weight: 600">
                  · Spatial Primitives
                </span>
              </template>
              <template #end>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JButton size="sm" variant="outline" tone="neutral">Filter</JButton>
                </span>
                <JButton size="sm">New Issue</JButton>
              </template>
            </JTopBar>
          </template>

          <JPage size="lg">
            <JPageHeader
              eyebrow="Dual-Rail Contextual Architecture"
              title="Primary Rail + Contextual Subnav"
              description="Switch to Medium (840px) to see the 220px subnav collapse cleanly while keeping the 60px space rail."
            />
            <JList variant="card" lines="1" inset-divider>
              <JListItem
                v-for="t in threads"
                :key="t.id"
                :title="t.subject"
                :description="t.preview"
              >
                <template #leading><JBadge size="sm" variant="soft">{{ t.tag }}</JBadge></template>
                <template #trailing><span>{{ t.time }}</span></template>
              </JListItem>
            </JList>
          </JPage>
        </JAppShell>

        <!-- 4. ADAPTIVE NAVIGATION SUITE (M3) -->
        <JAppShell
          v-else-if="activeArchetype === 'adaptive'"
          layout="adaptive"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
        >
          <template #sidebar>
            <JSidebar>
              <template #header>
                <JAvatar initials="AD" size="xs" shape="square" tone="accent" />
                <strong class="j-sidebar__collapse-hide" style="font-size: var(--j-text-sm); margin-right: auto">Adaptive Suite</strong>
              </template>
              <JSidebarGroup label="Destinations">
                <JSidebarItem label="Home" :active="activeTab === 'home'" @click="activeTab = 'home'">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 7.5 8 2.5l5.5 5V13.5h-11V7.5Z"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Inbox" badge="3" :active="activeTab === 'inbox'" @click="activeTab = 'inbox'">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="1.8"/><path d="m2 5.5 6 3.5 6-3.5"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Explore" :active="activeTab === 'search'" @click="activeTab = 'search'">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7.2" cy="7.2" r="4.2"/><path d="m10.5 10.5 3 3"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Account" :active="activeTab === 'profile'" @click="activeTab = 'profile'">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="5.5" r="2.5"/><path d="M3.5 13.5c1-2.2 2.6-3.2 4.5-3.2s3.5 1 4.5 3.2"/></svg>
                  </template>
                </JSidebarItem>
              </JSidebarGroup>
            </JSidebar>
          </template>

          <template #topbar>
            <JTopBar sticky translucent>
              <template #start>
                <strong style="font-size: var(--j-text-sm)">Adaptive Suite</strong>
                <span class="j-shell__compact-hide appshell-compact-hide" style="font-size: var(--j-text-sm); font-weight: 600">
                  · M3 Navigation
                </span>
              </template>
              <template #end>
                <JBadge size="sm" variant="soft" tone="info">{{ viewport }}</JBadge>
              </template>
            </JTopBar>
          </template>

          <JPage size="md">
            <JPageHeader
              eyebrow="Material 3 Navigation Suite"
              title="One Markup, Three Form Factors"
              description="Click Expanded (100%), Medium (840px), and Compact (390px) above: the 248px Sidebar morphs into a 60px Icon Rail on tablet and a BottomBar on mobile with zero JS resize listeners."
            />
            <JGrid :min-cell-width="200" gap="item">
              <JCard size="sm" title="≥ 1100px" description="248px full Sidebar; BottomBar hidden" />
              <JCard size="sm" title="720px – 1099px" description="60px icon-only Rail; BottomBar hidden" />
              <JCard size="sm" title="< 720px" description="60px BottomBar tabs; side chrome hidden" />
            </JGrid>
          </JPage>

          <template #bottombar>
            <JBottomBar sticky translucent aria-label="Adaptive destinations">
              <JBottomBarItem label="Home" :active="activeTab === 'home'" @click="activeTab = 'home'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 9.5 10 3l7 6.5V17H3V9.5Z"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Inbox" badge="3" :active="activeTab === 'inbox'" @click="activeTab = 'inbox'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="14" height="12" rx="2"/><path d="m3 7 7 4.5L17 7"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Explore" :active="activeTab === 'search'" @click="activeTab = 'search'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="9" r="5"/><path d="m13 13 4 4"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Account" :active="activeTab === 'profile'" @click="activeTab = 'profile'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="7" r="3"/><path d="M4.5 16.5c1.2-2.6 3.2-4 5.5-4s4.3 1.4 5.5 4"/></svg>
                </template>
              </JBottomBarItem>
            </JBottomBar>
          </template>
        </JAppShell>

        <!-- 5. WORKBENCH IDE + TERMINAL DOCK + STATUS BAR (VS Code / Cursor / Zed) -->
        <JAppShell
          v-else-if="activeArchetype === 'ide'"
          ref="shellInstance"
          v-model:sidebar-open="drawerOpen"
          v-model:dock-open="dockOpen"
          v-model:aside-open="asideOpen"
          layout="ide"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
          :dock-height="140"
        >
          <template #topbar="{ dockOpen: isDockShown, asideOpen: isAsideShown, toggleDock, toggleAside }">
            <JTopBar>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Toggle navigation"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <JInline gap="inline" nowrap>
                  <span class="j-shell__compact-hide appshell-compact-hide">
                    <JAvatar initials="ID" size="xs" shape="square" tone="accent" />
                  </span>
                  <strong style="font-size: var(--j-text-xs)">ui-monorepo</strong>
                </JInline>
              </template>
              <template #center>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JBadge size="sm" variant="outline" tone="neutral">{{ activeEditorTab }} — packages/vue</JBadge>
                </span>
              </template>
              <template #end>
                <JButton size="sm" :variant="isDockShown ? 'soft' : 'ghost'" tone="neutral" :aria-expanded="isDockShown" @click="toggleDock()">
                  Terminal
                </JButton>
                <JButton size="sm" :variant="isAsideShown ? 'soft' : 'ghost'" tone="accent" :aria-expanded="isAsideShown" @click="toggleAside()">
                  Agent
                </JButton>
              </template>
            </JTopBar>
          </template>

          <template #rail>
            <JSidebarGroup>
              <JSidebarItem label="Explorer" active>
                <template #icon>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="2.5" width="11" height="11" rx="1.8"/><path d="M6 2.5v11"/></svg>
                </template>
              </JSidebarItem>
              <JSidebarItem label="Search">
                <template #icon>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="4"/><path d="m10.2 10.2 3.3 3.3"/></svg>
                </template>
              </JSidebarItem>
              <JSidebarItem label="Source Control">
                <template #icon>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="5" cy="4" r="1.8"/><circle cx="5" cy="12" r="1.8"/><circle cx="11" cy="7" r="1.8"/><path d="M5 5.8v4.4M6.8 7H9.2"/></svg>
                </template>
              </JSidebarItem>
            </JSidebarGroup>
          </template>

          <template #subnav>
            <div class="j-shell__subnav-header">
              <span>Explorer</span>
              <JKbd size="sm">⌘B</JKbd>
            </div>
            <JSidebarGroup label="packages / vue / layout">
              <JSidebarItem
                v-for="f in editorFiles"
                :key="f.name"
                :label="f.name"
                :badge="f.meta"
                :active="activeEditorTab === f.name"
                @click="activeEditorTab = f.name"
              />
            </JSidebarGroup>
          </template>

          <template #subbar>
            <JInline gap="inline" nowrap>
              <JButton
                v-for="f in editorFiles"
                :key="f.name"
                size="sm"
                :variant="activeEditorTab === f.name ? 'soft' : 'ghost'"
                :tone="activeEditorTab === f.name ? 'accent' : 'neutral'"
                @click="activeEditorTab = f.name"
              >
                {{ f.name }}
              </JButton>
            </JInline>
            <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">LF · TypeScript</span>
          </template>

          <div style="padding: var(--j-space-4)">
            <pre
              style="
                margin: 0;
                padding: var(--j-space-3);
                border-radius: var(--j-radius-md);
                background: var(--j-surface-2);
                border: 1px solid var(--j-border);
                font-family: var(--j-font-mono);
                font-size: var(--j-text-xs);
                line-height: 1.65;
                overflow-x: auto;
              "
            >{{ editorCodeSnippet }}</pre>
          </div>

          <template #dock="{ toggleDock }">
            <div class="j-shell__dock-header">
              <JInline gap="related">
                <strong>TERMINAL</strong>
                <JBadge size="sm" tone="success" dot>vite v8.3.7 ready in 94ms</JBadge>
              </JInline>
              <JButton size="sm" variant="ghost" tone="neutral" @click="toggleDock(false)">×</JButton>
            </div>
            <div class="j-shell__dock-body" style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-muted)">
              <div>$ npm run typecheck && npm run build</div>
              <div style="color: var(--j-success)">✓ 0 errors across @jenni/core, @jenni/vue, @jenni/react</div>
            </div>
          </template>

          <template #aside="{ closeAside }">
            <div class="j-shell__copilot-header">
              <span>Composer Agent</span>
              <JButton size="sm" variant="ghost" tone="neutral" @click="closeAside()">×</JButton>
            </div>
            <div class="j-shell__copilot-body">
              <JCard size="sm" variant="outline" title="Zero-style SFC verified" description="All 16 shell layouts share @jenni/core container queries with 0 !important." />
              <JCard size="sm" variant="outline" title="Compact 0.65× ready" description="Activity rail, editor tabs, and statusbar snap cleanly to pixel floors." />
            </div>
          </template>

          <template #statusbar>
            <div class="j-shell__statusbar-group">
              <strong>⎇ main*</strong>
              <span>0 errors · 0 warnings</span>
            </div>
            <div class="j-shell__statusbar-group">
              <span>Ln 42, Col 8</span>
              <span>UTF-8</span>
              <span>Vue 3.5</span>
            </div>
          </template>
        </JAppShell>

        <!-- 6. AI COPILOT SIDECAR (Shopify Sidekick / Notion AI / M365 Copilot) -->
        <JAppShell
          v-else-if="activeArchetype === 'copilot'"
          ref="shellInstance"
          v-model:sidebar-open="drawerOpen"
          v-model:aside-open="asideOpen"
          layout="copilot"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
        >
          <template #sidebar>
            <JSidebar>
              <template #header>
                <JInline gap="inline" nowrap>
                  <JAvatar initials="AI" size="xs" shape="square" tone="accent" />
                  <strong style="font-size: var(--j-text-sm)">Design Studio</strong>
                </JInline>
              </template>
              <JSidebarGroup label="Product">
                <JSidebarItem label="Revenue Pulse" active />
                <JSidebarItem label="Experiments" badge="3" />
                <JSidebarItem label="Cohorts" />
                <JSidebarItem label="Automations" />
              </JSidebarGroup>
            </JSidebar>
          </template>

          <template #topbar="{ asideOpen: isAsideShown, toggleAside }">
            <JTopBar sticky translucent>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <strong style="font-size: var(--j-text-sm)">Cycle 15</strong>
                <span class="j-shell__compact-hide appshell-compact-hide" style="font-size: var(--j-text-sm); font-weight: 600">
                  · Revenue &amp; Telemetry
                </span>
              </template>
              <template #end>
                <JButton size="sm" :variant="isAsideShown ? 'solid' : 'outline'" tone="accent" :aria-expanded="isAsideShown" @click="toggleAside()">
                  ✦ Copilot
                </JButton>
              </template>
            </JTopBar>
          </template>

          <JPage size="lg">
            <JPageHeader
              eyebrow="Persistent AI Copilot Sidecar"
              title="Workspace + Contextual Agent"
              description="Click '✦ Copilot' in the topbar at both 100% (docked 360px sidecar) and 840px / 390px (elevated slide-over drawer with scrim)."
            />
            <JGrid :min-cell-width="170" gap="item">
              <JCard size="sm" title="$482.4k" description="Net ARR (+18.4% MoM)" />
              <JCard size="sm" title="14.2 ms" description="Edge p95 (-22% post-cache)" />
              <JCard size="sm" title="99.98%" description="Canary error budget" />
            </JGrid>
          </JPage>

          <template #aside="{ closeAside }">
            <div class="j-shell__copilot-header">
              <JInline gap="inline">
                <JBadge size="sm" tone="accent" dot>Copilot</JBadge>
                <span>Workspace Assistant</span>
              </JInline>
              <JButton size="sm" variant="ghost" tone="neutral" @click="closeAside()">Close</JButton>
            </div>
            <div class="j-shell__copilot-body">
              <div
                v-for="m in copilotMessages"
                :key="m.id"
                :style="{
                  padding: 'var(--j-space-2) var(--j-space-3)',
                  borderRadius: 'var(--j-radius-md)',
                  fontSize: 'var(--j-text-xs)',
                  lineHeight: 1.5,
                  background: m.role === 'user' ? 'var(--j-accent-soft)' : 'var(--j-surface-2)',
                  color: m.role === 'user' ? 'var(--j-accent-soft-fg)' : 'var(--j-fg)',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'stretch',
                }"
              >
                {{ m.text }}
              </div>
            </div>
            <form class="j-shell__copilot-footer" @submit.prevent="sendCopilotPrompt">
              <JInline gap="inline" nowrap style="width: 100%">
                <JInput v-model="copilotDraft" size="sm" placeholder="Ask about this view…" style="flex: 1" />
                <JButton type="submit" size="sm">Send</JButton>
              </JInline>
            </form>
          </template>
        </JAppShell>

        <!-- 7. STUDIO / WORKSPACE + COLLAPSIBLE BOTTOM DOCK -->
        <JAppShell
          v-else-if="activeArchetype === 'studio' || activeArchetype === 'workspace'"
          ref="shellInstance"
          v-model:sidebar-open="drawerOpen"
          v-model:dock-open="dockOpen"
          v-model:aside-open="asideOpen"
          :layout="activeArchetype"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
          :dock-height="156"
        >
          <template #sidebar>
            <JSidebar collapsed>
              <template #header>
                <JAvatar initials="ST" size="xs" shape="square" tone="accent" />
              </template>
              <JSidebarGroup label="Tools">
                <JSidebarItem label="Canvas" active>
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="12" height="12" rx="2"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Layers">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2 2 5.5 8 9l6-3.5L8 2ZM2 8.5 8 12l6-3.5M2 11.5 8 15l6-3.5"/></svg>
                  </template>
                </JSidebarItem>
              </JSidebarGroup>
            </JSidebar>
          </template>

          <template #topbar="{ dockOpen: isDockShown, asideOpen: isAsideShown, toggleDock, toggleAside }">
            <JTopBar sticky>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <strong style="font-size: var(--j-text-sm)">HeroCard</strong>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JBadge size="sm" variant="outline" tone="neutral">1920 × 1080</JBadge>
                </span>
              </template>
              <template #end>
                <JButton size="sm" :variant="isDockShown ? 'soft' : 'outline'" tone="neutral" :aria-expanded="isDockShown" @click="toggleDock()">
                  Dock
                </JButton>
                <JButton size="sm" :variant="isAsideShown ? 'soft' : 'outline'" tone="neutral" :aria-expanded="isAsideShown" @click="toggleAside()">
                  Inspector
                </JButton>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JButton size="sm">Publish</JButton>
                </span>
              </template>
            </JTopBar>
          </template>

          <JPage size="md">
            <JCard
              variant="elevated"
              title="Multi-Dock Studio Stage"
              description="Combines a 60px tool rail, fluid canvas, collapsible 156px bottom console/timeline dock (#dock), and full-height 320px right inspector (#aside)."
            >
              <JInline gap="related">
                <JBadge tone="accent">OKLCH</JBadge>
                <JBadge tone="info">Studio Dock</JBadge>
              </JInline>
            </JCard>
          </JPage>

          <template #dock="{ toggleDock }">
            <div class="j-shell__dock-header">
              <JInline gap="related">
                <strong>Build & Motion Timeline</strong>
                <JBadge size="sm" tone="success" dot>0 warnings</JBadge>
              </JInline>
              <JButton size="sm" variant="ghost" tone="neutral" @click="toggleDock(false)">Close</JButton>
            </div>
            <div class="j-shell__dock-body" style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-muted)">
              <JStack gap="inline">
                <div>[00:24.11] @jenni/core compiled 16 shell layouts (0ms overshoot verified)</div>
                <div>[00:24.18] Container queries bound: j-shell, j-bento, j-docs, j-auth, j-ai-canvas</div>
                <div style="color: var(--j-fg)">[00:24.22] Ready — interactive preview mounted cleanly.</div>
              </JStack>
            </div>
          </template>

          <template #aside>
            <div style="padding: var(--j-space-4)">
              <JStack gap="field">
                <div style="font-size: var(--j-text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--j-fg-subtle)">
                  Inspector
                </div>
                <JList variant="divided" lines="compact">
                  <JListItem title="Width">
                    <template #trailing><span>Auto (1fr)</span></template>
                  </JListItem>
                  <JListItem title="Radius">
                    <template #trailing><JKbd size="sm">10px</JKbd></template>
                  </JListItem>
                  <JListItem title="Glide">
                    <template #trailing><JKbd size="sm">300ms</JKbd></template>
                  </JListItem>
                  <JListItem title="Dock">
                    <template #trailing><JBadge size="sm">{{ dockOpen ? 'Open' : 'Hidden' }}</JBadge></template>
                  </JListItem>
                </JList>
              </JStack>
            </div>
          </template>
        </JAppShell>

        <!-- 8. COMMAND CENTER (NOC / Telemetry / Trading Matrix) -->
        <JAppShell
          v-else-if="activeArchetype === 'command-center'"
          ref="shellInstance"
          v-model:sidebar-open="drawerOpen"
          v-model:dock-open="dockOpen"
          v-model:aside-open="asideOpen"
          layout="command-center"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
          :dock-height="132"
        >
          <template #topbar="{ dockOpen: isDockShown, asideOpen: isAsideShown, toggleDock, toggleAside }">
            <JTopBar>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Menu"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <strong style="font-size: var(--j-text-sm)">MISSION OPS</strong>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JBadge size="sm" tone="success" dot>DEFCON 5 · NOMINAL</JBadge>
                </span>
              </template>
              <template #end>
                <JButton size="sm" :variant="isDockShown ? 'soft' : 'ghost'" tone="neutral" :aria-expanded="isDockShown" @click="toggleDock()">
                  Tail
                </JButton>
                <JButton size="sm" :variant="isAsideShown ? 'soft' : 'outline'" tone="neutral" :aria-expanded="isAsideShown" @click="toggleAside()">Alerts (2)</JButton>
              </template>
            </JTopBar>
          </template>

          <template #subbar>
            <JInline gap="item" nowrap style="font-variant-numeric: tabular-nums; font-size: var(--j-text-xs)">
              <span><strong>RPS:</strong> 48,920/s</span>
              <span><strong>p99:</strong> 31.4ms</span>
              <span><strong>ERR:</strong> 0.004%</span>
              <span class="j-shell__compact-hide appshell-compact-hide"><strong>CPU:</strong> 41%</span>
            </JInline>
            <span class="j-shell__compact-hide appshell-compact-hide">
              <JBadge size="sm" variant="soft" tone="info">LIVE 1s WINDOW</JBadge>
            </span>
          </template>

          <template #rail>
            <JSidebarGroup>
              <JSidebarItem label="Matrix" active>
                <template #icon>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
                </template>
              </JSidebarItem>
              <JSidebarItem label="Traces">
                <template #icon>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 4h7M5 8h9M3 12h6"/></svg>
                </template>
              </JSidebarItem>
            </JSidebarGroup>
          </template>

          <JPage size="xl">
            <JGrid :min-cell-width="165" gap="related">
              <JCard size="sm" title="EU-CENTRAL-1" description="19,410 req/s · p95 11.2ms">
                <JProgress :value="68" size="sm" tone="success" />
              </JCard>
              <JCard size="sm" title="US-EAST-1" description="16,880 req/s · p95 14.8ms">
                <JProgress :value="54" size="sm" tone="accent" />
              </JCard>
              <JCard size="sm" title="AP-NORTHEAST-1" description="12,630 req/s · p95 18.1ms">
                <JProgress :value="79" size="sm" tone="warning" />
              </JCard>
            </JGrid>
          </JPage>

          <template #dock>
            <div class="j-shell__dock-header">
              <strong>LIVE EVENT STREAM (TAIL -F)</strong>
              <span>0 dropped packets</span>
            </div>
            <div class="j-shell__dock-body" style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-muted)">
              <div>21:59:40.104 [edge-fra-04] 200 GET /v2/tokens 4.2ms</div>
              <div>21:59:40.218 [edge-iad-11] 200 POST /v2/ telemetry 7.8ms</div>
              <div>21:59:40.402 [edge-hnd-02] 200 GET /v2/health 3.1ms</div>
            </div>
          </template>

          <template #aside="{ closeAside }">
            <div class="j-shell__copilot-header">
              <span>Active Alerts</span>
              <JButton size="sm" variant="ghost" tone="neutral" @click="closeAside()">×</JButton>
            </div>
            <div class="j-shell__copilot-body">
              <JCard size="sm" variant="outline" title="ap-northeast-1 warm-up" description="Autoscaler added +2 workers for Tokyo peak window." />
              <JCard size="sm" variant="outline" title="Cert renewal complete" description="Wildcard *.acme.dev rotated with 90d validity." />
            </div>
          </template>

          <template #statusbar>
            <div class="j-shell__statusbar-group">
              <span>UTC 21:59:41</span>
              <span>·</span>
              <span>26/26 POPs Healthy</span>
            </div>
            <div class="j-shell__statusbar-group">
              <span>Ingest: 1.42 GB/min</span>
            </div>
          </template>
        </JAppShell>

        <!-- 9 & 10. MASTER-DETAIL SPLIT & THREE-PANE (WITH MOBILE DRILL-DOWN) -->
        <JAppShell
          v-else-if="activeArchetype === 'split' || activeArchetype === 'three-pane'"
          v-model:sidebar-open="drawerOpen"
          v-model:active-pane="splitPane"
          :layout="activeArchetype"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
        >
          <template #sidebar>
            <JSidebar :collapsed="activeArchetype === 'split'">
              <template #header>
                <JAvatar initials="IN" size="xs" shape="square" tone="accent" />
                <strong v-if="activeArchetype === 'three-pane'" class="j-sidebar__collapse-hide" style="font-size: var(--j-text-sm); margin-right: auto">Mailboxes</strong>
              </template>
              <JSidebarGroup label="Mail">
                <JSidebarItem label="Inbox" badge="4" active>
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="1.8"/><path d="m2 5.5 6 3.5 6-3.5"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Starred">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m8 2 1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.4l-3.6 1.9.7-4.1-3-2.9 4.1-.6L8 2Z"/></svg>
                  </template>
                </JSidebarItem>
                <JSidebarItem label="Sent">
                  <template #icon>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2 7 9M14 2l-4.5 12-2.5-5-5-2.5L14 2Z"/></svg>
                  </template>
                </JSidebarItem>
              </JSidebarGroup>
            </JSidebar>
          </template>

          <template #topbar>
            <JTopBar>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <strong style="font-size: var(--j-text-sm)">
                  {{ activeArchetype === 'three-pane' ? 'Three-Pane' : 'Triage' }}
                </strong>
                <JBadge size="sm" variant="soft" tone="neutral">{{ threads.length }}</JBadge>
              </template>
              <template #end>
                <JInput size="sm" placeholder="Filter…" style="width: clamp(104px, 22cqi, 170px)" />
              </template>
            </JTopBar>
          </template>

          <template #master>
            <JList variant="divided" lines="3" inset-divider>
              <JListItem
                v-for="t in threads"
                :key="t.id"
                as="button"
                :selected="selectedThread === t.id"
                :title="t.subject"
                :description="t.preview"
                @click="openThread(t.id)"
              >
                <template #leading>
                  <JAvatar :name="t.sender" size="sm" />
                </template>
                <template #trailing>
                  <span>{{ t.time }}</span>
                </template>
              </JListItem>
            </JList>
          </template>

          <JPage size="md">
            <JInline gap="related" class="j-shell__back">
              <JButton size="sm" variant="ghost" tone="neutral" @click="splitPane = 'master'">
                ← Back to Inbox
              </JButton>
            </JInline>
            <JPageHeader
              :eyebrow="`${currentThread.tag} · ${currentThread.time} ago`"
              :title="currentThread.subject"
              bordered
            >
              <template #actions>
                <JButton size="sm" variant="outline" tone="neutral">Archive</JButton>
                <JButton size="sm">Reply</JButton>
              </template>
            </JPageHeader>
            <JStack gap="field">
              <JInline gap="item">
                <JAvatar :name="currentThread.sender" size="sm" />
                <div>
                  <div style="font-size: var(--j-text-sm); font-weight: 600">{{ currentThread.sender }}</div>
                  <div style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">to engineering@acme.dev</div>
                </div>
              </JInline>
              <p style="line-height: 1.6; color: var(--j-fg)">{{ currentThread.preview }}</p>
              <p style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
                Tip: Switch to Compact (390px) above to test single-pane mobile drill-down with the Back button.
              </p>
            </JStack>
          </JPage>
        </JAppShell>

        <!-- 11. HOLY GRAIL 3-COLUMN (Header + Nav + Main + Aside + Footer) -->
        <JAppShell
          v-else-if="activeArchetype === 'holy-grail'"
          ref="shellInstance"
          v-model:sidebar-open="drawerOpen"
          v-model:aside-open="asideOpen"
          layout="holy-grail"
          :variant="shellVariant"
          :sidebar-side="sidebarSide"
          embedded
          :height="shellHeight"
        >
          <template #topbar="{ asideOpen: isAsideShown, toggleAside }">
            <JTopBar sticky>
              <template #start>
                <button
                  type="button"
                  class="j-button j-shell__menu-trigger"
                  data-variant="ghost"
                  data-tone="neutral"
                  data-size="sm"
                  data-shell-toggle
                  aria-label="Menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/></svg>
                </button>
                <JAvatar initials="HG" size="xs" shape="square" tone="accent" />
                <strong style="font-size: var(--j-text-sm)">Docs</strong>
                <span class="j-shell__compact-hide appshell-compact-hide" style="font-size: var(--j-text-sm); font-weight: 600">
                  Portal
                </span>
              </template>
              <template #end>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JInput size="sm" placeholder="Search docs…" style="width: clamp(110px, 20cqi, 160px)" />
                </span>
                <JButton size="sm" :variant="isAsideShown ? 'soft' : 'outline'" tone="neutral" :aria-expanded="isAsideShown" @click="toggleAside()">On This Page</JButton>
              </template>
            </JTopBar>
          </template>

          <template #sidebar>
            <JSidebar>
              <JSidebarGroup label="Architecture">
                <JSidebarItem label="Spatial System" active />
                <JSidebarItem label="OKLCH Color" />
                <JSidebarItem label="Motion Curves" />
                <JSidebarItem label="Container Queries" />
              </JSidebarGroup>
            </JSidebar>
          </template>

          <JPage size="md">
            <JPageHeader
              eyebrow="Canonical 3-Column Architecture"
              title="The Classic Holy Grail Shell"
              description="Full-width header and footer framing a 220px navigation tree, fluid reading stage, and 268px right contextual rail."
              bordered
            />
            <JStack gap="field">
              <p style="color: var(--j-fg-muted); line-height: 1.65; margin: 0">
                Below 1024px, the right table-of-contents rail tucks cleanly into an on-demand slide-over panel; below 720px, the left navigation converts into an off-canvas drawer.
              </p>
              <JCard size="sm" variant="outline" title="Zero Media-Query Fragility" description="Driven purely by @container j-shell so nested portals behave identically to full-screen windows." />
            </JStack>
          </JPage>

          <template #aside="{ closeAside }">
            <div class="j-shell__copilot-header">
              <span>On This Page</span>
              <JButton size="sm" variant="ghost" tone="neutral" @click="closeAside()">×</JButton>
            </div>
            <div class="j-shell__copilot-body">
              <JList variant="plain" lines="compact">
                <JListItem title="1. Base 4px / 8px Grid" selected />
                <JListItem title="2. Density Scale (0.65×–1.15×)" />
                <JListItem title="3. Surface Variants" />
                <JListItem title="4. Container Breakpoints" />
              </JList>
            </div>
          </template>

          <template #statusbar>
            <span>© Northstar Documentation · All systems operational</span>
            <span>Updated 2m ago · Apache-2.0</span>
          </template>
        </JAppShell>

        <!-- 12. FLOATING PILL DOCK + SPATIAL STAGE (FigJam / Freeform / visionOS) -->
        <JAppShell
          v-else-if="activeArchetype === 'floating-dock'"
          ref="shellInstance"
          v-model:aside-open="asideOpen"
          layout="floating-dock"
          :variant="shellVariant"
          embedded
          :height="shellHeight"
        >
          <template #topbar="{ asideOpen: isAsideShown, toggleAside }">
            <JTopBar>
              <template #start>
                <JAvatar initials="SP" size="xs" shape="square" tone="accent" />
                <strong style="font-size: var(--j-text-sm)">System Map</strong>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JBadge size="sm" variant="soft" tone="success">4 Collaborators</JBadge>
                </span>
              </template>
              <template #end>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JBadge size="sm" variant="outline" tone="neutral">0, 0 · 100%</JBadge>
                </span>
                <JButton size="sm" :variant="isAsideShown ? 'soft' : 'outline'" tone="neutral" :aria-expanded="isAsideShown" @click="toggleAside()">
                  Properties
                </JButton>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JButton size="sm">Share</JButton>
                </span>
              </template>
            </JTopBar>
          </template>

          <JPage size="md">
            <JStack gap="group">
              <JGrid :min-cell-width="190" gap="item">
                <JCard variant="elevated" size="sm" title="@jenni/core" description="Tokens + 66 CSS modules + vanilla ARIA behaviors" />
                <JCard variant="elevated" size="sm" title="@jenni/vue" description="Zero-style Vue 3 SFCs · 20.2 kB gzip kit" />
                <JCard variant="elevated" size="sm" title="@jenni/react" description="React 19 native ref · 19.1 kB gzip kit" />
              </JGrid>
            </JStack>
          </JPage>

          <template #aside="{ closeAside }">
            <div class="j-shell__copilot-header">
              <span>Node Properties</span>
              <JButton size="sm" variant="ghost" tone="neutral" @click="closeAside()">×</JButton>
            </div>
            <div class="j-shell__copilot-body">
              <JList variant="divided" lines="compact">
                <JListItem title="Canvas"><template #trailing><span>Dot 20px</span></template></JListItem>
                <JListItem title="Snap"><template #trailing><JKbd size="sm">4px</JKbd></template></JListItem>
                <JListItem title="Active Tool"><template #trailing><JBadge size="sm">{{ activeTool }}</JBadge></template></JListItem>
              </JList>
            </div>
          </template>

          <template #bottombar>
            <JBottomBar aria-label="Canvas tool dock">
              <JBottomBarItem label="Select" :active="activeTool === 'select'" @click="activeTool = 'select'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m5 3 10 7-4.5 1.2L8 16 5 3Z"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Frame" :active="activeTool === 'frame'" @click="activeTool = 'frame'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="12" height="12" rx="2"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Connect" :active="activeTool === 'connect'" @click="activeTool = 'connect'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="5" cy="15" r="2"/><circle cx="15" cy="5" r="2"/><path d="M6.5 13.5 13.5 6.5"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Comment" :active="activeTool === 'comment'" @click="activeTool = 'comment'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h7A2.5 2.5 0 0 1 16 5.5v6a2.5 2.5 0 0 1-2.5 2.5H8l-4 3V5.5Z"/></svg>
                </template>
              </JBottomBarItem>
            </JBottomBar>
          </template>
        </JAppShell>

        <!-- 13. FOCUS / ZEN WIZARD SHELL (Stripe Checkout / Onboarding / Composer) -->
        <JAppShell
          v-else-if="activeArchetype === 'focus'"
          layout="focus"
          :variant="shellVariant"
          embedded
          :height="shellHeight"
        >
          <template #topbar>
            <JTopBar>
              <template #start>
                <JInline gap="inline">
                  <JAvatar initials="WS" size="xs" shape="square" tone="accent" />
                  <span style="font-size: var(--j-text-sm); font-weight: 500">Workspace Setup</span>
                </JInline>
              </template>
              <template #center>
                <JInline gap="related" class="j-shell__compact-hide appshell-compact-hide">
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Step {{ wizardStep }} of 3</span>
                  <JProgress :value="Math.round((wizardStep / 3) * 100)" size="sm" style="width: 96px" />
                </JInline>
              </template>
              <template #end>
                <JButton size="sm" variant="ghost" tone="neutral">Save &amp; Exit</JButton>
              </template>
            </JTopBar>
          </template>

          <JPage size="sm">
            <JPageHeader
              :eyebrow="`Step 0${wizardStep} · Provisioning`"
              :title="
                wizardStep === 1
                  ? 'Name your organization'
                  : wizardStep === 2
                    ? 'Choose primary deployment region'
                    : 'Review & launch workspace'
              "
              description="Focus mode strips away sidebars and secondary chrome, centering a calm 680px column with a pinned bottom action bar."
            />
            <JStack gap="item">
              <JCard
                size="sm"
                interactive
                title="Frankfurt (eu-central-1)"
                description="11 ms median latency · GDPR sovereign storage · Multi-AZ"
              />
              <JCard
                size="sm"
                variant="outline"
                interactive
                title="Virginia (us-east-1)"
                description="14 ms North America · SOC2 Type II · Multi-AZ"
              />
            </JStack>
          </JPage>

          <template #bottombar>
            <JBottomBar variant="actions" sticky>
              <JButton
                size="sm"
                variant="outline"
                tone="neutral"
                :disabled="wizardStep <= 1"
                @click="wizardStep = Math.max(1, wizardStep - 1)"
              >
                ← Back
              </JButton>
              <JButton
                size="sm"
                @click="wizardStep = wizardStep < 3 ? wizardStep + 1 : 1"
              >
                {{ wizardStep < 3 ? 'Continue →' : 'Launch Workspace' }}
              </JButton>
            </JBottomBar>
          </template>
        </JAppShell>

        <!-- 14. TOPNAV + SUBBAR -->
        <JAppShell
          v-else-if="activeArchetype === 'topnav'"
          layout="topnav"
          :variant="shellVariant"
          embedded
          :height="shellHeight"
        >
          <template #topbar>
            <JTopBar sticky>
              <template #start>
                <JAvatar initials="CC" size="xs" shape="square" tone="accent" />
                <strong style="font-size: var(--j-text-sm)">Cloud Console</strong>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JBadge size="sm" variant="outline" tone="neutral">eu-central-1</JBadge>
                </span>
              </template>
              <template #end>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JKbd size="sm">⌘K</JKbd>
                </span>
                <JAvatar name="Ada Lovelace" size="xs" status="online" />
              </template>
            </JTopBar>
          </template>

          <template #subbar>
            <JInline gap="related" nowrap>
              <JButton
                v-for="tab in ['overview', 'deployments', 'domains', 'observability', 'settings']"
                :key="tab"
                size="sm"
                :variant="activeSubbar === tab ? 'soft' : 'ghost'"
                :tone="activeSubbar === tab ? 'accent' : 'neutral'"
                @click="activeSubbar = tab"
              >
                {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
              </JButton>
            </JInline>
            <span class="j-shell__compact-hide appshell-compact-hide">
              <JBadge size="sm" tone="success" dot>All regions operational</JBadge>
            </span>
          </template>

          <JPage size="lg">
            <JPageHeader
              eyebrow="TopNav + SubBar Portal"
              title="Horizontal Cloud Navigation"
              description="Ideal for multi-project portals, analytics suites, and dashboards that favor full horizontal canvas breadth over a left sidebar."
            />
            <JGrid :min-cell-width="200" gap="item">
              <JCard size="sm" title="app.acme.dev" description="Production · 14ms edge TLS" />
              <JCard size="sm" title="docs.acme.dev" description="Documentation · 100% cache hit" />
              <JCard size="sm" title="api.acme.dev" description="Gateway · 4,810 req/s" />
            </JGrid>
          </JPage>
        </JAppShell>

        <!-- 15. CONTENT ONLY / CENTERED -->
        <JAppShell
          v-else-if="activeArchetype === 'centered'"
          layout="centered"
          :variant="shellVariant"
          embedded
          :height="shellHeight"
        >
          <template #topbar>
            <JTopBar sticky translucent>
              <template #start>
                <JAvatar initials="FN" size="xs" shape="square" tone="accent" />
                <strong style="font-size: var(--j-text-sm)">Field Notes</strong>
              </template>
              <template #end>
                <span class="j-shell__compact-hide appshell-compact-hide">
                  <JButton size="sm" variant="ghost" tone="neutral">Changelog</JButton>
                </span>
                <JButton size="sm" variant="outline" tone="neutral">Sign in</JButton>
              </template>
            </JTopBar>
          </template>

          <JPage size="sm">
            <JPageHeader
              eyebrow="Guides · Spatial System"
              title="Designing with Rhythm"
              description="Centered shell without navigation sidebars — ideal for editorial essays, changelogs, and focused reading."
              bordered
            />
            <JContainer size="prose">
              <JStack gap="field">
                <p style="color: var(--j-fg-muted)">
                  Ad-hoc pixel margins are replaced by six semantic relationship tokens — from
                  <code>inline</code> (6px) to <code>section</code> (40px) — scaled uniformly by
                  <code>--j-density</code>.
                </p>
                <JCard size="sm" variant="outline" title="Prose Measure (65ch)" description="Keeps long-form reading effortless on ultrawide monitors while adapting cleanly to compact screens." />
              </JStack>
            </JContainer>
          </JPage>
        </JAppShell>

        <!-- 16. TOP + BOTTOM BARS -->
        <JAppShell
          v-else
          layout="bars"
          :variant="shellVariant"
          embedded
          :height="shellHeight"
        >
          <template #topbar>
            <JTopBar sticky translucent>
              <template #start>
                <strong style="font-size: var(--j-text-sm)">Pulse Mobile</strong>
              </template>
              <template #end>
                <JBadge size="sm" variant="soft" tone="accent">Live</JBadge>
              </template>
            </JTopBar>
          </template>

          <JPage size="sm">
            <JSection title="Today's Activity" description="Scrollable viewport sandwiched between sticky top and bottom chrome.">
              <JList variant="card" lines="2" inset-divider>
                <JListItem
                  v-for="t in threads"
                  :key="t.id"
                  as="button"
                  :title="t.subject"
                  :description="t.preview"
                >
                  <template #leading>
                    <JAvatar :name="t.sender" size="sm" />
                  </template>
                  <template #trailing>
                    <span>{{ t.time }}</span>
                  </template>
                </JListItem>
              </JList>
            </JSection>
          </JPage>

          <template #bottombar>
            <JBottomBar sticky translucent aria-label="App tabs">
              <JBottomBarItem label="Home" :active="activeTab === 'home'" @click="activeTab = 'home'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 9.5 10 3l7 6.5V17H3V9.5Z"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Inbox" badge="3" :active="activeTab === 'inbox'" @click="activeTab = 'inbox'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="14" height="12" rx="2"/><path d="m3 7 7 4.5L17 7"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Search" :active="activeTab === 'search'" @click="activeTab = 'search'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="9" r="5"/><path d="m13 13 4 4"/></svg>
                </template>
              </JBottomBarItem>
              <JBottomBarItem label="Profile" :active="activeTab === 'profile'" @click="activeTab = 'profile'">
                <template #icon>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="7" r="3"/><path d="M4.5 16.5c1.2-2.6 3.2-4 5.5-4s4.3 1.4 5.5 4"/></svg>
                </template>
              </JBottomBarItem>
            </JBottomBar>
          </template>
        </JAppShell>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection
    title="All 16 Shell Archetypes Directory"
    description="Click any archetype card below to load it into the interactive preview stage above."
  >
    <JGrid :min-cell-width="240" gap="item" style="width: 100%">
      <JCard
        v-for="a in archetypes"
        :key="a.id"
        size="sm"
        :variant="activeArchetype === a.id ? 'elevated' : 'outline'"
        interactive
        :title="a.label"
        :description="a.chrome"
        @click="selectLayout(a.id)"
      >
        <JInline gap="inline" justify="between" style="width: 100%">
          <JKbd size="sm">{{ a.id }}</JKbd>
          <JBadge v-if="activeArchetype === a.id" size="sm" tone="accent" dot>Active</JBadge>
        </JInline>
      </JCard>
    </JGrid>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" code-only />
  </DemoSection>
</template>
