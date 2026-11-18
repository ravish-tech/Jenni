<script lang="ts">
export const meta = {
  name: 'List',
  group: 'Layout',
  order: 6,
  description: 'Structured rows with canonical heights (32/44/60/76px), keyline inset dividers, and interactive states.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JList,
  JListItem,
  JGrid,
  JStack,
  JAvatar,
  JBadge,
  JKbd,
  JSwitch,
  JButton,
} from '@jenni/vue';

const selectedInbox = ref('m1');
const settings = reactive({
  push: true,
  digest: false,
  twoFactor: true,
});

const members = [
  { name: 'Ada Lovelace', email: 'ada@acme.dev', role: 'Owner', status: 'online' as const, tone: 'accent' as const },
  { name: 'Grace Hopper', email: 'grace@acme.dev', role: 'Maintainer', status: 'online' as const, tone: 'success' as const },
  { name: 'Alan Turing', email: 'alan@acme.dev', role: 'Reviewer', status: 'away' as const, tone: 'neutral' as const },
];

const messages = [
  {
    id: 'm1',
    from: 'Design Systems',
    title: 'Keyline inset dividers landed in @jenni/core',
    desc: 'Row hairlines now start cleanly under the title column past leading icons or avatars, reducing left-edge visual clutter.',
    time: '09:41',
    unread: true,
  },
  {
    id: 'm2',
    from: 'Platform Infra',
    title: 'Zero-downtime PostgreSQL 17 migration complete',
    desc: 'Read replicas promoted in 140ms with zero dropped transactions across all production shards.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'm3',
    from: 'Security Bot',
    title: 'New passkey registered on macOS Sequoia',
    desc: 'Hardware-backed WebAuthn credential added from San Francisco, CA. Review security log if unfamiliar.',
    time: 'Oct 28',
    unread: false,
  },
];

const html = `<div class="j-list" data-variant="card" data-lines="2" data-inset-divider>
  <button type="button" class="j-list-item">
    <span class="j-list-item__leading">
      <span class="j-avatar" data-size="sm"><span class="j-avatar__fallback">AL</span></span>
    </span>
    <span class="j-list-item__body">
      <span class="j-list-item__title">Ada Lovelace</span>
      <span class="j-list-item__description">ada@acme.dev</span>
    </span>
    <span class="j-list-item__trailing">
      <span class="j-badge" data-size="sm">Owner</span>
    </span>
  </button>
</div>`;
</script>

