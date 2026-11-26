<script lang="ts">
export const meta = {
  name: 'Alert',
  group: 'Display',
  order: 5,
  description: 'Callout that communicates status or guidance with a tone-matched icon.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import { JAlert, JButton, JStack } from 'jenni-vue';

const tones = [
  { tone: 'info', title: 'Scheduled maintenance', text: 'Read-only mode begins Sunday at 02:00 UTC for 15 minutes.' },
  { tone: 'success', title: 'Deployment verified', text: 'All health checks passed across EU and US edge regions.' },
  { tone: 'warning', title: 'Approaching quota', text: 'Your workspace has consumed 90% of monthly build minutes.' },
  { tone: 'danger', title: 'Payment unsuccessful', text: 'We could not authorize the card ending in 4242.' },
  { tone: 'accent', title: 'Custom domains available', text: 'Branch previews can now bind to organization subdomains.' },
  { tone: 'neutral', title: 'Workspace scope', text: 'Retention policies apply only to new audit events.' },
] as const;

const html = `<div class="j-alert" role="status" data-tone="info" style="width:100%;max-width:480px">
  <span class="j-alert__icon">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <circle cx="8" cy="8" r="6.25"/><path d="M8 7.25v3.5M8 5.25v.01"/>
    </svg>
  </span>
  <div class="j-alert__content">
    <p class="j-alert__title">Scheduled maintenance</p>
    <p class="j-alert__description">Semantic HTML and CSS — zero runtime dependencies.</p>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Tones" description="Soft variant (default). Danger and warning automatically announce with role=&quot;alert&quot;.">
    <JStack gap="item" style="width:100%;max-width:560px">
      <JAlert v-for="a in tones" :key="a.tone" :tone="a.tone" :title="a.title" :description="a.text" />
    </JStack>
  </DemoSection>

  <DemoSection title="Outline" description="Restrained surface container where the icon carries the status tone.">
    <JStack gap="item" style="width:100%;max-width:560px">
      <JAlert v-for="a in tones.slice(0, 4)" :key="a.tone" variant="outline" :tone="a.tone" :title="a.title" :description="a.text" />
    </JStack>
  </DemoSection>

  <DemoSection title="Anatomy variations" description="Title only, description with inline link, or plain icon-free callout.">
    <JStack gap="item" style="width:100%;max-width:560px">
      <JAlert tone="success" title="Configuration saved." />
      <JAlert tone="info">Telemetry metrics refresh every 5 minutes. <a href="#" @click.prevent>View documentation</a></JAlert>
      <JAlert tone="neutral" :icon="false" title="Editorial note" description="Pass :icon=&quot;false&quot; when a callout needs quiet typographic emphasis." />
    </JStack>
  </DemoSection>

  <DemoSection title="Custom icon & actions" description="Trailing action cluster spaced with --j-gap-related.">
    <JStack gap="item" style="width:100%;max-width:560px">
      <JAlert tone="accent" title="Invite collaborators" description="Share live design tokens and review feedback threads.">
        <template #icon>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5.5" r="2.5" /><path d="M1.75 13.25c0-2.2 1.9-3.75 4.25-3.75s4.25 1.55 4.25 3.75M11 3.25a2.25 2.25 0 0 1 0 4.5M12.25 9.75c1.2.45 2 1.45 2 2.75" /></svg>
        </template>
        <template #actions>
          <JButton size="sm">Invite</JButton>
        </template>
      </JAlert>
      <JAlert tone="danger" variant="outline" title="Trial period ends today" description="Add a billing method to keep production deployments online.">
        <template #actions>
          <JButton size="sm" variant="ghost" tone="neutral">Dismiss</JButton>
          <JButton size="sm" tone="danger">Upgrade</JButton>
        </template>
      </JAlert>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
