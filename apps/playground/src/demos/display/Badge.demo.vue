<script lang="ts">
export const meta = {
  name: 'Badge',
  group: 'Display',
  order: 1,
  description: 'Compact label for status, counts and metadata.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import { JBadge, JAvatar, JInline, JStack, JList, JListItem } from '@jenni/vue';

const tones = ['accent', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const variants = ['soft', 'solid', 'outline'] as const;
const members = [
  { name: 'Ada Lovelace', handle: 'ada@acme.dev', role: 'Owner', tone: 'accent' },
  { name: 'Grace Hopper', handle: 'grace@acme.dev', role: 'Maintainer', tone: 'info' },
  { name: 'Alan Turing', handle: 'alan@acme.dev', role: 'Invited', tone: 'neutral' },
] as const;

const html = `<div class="j-inline" data-gap="related">
  <span class="j-badge">Soft</span>
  <span class="j-badge" data-variant="solid" data-tone="success">Solid</span>
  <span class="j-badge" data-variant="outline" data-tone="neutral">Outline</span>
  <span class="j-badge" data-tone="warning"><span class="j-badge__dot"></span>Degraded</span>
</div>`;
</script>

<template>
  <DemoSection title="Variants" description="Soft is the calm default. Solid for high-contrast emphasis, outline for quiet metadata.">
    <JInline gap="related">
      <JBadge v-for="v in variants" :key="v" :variant="v">{{ v }}</JBadge>
    </JInline>
  </DemoSection>

  <DemoSection title="Tones" description="Every semantic tone across soft, solid and outline variants.">
    <JStack gap="related" align="center">
      <JInline v-for="v in variants" :key="v" gap="related" justify="center">
        <JBadge v-for="t in tones" :key="t" :variant="v" :tone="t">{{ t }}</JBadge>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes" description="sm · md (default) · lg, scaled with workspace density.">
    <JInline gap="related">
      <JBadge size="sm">Small</JBadge>
      <JBadge>Medium</JBadge>
      <JBadge size="lg">Large</JBadge>
      <JBadge size="sm" tone="success" dot>Live</JBadge>
      <JBadge tone="success" dot>Live</JBadge>
      <JBadge size="lg" tone="success" dot>Live</JBadge>
    </JInline>
  </DemoSection>

  <DemoSection title="Dot & icon" description="Status dot, leading icon or tabular count.">
    <JInline gap="related">
      <JBadge tone="success" dot>Operational</JBadge>
      <JBadge tone="warning" dot>Degraded</JBadge>
      <JBadge tone="danger" dot>Outage</JBadge>
      <JBadge variant="outline" tone="neutral" dot>Draft</JBadge>
      <JBadge variant="solid" tone="danger" dot>Recording</JBadge>
      <JBadge tone="info">
        <template #icon>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.75 9.9 5.6l4.25.62-3.08 3 .73 4.23L8 11.45l-3.8 2 .73-4.23-3.08-3 4.25-.62z" /></svg>
        </template>
        Featured
      </JBadge>
      <JBadge variant="solid" tone="neutral">v2.4.0</JBadge>
      <JBadge variant="solid" size="sm">12</JBadge>
    </JInline>
  </DemoSection>

  <DemoSection title="In context" description="Role badges aligned in a structured member list.">
    <JList variant="card" lines="2" inset-divider style="width:100%;max-width:440px">
      <JListItem v-for="p in members" :key="p.name" :title="p.name" :description="p.handle">
        <template #leading>
          <JAvatar :name="p.name" size="sm" />
        </template>
        <template #trailing>
          <JBadge :tone="p.tone" :variant="p.role === 'Invited' ? 'outline' : 'soft'">{{ p.role }}</JBadge>
        </template>
      </JListItem>
    </JList>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
