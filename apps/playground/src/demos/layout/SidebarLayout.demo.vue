<script lang="ts">
export const meta = {
  name: 'Sidebar Layout',
  group: 'Layout',
  order: 2.5,
  wide: true,
  description:
    'Resizable, collapsible sidebar workspace with open / rail / hidden states, edge hover chevron, right-click edge context menu, localStorage persistence, and context-aware JSidebarToggle.',
  status: 'stable' as const,
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JSidebarLayout,
  JSidebarToggle,
  JToolbar,
  JToolbarSeparator,
  JToolbarSpacer,
  JStack,
  JInline,
  JButton,
  JBadge,
  JIcon,
  JKbd,
  JTooltip,
  type JSidebarState,
} from 'jenni-vue';

const workbenchRef = ref<InstanceType<typeof JSidebarLayout> | null>(null);
const workbenchState = ref<JSidebarState>('open');
const workbenchWidth = ref<number>(260);
const activeRoute = ref('deployments');

const navRoutes = [
  { id: 'overview', label: 'Cluster Overview', icon: 'activity', count: '4' },
  { id: 'deployments', label: 'Deployments', icon: 'layers', count: '12' },
  { id: 'databases', label: 'State Stores', icon: 'database', count: '3' },
  { id: 'domains', label: 'Edge Domains', icon: 'globe', count: '8' },
  { id: 'security', label: 'Access Policies', icon: 'shield-check' },
  { id: 'settings', label: 'Workspace Settings', icon: 'settings' },
];

const deployRows = [
  { id: 'dpl_9f41a', env: 'production', region: 'eu-central-1', latency: '18ms', status: 'Healthy' },
  { id: 'dpl_8c20b', env: 'canary', region: 'us-east-1', latency: '24ms', status: 'Verifying' },
  { id: 'dpl_7a19e', env: 'staging', region: 'ap-northeast-1', latency: '31ms', status: 'Healthy' },
];

function resetWorkbench() {
  workbenchRef.value?.setState('open');
  workbenchRef.value?.setWidth(260);
}

// Offset + rail-less layout state (proving clientX - layoutRect.left coordinate accuracy)
const offsetPx = ref<number>(140);
const nestedState = ref<JSidebarState>('open');
const nestedWidth = ref<number>(220);
const activeDoc = ref('architecture.md');

const docItems = [
  { name: 'architecture.md', section: 'Core' },
  { name: 'sidebar-layout.css', section: 'Styles' },
  { name: 'split-handle.js', section: 'Behaviors' },
  { name: 'tokens-audit.json', section: 'QA' },
];

const vueSnippet = `<JSidebarLayout
  storage-key="app-workspace-sidebar"
  :default-width="260"
  :min="180"
  :max="520"
  toggle-label="navigation"
  bordered
  :height="480"
>
  <template #sidebar-header>
    <span class="workspace-title">Acme Cloud</span>
  </template>

  <template #sidebar>
    <!-- Full navigation list rendered when state === 'open' -->
  </template>

  <template #rail>
    <!-- Compact icon rail rendered when state === 'rail' -->
  </template>

  <template #main-header>
    <JToolbar size="md" aria-label="Workspace header">
      <JSidebarToggle />
      <JToolbarSeparator />
      <span>Deployments</span>
    </JToolbar>
  </template>

  <!-- Main scrollable content -->
</JSidebarLayout>`;
</script>

