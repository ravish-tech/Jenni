<script lang="ts">
export const meta = {
  name: 'Docs, Auth & AI Canvas',
  group: 'Layout',
  order: 9,
  description:
    'Future-ready AI conversational artifact workspaces, infinite spatial node stages, 3-column documentation, and split onboarding flows.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JAiCanvas,
  JCanvasStage,
  JDocsLayout,
  JAuthSplit,
  JSidebarGroup,
  JSidebarItem,
  JStack,
  JInline,
  JList,
  JListItem,
  JCard,
  JButton,
  JBadge,
  JAvatar,
  JKbd,
  JField,
  JInput,
  JTextarea,
  JSeparator,
  type JCanvasGrid,
  type JCanvasToolsPlacement,
} from 'jenni-vue';

/* ---- 1. AI Canvas state ---- */
const artifactOpen = ref(true);
const artifactTab = ref<'preview' | 'code'>('preview');
const promptText = ref('');
const messages = ref([
  {
    id: 1,
    role: 'user' as const,
    text: 'Design a pricing summary card using semantic gap tokens and zero-bounce surfaces.',
  },
  {
    id: 2,
    role: 'assistant' as const,
    text: 'Generated PricingArtifact.vue with --j-gap-field vertical rhythm, crisp 1px hairlines, and poised --j-surface-1 elevation. Click the artifact pill or toggle the stage to inspect it.',
    hasArtifact: true,
  },
]);

function sendPrompt() {
  const clean = promptText.value.trim();
  if (!clean) return;
  messages.value.push({ id: Date.now(), role: 'user', text: clean });
  messages.value.push({
    id: Date.now() + 1,
    role: 'assistant',
    text: `Updated PricingArtifact.vue in response to "${clean}". Live stage refreshed.`,
    hasArtifact: true,
  });
  promptText.value = '';
  artifactOpen.value = true;
}

/* ---- 2. Spatial Canvas Stage state ---- */
const canvasGrid = ref<JCanvasGrid>('dots');
const toolsPos = ref<JCanvasToolsPlacement>('left');
const activeTool = ref<'select' | 'frame' | 'connect' | 'comment'>('select');
const selectedNode = ref<'ingest' | 'router' | 'warehouse'>('router');

const nodes = [
  { id: 'ingest' as const, title: 'Edge Ingest', meta: '14.2k msg/s', x: '76px', y: '110px', tone: 'info' as const },
  { id: 'router' as const, title: 'Policy Router', meta: 'p99 4.1 ms', x: '290px', y: '188px', tone: 'accent' as const },
  { id: 'warehouse' as const, title: 'Lakehouse Sink', meta: 'Parquet zstd', x: '290px', y: '320px', tone: 'success' as const },
];

/* ---- 3. Docs Layout state ---- */
const docsWidth = ref<'100%' | '940px' | '640px'>('100%');
const activeToc = ref('tokens');

/* ---- 4. Auth Split state ---- */
const authReverse = ref(false);
const authWidth = ref<'100%' | '520px'>('100%');

const html = `<!-- Conversational + Live Artifact Screen -->
<div class="j-ai-canvas" data-artifact-open data-embedded>
  <div class="j-ai-canvas__thread">
    <div class="j-ai-canvas__messages">
      <div class="j-ai-canvas__stream">…messages…</div>
    </div>
    <div class="j-ai-canvas__composer-wrap">
      <div class="j-ai-canvas__composer">…prompt input…</div>
    </div>
  </div>
  <section class="j-ai-canvas__stage">
    <header class="j-ai-canvas__stage-header">
      <span class="j-ai-canvas__stage-title">PricingArtifact.vue</span>
    </header>
    <div class="j-ai-canvas__stage-body">…live preview…</div>
  </section>
</div>

<!-- Spatial / Infinite Canvas Stage -->
<div class="j-canvas-stage" data-grid="dots" data-embedded>
  <div class="j-canvas-stage__viewport">…nodes…</div>
  <div class="j-canvas-stage__top">…omnibar…</div>
  <div class="j-canvas-stage__tools" role="toolbar">…tools…</div>
  <aside class="j-canvas-stage__inspector">…properties…</aside>
</div>`;
</script>

