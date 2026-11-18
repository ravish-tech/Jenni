<script lang="ts">
export const meta = {
  name: 'Command Palette',
  group: 'Overlay',
  order: 11,
  description: 'Top-layer modal command launcher and inline combobox surface with grouped instant search, multi-key chords, nested namespace drilldown, and damped 300ms reveal.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JCommandPalette,
  JButton,
  JBadge,
  JKbd,
  JStack,
  JInline,
  toast,
  type CommandGroup,
  type CommandItem,
} from '@jenni/vue';

// 1. Modal ⌘K launcher state
const modalOpen = ref(false);
const modalQuery = ref('');
const lastExecuted = ref<{ label: string; value: string; time: string }>({
  label: 'Go to Design Tokens',
  value: 'nav:tokens',
  time: 'Ready',
});

const workspaceGroups: CommandGroup[] = [
  {
    id: 'actions',
    label: 'Quick Actions',
    items: [
      {
        value: 'action:new-spec',
        label: 'Create Architecture Spec',
        description: 'Docs · RFC template',
        icon: 'plus',
        shortcut: ['⌘', 'N'],
        keywords: ['create', 'document', 'rfc', 'new'],
      },
      {
        value: 'action:deploy',
        label: 'Promote Release to Production',
        description: 'CI · zero-downtime rollout',
        icon: 'bolt',
        shortcut: ['⇧', '⌘', 'D'],
        keywords: ['ship', 'publish', 'release', 'rollout'],
      },
      {
        value: 'action:copy-url',
        label: 'Copy Permalink to Current View',
        description: 'Clipboard',
        icon: 'copy',
        shortcut: ['⌘', 'L'],
        keywords: ['share', 'link', 'url'],
      },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      {
        value: 'nav:tokens',
        label: 'Go to Design Tokens',
        description: 'Foundation · OKLCH & 4px grid',
        icon: 'palette',
        shortcut: ['G', 'T'],
        keywords: ['colors', 'spacing', 'density'],
      },
      {
        value: 'nav:resizable',
        label: 'Go to Resizable Panels',
        description: 'Layout · 1px hairline splitters',
        icon: 'layout',
        shortcut: ['G', 'R'],
        keywords: ['split', 'panes', 'ide'],
      },
      {
        value: 'nav:branches',
        label: 'Switch Active Git Branch',
        description: 'Repository · main',
        icon: 'git-branch',
        shortcut: ['G', 'B'],
        keywords: ['checkout', 'git', 'version'],
      },
    ],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    items: [
      {
        value: 'pref:terminal',
        label: 'Toggle Integrated Diagnostics Drawer',
        description: 'Workbench',
        icon: 'terminal',
        shortcut: ['⌃', '`'],
        keywords: ['console', 'logs', 'shell'],
      },
      {
        value: 'pref:settings',
        label: 'Open Workspace Settings',
        description: 'Configuration',
        icon: 'settings',
        shortcut: ['⌘', ','],
        keywords: ['config', 'preferences', 'options'],
      },
    ],
  },
];

function onModalSelect(item: CommandItem) {
  const now = new Date();
  const stamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lastExecuted.value = {
    label: item.label,
    value: item.value,
    time: stamp,
  };
  toast.accent(item.label, {
    description: `Executed ${item.value}`,
    duration: 2400,
  });
}

// 2. Inline stage preview state
const inlineQuery = ref('');
const inlineLast = ref<string>('Go to Design Tokens');

function onInlineSelect(item: CommandItem) {
  inlineLast.value = item.label;
}

// 3. Multi-page / nested namespace drilldown state
const drillOpen = ref(false);
const activeThemeSummary = ref('System (OS light-dark)');
const activeEnvSummary = ref('eu-central-1 (Frankfurt)');

