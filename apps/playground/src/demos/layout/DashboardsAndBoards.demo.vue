<script lang="ts">
export const meta = {
  name: 'Bento & Kanban Board',
  group: 'Layout',
  order: 8,
  description:
    '12-column container-responsive Bento dashboards and horizontal Kanban swimlane boards with sticky column headers.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JBento,
  JBentoCell,
  JBoard,
  JBoardColumn,
  JStack,
  JInline,
  JList,
  JListItem,
  JCard,
  JButton,
  JBadge,
  JAvatar,
  JProgress,
  JKbd,
  type JLayoutTone,
} from 'jenni-vue';

const bentoWidth = ref<'100%' | '780px' | '480px'>('100%');

type ColumnId = 'triage' | 'progress' | 'review' | 'shipped';

interface TaskItem {
  id: string;
  code: string;
  title: string;
  owner: string;
  tag: string;
  tone: JLayoutTone;
  column: ColumnId;
}

const tasks = ref<TaskItem[]>([
  {
    id: '1',
    code: 'JEN-104',
    title: 'Inset island surface tokens for dark obsidian theme',
    owner: 'Elena Rostova',
    tag: 'Tokens',
    tone: 'accent',
    column: 'triage',
  },
  {
    id: '2',
    code: 'JEN-108',
    title: 'Container query range breakpoints for Adaptive shell',
    owner: 'Marcus Vance',
    tag: 'Layout',
    tone: 'info',
    column: 'triage',
  },
  {
    id: '3',
    code: 'JEN-112',
    title: '12-column Bento grid with 2-row hero spans',
    owner: 'Sora Takahashi',
    tag: 'Screens',
    tone: 'accent',
    column: 'progress',
  },
  {
    id: '4',
    code: 'JEN-115',
    title: 'AI Canvas 300ms artifact stage glide curve',
    owner: 'Ada Lovelace',
    tag: 'Motion',
    tone: 'warning',
    column: 'progress',
  },
  {
    id: '5',
    code: 'JEN-119',
    title: '3-column DocsLayout sticky TOC keyline indicator',
    owner: 'Liam Chen',
    tag: 'Docs',
    tone: 'info',
    column: 'review',
  },
  {
    id: '6',
    code: 'JEN-098',
    title: 'Zero-overshoot spring alias verification across forms',
    owner: 'Elena Rostova',
    tag: 'Core',
    tone: 'success',
    column: 'shipped',
  },
]);

const columns: Array<{ id: ColumnId; title: string; tone: JLayoutTone; next?: ColumnId }> = [
  { id: 'triage', title: 'Triage', tone: 'neutral', next: 'progress' },
  { id: 'progress', title: 'In Progress', tone: 'accent', next: 'review' },
  { id: 'review', title: 'In Review', tone: 'warning', next: 'shipped' },
  { id: 'shipped', title: 'Shipped', tone: 'success' },
];

const tasksByColumn = computed(() => {
  const map: Record<ColumnId, TaskItem[]> = {
    triage: [],
    progress: [],
    review: [],
    shipped: [],
  };
  for (const item of tasks.value) {
    map[item.column].push(item);
  }
  return map;
});

function advanceTask(task: TaskItem, next?: ColumnId) {
  if (!next) return;
  task.column = next;
}

let seq = 120;
function addQuickTask(col: ColumnId) {
  seq += 1;
  tasks.value.unshift({
    id: String(seq),
    code: `JEN-${seq}`,
    title: 'Verify keyboard focus ring inside embedded stage',
    owner: 'Ada Lovelace',
    tag: 'A11y',
    tone: 'accent',
    column: col,
  });
}

const html = `<!-- 12-Column Responsive Bento Grid -->
<div class="j-bento" data-gap="group">
  <div class="j-bento__cell" data-span="8" data-row-span="2">
    <article class="j-card">Hero Telemetry…</article>
  </div>
  <div class="j-bento__cell" data-span="4">
    <article class="j-card">99.99% Uptime</article>
  </div>
  <div class="j-bento__cell" data-span="4">
    <article class="j-card">18.2ms p50</article>
  </div>
</div>

<!-- Horizontal Kanban / Swimlane Board -->
<div class="j-board">
  <section class="j-board__column" data-tone="accent">
    <header class="j-board__header">
      <div class="j-board__heading">
        <span class="j-board__dot"></span>
        <span class="j-board__title">In Progress</span>
        <span class="j-board__count">2</span>
      </div>
    </header>
    <div class="j-board__body">
      <article class="j-card" data-size="sm">…</article>
    </div>
  </section>
</div>`;
</script>

