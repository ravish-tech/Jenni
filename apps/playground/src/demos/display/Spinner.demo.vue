<script lang="ts">
export const meta = {
  name: 'Spinner',
  group: 'Display',
  order: 10,
  description: 'Crisp HD vector loading indicator with ring, sweeping arc, and calm pulse-dot variants.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import { JSpinner, JCard, JButton, JInline, JStack } from 'jenni-vue';

const tones = ['accent', 'neutral', 'info', 'success', 'warning', 'danger'] as const;

const html = `<div class="j-inline" data-gap="field">
  <span class="j-spinner" data-size="sm" role="status" aria-label="Loading"></span>
  <span class="j-spinner" role="status" aria-label="Loading"></span>
  <span class="j-spinner" data-size="xl" data-tone="accent" role="status" aria-label="Loading"></span>
</div>`;
</script>

<template>
  <DemoSection title="Sizes & HD Vector Clarity" description="xs (12px) · sm (14px) · md (16px) · lg (20px) · xl (28px), plus custom pixel scales (48px) with razor-sharp round caps.">
    <JInline gap="group" align="center">
      <JStack gap="inline" align="center">
        <JSpinner size="xs" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)">xs</span>
      </JStack>
      <JStack gap="inline" align="center">
        <JSpinner size="sm" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)">sm</span>
      </JStack>
      <JStack gap="inline" align="center">
        <JSpinner size="md" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)">md</span>
      </JStack>
      <JStack gap="inline" align="center">
        <JSpinner size="lg" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)">lg</span>
      </JStack>
      <JStack gap="inline" align="center">
        <JSpinner size="xl" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)">xl</span>
      </JStack>
      <JStack gap="inline" align="center">
        <JSpinner :size="48" :thickness="2.1" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)">48px</span>
      </JStack>
    </JInline>
  </DemoSection>

  <DemoSection title="Variants" description="ring (track + harmonic arc) · arc (minimalist sweep) · dots (calm staggered opacity pulse, zero bounce).">
    <JInline gap="group" align="center">
      <JStack gap="inline" align="center">
        <JSpinner variant="ring" size="xl" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">ring</span>
      </JStack>
      <JStack gap="inline" align="center">
        <JSpinner variant="arc" size="xl" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">arc</span>
      </JStack>
      <JStack gap="inline" align="center">
        <JSpinner variant="dots" size="xl" tone="accent" />
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">dots</span>
      </JStack>
    </JInline>
  </DemoSection>

  <DemoSection title="Tones" description="Semantic data-tone presets or inherited currentColor.">
    <JInline gap="group" align="center">
      <JSpinner v-for="t in tones" :key="t" :tone="t" size="lg" />
    </JInline>
  </DemoSection>

  <DemoSection title="In context" description="Paired inline with buttons, status copy, or empty card states.">
    <JInline gap="group" align="center">
      <JButton loading>Saving changes</JButton>
      <JInline as="span" gap="inline" align="center" style="color:var(--j-fg-muted);font-size:var(--j-text-sm)">
        <JSpinner size="sm" tone="accent" />
        <span>Syncing 3 artifacts</span>
      </JInline>
      <JCard size="sm" style="width:220px;align-items:center;justify-content:center;min-height:112px;color:var(--j-fg-muted)">
        <JSpinner size="xl" tone="neutral" label="Loading metrics" />
      </JCard>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Empty .j-spinner spans automatically receive a crisp vector SVG mask.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
