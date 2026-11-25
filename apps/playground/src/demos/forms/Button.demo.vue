<script lang="ts">
export const meta = {
  name: 'Button',
  group: 'Forms',
  order: 1,
  description: 'Triggers an action. Five variants, three sizes, any tone.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JButton,
  JButtonGroup,
  JCard,
  JDropdownItem,
  JDropdownSeparator,
  JInline,
  JSplitButton,
  JStack,
} from 'jenni-vue';

const variants = ['solid', 'soft', 'outline', 'ghost', 'link'] as const;
const tones = ['accent', 'neutral', 'danger', 'success', 'warning', 'info'] as const;
const lastSplitAction = ref('Deploy production');

const saving = ref(false);
function save() {
  saving.value = true;
  setTimeout(() => (saving.value = false), 1600);
}

const html = `<button class="j-button">Save changes</button>
<button class="j-button" data-variant="soft">Soft</button>
<button class="j-button" data-variant="outline">Cancel</button>
<button class="j-button" data-variant="ghost" data-icon-only aria-label="More">
  <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>
</button>
<button class="j-button" data-tone="danger" data-loading aria-busy="true">Deleting</button>
<div class="j-button-group" role="group">
  <button class="j-button" data-variant="outline">Day</button>
  <button class="j-button" data-variant="outline">Week</button>
  <button class="j-button" data-variant="outline">Month</button>
</div>`;
</script>

