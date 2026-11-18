<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref } from 'vue';
import {
  JAvatar,
  JBadge,
  JButton,
  JCard,
  JInput,
  JKbd,
  JProgress,
  JSeparator,
  JSwitch,
} from '@jenni/vue';
import { DemoCode, DemoSection } from '@/kit';
import { DEMO_CONTEXT, sectionId } from '@/kit/context';
import { openCount } from '@/lib/feedback';
import { href } from '@/lib/router';
import Icon from './Icon.vue';
import StatusPill from './StatusPill.vue';

type FamilyId = 'all' | 'shells' | 'multipane' | 'editorial' | 'flows' | 'adaptive' | 'future';
type ViewportPreset = 'desktop' | 'laptop' | 'tablet' | 'mobile';

interface ScreenSpec {
  id: string;
  num: string;
  title: string;
  sectionTitle: string;
  family: Exclude<FamilyId, 'all'>;
  familyLabel: string;
  dims: string;
  collapseRule: string;
  summary: string;
  inspirations: string;
  code: string;
}

const componentName = computed(() => 'Screen Layouts');
const registeredSections = ref<string[]>([]);

provide(DEMO_CONTEXT, {
  component: componentName,
  sections: registeredSections,
  register(title) {
    if (!registeredSections.value.includes(title)) registeredSections.value.push(title);
  },
  unregister(title) {
    registeredSections.value = registeredSections.value.filter((t) => t !== title);
  },
});

const openNotesCount = computed(() => openCount(componentName.value));

const activeFamily = ref<FamilyId>('all');
const globalViewport = ref<ViewportPreset>('desktop');
const showAnatomy = ref(false);

// Near-fullscreen 1:1 modal state
const dialogRef = ref<HTMLDialogElement | null>(null);
const expandedId = ref<string | null>(null);
const modalViewport = ref<ViewportPreset>('desktop');

const families: { id: FamilyId; label: string; count: number }[] = [
  { id: 'all', label: 'All', count: 18 },
  { id: 'shells', label: 'App Shells', count: 4 },
  { id: 'multipane', label: 'Multi-Pane & Studio', count: 4 },
  { id: 'editorial', label: 'Editorial & Docs', count: 3 },
  { id: 'flows', label: 'Flows & Bento', count: 3 },
  { id: 'adaptive', label: 'Mobile & Adaptive', count: 2 },
  { id: 'future', label: 'AI & Spatial Future', count: 2 },
];

const viewports: { id: ViewportPreset; label: string; widthLabel: string; icon: string }[] = [
  { id: 'desktop', label: 'Desktop', widthLabel: '100%', icon: 'monitor' },
  { id: 'laptop', label: 'Laptop', widthLabel: '960px', icon: 'laptop' },
  { id: 'tablet', label: 'Tablet', widthLabel: '720px', icon: 'tablet' },
  { id: 'mobile', label: 'Mobile', widthLabel: '390px', icon: 'smartphone' },
];

