<script lang="ts">
export const meta = {
  name: 'Kbd',
  group: 'Display',
  order: 12,
  description: 'Precision key cap with a crisp hairline edge and a quiet 1px bottom bevel.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import { JKbd, JInline, JList, JListItem } from '@jenni/vue';

const shortcuts = [
  { label: 'Command palette', keys: ['⌘', 'K'] },
  { label: 'Create issue', keys: ['C'] },
  { label: 'Quick search', keys: ['/'] },
  { label: 'Toggle sidebar', keys: ['⌘', '\\'] },
  { label: 'Go to inbox', keys: ['G', 'I'] },
];

const html = `<div class="j-inline" data-gap="inline">
  <kbd class="j-kbd">⌘</kbd>
  <kbd class="j-kbd">K</kbd>
  <kbd class="j-kbd" data-size="lg">Shift</kbd>
</div>`;
</script>

<template>
  <DemoSection title="Keys">
    <JInline gap="related">
      <JKbd>⌘</JKbd><JKbd>⌥</JKbd><JKbd>⇧</JKbd><JKbd>⌃</JKbd><JKbd>↵</JKbd><JKbd>⌫</JKbd>
      <JKbd>Esc</JKbd><JKbd>Tab</JKbd><JKbd>Space</JKbd><JKbd>A</JKbd><JKbd>1</JKbd>
      <JKbd>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12.5v-9M4 7.5l4-4 4 4" /></svg>
      </JKbd>
    </JInline>
  </DemoSection>

  <DemoSection title="Sizes" description="sm · md (default) · lg">
    <JInline gap="group">
      <JInline gap="inline">
        <JKbd size="sm">⌘</JKbd><JKbd size="sm">K</JKbd>
      </JInline>
      <JInline gap="inline">
        <JKbd>⌘</JKbd><JKbd>K</JKbd>
      </JInline>
      <JInline gap="inline">
        <JKbd size="lg">⌘</JKbd><JKbd size="lg">K</JKbd>
      </JInline>
    </JInline>
  </DemoSection>

  <DemoSection title="Inline prose" description="Aligns cleanly with body text without disrupting line rhythm.">
    <p style="font-size:var(--j-text-md);max-width:var(--j-measure-prose)">
      Press <JKbd>⌘</JKbd> <JKbd>K</JKbd> to open the command palette, or <JKbd>?</JKbd> to inspect workspace shortcuts.
    </p>
  </DemoSection>

  <DemoSection title="Shortcut reference" description="Compact 32px list rows paired with trailing key chords.">
    <JList variant="card" lines="compact" style="width:100%;max-width:340px">
      <JListItem v-for="s in shortcuts" :key="s.label" :title="s.label">
        <template #trailing>
          <JInline gap="inline">
            <JKbd v-for="k in s.keys" :key="k" size="sm">{{ k }}</JKbd>
          </JInline>
        </template>
      </JListItem>
    </JList>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
