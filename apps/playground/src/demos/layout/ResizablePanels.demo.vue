<script lang="ts">
export const meta = {
  name: 'Resizable Panels',
  group: 'Layout',
  order: 10,
  description: 'Multi-pane split layout with a 1px architectural hairline splitter, 10px invisible hit target, WAI-ARIA separator keyboard control, collapsible panes, and persisted ratios.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JResizableGroup,
  JResizablePanel,
  JResizableHandle,
  JSplitHandle,
  JStack,
  JInline,
  JBadge,
  JButton,
  JKbd,
  type SplitHandleDragPayload,
} from 'jenni-vue';

// 1. Studio 3-pane & 2-pane split state
const studioRef = ref<InstanceType<typeof JResizableGroup> | null>(null);
const studioSizes = ref<number[]>([22, 52, 26]);

const twoPaneSizes = ref<number[]>([44, 56]);

const studioFiles = [
  { name: 'tokens.css', path: 'packages/core/src', active: false, badge: 'OKLCH' },
  { name: 'resizable.css', path: 'packages/core/src/components', active: true, badge: 'New' },
  { name: 'resizable.js', path: 'packages/core/src/behaviors', active: false, badge: 'rAF' },
  { name: 'JResizableGroup.vue', path: 'packages/vue/src/layout', active: false },
  { name: 'Resizable.tsx', path: 'packages/react/src/layout', active: false },
];

const inspectorProps = [
  { prop: 'flex-grow', val: 'var(--_panel-size)' },
  { prop: 'flex-basis', val: '0%' },
  { prop: 'splitter-line', val: '1px hairline' },
  { prop: 'hit-target', val: '10px centered' },
  { prop: 'aria-role', val: 'separator' },
];

function applyStudioPreset(preset: number[]) {
  studioRef.value?.setLayout(preset);
}

// 2. Nested horizontal + vertical split state
const nestedOuterSizes = ref<number[]>([24, 76]);
const nestedInnerSizes = ref<number[]>([64, 36]);

const terminalLogs = [
  { ts: '20:14:02', level: 'info', msg: 'build jenni-core — 0 !important declarations verified' },
  { ts: '20:14:03', level: 'pass', msg: 'a11y separator aria-valuenow/min/max synchronized' },
  { ts: '20:14:04', level: 'pass', msg: 'density matrix passed at 0.65x, 1.0x, and 1.15x' },
  { ts: '20:14:05', level: 'info', msg: 'listening on port 5173 — ready in 118ms' },
];

// 3. Collapsible + persisted split state
const persistedRef = ref<InstanceType<typeof JResizableGroup> | null>(null);
const persistedSizes = ref<number[]>([26, 74]);
const navCollapsed = ref(false);

const persistedNavItems = [
  { label: 'Overview', count: '12' },
  { label: 'Deployments', count: '4' },
  { label: 'Edge Routing', count: '9' },
  { label: 'Audit Trail', count: '128' },
  { label: 'Environment Keys', count: '7' },
];

function toggleSidebar() {
  const group = persistedRef.value;
  if (!group) return;
  navCollapsed.value = group.togglePanel('persisted-sidebar');
}

function resetPersisted() {
  persistedRef.value?.resetLayout();
  navCollapsed.value = persistedRef.value?.isPanelCollapsed('persisted-sidebar') ?? false;
}

function onPersistedLayout(sizes: number[]) {
  persistedSizes.value = sizes;
  navCollapsed.value = (sizes[0] ?? 26) <= 0.5;
}

const fmtPct = (n: number | undefined) => `${Math.round(n ?? 0)}%`;

// 4. Custom standalone splitters (JSplitHandle & .j-resize-handle)
const customLeftPx = ref<number>(236);
const customTopPx = ref<number>(96);
const customLastSource = ref<'pointer' | 'keyboard' | 'idle'>('idle');

function onCustomHorizDrag(payload: SplitHandleDragPayload) {
  customLastSource.value = payload.source;
  customLeftPx.value = Math.min(380, Math.max(140, Math.round(customLeftPx.value + payload.delta)));
}