const drilldownItems: CommandItem[] = [
  {
    value: 'ns:theme',
    label: 'Switch theme…',
    description: 'Appearance · Light, Dark, or System',
    group: 'Namespaces',
    icon: 'sun',
    keywords: ['dark', 'light', 'mode', 'color', 'theme'],
    children: [
      {
        value: 'theme:light',
        label: 'Light — Warm Paper',
        description: 'oklch(99% 0.002 hue)',
        group: 'Switch theme',
        icon: 'sun',
        shortcut: ['1'],
      },
      {
        value: 'theme:dark',
        label: 'Dark — Deep Obsidian',
        description: 'oklch(14.8% 0.005 hue)',
        group: 'Switch theme',
        icon: 'moon',
        shortcut: ['2'],
      },
      {
        value: 'theme:system',
        label: 'System — Follow OS color-scheme',
        description: 'Automatic light-dark()',
        group: 'Switch theme',
        icon: 'monitor',
        shortcut: ['3'],
      },
    ],
  },
  {
    value: 'ns:deploy',
    label: 'Deploy to environment…',
    description: 'Select target cluster region',
    group: 'Namespaces',
    icon: 'globe',
    keywords: ['deploy', 'region', 'cluster', 'staging', 'prod'],
    children: [
      {
        value: 'env:fra',
        label: 'Frankfurt (eu-central-1)',
        description: 'Primary production · 6ms',
        group: 'Target cluster',
        icon: 'bolt',
        shortcut: ['P'],
      },
      {
        value: 'env:iad',
        label: 'Virginia (us-east-1)',
        description: 'Americas primary · 72ms',
        group: 'Target cluster',
        icon: 'globe',
        shortcut: ['U'],
      },
      {
        value: 'env:canary',
        label: 'Edge Canary (5% traffic)',
        description: 'Progressive verification',
        group: 'Target cluster',
        icon: 'sparkles',
        shortcut: ['C'],
      },
    ],
  },
  {
    value: 'ns:density',
    label: 'Configure spatial density…',
    description: 'Compact 0.65× · Default 1.0× · Comfortable 1.15×',
    group: 'Namespaces',
    icon: 'layers',
    keywords: ['density', 'compact', 'comfortable', 'spacing'],
    children: [
      {
        value: 'density:compact',
        label: 'Compact (0.65×)',
        description: 'High-information telemetry & IDE chrome',
        group: 'Spatial density',
        icon: 'layers',
      },
      {
        value: 'density:default',
        label: 'Default (1.0×)',
        description: 'Balanced application rhythm',
        group: 'Spatial density',
        icon: 'layers',
      },
      {
        value: 'density:comfortable',
        label: 'Comfortable (1.15×)',
        description: 'Generous editorial breathing room',
        group: 'Spatial density',
        icon: 'layers',
      },
    ],
  },
  {
    value: 'direct:audit',
    label: 'Run Accessibility Audit',
    description: 'Executes immediately at root level',
    group: 'Direct Commands',
    icon: 'sparkles',
    shortcut: ['⌘', '⇧', 'A'],
  },
];

function onDrillSelect(item: CommandItem) {
  if (item.value.startsWith('theme:')) {
    activeThemeSummary.value = item.label;
  } else if (item.value.startsWith('env:')) {
    activeEnvSummary.value = item.label;
  }
  toast.info(item.label, {
    description: `Selected ${item.value}`,
    duration: 2200,
  });
}

const html = `<button class="j-button" commandfor="app-cmd" command="show-modal">
  Open Command Palette
</button>

<dialog
  class="j-command-palette"
  id="app-cmd"
  data-shortcut="k"
  closedby="any"
  aria-label="Command palette"
>
  <div class="j-command-palette__header">
    <span class="j-command-palette__search-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M11.5 11.5 14 14M7.25 12.5a5.25 5.25 0 1 1 0-10.5 5.25 5.25 0 0 1 0 10.5Z"/></svg>
    </span>
    <input
      class="j-command-palette__input"
      role="combobox"
      placeholder="Type a command or search…"
    />
    <kbd class="j-kbd" data-size="sm">Esc</kbd>
  </div>

  <div class="j-command-palette__list" role="listbox">
    <div class="j-command-palette__group" role="group" aria-label="Navigation">
      <div class="j-command-palette__group-label">Navigation</div>
      <div class="j-command-palette__item" role="option" data-value="tokens" data-keywords="colors oklch">
        <span class="j-command-palette__item-body">
          <span class="j-command-palette__item-title">Go to Design Tokens</span>
          <span class="j-command-palette__item-description">Foundation</span>
        </span>
        <span class="j-command-palette__item-shortcut">
          <kbd class="j-kbd" data-size="sm">G</kbd>
          <kbd class="j-kbd" data-size="sm">T</kbd>
        </span>
      </div>
    </div>
    <div class="j-command-palette__empty" hidden>No matching commands</div>
  </div>

  <footer class="j-command-palette__footer">
    <div class="j-command-palette__hints">
      <span class="j-command-palette__hint"><kbd class="j-kbd" data-size="sm">↑</kbd><kbd class="j-kbd" data-size="sm">↓</kbd> Navigate</span>
      <span class="j-command-palette__hint"><kbd class="j-kbd" data-size="sm">↵</kbd> Run</span>
      <span class="j-command-palette__hint"><kbd class="j-kbd" data-size="sm">Esc</kbd> Close</span>
    </div>
  </footer>
</dialog>`;
</script>

