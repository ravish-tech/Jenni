<script lang="ts">
export const meta = {
  name: 'Spinner',
  group: 'Display',
  order: 10,
  description: 'Poised CSS ring indicator that inherits currentColor.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import { JSpinner, JCard, JButton, JInline } from 'jenni-vue';

const colors = [
  'var(--j-fg-muted)',
  'var(--j-accent)',
  'var(--j-success)',
  'var(--j-warning)',
  'var(--j-danger)',
] as const;

const html = `<div class="j-inline" data-gap="field">
  <span class="j-spinner" role="status" aria-label="Loading"></span>
  <span class="j-spinner" data-size="lg" style="color: var(--j-accent)" role="status" aria-label="Loading"></span>
</div>`;
</script>

<template>
  <DemoSection title="Sizes" description="sm (12px) · md (16px) · lg (24px), or custom via --j-spinner-size.">
    <JInline gap="group">
      <JSpinner size="sm" />
      <JSpinner />
      <JSpinner size="lg" />
      <JSpinner style="--j-spinner-size:36px" />
    </JInline>
  </DemoSection>

  <DemoSection title="Color" description="Inherits currentColor with an unhurried 0.95s cadence.">
    <JInline gap="group">
      <JSpinner v-for="c in colors" :key="c" size="lg" :style="{ color: c }" />
    </JInline>
  </DemoSection>

  <DemoSection title="In context" description="Paired inline with buttons, status copy or empty card states.">
    <JInline gap="group">
      <JButton disabled>
        <JSpinner size="sm" label="Saving" />
        Saving changes
      </JButton>
      <JInline as="span" gap="related" style="color:var(--j-fg-muted);font-size:var(--j-text-sm)">
        <JSpinner size="sm" />
        <span>Syncing 3 artifacts</span>
      </JInline>
      <JCard size="sm" style="width:220px;align-items:center;justify-content:center;min-height:112px;color:var(--j-fg-subtle)">
        <JSpinner size="lg" label="Loading metrics" />
      </JCard>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