<template>
  <DemoSection
    title="12-Column Bento Dashboard (JBento & JBentoCell)"
    description="Cells accept span='3 | 4 | 6 | 8 | 12' and row-span='2'. Resize the container frame below: < 900px expands 3 & 4-col cells to 6 columns, and < 560px stacks cleanly into 1 column."
  >
    <JStack gap="field" style="width: 100%">
      <JInline gap="inline" justify="between" style="width: 100%">
        <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
          Preview container width:
        </span>
        <JInline gap="inline">
          <JButton
            v-for="opt in [
              { v: '100%' as const, label: 'Desktop 100% (12-col)' },
              { v: '780px' as const, label: 'Tablet 780px (6-col collapse)' },
              { v: '480px' as const, label: 'Mobile 480px (1-col stack)' },
            ]"
            :key="opt.v"
            size="sm"
            :variant="bentoWidth === opt.v ? 'soft' : 'ghost'"
            :tone="bentoWidth === opt.v ? 'accent' : 'neutral'"
            @click="bentoWidth = opt.v"
          >
            {{ opt.label }}
          </JButton>
        </JInline>
      </JInline>

      <div
        :style="{
          width: '100%',
          maxWidth: bentoWidth,
          marginInline: 'auto',
          transition: 'max-width var(--j-duration-slow) var(--j-ease-emphasized)',
        }"
      >
        <JBento gap="item" :row-min-height="128">
          <JBentoCell :span="8" :row-span="2">
            <JCard
              title="Global Edge Throughput"
              description="Span 8 · Row-Span 2 — primary analytical stage anchored on the 12-column grid."
            >
              <JStack gap="field" style="margin-top: var(--j-space-2)">
                <JInline justify="between">
                  <div>
                    <div style="font-size: var(--j-text-3xl); font-weight: 600; letter-spacing: var(--j-tracking-tight)">
                      4.82M
                    </div>
                    <div style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
                      Requests / minute across 38 regions
                    </div>
                  </div>
                  <JBadge tone="success" dot>+14.2% vs last week</JBadge>
                </JInline>

                <JStack gap="related">
                  <JInline justify="between" style="font-size: var(--j-text-xs)">
                    <span>North America (iad, sfo)</span>
                    <strong>46%</strong>
                  </JInline>
                  <JProgress :value="46" />
                  <JInline justify="between" style="font-size: var(--j-text-xs)">
                    <span>Europe (fra, lhr, cdg)</span>
                    <strong>34%</strong>
                  </JInline>
                  <JProgress :value="34" tone="info" />
                  <JInline justify="between" style="font-size: var(--j-text-xs)">
                    <span>Asia-Pacific (hnd, sin)</span>
                    <strong>20%</strong>
                  </JInline>
                  <JProgress :value="20" tone="success" />
                </JStack>
              </JStack>
            </JCard>
          </JBentoCell>

          <JBentoCell :span="4">
            <JCard size="sm" title="99.994%" description="Span 4 · SLA availability (90d)">
              <JBadge size="sm" variant="soft" tone="success">Zero incidents</JBadge>
            </JCard>
          </JBentoCell>

          <JBentoCell :span="4">
            <JCard size="sm" title="14.6 ms" description="Span 4 · Global p50 cold-start">
              <JInline gap="inline">
                <JKbd size="sm">V8 Isolate</JKbd>
                <JBadge size="sm" variant="outline" tone="neutral">-3.1 ms</JBadge>
              </JInline>
            </JCard>
          </JBentoCell>

          <JBentoCell :span="3">
            <JCard size="sm" title="TLS 1.3" description="Span 3 · Zero-RTTshakes" />
          </JBentoCell>

          <JBentoCell :span="3">
            <JCard size="sm" title="98.4%" description="Span 3 · Cache hit ratio" />
          </JBentoCell>

          <JBentoCell :span="6">
            <JCard size="sm" title="Recent Deployments" description="Span 6 · Half-width activity summary">
              <JList lines="compact" variant="divided">
                <JListItem title="v2.4.12 — Spatial screen primitives">
                  <template #trailing><JBadge size="sm" tone="success">Live</JBadge></template>
                </JListItem>
              </JList>
            </JCard>
          </JBentoCell>
        </JBento>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Horizontal Kanban & Swimlane Board (JBoard & JBoardColumn)"
    description="Fixed 296px --j-surface-2 columns with sticky headers, count badges, independently scrollable card streams, and optional footers."
  >
    <div style="width: 100%; height: 420px">
      <JBoard>
        <JBoardColumn
          v-for="col in columns"
          :key="col.id"
          :title="col.title"
          :count="tasksByColumn[col.id].length"
          :tone="col.tone"
          dot
        >
          <template #actions>
            <JButton
              size="sm"
              variant="ghost"
              tone="neutral"
              icon-only
              title="Add issue"
              @click="addQuickTask(col.id)"
            >
              +
            </JButton>
          </template>

          <JCard
            v-for="task in tasksByColumn[col.id]"
            :key="task.id"
            size="sm"
          >
            <JStack gap="related">
              <JInline justify="between">
                <span style="font-family: var(--j-font-mono); font-size: 11px; color: var(--j-fg-subtle)">
                  {{ task.code }}
                </span>
                <JBadge size="sm" variant="soft" :tone="task.tone">{{ task.tag }}</JBadge>
              </JInline>

              <div style="font-size: var(--j-text-sm); font-weight: 500; line-height: 1.35">
                {{ task.title }}
              </div>

              <JInline justify="between" style="margin-top: var(--j-space-1)">
                <JInline gap="inline">
                  <JAvatar :name="task.owner" size="xs" />
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">{{ task.owner }}</span>
                </JInline>
                <JButton
                  v-if="col.next"
                  size="sm"
                  variant="ghost"
                  tone="neutral"
                  @click="advanceTask(task, col.next)"
                >
                  Advance →
                </JButton>
              </JInline>
            </JStack>
          </JCard>

          <template #footer>
            <JButton
              size="sm"
              variant="ghost"
              tone="neutral"
              style="width: 100%; justify-content: flex-start"
              @click="addQuickTask(col.id)"
            >
              + New card
            </JButton>
          </template>
        </JBoardColumn>
      </JBoard>
    </div>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