<template>
  <DemoSection
    title="Modal ⌘K Launcher"
    description="Built on native top-layer <dialog> with a damped 300ms opacity + translate reveal (zero bounce, zero scale squish), backdrop blur, light-dismiss, and global ⌘K / Ctrl+K shortcut listener."
  >
    <JStack gap="item" style="width: 100%; max-width: 36rem">
      <JInline gap="related" align="center">
        <button
          type="button"
          style="
            appearance: none;
            flex: 1 1 16rem;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--j-space-3);
            min-height: var(--j-control-md);
            padding-inline: var(--j-space-3) var(--j-space-2);
            border: 1px solid var(--j-border-strong);
            border-radius: var(--j-radius-md);
            background: var(--j-surface-1);
            color: var(--j-fg-muted);
            box-shadow: var(--j-inset-highlight), var(--j-shadow-xs);
            font: inherit;
            font-size: var(--j-text-sm);
            cursor: pointer;
          "
          @click="modalOpen = true"
        >
          <span style="display: inline-flex; align-items: center; gap: var(--j-space-2)">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
              <path d="M11.5 11.5 14 14M7.25 12.5a5.25 5.25 0 1 1 0-10.5 5.25 5.25 0 0 1 0 10.5Z" />
            </svg>
            <span>Search commands or jump to…</span>
          </span>
          <span style="display: inline-flex; align-items: center; gap: var(--j-space-1)">
            <JKbd size="sm">⌘</JKbd>
            <JKbd size="sm">K</JKbd>
          </span>
        </button>

        <JButton variant="solid" tone="accent" @click="modalOpen = true">
          Launch Palette
        </JButton>
      </JInline>

      <JInline gap="inline" align="center">
        <JBadge size="sm" variant="soft" tone="accent">
          Last executed: {{ lastExecuted.label }}
        </JBadge>
        <JBadge size="sm" variant="outline" tone="neutral">
          {{ lastExecuted.value }} · {{ lastExecuted.time }}
        </JBadge>
      </JInline>

      <JCommandPalette
        v-model:open="modalOpen"
        v-model:query="modalQuery"
        shortcut="k"
        :groups="workspaceGroups"
        placeholder="Type a command or search workspace…"
        @select="onModalSelect"
      />
    </JStack>
  </DemoSection>

  <DemoSection
    title="Inline Surface Preview"
    description="Set inline to render the exact same WAI-ARIA combobox + listbox surface directly on the stage — inspect group headers, leading stroke icons, and multi-key <kbd> chords or filter live."
  >
    <JStack gap="item" style="width: 100%; max-width: 36rem">
      <JInline justify="between" align="center">
        <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
          Active inline selection: <strong style="color: var(--j-fg)">{{ inlineLast }}</strong>
        </span>
        <span v-if="inlineQuery" style="font-family: var(--j-font-mono); font-size: var(--j-text-xs); color: var(--j-fg-subtle)">
          query="{{ inlineQuery }}"
        </span>
      </JInline>

      <JCommandPalette
        v-model:query="inlineQuery"
        inline
        :groups="workspaceGroups"
        placeholder="Filter commands by title, group, or keyword…"
        aria-label="Inline command palette preview"
        @select="onInlineSelect"
      />
    </JStack>
  </DemoSection>

  <DemoSection
    title="Multi-Page Namespace Drilldown"
    description="Items with nested children push a breadcrumb pill into the header instead of closing. Press Enter on a namespace (e.g. Switch theme…) to drill in, and press Backspace on an empty query or click Root to step back."
  >
    <JStack gap="item" style="width: 100%; max-width: 36rem">
      <JInline justify="between" align="center">
        <JInline gap="inline" align="center">
          <JBadge size="sm" variant="soft" tone="neutral">Theme: {{ activeThemeSummary }}</JBadge>
          <JBadge size="sm" variant="soft" tone="info">Cluster: {{ activeEnvSummary }}</JBadge>
        </JInline>
        <JButton size="sm" variant="outline" tone="neutral" @click="drillOpen = true">
          Open Drilldown Modal
        </JButton>
      </JInline>

      <JCommandPalette
        inline
        :items="drilldownItems"
        placeholder="Choose a namespace or run a command…"
        aria-label="Multi-page command palette drilldown"
        @select="onDrillSelect"
      />

      <JCommandPalette
        v-model:open="drillOpen"
        :items="drilldownItems"
        placeholder="Choose a namespace (Backspace returns to Root)…"
        aria-label="Modal multi-page command palette"
        @select="onDrillSelect"
      />
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Zero-framework <dialog class=&quot;j-command-palette&quot;> + initCommandPalettes().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
