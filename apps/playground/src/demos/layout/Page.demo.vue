<script lang="ts">
export const meta = {
  name: 'Page & Section',
  group: 'Layout',
  order: 2,
  description: 'Page canvas, page headers, stacked & split settings sections, and container measures.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JPage,
  JPageHeader,
  JSection,
  JContainer,
  JStack,
  JInline,
  JCard,
  JField,
  JInput,
  JTextarea,
  JSwitch,
  JButton,
  JBadge,
} from 'jenni-vue';

const workspaceName = ref('Meridian Design');
const workspaceSlug = ref('meridian-design');
const bio = ref('Design tokens, accessible primitives, and adaptive shells.');
const ssoRequired = ref(true);
const auditLog = ref(true);

const containerSizes = [
  { size: 'sm' as const, token: '--j-container-sm (640px)', note: 'Auth, focused wizards, narrow settings' },
  { size: 'prose' as const, token: '--j-measure-prose (65ch)', note: 'Editorial articles & documentation' },
  { size: 'md' as const, token: '--j-container-md (880px)', note: 'Standard forms & content pages' },
  { size: 'lg' as const, token: '--j-container-lg (1160px)', note: 'Default SaaS workspace overview' },
];

const html = `<div class="j-page" data-size="md">
  <header class="j-page-header" data-bordered>
    <div class="j-page-header__eyebrow">Settings / General</div>
    <div class="j-page-header__main">
      <div class="j-page-header__text">
        <h1 class="j-page-header__title">Workspace Settings</h1>
        <p class="j-page-header__description">Manage identity, security policies, and billing.</p>
      </div>
      <div class="j-page-header__actions">
        <button class="j-button" data-variant="outline" data-tone="neutral">Cancel</button>
        <button class="j-button">Save changes</button>
      </div>
    </div>
  </header>

  <section class="j-section" data-layout="split">
    <header class="j-section__header">
      <div class="j-section__heading">
        <h2 class="j-section__title">Profile</h2>
        <p class="j-section__description">Visible to all members of your organization.</p>
      </div>
    </header>
    <div class="j-section__body">
      <div class="j-card">…</div>
    </div>
  </section>
</div>`;
</script>

<template>
  <DemoSection
    title="Page Header & Split Settings Sections"
    description="JPage establishes keyline gutters and section rhythm (40px). JSection layout='split' pairs a 260px title column with a right form card and collapses automatically on narrow containers."
  >
    <div style="width: 100%; border-radius: var(--j-radius-lg); box-shadow: 0 0 0 1px var(--j-border); background: var(--j-bg)">
      <JPage size="md">
        <JPageHeader
          title="Workspace Settings"
          description="Manage your organization identity, domain routing, and security enforcement."
          bordered
        >
          <template #eyebrow>
            <span>Organization</span>
            <span>/</span>
            <span style="color: var(--j-fg)">General</span>
            <JBadge size="sm" variant="soft" tone="accent">Pro</JBadge>
          </template>
          <template #actions>
            <JButton variant="outline" tone="neutral" size="sm">Discard</JButton>
            <JButton size="sm">Save changes</JButton>
          </template>
        </JPageHeader>

        <JSection
          layout="split"
          bordered
          title="Workspace Identity"
          description="Used in invite emails, URLs, and audit exports across your team."
        >
          <JCard>
            <JStack gap="field">
              <JField label="Display name" required>
                <JInput v-model="workspaceName" />
              </JField>
              <JField label="Workspace URL" hint="Lowercase letters, numbers, and hyphens.">
                <JInput v-model="workspaceSlug">
                  <template #prefix>app.acme.dev/</template>
                </JInput>
              </JField>
              <JField label="Description">
                <JTextarea v-model="bio" :rows="2" />
              </JField>
            </JStack>
          </JCard>
        </JSection>

        <JSection
          layout="split"
          title="Security & Compliance"
          description="Enforce SAML single sign-on and immutable event retention."
        >
          <JCard>
            <JStack gap="field">
              <JSwitch
                v-model="ssoRequired"
                placement="end"
                label="Require SAML SSO"
                description="All members must authenticate via your identity provider."
              />
              <JSwitch
                v-model="auditLog"
                placement="end"
                label="Immutable audit stream"
                description="Stream admin events to your SIEM endpoint in real time."
              />
            </JStack>
          </JCard>
        </JSection>
      </JPage>
    </div>
  </DemoSection>

  <DemoSection
    title="Stacked Section with Header Actions"
    description="Default JSection stacks header above body — ideal for tables, metric grids, and overview cards."
  >
    <div style="width: 100%; max-width: 780px">
      <JSection
        title="Active Environments"
        description="Production and preview targets linked to your main branch."
      >
        <template #actions>
          <JInline gap="related">
            <JButton size="sm" variant="outline" tone="neutral">Logs</JButton>
            <JButton size="sm">Add environment</JButton>
          </JInline>
        </template>
        <JInline gap="item">
          <JCard size="sm" title="production" description="us-east · v2.4.1" style="flex: 1 1 200px" />
          <JCard size="sm" title="staging" description="eu-central · v2.5.0-rc.2" style="flex: 1 1 200px" />
        </JInline>
      </JSection>
    </div>
  </DemoSection>

  <DemoSection
    title="Container Measures"
    description="JContainer centers content to canonical max-widths with optional --j-page-gutter padding."
  >
    <JStack gap="item" style="width: 100%">
      <JContainer
        v-for="c in containerSizes"
        :key="c.size"
        :size="c.size"
        style="margin-inline: 0"
      >
        <div
          style="
            padding: var(--j-space-2-5, var(--j-space-2)) var(--j-space-3);
            border-radius: var(--j-radius-md);
            background: var(--j-surface-2);
            box-shadow: inset 0 0 0 1px var(--j-border);
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: var(--j-gap-related);
            font-size: var(--j-text-xs);
          "
        >
          <strong>size="{{ c.size }}" · {{ c.token }}</strong>
          <span style="color: var(--j-fg-muted)">{{ c.note }}</span>
        </div>
      </JContainer>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
