<script lang="ts">
export const meta = {
  name: 'Switch',
  group: 'Forms',
  order: 13,
  description: 'Precision on/off toggle. Native checkbox with role="switch" and a calm, weighted glide.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JInline, JList, JListItem, JStack, JSwitch } from 'jenni-vue';

const tones = ['accent', 'neutral', 'danger', 'success', 'warning', 'info'] as const;
const wifi = ref(true);
const sizeSwitches = reactive({ sm: true, md: true, lg: true });
const toneSwitches = reactive<Record<(typeof tones)[number], boolean>>({
  accent: true,
  neutral: true,
  danger: true,
  success: true,
  warning: true,
  info: true,
});
const settings = reactive({
  previews: true,
  comments: false,
  analytics: true,
  freeze: false,
});

const html = `<div class="j-stack" data-gap="item">
  <label class="j-choice">
    <input type="checkbox" role="switch" class="j-switch" checked>
    Airplane mode
  </label>
  <input type="checkbox" role="switch" class="j-switch" data-size="lg" data-tone="success" aria-label="Online">
</div>`;
</script>

<template>
  <DemoSection title="Basic" description="Crisp circular thumb with a weighted, zero-overshoot 300ms glide.">
    <JInline gap="group">
      <JSwitch v-model="wifi">Wi-Fi {{ wifi ? 'connected' : 'off' }}</JSwitch>
      <JSwitch aria-label="Bare switch" />
    </JInline>
  </DemoSection>

  <DemoSection title="Sizes" description="sm (28×16) · md (36×20) · lg (44×24), each with a 2px architectural inset.">
    <JInline gap="group">
      <JSwitch v-model="sizeSwitches.sm" size="sm">Small</JSwitch>
      <JSwitch v-model="sizeSwitches.md">Medium</JSwitch>
      <JSwitch v-model="sizeSwitches.lg" size="lg">Large</JSwitch>
    </JInline>
  </DemoSection>

  <DemoSection title="Tones" description="Poised OKLCH palette; neutral adapts cleanly across light and dark surfaces.">
    <JInline gap="group">
      <JSwitch v-for="t in tones" :key="t" v-model="toneSwitches[t]" :tone="t">{{ t }}</JSwitch>
    </JInline>
  </DemoSection>

  <DemoSection title="States" description="Hover, focus halo (Tab), invalid, and disabled.">
    <JInline gap="group">
      <JSwitch invalid>Required</JSwitch>
      <JSwitch disabled>Disabled off</JSwitch>
      <JSwitch disabled :model-value="true">Disabled on</JSwitch>
    </JInline>
  </DemoSection>

  <DemoSection title="Composition" description="Workspace preferences using JList with inset keyline dividers and trailing switches.">
    <JStack gap="field" style="width: 100%; max-width: 460px">
      <JList variant="card" lines="2" inset-divider>
        <JListItem
          as="label"
          role="listitem"
          interactive
          title="Preview deployments"
          description="Build every pull request to an isolated URL."
        >
          <template #leading>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="8" r="6" />
              <path d="M2 8h12M8 2a9.5 9.5 0 0 1 2.4 6A9.5 9.5 0 0 1 8 14a9.5 9.5 0 0 1-2.4-6A9.5 9.5 0 0 1 8 2Z" />
            </svg>
          </template>
          <template #trailing>
            <JSwitch v-model="settings.previews" aria-label="Preview deployments" />
          </template>
        </JListItem>

        <JListItem
          as="label"
          role="listitem"
          interactive
          title="Inline review comments"
          description="Let reviewers annotate live preview pages in context."
        >
          <template #leading>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2.5 3.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H6l-3.5 2.5v-9.5a1 1 0 0 1 1-1Z" />
            </svg>
          </template>
          <template #trailing>
            <JSwitch v-model="settings.comments" aria-label="Inline review comments" />
          </template>
        </JListItem>

        <JListItem
          as="label"
          role="listitem"
          interactive
          title="Privacy-first analytics"
          description="Cookieless edge telemetry with zero visitor tracking."
        >
          <template #leading>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 2 3 4.2v3.6c0 3.2 2.1 5.4 5 6.2 2.9-.8 5-3 5-6.2V4.2L8 2Z" />
            </svg>
          </template>
          <template #trailing>
            <JSwitch v-model="settings.analytics" tone="success" aria-label="Privacy-first analytics" />
          </template>
        </JListItem>
      </JList>

      <JCard size="sm">
        <JSwitch
          v-model="settings.freeze"
          placement="end"
          tone="neutral"
          label="Production release freeze"
          description="Hold automated promotions during scheduled maintenance windows."
        />
      </JCard>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
