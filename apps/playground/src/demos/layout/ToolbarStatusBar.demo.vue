<script lang="ts">
export const meta = {
  name: 'Toolbar & Status Bar',
  group: 'Layout',
  order: 3.5,
  wide: true,
  description: 'WAI-ARIA roving-focus action toolbars and configurable 22px–30px tabular-numeral workbench status bars.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JToolbar,
  JToolbarGroup,
  JToolbarSeparator,
  JStatusBar,
  JStatusBarItem,
  JStatusBarSeparator,
  JIcon,
  JButton,
  JInput,
  JBadge,
  JStack,
} from 'jenni-vue';

const filterText = ref('');
const branch = ref('main');
const lineCol = ref('Ln 142, Col 18');

const code = `<JToolbar size="sm" aria-label="Editor actions">
  <template #start>
    <JToolbarGroup>
      <JButton size="sm" variant="ghost"><JIcon name="play" /> Run</JButton>
      <JButton size="sm" variant="ghost"><JIcon name="refresh" /> Sync</JButton>
    </JToolbarGroup>
    <JToolbarSeparator />
    <JInput v-model="filterText" size="sm" placeholder="Filter symbols…" />
  </template>
  <template #end>
    <JButton size="sm">Deploy</JButton>
  </template>
</JToolbar>

<JStatusBar size="lg" text-size="sm" mono variant="subtle">
  <template #start>
    <JStatusBarItem icon="git-branch" interactive>{{ branch }}</JStatusBarItem>
    <JStatusBarSeparator />
    <JStatusBarItem tone="success" dot>0 errors · 0 warnings</JStatusBarItem>
  </template>
  <template #end>
    <JStatusBarItem>{{ lineCol }}</JStatusBarItem>
    <JStatusBarSeparator />
    <JStatusBarItem>UTF-8</JStatusBarItem>
  </template>
</JStatusBar>`;
</script>

