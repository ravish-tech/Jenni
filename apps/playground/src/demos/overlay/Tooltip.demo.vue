<script lang="ts">
export const meta = {
  name: 'Tooltip',
  group: 'Overlay',
  order: 1,
  description: 'Brief contextual label on hover or keyboard focus, with instant warm handoff and shortcut hints.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import { JTooltip, JButton, JButtonGroup, JInline } from '@jenni/vue';

const sides = ['top', 'right', 'bottom', 'left'] as const;

const html = `<div class="j-inline" data-gap="related">
  <button class="j-button" data-variant="outline" data-j-tooltip="demo-html-tip-1">
    Hover or focus
  </button>
  <div class="j-tooltip" id="demo-html-tip-1" popover="manual" role="tooltip" data-side="top" data-arrow>
    Copy link <kbd class="j-tooltip__kbd">⌘</kbd><kbd class="j-tooltip__kbd">C</kbd>
  </div>

  <button class="j-button" data-variant="soft" data-j-tooltip="demo-html-tip-2">
    Bottom hint
  </button>
  <div class="j-tooltip" id="demo-html-tip-2" popover="manual" role="tooltip" data-side="bottom">
    Instant when warm
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Placement" description="top (default) · right · bottom · left — flips automatically near viewport edges.">
    <JInline gap="item" justify="center">
      <JTooltip v-for="s in sides" :key="s" :side="s" :content="`Placed on ${s}`">
        <JButton variant="outline">{{ s[0]!.toUpperCase() + s.slice(1) }}</JButton>
      </JTooltip>
    </JInline>
  </DemoSection>

  <DemoSection title="Arrow & alignment" description="Optional directional arrow across start, center and end alignments.">
    <JInline gap="item" justify="center">
      <JTooltip content="Start aligned" align="start" arrow>
        <JButton variant="soft" tone="neutral">Align start</JButton>
      </JTooltip>
      <JTooltip content="Centered with arrow" arrow>
        <JButton variant="soft">Centered arrow</JButton>
      </JTooltip>
      <JTooltip content="End aligned" align="end" arrow>
        <JButton variant="soft" tone="neutral">Align end</JButton>
      </JTooltip>
    </JInline>
  </DemoSection>

  <DemoSection title="Shortcuts & toolbar" description="Move across the toolbar — warm tooltips transition with zero delay like native desktop chrome.">
    <JButtonGroup variant="outline">
      <JTooltip content="Bold" :kbd="['⌘', 'B']" arrow>
        <JButton icon-only aria-label="Bold">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3.5h4.25a2.25 2.25 0 0 1 0 4.5H4.5zm0 4.5h5a2.25 2.25 0 0 1 0 4.5H4.5z" /></svg>
        </JButton>
      </JTooltip>
      <JTooltip content="Italic" :kbd="['⌘', 'I']" arrow>
        <JButton icon-only aria-label="Italic">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 3.5h5M4.5 12.5h5M9.5 3.5l-3 9" /></svg>
        </JButton>
      </JTooltip>
      <JTooltip content="Insert link" :kbd="['⌘', 'K']" arrow>
        <JButton icon-only aria-label="Insert link">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6.5 9.5l3-3M5.5 7L4.2 8.3a2.1 2.1 0 0 0 3 3L8.5 10M10.5 9l1.3-1.3a2.1 2.1 0 0 0-3-3L7.5 6" /></svg>
        </JButton>
      </JTooltip>
      <JTooltip content="Command palette" :kbd="['⇧', '⌘', 'P']" arrow>
        <JButton icon-only aria-label="Command palette">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 6 3 2-3 2M9 10h2.5" /><rect x="2" y="2.5" width="12" height="11" rx="2" /></svg>
        </JButton>
      </JTooltip>
    </JButtonGroup>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Native popover='manual' + CSS anchor positioning + initTooltips().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