function onCustomVertDrag(payload: SplitHandleDragPayload) {
  customLastSource.value = payload.source;
  customTopPx.value = Math.min(168, Math.max(56, Math.round(customTopPx.value + payload.delta)));
}

const html = `<div
  class="j-resizable"
  data-orientation="horizontal"
  data-bordered
  data-storage-key="workspace-main"
  style="width: 100%; height: 320px"
>
  <div
    class="j-resizable__panel"
    data-panel-id="sidebar"
    data-default-size="25"
    data-min-size="15"
    data-max-size="45"
    data-collapsible
  >
    Sidebar navigation
  </div>

  <div
    class="j-resizable__handle"
    role="separator"
    tabindex="0"
    aria-orientation="vertical"
    aria-label="Resize sidebar"
    data-with-grip
  ></div>

  <div
    class="j-resizable__panel"
    data-panel-id="editor"
    data-default-size="75"
    data-min-size="40"
  >
    Primary workspace canvas
  </div>
</div>`;
</script>

<template>
  <DemoSection
    title="3-Pane Studio & 2-Pane Split with Grip Handle"
    description="Drag any 1px hairline (backed by an invisible 10px hit zone) or focus a splitter with Tab and press ArrowLeft / ArrowRight (hold Shift for 5× steps, Home / End for min / max)."
  >
    <JStack gap="group" style="width: 100%">
      <JStack gap="item" style="width: 100%">
        <JInline justify="between" align="center">
          <JInline gap="inline" align="center">
            <JBadge size="sm" variant="soft" tone="accent">
              Explorer {{ fmtPct(studioSizes[0]) }}
            </JBadge>
            <JBadge size="sm" variant="soft" tone="neutral">
              Canvas {{ fmtPct(studioSizes[1]) }}
            </JBadge>
            <JBadge size="sm" variant="soft" tone="info">
              Inspector {{ fmtPct(studioSizes[2]) }}
            </JBadge>
          </JInline>
          <JInline gap="related">
            <JButton size="sm" variant="outline" tone="neutral" @click="applyStudioPreset([18, 64, 18])">
              Focus Canvas
            </JButton>
            <JButton size="sm" variant="outline" tone="neutral" @click="studioRef?.resetLayout()">
              Reset 22 / 52 / 26
            </JButton>
          </JInline>
        </JInline>

        <JResizableGroup
          ref="studioRef"
          orientation="horizontal"
          bordered
          :height="340"
          style="width: 100%"
          @layout="(s) => (studioSizes = s)"
        >
          <JResizablePanel id="studio-explorer" :default-size="22" :min-size="15" :max-size="38">
            <div style="height: 100%; padding: var(--j-space-3); background: var(--j-surface-2)">
              <JStack gap="related">
                <div style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-subtle); letter-spacing: 0.04em; text-transform: uppercase">
                  Explorer
                </div>
                <JStack gap="inline">
                  <div
                    v-for="file in studioFiles"
                    :key="file.name"
                    :style="{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--j-space-2)',
                      padding: 'var(--j-space-1-5) var(--j-space-2)',
                      borderRadius: 'var(--j-radius-sm)',
                      background: file.active ? 'var(--j-surface-1)' : 'transparent',
                      boxShadow: file.active ? '0 0 0 1px var(--j-border)' : 'none',
                      fontSize: 'var(--j-text-xs)',
                      color: file.active ? 'var(--j-fg)' : 'var(--j-fg-muted)',
                      fontWeight: file.active ? 'var(--j-weight-medium)' : 'var(--j-weight-regular)',
                    }"
                  >
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                      {{ file.name }}
                    </span>
                    <JBadge v-if="file.badge" size="sm" variant="soft" :tone="file.active ? 'accent' : 'neutral'">
                      {{ file.badge }}
                    </JBadge>
                  </div>
                </JStack>
              </JStack>
            </div>
          </JResizablePanel>

          <JResizableHandle with-grip aria-label="Resize explorer and canvas" />

          <JResizablePanel id="studio-canvas" :default-size="52" :min-size="28">
            <div style="height: 100%; padding: var(--j-space-4); display: flex; flex-direction: column; justify-content: space-between; background: var(--j-surface-1)">
              <JStack gap="related">
                <JInline justify="between" align="center">
                  <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
                    packages/core/src/components/resizable.css
                  </span>
                  <JBadge size="sm" variant="outline" tone="neutral">1px hairline</JBadge>
                </JInline>
                <div style="font-size: var(--j-text-md); font-weight: var(--j-weight-semibold); color: var(--j-fg)">
                  Proportional flex-basis: 0% sizing
                </div>
                <p style="margin: 0; font-size: var(--j-text-sm); line-height: var(--j-leading); color: var(--j-fg-muted)">
                  Each pane reads its own <code>--_panel-size</code> flex weight while splitters occupy an exact 1px track. Double-click either grip handle to snap adjacent panes back to their default ratio.
                </p>
              </JStack>

              <div style="padding: var(--j-space-3); border-radius: var(--j-radius-md); background: var(--j-surface-2); box-shadow: inset 0 0 0 1px var(--j-border); font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-muted)">
                flex: var(--_panel-size, 1) 1 0%;
              </div>
            </div>
          </JResizablePanel>

          <JResizableHandle with-grip aria-label="Resize canvas and inspector" />

          <JResizablePanel id="studio-inspector" :default-size="26" :min-size="16" :max-size="40">
            <div style="height: 100%; padding: var(--j-space-3); background: var(--j-surface-2)">
              <JStack gap="related">
                <div style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-subtle); letter-spacing: 0.04em; text-transform: uppercase">
                  Computed Layout
                </div>
                <JStack gap="inline">
                  <div
                    v-for="row in inspectorProps"
                    :key="row.prop"
                    style="display: flex; align-items: center; justify-content: space-between; gap: var(--j-space-2); padding-block: var(--j-space-1); border-bottom: 1px solid var(--j-border); font-size: var(--j-text-xs)"
                  >
                    <span style="color: var(--j-fg-muted)">{{ row.prop }}</span>
                    <span style="font-family: var(--j-font-mono); color: var(--j-fg)">{{ row.val }}</span>
                  </div>
                </JStack>
              </JStack>
            </div>
          </JResizablePanel>
        </JResizableGroup>
      </JStack>

      <JStack gap="inline" style="width: 100%">
        <JInline justify="between" align="center">
          <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-muted)">
            Minimal 2-Pane Split (clean hairline + grip)
          </span>
          <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
            {{ fmtPct(twoPaneSizes[0]) }} · {{ fmtPct(twoPaneSizes[1]) }}
          </span>
        </JInline>
        <JResizableGroup
          orientation="horizontal"
          bordered
          :height="140"
          style="width: 100%"
          @layout="(s) => (twoPaneSizes = s)"
        >
          <JResizablePanel :default-size="44" :min-size="20">
            <div style="height: 100%; padding: var(--j-space-4); display: flex; flex-direction: column; justify-content: center; gap: var(--j-space-1)">
              <span style="font-size: var(--j-text-sm); font-weight: var(--j-weight-semibold); color: var(--j-fg)">Source Markdown</span>
              <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Min 20% · smooth pointer-captured drag</span>
            </div>
          </JResizablePanel>
          <JResizableHandle with-grip aria-label="Resize preview split" />
          <JResizablePanel :default-size="56" :min-size="20">
            <div style="height: 100%; padding: var(--j-space-4); background: var(--j-surface-2); display: flex; flex-direction: column; justify-content: center; gap: var(--j-space-1)">
              <span style="font-size: var(--j-text-sm); font-weight: var(--j-weight-semibold); color: var(--j-fg)">Rendered Preview</span>
              <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Zero text-selection bleed while dragging</span>
            </div>
          </JResizablePanel>
        </JResizableGroup>
      </JStack>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Nested Horizontal + Vertical Workbench"
    description="Groups scope strictly to direct child panels and handles, allowing a horizontal sidebar split to host a vertical editor + terminal drawer without cross-talk."
  >
    <JStack gap="item" style="width: 100%">
      <JInline gap="inline" align="center">
        <JBadge size="sm" variant="outline" tone="neutral">
          Horizontal: {{ fmtPct(nestedOuterSizes[0]) }} / {{ fmtPct(nestedOuterSizes[1]) }}
        </JBadge>
        <JBadge size="sm" variant="outline" tone="accent">
          Vertical stack: {{ fmtPct(nestedInnerSizes[0]) }} / {{ fmtPct(nestedInnerSizes[1]) }}
        </JBadge>
      </JInline>

      <JResizableGroup
        orientation="horizontal"
        bordered
        :height="360"
        style="width: 100%"
        @layout="(s) => (nestedOuterSizes = s)"
      >
        <JResizablePanel id="wb-sidebar" :default-size="24" :min-size="16" :max-size="40">
          <div style="height: 100%; padding: var(--j-space-3); background: var(--j-surface-2)">
            <JStack gap="related">
              <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-subtle); text-transform: uppercase; letter-spacing: 0.04em">
                Project Tree
              </span>
              <JStack gap="inline" style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-muted)">
                <div>▾ apps/playground</div>
                <div style="padding-inline-start: var(--j-space-3); color: var(--j-accent)">ResizablePanels.demo.vue</div>
                <div style="padding-inline-start: var(--j-space-3)">CommandPalette.demo.vue</div>
                <div>▾ packages/core</div>
                <div style="padding-inline-start: var(--j-space-3)">resizable.css</div>
                <div style="padding-inline-start: var(--j-space-3)">command-palette.css</div>
              </JStack>
            </JStack>
          </div>
        </JResizablePanel>

        <JResizableHandle with-grip aria-label="Resize sidebar and workbench" />

        <JResizablePanel id="wb-main" :default-size="76" :min-size="45">
          <JResizableGroup
            orientation="vertical"
            style="width: 100%; height: 100%"
            @layout="(s) => (nestedInnerSizes = s)"
          >
            <JResizablePanel id="wb-editor" :default-size="64" :min-size="30">
              <div style="height: 100%; padding: var(--j-space-4); background: var(--j-surface-1)">
                <JStack gap="related">
                  <JInline justify="between" align="center">
                    <span style="font-size: var(--j-text-sm); font-weight: var(--j-weight-semibold); color: var(--j-fg)">
                      Editor Viewport
                    </span>
                    <JInline gap="inline">
                      <JKbd size="sm">↑</JKbd>
                      <JKbd size="sm">↓</JKbd>
                      <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">on horizontal splitter</span>
                    </JInline>
                  </JInline>
                  <p style="margin: 0; font-size: var(--j-text-sm); line-height: var(--j-leading); color: var(--j-fg-muted)">
                    Drag the horizontal divider below to expand or condense the integrated terminal drawer independently of the left navigation tree.
                  </p>
                </JStack>
              </div>
            </JResizablePanel>

            <JResizableHandle with-grip aria-label="Resize editor and terminal drawer" />

            <JResizablePanel id="wb-terminal" :default-size="36" :min-size="20" collapsible>
              <div style="height: 100%; padding: var(--j-space-3); background: var(--j-surface-2); font-family: var(--j-font-mono); font-size: var(--j-text-xs)">
                <JStack gap="inline">
                  <JInline justify="between" align="center">
                    <span style="font-weight: var(--j-weight-semibold); color: var(--j-fg)">Terminal · zsh</span>
                    <span style="color: var(--j-fg-subtle)">double-click bar to collapse</span>
                  </JInline>
                  <div
                    v-for="log in terminalLogs"
                    :key="log.ts + log.msg"
                    style="display: flex; gap: var(--j-space-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
                  >
                    <span style="color: var(--j-fg-subtle)">{{ log.ts }}</span>
                    <span :style="{ color: log.level === 'pass' ? 'var(--j-success)' : 'var(--j-info)' }">
                      [{{ log.level }}]
                    </span>
                    <span style="color: var(--j-fg-muted)">{{ log.msg }}</span>
                  </div>
                </JStack>
              </div>
            </JResizablePanel>
          </JResizableGroup>
        </JResizablePanel>
      </JResizableGroup>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Collapsible Sidebar & Persisted Ratios (autoSaveId)"
    description="Drag past half of minSize, double-click the splitter, press Enter / Space while focused on the splitter, or click the toolbar button to collapse and restore. Ratios persist in localStorage."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" align="center">
        <JInline gap="related" align="center">
          <JButton size="sm" variant="outline" tone="neutral" @click="toggleSidebar">
            {{ navCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar' }}
          </JButton>
          <JBadge size="sm" :variant="navCollapsed ? 'soft' : 'outline'" :tone="navCollapsed ? 'warning' : 'success'">
            {{ navCollapsed ? 'Collapsed (0%)' : `Expanded (${fmtPct(persistedSizes[0])})` }}
          </JBadge>
        </JInline>
        <JInline gap="related" align="center">
          <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
            autoSaveId="demo-persisted-split"
          </span>
          <JButton size="sm" variant="ghost" tone="neutral" @click="resetPersisted">
            Reset saved
          </JButton>
        </JInline>
      </JInline>

      <JResizableGroup
        ref="persistedRef"
        orientation="horizontal"
        auto-save-id="demo-persisted-split"
        bordered
        :height="320"
        style="width: 100%"
        @layout="onPersistedLayout"
        @panel-collapse="(_id, c) => (navCollapsed = c)"
      >
        <JResizablePanel
          id="persisted-sidebar"
          :default-size="26"
          :min-size="16"
          :max-size="42"
          collapsible
          :collapsed-size="0"
        >
          <div style="height: 100%; padding: var(--j-space-3); background: var(--j-surface-2)">
            <JStack gap="related">
              <div style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-subtle); text-transform: uppercase; letter-spacing: 0.04em">
                Workspace Views
              </div>
              <JStack gap="inline">
                <div
                  v-for="item in persistedNavItems"
                  :key="item.label"
                  style="display: flex; align-items: center; justify-content: space-between; padding: var(--j-space-1-5) var(--j-space-2); border-radius: var(--j-radius-sm); font-size: var(--j-text-sm); color: var(--j-fg)"
                >
                  <span>{{ item.label }}</span>
                  <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">{{ item.count }}</span>
                </div>
              </JStack>
            </JStack>
          </div>
        </JResizablePanel>

        <JResizableHandle with-grip aria-label="Toggle or resize collapsible sidebar" />

        <JResizablePanel id="persisted-detail" :default-size="74" :min-size="45">
          <div style="height: 100%; padding: var(--j-space-5); display: flex; flex-direction: column; justify-content: space-between; background: var(--j-surface-1)">
            <JStack gap="related">
              <div style="font-size: var(--j-text-lg); font-weight: var(--j-weight-semibold); color: var(--j-fg)">
                Persistent Workspace Canvas ({{ fmtPct(persistedSizes[1]) }})
              </div>
              <p style="margin: 0; font-size: var(--j-text-sm); line-height: var(--j-leading); color: var(--j-fg-muted); max-width: 54ch">
                Adjust the split or collapse the left rail and reload the page — <code>createResizableGroup</code> restores both the saved layout and the pre-collapse return width from <code>localStorage</code>.
              </p>
            </JStack>
            <JInline gap="inline" align="center">
              <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">Splitter shortcuts:</span>
              <JKbd size="sm">Enter</JKbd>
              <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">or double-click to toggle</span>
              <JKbd size="sm">Shift</JKbd>
              <JKbd size="sm">←</JKbd>
              <JKbd size="sm">→</JKbd>
              <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">for 10% steps</span>
            </JInline>
          </div>
        </JResizablePanel>
      </JResizableGroup>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Custom Splitters (JSplitHandle & .j-resize-handle)"
    description="Use JSplitHandle (or standalone .j-resize-handle + initSplitHandles()) inside any custom CSS Grid or Flexbox layout without a JResizableGroup wrapper — supporting both horizontal and standalone vertical orientations, pointer capture, and Arrow / Shift+Arrow stepping."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" align="center">
        <JInline gap="inline" align="center">
          <JBadge size="sm" variant="soft" tone="accent">
            Left pane: {{ customLeftPx }}px
          </JBadge>
          <JBadge size="sm" variant="soft" tone="info">
            Top pane: {{ customTopPx }}px
          </JBadge>
          <JBadge size="sm" variant="outline" tone="neutral">
            source: {{ customLastSource }}
          </JBadge>
        </JInline>
        <JButton
          size="sm"
          variant="ghost"
          tone="neutral"
          @click="
            customLeftPx = 236;
            customTopPx = 96;
            customLastSource = 'idle';
          "
        >
          Reset custom split
        </JButton>
      </JInline>

      <div
        style="display: flex; flex-direction: row; width: 100%; height: 240px; border-radius: var(--j-radius-lg); background: var(--j-surface-1); box-shadow: 0 0 0 1px var(--j-border); overflow: hidden"
      >
        <div
          :style="{
            flex: `0 0 ${customLeftPx}px`,
            width: `${customLeftPx}px`,
            padding: 'var(--j-space-3)',
            background: 'var(--j-surface-2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }"
        >
          <JStack gap="inline">
            <span style="font-size: var(--j-text-xs); font-weight: var(--j-weight-semibold); color: var(--j-fg-subtle); text-transform: uppercase; letter-spacing: 0.04em">
              Fixed Pixel Pane
            </span>
            <span style="font-size: var(--j-text-sm); color: var(--j-fg)">
              Driven by <code>@drag</code> delta ({{ customLeftPx }}px)
            </span>
          </JStack>
          <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
            min 140px · max 380px
          </span>
        </div>

        <JSplitHandle
          orientation="horizontal"
          with-grip
          aria-label="Resize custom left pane"
          :step="16"
          :large-step="64"
          :value-now="customLeftPx"
          :value-min="140"
          :value-max="380"
          @drag="onCustomHorizDrag"
        />

        <div style="flex: 1 1 0%; min-width: 0; display: flex; flex-direction: column">
          <div
            :style="{
              flex: `0 0 ${customTopPx}px`,
              height: `${customTopPx}px`,
              padding: 'var(--j-space-3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 'var(--j-space-1)',
            }"
          >
            <span style="font-size: var(--j-text-sm); font-weight: var(--j-weight-semibold); color: var(--j-fg)">
              Standalone Vertical Handle Below
            </span>
            <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
              <code>orientation="vertical"</code> works inside any plain column container without <code>.j-resizable</code>.
            </span>
          </div>

          <JSplitHandle
            orientation="vertical"
            with-grip
            aria-label="Resize custom top and bottom panes"
            :step="16"
            :large-step="64"
            :value-now="customTopPx"
            :value-min="56"
            :value-max="168"
            @drag="onCustomVertDrag"
          />

          <div
            style="flex: 1 1 0%; min-height: 0; padding: var(--j-space-3); background: var(--j-surface-2); display: flex; align-items: center; justify-content: space-between; font-size: var(--j-text-xs); color: var(--j-fg-muted)"
          >
            <span>Flexible remainder pane (<code>flex: 1 1 0%</code>)</span>
            <JInline gap="inline" align="center">
              <JKbd size="sm">↑</JKbd>
              <JKbd size="sm">↓</JKbd>
              <span>16px · Shift 64px</span>
            </JInline>
          </div>
        </div>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Zero-framework .j-resizable + initResizableGroups().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