<template>
  <DemoSection title="Variants" description="solid (default) · soft · outline · ghost · link">
    <JInline gap="item" justify="center">
      <JButton v-for="v in variants" :key="v" :variant="v">{{ v[0].toUpperCase() + v.slice(1) }}</JButton>
    </JInline>
  </DemoSection>

  <DemoSection title="Sizes" description="sm · md (default) · lg, with and without icons.">
    <JStack gap="item" align="center">
      <JInline v-for="s in (['sm', 'md', 'lg'] as const)" :key="s" gap="related" justify="center">
        <JButton :size="s">Button {{ s }}</JButton>
        <JButton :size="s" variant="outline">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10" /></svg>
          New issue
        </JButton>
        <JButton :size="s" variant="soft" icon-only aria-label="Settings">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" /></svg>
        </JButton>
        <JButton :size="s" variant="ghost" icon-only aria-label="More">
          <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="13" cy="8" r="1.5" /></svg>
        </JButton>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Tones" description="Every variant reads --j-tone-*. Outline and ghost stay neutral until a tone is set.">
    <JStack gap="item" align="center">
      <JInline v-for="v in (['solid', 'soft', 'outline', 'ghost'] as const)" :key="v" gap="related" justify="center">
        <JButton v-for="t in tones" :key="t" :variant="v" :tone="t">{{ t }}</JButton>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="States" description="Hover, poised surface press, focus ring (Tab), disabled, and composed loading.">
    <JStack gap="item" align="center">
      <JInline gap="related" justify="center">
        <JButton :loading="saving" @click="save">{{ saving ? 'Saving…' : 'Click to save' }}</JButton>
        <JButton loading>Loading</JButton>
        <JButton loading variant="outline">Loading</JButton>
        <JButton loading variant="soft" tone="danger">Loading</JButton>
        <JButton loading icon-only aria-label="Loading" variant="ghost">
          <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3" /></svg>
        </JButton>
      </JInline>
      <JInline gap="item" justify="center">
        <JButton v-for="v in variants" :key="v" :variant="v" disabled>Disabled</JButton>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Button group" description="Attached buttons share borders; set size/variant once on the group.">
    <JStack gap="field" align="center" style="width: 100%; max-width: 360px">
      <JButtonGroup variant="outline">
        <JButton>Day</JButton>
        <JButton>Week</JButton>
        <JButton>Month</JButton>
      </JButtonGroup>
      <JButtonGroup size="sm">
        <JButton>Merge pull request</JButton>
        <JButton icon-only aria-label="Merge options">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5 8 10l3.5-3.5" /></svg>
        </JButton>
      </JButtonGroup>
      <JButtonGroup variant="soft" tone="neutral" full-width>
        <JButton>Left</JButton>
        <JButton>Center</JButton>
        <JButton>Right</JButton>
      </JButtonGroup>
    </JStack>
  </DemoSection>

  <DemoSection title="Split button" description="Primary action paired with an attached dropdown menu across solid, soft, and outline variants, tones, and sizes.">
    <JStack gap="field" align="center">
      <JInline gap="related" justify="center">
        <JSplitButton label="Deploy" @click="lastSplitAction = 'Deploy production'">
          <JDropdownItem @select="lastSplitAction = 'Deploy preview'">Deploy preview</JDropdownItem>
          <JDropdownItem @select="lastSplitAction = 'Promote staging'">Promote staging</JDropdownItem>
          <JDropdownSeparator />
          <JDropdownItem tone="danger" @select="lastSplitAction = 'Rollback release'">Rollback release</JDropdownItem>
        </JSplitButton>

        <JSplitButton variant="soft" label="Squash & merge" @click="lastSplitAction = 'Squash & merge'">
          <JDropdownItem @select="lastSplitAction = 'Create merge commit'">Create merge commit</JDropdownItem>
          <JDropdownItem @select="lastSplitAction = 'Rebase and merge'">Rebase and merge</JDropdownItem>
        </JSplitButton>

        <JSplitButton variant="outline" @click="lastSplitAction = 'Export CSV'">
          <template #default>Export CSV</template>
          <template #menu>
            <JDropdownItem @select="lastSplitAction = 'Export Parquet'">Export Parquet</JDropdownItem>
            <JDropdownItem @select="lastSplitAction = 'Export JSON Lines'">Export JSON Lines</JDropdownItem>
          </template>
        </JSplitButton>
      </JInline>

      <JInline gap="related" justify="center">
        <JSplitButton tone="success" variant="solid" label="Approve" @click="lastSplitAction = 'Approve'">
          <JDropdownItem @select="lastSplitAction = 'Approve with comment'">Approve with comment</JDropdownItem>
          <JDropdownItem @select="lastSplitAction = 'Request changes'">Request changes</JDropdownItem>
        </JSplitButton>
        <JSplitButton tone="danger" variant="soft" label="Terminate" @click="lastSplitAction = 'Terminate'">
          <JDropdownItem @select="lastSplitAction = 'Drain connections'">Drain connections</JDropdownItem>
          <JDropdownItem tone="danger" @select="lastSplitAction = 'Force kill'">Force kill</JDropdownItem>
        </JSplitButton>
        <JSplitButton tone="neutral" variant="outline" label="Archive" @click="lastSplitAction = 'Archive'">
          <JDropdownItem @select="lastSplitAction = 'Move to cold storage'">Move to cold storage</JDropdownItem>
        </JSplitButton>
      </JInline>

      <JInline gap="related" justify="center">
        <JSplitButton v-for="s in (['sm', 'md', 'lg'] as const)" :key="s" :size="s" variant="outline" :label="`Run (${s})`" @click="lastSplitAction = `Run (${s})`">
          <JDropdownItem @select="lastSplitAction = `Run with debugger (${s})`">Run with debugger</JDropdownItem>
          <JDropdownItem @select="lastSplitAction = `Profile CPU (${s})`">Profile CPU</JDropdownItem>
        </JSplitButton>
      </JInline>

      <span style="color: var(--j-fg-muted); font-size: var(--j-text-sm)">Last action: {{ lastSplitAction }}</span>
    </JStack>
  </DemoSection>

  <DemoSection title="Composition" description="A destructive confirmation card and full-width primary action.">
    <JStack gap="field" style="width: 100%; max-width: 420px">
      <JCard
        title="Delete project?"
        description="This permanently removes “core-docs” and its 24 deployments. This action cannot be undone."
        footer-divider
      >
        <template #footer>
          <JInline gap="related" justify="end" style="width: 100%">
            <JButton variant="ghost">Cancel</JButton>
            <JButton tone="danger" :loading="saving" @click="save">Delete project</JButton>
          </JInline>
        </template>
      </JCard>
      <JButton full-width size="lg">Continue with email</JButton>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Core CSS only, no Vue.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