const screens: ScreenSpec[] = [
  // FAMILY 1 — APPLICATION & SAAS SHELLS
  {
    id: 'sidebar-canvas',
    num: '01',
    title: 'Sidebar + Canvas',
    sectionTitle: '01 · Sidebar + Canvas',
    family: 'shells',
    familyLabel: 'App Shells',
    dims: '248px Sidebar · 52px TopBar · 1160px Canvas',
    collapseRule: 'Compresses to 60px icon rail on Tablet (720px) and off-canvas drawer on Mobile (390px).',
    summary: 'Persistent 248px navigation rail paired with a scrollable Page canvas, PageHeader, KPI cards, and keyline lists.',
    inspirations: 'Stripe Dashboard · Linear · macOS Settings',
    code: `<JAppShell layout="sidebar">
  <template #sidebar>
    <JSidebar>
      <JSidebarGroup label="Workspace">
        <JSidebarItem label="Overview" active />
        <JSidebarItem label="Deployments" />
        <JSidebarItem label="Observability" />
      </JSidebarGroup>
    </JSidebar>
  </template>
  <template #topbar>
    <JTopBar sticky>Production / Overview</JTopBar>
  </template>
  <JPage size="lg">
    <JPageHeader title="Release Overview" description="Production cluster telemetry." />
    <JGrid :cols="3" gap="group">
      <JCard title="Availability">99.99%</JCard>
      <JCard title="Median Latency">18.4 ms</JCard>
      <JCard title="Deploys (7d)">42</JCard>
    </JGrid>
  </JPage>
</JAppShell>`,
  },
  {
    id: 'inset-island',
    num: '02',
    title: 'Inset Island Shell',
    sectionTitle: '02 · Inset Island Shell',
    family: 'shells',
    familyLabel: 'App Shells',
    dims: '--j-surface-2 Outer Chrome · 8px Inset · Rounded --j-surface-1 Stage',
    collapseRule: 'Outer chrome collapses to top bar on Mobile while preserving subtle elevated sheet framing.',
    summary: 'Recessed --j-surface-2 ambient frame cradling an elevated, tailored-radius --j-surface-1 workspace island.',
    inspirations: 'Linear · Arc · Raycast Cloud',
    code: `<JAppShell layout="sidebar" variant="inset">
  <template #sidebar>
    <JSidebar>
      <JSidebarGroup label="Issues">
        <JSidebarItem label="Active Cycle" badge="4" active />
        <JSidebarItem label="Triage" />
        <JSidebarItem label="Roadmap" />
      </JSidebarGroup>
    </JSidebar>
  </template>
  <JPage size="xl">
    <JList variant="divided" :lines="1" inset-divider>
      <JListItem title="JEN-142 · Calibrate zero-overshoot bezier tokens" />
      <JListItem title="JEN-148 · Keyline inset dividers for list rows" />
    </JList>
  </JPage>
</JAppShell>`,
  },
  {
    id: 'dual-rail',
    num: '03',
    title: 'Tiered Dual-Navigation',
    sectionTitle: '03 · Tiered Dual-Navigation (Rail + Sub-Nav + Canvas)',
    family: 'shells',
    familyLabel: 'App Shells',
    dims: '60px Icon Rail · 220px Contextual Sub-Nav · 1fr Canvas',
    collapseRule: '220px sub-nav hides below 900px while keeping 60px rail; merges into an off-canvas drawer below 720px.',
    summary: 'Global workspace switcher rail (60px) + contextual module sub-tree (220px) + primary workspace stage.',
    inspirations: 'Figma Projects · Slack · GitHub Organizations',
    code: `<JAppShell layout="dual-nav">
  <template #rail>
    <JSidebarGroup>
      <JSidebarItem label="Core System" active />
      <JSidebarItem label="Cloud Fleet" />
    </JSidebarGroup>
  </template>
  <template #subnav>
    <div class="j-shell__subnav-header">Core System</div>
    <JSidebarGroup label="Foundations">
      <JSidebarItem label="Tokens" active />
      <JSidebarItem label="Primitives" />
    </JSidebarGroup>
  </template>
  <JPage size="lg">...</JPage>
</JAppShell>`,
  },
  {
    id: 'top-nav-subbar',
    num: '04',
    title: 'Top Navigation + Sub-Bar + Centered Container',
    sectionTitle: '04 · Top Navigation + Sub-Bar + Centered Container',
    family: 'shells',
    familyLabel: 'App Shells',
    dims: '52px TopBar · 40px Underline SubBar · 1160px Container',
    collapseRule: 'Sub-bar scrolls horizontally on Compact (< 720px); centered container maintains 16px gutters.',
    summary: 'Zero left-rail chrome: global context lives in a 52px header + 40px underline tab bar above a 1160px centered stage.',
    inspirations: 'Vercel · GitHub Repository · Cloudflare',
    code: `<JAppShell layout="topnav">
  <template #topbar>
    <JTopBar sticky>acme / design-tokens</JTopBar>
  </template>
  <template #subbar>
    <JTabs default-value="overview" variant="underline">
      <JTabList aria-label="Project sections">
        <JTab value="overview">Overview</JTab>
        <JTab value="deployments">Deployments</JTab>
        <JTab value="analytics">Analytics</JTab>
      </JTabList>
    </JTabs>
  </template>
  <JPage size="lg">...</JPage>
</JAppShell>`,
  },

  // FAMILY 2 — MULTI-PANE & PRODUCTIVITY
  {
    id: 'master-detail',
    num: '05',
    title: 'Master–Detail Split',
    sectionTitle: '05 · Master–Detail Split (320px List + 1fr Detail)',
    family: 'multipane',
    familyLabel: 'Multi-Pane & Studio',
    dims: '320px Scrollable Master · 1fr Independent Detail',
    collapseRule: 'Below 720px, v-model:active-pane="master | detail" drills from Master list into Detail with a ← Back bar.',
    summary: 'Synchronized dual-scroll split where selecting a row updates the right detail view immediately; drills down on mobile.',
    inspirations: 'Apple Mail · Linear Triage · Superhuman',
    code: `<JAppShell v-model:active-pane="activePane" layout="split">
  <template #master>
    <JList variant="divided" :lines="2" inset-divider>
      <JListItem
        v-for="item in issues"
        :key="item.id"
        as="button"
        :selected="activeId === item.id"
        :title="item.title"
        :description="item.meta"
        @click="selectIssue(item.id)"
      />
    </JList>
  </template>
  <JPage size="md">
    <JPageHeader :title="currentIssue.title" />
  </JPage>
</JAppShell>`,
  },
  {
    id: 'three-pane-triage',
    num: '06',
    title: 'Three-Pane Triage',
    sectionTitle: '06 · Three-Pane Triage (200px Folders + 300px Stream + 1fr Reader)',
    family: 'multipane',
    familyLabel: 'Multi-Pane & Studio',
    dims: '200px Taxonomy · 300px Stream · 1fr Thread Reader',
    collapseRule: 'Compresses 200px Folders to a 60px rail below 1024px, then drills down Master/Detail below 720px.',
    summary: 'High-throughput communication desk balancing folder queues, scannable message stream, and full thread context.',
    inspirations: 'Front · Mimestream · Plain Support',
    code: `<JAppShell v-model:active-pane="activePane" layout="three-pane">
  <template #sidebar>
    <JSidebar aria-label="Mailboxes">
      <JSidebarGroup label="Queues">
        <JSidebarItem label="All Triage" badge="3" active />
        <JSidebarItem label="VIP Accounts" badge="1" />
      </JSidebarGroup>
    </JSidebar>
  </template>
  <template #master>
    <JList variant="divided" :lines="3" inset-divider>...</JList>
  </template>
  <JPage size="md">
    <JPageHeader title="Enterprise SSO certificate rotation" />
    <JStack gap="field">...</JStack>
  </JPage>
</JAppShell>`,
  },
  {
    id: 'ide-studio',
    num: '07',
    title: 'Creative / IDE Studio',
    sectionTitle: '07 · Creative / IDE Studio (Toolbar + Tree + Stage + Inspector + Dock)',
    family: 'multipane',
    familyLabel: 'Multi-Pane & Studio',
    dims: '52px Bar · 60px Rail · 1fr Artboard · 320px Inspector · 156px Dock',
    collapseRule: 'Right inspector slides over as a sheet below 960px; bottom console dock collapses cleanly via v-model:dock-open.',
    summary: 'Full-viewport precision authoring workbench with toggleable right property inspector and bottom diagnostics console.',
    inspirations: 'Figma · Xcode · Cursor · Framer',
    code: `<JAppShell
  v-model:aside-open="inspectorOpen"
  v-model:dock-open="consoleOpen"
  layout="studio"
  :aside-width="320"
  :dock-height="156"
>
  <template #topbar><JTopBar sticky>Studio · Component Spec</JTopBar></template>
  <template #sidebar><JSidebar collapsed aria-label="Tools">...</JSidebar></template>
  <JCanvasStage grid="dots" embedded>...</JCanvasStage>
  <template #dock>
    <div class="j-shell__dock-header">Diagnostics</div>
    <div class="j-shell__dock-body">...</div>
  </template>
  <template #aside>...</template>
</JAppShell>`,
  },
  {
    id: 'kanban-board',
    num: '08',
    title: 'Horizontal Kanban / Swimlane Board',
    sectionTitle: '08 · Horizontal Kanban / Swimlane Board',
    family: 'multipane',
    familyLabel: 'Multi-Pane & Studio',
    dims: 'Locked 100% Height · Fixed Filter Header · 4 × 296px Scroll Lanes',
    collapseRule: 'Outer shell locks vertical scroll; horizontal track pans smoothly across lanes on Tablet and Mobile.',
    summary: 'Viewport-locked spatial board with horizontal column panning and independent vertical card scrolling per status lane.',
    inspirations: 'Linear Board · Jira Next-Gen · Notion Projects',
    code: `<JStack gap="field">
  <JInline justify="between">
    <h3>Cycle 14 · Spatial Architecture</h3>
    <JBadge tone="accent">12 issues</JBadge>
  </JInline>
  <JBoard gap="field" :column-width="296">
    <JBoardColumn v-for="col in lanes" :key="col.id" :title="col.name" :count="col.items.length">
      <JCard v-for="card in col.items" :key="card.id" size="sm" :title="card.title" />
    </JBoardColumn>
  </JBoard>
</JStack>`,
  },

  // FAMILY 3 — EDITORIAL, DOCS & SETTINGS
  {
    id: 'editorial-sidenotes',
    num: '09',
    title: 'Editorial Prose + Margin Sidenotes',
    sectionTitle: '09 · Editorial Prose + Margin Sidenotes',
    family: 'editorial',
    familyLabel: 'Editorial & Docs',
    dims: '2px Reading Hair-Bar · 65ch Prose Measure · 200px Margin Sidenotes',
    collapseRule: 'Margin sidenotes tuck inline beneath paragraphs when container narrows below Medium (1100px).',
    summary: 'Tufte-inspired long-form reading architecture pairing a disciplined 65ch measure with aligned wide-screen margin notes.',
    inspirations: 'Gwern · Stripe Press · Edward Tufte · Distill',
    code: `<JPage size="lg">
  <JProgress :value="68" size="sm" label="Reading progress" />
  <JGrid :cols="12" gap="group">
    <JCol :span="12" :lg="8">
      <JContainer size="prose">
        <h1>On Spatial Calm &amp; Tactile Restraint</h1>
        <p>Good interface architecture is unobtrusive...</p>
      </JContainer>
    </JCol>
    <JCol :span="12" :lg="4">
      <aside aria-label="Margin sidenotes">
        <p>1. Calibrated to cubic-bezier(0.16, 1, 0.3, 1) with 0% overshoot.</p>
      </aside>
    </JCol>
  </JGrid>
</JPage>`,
  },
  {
    id: 'three-col-docs',
    num: '10',
    title: 'Three-Column Documentation',
    sectionTitle: '10 · Three-Column Documentation (Tree + 72ch Article + Sticky TOC)',
    family: 'editorial',
    familyLabel: 'Editorial & Docs',
    dims: '232px Nav Tree · 72ch Technical Article · 200px Sticky TOC',
    collapseRule: '200px "On this page" TOC hides below 1080px; 232px tree collapses below 760px leaving centered 72ch prose.',
    summary: 'Canonical developer documentation shell keeping hierarchy on the left, readable specification in the center, and anchors on the right.',
    inspirations: 'Stripe Docs · VitePress · Mintlify · Nextra',
    code: `<JDocsLayout toc-title="On this page">
  <template #nav>
    <JSidebar aria-label="Documentation">
      <JSidebarGroup label="Foundations">
        <JSidebarItem label="Spatial System" active />
        <JSidebarItem label="Motion Curves" />
      </JSidebarGroup>
    </JSidebar>
  </template>
  <h1>Spatial Tokens</h1>
  <p>Every component gap derives from six semantic relationships...</p>
  <template #toc>
    <JList variant="plain" lines="compact">
      <JListItem title="Overview" />
      <JListItem title="Window Size Classes" selected />
    </JList>
  </template>
</JDocsLayout>`,
  },
  {
    id: 'split-settings',
    num: '11',
    title: 'Split-Section Settings',
    sectionTitle: '11 · Split-Section Settings',
    family: 'editorial',
    familyLabel: 'Editorial & Docs',
    dims: '180px Category Rail · 260px Section Context + 1fr Form Card',
    collapseRule: 'Two-column setting sections stack context above form cards below 720px; category rail becomes horizontal pills on Mobile.',
    summary: 'Asymmetric administrative layout pairing 260px explanatory rationale on the left with structured JCard control groups on the right.',
    inspirations: 'Tailscale Admin · GitHub Settings · WorkOS',
    code: `<JPage size="md">
  <JSection
    layout="split"
    title="Authentication & Passkeys"
    description="Enforce WebAuthn hardware keys across production workspaces."
  >
    <JCard>
      <JStack gap="field">
        <JSwitch v-model="requirePasskey" label="Require hardware passkeys" />
        <JSwitch v-model="sessionPin" label="Strict 12-hour session TTL" />
      </JStack>
    </JCard>
  </JSection>
</JPage>`,
  },

  // FAMILY 4 — FOCUSED FLOWS, AUTH & BENTO DASHBOARDS
  {
    id: 'auth-split',
    num: '12',
    title: 'Split Showcase Authentication',
    sectionTitle: '12 · Split Showcase Authentication (420px Form + 1fr Showcase)',
    family: 'flows',
    familyLabel: 'Flows & Bento',
    dims: 'clamp(320px, 46%, 460px) Auth Column · 1fr Architectural Showcase Stage',
    collapseRule: 'Right showcase panel hides cleanly below 840px, centering the sign-in column with zero distraction.',
    summary: 'High-trust entry experience balancing an uncluttered passkey/SSO form against an editorial product specimen panel.',
    inspirations: 'Stripe Sign-In · Linear · Vercel · Clerk',
    code: `<JAuthSplit>
  <JStack gap="field">
    <h2>Sign in to Workspace</h2>
    <JButton variant="outline">Continue with Passkey</JButton>
    <JSeparator label="or work email" />
    <JInput placeholder="elena@atelier.io" />
    <JButton variant="solid">Continue</JButton>
  </JStack>
  <template #showcase>
    <JCard variant="outline" title="Spatial Release 2.4">...</JCard>
  </template>
</JAuthSplit>`,
  },
  {
    id: 'stepped-wizard',
    num: '13',
    title: 'Stepped Wizard + Sticky Summary',
    sectionTitle: '13 · Stepped Wizard + Sticky Summary',
    family: 'flows',
    familyLabel: 'Flows & Bento',
    dims: '52px Minimal Step Header · 8-Col Form + 4-Col Live Summary · 60px Sticky Footer',
    collapseRule: '4-column live estimate rail stacks cleanly above the sticky bottom action bar below 960px.',
    summary: 'Distraction-free provisioning or checkout flow with progressive step indicator, live cost breakdown rail, and pinned footer CTA.',
    inspirations: 'Fly.io Launch · Stripe Checkout · AWS Proton',
    code: `<JAppShell layout="focus">
  <template #topbar>
    <JTopBar>
      <template #start>Provision Cluster</template>
      <template #center>
        <JStepper v-model="step" size="sm" :steps="[{ title: 'Cluster' }, { title: 'Region' }, { title: 'Review' }]" />
      </template>
    </JTopBar>
  </template>
  <JPage size="lg">
    <JGrid :cols="12" gap="group">
      <JCol :span="12" :lg="8">
        <JCard title="Select Region & Replicas">...</JCard>
      </JCol>
      <JCol :span="12" :lg="4">
        <JCard title="Live Estimate" variant="outline">$148 / mo</JCard>
      </JCol>
    </JGrid>
  </JPage>
  <template #bottombar>
    <JBottomBar variant="actions" sticky>
      <JButton variant="ghost">Back</JButton>
      <JButton variant="solid">Continue</JButton>
    </JBottomBar>
  </template>
</JAppShell>`,
  },
  {
    id: 'bento-dashboard',
    num: '14',
    title: 'Asymmetric 12-Column Bento Dashboard',
    sectionTitle: '14 · Asymmetric 12-Column Bento Dashboard',
    family: 'flows',
    familyLabel: 'Flows & Bento',
    dims: '4 × 3-Col KPIs · 8-Col Primary Chart + 4-Col Feed · 3 × 4-Col Cards',
    collapseRule: 'Reflows deterministically via @container j-bento from 12 cols → 6 cols (< 900px) → 1 stacked col (< 560px).',
    summary: 'Modular 12-column architectural grid combining high-signal KPI tiles, an 8-column primary telemetry curve, and 4-column live feeds.',
    inspirations: 'Apple System Overview · PostHog · Datadog Calm Mode',
    code: `<JBento gap="group">
  <JBentoCell v-for="kpi in kpis" :key="kpi.label" :span="3">
    <JCard :title="kpi.label">{{ kpi.value }}</JCard>
  </JBentoCell>
  <JBentoCell :span="8"><JCard title="Throughput & p95 Latency">...</JCard></JBentoCell>
  <JBentoCell :span="4"><JCard title="Release Stream">...</JCard></JBentoCell>
</JBento>`,
  },

  // FAMILY 5 — MOBILE & ADAPTIVE NAVIGATION
  {
    id: 'adaptive-nav',
    num: '15',
    title: 'Adaptive Navigation Suite',
    sectionTitle: '15 · Adaptive Navigation Suite (Bottom Tabs ↔ Left Rail ↔ Sidebar)',
    family: 'adaptive',
    familyLabel: 'Mobile & Adaptive',
    dims: 'Expanded (≥ 1100px): 248px Sidebar ↔ Medium (720–1099px): 60px Rail ↔ Compact (< 720px): 60px BottomBar',
    collapseRule: 'Single JAppShell layout="adaptive" morphs continuously across ≥ 1100px, 720–1099px, and < 720px container tiers.',
    summary: 'Unified Material 3 navigation grammar presenting a 248px labeled sidebar on desktop, a 60px icon rail on tablet, and a 60px 4-tab bottom bar on mobile.',
    inspirations: 'Material 3 Adaptive · Apple iPadOS / iOS · Spotify',
    code: `<JAppShell layout="adaptive">
  <template #sidebar>
    <JSidebar>
      <JSidebarGroup label="Destinations">
        <JSidebarItem label="Home" active />
        <JSidebarItem label="Explore" />
        <JSidebarItem label="Activity" badge="3" />
        <JSidebarItem label="System" />
      </JSidebarGroup>
    </JSidebar>
  </template>
  <JPage size="md">...</JPage>
  <template #bottombar>
    <JBottomBar variant="tabs" sticky translucent aria-label="Mobile navigation">
      <JBottomBarItem label="Home" active />
      <JBottomBarItem label="Explore" />
      <JBottomBarItem label="Activity" badge="3" />
      <JBottomBarItem label="System" />
    </JBottomBar>
  </template>
</JAppShell>`,
  },
  {
    id: 'scroll-detail-docked',
    num: '16',
    title: 'Scroll Detail + Docked Bottom Action Bar',
    sectionTitle: '16 · Scroll Detail + Docked Bottom Action Bar',
    family: 'adaptive',
    familyLabel: 'Mobile & Adaptive',
    dims: '52px Translucent Sticky Header · Scrollable Specs · 60px Docked Reserve Bar',
    collapseRule: 'On Desktop, specs pair side-by-side; on Mobile, primary price + Reserve CTA dock persistently to the bottom thumb zone.',
    summary: 'Commerce, booking, or hardware detail view with translucent sticky top chrome, calm spec sheet, and a pinned bottom conversion bar.',
    inspirations: 'Airbnb · Teenage Engineering · Apple Store App',
    code: `<JAppShell layout="bars">
  <template #topbar>
    <JTopBar sticky translucent>Atelier Residence · Zurich</JTopBar>
  </template>
  <JPage size="sm">
    <JStack gap="group">...</JStack>
  </JPage>
  <template #bottombar>
    <JBottomBar variant="actions" sticky>
      <span><strong>$240</strong> / night · Oct 14–18</span>
      <JButton variant="solid">Reserve</JButton>
    </JBottomBar>
  </template>
</JAppShell>`,
  },

  // FAMILY 6 — AI, AGENTIC & SPATIAL FUTURE
  {
    id: 'ai-artifact-canvas',
    num: '17',
    title: 'Conversational Thread + Live Artifact Canvas',
    sectionTitle: '17 · Conversational Thread + Live Artifact Canvas',
    family: 'future',
    familyLabel: 'AI & Spatial Future',
    dims: 'Centered 760px Thread → Glides to 420px Chat + 1fr Live Artifact Stage (300ms)',
    collapseRule: 'Artifact opens as a side-by-side stage on ≥ 760px (300ms --j-ease-emphasized) and overlays full-frame below 760px.',
    summary: 'Agentic co-creation workspace where a calm conversational stream + docked composer smoothly parts to reveal a live rendered artifact.',
    inspirations: 'Claude Artifacts · v0 · Cursor Composer · OpenAI Canvas',
    code: `<JAiCanvas v-model:artifact-open="artifactOpen" artifact-title="ReleaseReadiness.vue">
  <JStack gap="field">
    <!-- Conversational message stream -->
  </JStack>
  <template #composer>
    <JInput placeholder="Refine spatial tokens or ask for a variant..." />
  </template>
  <template #artifact>
    <JTabs default-value="preview">...</JTabs>
  </template>
</JAiCanvas>`,
  },
  {
    id: 'spatial-node-canvas',
    num: '18',
    title: 'Ambient Spatial / Node Canvas + Floating Chrome',
    sectionTitle: '18 · Ambient Spatial / Node Canvas + Floating Chrome',
    family: 'future',
    familyLabel: 'AI & Spatial Future',
    dims: 'Dot-Matrix Infinite Stage · Floating Top HUD (⌘K) · Tool Pill · Floating Inspector',
    collapseRule: 'Floating inspector & HUD hide automatically below 760px unless inspectorOpen is explicitly toggled.',
    summary: 'Zero-edge infinite dot-matrix stage with floating translucent command HUD, tool palette pill, connected graph nodes, and inspector card.',
    inspirations: 'Figma Canvas · Kosmik · tldraw · React Flow',
    code: `<JCanvasStage grid="dots" :inspector-open="inspectorOpen">
  <template #top>
    <JInline gap="inline">Pipeline · Token Graph <JKbd size="sm">⌘K</JKbd></JInline>
  </template>
  <template #tools>
    <JButton size="sm" variant="ghost">Select</JButton>
    <JButton size="sm" variant="ghost">Connect</JButton>
  </template>
  <!-- Interactive graph nodes & SVG connectors -->
  <template #inspector>
    <JCard size="sm" title="Selected Node">...</JCard>
  </template>
  <template #hud>100% · Space to pan</template>
</JCanvasStage>`,
  },
];

