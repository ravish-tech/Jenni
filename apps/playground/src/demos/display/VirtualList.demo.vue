<script lang="ts">
export const meta = {
  name: 'Virtual List',
  group: 'Display',
  order: 15,
  description: 'Windowed O(1) fixed-height and ResizeObserver variable-height virtual scroller for 50,000+ items at 60fps.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JVirtualList,
  JBadge,
  JButton,
  JInline,
  JStack,
  JAvatar,
  type JVirtualListHandle,
} from 'jenni-vue';

interface LogEntry {
  id: number;
  ts: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  message: string;
}

const SERVICES = ['api-gateway', 'auth-worker', 'scheduler', 'edge-router', 'query-engine'] as const;
const LEVELS = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'] as const;

const logs: LogEntry[] = Array.from({ length: 50000 }, (_, i) => {
  const sec = String(i % 60).padStart(2, '0');
  const min = String(Math.floor(i / 60) % 60).padStart(2, '0');
  const ms = String((i * 17) % 1000).padStart(3, '0');
  const level = LEVELS[i % LEVELS.length]!;
  const service = SERVICES[i % SERVICES.length]!;
  return {
    id: i + 1,
    ts: `12:${min}:${sec}.${ms}`,
    level,
    service,
    message:
      level === 'ERROR'
        ? `Upstream timeout after 1200ms while draining shard #${(i % 16) + 1}`
        : level === 'WARN'
          ? `Retry attempt 1 succeeded for partition ${(i % 8) + 1} (p99=28ms)`
          : `Processed batch #${i + 1000} (${12 + (i % 84)} records) in ${2 + (i % 14)}ms`,
  };
});

interface FeedNote {
  id: number;
  author: string;
  title: string;
  body: string;
}

const AUTHORS = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Margaret Hamilton', 'Barbara Liskov'] as const;
const variableItems: FeedNote[] = Array.from({ length: 5000 }, (_, i) => ({
  id: i + 1,
  author: AUTHORS[i % AUTHORS.length]!,
  title: `Commit #${5000 - i} · Spatial token audit`,
  body:
    i % 3 === 0
      ? 'Updated container query breakpoints, verified zero horizontal scroll inflation, and added unit regression coverage across 16 shells and compact 0.65× density.'
      : i % 2 === 0
        ? 'Normalized tabular-numeral column widths and keyboard roving focus.'
        : 'Minor changelog entry.',
}));

const fixedRef = ref<JVirtualListHandle | null>(null);
const jumpTarget = ref(25000);

function jumpTo(idx: number) {
  jumpTarget.value = idx;
  fixedRef.value?.scrollToIndex(idx, 'center', 'smooth');
}

const code = `<JVirtualList ref="listRef" :items="logs" :item-height="32" :height="320" divided>
  <template #default="{ item }">
    <div style="display:flex;align-items:center;gap:12px;height:32px;padding:0 12px">
      <code>{{ item.ts }}</code>
      <JBadge size="sm">{{ item.level }}</JBadge>
      <span>{{ item.message }}</span>
    </div>
  </template>
</JVirtualList>`;
</script>

<template>
  <DemoSection
    title="50,000-Row Fixed-Height Stream"
    description="O(1) offset math mounts ~18 DOM nodes regardless of dataset size, keeping scroll and theme transitions instantaneous."
  >
    <JStack gap="item" style="width: 100%">
      <JInline justify="between" wrap>
        <JInline gap="related">
          <JButton size="sm" variant="outline" @click="jumpTo(0)">Top (#1)</JButton>
          <JButton size="sm" variant="outline" @click="jumpTo(24999)">Jump #25,000</JButton>
          <JButton size="sm" variant="outline" @click="jumpTo(49999)">Bottom (#50,000)</JButton>
        </JInline>
        <JBadge variant="soft" tone="info">50,000 rows · ~18 DOM nodes mounted</JBadge>
      </JInline>

      <div style="border: 1px solid var(--j-border); border-radius: var(--j-radius-md); overflow: clip; background: var(--j-surface-1)">
        <JVirtualList
          ref="fixedRef"
          :items="logs"
          :item-height="32"
          :height="320"
          key-field="id"
          divided
          aria-label="Streaming system logs"
        >
          <template #default="{ item }">
            <div
              style="
                display: flex;
                align-items: center;
                gap: var(--j-space-2);
                height: 32px;
                padding-inline: var(--j-space-3);
                font-size: var(--j-text-xs);
                font-variant-numeric: tabular-nums;
              "
            >
              <span style="font-family: var(--j-font-mono); color: var(--j-fg-subtle); flex-shrink: 0">
                #{{ String(item.id).padStart(5, '0') }}
              </span>
              <span style="font-family: var(--j-font-mono); color: var(--j-fg-muted); flex-shrink: 0">
                {{ item.ts }}
              </span>
              <JBadge
                size="sm"
                :tone="item.level === 'ERROR' ? 'danger' : item.level === 'WARN' ? 'warning' : 'neutral'"
              >
                {{ item.level }}
              </JBadge>
              <JBadge size="sm" :color-seed="item.service">{{ item.service }}</JBadge>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--j-fg)">
                {{ item.message }}
              </span>
            </div>
          </template>
        </JVirtualList>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Dynamic Variable-Height Rows (ResizeObserver)"
    description="Omit item-height and pass estimate-height: a shared ResizeObserver measures each row automatically and maintains exact binary-search offsets."
  >
    <div style="width: 100%; border: 1px solid var(--j-border); border-radius: var(--j-radius-md); overflow: clip; background: var(--j-surface-1)">
      <JVirtualList
        :items="variableItems"
        :estimate-height="76"
        :height="320"
        key-field="id"
        divided
        aria-label="Commit activity feed"
      >
        <template #default="{ item }">
          <div style="display: flex; gap: var(--j-space-3); padding: var(--j-space-3)">
            <JAvatar :name="item.author" size="sm" auto-color />
            <JStack gap="inline" style="min-width: 0; flex: 1">
              <JInline justify="between">
                <strong style="font-size: var(--j-text-sm)">{{ item.title }}</strong>
                <JBadge size="sm" :color-seed="item.author">{{ item.author }}</JBadge>
              </JInline>
              <p style="margin: 0; font-size: var(--j-text-xs); color: var(--j-fg-muted); line-height: 1.5">
                {{ item.body }}
              </p>
            </JStack>
          </div>
        </template>
      </JVirtualList>
    </div>
  </DemoSection>

  <DemoSection title="Usage">
    <DemoCode lang="html" :code="code" code-only />
  </DemoSection>
</template>
