<script lang="ts">
export const meta = {
  name: 'Breadcrumb',
  group: 'Display',
  order: 7,
  description: 'Hierarchical location trail with crisp chevron or slash separators and collapsible depth.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JBreadcrumb,
  JBreadcrumbItem,
  JCard,
  JStack,
  JInline,
  JBadge,
} from 'jenni-vue';

const manualExpanded = ref(false);

const html = `<nav class="j-breadcrumb" aria-label="Breadcrumb">
  <ol class="j-breadcrumb__list">
    <li class="j-breadcrumb__item"><a class="j-breadcrumb__link" href="#org">Linearity</a></li>
    <li class="j-breadcrumb__item"><a class="j-breadcrumb__link" href="#proj">Design System</a></li>
    <li class="j-breadcrumb__item"><span class="j-breadcrumb__page" aria-current="page">Spatial Tokens</span></li>
  </ol>
</nav>`;
</script>

<template>
  <DemoSection title="Separators" description="chevron (default crisp 12px stroke mask) · slash (/)">
    <JStack gap="field" style="width:100%">
      <JCard size="sm">
        <JStack gap="item">
          <JInline justify="between" align="center">
            <JBreadcrumb>
              <JBreadcrumbItem href="#workspace" @click.prevent>Workspace</JBreadcrumbItem>
              <JBreadcrumbItem href="#projects" @click.prevent>Core Platform</JBreadcrumbItem>
              <JBreadcrumbItem href="#deployments" @click.prevent>Deployments</JBreadcrumbItem>
              <JBreadcrumbItem current>dpl_8f92a1c</JBreadcrumbItem>
            </JBreadcrumb>
            <JBadge variant="soft" tone="neutral" size="sm">chevron</JBadge>
          </JInline>

          <JInline justify="between" align="center">
            <JBreadcrumb separator="slash">
              <JBreadcrumbItem href="#org" @click.prevent>acme-ui</JBreadcrumbItem>
              <JBreadcrumbItem href="#pkg" @click.prevent>packages</JBreadcrumbItem>
              <JBreadcrumbItem href="#core" @click.prevent>core</JBreadcrumbItem>
              <JBreadcrumbItem current>tokens.css</JBreadcrumbItem>
            </JBreadcrumb>
            <JBadge variant="soft" tone="neutral" size="sm">slash</JBadge>
          </JInline>
        </JStack>
      </JCard>
    </JStack>
  </DemoSection>

  <DemoSection title="Leading icons & sizes" description="sm and md scales with crisp 14px / 12px inline iconography.">
    <JStack gap="item" style="width:100%">
      <JBreadcrumb>
        <JBreadcrumbItem href="#home" @click.prevent>
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" /></svg>
          </template>
          Overview
        </JBreadcrumbItem>
        <JBreadcrumbItem href="#infra" @click.prevent>
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /></svg>
          </template>
          Clusters
        </JBreadcrumbItem>
        <JBreadcrumbItem current>eu-central-prod</JBreadcrumbItem>
      </JBreadcrumb>

      <JBreadcrumb size="sm" separator="slash">
        <JBreadcrumbItem href="#docs" @click.prevent>Documentation</JBreadcrumbItem>
        <JBreadcrumbItem href="#foundations" @click.prevent>Foundations</JBreadcrumbItem>
        <JBreadcrumbItem current>Typography &amp; Scale</JBreadcrumbItem>
      </JBreadcrumb>
    </JStack>
  </DemoSection>

  <DemoSection title="Collapsed ellipsis" description="Truncate deep hierarchies via automatic max-items or an explicit ellipsis trigger.">
    <JStack gap="field" style="width:100%">
      <JStack gap="inline">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Auto-collapse (`:max-items="4"` — click `…` to expand):</span>
        <JBreadcrumb :max-items="4">
          <JBreadcrumbItem href="#root" @click.prevent>Organization</JBreadcrumbItem>
          <JBreadcrumbItem href="#div" @click.prevent>Engineering</JBreadcrumbItem>
          <JBreadcrumbItem href="#team" @click.prevent>Design Systems</JBreadcrumbItem>
          <JBreadcrumbItem href="#repo" @click.prevent>design-system</JBreadcrumbItem>
          <JBreadcrumbItem href="#display" @click.prevent>Display</JBreadcrumbItem>
          <JBreadcrumbItem current>Breadcrumb</JBreadcrumbItem>
        </JBreadcrumb>
      </JStack>

      <JStack gap="inline">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Explicit ellipsis item (`ellipsis` prop):</span>
        <JBreadcrumb>
          <JBreadcrumbItem href="#src" @click.prevent>src</JBreadcrumbItem>
          <template v-if="!manualExpanded">
            <JBreadcrumbItem ellipsis label="Expand intermediate directories" @click="manualExpanded = true" />
          </template>
          <template v-else>
            <JBreadcrumbItem href="#packages" @click.prevent>packages</JBreadcrumbItem>
            <JBreadcrumbItem href="#vue" @click.prevent>vue</JBreadcrumbItem>
          </template>
          <JBreadcrumbItem href="#display" @click.prevent>display</JBreadcrumbItem>
          <JBreadcrumbItem current>JBreadcrumb.vue</JBreadcrumbItem>
        </JBreadcrumb>
      </JStack>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
