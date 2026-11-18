<script lang="ts">
export const meta = {
  name: 'Progress',
  group: 'Display',
  order: 9,
  description: 'Styled native <progress> with smooth determinate transitions and a serene indeterminate glide.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JProgress, JCard, JBadge, JStack, JInline } from 'jenni-vue';

const tones = ['accent', 'neutral', 'info', 'success', 'warning', 'danger'] as const;
const steps = [18, 42, 68, 88, 100];
let idx = 1;
const live = ref(steps[0]!);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  timer = setInterval(() => {
    live.value = steps[idx % steps.length]!;
    idx += 1;
  }, 1600);
});
onBeforeUnmount(() => clearInterval(timer));

const html = `<div class="j-stack" data-gap="field" style="width:100%;max-width:420px">
  <progress class="j-progress" value="64" max="100" aria-label="Upload"></progress>
  <progress class="j-progress" data-tone="success" data-size="lg" value="90" max="100"></progress>
  <progress class="j-progress" aria-label="Loading"></progress>
</div>`;
</script>

<template>
  <DemoSection title="Determinate" description="Bar width settles smoothly on value changes using --j-ease-emphasized.">
    <JStack gap="field" style="width:100%;max-width:420px">
      <JStack gap="inline">
        <JInline justify="between" style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">
          <span>Uploading release bundle</span>
          <span style="font-variant-numeric:tabular-nums">{{ live }}%</span>
        </JInline>
        <JProgress :value="live" label="Upload progress" />
      </JStack>
      <JProgress :value="38" label="38%" />
    </JStack>
  </DemoSection>

  <DemoSection title="Indeterminate" description="Omit value for an unhurried 2.1s glide.">
    <JStack gap="field" style="width:100%;max-width:420px">
      <JProgress label="Indexing repository" />
      <JProgress tone="neutral" size="sm" label="Background sync" />
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes" description="sm (4px) · md (6px) · lg (10px)">
    <JStack gap="field" style="width:100%;max-width:420px">
      <JProgress size="sm" :value="40" />
      <JProgress :value="62" />
      <JProgress size="lg" :value="82" />
    </JStack>
  </DemoSection>

  <DemoSection title="Tones">
    <JStack gap="field" style="width:100%;max-width:420px">
      <JProgress v-for="(t, i) in tones" :key="t" :tone="t" :value="28 + i * 12" />
    </JStack>
  </DemoSection>

  <DemoSection title="Storage card" description="Composition pairing progress, tabular counters and a tone badge.">
    <JCard size="sm" style="width:100%;max-width:360px">
      <JInline justify="between">
        <strong style="font-size:var(--j-text-sm)">Artifact storage</strong>
        <JBadge tone="warning" size="sm">86%</JBadge>
      </JInline>
      <JProgress tone="warning" :value="86" label="Storage used" />
      <JInline justify="between" style="font-size:var(--j-text-xs);color:var(--j-fg-muted);font-variant-numeric:tabular-nums">
        <span>43.0 GB of 50 GB</span>
        <span>7.0 GB available</span>
      </JInline>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
