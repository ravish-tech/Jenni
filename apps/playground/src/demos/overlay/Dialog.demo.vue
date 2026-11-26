<script lang="ts">
export const meta = {
  name: 'Dialog',
  group: 'Overlay',
  order: 7,
  description: 'Modal dialog built on native <dialog> with focus trap, calm backdrop blur and mobile sheet docking.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JDialog, JButton, JField, JInput, JSwitch, JStack, JInline, JList, JListItem, JBadge, JKbd } from 'jenni-vue';

const name = ref('Ada Lovelace');
const handle = ref('@ada');
const newsletter = ref(true);
const deleteOpen = ref(false);
const notifyOnPromote = ref(true);
const drainConnections = ref(true);
const promoteCount = ref(0);
const sizes = ['sm', 'md', 'lg'] as const;

function confirmPromote(close: () => void) {
  promoteCount.value += 1;
  close();
}

const html = `<button class="j-button" data-variant="outline" commandfor="demo-html-dlg-1" command="show-modal">
  Open native dialog
</button>
<dialog class="j-dialog" id="demo-html-dlg-1" data-size="sm" closedby="any" aria-labelledby="demo-html-dlg-1-t">
  <header class="j-dialog__header">
    <h2 class="j-dialog__title" id="demo-html-dlg-1-t">Keyboard navigation</h2>
    <p class="j-dialog__description">Press Escape or click outside to dismiss.</p>
  </header>
  <div class="j-dialog__body">
    <p style="font-size:var(--j-text-md);color:var(--j-fg-muted)">
      Native <code>&lt;dialog&gt;</code> provides focus trapping, top-layer stacking and zero-shift scroll lock.
    </p>
  </div>
  <footer class="j-dialog__footer">
    <button class="j-button" data-size="sm" data-default-action commandfor="demo-html-dlg-1" command="close">Understood</button>
  </footer>
  <button class="j-dialog__close" commandfor="demo-html-dlg-1" command="close" aria-label="Close">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
  </button>
</dialog>`;
</script>

<template>
  <DemoSection title="Edit profile" description="Form modal with field stack, footer action cluster and automatic focus restoration.">
    <JDialog title="Edit profile" description="Changes propagate immediately across your workspace.">
      <template #trigger="{ open }">
        <JButton @click="open">Edit profile</JButton>
      </template>

      <JStack gap="field">
        <JField label="Full name">
          <JInput v-model="name" placeholder="Your name" />
        </JField>
        <JField label="Username" hint="Displayed in mentions and audit history.">
          <JInput v-model="handle" placeholder="@username" />
        </JField>
        <JSwitch
          v-model="newsletter"
          placement="end"
          label="Release digest"
          description="Monthly summary of architectural updates."
        />
      </JStack>

      <template #footer="{ close }">
        <JButton variant="ghost" @click="close">Cancel</JButton>
        <JButton default @click="close">Save changes</JButton>
      </template>
    </JDialog>
  </DemoSection>

  <DemoSection
    title="Default Action on Enter"
    description="Mark a footer button with default (or set default-action on JDialog) to focus it on open and trigger it on Enter while preserving Escape and form input behaviour."
  >
    <JInline gap="item" align="center">
      <JDialog
        size="sm"
        title="Promote release v2.8.0?"
        description="Traffic across eu-west-1 and us-east-1 shifts to revision a8f31c9."
      >
        <template #trigger="{ open }">
          <JButton variant="outline" @click="open">Promote release</JButton>
        </template>

        <JStack gap="item">
          <JSwitch
            v-model="drainConnections"
            placement="end"
            label="Graceful connection drain"
            description="Wait up to 30s for in-flight requests to settle."
          />
          <JSwitch
            v-model="notifyOnPromote"
            placement="end"
            label="Post release marker"
            description="Emit deployment annotation to telemetry timelines."
          />
          <p style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
            Press <JKbd size="sm">Enter</JKbd> anywhere outside text fields to confirm, or <JKbd size="sm">Esc</JKbd> to cancel.
          </p>
        </JStack>

        <template #footer="{ close }">
          <JButton variant="ghost" @click="close">Cancel</JButton>
          <JButton default @click="confirmPromote(close)">Promote now</JButton>
        </template>
      </JDialog>

      <span v-if="promoteCount > 0" style="font-size: var(--j-text-sm); color: var(--j-fg-muted)">
        Promoted {{ promoteCount }} {{ promoteCount === 1 ? 'time' : 'times' }}
      </span>
    </JInline>
  </DemoSection>

  <DemoSection title="Sizes" description="sm (25rem) · md (32rem, default) · lg (44rem). Docks as a bottom sheet below 40rem.">
    <JInline gap="item" justify="center">
      <JDialog
        v-for="s in sizes"
        :key="s"
        :size="s"
        :title="`Dialog (${s})`"
        description="Poised 300ms entrance with zero bounce and stable scrollbar gutter."
      >
        <template #trigger="{ open }">
          <JButton variant="outline" @click="open">Size {{ s }}</JButton>
        </template>
        <p style="color:var(--j-fg-muted);font-size:var(--j-text-md)">
          This modal uses <code>size="{{ s }}"</code>. Narrow your viewport below <code>40rem</code> to inspect the docked sheet layout.
        </p>
        <template #footer="{ close }">
          <JButton variant="outline" @click="close">Close</JButton>
        </template>
      </JDialog>
    </JInline>
  </DemoSection>

  <DemoSection title="Destructive confirmation" description="Non-dismissible confirmation modal requiring an explicit action.">
    <JButton tone="danger" variant="soft" @click="deleteOpen = true">Revoke API key</JButton>
    <JDialog
      v-model:open="deleteOpen"
      size="sm"
      :closable="false"
      :dismissible="false"
      title="Revoke production key?"
      description="Services authenticating with jn_live_98a2… will immediately lose access."
    >
      <template #footer="{ close }">
        <JButton variant="ghost" @click="close">Keep key</JButton>
        <JButton tone="danger" default @click="close">Revoke key</JButton>
      </template>
    </JDialog>
  </DemoSection>

  <DemoSection title="Flush Body (Edge-to-Edge Content)" description="Pass flush to remove body padding for full-bleed lists, data tables, or diff viewers between crisp header and footer borders.">
    <JDialog
      flush
      title="Select target environment"
      description="Choose where this migration release will run."
    >
      <template #trigger="{ open }">
        <JButton variant="outline" @click="open">Open flush dialog</JButton>
      </template>

      <JList variant="divided" inset-divider lines="2">
        <JListItem
          v-for="env in [
            { name: 'Production (eu-west-1)', desc: '12 replicas · Strict change window', status: 'Protected', tone: 'warning' },
            { name: 'Staging (eu-west-1)', desc: '4 replicas · Auto-sync enabled', status: 'Ready', tone: 'success' },
            { name: 'Preview (us-east-1)', desc: 'Ephemeral branch sandbox', status: 'Ready', tone: 'info' },
          ]"
          :key="env.name"
          :title="env.name"
          :description="env.desc"
        >
          <template #trailing>
            <JBadge size="sm" :tone="env.tone">{{ env.status }}</JBadge>
          </template>
        </JListItem>
      </JList>

      <template #footer="{ close }">
        <JButton variant="ghost" @click="close">Cancel</JButton>
        <JButton default @click="close">Continue</JButton>
      </template>
    </JDialog>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Invoker commands (commandfor / command) + initDialogs() fallback.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
