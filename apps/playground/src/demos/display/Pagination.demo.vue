<script lang="ts">
export const meta = {
  name: 'Pagination',
  group: 'Display',
  order: 8,
  description: 'Tabular-numeral page navigation with stable windowing and poised active states.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JPagination,
  JCard,
  JStack,
  JInline,
  JBadge,
} from '@jenni/vue';

const pageMain = ref(5);
const pageSoft = ref(4);
const pageSolid = ref(6);
const pageSimple = ref(4);
const pageCompact = ref(12);

const html = `<nav class="j-pagination" aria-label="Pagination">
  <ul class="j-pagination__list">
    <li><button type="button" class="j-pagination__item j-pagination__prev" aria-label="Previous page"></button></li>
    <li><button type="button" class="j-pagination__item">1</button></li>
    <li><span class="j-pagination__ellipsis" aria-hidden="true">…</span></li>
    <li><button type="button" class="j-pagination__item">4</button></li>
    <li><button type="button" class="j-pagination__item" aria-current="page">5</button></li>
    <li><button type="button" class="j-pagination__item">6</button></li>
    <li><span class="j-pagination__ellipsis" aria-hidden="true">…</span></li>
    <li><button type="button" class="j-pagination__item">24</button></li>
    <li><button type="button" class="j-pagination__item j-pagination__next" aria-label="Next page"></button></li>
  </ul>
</nav>`;
</script>

<template>
  <DemoSection title="Windowed pagination (outline default)" description="Fixed-slot sibling & boundary windowing keeps control width rock-steady across all 24 pages.">
    <JStack gap="item" style="width:100%">
      <JInline gap="related" align="center">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Showing items {{ (pageMain - 1) * 10 + 1 }}–{{ pageMain * 10 }} of 240</span>
        <JBadge variant="outline" tone="neutral" size="sm">Page {{ pageMain }} / 24</JBadge>
      </JInline>
      <JPagination v-model="pageMain" :total="240" :page-size="10" />
    </JStack>
  </DemoSection>

  <DemoSection title="Active variants" description="outline (default) · soft · solid (neutral or accent)">
    <JStack gap="field" style="width:100%">
      <JStack gap="inline">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Soft (accent tint)</span>
        <JPagination v-model="pageSoft" variant="soft" :total-pages="16" />
      </JStack>

      <JStack gap="inline">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Solid (crisp neutral ink)</span>
        <JPagination v-model="pageSolid" variant="solid" tone="neutral" :total-pages="16" />
      </JStack>

      <JStack gap="inline">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">With explicit Previous / Next labels</span>
        <JPagination v-model="pageMain" :total-pages="24" show-labels />
      </JStack>
    </JStack>
  </DemoSection>

  <DemoSection title="Simple variant & compact size" description="Minimal Prev / Next bar for tables, logs, and inspector footers.">
    <JStack gap="field" style="width:100%;max-width:560px">
      <JCard size="sm" footer-divider title="Audit trail" description="Recent cryptographic key rotations.">
        <div style="font-size:var(--j-text-sm);color:var(--j-fg-muted)">
          Displaying batch {{ pageSimple }} of 24 signed ledger entries.
        </div>
        <template #footer>
          <JInline justify="between" align="center" style="width:100%">
            <JPagination v-model="pageSimple" variant="simple" size="sm" :total-pages="24" />
          </JInline>
        </template>
      </JCard>

      <JStack gap="inline">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Small (`size="sm"`) numbered pagination:</span>
        <JPagination v-model="pageCompact" size="sm" :total-pages="30" />
      </JStack>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