<template>
  <!-- 1. AI CONVERSATIONAL + LIVE ARTIFACT SCREEN -->
  <DemoSection
    title="Conversational + Live Artifact Screen (JAiCanvas)"
    description="When artifactOpen is false, the thread centers calmly at 760px. When opened, the thread glides (300ms --j-ease-emphasized) to 420px on the left while a rounded --j-surface-1 artifact island opens on the right."
  >
    <JStack gap="field" style="width: 100%">
      <JInline justify="between" style="width: 100%">
        <JInline gap="related">
          <JButton
            size="sm"
            :variant="artifactOpen ? 'solid' : 'outline'"
            :tone="artifactOpen ? 'accent' : 'neutral'"
            @click="artifactOpen = !artifactOpen"
          >
            {{ artifactOpen ? 'Close Artifact Stage' : 'Open Live Artifact Stage' }}
          </JButton>
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
            State: <code>artifact-open="{{ artifactOpen }}"</code>
          </span>
        </JInline>
      </JInline>

      <JAiCanvas
        v-model:artifact-open="artifactOpen"
        artifact-title="PricingArtifact.vue"
        embedded
        :height="520"
      >
        <template #header="{ toggleArtifact }">
          <JInline gap="inline">
            <JAvatar initials="AI" size="xs" shape="square" tone="accent" />
            <strong style="font-size: var(--j-text-sm)">Workspace Agent</strong>
            <JBadge size="sm" variant="soft" tone="neutral">Sonnet · Spatial</JBadge>
          </JInline>
          <JButton size="sm" variant="ghost" tone="neutral" @click="toggleArtifact()">
            {{ artifactOpen ? 'Center Thread' : 'Show Stage' }}
          </JButton>
        </template>

        <div
          v-for="m in messages"
          :key="m.id"
          :style="{
            alignSelf: m.role === 'user' ? 'flex-end' : 'stretch',
            maxWidth: m.role === 'user' ? '82%' : '100%',
            padding: m.role === 'user' ? 'var(--j-space-2) var(--j-space-3)' : '0',
            borderRadius: 'var(--j-radius-lg)',
            backgroundColor: m.role === 'user' ? 'var(--j-surface-3)' : 'transparent',
            fontSize: 'var(--j-text-sm)',
            lineHeight: '1.55',
          }"
        >
          <JStack gap="related">
            <div>{{ m.text }}</div>
            <div v-if="m.hasArtifact">
              <JButton
                size="sm"
                variant="outline"
                tone="accent"
                @click="artifactOpen = !artifactOpen"
              >
                {{ artifactOpen ? 'Viewing PricingArtifact.vue' : 'Open PricingArtifact.vue →' }}
              </JButton>
            </div>
          </JStack>
        </div>

        <template #composer>
          <JTextarea
            v-model="promptText"
            :rows="1"
            placeholder="Ask to refine spacing, add enterprise tier, or inspect tokens…"
            @keydown.meta.enter.prevent="sendPrompt"
          />
          <JInline justify="between">
            <JInline gap="inline">
              <JBadge size="sm" variant="outline" tone="neutral">@tokens.css</JBadge>
              <JKbd size="sm">⌘↵</JKbd>
            </JInline>
            <JButton size="sm" @click="sendPrompt">Send</JButton>
          </JInline>
        </template>

        <template #artifact-actions="{ closeArtifact }">
          <JButton
            size="sm"
            :variant="artifactTab === 'preview' ? 'soft' : 'ghost'"
            :tone="artifactTab === 'preview' ? 'accent' : 'neutral'"
            @click="artifactTab = 'preview'"
          >
            Preview
          </JButton>
          <JButton
            size="sm"
            :variant="artifactTab === 'code' ? 'soft' : 'ghost'"
            :tone="artifactTab === 'code' ? 'accent' : 'neutral'"
            @click="artifactTab = 'code'"
          >
            Markup
          </JButton>
          <JButton size="sm" variant="ghost" tone="neutral" @click="closeArtifact">✕</JButton>
        </template>

        <template #artifact>
          <div v-if="artifactTab === 'preview'">
            <JStack gap="field">
              <JCard
                title="Studio Scale Plan"
                description="Predictable usage-based compute with dedicated regional isolates."
              >
                <JStack gap="field">
                  <JInline align="baseline" gap="inline">
                    <span style="font-size: var(--j-text-3xl); font-weight: 600">$48</span>
                    <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">/ seat / month</span>
                  </JInline>
                  <JSeparator />
                  <JList lines="compact">
                    <JListItem title="Unlimited container-query shells & themes" />
                    <JListItem title="99.99% SLA with multi-region failover" />
                    <JListItem title="SOC2 Type II & SAML SSO included" />
                  </JList>
                  <JInline justify="end" gap="related">
                    <JButton size="sm" variant="outline" tone="neutral">Compare</JButton>
                    <JButton size="sm">Upgrade Workspace</JButton>
                  </JInline>
                </JStack>
              </JCard>
            </JStack>
          </div>
          <pre
            v-else
            style="margin: 0; padding: var(--j-space-4); border-radius: var(--j-radius-md); background: var(--j-surface-2); font-family: var(--j-font-mono); font-size: var(--j-text-xs); overflow-x: auto"
          ><code>&lt;JCard title="Studio Scale Plan"&gt;
  &lt;JStack gap="field"&gt;
    &lt;JList lines="compact"&gt;…&lt;/JList&gt;
    &lt;JInline justify="end" gap="related"&gt;
      &lt;JButton variant="outline"&gt;Compare&lt;/JButton&gt;
      &lt;JButton&gt;Upgrade Workspace&lt;/JButton&gt;
    &lt;/JInline&gt;
  &lt;/JStack&gt;