<template>
  <DemoSection
    title="Canonical Row Heights"
    description="Material/HIG-inspired heights: compact (32px), 1-line (44px), 2-line (60px), and 3-line (76px) — all scaling with --j-density."
  >
    <JGrid :min-cell-width="250" gap="group" style="width: 100%">
      <JStack gap="inline">
        <span style="font-size: var(--j-text-xs); font-weight: 600; color: var(--j-fg-muted)">lines="compact" (32px)</span>
        <JList variant="card" lines="compact">
          <JListItem as="button" title="Go to file">
            <template #trailing><JKbd size="sm">⌘P</JKbd></template>
          </JListItem>
          <JListItem as="button" title="Run command">
            <template #trailing><JKbd size="sm">⌘K</JKbd></template>
          </JListItem>
          <JListItem as="button" title="Toggle theme">
            <template #trailing><JKbd size="sm">⌘J</JKbd></template>
          </JListItem>
        </JList>
      </JStack>

      <JStack gap="inline">
        <span style="font-size: var(--j-text-xs); font-weight: 600; color: var(--j-fg-muted)">lines="1" (44px default)</span>
        <JList variant="card" :lines="1">
          <JListItem as="button" title="General settings">
            <template #trailing>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 4 4 4-4 4"/></svg>
            </template>
          </JListItem>
          <JListItem as="button" title="Billing & invoices">
            <template #trailing><JBadge size="sm" tone="success">Active</JBadge></template>
          </JListItem>
        </JList>
      </JStack>

      <JStack gap="inline">
        <span style="font-size: var(--j-text-xs); font-weight: 600; color: var(--j-fg-muted)">lines="2" (60px)</span>
        <JList variant="card" :lines="2">
          <JListItem title="API Keys" description="3 active production tokens">
            <template #trailing><JButton size="sm" variant="outline" tone="neutral">Manage</JButton></template>
          </JListItem>
          <JListItem title="Webhooks" description="Delivering to 2 HTTPS endpoints">
            <template #trailing><JBadge size="sm" dot tone="success">200 OK</JBadge></template>
          </JListItem>
        </JList>
      </JStack>
    </JGrid>
  </DemoSection>

  <DemoSection
    title="Full-Bleed Divided vs Keyline Inset Divider"
    description="inset-divider indents row hairlines to align directly with .j-list-item__body past leading icons or avatars."
  >
    <JGrid :min-cell-width="280" gap="group" style="width: 100%">
      <JStack gap="inline">
        <span style="font-size: var(--j-text-xs); font-weight: 600; color: var(--j-fg-muted)">variant="divided" (full-width rule)</span>
        <JList variant="divided" :lines="2">
          <JListItem v-for="m in members" :key="m.email" :title="m.name" :description="m.email">
            <template #leading><JAvatar :name="m.name" size="sm" :status="m.status" /></template>
            <template #trailing><JBadge size="sm" variant="soft" :tone="m.tone">{{ m.role }}</JBadge></template>
          </JListItem>
        </JList>
      </JStack>

      <JStack gap="inline">
        <span style="font-size: var(--j-text-xs); font-weight: 600; color: var(--j-fg-muted)">variant="card" + inset-divider (keyline aligned)</span>
        <JList variant="card" :lines="2" inset-divider>
          <JListItem v-for="m in members" :key="m.email" :title="m.name" :description="m.email">
            <template #leading><JAvatar :name="m.name" size="sm" :status="m.status" /></template>
            <template #trailing><JBadge size="sm" variant="soft" :tone="m.tone">{{ m.role }}</JBadge></template>
          </JListItem>
        </JList>
      </JStack>
    </JGrid>
  </DemoSection>

  <DemoSection
    title="Settings Rows & 3-Line Inbox Preview"
    description="Real-world compositions pairing JListItem with JSwitch controls and 3-line clamped message previews."
  >
    <JGrid :min-cell-width="300" gap="group" style="width: 100%">
      <JList variant="card" :lines="2" inset-divider>
        <JListItem title="Push notifications" description="Real-time alerts for mentions and deploys.">
          <template #leading>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 3a5 5 0 0 1 5 5v3.5l1.5 2H3.5l1.5-2V8a5 5 0 0 1 5-5Z"/></svg>
          </template>
          <template #trailing>
            <JSwitch v-model="settings.push" aria-label="Push notifications" />
          </template>
        </JListItem>
        <JListItem title="Weekly digest" description="Summary email every Monday morning.">
          <template #leading>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="14" height="12" rx="2"/><path d="m3 7 7 4.5L17 7"/></svg>
          </template>
          <template #trailing>
            <JSwitch v-model="settings.digest" aria-label="Weekly digest" />
          </template>
        </JListItem>
        <JListItem title="Two-factor authentication" description="Require passkey or TOTP at sign-in.">
          <template #leading>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></svg>
          </template>
          <template #trailing>
            <JSwitch v-model="settings.twoFactor" aria-label="Two-factor authentication" />
          </template>
        </JListItem>
      </JList>

      <JList variant="card" :lines="3" inset-divider>
        <JListItem
          v-for="msg in messages"
          :key="msg.id"
          as="button"
          :selected="selectedInbox === msg.id"
          :title="msg.title"
          :description="msg.desc"
          @click="selectedInbox = msg.id"
        >
          <template #leading>
            <JAvatar :name="msg.from" size="sm" />
          </template>
          <template #trailing>
            <JBadge v-if="msg.unread" size="sm" variant="solid">New</JBadge>
            <span v-else>{{ msg.time }}</span>
          </template>
        </JListItem>
      </JList>
    </JGrid>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
