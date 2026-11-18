<script lang="ts">
export const meta = {
  name: 'Radio',
  group: 'Forms',
  order: 12,
  description: 'Pick one option from a set. Native radios, arrow-key navigation for free.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JInline, JRadio, JRadioGroup } from '@jenni/vue';

const tones = ['accent', 'neutral', 'danger', 'success', 'warning', 'info'] as const;
const plan = ref('pro');
const density = ref('default');
const sizeRadios = reactive({ sm: 'a', md: 'a', lg: 'a' });
const invalidRadio = ref('');
const partialRadio = ref('b');
const plans = [
  { value: 'hobby', label: 'Hobby', description: 'Free forever. For personal projects.' },
  { value: 'pro', label: 'Pro — $20/mo', description: 'Unlimited projects, team previews.' },
  { value: 'enterprise', label: 'Enterprise', description: 'SSO, audit logs, 99.99% SLA.' },
];

const html = `<div class="j-radio-group" role="radiogroup" aria-label="Theme">
  <label class="j-choice"><input type="radio" class="j-radio" name="theme" checked> System</label>
  <label class="j-choice"><input type="radio" class="j-radio" name="theme"> Light</label>
  <label class="j-choice"><input type="radio" class="j-radio" name="theme"> Dark</label>
</div>`;
</script>

<template>
  <DemoSection title="Group" description="v-model on JRadioGroup. Arrow keys move the selection.">
    <JInline gap="group" align="start">
      <JRadioGroup v-model="density" aria-label="Density">
        <JRadio value="compact">Compact</JRadio>
        <JRadio value="default">Default</JRadio>
        <JRadio value="roomy">Roomy</JRadio>
      </JRadioGroup>
      <span style="color: var(--j-fg-muted); font-size: var(--j-text-sm)">Selected: {{ density }}</span>
    </JInline>
  </DemoSection>

  <DemoSection title="Horizontal">
    <JRadioGroup v-model="density" orientation="horizontal" aria-label="Density">
      <JRadio value="compact">Compact</JRadio>
      <JRadio value="default">Default</JRadio>
      <JRadio value="roomy">Roomy</JRadio>
    </JRadioGroup>
  </DemoSection>

  <DemoSection title="Sizes">
    <JInline gap="group" align="start">
      <JRadioGroup v-for="s in (['sm', 'md', 'lg'] as const)" :key="s" v-model="sizeRadios[s]" :size="s" :aria-label="s">
        <JRadio value="a">{{ s }} one</JRadio>
        <JRadio value="b">{{ s }} two</JRadio>
      </JRadioGroup>
    </JInline>
  </DemoSection>

  <DemoSection title="Tones">
    <JInline gap="group">
      <JRadio v-for="t in tones" :key="t" :tone="t" :value="t" :model-value="t">{{ t }}</JRadio>
    </JInline>
  </DemoSection>

  <DemoSection title="States" description="Hover, focus, invalid, disabled (single + whole group).">
    <JInline gap="group" align="start">
      <JRadioGroup v-model="invalidRadio" invalid aria-label="Invalid">
        <JRadio value="a">Invalid A</JRadio>
        <JRadio value="b">Invalid B</JRadio>
      </JRadioGroup>
      <JRadioGroup v-model="partialRadio" aria-label="Partly disabled">
        <JRadio value="a" disabled>Disabled</JRadio>
        <JRadio value="b">Enabled</JRadio>
      </JRadioGroup>
      <JRadioGroup disabled model-value="a" aria-label="Disabled group">
        <JRadio value="a">Disabled checked</JRadio>
        <JRadio value="b">Disabled</JRadio>
      </JRadioGroup>
    </JInline>
  </DemoSection>

  <DemoSection title="Composition" description="Plan picker with descriptions.">
    <JRadioGroup v-model="plan" aria-label="Plan" style="width: 100%; max-width: 400px; gap: var(--j-gap-related)">
      <JRadio
        v-for="p in plans"
        :key="p.value"
        :value="p.value"
        :label="p.label"
        :description="p.description"
        :style="{
          padding: 'var(--j-space-3) var(--j-space-4)',
          border: '1px solid',
          borderColor: plan === p.value ? 'var(--j-accent)' : 'var(--j-border)',
          borderRadius: 'var(--j-radius-lg)',
          background: plan === p.value ? 'var(--j-accent-soft)' : 'var(--j-surface-1)',
          display: 'flex',
          transition: 'border-color var(--j-duration-fast) var(--j-ease-out), background-color var(--j-duration-fast) var(--j-ease-out)',
        }"
      />
    </JRadioGroup>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
