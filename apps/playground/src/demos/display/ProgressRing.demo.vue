<script lang="ts">
export const meta = {
  name: 'Progress Ring',
  group: 'Display',
  order: 9.5,
  description: 'Circular HD vector progress indicator with 300ms damped glide, tabular center readouts, and calm indeterminate sweep.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JProgressRing, JCard, JStack, JInline, JButton } from 'jenni-vue';

const tones = ['accent', 'neutral', 'info', 'success', 'warning', 'danger'] as const;

const milestones = [18, 44, 68, 86, 100];
let stepIdx = 1;
const live = ref(milestones[0]!);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  timer = setInterval(() => {
    live.value = milestones[stepIdx % milestones.length]!;
    stepIdx += 1;
  }, 1800);
});

onBeforeUnmount(() => clearInterval(timer));

function nudge(delta: number) {
  live.value = Math.max(0, Math.min(100, live.value + delta));
}

const html = `<div class="j-progress-ring" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="75" style="--_offset:27.88">
  <svg class="j-progress-ring__svg" viewBox="0 0 40 40" fill="none" shape-rendering="geometricPrecision" aria-hidden="true">
    <circle class="j-progress-ring__track" cx="20" cy="20" r="17.75" />
    <circle class="j-progress-ring__fill" cx="20" cy="20" r="17.75" />
  </svg>
  <span class="j-progress-ring__label">75%</span>
</div>`;
</script>

<template>
  <DemoSection title="Live Determinate Glide" description="Transitions smoothly with a 300ms emphasized curve and zero overshoot.">
    <JInline gap="group" align="center">
      <JProgressRing :value="live" size="xl" show-value label="Deployment progress" />
      <JStack gap="related">
        <span style="font-size:var(--j-text-sm);color:var(--j-fg-muted)">
          Publishing release artifacts (<span style="font-variant-numeric:tabular-nums">{{ live }}%</span>)
        </span>
        <JInline gap="related">
          <JButton size="sm" variant="outline" @click="nudge(-15)">−15%</JButton>
          <JButton size="sm" variant="outline" @click="nudge(15)">+15%</JButton>
        </JInline>
      </JStack>
    </JInline>
  </DemoSection>

  <DemoSection title="Sizes" description="xs (20px) · sm (28px) · md (40px) · lg (56px) · xl (76px), plus custom pixel dimensions.">
    <JInline gap="group" align="center">
      <JProgressRing size="xs" :value="68" label="68%" />
      <JProgressRing size="sm" :value="68" label="68%" />
      <JProgressRing size="md" :value="68" show-value label="68%" />
      <JProgressRing size="lg" :value="68" show-value label="68%" />
      <JProgressRing size="xl" :value="68" show-value label="68%" />
      <JProgressRing :size="92" :thickness="3" :value="68" show-value label="68%" />
    </JInline>
  </DemoSection>

  <DemoSection title="Tones" description="Semantic status tones with matching rounded vector caps.">
    <JInline gap="group" align="center">
      <JProgressRing
        v-for="(t, i) in tones"
        :key="t"
        :tone="t"
        size="lg"
        :value="25 + i * 14"
        show-value
        :label="t"
      />
    </JInline>
  </DemoSection>

  <DemoSection title="Custom Center Readout & Indeterminate" description="Default slot renders tabular metrics or fractions; omit value for a calm indeterminate sweep.">
    <JInline gap="group" align="center">
      <JProgressRing :value="4" :max="5" size="xl" tone="success" label="4 of 5 checks passed">
        4/5
      </JProgressRing>
      <JProgressRing size="lg" tone="accent" label="Calculating checksums" />
      <JCard size="sm" style="min-width:240px">
        <JInline gap="item" align="center">
          <JProgressRing :value="86" size="lg" tone="warning" show-value label="Quota usage" />
          <JStack gap="inline">
            <strong style="font-size:var(--j-text-sm)">Compute quota</strong>
            <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted);font-variant-numeric:tabular-nums">
              43.0 / 50.0 vCPU hrs
            </span>
          </JStack>
        </JInline>
      </JCard>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