<template>
  <DemoSection
    title="Open, Compact Rail & Hidden States with Edge Menu"
    description="Click JSidebarToggle in the toolbar, hover the vertical divider to reveal the calm edge chevron, drag the 1px splitter (or focus + ArrowLeft / ArrowRight), or right-click the edge for Show sidebar / Rail / Hide sidebar. State and width persist in localStorage."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" align="center">
        <JInline gap="inline" align="center">
          <JBadge size="sm" variant="soft" tone="accent">
            state: {{ workbenchState }}
          </JBadge>
          <JBadge size="sm" variant="outline" tone="neutral">
            open width: {{ workbenchWidth }}px
          </JBadge>
          <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
            storage-key="demo-sidebar-layout-main"
          </span>
        </JInline>

        <JInline gap="related" align="center">
          <JButton
            size="sm"
            :variant="workbenchState === 'open' ? 'soft' : 'outline'"
            :tone="workbenchState === 'open' ? 'accent' : 'neutral'"
            @click="workbenchState = 'open'"
          >
            Open
          </JButton>
          <JButton
            size="sm"
            :variant="workbenchState === 'rail' ? 'soft' : 'outline'"
            :tone="workbenchState === 'rail' ? 'accent' : 'neutral'"
            @click="workbenchState = 'rail'"
          >
            Rail
          </JButton>
          <JButton
            size="sm"
            :variant="workbenchState === 'hidden' ? 'soft' : 'outline'"
            :tone="workbenchState === 'hidden' ? 'accent' : 'neutral'"
            @click="workbenchState = 'hidden'"
          >
            Hidden
          </JButton>
          <JButton size="sm" variant="ghost" tone="neutral" @click="resetWorkbench">
            Reset 260px
          </JButton>
        </JInline>
      </JInline>

      <JSidebarLayout
        ref="workbenchRef"
        v-model:state="workbenchState"
        v-model:width="workbenchWidth"
        storage-key="demo-sidebar-layout-main"
        :default-width="260"
        :min="180"
        :max="460"
        toggle-label="navigation"
        bordered
        :height="440"
      >
        <template #sidebar-header>
          <JInline gap="inline" align="center" style="min-width: 0">
            <JIcon name="layers" tone="accent" size="sm" />
            <span style="font-size: var(--j-text-sm); font-weight: var(--j-weight-semibold); color: var(--j-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
              Northstar Ops
            </span>
          </JInline>
          <JBadge size="sm" variant="soft" tone="success">v2.4</JBadge>
        </template>

        <template #sidebar>
          <div style="padding: var(--j-space-2-5)">
            <JStack gap="related">
              <div style="padding-inline: var(--j-space-2); font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-subtle); letter-spacing: 0.04em; text-transform: uppercase">
                Infrastructure
              </div>
              <JStack gap="none">
                <button
                  v-for="item in navRoutes"
                  :key="item.id"
                  type="button"
                  :style="{
                    appearance: 'none',
                    border: 0,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--j-space-2)',
                    padding: 'var(--j-space-1-5) var(--j-space-2)',
                    borderRadius: 'var(--j-radius-sm)',
                    background: activeRoute === item.id ? 'var(--j-surface-1)' : 'transparent',
                    boxShadow: activeRoute === item.id ? '0 0 0 1px var(--j-border)' : 'none',
                    color: activeRoute === item.id ? 'var(--j-fg)' : 'var(--j-fg-muted)',
                    fontWeight: activeRoute === item.id ? 'var(--j-weight-medium)' : 'var(--j-weight-regular)',
                    fontSize: 'var(--j-text-sm)',
                    cursor: 'pointer',
                    textAlign: 'start',
                  }"
                  @click="activeRoute = item.id"
                >
                  <span style="display: inline-flex; align-items: center; gap: var(--j-gap-inline); min-width: 0">
                    <JIcon :name="item.icon" size="sm" :tone="activeRoute === item.id ? 'accent' : undefined" />
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                      {{ item.label }}
                    </span>
                  </span>
                  <JBadge v-if="item.count" size="sm" variant="soft" :tone="activeRoute === item.id ? 'accent' : 'neutral'">
                    {{ item.count }}
                  </JBadge>
                </button>
              </JStack>
            </JStack>
          </div>
        </template>

        <template #rail>
          <JTooltip
            v-for="item in navRoutes"
            :key="item.id"
            :content="item.label"
            side="right"
          >
            <button
              type="button"
              class="j-button"
              :data-variant="activeRoute === item.id ? 'soft' : 'ghost'"
              :data-tone="activeRoute === item.id ? 'accent' : 'neutral'"
              data-size="sm"
              data-icon-only=""
              :aria-label="item.label"
              @click="activeRoute = item.id"
            >
              <JIcon :name="item.icon" size="sm" />
            </button>
          </JTooltip>
        </template>

        <template #main-header>
          <JToolbar size="md" aria-label="Primary workspace toolbar">
            <JSidebarToggle />
            <JToolbarSeparator />
            <span style="font-size: var(--j-text-sm); font-weight: var(--j-weight-semibold); color: var(--j-fg)">
              {{ navRoutes.find((r) => r.id === activeRoute)?.label }}
            </span>
            <JToolbarSpacer />
            <JInline gap="inline" align="center">
              <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">Right-click splitter edge for menu</span>
              <JKbd size="sm">⇧F10</JKbd>
            </JInline>
          </JToolbar>
        </template>

        <div style="padding: var(--j-space-5)">
          <JStack gap="field">
            <JStack gap="inline">
              <div style="font-size: var(--j-text-lg); font-weight: var(--j-weight-semibold); color: var(--j-fg)">
                Active Rollouts
              </div>
              <p style="margin: 0; font-size: var(--j-text-sm); line-height: var(--j-leading); color: var(--j-fg-muted); max-width: 62ch">
                Even when hidden to <code>0px</code>, both the <code>JSidebarToggle</code> button in <code>#main-header</code> and the thin start-edge hover zone remain immediately reachable to restore the sidebar.
              </p>
            </JStack>

            <div style="border-radius: var(--j-radius-md); box-shadow: 0 0 0 1px var(--j-border); background: var(--j-surface-1); overflow: hidden">
              <div
                v-for="(row, idx) in deployRows"
                :key="row.id"
                :style="{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--j-space-3)',
                  padding: 'var(--j-space-3) var(--j-space-4)',
                  borderTop: idx > 0 ? '1px solid var(--j-border)' : 'none',
                  fontSize: 'var(--j-text-sm)',
                }"
              >
                <JInline gap="related" align="center">
                  <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg)">
                    {{ row.id }}
                  </span>
                  <JBadge size="sm" variant="outline" tone="neutral">{{ row.env }}</JBadge>
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">{{ row.region }}</span>
                </JInline>
                <JInline gap="related" align="center">
                  <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
                    p95 {{ row.latency }}
                  </span>
                  <JBadge size="sm" variant="soft" :tone="row.status === 'Healthy' ? 'success' : 'info'">
                    {{ row.status }}
                  </JBadge>
                </JInline>
              </div>
            </div>
          </JStack>
        </div>
      </JSidebarLayout>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Horizontally Offset Container & No-Rail Fallback"
    description="Proves pixel-exact resizing (clientX - layoutRect.left) inside an indented host container, automatic rail -> hidden fallback when no #rail slot is provided, and safe no-op rendering when JSidebarToggle sits outside a JSidebarLayout."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" align="center">
        <JInline gap="related" align="center">
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Horizontal container offset:</span>
          <JButton
            v-for="px in [0, 80, 140, 220]"
            :key="px"
            size="sm"
            :variant="offsetPx === px ? 'soft' : 'outline'"
            :tone="offsetPx === px ? 'accent' : 'neutral'"
            @click="offsetPx = px"
          >
            {{ px }}px
          </JButton>
        </JInline>

        <JInline gap="inline" align="center">
          <JBadge size="sm" variant="outline" tone="neutral">
            state: {{ nestedState }} (no #rail)
          </JBadge>
          <JBadge size="sm" variant="soft" tone="accent">
            width: {{ nestedWidth }}px
          </JBadge>
          <!-- Safe no-op outside JSidebarLayout: renders nothing -->
          <JSidebarToggle />
        </JInline>
      </JInline>

      <div
        :style="{
          paddingInlineStart: `${offsetPx}px`,
          background: 'var(--j-surface-2)',
          borderRadius: 'var(--j-radius-lg)',
          boxShadow: 'inset 0 0 0 1px var(--j-border)',
          paddingBlock: 'var(--j-space-3)',
          paddingInlineEnd: 'var(--j-space-3)',
          transition: 'padding-inline-start var(--j-duration-slow) var(--j-ease-emphasized)',
        }"
      >
        <JSidebarLayout
          v-model:state="nestedState"
          v-model:width="nestedWidth"
          :default-width="220"
          :min="160"
          :max="380"
          toggle-label="file tree"
          bordered
          :height="280"
        >
          <template #sidebar-header>
            <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-subtle); text-transform: uppercase; letter-spacing: 0.04em">
              Files
            </span>
          </template>

          <template #sidebar>
            <div style="padding: var(--j-space-2)">
              <JStack gap="none">
                <button
                  v-for="doc in docItems"
                  :key="doc.name"
                  type="button"
                  :style="{
                    appearance: 'none',
                    border: 0,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--j-space-1-5) var(--j-space-2)',
                    borderRadius: 'var(--j-radius-sm)',
                    background: activeDoc === doc.name ? 'var(--j-surface-1)' : 'transparent',
                    color: activeDoc === doc.name ? 'var(--j-fg)' : 'var(--j-fg-muted)',
                    fontFamily: 'var(--j-font-mono)',
                    fontSize: 'var(--j-text-xs)',
                    cursor: 'pointer',
                  }"
                  @click="activeDoc = doc.name"
                >
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ doc.name }}</span>
                  <span style="color: var(--j-fg-subtle)">{{ doc.section }}</span>
                </button>
              </JStack>
            </div>
          </template>

          <template #main-header>
            <JToolbar size="sm" aria-label="Nested document toolbar">
              <JSidebarToggle />
              <JToolbarSeparator />
              <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg)">
                {{ activeDoc }}
              </span>
              <JToolbarSpacer />
              <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
                offset {{ offsetPx }}px · zero jump on drag
              </span>
            </JToolbar>
          </template>

          <div style="padding: var(--j-space-4)">
            <p style="margin: 0; font-size: var(--j-text-sm); line-height: var(--j-leading); color: var(--j-fg-muted)">
              Drag the splitter above at any horizontal offset: width is measured relative to the layout root’s own bounding edge (<code>clientX - rect.left</code>, or <code>rect.right - clientX</code> in RTL), and right-clicking the edge omits the <strong>Rail</strong> option automatically because no <code>#rail</code> slot is provided.
            </p>
          </div>
        </JSidebarLayout>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection title="Vue Template Usage" description="Declarative JSidebarLayout + context-injected JSidebarToggle inside JToolbar.">
    <DemoCode lang="vue" :code="vueSnippet" />
  </DemoSection>
</template>
