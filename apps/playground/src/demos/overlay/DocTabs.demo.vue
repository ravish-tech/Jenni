<script lang="ts">
export const meta = {
  name: 'Document Tabs',
  group: 'Overlay',
  order: 7.5,
  wide: true,
  description: 'IDE, notebook, and browser document tab strip with dirty indicators, middle-click close, pinned tabs, drag-to-reorder, wheel scroll, overflow menu, and context menu hooks.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JDocTabs,
  JContextMenu,
  JDropdownItem,
  JDropdownLabel,
  JDropdownSeparator,
  JBadge,
  JButton,
  JIcon,
  JSegmentedControl,
  JInline,
  JStack,
  type DocTabItem,
  type DocTabsVariant,
} from 'jenni-vue';

const variant = ref<DocTabsVariant>('workbench');
const variantOptions = [
  { value: 'workbench', label: 'Workbench' },
  { value: 'island', label: 'Island' },
  { value: 'minimal', label: 'Minimal' },
];

let seq = 9;
const activeId = ref('grid');
const tabs = ref<DocTabItem[]>([
  { id: 'overview', label: 'workspace.json', icon: 'settings', pinned: true },
  { id: 'grid', label: 'DataGrid.vue', icon: 'file-code', dirty: true },
  { id: 'ctx', label: 'context-menu.js', icon: 'code' },
  { id: 'term', label: 'zsh — agent-runner', icon: 'terminal', badge: 'live' },
  { id: 'pr', label: 'PR #418 · Theme API', icon: 'git-pull-request', dirty: true },
  { id: 'tokens', label: 'tokens.css', icon: 'sliders' },
  { id: 'notes', label: '2026-11-20.md', icon: 'file' },
  { id: 'bench', label: 'benchmarks.json', icon: 'sparkles' },
]);

const ctxRef = ref<InstanceType<typeof JContextMenu> | null>(null);
const contextTab = ref<DocTabItem | null>(null);

function addNewTab() {
  const n = seq++;
  const id = `untitled-${n}`;
  tabs.value = [...tabs.value, { id, label: `Untitled-${n}.ts`, icon: 'file-code', dirty: true }];
  activeId.value = id;
}

function toggleDirty(id: string) {
  tabs.value = tabs.value.map((t) => (t.id === id ? { ...t, dirty: !t.dirty } : t));
}

function togglePin(id: string) {
  tabs.value = tabs.value.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t));
}

function closeOthers(keepId: string) {
  tabs.value = tabs.value.filter((t) => t.pinned || t.id === keepId);
  activeId.value = keepId;
}

function onTabContext(tab: DocTabItem, event: MouseEvent) {
  contextTab.value = tab;
  (ctxRef.value as any)?.openFromEvent?.(event);
}

const initialCustomTabs: DocTabItem[] = [
  { id: 'router', label: 'router.ts', icon: 'code', meta: 'src/app' },
  { id: 'schema', label: 'schema.sql', icon: 'file-code', dirty: true, meta: 'db' },
  { id: 'deploy', label: 'release.yml', icon: 'settings', meta: 'ci' },
];
const customActiveId = ref('schema');
const customTabs = ref<DocTabItem[]>([...initialCustomTabs]);

function resetCustomTabs() {
  customTabs.value = [...initialCustomTabs];
  customActiveId.value = 'schema';
}

const code = `<JDocTabs
  v-model="activeId"
  v-model:tabs="tabs"
  variant="workbench"
  addable
  reorderable
  @add="addNewTab"
  @tab-contextmenu="onTabContext"
>
  <template #tab="{ tab }">
    <JIcon v-if="tab.icon" :name="tab.icon" size="sm" />
    <span class="j-doc-tabs__label">{{ tab.label }}</span>
  </template>
</JDocTabs>`;
</script>

