<script lang="ts">
export const meta = {
  name: 'Empty State',
  group: 'Display',
  order: 6,
  description: 'Calm editorial zero-data composition with an architectural icon emblem and measured copy.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import {
  JEmptyState,
  JButton,
  JCard,
  JGrid,
} from '@jenni/vue';

const html = `<div class="j-empty-state" data-variant="dashed" style="max-width:480px">
  <div class="j-empty-state__icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  </div>
  <h3 class="j-empty-state__title">No artifacts uploaded</h3>
  <p class="j-empty-state__description">Drop a signed release bundle here or trigger a build from your CI pipeline.</p>
  <div class="j-empty-state__actions">
    <button type="button" class="j-button" data-size="sm">Upload bundle</button>
    <button type="button" class="j-button" data-variant="outline" data-size="sm">Read docs</button>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Variants" description="surface (default) · dashed · ghost">
    <JGrid :min-cell-width="280" gap="field" style="width:100%">
      <JEmptyState
        title="No production deployments"
        description="Connect a Git repository to build and promote previews automatically on every push."
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </template>
        <template #actions>
          <JButton size="sm">Connect repository</JButton>
          <JButton variant="outline" size="sm">Import template</JButton>
        </template>
      </JEmptyState>

      <JEmptyState
        variant="dashed"
        title="No custom webhooks"
        description="Subscribe an endpoint to receive signed delivery receipts and deployment status events."
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </template>
        <template #actions>
          <JButton variant="outline" size="sm">Add endpoint</JButton>
        </template>
      </JEmptyState>
    </JGrid>
  </DemoSection>

  <DemoSection title="Ghost inside a container & sizes" description="sm · md (default) · lg — ghost sits cleanly inside cards, tables, or split panes.">
    <JGrid :min-cell-width="280" gap="field" style="width:100%">
      <JCard size="sm" title="Search results" description="Filtered by status: incident">
        <JEmptyState
          variant="ghost"
          size="sm"
          tone="success"
          title="All systems operational"
          description="Zero active incidents or degraded regions across the last 30 days."
        >
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </template>
        </JEmptyState>
      </JCard>

      <JEmptyState
        size="lg"
        tone="accent"
        title="Initialize your design tokens"
        description="Start with the default architectural palette and 4px spatial rhythm, or import tokens from an existing workspace."
      >
        <template #icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </template>
        <template #actions>
          <JButton>Create token set</JButton>
          <JButton variant="ghost">Browse presets</JButton>
        </template>
      </JEmptyState>
    </JGrid>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
