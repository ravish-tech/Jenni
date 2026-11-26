<script lang="ts">
export const meta = {
  name: 'Theme API & Shortcuts',
  group: 'Overlay',
  order: 12,
  wide: true,
  description: 'Live JS color resolver for Charts, CodeMirror & xterm.js (useThemeTokens), plus tab-visibility-aware keyboard shortcuts (useShortcut).',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  useThemeTokens,
  useShortcut,
  formatShortcut,
  JTabs,
  JTabList,
  JTab,
  JTabPanel,
  JBadge,
  JKbd,
  JCard,
  JInline,
  JStack,
} from 'jenni-vue';

const tokens = useThemeTokens();
const activeTab = ref('editor');
const shortcutLog = ref('Press Alt+R (or g then t) to test tab-scoped shortcuts');

const editorPaneRef = ref<HTMLElement | null>(null);
const terminalPaneRef = ref<HTMLElement | null>(null);

useShortcut(
  'alt+r',
  () => {
    shortcutLog.value = 'Triggered Alt+R inside active CODE EDITOR tab (terminal tab shortcut ignored!)';
  },
  { scope: editorPaneRef },
);

useShortcut(
  'alt+r',
  () => {
    shortcutLog.value = 'Triggered Alt+R inside active TERMINAL tab (editor tab shortcut ignored!)';
  },
  { scope: terminalPaneRef },
);

useShortcut('g t', () => {
  activeTab.value = activeTab.value === 'editor' ? 'terminal' : 'editor';
  shortcutLog.value = `Switched to ${activeTab.value} via 2-step chord "g then t"`;
});

const altRKeys = formatShortcut('alt+r');

const ansiKeys = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite',
] as const;

const code = `import { useThemeTokens, useShortcut } from 'jenni-vue';

// 1. Live resolved hex/rgba colors for ECharts, CodeMirror & xterm.js
const theme = useThemeTokens();
// xterm.options.theme = theme.value.terminal;
// chart.setOption({ color: theme.value.charts.series });

// 2. Visibility-aware shortcuts (automatically ignored when parent tab is hidden!)
useShortcut('mod+enter', () => runNotebookCell(), { scope: tabRootRef });`;
</script>

<template>
  <DemoSection
    title="Live Resolved Chart, Syntax & ANSI Terminal Tokens (R08)"
    description="Toggle Light / Dark mode or drag the Accent Hue slider in the top bar Tokens menu — every hex string below resolves live via useThemeTokens() / onThemeChange()."
  >
    <JStack gap="field" style="width: 100%">
      <!-- 1. Chart Series 1..8 -->
      <JCard size="sm" title="Chart Categorical Series (--j-chart-1 .. --j-chart-8)">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px">
          <div
            v-for="(hex, i) in tokens.charts.series"
            :key="i"
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 6px 8px;
              border-radius: var(--j-radius-sm);
              background: var(--j-surface-2);
              font-family: var(--j-font-mono);
              font-size: 11px;
            "
          >
            <span
              :style="{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: hex,
                flexShrink: 0,
              }"
            />
            <span>c{{ i + 1 }} {{ hex }}</span>
          </div>
        </div>
      </JCard>

      <!-- 2. Syntax + ANSI Terminal Preview -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--j-space-3)">
        <div
          :style="{
            padding: 'var(--j-space-4)',
            borderRadius: 'var(--j-radius-md)',
            background: tokens.syntax.bg,
            color: tokens.syntax.fg,
            boxShadow: 'inset 0 0 0 1px var(--j-border)',
            fontFamily: 'var(--j-font-mono)',
            fontSize: 'var(--j-text-xs)',
            lineHeight: 1.65,
          }"
        >
          <div :style="{ color: tokens.syntax.comment }">/* CodeMirror / Syntax Tokens ({{ tokens.syntax.bg }}) */</div>
          <div>
            <span :style="{ color: tokens.syntax.keyword }">export function</span>
            {{ ' ' }}
            <span :style="{ color: tokens.syntax.function }">syncPalette</span>(<span :style="{ color: tokens.syntax.variable }">term</span>:
            <span :style="{ color: tokens.syntax.type }">Terminal</span>) {
          </div>
          <div style="padding-left: 16px">
            <span :style="{ color: tokens.syntax.keyword }">const</span> limit =
            <span :style="{ color: tokens.syntax.number }">60</span>;
            <span :style="{ color: tokens.syntax.string }">'0ms overshoot'</span>;
          </div>
          <div>}</div>
        </div>

        <div
          :style="{
            padding: 'var(--j-space-4)',
            borderRadius: 'var(--j-radius-md)',
            background: tokens.terminal.background,
            color: tokens.terminal.foreground,
            boxShadow: 'inset 0 0 0 1px var(--j-border)',
            fontFamily: 'var(--j-font-mono)',
            fontSize: 'var(--j-text-xs)',
          }"
        >
          <div style="margin-bottom: 8px">
            <span :style="{ color: tokens.terminal.green }">dev@studio</span>:<span :style="{ color: tokens.terminal.blue }">~/workspace</span>$
            xterm.options.theme ({{ tokens.terminal.background }})
          </div>
          <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px">
            <div
              v-for="k in ansiKeys"
              :key="k"
              :title="`${k}: ${tokens.terminal[k]}`"
              :style="{
                height: '20px',
                borderRadius: '3px',
                background: tokens.terminal[k],
                boxShadow: 'inset 0 0 0 1px rgba(128,128,128,0.25)',
              }"
            />
          </div>
        </div>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Tab-Visibility-Aware Shortcut Registry"
    description="Both tabs below bind the exact same shortcut (Alt+R). Only the visible tab fires; hidden tabs, inert drawers, and background panes behind open modals are ignored automatically."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" wrap>
        <JInline gap="inline">
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Active shortcut:</span>
          <JKbd v-for="k in altRKeys" :key="k" size="sm">{{ k }}</JKbd>
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">· Switch tab chord:</span>
          <JKbd size="sm">G</JKbd><JKbd size="sm">T</JKbd>
        </JInline>
        <JBadge tone="accent" variant="soft">{{ shortcutLog }}</JBadge>
      </JInline>

      <JTabs v-model="activeTab">
        <JTabList aria-label="Workspace panes">
          <JTab value="editor">Code Editor Tab</JTab>
          <JTab value="terminal">Streaming Terminal Tab</JTab>
        </JTabList>

        <JTabPanel value="editor">
          <div ref="editorPaneRef" style="padding: var(--j-space-4); border: 1px solid var(--j-border); border-radius: var(--j-radius-md)">
            Press <strong>Alt+R</strong> while this Editor tab is visible — only the Editor handler executes.
          </div>
        </JTabPanel>

        <JTabPanel value="terminal">
          <div ref="terminalPaneRef" style="padding: var(--j-space-4); border: 1px solid var(--j-border); border-radius: var(--j-radius-md)">
            Press <strong>Alt+R</strong> while this Terminal tab is visible — only the Terminal handler executes.
          </div>
        </JTabPanel>
      </JTabs>
    </JStack>
  </DemoSection>

  <DemoSection title="Usage">
    <DemoCode lang="vue" :code="code" code-only />
  </DemoSection>
</template>