<template>
  <DemoSection
    title="Interactive Workbench Document Strip"
    description="Hover dirty tabs to reveal the close button, middle-click to close, drag tabs to reorder, scroll horizontally with your mouse wheel, click '+' to spawn overflow tabs, or right-click any tab."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" wrap>
        <JSegmentedControl v-model="variant" size="sm" :options="variantOptions" />
        <JInline gap="related">
          <JButton size="sm" variant="outline" @click="toggleDirty(activeId)">
            Toggle Dirty Dot
          </JButton>
          <JButton size="sm" variant="outline" @click="addNewTab">
            + Add Tab ({{ tabs.length }})
          </JButton>
        </JInline>
      </JInline>

      <div style="border: 1px solid var(--j-border); border-radius: var(--j-radius-md); overflow: clip; background: var(--j-surface-1)">
        <JDocTabs
          v-model="activeId"
          v-model:tabs="tabs"
          :variant="variant"
          addable
          reorderable
          @add="addNewTab"
          @tab-contextmenu="onTabContext"
        />

        <div style="padding: var(--j-space-5); min-height: 120px; display: flex; align-items: center; justify-content: space-between">
          <JStack gap="inline">
            <strong style="font-size: var(--j-text-sm)">
              Active document: {{ tabs.find((t) => t.id === activeId)?.label ?? 'None' }}
            </strong>
            <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
              Right-click any tab above to Pin/Unpin, Toggle Unsaved State, or Close Other Tabs.
            </span>
          </JStack>
          <JBadge v-if="tabs.find((t) => t.id === activeId)?.dirty" tone="warning" dot>Unsaved changes</JBadge>
          <JBadge v-else tone="success" dot>Saved</JBadge>
        </div>
      </div>

      <JContextMenu ref="ctxRef">
        <JDropdownLabel>{{ contextTab?.label ?? 'Tab' }}</JDropdownLabel>
        <JDropdownItem @select="contextTab && togglePin(contextTab.id)">
          {{ contextTab?.pinned ? 'Unpin tab' : 'Pin tab' }}
        </JDropdownItem>
        <JDropdownItem @select="contextTab && toggleDirty(contextTab.id)">
          {{ contextTab?.dirty ? 'Mark as saved' : 'Mark as unsaved (dirty)' }}
        </JDropdownItem>
        <JDropdownSeparator />
        <JDropdownItem @select="contextTab && closeOthers(contextTab.id)">
          Close other tabs
        </JDropdownItem>
      </JContextMenu>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Custom #tab Slot & Programmatic Close"
    description="Custom #tab content preserves the trailing dirty indicator and × close button automatically, while also exposing { tab, active, index, closable, close } for custom controls."
  >
    <JStack gap="item" style="width: 100%">
      <div style="border: 1px solid var(--j-border); border-radius: var(--j-radius-md); overflow: clip; background: var(--j-surface-1)">
        <JDocTabs v-model="customActiveId" v-model:tabs="customTabs" variant="workbench">
          <template #tab="{ tab, close }">
            <span class="j-doc-tabs__icon" aria-hidden="true">
              <JIcon v-if="tab.icon" :name="tab.icon" size="sm" />
            </span>
            <span class="j-doc-tabs__label">
              <span style="color: var(--j-fg-subtle); margin-inline-end: 4px">{{ tab.meta }}/</span>{{ tab.label }}
            </span>
            <button
              v-if="tab.dirty"
              type="button"
              style="padding: 1px 5px; border: 1px solid var(--j-border); border-radius: var(--j-radius-xs); background: var(--j-surface-2); color: var(--j-fg-muted); font: inherit; font-size: 10px; cursor: pointer"
              @click.stop="close($event)"
            >
              Discard
            </button>
          </template>
          <template #empty>
            All custom tabs closed.
          </template>
        </JDocTabs>
      </div>
      <JInline v-if="customTabs.length < initialCustomTabs.length" gap="related">
        <JButton size="sm" variant="outline" @click="resetCustomTabs">Restore tabs</JButton>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Usage">
    <DemoCode lang="html" :code="code" code-only />
  </DemoSection>
</template>
