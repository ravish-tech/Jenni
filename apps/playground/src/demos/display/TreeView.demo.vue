<script lang="ts">
export const meta = {
  name: 'Tree View',
  group: 'Display',
  order: 16,
  description: 'WAI-ARIA hierarchical explorer with subtle indentation hairlines, async lazy child loading, smooth branch collapse, and full keyboard roving focus.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JTreeView,
  JTreeItem,
  JCard,
  JBadge,
  JButton,
  JKbd,
  JStack,
  JInline,
  JGrid,
  type JTreeNode,
} from 'jenni-vue';

const selectedFile = ref<string>('tokens.css');
const expandedDirs = ref<string[]>(['packages', 'core', 'components']);

const repoNodes: JTreeNode[] = [
  {
    id: 'packages',
    label: 'packages',
    meta: '3 workspaces',
    children: [
      {
        id: 'core',
        label: 'core',
        children: [
          { id: 'tokens.css', label: 'tokens.css', meta: '8.4 KB' },
          { id: 'base.css', label: 'base.css', meta: '3.1 KB' },
          {
            id: 'components',
            label: 'components',
            children: [
              { id: 'table.css', label: 'table.css', meta: '6.2 KB' },
              { id: 'stepper.css', label: 'stepper.css', meta: '4.8 KB' },
              { id: 'tree-view.css', label: 'tree-view.css', meta: '4.1 KB' },
              { id: 'carousel.css', label: 'carousel.css', meta: '5.0 KB' },
            ],
          },
        ],
      },
      {
        id: 'vue',
        label: 'vue',
        children: [
          { id: 'JDataTable.vue', label: 'JDataTable.vue', meta: '9.1 KB' },
          { id: 'JTreeView.vue', label: 'JTreeView.vue', meta: '3.4 KB' },
        ],
      },
      {
        id: 'react',
        label: 'react',
        children: [
          { id: 'Table.tsx', label: 'Table.tsx', meta: '10.2 KB' },
          { id: 'TreeView.tsx', label: 'TreeView.tsx', meta: '7.6 KB' },
        ],
      },
    ],
  },
  { id: 'package.json', label: 'package.json', meta: '612 B' },
  { id: 'README.md', label: 'README.md', meta: '4.2 KB' },
];

const allBranchIds = ['packages', 'core', 'components', 'vue', 'react'];

const selectedScopes = ref<string[]>(['iam-read', 'kms-sign']);

/* ---- Lazy-loaded remote directory tree ---- */
const remoteTreeRevision = ref(0);
const selectedRemoteNode = ref<string>('s3-prod');
const remoteFetchCount = ref(0);
const lastLoadedSummary = ref('Expand any folder to fetch remote entries (350ms)');

const remoteRootNodes: JTreeNode[] = [
  { id: 's3-prod', label: 'prod-artifacts-us-east', meta: 's3', lazy: true },
  { id: 's3-telemetry', label: 'telemetry-parquet', meta: 's3', lazy: true },
  { id: 's3-quarantine', label: 'quarantine-staging', meta: 'empty', lazy: true },
  { id: 'manifest.lock', label: 'manifest.lock', meta: '1.8 KB' },
];

const REMOTE_DIRECTORY_INDEX: Record<string, JTreeNode[]> = {
  's3-prod': [
    { id: 'rel-2026-11', label: 'releases-2026-11', meta: 'subfolder', lazy: true },
    { id: 'rel-2026-10', label: 'releases-2026-10', meta: 'subfolder', lazy: true },
    { id: 'checksums.txt', label: 'SHA256SUMS', meta: '4.1 KB' },
  ],
  'rel-2026-11': [
    { id: 'core-0.2.0.tgz', label: 'core-0.2.0.tgz', meta: '64.8 KB' },
    { id: 'vue-0.2.0.tgz', label: 'vue-0.2.0.tgz', meta: '48.2 KB' },
    { id: 'react-0.2.0.tgz', label: 'react-0.2.0.tgz', meta: '51.0 KB' },
  ],
  'rel-2026-10': [
    { id: 'core-0.1.9.tgz', label: 'core-0.1.9.tgz', meta: '61.2 KB' },
    { id: 'sbom.spdx.json', label: 'sbom.spdx.json', meta: '19.4 KB' },
  ],
  's3-telemetry': [
    { id: 'part-0001', label: 'part-00001.snappy.parquet', meta: '128 MB' },
    { id: 'part-0002', label: 'part-00002.snappy.parquet', meta: '124 MB' },
    { id: 'archive-cold', label: 'glacier-archive', meta: 'empty', lazy: true },
  ],
  's3-quarantine': [],
  'archive-cold': [],
};

async function fetchRemoteChildren(node: JTreeNode): Promise<JTreeNode[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  remoteFetchCount.value += 1;
  return REMOTE_DIRECTORY_INDEX[node.id] ?? [];
}

function handleRemoteLoaded(node: JTreeNode, children?: JTreeNode[]) {
  const count = children?.length ?? 0;
  lastLoadedSummary.value =
    count === 0
      ? `${node.label}: 0 entries (empty folder)`
      : `${node.label}: loaded ${count} ${count === 1 ? 'item' : 'items'}`;
}

function resetRemoteTree() {
  remoteTreeRevision.value += 1;
  remoteFetchCount.value = 0;
  selectedRemoteNode.value = 's3-prod';
  lastLoadedSummary.value = 'Cache cleared — expand any folder to fetch';
}

