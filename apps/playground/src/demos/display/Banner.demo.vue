<script lang="ts">
export const meta = {
  name: 'Banner',
  group: 'Display',
  order: 5.5,
  wide: true,
  description: 'Edge-to-edge application shell chrome bar and inline announcement banner with soft, solid, and surface variants.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JBanner,
  JAppShell,
  JTopBar,
  JSidebar,
  JSidebarGroup,
  JSidebarItem,
  JButton,
  JBadge,
  JSegmentedControl,
  JStack,
  JInline,
} from 'jenni-vue';

const shellOpen = ref(true);
const shellTone = ref<'info' | 'warning' | 'danger' | 'accent' | 'success'>('warning');
const shellVariant = ref<'soft' | 'solid' | 'surface'>('soft');

const toneOptions = [
  { label: 'Warning', value: 'warning' },
  { label: 'Danger', value: 'danger' },
  { label: 'Info', value: 'info' },
  { label: 'Accent', value: 'accent' },
  { label: 'Success', value: 'success' },
];

const variantOptions = [
  { label: 'Soft', value: 'soft' },
  { label: 'Solid', value: 'solid' },
  { label: 'Surface', value: 'surface' },
];

const tones = [
  {
    tone: 'info' as const,
    title: 'Scheduled schema migration',
    description: 'Read-only maintenance window begins Sunday at 02:00 UTC for 12 minutes.',
  },
  {
    tone: 'success' as const,
    title: 'Zero-downtime failover verified',
    description: 'All 38 edge regions completed automatic TLS rotation.',
  },
  {
    tone: 'warning' as const,
    title: 'Approaching monthly ingest ceiling',
    description: 'Workspace telemetry volume is at 89% of allocated commit quota.',
  },
  {
    tone: 'danger' as const,
    title: 'Elevated packet loss in eu-central-1',
    description: 'Traffic is rerouting automatically through frankfurt-backup-02.',
  },
  {
    tone: 'accent' as const,
    title: 'Virtualized column pinning is live',
    description: 'Pin leading and trailing columns on datasets exceeding 50,000 rows.',
  },
  {
    tone: 'neutral' as const,
    title: 'Audit log retention policy',
    description: 'Cryptographic event digests are retained for 365 days by organization policy.',
  },
];

const dismissibleOpen = ref(true);

const html = `<div class="j-banner" role="status" data-tone="info" data-flush data-align="center">
  <div class="j-banner__inner">
    <div class="j-banner__content">
      <span class="j-banner__title">Scheduled maintenance</span>
      <span class="j-banner__description">Read-only window starts Sunday at 02:00 UTC.</span>
    </div>
  </div>
  <button type="button" class="j-banner__close" aria-label="Dismiss banner">&times;</button>
</div>`;
</script>

<template>
  <DemoSection
    title="JAppShell #banner Chrome Integration (Flush Mode)"
    description="Drop <JBanner flush> into JAppShell's #banner slot for full-bleed top system bars with centered copy, inline actions, and controlled v-model:open dismissal."
  >
    <JStack gap="field" style="width:100%">
      <JInline justify="between" align="center">
        <JInline gap="related" align="center">
          <JSegmentedControl v-model="shellTone" size="sm" :options="toneOptions" />
          <JSegmentedControl v-model="shellVariant" size="sm" :options="variantOptions" />
        </JInline>
        <JButton v-if="!shellOpen" size="sm" variant="outline" @click="shellOpen = true">
          Restore shell banner
        </JButton>
      </JInline>

      <JAppShell layout="header-sidebar" embedded :height="280">
        <template v-if="shellOpen" #banner>
          <JBanner
            v-model:open="shellOpen"
            flush
            align="center"
            :tone="shellTone"
            :variant="shellVariant"
            title="Cluster upgrade v2.8"
            description="Rolling control-plane drain in progress; active workloads remain unaffected."
            dismissible
          >
            <template #actions>
              <JBadge size="sm" variant="outline" tone="neutral">Status page</JBadge>
            </template>
          </JBanner>
        </template>

        <template #topbar>
          <JTopBar>
            <template #start>
              <strong style="font-size:var(--j-text-sm)">Cloud Console</strong>
            </template>
            <template #end>
              <JBadge size="sm" dot variant="soft" tone="success">us-east-1</JBadge>
            </template>
          </JTopBar>
        </template>

        <template #sidebar>
          <JSidebar>
            <JSidebarGroup label="Infrastructure">
              <JSidebarItem active>Overview</JSidebarItem>
              <JSidebarItem>Deployments</JSidebarItem>
              <JSidebarItem>Audit Log</JSidebarItem>
            </JSidebarGroup>
          </JSidebar>
        </template>

        <div style="padding:var(--j-space-5);color:var(--j-fg-muted);font-size:var(--j-text-sm)">
          Workspace stage content adjusts automatically when the top shell banner is dismissed or restored.
        </div>
      </JAppShell>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Semantic Tones (Soft Default)"
    description="Polite tones expose role='status' while warning and danger automatically escalate to role='alert'."
  >
    <JStack gap="item" style="width:100%">
      <JBanner
        v-for="item in tones"
        :key="item.tone"
        :tone="item.tone"
        :title="item.title"
        :description="item.description"
      />
    </JStack>
  </DemoSection>

  <DemoSection
    title="Solid, Surface & Dismissible Actions"
    description="High-salience solid bars for active incidents, restrained surface banners with custom named icons, and controlled dismissal."
  >
    <JStack gap="item" style="width:100%">
      <JBanner
        variant="solid"
        tone="danger"
        icon="alert-circle"
        title="Primary database failover active"
        description="Write transactions are temporarily queued while replica promotion completes."
      >
        <template #actions>
          <JButton size="sm" variant="soft" tone="neutral">Incident runbook</JButton>
        </template>
      </JBanner>

      <JBanner
        v-model:open="dismissibleOpen"
        variant="surface"
        tone="accent"
        icon="git-pull-request"
        title="Branch preview environments ready"
        description="Every pull request now provisions an isolated ephemeral Postgres branch."
        dismissible
      >
        <template #actions>
          <JButton size="sm" variant="outline" tone="neutral">Configure</JButton>
        </template>
      </JBanner>

      <div v-if="!dismissibleOpen">
        <JButton size="sm" variant="ghost" tone="neutral" @click="dismissibleOpen = true">
          Show dismissed surface banner
        </JButton>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
