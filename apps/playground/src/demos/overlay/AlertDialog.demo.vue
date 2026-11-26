<script lang="ts">
export const meta = {
  name: 'Alert Dialog',
  group: 'Overlay',
  order: 4.5,
  description: 'Explicit WAI-ARIA alertdialog modal with inert backdrop, safe Cancel auto-focus, async loading lock and semantic tone badges.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JAlertDialog, JButton, JBadge, JField, JInput, JInline, JStack } from 'jenni-vue';

const lastDecision = ref('No action taken');
const purging = ref(false);
const purgeOpen = ref(false);
const typedCluster = ref('');
const clusterOpen = ref(false);

const tones = [
  {
    tone: 'danger' as const,
    label: 'Danger',
    title: 'Delete production database?',
    description: 'All snapshots, replicas and point-in-time recovery logs will be permanently erased.',
    confirmLabel: 'Delete database',
  },
  {
    tone: 'warning' as const,
    label: 'Warning',
    title: 'Rotate signing secret?',
    description: 'Active webhook consumers must update their verification key within 15 minutes.',
    confirmLabel: 'Rotate secret',
  },
  {
    tone: 'accent' as const,
    label: 'Accent',
    title: 'Promote release v2.8.0?',
    description: 'Traffic across 14 edge regions will shift to build #4819 with zero-downtime draining.',
    confirmLabel: 'Promote release',
  },
  {
    tone: 'info' as const,
    label: 'Info',
    title: 'Export compliance archive?',
    description: 'Generates a signed audit bundle for Q4 and notifies security reviewers.',
    confirmLabel: 'Generate archive',
  },
];

async function handlePurge() {
  purging.value = true;
  await new Promise((resolve) => setTimeout(resolve, 900));
  purging.value = false;
  purgeOpen.value = false;
  lastDecision.value = 'CDN cache purged';
}

function handleClusterDelete() {
  typedCluster.value = '';
  lastDecision.value = 'Cluster production-eu terminated';
}

const html = `<button class="j-button" data-tone="danger" data-variant="soft" commandfor="demo-alert-dlg" command="show-modal">
  Revoke token
</button>
<dialog class="j-dialog j-alert-dialog" id="demo-alert-dlg" role="alertdialog" aria-modal="true"
        data-tone="danger" data-size="sm" aria-labelledby="demo-alert-dlg-t" aria-describedby="demo-alert-dlg-d">
  <div class="j-alert-dialog__header">
    <span class="j-alert-dialog__icon" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision">
        <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z" />
        <path d="M12 8v4.5" /><path d="M12 16h.01" />
      </svg>
    </span>
    <div class="j-alert-dialog__content">
      <h2 class="j-dialog__title j-alert-dialog__title" id="demo-alert-dlg-t">Revoke deploy token?</h2>
      <p class="j-dialog__description j-alert-dialog__description" id="demo-alert-dlg-d">
        CI pipelines using this credential will immediately fail authentication.
      </p>
    </div>
  </div>
  <footer class="j-dialog__footer j-alert-dialog__footer">
    <button class="j-button" data-variant="outline" autofocus commandfor="demo-alert-dlg" command="close">Cancel</button>
    <button class="j-button" data-tone="danger" commandfor="demo-alert-dlg" command="close">Revoke token</button>
  </footer>
</dialog>`;
</script>

<template>
  <DemoSection
    title="Destructive confirmation"
    description="Backdrop clicks are ignored by default and initial focus lands safely on Cancel so accidental Enter presses never trigger data loss."
  >
    <JInline gap="item" align="center" justify="center">
      <JAlertDialog
        title="Revoke production API key?"
        description="Workloads authenticating with key_live_94f1… will immediately receive 401 Unauthorized responses."
        tone="danger"
        confirm-label="Revoke key"
        cancel-label="Keep key"
        @confirm="lastDecision = 'Revoked key_live_94f1'"
        @cancel="lastDecision = 'Kept API key'"
      >
        <template #trigger="{ open }">
          <JButton tone="danger" variant="soft" @click="open">Revoke API key</JButton>
        </template>
      </JAlertDialog>

      <JBadge variant="soft" tone="neutral">{{ lastDecision }}</JBadge>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Semantic tones"
    description="danger · warning · accent · info — each renders a 24×24 geometricPrecision tone icon badge; danger and warning auto-focus Cancel."
  >
    <JInline gap="related" justify="center" wrap>
      <JAlertDialog
        v-for="item in tones"
        :key="item.tone"
        :tone="item.tone"
        :title="item.title"
        :description="item.description"
        :confirm-label="item.confirmLabel"
        @confirm="lastDecision = `Confirmed: ${item.label}`"
        @cancel="lastDecision = `Cancelled: ${item.label}`"
      >
        <template #trigger="{ open }">
          <JButton variant="outline" :tone="item.tone === 'accent' ? undefined : item.tone" @click="open">
            {{ item.label }}
          </JButton>
        </template>
      </JAlertDialog>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Async mutation & Escape lock"
    description="While loading is true, Escape, backdrop clicks and Cancel are locked until the asynchronous operation settles."
  >
    <JInline gap="item" align="center" justify="center">
      <JButton variant="outline" tone="warning" @click="purgeOpen = true">Purge global edge cache</JButton>
      <JAlertDialog
        v-model:open="purgeOpen"
        tone="warning"
        title="Purge global CDN cache?"
        description="Origin traffic will temporarily spike across all 38 PoPs while assets revalidate."
        confirm-label="Purge cache"
        :loading="purging"
        @confirm="handlePurge"
        @cancel="lastDecision = 'Purge cancelled'"
      />
    </JInline>
  </DemoSection>

  <DemoSection
    title="Type-to-confirm guard (size md)"
    description="Compose verification inputs in the default slot and gate confirm via disabled."
  >
    <JInline gap="item" align="center" justify="center">
      <JButton tone="danger" @click="typedCluster = ''; clusterOpen = true">Terminate cluster…</JButton>
      <JAlertDialog
        v-model:open="clusterOpen"
        size="md"
        tone="danger"
        title="Terminate cluster production-eu?"
        description="This permanently detaches 6 NVMe volumes and releases reserved elastic IPs."
        confirm-label="Terminate cluster"
        :disabled="typedCluster !== 'production-eu'"
        @confirm="handleClusterDelete"
      >
        <JStack gap="related">
          <JField label="Type production-eu to unlock confirmation">
            <JInput v-model="typedCluster" placeholder="production-eu" autocomplete="off" />
          </JField>
        </JStack>
      </JAlertDialog>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Native <dialog role='alertdialog'> + invoker commands.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