&lt;/JCard&gt;</code></pre>
        </template>
      </JAiCanvas>
    </JStack>
  </DemoSection>

  <!-- 2. SPATIAL / INFINITE CANVAS STAGE -->
  <DemoSection
    title="Spatial / Node-Editor Stage (JCanvasStage)"
    description="Full-bleed architectural dot or line grid stage with frosted backdrop-filter: blur(12px) floating chrome (#top omnibar, #tools palette, #inspector card, #hud readout)."
  >
    <JStack gap="field" style="width: 100%">
      <JInline justify="between" style="width: 100%">
        <JInline gap="inline">
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Grid:</span>
          <JButton
            v-for="g in (['dots', 'lines', 'none'] as const)"
            :key="g"
            size="sm"
            :variant="canvasGrid === g ? 'soft' : 'ghost'"
            :tone="canvasGrid === g ? 'accent' : 'neutral'"
            @click="canvasGrid = g"
          >
            {{ g }}
          </JButton>
        </JInline>

        <JInline gap="inline">
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Tools dock:</span>
          <JButton
            v-for="pos in (['left', 'bottom'] as const)"
            :key="pos"
            size="sm"
            :variant="toolsPos === pos ? 'soft' : 'ghost'"
            :tone="toolsPos === pos ? 'accent' : 'neutral'"
            @click="toolsPos = pos"
          >
            {{ pos }}
          </JButton>
        </JInline>
      </JInline>

      <JCanvasStage :grid="canvasGrid" :tools-placement="toolsPos" embedded :height="480">
        <!-- SVG connector wires + interactive spatial nodes -->
        <svg
          width="100%"
          height="100%"
          style="position: absolute; inset: 0; pointer-events: none; color: var(--j-border-strong)"
        >
          <path d="M 236 144 C 264 144, 264 220, 290 220" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path d="M 236 144 C 264 144, 264 352, 290 352" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" />
        </svg>

        <div
          v-for="node in nodes"
          :key="node.id"
          role="button"
          tabindex="0"
          :style="{
            position: 'absolute',
            left: node.x,
            top: node.y,
            width: '164px',
            padding: 'var(--j-space-3)',
            borderRadius: 'var(--j-radius-md)',
            backgroundColor: 'var(--j-surface-1)',
            boxShadow:
              selectedNode === node.id
                ? '0 0 0 2px var(--j-accent), var(--j-shadow-md)'
                : '0 0 0 1px var(--j-border), var(--j-shadow-sm)',
            cursor: 'pointer',
            transition: 'box-shadow var(--j-duration-fast) var(--j-ease-out)',
          }"
          @click="selectedNode = node.id"
        >
          <JStack gap="inline">
            <JInline justify="between">
              <strong style="font-size: var(--j-text-xs)">{{ node.title }}</strong>
              <JBadge size="sm" :tone="node.tone" dot />
            </JInline>
            <span style="font-family: var(--j-font-mono); font-size: 11px; color: var(--j-fg-muted)">
              {{ node.meta }}
            </span>
          </JStack>
        </div>

        <template #top>
          <strong style="font-size: var(--j-text-xs)">Streaming Topology</strong>
          <JBadge size="sm" variant="soft" tone="success">Synced</JBadge>
          <JKbd size="sm">⌘K</JKbd>
        </template>

        <template #tools>
          <JButton
            v-for="tool in ([
              { id: 'select', label: 'V' },
              { id: 'frame', label: 'F' },
              { id: 'connect', label: 'C' },
              { id: 'comment', label: 'M' },
            ] as const)"
            :key="tool.id"
            size="sm"
            icon-only
            :variant="activeTool === tool.id ? 'soft' : 'ghost'"
            :tone="activeTool === tool.id ? 'accent' : 'neutral'"
            :title="tool.id"
            @click="activeTool = tool.id"
          >
            {{ tool.label }}
          </JButton>
        </template>

        <template #inspector>
          <div style="font-size: var(--j-text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--j-fg-subtle)">
            Node Inspector
          </div>
          <JField label="Selected node">
            <JInput size="sm" :model-value="nodes.find((n) => n.id === selectedNode)?.title" />
          </JField>
          <JList variant="divided" lines="compact">
            <JListItem title="Concurrency">
              <template #trailing><JKbd size="sm">32x</JKbd></template>
            </JListItem>
            <JListItem title="Backpressure">
              <template #trailing><JBadge size="sm" tone="success">Adaptive</JBadge></template>
            </JListItem>
          </JList>
        </template>

        <template #hud>
          <span>100%</span>
          <span>·</span>
          <span>X: 290 Y: 188</span>
        </template>
      </JCanvasStage>
    </JStack>
  </DemoSection>

  <!-- 3. 3-COLUMN DOCUMENTATION LAYOUT -->
  <DemoSection
    title="3-Column Documentation & Knowledge Base (JDocsLayout)"
    description="Sticky 232px navigation tree + centered 72ch prose column + sticky 200px 'On this page' TOC (TOC hides < 1080px; left nav collapses < 760px)."
  >
    <JStack gap="field" style="width: 100%">
      <JInline justify="end" gap="inline" style="width: 100%">
        <JButton
          v-for="w in ([
            { v: '100%', label: 'Wide 100% (3-col)' },
            { v: '940px', label: 'Laptop 940px (TOC hidden)' },
            { v: '640px', label: 'Reader 640px (Prose only)' },
          ] as const)"
          :key="w.v"
          size="sm"
          :variant="docsWidth === w.v ? 'soft' : 'ghost'"
          :tone="docsWidth === w.v ? 'accent' : 'neutral'"
          @click="docsWidth = w.v"
        >
          {{ w.label }}
        </JButton>
      </JInline>

      <div
        :style="{
          width: '100%',
          maxWidth: docsWidth,
          marginInline: 'auto',
          transition: 'max-width var(--j-duration-slow) var(--j-ease-emphasized)',
        }"
      >
        <JDocsLayout toc-title="On this page" embedded :height="420">
          <template #nav>
            <JSidebarGroup label="Foundations">
              <JSidebarItem label="Design Tokens" active />
              <JSidebarItem label="Spatial System" />
              <JSidebarItem label="Motion & Curves" />
            </JSidebarGroup>
            <JSidebarGroup label="Screen Primitives">
              <JSidebarItem label="AppShell" />
              <JSidebarItem label="Bento & Board" />
              <JSidebarItem label="AI Canvas" />
            </JSidebarGroup>
          </template>

          <JStack gap="inline">
            <span style="font-size: var(--j-text-xs); font-weight: 600; color: var(--j-accent)">
              Foundations
            </span>
            <h2 style="margin: 0; font-size: var(--j-text-2xl); letter-spacing: var(--j-tracking-tight)">
              OKLCH Surfaces & Semantic Rhythm
            </h2>
          </JStack>

          <p style="margin: 0; color: var(--j-fg-muted); line-height: 1.65">
            Every surface derives from four perceptually uniform OKLCH neutral tiers
            (<code>--j-bg</code> through <code>--j-surface-3</code>), ensuring hairline borders and
            inset islands maintain identical contrast across light paper and dark obsidian themes.
          </p>

          <JCard
            size="sm"
            variant="outline"
            title="Zero-Overshoot Motion"
            description="All spatial glides use cubic-bezier(0.16, 1, 0.3, 1) at 300ms — weighted like precision hardware, never rubbery."
          />

          <p style="margin: 0; color: var(--j-fg-muted); line-height: 1.65">
            Container queries let documentation, dashboards, and split readers adapt directly to
            their enclosing pane width rather than assuming ownership of the full browser window.
          </p>

          <template #toc>
            <ul class="j-docs-layout__toc-list">
              <li>
                <a
                  class="j-docs-layout__toc-link"
                  :data-active="activeToc === 'tokens' ? '' : undefined"
                  @click.prevent="activeToc = 'tokens'"
                >
                  Surface Tiers
                </a>
              </li>
              <li>
                <a
                  class="j-docs-layout__toc-link"
                  :data-active="activeToc === 'motion' ? '' : undefined"
                  @click.prevent="activeToc = 'motion'"
                >
                  Weighted Motion
                </a>
              </li>
              <li>
                <a
                  class="j-docs-layout__toc-link"
                  :data-active="activeToc === 'containers' ? '' : undefined"
                  @click.prevent="activeToc = 'containers'"
                >
                  Container Queries
                </a>
              </li>
            </ul>
          </template>
        </JDocsLayout>
      </div>
    </JStack>
  </DemoSection>

  <!-- 4. FOCUSED AUTH / ONBOARDING SPLIT -->
  <DemoSection
    title="Focused Split Sign-In & Onboarding (JAuthSplit)"
    description="Centered form column (380px inner measure) paired with a 1fr --j-surface-2 editorial showcase panel; supports reverse order and collapses cleanly below 840px."
  >
    <JStack gap="field" style="width: 100%">
      <JInline justify="between" style="width: 100%">
        <JButton size="sm" variant="outline" tone="neutral" @click="authReverse = !authReverse">
          {{ authReverse ? 'Order: Showcase Left (reverse)' : 'Order: Form Left (default)' }}
        </JButton>
        <JInline gap="inline">
          <JButton
            size="sm"
            :variant="authWidth === '100%' ? 'soft' : 'ghost'"
            @click="authWidth = '100%'"
          >
            Desktop Split
          </JButton>
          <JButton
            size="sm"
            :variant="authWidth === '520px' ? 'soft' : 'ghost'"
            @click="authWidth = '520px'"
          >
            Compact &lt; 840px
          </JButton>
        </JInline>
      </JInline>

      <div
        :style="{
          width: '100%',
          maxWidth: authWidth,
          marginInline: 'auto',
          transition: 'max-width var(--j-duration-slow) var(--j-ease-emphasized)',
        }"
      >
        <JAuthSplit :reverse="authReverse" embedded :height="460">
          <template #header>
            <JInline gap="inline">
              <JAvatar initials="NS" size="xs" shape="square" tone="accent" />
              <strong style="color: var(--j-fg)">Northstar</strong>
            </JInline>
            <span>Workspace SSO</span>
          </template>

          <JStack gap="field">
            <JStack gap="inline">
              <h3 style="margin: 0; font-size: var(--j-text-xl); letter-spacing: var(--j-tracking-tight)">
                Sign in to your studio
              </h3>
              <p style="margin: 0; font-size: var(--j-text-sm); color: var(--j-fg-muted)">
                Enter your work email to continue with passkey or SAML.
              </p>
            </JStack>

            <JField label="Work email" required>
              <JInput placeholder="ada@analytical.engine" />
            </JField>

            <JButton style="width: 100%">Continue with Passkey</JButton>
          </JStack>

          <template #footer>
            <span>Protected by hardware WebAuthn</span>
            <span>Privacy</span>
          </template>

          <template #showcase>
            <JBadge size="sm" variant="soft" tone="accent" style="align-self: flex-start">
              Architectural UI System
            </JBadge>
            <JStack gap="field">
              <blockquote style="margin: 0; font-size: var(--j-text-xl); font-weight: 500; line-height: 1.4; letter-spacing: var(--j-tracking-tight)">
                “Good design is as little design as possible — calm surfaces, exact keylines, and zero gratuitous motion.”
              </blockquote>
              <JInline gap="item">
                <JAvatar name="Elena Rostova" size="sm" />
                <div>
                  <div style="font-size: var(--j-text-sm); font-weight: 600">Elena Rostova</div>
                  <div style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Principal Systems Designer</div>
                </div>
              </JInline>
            </JStack>
            <JInline gap="related">
              <JBadge size="sm" variant="outline" tone="neutral">18 Screen Archetypes</JBadge>
              <JBadge size="sm" variant="outline" tone="neutral">Core + Vue + React</JBadge>
            </JInline>
          </template>
        </JAuthSplit>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