const html = `<ul class="j-tree" role="tree" aria-label="Project files" data-guides>
  <li class="j-tree__node" role="none">
    <div class="j-tree__item" role="treeitem" aria-expanded="true" aria-selected="false" tabindex="0">
      <button type="button" class="j-tree__chevron" tabindex="-1" aria-hidden="true"></button>
      <span class="j-tree__label">src</span>
      <span class="j-tree__meta">2 files</span>
    </div>
    <div class="j-tree__branch" role="none">
      <ul class="j-tree__group" role="group">
        <li class="j-tree__node" role="none">
          <div class="j-tree__item" role="treeitem" aria-selected="true" tabindex="-1">
            <span class="j-tree__spacer" aria-hidden="true"></span>
            <span class="j-tree__label">tokens.css</span>
            <span class="j-tree__meta">8.4 KB</span>
          </div>
        </li>
      </ul>
    </div>
  </li>
</ul>`;
</script>

<template>
  <DemoSection
    title="IDE workspace explorer"
    description="Data-driven :nodes prop with indentation guides, metadata counts, and full WAI-ARIA arrow-key navigation."
  >
    <JGrid :min-cell-width="280" gap="field" style="width:100%">
      <JCard size="sm" footer-divider>
        <JStack gap="item">
          <JInline justify="between" align="center">
            <span style="font-size:var(--j-text-xs);font-weight:var(--j-weight-semibold);color:var(--j-fg-muted)">EXPLORER · WORKSPACE</span>
            <JInline gap="inline">
              <JButton variant="ghost" size="sm" @click="expandedDirs = [...allBranchIds]">Expand all</JButton>
              <JButton variant="ghost" size="sm" @click="expandedDirs = []">Collapse</JButton>
            </JInline>
          </JInline>

          <JTreeView
            v-model="selectedFile"
            v-model:expanded="expandedDirs"
            :nodes="repoNodes"
            size="sm"
            label="Repository explorer"
          />
        </JStack>

        <template #footer>
          <JInline justify="between" align="center" style="width:100%">
            <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">
              Active: <strong style="color:var(--j-fg)">{{ selectedFile }}</strong>
            </span>
            <JInline gap="inline" align="center">
              <JKbd size="sm">↑↓</JKbd>
              <JKbd size="sm">←→</JKbd>
              <JKbd size="sm">Enter</JKbd>
            </JInline>
          </JInline>
        </template>
      </JCard>

      <JCard
        size="sm"
        title="Declarative composition & multi-select"
        description="Compose nested <JTreeItem> slots with badges and aria-multiselectable."
      >
        <JStack gap="item">
          <JTreeView
            v-model="selectedScopes"
            multiple
            :default-expanded="['security', 'compute']"
            label="Permission scopes"
          >
            <JTreeItem value="security" label="Security & Cryptography">
              <template #meta>
                <JBadge size="sm" variant="outline" tone="neutral">3</JBadge>
              </template>
              <JTreeItem value="iam-read" label="iam:ReadPolicies" meta="Required" />
              <JTreeItem value="kms-sign" label="kms:SignArtifact" meta="Hardware HSM" />
              <JTreeItem value="kms-destroy" label="kms:ScheduleKeyDeletion" disabled meta="Restricted" />
            </JTreeItem>

            <JTreeItem value="compute" label="Edge Compute Runtime">
              <template #meta>
                <JBadge size="sm" variant="outline" tone="neutral">2</JBadge>
              </template>
              <JTreeItem value="workers-deploy" label="workers:DeployPreview" meta="All regions" />
              <JTreeItem value="logs-tail" label="logs:StreamRealtime" meta="Audit logged" />
            </JTreeItem>
          </JTreeView>

          <JInline gap="inline" align="center" style="padding-block-start:var(--j-space-1)">
            <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Selected scopes:</span>
            <JBadge
              v-for="scope in selectedScopes"
              :key="scope"
              size="sm"
              variant="soft"
            >
              {{ scope }}
            </JBadge>
            <span v-if="selectedScopes.length === 0" style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)">None</span>
          </JInline>
        </JStack>
      </JCard>
    </JGrid>
  </DemoSection>

  <DemoSection
    title="Lazy-Loaded Remote Directory Tree"
    description="Async loadChildren(node) fetches remote branches on first expand (350ms), displays an inline 12×12 spinner with aria-busy, caches nested subfolders, and retires the chevron cleanly when a folder resolves empty."
  >
    <JCard size="sm" footer-divider style="width:100%;max-width:520px">
      <JStack gap="item">
        <JInline justify="between" align="center">
          <JInline gap="inline" align="center">
            <span style="font-size:var(--j-text-xs);font-weight:var(--j-weight-semibold);color:var(--j-fg-muted)">OBJECT BUCKET · REMOTE</span>
            <JBadge size="sm" variant="outline" tone="neutral">{{ remoteFetchCount }} RPCs</JBadge>
          </JInline>
          <JButton variant="ghost" size="sm" @click="resetRemoteTree">Reset cache</JButton>
        </JInline>

        <JTreeView
          :key="remoteTreeRevision"
          v-model="selectedRemoteNode"
          :nodes="remoteRootNodes"
          :load-children="fetchRemoteChildren"
          size="sm"
          label="Remote bucket explorer"
          @load="handleRemoteLoaded"
        />
      </JStack>

      <template #footer>
        <JInline justify="between" align="center" style="width:100%">
          <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted);font-variant-numeric:tabular-nums">
            {{ lastLoadedSummary }}
          </span>
          <JKbd size="sm">→ to load</JKbd>
        </JInline>
      </template>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
