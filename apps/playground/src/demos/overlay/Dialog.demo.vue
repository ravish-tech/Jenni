<script lang="ts">
export const meta = {
  name: 'Dialog',
  group: 'Overlay',
  order: 7,
  description: 'Modal dialog built on native <dialog> with focus trap, calm backdrop blur and mobile sheet docking.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JDialog, JButton, JField, JInput, JSwitch, JStack, JInline } from 'jenni-vue';

const name = ref('Ada Lovelace');
const handle = ref('@ada');
const newsletter = ref(true);
const deleteOpen = ref(false);
const sizes = ['sm', 'md', 'lg'] as const;

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
    <button class="j-button" data-size="sm" commandfor="demo-html-dlg-1" command="close">Understood</button>
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
        <JButton @click="close">Save changes</JButton>
      </template>
    </JDialog>
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
        <JButton tone="danger" @click="close">Revoke key</JButton>
      </template>
    </JDialog>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Invoker commands (commandfor / command) + initDialogs() fallback.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