const filteredScreens = computed(() =>
  activeFamily.value === 'all'
    ? screens
    : screens.filter((s) => s.family === activeFamily.value),
);

const expandedScreen = computed(() =>
  expandedId.value ? screens.find((s) => s.id === expandedId.value) ?? null : null,
);

function vpFor(id: string): ViewportPreset {
  if (expandedId.value === id) return modalViewport.value;
  // Allow Screen 15 local override if set, unless modal is active
  if (id === 'adaptive-nav' && adaptiveOverride.value) return adaptiveOverride.value;
  return globalViewport.value;
}

function openModal(id: string) {
  expandedId.value = id;
  modalViewport.value = globalViewport.value;
  dialogRef.value?.showModal();
}

function closeModal() {
  if (dialogRef.value?.open) dialogRef.value.close();
  expandedId.value = null;
}

function onDialogClose() {
  expandedId.value = null;
}

function onDialogBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) closeModal();
}

function jumpToScreen(sectionTitle: string) {
  document.getElementById(sectionId(sectionTitle))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================================
// Interactive Specimen States (realistic, stateful product micro-interactions)
// ============================================================================

// 01 · Sidebar + Canvas
const s1Nav = ref<'overview' | 'deploys' | 'metrics' | 'team'>('overview');
const s1MobileDrawer = ref(false);

// 02 · Inset Island Shell
const s2Filter = ref<'all' | 'active' | 'review'>('all');
const s2Issues = [
  { code: 'JEN-142', title: 'Calibrate 300ms damped spatial curve ceiling', state: 'active', tag: 'Motion', assignee: 'Elena R.' },
  { code: 'JEN-148', title: 'Align 52px inset divider keyline across JList', state: 'review', tag: 'Layout', assignee: 'Mina P.' },
  { code: 'JEN-151', title: 'Audit dark-mode obsidian surface contrast (18.2% L)', state: 'active', tag: 'Tokens', assignee: 'Theo K.' },
  { code: 'JEN-156', title: 'Add 12-column responsive Bento container queries', state: 'review', tag: 'Grid', assignee: 'Sora L.' },
] as const;
const s2FilteredIssues = computed(() =>
  s2Filter.value === 'all' ? s2Issues : s2Issues.filter((i) => i.state === s2Filter.value),
);

// 03 · Tiered Dual-Navigation
const s3Workspace = ref<'core' | 'cloud' | 'docs'>('core');
const s3SubItem = ref('Tokens & Scales');
const s3Trees: Record<'core' | 'cloud' | 'docs', { name: string; items: string[] }> = {
  core: { name: 'Core Design System', items: ['Tokens & Scales', 'Motion Curves', 'Surface Elevation', 'Accessibility'] },
  cloud: { name: 'Edge Infrastructure', items: ['Global Regions', 'Routing Mesh', 'TLS Certificates', 'Log Drains'] },
  docs: { name: 'Specification Portal', items: ['Architecture', 'Screen Atlas', 'Vue 3 Bindings', 'React 19 Bindings'] },
};
function selectWorkspace(ws: 'core' | 'cloud' | 'docs') {
  s3Workspace.value = ws;
  s3SubItem.value = s3Trees[ws].items[0]!;
}

// 04 · Top Navigation + Sub-Bar
const s4Tab = ref<'overview' | 'deployments' | 'analytics' | 'settings'>('overview');
const s4Search = ref('');

// 05 · Master–Detail Split
const s5Items = [
  {
    id: 'iss-1',
    code: 'ARC-204',
    title: 'Zero-overshoot spring audit on Dialog & Drawer',
    sender: 'Elena Rostova',
    time: '12m',
    tone: 'accent' as const,
    status: 'In Review',
    body: 'Verified all overlay transitions settle asymptotically along cubic-bezier(0.16, 1, 0.3, 1) at 300ms. Peak overshoot measured at 0.00px across 60fps and 120fps ProMotion displays.',
  },
  {
    id: 'iss-2',
    code: 'ARC-199',
    title: 'Canonical 44px coarse-pointer floor verification',
    sender: 'Mina Park',
    time: '48m',
    tone: 'success' as const,
    status: 'Verified',
    body: 'Small toolbar buttons (28px visual box) expand an invisible ::after hit area to 44×44px whenever (pointer: coarse) matches on touch hardware.',
  },
  {
    id: 'iss-3',
    code: 'ARC-193',
    title: 'Keyline alignment between TopBar and PageHeader',
    sender: 'Theo Klein',
    time: '2h',
    tone: 'warning' as const,
    status: 'Triaged',
    body: 'Standardized horizontal page gutter to clamp(16px, 4vw, 40px) so breadcrumbs and H1 titles lock to a single vertical plumb line.',
  },
];
const s5SelectedId = ref('iss-1');
const s5MobileShowDetail = ref(false);
const s5Current = computed(() => s5Items.find((i) => i.id === s5SelectedId.value) ?? s5Items[0]!);
function selectS5(id: string) {
  s5SelectedId.value = id;
  s5MobileShowDetail.value = true;
}

// 06 · Three-Pane Triage
const s6Folder = ref<'inbox' | 'vip' | 'assigned'>('inbox');
const s6ThreadId = ref('t1');
const s6Threads = [
  { id: 't1', folder: 'inbox', from: 'Zurich Studio', subject: 'Q4 Design Token Freeze & Release Cut', snippet: 'All 18 canonical screen specs approved by architecture review...', time: '09:42', unread: true },
  { id: 't2', folder: 'vip', from: 'Clara Vance', subject: 'Enterprise SSO SAML metadata rotation', snippet: 'Rotating primary signing certificate before Friday window...', time: '08:15', unread: false },
  { id: 't3', folder: 'assigned', from: 'Build Bot', subject: 'Bundle budget report: @jenni/core 17.7 kB kit gz', snippet: 'Zero runtime layout overhead; all CSS layers verified...', time: 'Yesterday', unread: false },
];
const s6VisibleThreads = computed(() =>
  s6Folder.value === 'inbox' ? s6Threads : s6Threads.filter((t) => t.folder === s6Folder.value),
);
const s6ActiveThread = computed(
  () => s6VisibleThreads.value.find((t) => t.id === s6ThreadId.value) ?? s6VisibleThreads.value[0] ?? s6Threads[0]!,
);

// 07 · Creative / IDE Studio
const s7Layer = ref<'AppShell' | 'TopBar' | 'BentoCard' | 'ActionPill'>('AppShell');
const s7InspectorOpen = ref(true);
const s7ConsoleOpen = ref(true);
const s7ClipContent = ref(true);

// 08 · Horizontal Kanban Board
const s8Lanes = reactive([
  {
    id: 'backlog',
    name: 'Backlog',
    cards: [
      { id: 'k1', code: 'LAY-11', title: 'Container-query table column priority', tag: 'Data' },
      { id: 'k2', code: 'LAY-14', title: 'Print stylesheet editorial margins', tag: 'Docs' },
    ],
  },
  {
    id: 'progress',
    name: 'In Progress',
    cards: [
      { id: 'k3', code: 'LAY-08', title: 'Adaptive BottomBar safe-area inset', tag: 'Mobile' },
      { id: 'k4', code: 'LAY-09', title: 'Split-pane keyboard resize handle', tag: 'Studio' },
      { id: 'k5', code: 'LAY-10', title: 'Sticky sub-header backdrop blur token', tag: 'Chrome' },
    ],
  },
  {
    id: 'review',
    name: 'In Review',
    cards: [
      { id: 'k6', code: 'LAY-04', title: '12-column Bento span helpers', tag: 'Grid' },
      { id: 'k7', code: 'LAY-06', title: 'AI Artifact 300ms split stage', tag: 'Agentic' },
    ],
  },
  {
    id: 'shipped',
    name: 'Shipped',
    cards: [
      { id: 'k8', code: 'LAY-01', title: 'Zero-bounce motion token contract', tag: 'Core' },
      { id: 'k9', code: 'LAY-02', title: '4px / 8px density multiplier scale', tag: 'Core' },
    ],
  },
]);

function advanceCard(laneIdx: number, cardIdx: number) {
  const nextIdx = (laneIdx + 1) % s8Lanes.length;
  const [moved] = s8Lanes[laneIdx]!.cards.splice(cardIdx, 1);
  if (moved) s8Lanes[nextIdx]!.cards.unshift(moved);
}

// 10 · Three-Column Documentation
const s10TocActive = ref<'overview' | 'measures' | 'breakpoints'>('measures');

// 11 · Split-Section Settings
const s11Category = ref<'general' | 'security' | 'api'>('security');
const s11Passkeys = ref(true);
const s11StrictTtl = ref(true);
const s11AuditStream = ref(false);
const s11OrgName = ref('Spatial Architecture Lab');

// 12 · Split Showcase Auth
const s12Email = ref('elena@studio.design');

// 13 · Stepped Wizard + Sticky Summary
const s13Step = ref<1 | 2 | 3>(2);
const s13Region = ref<'fra' | 'iad' | 'hnd'>('fra');
const s13DedicatedVpc = ref(true);
const s13MultiAz = ref(true);
const s13MonthlyTotal = computed(() => {
  let base = 96;
  if (s13DedicatedVpc.value) base += 32;
  if (s13MultiAz.value) base += 48;
  return base;
});

// 15 · Adaptive Navigation Suite
const adaptiveOverride = ref<ViewportPreset | null>(null);
const s15ActiveTab = ref<'home' | 'explore' | 'activity' | 'profile'>('home');
const s15NavItems = [
  { id: 'home' as const, label: 'Home', icon: 'home', count: 0 },
  { id: 'explore' as const, label: 'Explore', icon: 'compass', count: 0 },
  { id: 'activity' as const, label: 'Activity', icon: 'inbox', count: 3 },
  { id: 'profile' as const, label: 'System', icon: 'layers', count: 0 },
];

// 16 · Scroll Detail + Docked Bottom Action Bar
const s16Suite = ref<'studio' | 'atelier'>('atelier');
const s16Reserved = ref(false);

// 17 · Conversational Thread + Live Artifact Canvas
const s17ArtifactOpen = ref(true);
const s17ArtifactTab = ref<'preview' | 'tokens'>('preview');
const s17Prompt = ref('');

// 18 · Ambient Spatial / Node Canvas + Floating Chrome
const s18Tool = ref<'select' | 'node' | 'connect'>('select');
const s18SelectedNode = ref<'tokens' | 'engine' | 'surfaces'>('engine');
const s18Nodes = {
  tokens: { title: 'OKLCH Token Graph', kind: 'Source · 48 vars', latency: '0.0 ms', note: 'Light/dark neutral & accent ramps + 4px/8px spatial scale.' },
  engine: { title: 'Damped Motion & Layout CSS', kind: '12-Comp Kit · 17.7 kB gz', latency: '0.2 ms', note: 'Zero-overshoot cubic-bezier(0.16, 1, 0.3, 1) + container queries.' },
  surfaces: { title: '18 Screen Architectures', kind: 'Vue 3 · React 19', latency: '1.1 ms', note: 'App shells, multi-pane studios, docs, bento, and AI canvases.' },
} as const;

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && expandedId.value) {
    closeModal();
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <article class="pg-page is-wide pg-sc" :data-anatomy="showAnatomy">
    <!-- =====================================================================
         PAGE HEADER
    ====================================================================== -->
    <header class="pg-page__head">
      <p class="pg-eyebrow">Foundations · Interactive Architecture Atlas</p>
      <div class="pg-page__title-row">
        <h1 class="pg-page__title">Screen Layouts</h1>
        <StatusPill status="stable" />
        <span class="pg-ls-density-pill">
          <Icon name="screens" :size="13" />
          <code>18 Canonical Architectures · 6 Families</code>
        </span>
        <span v-if="openNotesCount" class="pg-pill is-notes">
          <Icon name="message" :size="12" /> {{ openNotesCount }} open
        </span>
      </div>
      <p class="pg-page__lede">
        Every application screen is a spatial contract between navigation chrome, primary focus, and peripheral context.
        Explore all <strong>18 canonical screen architectures</strong> — from classic SaaS shells and multi-pane IDEs to
        Tufte sidenote essays, 12-column bento grids, adaptive mobile bars, and agentic AI artifact canvases.
        Switch viewports live, inspect structural dimensions, or expand any screen <strong>1:1</strong>.
      </p>
      <div class="pg-sc-crosslink">
        <span>Built on tokens &amp; proportions from the</span>
        <a :href="href('layout')">Layout &amp; Spatial System specification →</a>
        <span>· Explore all 16 <code>JAppShell</code> archetypes × 4 variants in the</span>
        <a :href="href('app-shell')">Interactive AppShell Lab →</a>
      </div>
    </header>

    <!-- =====================================================================
         STICKY STUDIO CONTROLS BAR
    ====================================================================== -->
    <div class="pg-sc-studio-bar" role="region" aria-label="Screen studio controls">
      <div class="pg-sc-studio-bar__top">
        <!-- Family Filter Tabs -->
        <div class="pg-sc-family-tabs" role="tablist" aria-label="Screen layout families">
          <button
            v-for="f in families"
            :key="f.id"
            type="button"
            role="tab"
            class="pg-sc-family-tab"
            :aria-selected="activeFamily === f.id"
            @click="activeFamily = f.id"
          >
            <span>{{ f.label }}</span>
            <span class="pg-sc-family-tab__count">{{ f.count }}</span>
          </button>
        </div>

        <!-- Viewport Switcher + Anatomy Switch -->
        <div class="pg-sc-studio-bar__controls">
          <div class="pg-segmented" role="radiogroup" aria-label="Global viewport width">
            <button
              v-for="vp in viewports"
              :key="vp.id"
              type="button"
              role="radio"
              :aria-checked="globalViewport === vp.id"
              @click="globalViewport = vp.id; adaptiveOverride = null"
            >
              <span class="pg-sc-vp-btn">
                <Icon :name="vp.icon" :size="13" />
                <span>{{ vp.label }}</span>
                <small>{{ vp.widthLabel }}</small>
              </span>
            </button>
          </div>

          <div class="pg-sc-anatomy-toggle">
            <JSwitch v-model="showAnatomy" size="sm">Anatomy &amp; dimensions</JSwitch>
          </div>
        </div>
      </div>

      <!-- Quick Jump Strip -->
      <div class="pg-sc-jump-strip" aria-label="Jump to screen layout">
        <button
          v-for="s in filteredScreens"
          :key="s.id"
          type="button"
          class="pg-sc-jump-chip"
          @click="jumpToScreen(s.sectionTitle)"
        >
          <code>{{ s.num }}</code>
          <span>{{ s.title }}</span>
        </button>
      </div>
    </div>

    <!-- =====================================================================
         NEAR-FULLSCREEN 1:1 MODAL DIALOG (Teleport Host)
    ====================================================================== -->
    <dialog
      ref="dialogRef"
      class="pg-sc-modal"
      :data-anatomy="showAnatomy"
      aria-label="1:1 Screen Architecture Preview"
      @close="onDialogClose"
      @click="onDialogBackdropClick"
    >
      <div class="pg-sc-modal__inner">
        <header v-if="expandedScreen" class="pg-sc-modal__bar">
          <div class="pg-sc-modal__title-group">
            <span class="pg-sc-num-pill">{{ expandedScreen.num }}</span>
            <div>
              <h2 class="pg-sc-modal__title">{{ expandedScreen.title }}</h2>
              <p class="pg-sc-modal__dims">{{ expandedScreen.dims }}</p>
            </div>
          </div>

          <div class="pg-sc-modal__controls">
            <div class="pg-segmented" role="radiogroup" aria-label="1:1 modal viewport width">
              <button
                v-for="vp in viewports"
                :key="vp.id"
                type="button"
                role="radio"
                :aria-checked="modalViewport === vp.id"
                @click="modalViewport = vp.id"
              >
                <span class="pg-sc-vp-btn">
                  <Icon :name="vp.icon" :size="13" />
                  <span>{{ vp.label }}</span>
                  <small>{{ vp.widthLabel }}</small>
                </span>
              </button>
            </div>

            <JSwitch v-model="showAnatomy" size="sm">Dimensions</JSwitch>

            <button type="button" class="pg-btn" data-variant="outline" data-size="sm" @click="closeModal">
              <Icon name="minimize" :size="13" /> Close <JKbd size="sm">Esc</JKbd>
            </button>
          </div>
        </header>

        <div id="pg-sc-modal-stage" class="pg-sc-modal__stage" />
      </div>
    </dialog>

    <!-- =====================================================================
         18 CANONICAL SCREEN ARCHITECTURES (Individual DemoSections)
    ====================================================================== -->
    <div class="pg-demo pg-sc-list">
      <DemoSection
        v-for="s in filteredScreens"
        :key="s.id"
        :title="s.sectionTitle"
        :description="s.summary"
      >
        <div class="pg-sc-card">
          <!-- Meta & Actions Strip -->
          <div class="pg-sc-meta-bar">
            <div class="pg-sc-meta-bar__left">
              <JBadge tone="accent" size="sm">{{ s.familyLabel }}</JBadge>
              <code class="pg-sc-dims-pill">{{ s.dims }}</code>
              <span class="pg-sc-insp">{{ s.inspirations }}</span>
            </div>
            <div class="pg-sc-meta-bar__right">
              <!-- Extra quick-morph helper on #15 Adaptive Navigation -->
              <div v-if="s.id === 'adaptive-nav'" class="pg-segmented">
                <button
                  type="button"
                  :aria-checked="vpFor(s.id) === 'desktop'"
                  @click="adaptiveOverride = 'desktop'"
                >Sidebar</button>
                <button
                  type="button"
                  :aria-checked="vpFor(s.id) === 'tablet'"
                  @click="adaptiveOverride = 'tablet'"
                >Rail</button>
                <button
                  type="button"
                  :aria-checked="vpFor(s.id) === 'mobile'"
                  @click="adaptiveOverride = 'mobile'"
                >Bottom Bar</button>
              </div>

              <button
                type="button"
                class="pg-btn"
                data-variant="outline"
                data-size="sm"
                @click="openModal(s.id)"
              >
                <Icon name="expand" :size="13" /> Expand 1:1
              </button>
            </div>
          </div>

          <!-- Specimen Stage Host (reserves height while teleported to 1:1 modal) -->
          <div class="pg-sc-stage-well">
            <div v-if="expandedId === s.id" class="pg-sc-teleported-placeholder">
              <Icon name="expand" :size="18" />
              <span>Previewing <strong>{{ s.title }}</strong> in 1:1 full-window studio…</span>
            </div>

            <Teleport defer to="#pg-sc-modal-stage" :disabled="expandedId !== s.id">
              <div
                class="pg-sc-viewport"
                :data-vp="vpFor(s.id)"
                :data-modal="expandedId === s.id || undefined"
              >
                <!-- Window Chrome Header (subtle architectural titlebar) -->
                <div class="pg-sc-winbar">
                  <div class="pg-sc-winbar__dots" aria-hidden="true">
                    <span /><span /><span />
                  </div>
                  <span class="pg-sc-winbar__url">
                    studio.app / {{ s.id }} · <em>{{ vpFor(s.id) }}</em>
                  </span>
                  <span class="pg-sc-winbar__size">
                    {{ vpFor(s.id) === 'desktop' ? 'Fluid 100%' : vpFor(s.id) === 'laptop' ? '960px' : vpFor(s.id) === 'tablet' ? '720px' : '390px' }}
                  </span>
                </div>

                <!-- =========================================================
                     SPECIMEN 01: SIDEBAR + CANVAS
                ========================================================== -->
                <div v-if="s.id === 'sidebar-canvas'" class="sc-app sc-01" :data-vp="vpFor(s.id)">
                  <!-- Desktop Sidebar (248px) or Tablet Rail (60px) -->
                  <aside v-if="vpFor(s.id) === 'desktop' || vpFor(s.id) === 'laptop'" class="sc-pane sc-sidebar">
                    <span class="sc-dim">248px nav</span>
                    <div class="sc-brand-row">
                      <span class="sc-logo-pip" />
                      <strong>Northstar Cloud</strong>
                      <JBadge size="sm" tone="neutral" variant="outline">Prod</JBadge>
                    </div>
                    <div class="sc-nav-stack">
                      <button
                        v-for="item in [
                          { id: 'overview', label: 'Overview', icon: 'home' },
                          { id: 'deploys', label: 'Deployments', icon: 'layers' },
                          { id: 'metrics', label: 'Observability', icon: 'sliders' },
                          { id: 'team', label: 'Team & Access', icon: 'lock' },
                        ]"
                        :key="item.id"
                        type="button"
                        class="sc-nav-btn"
                        :data-active="s1Nav === item.id"
                        @click="s1Nav = item.id as typeof s1Nav"
                      >
                        <Icon :name="item.icon" :size="14" />
                        <span>{{ item.label }}</span>
                      </button>
                    </div>
                    <div class="sc-sidebar-foot">
                      <JAvatar name="Elena Rostova" size="xs" status="online" />
                      <span>Elena Rostova</span>
                    </div>
                  </aside>

                  <aside v-else-if="vpFor(s.id) === 'tablet'" class="sc-pane sc-rail">
                    <span class="sc-dim">60px rail</span>
                    <span class="sc-logo-pip" />
                    <button
                      v-for="item in [
                        { id: 'overview', icon: 'home' },
                        { id: 'deploys', icon: 'layers' },
                        { id: 'metrics', icon: 'sliders' },
                        { id: 'team', icon: 'lock' },
                      ]"
                      :key="item.id"
                      type="button"
                      class="sc-rail-btn"
                      :data-active="s1Nav === item.id"
                      @click="s1Nav = item.id as typeof s1Nav"
                    >
                      <Icon :name="item.icon" :size="15" />
                    </button>
                  </aside>

                  <!-- Mobile Off-Canvas Drawer Overlay -->
                  <div v-if="vpFor(s.id) === 'mobile' && s1MobileDrawer" class="sc-drawer-backdrop" @click.self="s1MobileDrawer = false">
                    <aside class="sc-drawer">
                      <div class="sc-brand-row">
                        <strong>Northstar Cloud</strong>
                        <button type="button" class="sc-mini-btn" @click="s1MobileDrawer = false">Close</button>
                      </div>
                      <button
                        v-for="item in ['overview', 'deploys', 'metrics', 'team']"
                        :key="item"
                        type="button"
                        class="sc-nav-btn"
                        :data-active="s1Nav === item"
                        @click="s1Nav = item as typeof s1Nav; s1MobileDrawer = false"
                      >
                        {{ item[0]!.toUpperCase() + item.slice(1) }}
                      </button>
                    </aside>
                  </div>

                  <div class="sc-col">
                    <header class="sc-topbar">
                      <span class="sc-dim is-right">52px topbar</span>
                      <div class="sc-row">
                        <button
                          v-if="vpFor(s.id) === 'mobile'"
                          type="button"
                          class="sc-mini-btn"
                          @click="s1MobileDrawer = true"
                        >
                          ☰ Menu
                        </button>
                        <span class="sc-crumb">Production / <strong>{{ s1Nav[0]!.toUpperCase() + s1Nav.slice(1) }}</strong></span>
                      </div>
                      <JButton size="sm" variant="solid">New release</JButton>
                    </header>

                    <div class="sc-canvas">
                      <span class="sc-dim">1160px canvas</span>
                      <div class="sc-page-head">
                        <div>
                          <h4>Cluster Telemetry · eu-central-1</h4>
                          <p>Zero-downtime rolling releases across 14 edge PoPs.</p>
                        </div>
                        <JBadge tone="success" dot>All healthy</JBadge>
                      </div>

                      <div class="sc-kpi-row" :data-cols="vpFor(s.id) === 'mobile' ? 1 : 3">
                        <div class="sc-metric-card">
                          <span>Availability (30d)</span>
                          <strong>99.994%</strong>
                          <small class="is-up">+0.012% vs SLA</small>
                        </div>
                        <div class="sc-metric-card">
                          <span>p95 Edge Latency</span>
                          <strong>18.4 ms</strong>
                          <small>Target &lt; 25 ms</small>
                        </div>
                        <div class="sc-metric-card">
                          <span>Release Cadence</span>
                          <strong>42 / wk</strong>
                          <small>0 rollbacks</small>
                        </div>
                      </div>

                      <div class="sc-list-box">
                        <div class="sc-list-row">
                          <span class="sc-status-pip is-ok" />
                          <div class="sc-list-row__main">
                            <strong>v2.14.0 · Calibrate spatial grid tokens</strong>
                            <span>Deployed 14m ago by Elena R. · 4f8a1c9</span>
                          </div>
                          <JBadge size="sm" tone="success">Live</JBadge>
                        </div>
                        <div class="sc-list-row">
                          <span class="sc-status-pip is-ok" />
                          <div class="sc-list-row__main">
                            <strong>v2.13.8 · Keyline list divider alignment</strong>
                            <span>Deployed 3h ago by Mina P. · 9b20e4d</span>
                          </div>
                          <JBadge size="sm" tone="neutral" variant="outline">Previous</JBadge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 02: INSET ISLAND SHELL
                ========================================================== -->
                <div v-else-if="s.id === 'inset-island'" class="sc-app sc-02" :data-vp="vpFor(s.id)">
                  <span class="sc-dim">--j-surface-2 outer (8px inset)</span>
                  <aside v-if="vpFor(s.id) !== 'mobile'" class="sc-02__nav">
                    <div class="sc-brand-row">
                      <span class="sc-logo-pip" />
                      <strong>Atelier</strong>
                      <JKbd size="sm">⌘K</JKbd>
                    </div>
                    <div class="sc-nav-stack">
                      <div class="sc-nav-btn" data-active="true">
                        <Icon name="inbox" :size="14" /> <span>Active Cycle</span>
                        <span class="sc-count-chip">4</span>
                      </div>
                      <div class="sc-nav-btn"><Icon name="compass" :size="14" /> <span>Roadmap</span></div>
                      <div class="sc-nav-btn"><Icon name="layers" :size="14" /> <span>Views</span></div>
                    </div>
                  </aside>

                  <section class="sc-02__island">
                    <span class="sc-dim is-right">rounded --j-surface-1 island</span>
                    <header class="sc-02__head">
                      <div class="sc-row">
                        <strong>Cycle 14 · Spatial Polish</strong>
                        <JBadge size="sm" tone="accent">{{ s2FilteredIssues.length }}</JBadge>
                      </div>
                      <div class="pg-segmented">
                        <button type="button" :aria-checked="s2Filter === 'all'" @click="s2Filter = 'all'">All</button>
                        <button type="button" :aria-checked="s2Filter === 'active'" @click="s2Filter = 'active'">Active</button>
                        <button type="button" :aria-checked="s2Filter === 'review'" @click="s2Filter = 'review'">Review</button>
                      </div>
                    </header>

                    <div class="sc-02__rows">
                      <div v-for="iss in s2FilteredIssues" :key="iss.code" class="sc-issue-row">
                        <code class="sc-issue-code">{{ iss.code }}</code>
                        <span class="sc-issue-title">{{ iss.title }}</span>
                        <JBadge size="sm" :tone="iss.state === 'active' ? 'info' : 'success'" variant="soft">
                          {{ iss.tag }}
                        </JBadge>
                        <span class="sc-issue-who">{{ iss.assignee }}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <!-- =========================================================
                     SPECIMEN 03: TIERED DUAL-NAVIGATION
                ========================================================== -->
                <div v-else-if="s.id === 'dual-rail'" class="sc-app sc-03" :data-vp="vpFor(s.id)">
                  <!-- 60px Workspace Icon Rail -->
                  <aside class="sc-pane sc-rail">
                    <span class="sc-dim">60px rail</span>
                    <button
                      v-for="ws in [
                        { id: 'core', label: 'DS', icon: 'layers' },
                        { id: 'cloud', label: 'CL', icon: 'monitor' },
                        { id: 'docs', label: 'DC', icon: 'book' },
                      ]"
                      :key="ws.id"
                      type="button"
                      class="sc-ws-icon"
                      :data-active="s3Workspace === ws.id"
                      :title="ws.id"
                      @click="selectWorkspace(ws.id as 'core' | 'cloud' | 'docs')"
                    >
                      <Icon :name="ws.icon" :size="15" />
                    </button>
                  </aside>

                  <!-- 210px Contextual Sub-Navigation -->
                  <aside v-if="vpFor(s.id) === 'desktop' || vpFor(s.id) === 'laptop'" class="sc-pane sc-subnav">
                    <span class="sc-dim">210px sub-nav</span>
                    <p class="sc-subnav__title">{{ s3Trees[s3Workspace].name }}</p>
                    <button
                      v-for="item in s3Trees[s3Workspace].items"
                      :key="item"
                      type="button"
                      class="sc-nav-btn"
                      :data-active="s3SubItem === item"
                      @click="s3SubItem = item"
                    >
                      <span>{{ item }}</span>
                    </button>
                  </aside>

                  <!-- Primary Stage -->
                  <div class="sc-col">
                    <header class="sc-topbar">
                      <span class="sc-crumb">{{ s3Trees[s3Workspace].name }} / <strong>{{ s3SubItem }}</strong></span>
                      <JBadge size="sm" tone="info">Synced</JBadge>
                    </header>
                    <div class="sc-canvas">
                      <span class="sc-dim is-right">1fr contextual stage</span>
                      <div v-if="vpFor(s.id) === 'tablet' || vpFor(s.id) === 'mobile'" class="sc-inline-pills">
                        <button
                          v-for="item in s3Trees[s3Workspace].items"
                          :key="item"
                          type="button"
                          class="sc-chip-btn"
                          :data-active="s3SubItem === item"
                          @click="s3SubItem = item"
                        >{{ item }}</button>
                      </div>
                      <JCard :title="s3SubItem" description="Contextual workspace scoped to the selected global rail module.">
                        <div class="sc-token-preview-grid">
                          <div class="sc-token-chip"><code>--j-hue</code><strong>262°</strong></div>
                          <div class="sc-token-chip"><code>--j-density</code><strong>1.00×</strong></div>
                          <div class="sc-token-chip"><code>--j-ease-out</code><strong>0% bounce</strong></div>
                        </div>
                      </JCard>
                    </div>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 04: TOP NAV + SUB-BAR + CENTERED CONTAINER
                ========================================================== -->
                <div v-else-if="s.id === 'top-nav-subbar'" class="sc-app sc-04" :data-vp="vpFor(s.id)">
                  <header class="sc-topbar">
                    <span class="sc-dim">52px topbar</span>
                    <div class="sc-row">
                      <span class="sc-logo-pip" />
                      <span class="sc-crumb">acme-org / <strong>core-tokens</strong></span>
                      <JBadge size="sm" tone="success" dot>Production</JBadge>
                    </div>
                    <div class="sc-row">
                      <JInput v-if="vpFor(s.id) !== 'mobile'" v-model="s4Search" size="sm" placeholder="Jump to resource…" />
                      <JAvatar name="Mina Park" size="xs" />
                    </div>
                  </header>

                  <nav class="sc-subbar" aria-label="Project sections">
                    <span class="sc-dim is-right">40px subbar</span>
                    <button
                      v-for="t in ['overview', 'deployments', 'analytics', 'settings'] as const"
                      :key="t"
                      type="button"
                      class="sc-underline-tab"
                      :data-active="s4Tab === t"
                      @click="s4Tab = t"
                    >
                      {{ t[0]!.toUpperCase() + t.slice(1) }}
                    </button>
                  </nav>

                  <div class="sc-04__body">
                    <div class="sc-04__container">
                      <span class="sc-dim">1160px centered container</span>
                      <div class="sc-04__grid" :data-stack="vpFor(s.id) === 'mobile'">
                        <JCard :title="`core-tokens.acme.dev · ${s4Tab}`" description="Canonical CSS custom properties & zero-runtime primitives.">
                          <div class="sc-kv-list">
                            <div><span>Branch</span><code>main @ 8e31c0a</code></div>
                            <div><span>Build time</span><code>410 ms</code></div>
                            <div><span>12-comp kit</span><code>17.7 kB gzip</code></div>
                          </div>
                        </JCard>
                        <JCard title="Edge Traffic (24h)" description="Zero 5xx responses across 18 regions.">
                          <div class="sc-bars-mini" aria-hidden="true">
                            <span style="height: 48%" /><span style="height: 62%" /><span style="height: 55%" />
                            <span style="height: 78%" /><span style="height: 84%" /><span style="height: 72%" />
                            <span style="height: 92%" /><span style="height: 88%" />
                          </div>
                        </JCard>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 05: MASTER–DETAIL SPLIT
                ========================================================== -->
                <div v-else-if="s.id === 'master-detail'" class="sc-app sc-05" :data-vp="vpFor(s.id)">
                  <!-- Master List (hidden on Mobile when Detail is drilled into) -->
                  <section
                    v-if="vpFor(s.id) !== 'mobile' || !s5MobileShowDetail"
                    class="sc-pane sc-master"
                  >
                    <span class="sc-dim">300px master</span>
                    <div class="sc-pane-head">
                      <strong>Architecture Queue</strong>
                      <JBadge size="sm" tone="neutral">{{ s5Items.length }}</JBadge>
                    </div>
                    <div class="sc-master-list">
                      <button
                        v-for="item in s5Items"
                        :key="item.id"
                        type="button"
                        class="sc-master-item"
                        :data-selected="s5SelectedId === item.id"
                        @click="selectS5(item.id)"
                      >
                        <div class="sc-master-item__top">
                          <code>{{ item.code }}</code>
                          <span>{{ item.time }}</span>
                        </div>
                        <strong>{{ item.title }}</strong>
                        <span class="sc-master-item__sub">{{ item.sender }} · {{ item.status }}</span>
                      </button>
                    </div>
                  </section>

                  <!-- Fluid Detail Pane -->
                  <section
                    v-if="vpFor(s.id) !== 'mobile' || s5MobileShowDetail"
                    class="sc-detail"
                  >
                    <span class="sc-dim is-right">1fr detail</span>
                    <header class="sc-topbar">
                      <div class="sc-row">
                        <button
                          v-if="vpFor(s.id) === 'mobile'"
                          type="button"
                          class="sc-mini-btn"
                          @click="s5MobileShowDetail = false"
                        >
                          <Icon name="arrow-left" :size="13" /> Back
                        </button>
                        <code>{{ s5Current.code }}</code>
                        <JBadge size="sm" :tone="s5Current.tone" dot>{{ s5Current.status }}</JBadge>
                      </div>
                      <JButton size="sm" variant="outline">Approve spec</JButton>
                    </header>

                    <div class="sc-detail__body">
                      <h4>{{ s5Current.title }}</h4>
                      <div class="sc-author-row">
                        <JAvatar :name="s5Current.sender" size="xs" />
                        <span><strong>{{ s5Current.sender }}</strong> · Updated {{ s5Current.time }} ago</span>
                      </div>
                      <p class="sc-prose-p">{{ s5Current.body }}</p>
                      <div class="sc-spec-callout">
                        <span>Contract check:</span>
                        <code>cubic-bezier(0.16, 1, 0.3, 1) · 0.0% overshoot</code>
                      </div>
                    </div>
                  </section>
                </div>

                <!-- =========================================================
                     SPECIMEN 06: THREE-PANE TRIAGE
                ========================================================== -->
                <div v-else-if="s.id === 'three-pane-triage'" class="sc-app sc-06" :data-vp="vpFor(s.id)">
                  <!-- Pane 1: 200px Folders (Desktop / Laptop only) -->
                  <aside v-if="vpFor(s.id) === 'desktop' || vpFor(s.id) === 'laptop'" class="sc-pane sc-folders">
                    <span class="sc-dim">200px folders</span>
                    <p class="sc-subnav__title">Queues</p>
                    <button
                      v-for="f in [
                        { id: 'inbox', label: 'All Triage', count: 3 },
                        { id: 'vip', label: 'VIP Accounts', count: 1 },
                        { id: 'assigned', label: 'Automated', count: 1 },
                      ]"
                      :key="f.id"
                      type="button"
                      class="sc-nav-btn"
                      :data-active="s6Folder === f.id"
                      @click="s6Folder = f.id as typeof s6Folder"
                    >
                      <span>{{ f.label }}</span>
                      <span class="sc-count-chip">{{ f.count }}</span>
                    </button>
                  </aside>

                  <!-- Pane 2: 300px Stream (Hidden on Mobile to show Reader cleanly, or toggleable) -->
                  <section v-if="vpFor(s.id) !== 'mobile'" class="sc-pane sc-stream">
                    <span class="sc-dim">300px stream</span>
                    <div class="sc-pane-head">
                      <strong>Messages</strong>
                      <span class="pg-muted">{{ s6VisibleThreads.length }} threads</span>
                    </div>
                    <button
                      v-for="th in s6VisibleThreads"
                      :key="th.id"
                      type="button"
                      class="sc-master-item"
                      :data-selected="s6ActiveThread.id === th.id"
                      @click="s6ThreadId = th.id"
                    >
                      <div class="sc-master-item__top">
                        <strong>{{ th.from }}</strong>
                        <span>{{ th.time }}</span>
                      </div>
                      <span class="sc-stream-subj">{{ th.subject }}</span>
                      <span class="sc-master-item__sub">{{ th.snippet }}</span>
                    </button>
                  </section>

                  <!-- Pane 3: 1fr Thread Reader -->
                  <section class="sc-detail">
                    <span class="sc-dim is-right">1fr reader</span>
                    <header class="sc-topbar">
                      <strong>{{ s6ActiveThread.subject }}</strong>
                      <JBadge size="sm" tone="info">SLA 2h</JBadge>
                    </header>
                    <div class="sc-detail__body">
                      <div class="sc-author-row">
                        <JAvatar :name="s6ActiveThread.from" size="xs" />
                        <span><strong>{{ s6ActiveThread.from }}</strong> · {{ s6ActiveThread.time }}</span>
                      </div>
                      <p class="sc-prose-p">{{ s6ActiveThread.snippet }} Please confirm sign-off before the 18:00 UTC release window.</p>
                      <div class="sc-reply-box">
                        <span>Reply to {{ s6ActiveThread.from }}…</span>
                        <JButton size="sm" variant="solid">Send <JKbd size="sm">⌘↵</JKbd></JButton>
                      </div>
                    </div>
                  </section>
                </div>

                <!-- =========================================================
                     SPECIMEN 07: CREATIVE / IDE STUDIO
                ========================================================== -->
                <div v-else-if="s.id === 'ide-studio'" class="sc-app sc-07" :data-vp="vpFor(s.id)">
                  <header class="sc-topbar sc-07__bar">
                    <span class="sc-dim">52px toolbar</span>
                    <div class="sc-row">
                      <Icon name="columns" :size="14" />
                      <strong>Design Studio</strong>
                      <JBadge size="sm" tone="neutral" variant="outline">{{ s7Layer }}</JBadge>
                    </div>
                    <div class="sc-row">
                      <button
                        type="button"
                        class="sc-mini-btn"
                        :data-active="s7ConsoleOpen"
                        @click="s7ConsoleOpen = !s7ConsoleOpen"
                      >
                        <Icon name="terminal" :size="12" /> Console
                      </button>
                      <button
                        v-if="vpFor(s.id) !== 'mobile'"
                        type="button"
                        class="sc-mini-btn"
                        :data-active="s7InspectorOpen"
                        @click="s7InspectorOpen = !s7InspectorOpen"
                      >
                        <Icon name="panel" :size="12" /> Inspector
                      </button>
                    </div>
                  </header>

                  <div class="sc-07__body">
                    <!-- Left Component Tree -->
                    <aside v-if="vpFor(s.id) !== 'mobile'" class="sc-pane sc-07__tree">
                      <span class="sc-dim">60px rail</span>
                      <p class="sc-subnav__title">Layers</p>
                      <button
                        v-for="l in ['AppShell', 'TopBar', 'BentoCard', 'ActionPill'] as const"
                        :key="l"
                        type="button"
                        class="sc-nav-btn"
                        :data-active="s7Layer === l"
                        @click="s7Layer = l"
                      >
                        <code>◇</code> <span>{{ l }}</span>
                      </button>
                    </aside>

                    <!-- Center Stage + Collapsible Bottom Console -->
                    <div class="sc-07__center">
                      <div class="sc-07__artboard">
                        <span class="sc-dim">1fr canvas stage</span>
                        <div class="sc-artboard-frame">
                          <span class="sc-artboard-tag">{{ s7Layer }} · 100%</span>
                          <div class="sc-artboard-specimen">
                            <strong>{{ s7Layer }}</strong>
                            <span>Radius: 10px · Hairline: 1px oklch</span>
                          </div>
                        </div>
                      </div>

                      <div v-if="s7ConsoleOpen" class="sc-07__console">
                        <span class="sc-dim is-right">156px dock</span>
                        <div class="sc-console-line"><span>12:04:08</span> <code>✓ @jenni/core</code> compiled 18 layout rules in 38 ms</div>
                        <div class="sc-console-line"><span>12:04:09</span> <code>✓ a11y</code> contrast ≥ 7.2:1 AAA verified on {{ s7Layer }}</div>
                      </div>
                    </div>

                    <!-- Right Property Inspector -->
                    <aside v-if="s7InspectorOpen && vpFor(s.id) !== 'mobile'" class="sc-pane sc-07__inspector">
                      <span class="sc-dim is-right">320px inspector</span>
                      <p class="sc-subnav__title">Properties · {{ s7Layer }}</p>
                      <div class="sc-prop-grid">
                        <div><span>W</span><code>1160</code></div>
                        <div><span>H</span><code>Auto</code></div>
                        <div><span>Pad</span><code>24px</code></div>
                        <div><span>Gap</span><code>16px</code></div>
                      </div>
                      <JSeparator />
                      <JSwitch v-model="s7ClipContent" size="sm">Clip overflow</JSwitch>
                    </aside>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 08: HORIZONTAL KANBAN / SWIMLANE BOARD
                ========================================================== -->
                <div v-else-if="s.id === 'kanban-board'" class="sc-app sc-08" :data-vp="vpFor(s.id)">
                  <header class="sc-topbar">
                    <div class="sc-row">
                      <strong>Spatial Architecture Board</strong>
                      <JBadge size="sm" tone="accent">Cycle 14</JBadge>
                    </div>
                    <span class="pg-muted" style="font-size: 11px">Click → on any card to advance lane</span>
                  </header>

                  <div class="sc-08__track">
                    <span class="sc-dim">4 × 240px lanes · horizontal pan + independent vertical scroll</span>
                    <section v-for="(lane, lIdx) in s8Lanes" :key="lane.id" class="sc-08__lane">
                      <header class="sc-08__lane-head">
                        <strong>{{ lane.name }}</strong>
                        <span class="sc-count-chip">{{ lane.cards.length }}</span>
                      </header>
                      <div class="sc-08__cards">
                        <div v-for="(c, cIdx) in lane.cards" :key="c.id" class="sc-kanban-card">
                          <div class="sc-kanban-card__top">
                            <code>{{ c.code }}</code>
                            <button
                              type="button"
                              class="sc-kanban-move"
                              title="Advance to next column"
                              @click="advanceCard(lIdx, cIdx)"
                            >→</button>
                          </div>
                          <p>{{ c.title }}</p>
                          <JBadge size="sm" tone="neutral" variant="outline">{{ c.tag }}</JBadge>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 09: EDITORIAL PROSE + MARGIN SIDENOTES
                ========================================================== -->
                <div v-else-if="s.id === 'editorial-sidenotes'" class="sc-app sc-09" :data-vp="vpFor(s.id)">
                  <div class="sc-09__progress">
                    <JProgress :value="68" size="sm" label="Reading progress" />
                    <span class="sc-dim">2px reading progress</span>
                  </div>

                  <div class="sc-09__sheet">
                    <div class="sc-09__prose">
                      <span class="sc-dim">65ch prose measure</span>
                      <p class="sc-eyebrow">Essay · Spatial Monograph No. 04</p>
                      <h3>Less, But With Better Proportions</h3>
                      <p>
                        Interfaces age gracefully when every surface earns its keep. Rather than decorating panes with heavy
                        drop shadows or springy theatrics<sup>1</sup>, mature software relies on quiet typographic hierarchy,
                        deterministic keylines, and calm luminance steps.
                      </p>
                      <p>
                        When line length stays near sixty-five characters<sup>2</sup>, the eye returns effortlessly to the
                        left axis on every newline without losing vertical rhythm.
                      </p>
                    </div>

                    <aside class="sc-09__sidenotes">
                      <span class="sc-dim is-right">200px sidenotes</span>
                      <div class="sc-sidenote">
                        <strong>1 · Motion ceiling</strong>
                        <p>All spatial transitions clamp strictly to 1.00 target progress with 0.0% overshoot.</p>
                      </div>
                      <div class="sc-sidenote">
                        <strong>2 · Measure token</strong>
                        <p>Defined globally in @jenni/core as <code>--j-measure-prose: 65ch</code>.</p>
                      </div>
                    </aside>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 10: THREE-COLUMN DOCUMENTATION
                ========================================================== -->
                <div v-else-if="s.id === 'three-col-docs'" class="sc-app sc-10" :data-vp="vpFor(s.id)">
                  <!-- Left 220px Docs Tree (Hides on Mobile) -->
                  <aside v-if="vpFor(s.id) !== 'mobile'" class="sc-pane sc-10__tree">
                    <span class="sc-dim">210px tree</span>
                    <p class="sc-subnav__title">Foundations</p>
                    <div class="sc-nav-btn">Introduction</div>
                    <div class="sc-nav-btn" data-active="true">Spatial System</div>
                    <div class="sc-nav-btn">Motion Curves</div>
                    <p class="sc-subnav__title">Shells</p>
                    <div class="sc-nav-btn">JAppShell</div>
                    <div class="sc-nav-btn">JDocsLayout</div>
                  </aside>

                  <!-- Center 70ch Technical Article -->
                  <div class="sc-10__article">
                    <span class="sc-dim">70ch article</span>
                    <p class="sc-eyebrow">Foundations / Spatial System</p>
                    <h4>Window Size Classes &amp; Keylines</h4>
                    <p class="sc-prose-p">
                      Viewport widths map into four deterministic window classes so sidebars, rails, and inspectors
                      adapt without layout thrash.
                    </p>
                    <div class="sc-doc-table">
                      <div><code>Compact</code><span>&lt; 720px</span><span>16px gutter · BottomBar</span></div>
                      <div><code>Medium</code><span>720–1099px</span><span>24px gutter · 60px Rail</span></div>
                      <div><code>Expanded</code><span>1100–1439px</span><span>32px gutter · 248px Sidebar</span></div>
                      <div><code>Large</code><span>≥ 1440px</span><span>40px gutter · Sidebar + 320px Aside</span></div>
                    </div>
                  </div>

                  <!-- Right 180px Sticky TOC (Desktop & Laptop only) -->
                  <aside v-if="vpFor(s.id) === 'desktop' || vpFor(s.id) === 'laptop'" class="sc-10__toc">
                    <span class="sc-dim is-right">170px sticky TOC</span>
                    <p class="sc-subnav__title">On this page</p>
                    <button
                      v-for="sec in [
                        { id: 'overview', label: 'Overview' },
                        { id: 'measures', label: 'Content measures' },
                        { id: 'breakpoints', label: 'Window classes' },
                      ] as const"
                      :key="sec.id"
                      type="button"
                      class="sc-toc-link"
                      :data-active="s10TocActive === sec.id"
                      @click="s10TocActive = sec.id"
                    >
                      {{ sec.label }}
                    </button>
                  </aside>
                </div>

                <!-- =========================================================
                     SPECIMEN 11: SPLIT-SECTION SETTINGS
                ========================================================== -->
                <div v-else-if="s.id === 'split-settings'" class="sc-app sc-11" :data-vp="vpFor(s.id)">
                  <aside v-if="vpFor(s.id) !== 'mobile'" class="sc-pane sc-11__rail">
                    <span class="sc-dim">170px rail</span>
                    <button
                      v-for="cat in [
                        { id: 'general', label: 'General' },
                        { id: 'security', label: 'Security & Keys' },
                        { id: 'api', label: 'API & Webhooks' },
                      ] as const"
                      :key="cat.id"
                      type="button"
                      class="sc-nav-btn"
                      :data-active="s11Category === cat.id"
                      @click="s11Category = cat.id"
                    >
                      {{ cat.label }}
                    </button>
                  </aside>

                  <div class="sc-11__body">
                    <div class="sc-11__split" :data-stack="vpFor(s.id) === 'mobile' || vpFor(s.id) === 'tablet'">
                      <div class="sc-11__explain">
                        <span class="sc-dim">220px context</span>
                        <h4>Workspace Identity</h4>
                        <p>Displayed across release artifacts, invoices, and shared design links.</p>
                      </div>
                      <JCard>
                        <span class="sc-dim is-right">1fr form card</span>
                        <div class="sc-form-stack">
                          <label class="sc-label">Organization name</label>
                          <JInput v-model="s11OrgName" size="sm" />
                        </div>
                      </JCard>
                    </div>

                    <JSeparator />

                    <div class="sc-11__split" :data-stack="vpFor(s.id) === 'mobile' || vpFor(s.id) === 'tablet'">
                      <div class="sc-11__explain">
                        <h4>Hardware Security</h4>
                        <p>Require FIDO2 WebAuthn passkeys before promoting builds to production.</p>
                      </div>
                      <JCard>
                        <div class="sc-form-stack">
                          <JSwitch v-model="s11Passkeys" size="sm">Enforce WebAuthn passkeys</JSwitch>
                          <JSwitch v-model="s11StrictTtl" size="sm">12-hour strict session renewal</JSwitch>
                          <JSwitch v-model="s11AuditStream" size="sm">Stream signed audit events</JSwitch>
                        </div>
                      </JCard>
                    </div>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 12: SPLIT SHOWCASE AUTHENTICATION
                ========================================================== -->
                <div v-else-if="s.id === 'auth-split'" class="sc-app sc-12" :data-vp="vpFor(s.id)">
                  <section class="sc-12__form-pane">
                    <span class="sc-dim">420px sign-in column</span>
                    <div class="sc-12__form-box">
                      <div class="sc-row">
                        <span class="sc-logo-pip" />
                        <strong>northstar</strong>
                      </div>
                      <h4>Sign in to your workspace</h4>
                      <p class="sc-prose-p">Authenticate with a hardware passkey or work address.</p>
                      <JButton variant="outline" size="sm">
                        <Icon name="lock" :size="13" /> Continue with Passkey
                      </JButton>
                      <JSeparator label="or email" />
                      <JInput v-model="s12Email" size="sm" placeholder="name@company.com" />
                      <JButton variant="solid" size="sm">Continue →</JButton>
                    </div>
                  </section>

                  <section v-if="vpFor(s.id) !== 'mobile'" class="sc-12__showcase">
                    <span class="sc-dim is-right">1fr editorial showcase</span>
                    <div class="sc-12__artifact">
                      <JBadge size="sm" tone="accent">Spatial Release 2.4</JBadge>
                      <blockquote>
                        “Every hairline, radius, and 220ms transition feels milled from a single block of anodized aluminum.”
                      </blockquote>
                      <div class="sc-author-row">
                        <JAvatar name="Dieter Studio" size="xs" />
                        <span><strong>Architecture Team</strong> · Zurich &amp; Kyoto</span>
                      </div>
                    </div>
                  </section>
                </div>

                <!-- =========================================================
                     SPECIMEN 13: STEPPED WIZARD + STICKY SUMMARY
                ========================================================== -->
                <div v-else-if="s.id === 'stepped-wizard'" class="sc-app sc-13" :data-vp="vpFor(s.id)">
                  <header class="sc-13__header">
                    <span class="sc-dim">64px step bar</span>
                    <div class="sc-steps">
                      <button
                        v-for="st in [
                          { n: 1 as const, label: 'Cluster' },
                          { n: 2 as const, label: 'Region & Network' },
                          { n: 3 as const, label: 'Review' },
                        ]"
                        :key="st.n"
                        type="button"
                        class="sc-step-pill"
                        :data-active="s13Step === st.n"
                        :data-done="s13Step > st.n"
                        @click="s13Step = st.n"
                      >
                        <span class="sc-step-num">{{ s13Step > st.n ? '✓' : st.n }}</span>
                        <span>{{ st.label }}</span>
                      </button>
                    </div>
                  </header>

                  <div class="sc-13__body" :data-stack="vpFor(s.id) === 'mobile' || vpFor(s.id) === 'tablet'">
                    <div class="sc-13__main">
                      <span class="sc-dim">1fr wizard form</span>
                      <h4>Step {{ s13Step }} · {{ s13Step === 1 ? 'Cluster Tier' : s13Step === 2 ? 'Primary Edge Region' : 'Confirm Provisioning' }}</h4>
                      <div class="sc-region-grid">
                        <button
                          v-for="r in [
                            { id: 'fra' as const, name: 'Frankfurt · eu-central', ping: '9 ms' },
                            { id: 'iad' as const, name: 'Virginia · us-east', ping: '24 ms' },
                            { id: 'hnd' as const, name: 'Tokyo · ap-northeast', ping: '42 ms' },
                          ]"
                          :key="r.id"
                          type="button"
                          class="sc-region-card"
                          :data-selected="s13Region === r.id"
                          @click="s13Region = r.id"
                        >
                          <strong>{{ r.name }}</strong>
                          <code>{{ r.ping }}</code>
                        </button>
                      </div>
                      <div class="sc-form-stack">
                        <JSwitch v-model="s13DedicatedVpc" size="sm">Dedicated private VPC (+$32/mo)</JSwitch>
                        <JSwitch v-model="s13MultiAz" size="sm">Multi-AZ failover replica (+$48/mo)</JSwitch>
                      </div>
                    </div>

                    <aside class="sc-13__summary">
                      <span class="sc-dim is-right">260px live summary</span>
                      <p class="sc-subnav__title">Monthly Estimate</p>
                      <div class="sc-summary-price">
                        <strong>${{ s13MonthlyTotal }}</strong>
                        <span>/ month</span>
                      </div>
                      <div class="sc-kv-list">
                        <div><span>Region</span><code>{{ s13Region.toUpperCase() }}</code></div>
                        <div><span>Base NVMe node</span><code>$96</code></div>
                        <div v-if="s13DedicatedVpc"><span>Dedicated VPC</span><code>+$32</code></div>
                        <div v-if="s13MultiAz"><span>Multi-AZ replica</span><code>+$48</code></div>
                      </div>
                    </aside>
                  </div>

                  <footer class="sc-13__footer">
                    <span class="sc-dim">60px sticky action bar</span>
                    <JButton
                      size="sm"
                      variant="ghost"
                      :disabled="s13Step === 1"
                      @click="s13Step = Math.max(1, s13Step - 1) as 1 | 2 | 3"
                    >← Previous</JButton>
                    <JButton
                      size="sm"
                      variant="solid"
                      @click="s13Step = (s13Step < 3 ? s13Step + 1 : 1) as 1 | 2 | 3"
                    >
                      {{ s13Step === 3 ? 'Provision cluster ✓' : 'Continue →' }}
                    </JButton>
                  </footer>
                </div>

                <!-- =========================================================
                     SPECIMEN 14: ASYMMETRIC 12-COLUMN BENTO DASHBOARD
                ========================================================== -->
                <div v-else-if="s.id === 'bento-dashboard'" class="sc-app sc-14" :data-vp="vpFor(s.id)">
                  <span class="sc-dim">12-column bento grid (reflows 12 → 6 → 1)</span>
                  <div class="sc-bento" :data-vp="vpFor(s.id)">
                    <div class="sc-bento-cell is-span-3">
                      <span class="sc-bento-label">Uptime</span>
                      <strong>99.98%</strong>
                    </div>
                    <div class="sc-bento-cell is-span-3">
                      <span class="sc-bento-label">p95 Latency</span>
                      <strong>18.4 ms</strong>
                    </div>
                    <div class="sc-bento-cell is-span-3">
                      <span class="sc-bento-label">Throughput</span>
                      <strong>1.42M/m</strong>
                    </div>
                    <div class="sc-bento-cell is-span-3">
                      <span class="sc-bento-label">MTD Spend</span>
                      <strong>$4,280</strong>
                    </div>

                    <!-- Primary 8-Col Telemetry Curve -->
                    <div class="sc-bento-cell is-span-8">
                      <span class="sc-dim is-right">span-8 primary</span>
                      <div class="sc-row-between">
                        <strong>Global Edge Request Volume &amp; p95 Curve</strong>
                        <JBadge size="sm" tone="success" dot>Nominal</JBadge>
                      </div>
                      <svg class="sc-bento-chart" viewBox="0 0 320 76" fill="none" aria-hidden="true">
                        <path d="M0 62 C40 58, 70 42, 110 44 C150 46, 180 20, 220 24 C260 28, 290 12, 320 14 L320 76 L0 76 Z" fill="var(--j-accent-soft)" />
                        <path d="M0 62 C40 58, 70 42, 110 44 C150 46, 180 20, 220 24 C260 28, 290 12, 320 14" stroke="var(--j-accent)" stroke-width="2" />
                      </svg>
                    </div>

                    <!-- 4-Col Activity Stream -->
                    <div class="sc-bento-cell is-span-4">
                      <span class="sc-dim is-right">span-4 feed</span>
                      <strong>Live Feed</strong>
                      <div class="sc-mini-feed">
                        <div><code>09:41</code><span>eu-central scaled +2</span></div>
                        <div><code>09:18</code><span>TLS cert renewed</span></div>
                        <div><code>08:55</code><span>v2.14 promoted</span></div>
                      </div>
                    </div>

                    <!-- Bottom 3 × 4-Col Cells -->
                    <div class="sc-bento-cell is-span-4">
                      <span class="sc-bento-label">Cache Hit Ratio</span>
                      <strong>96.4%</strong>
                      <JProgress :value="96" size="sm" />
                    </div>
                    <div class="sc-bento-cell is-span-4">
                      <span class="sc-bento-label">Active PoPs</span>
                      <strong>28 / 28</strong>
                      <span class="pg-muted" style="font-size: 11px">Zero degraded routes</span>
                    </div>
                    <div class="sc-bento-cell is-span-4">
                      <span class="sc-bento-label">Security Posture</span>
                      <strong>AAA · Passkey</strong>
                      <span class="pg-muted" style="font-size: 11px">SOC2 continuous</span>
                    </div>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 15: ADAPTIVE NAVIGATION SUITE
                ========================================================== -->
                <div v-else-if="s.id === 'adaptive-nav'" class="sc-app sc-15" :data-vp="vpFor(s.id)">
                  <!-- Desktop / Laptop: 220px Full Labeled Sidebar -->
                  <aside v-if="vpFor(s.id) === 'desktop' || vpFor(s.id) === 'laptop'" class="sc-pane sc-sidebar">
                    <span class="sc-dim">220px sidebar (Desktop)</span>
                    <div class="sc-brand-row">
                      <span class="sc-logo-pip" />
                      <strong>Chronicle</strong>
                    </div>
                    <button
                      v-for="item in s15NavItems"
                      :key="item.id"
                      type="button"
                      class="sc-nav-btn"
                      :data-active="s15ActiveTab === item.id"
                      @click="s15ActiveTab = item.id"
                    >
                      <Icon :name="item.icon" :size="14" />
                      <span>{{ item.label }}</span>
                      <span v-if="item.count" class="sc-count-chip">{{ item.count }}</span>
                    </button>
                  </aside>

                  <!-- Tablet: 60px Icon Rail -->
                  <aside v-else-if="vpFor(s.id) === 'tablet'" class="sc-pane sc-rail">
                    <span class="sc-dim">60px rail (Tablet)</span>
                    <span class="sc-logo-pip" />
                    <button
                      v-for="item in s15NavItems"
                      :key="item.id"
                      type="button"
                      class="sc-rail-btn"
                      :data-active="s15ActiveTab === item.id"
                      @click="s15ActiveTab = item.id"
                    >
                      <Icon :name="item.icon" :size="15" />
                    </button>
                  </aside>

                  <!-- Fluid Content + Mobile Bottom Tab Bar -->
                  <div class="sc-col">
                    <header class="sc-topbar">
                      <strong>{{ s15NavItems.find((i) => i.id === s15ActiveTab)?.label }}</strong>
                      <JBadge size="sm" tone="info">
                        {{ vpFor(s.id) === 'mobile' ? 'Bottom Bar Mode' : vpFor(s.id) === 'tablet' ? 'Icon Rail Mode' : 'Full Sidebar Mode' }}
                      </JBadge>
                    </header>

                    <div class="sc-canvas">
                      <div class="sc-kpi-row" :data-cols="vpFor(s.id) === 'mobile' ? 1 : 2">
                        <JCard title="Adaptive Reach Zone" description="Navigation shifts to bottom thumb arc on 390px Mobile and left rail on 720px Tablet." />
                        <JCard title="Zero Duplicate Markup" description="One navigation array powers Sidebar, Rail, and BottomBar simultaneously." />
                      </div>
                    </div>

                    <!-- Mobile: 60px 4-Tab Docked Bottom Bar -->
                    <nav v-if="vpFor(s.id) === 'mobile'" class="sc-bottom-tabs" aria-label="Mobile navigation">
                      <span class="sc-dim">60px bottom tabs</span>
                      <button
                        v-for="item in s15NavItems"
                        :key="item.id"
                        type="button"
                        class="sc-bottom-tab"
                        :data-active="s15ActiveTab === item.id"
                        @click="s15ActiveTab = item.id"
                      >
                        <Icon :name="item.icon" :size="15" />
                        <span>{{ item.label }}</span>
                      </button>
                    </nav>
                  </div>
                </div>

                <!-- =========================================================
                     SPECIMEN 16: SCROLL DETAIL + DOCKED BOTTOM ACTION BAR
                ========================================================== -->
                <div v-else-if="s.id === 'scroll-detail-docked'" class="sc-app sc-16" :data-vp="vpFor(s.id)">
                  <header class="sc-16__glass-bar">
                    <span class="sc-dim">52px translucent header</span>
                    <div class="sc-row">
                      <Icon name="arrow-left" :size="14" />
                      <strong>Atelier Residence · Zurich</strong>
                    </div>
                    <JBadge size="sm" tone="success">4.98 ★</JBadge>
                  </header>

                  <div class="sc-16__scroll">
                    <div class="sc-16__hero">
                      <div>
                        <p class="sc-eyebrow">Architectural Stay · Seefeld District</p>
                        <h4>Daylight Concrete &amp; White Oak Loft</h4>
                      </div>
                      <JBadge tone="neutral" variant="outline">Max 4 guests</JBadge>
                    </div>

                    <div class="sc-inline-pills">
                      <button
                        type="button"
                        class="sc-chip-btn"
                        :data-active="s16Suite === 'atelier'"
                        @click="s16Suite = 'atelier'"
                      >Atelier Loft · $240</button>
                      <button
                        type="button"
                        class="sc-chip-btn"
                        :data-active="s16Suite === 'studio'"
                        @click="s16Suite = 'studio'"
                      >Garden Studio · $195</button>
                    </div>

                    <div class="sc-kv-list">
                      <div><span>Check-in</span><code>Self passkey · 15:00</code></div>
                      <div><span>Acoustics</span><code>Triple-glazed · 28 dBA</code></div>
                      <div><span>Workspace</span><code>2.4mVitsoe desk + 10Gb fiber</code></div>
                    </div>
                  </div>

                  <footer class="sc-16__dock">
                    <span class="sc-dim is-right">60px docked CTA bar</span>
                    <div class="sc-16__price">
                      <strong>{{ s16Suite === 'atelier' ? '$240' : '$195' }}</strong>
                      <span>/ night · Oct 14–18</span>
                    </div>
                    <JButton
                      size="sm"
                      :variant="s16Reserved ? 'soft' : 'solid'"
                      :tone="s16Reserved ? 'success' : 'accent'"
                      @click="s16Reserved = !s16Reserved"
                    >
                      {{ s16Reserved ? 'Reserved ✓' : 'Reserve dates' }}
                    </JButton>
                  </footer>
                </div>

                <!-- =========================================================
                     SPECIMEN 17: CONVERSATIONAL THREAD + LIVE ARTIFACT CANVAS
                ========================================================== -->
                <div
                  v-else-if="s.id === 'ai-artifact-canvas'"
                  class="sc-app sc-17"
                  :data-artifact="s17ArtifactOpen"
                  :data-vp="vpFor(s.id)"
                >
                  <!-- Conversational Thread + Floating Docked Composer -->
                  <section class="sc-17__chat">
                    <span class="sc-dim">{{ s17ArtifactOpen ? '380px thread' : '680px centered thread' }}</span>
                    <header class="sc-topbar">
                      <div class="sc-row">
                        <Icon name="sparkle" :size="14" />
                        <strong>Workspace Assistant</strong>
                      </div>
                      <button
                        type="button"
                        class="sc-mini-btn"
                        :data-active="s17ArtifactOpen"
                        @click="s17ArtifactOpen = !s17ArtifactOpen"
                      >
                        <Icon name="panel" :size="12" />
                        {{ s17ArtifactOpen ? 'Close Artifact' : 'Open Artifact' }}
                      </button>
                    </header>

                    <div class="sc-17__messages">
                      <div class="sc-msg is-user">
                        Design a calm release readiness card using semantic relationship gaps and zero-bounce progress.
                      </div>
                      <div class="sc-msg is-ai">
                        <p>I composed <code>ReleaseReadiness.vue</code> using <code>--j-gap-field</code> (16px) and <code>--j-surface-1</code>.</p>
                        <button type="button" class="sc-artifact-pill" @click="s17ArtifactOpen = !s17ArtifactOpen">
                          <Icon name="code" :size="13" />
                          <span>ReleaseReadiness · v2</span>
                          <em>{{ s17ArtifactOpen ? 'Hide' : 'Open' }} →</em>
                        </button>
                      </div>
                    </div>

                    <div class="sc-17__composer">
                      <input v-model="s17Prompt" type="text" placeholder="Ask to refine spacing, density, or dark mode…" />
                      <JKbd size="sm">⌘↵</JKbd>
                    </div>
                  </section>

                  <!-- Side-by-Side Live Artifact Stage (glides open at 300ms --j-ease-emphasized) -->
                  <section v-if="s17ArtifactOpen" class="sc-17__artifact">
                    <span class="sc-dim is-right">1fr live artifact stage (300ms glide)</span>
                    <header class="sc-topbar">
                      <div class="pg-segmented">
                        <button type="button" :aria-checked="s17ArtifactTab === 'preview'" @click="s17ArtifactTab = 'preview'">Preview</button>
                        <button type="button" :aria-checked="s17ArtifactTab === 'tokens'" @click="s17ArtifactTab = 'tokens'">Tokens</button>
                      </div>
                      <JBadge size="sm" tone="success" dot>Rendered live</JBadge>
                    </header>

                    <div class="sc-17__stage-body">
                      <JCard v-if="s17ArtifactTab === 'preview'" title="Release v2.14 Readiness" description="All 18 canonical layouts verified.">
                        <div class="sc-form-stack">
                          <JProgress :value="94" size="sm" tone="success" />
                          <div class="sc-row-between">
                            <span class="pg-muted" style="font-size: 11.5px">Zero-overshoot audit</span>
                            <JBadge size="sm" tone="success">Passed</JBadge>
                          </div>
                        </div>
                      </JCard>
                      <div v-else class="sc-kv-list">
                        <div><span>Container</span><code>--j-radius-lg (10px)</code></div>
                        <div><span>Stack rhythm</span><code>--j-gap-field (16px)</code></div>
                        <div><span>Split glide</span><code>300ms cubic-bezier(0.16, 1, 0.3, 1)</code></div>
                      </div>
                    </div>
                  </section>
                </div>

                <!-- =========================================================
                     SPECIMEN 18: AMBIENT SPATIAL / NODE CANVAS + FLOATING CHROME
                ========================================================== -->
                <div v-else-if="s.id === 'spatial-node-canvas'" class="sc-app sc-18" :data-vp="vpFor(s.id)">
                  <span class="sc-dim">infinite dot-matrix stage</span>

                  <!-- Floating Top-Center Command Omnibar -->
                  <div class="sc-18__omnibar">
                    <Icon name="search" :size="13" />
                    <span>Architecture Graph · 3 connected nodes</span>
                    <JKbd size="sm">⌘K</JKbd>
                  </div>

                  <!-- Floating Left Tool Pill -->
                  <div class="sc-18__tools" role="toolbar" aria-label="Canvas tools">
                    <button
                      v-for="tool in [
                        { id: 'select' as const, icon: 'compass' },
                        { id: 'node' as const, icon: 'layers' },
                        { id: 'connect' as const, icon: 'arrow' },
                      ]"
                      :key="tool.id"
                      type="button"
                      class="sc-tool-btn"
                      :data-active="s18Tool === tool.id"
                      @click="s18Tool = tool.id"
                    >
                      <Icon :name="tool.icon" :size="14" />
                    </button>
                  </div>

                  <!-- Connected Nodes Stage -->
                  <div class="sc-18__graph">
                    <svg class="sc-18__edges" viewBox="0 0 520 200" fill="none" aria-hidden="true">
                      <path d="M 145 70 C 185 70, 185 105, 220 105" stroke="var(--j-border-strong)" stroke-width="1.5" />
                      <path d="M 350 105 C 385 105, 385 65, 415 65" stroke="var(--j-accent)" stroke-width="1.5" />
                    </svg>

                    <div class="sc-18__nodes">
                      <button
                        v-for="nid in ['tokens', 'engine', 'surfaces'] as const"
                        :key="nid"
                        type="button"
                        class="sc-node-card"
                        :data-selected="s18SelectedNode === nid"
                        @click="s18SelectedNode = nid"
                      >
                        <div class="sc-node-card__head">
                          <span class="sc-node-port" />
                          <strong>{{ s18Nodes[nid].title }}</strong>
                        </div>
                        <span>{{ s18Nodes[nid].kind }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Floating Right Inspector Card -->
                  <aside class="sc-18__inspector">
                    <span class="sc-dim is-right">floating inspector</span>
                    <div class="sc-row-between">
                      <strong>{{ s18Nodes[s18SelectedNode].title }}</strong>
                      <code>{{ s18Nodes[s18SelectedNode].latency }}</code>
                    </div>
                    <p>{{ s18Nodes[s18SelectedNode].note }}</p>
                  </aside>

                  <div class="sc-18__zoom">100% · Space to pan</div>
                </div>
              </div>
            </Teleport>
          </div>

          <!-- Adaptive Rule Note + Collapsible Composition Code -->
          <div class="pg-sc-foot">
            <p class="pg-sc-collapse-note">
              <strong>Adaptive contract:</strong> {{ s.collapseRule }}
            </p>
            <DemoCode lang="vue" :code="s.code" />
          </div>
        </div>
      </DemoSection>
    </div>
  </article>
</template>
