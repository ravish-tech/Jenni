<script lang="ts">
export const meta = {
  name: 'Skeleton',
  group: 'Display',
  order: 11,
  description: 'Quiet, low-contrast shimmer placeholder for loading layouts. Static under reduced motion.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JSkeleton, JCard, JAvatar, JBadge, JButton, JSwitch, JInline, JStack } from 'jenni-vue';

const loading = ref(true);
const html = `<div class="j-inline" data-gap="item" data-nowrap style="width:100%;max-width:340px">
  <div class="j-skeleton" data-shape="circle"></div>
  <div class="j-skeleton-lines" style="flex:1">
    <div class="j-skeleton" data-shape="text" style="inline-size:42%"></div>
    <div class="j-skeleton" data-shape="text" style="inline-size:74%"></div>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Shapes" description="text · circle · rect">
    <JInline gap="group">
      <JSkeleton shape="text" width="160px" />
      <JSkeleton shape="circle" />
      <JSkeleton shape="circle" :width="52" />
      <JSkeleton width="128px" height="68px" />
    </JInline>
  </DemoSection>

  <DemoSection title="Lines" description="Stacked text lines spaced with --j-gap-inline; the final line tapers naturally.">
    <div style="width:100%;max-width:420px">
      <JSkeleton :lines="4" />
    </div>
  </DemoSection>

  <DemoSection title="Wrap content" description="Wrapping a live component preserves its exact dimensions without layout shift.">
    <JInline gap="item">
      <JSkeleton><JButton>Save changes</JButton></JSkeleton>
      <JSkeleton><JBadge>Pending review</JBadge></JSkeleton>
    </JInline>
  </DemoSection>

  <DemoSection title="Loading card" description="Toggle loading state to verify zero-shift replacement.">
    <JStack gap="field" style="width:100%;max-width:380px">
      <JSwitch v-model="loading" size="sm" label="Simulate loading state" />
      <JCard>
        <JInline gap="item" nowrap>
          <JSkeleton v-if="loading" shape="circle" :width="36" />
          <JAvatar v-else name="Ada Lovelace" size="md" tone="accent" />
          <JStack gap="inline" style="flex:1">
            <template v-if="loading">
              <JSkeleton shape="text" width="42%" style="margin-block:0" />
              <JSkeleton shape="text" width="68%" style="margin-block:0" />
            </template>
            <template v-else>
              <strong style="font-size:var(--j-text-md);line-height:var(--j-leading-tight)">Ada Lovelace</strong>
              <span style="color:var(--j-fg-muted);font-size:var(--j-text-sm);line-height:var(--j-leading-tight)">Published 3 architecture notes</span>
            </template>
          </JStack>
        </JInline>
        <JSkeleton v-if="loading" :lines="3" />
        <p v-else style="font-size:var(--j-text-md);color:var(--j-fg-muted)">
          The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.
        </p>
      </JCard>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
