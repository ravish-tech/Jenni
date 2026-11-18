<script lang="ts">
export const meta = {
  name: 'Toast',
  group: 'Overlay',
  order: 9,
  description: 'Top-layer stacked notification deck with hover fan-out, timer pause, and shared imperative API.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JToaster,
  toast,
  JDialog,
  JButton,
  JBadge,
  JCard,
  JStack,
  JInline,
  type ToasterPosition,
} from 'jenni-vue';

const position = ref<ToasterPosition>('bottom-end');
const lastUndo = ref(false);
const positions: ToasterPosition[] = ['bottom-end', 'bottom-center', 'top-end', 'top-center'];

let deploySeq = 142;

function triggerStack() {
  const n = ++deploySeq;
  toast({
    title: `Build #${n} queued`,
    description: 'Compiling core tokens and verifying bundle budgets.',
    tone: 'neutral',
  });
  setTimeout(() => {
    toast.info({
      title: `Edge cache invalidated`,
      description: '14 global regions updated in 38ms.',
    });
  }, 140);
  setTimeout(() => {
    toast.success({
      title: `Release v2.4.${n % 10} live`,
      description: 'Hover this stack to fan cards out and pause auto-dismiss.',
    });
  }, 280);
}

function triggerUndo() {
  lastUndo.value = false;
  toast({
    title: 'Issue LIN-408 archived',
    description: 'Moved out of Q4 Spatial Precision cycle.',
    tone: 'accent',
    action: {
      label: 'Undo',
      onClick: () => {
        lastUndo.value = true;
        toast.success('Issue restored to active cycle');
      },
    },
  });
}

const html = `<div class="j-inline" data-gap="related">
  <button
    class="j-button"
    data-variant="outline"
    data-j-toast="Specification saved"
    data-j-toast-description="Synced to Frankfurt EU-Central."
    data-j-toast-tone="success"
  >
    Save specification
  </button>
  <button
    class="j-button"
    data-variant="soft"
    data-tone="danger"
    data-j-toast="Webhook delivery failed"
    data-j-toast-description="Endpoint returned HTTP 503."
    data-j-toast-tone="danger"
    data-j-toast-action="Retry"
  >
    Simulate failure
  </button>
</div>`;
</script>

<template>
  <JToaster :position="position" />

  <DemoSection
    title="Stacked deck & tones"
    description="Up to 3 notifications layer into a quiet architectural deck and glide apart over 300ms (0% bounce) on hover while pausing timers."
  >
    <JStack gap="field">
      <JInline gap="related">
        <JButton @click="triggerStack">Push 3-card stack</JButton>
        <JButton
          variant="outline"
          @click="toast({ title: 'Workspace preferences updated', description: 'Default density set to 1.0.', tone: 'neutral' })"
        >
          Neutral
        </JButton>
        <JButton
          variant="soft"
          tone="success"
          @click="toast.success({ title: 'Deployment succeeded', description: 'Production alias points to 8f3a19c.' })"
        >
          Success
        </JButton>
        <JButton
          variant="soft"
          tone="warning"
          @click="toast.warning({ title: 'Rate limit approaching', description: '84% of hourly quota consumed.' })"
        >
          Warning
        </JButton>
        <JButton
          variant="soft"
          tone="danger"
          @click="toast.error({ title: 'Build failed', description: 'Type error in packages/core/tokens.' })"
        >
          Danger
        </JButton>
        <JButton
          variant="soft"
          tone="info"
          @click="toast.info({ title: 'Schema migration ready', description: '2 non-blocking index additions.' })"
        >
          Info
        </JButton>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Actions & modal top-layer"
    description="Because .j-toaster uses native popover='manual', notifications float cleanly even above modal <dialog> scrims."
  >
    <JCard variant="outline" size="sm">
      <JInline gap="item" justify="between">
        <JInline gap="related">
          <JButton variant="outline" @click="triggerUndo">Archive with Undo</JButton>

          <JDialog
            size="sm"
            title="Deploy to production"
            description="Trigger a toast while this modal dialog is open to verify top-layer stacking."
          >
            <template #trigger="{ open }">
              <JButton variant="soft" @click="open">Test inside modal dialog</JButton>
            </template>
            <JStack gap="item">
              <p style="margin:0;font-size:var(--j-text-sm);color:var(--j-fg-muted)">
                Click below — the toast renders in the browser top layer above the modal backdrop and remains interactive.
              </p>
              <JInline gap="related">
                <JButton
                  size="sm"
                  @click="toast.success({ title: 'Canary healthy', description: 'Rendered cleanly above showModal().' })"
                >
                  Fire toast over modal
                </JButton>
              </JInline>
            </JStack>
            <template #footer="{ close }">
              <JButton size="sm" variant="ghost" @click="close">Done</JButton>
            </template>
          </JDialog>
        </JInline>

        <JInline gap="related">
          <JBadge v-if="lastUndo" tone="success" variant="soft">Undo triggered</JBadge>
          <JButton size="sm" variant="ghost" @click="toast.dismiss()">Dismiss all</JButton>
        </JInline>
      </JInline>
    </JCard>
  </DemoSection>

  <DemoSection
    title="Viewport placement"
    description="Switch anchor coordinates between bottom-end, bottom-center, top-end, and top-center."
  >
    <JInline gap="related">
      <JButton
        v-for="pos in positions"
        :key="pos"
        size="sm"
        :variant="position === pos ? 'solid' : 'outline'"
        @click="position = pos; toast({ title: `Position: ${pos}`, description: 'Anchored with 20px viewport margin.' })"
      >
        {{ pos }}
      </JButton>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Declarative [data-j-toast] triggers wired by initToasts().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