<template>
  <DemoSection
    title="Workbench Frame (Toolbar + Canvas + StatusBar)"
    description="JToolbar manages WAI-ARIA ArrowLeft / ArrowRight roving focus automatically (while skipping text inputs so cursor keys edit text naturally); JStatusBar locks tabular numerals to a 24px (18px at 0.65×) strip."
  >
    <div
      style="
        width: 100%;
        border: 1px solid var(--j-border);
        border-radius: var(--j-radius-md);
        overflow: clip;
        background: var(--j-surface-1);
      "
    >
      <JToolbar size="sm" :surface="2" aria-label="Notebook actions">
        <template #start>
          <JToolbarGroup>
            <JButton size="sm" variant="soft" tone="accent">
              <JIcon name="play" /> Run All
            </JButton>
            <JButton size="sm" variant="ghost" tone="neutral">
              <JIcon name="stop" /> Stop
            </JButton>
            <JButton size="sm" variant="ghost" tone="neutral">
              <JIcon name="refresh" /> Restart Kernel
            </JButton>
          </JToolbarGroup>
          <JToolbarSeparator />
          <JInput v-model="filterText" size="sm" placeholder="Search cells…" style="width: 190px" />
        </template>
        <template #end>
          <JBadge size="sm" tone="success" dot>Kernel Ready</JBadge>
          <JButton size="sm" variant="outline" tone="neutral">
            <JIcon name="download" /> Export
          </JButton>
        </template>
      </JToolbar>

      <div style="padding: var(--j-space-5); font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-muted)">
        [1] SELECT region, count(*), percentile_cont(0.95) FROM telemetry GROUP BY 1; — 14.2 ms
      </div>

      <JStatusBar>
        <template #start>
          <JStatusBarItem icon="git-branch" interactive @click="branch = branch === 'main' ? 'feat/data-grid' : 'main'">
            {{ branch }}
          </JStatusBarItem>
          <JStatusBarSeparator />
          <JStatusBarItem tone="success" dot>0 errors · 0 warnings</JStatusBarItem>
        </template>
        <template #end>
          <JStatusBarItem>{{ lineCol }}</JStatusBarItem>
          <JStatusBarSeparator />
          <JStatusBarItem>UTF-8</JStatusBarItem>
          <JStatusBarSeparator />
          <JStatusBarItem icon="terminal" interactive>SQL Engine 3.12</JStatusBarItem>
        </template>
      </JStatusBar>
    </div>
  </DemoSection>

  <DemoSection title="Status Bar Variants (Subtle · Contrast · Accent)">
    <JStack gap="item" style="width: 100%">
      <div style="border: 1px solid var(--j-border); border-radius: var(--j-radius-sm); overflow: clip">
        <JStatusBar variant="subtle" border="none">
          <template #start>
            <JStatusBarItem icon="git-branch">main</JStatusBarItem>
            <JStatusBarSeparator />
            <JStatusBarItem tone="success" dot>Healthy</JStatusBarItem>
          </template>
          <template #end>
            <JStatusBarItem>Subtle (--j-surface-2)</JStatusBarItem>
          </template>
        </JStatusBar>
      </div>

      <div style="border-radius: var(--j-radius-sm); overflow: clip">
        <JStatusBar variant="contrast" border="none">
          <template #start>
            <JStatusBarItem icon="terminal" interactive>ssh prod-eu-1</JStatusBarItem>
            <JStatusBarSeparator />
            <JStatusBarItem tone="info" dot>Connected · 18ms</JStatusBarItem>
          </template>
          <template #end>
            <JStatusBarItem>Contrast Obsidian</JStatusBarItem>
          </template>
        </JStatusBar>
      </div>

      <div style="border-radius: var(--j-radius-sm); overflow: clip">
        <JStatusBar variant="accent" border="none">
          <template #start>
            <JStatusBarItem icon="play">Debugging · Port 9229</JStatusBarItem>
            <JStatusBarSeparator />
            <JStatusBarItem>2 breakpoints</JStatusBarItem>
          </template>
          <template #end>
            <JStatusBarItem>Accent Active</JStatusBarItem>
          </template>
        </JStatusBar>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection
    title="30px Monospace Workbench Chrome (size=&quot;lg&quot; · text-size=&quot;sm&quot; · mono)"
    description="StatusBar scales across sm (22px), md (24px default), and lg (30px) — or any explicit height — with optional text-size=&quot;sm&quot; and mono for telemetry and systems monitoring chrome."
  >
    <JStack gap="item" style="width: 100%">
      <div style="border: 1px solid var(--j-border); border-radius: var(--j-radius-sm); overflow: clip">
        <JStatusBar size="lg" text-size="sm" mono border="none">
          <template #start>
            <JStatusBarItem tone="success" dot>LIVE · 1,000 Hz</JStatusBarItem>
            <JStatusBarSeparator />
            <JStatusBarItem>
              <template #icon><JIcon name="terminal" /></template>
              pid 48210 · rss 41.8 MB
            </JStatusBarItem>
          </template>
          <template #center>
            <JStatusBarItem>cpu 3.2% · p99 0.84 ms</JStatusBarItem>
          </template>
          <template #end>
            <JStatusBarItem interactive>30px · mono · sm</JStatusBarItem>
          </template>
        </JStatusBar>
      </div>

      <div style="border: 1px solid var(--j-border); border-radius: var(--j-radius-sm); overflow: clip">
        <JStatusBar size="sm" border="none">
          <template #start>
            <JStatusBarItem icon="git-branch">release/v2.9</JStatusBarItem>
            <JStatusBarSeparator />
            <JStatusBarItem tone="info" dot>Synced</JStatusBarItem>
          </template>
          <template #end>
            <JStatusBarItem>22px · size="sm"</JStatusBarItem>
          </template>
        </JStatusBar>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection title="Usage">
    <DemoCode lang="html" :code="code" code-only />
  </DemoSection>
</template>
