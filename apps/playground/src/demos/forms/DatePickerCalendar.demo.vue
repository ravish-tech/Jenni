<script lang="ts">
export const meta = {
  name: 'Date Picker / Calendar',
  group: 'Forms',
  order: 16,
  description: 'Architectural 7-column month grid and anchored date/range picker with WAI-ARIA arrow navigation.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JBadge,
  JCalendar,
  JDatePicker,
  JField,
  JInline,
  JStack,
  type DateRange,
} from 'jenni-vue';

const dueDate = ref<string | null>('2026-11-18');
const sprintWindow = ref<DateRange | null>({ start: '2026-11-09', end: '2026-11-20' });
const inlineSingle = ref<string | null>('2026-11-12');
const inlineRange = ref<DateRange | null>({ start: '2026-11-04', end: '2026-11-14' });
const boundedDate = ref<string | null>('2026-11-15');
const notebookDate = ref<string | null>('2026-11-18');
const notebookMarkers = {
  '2026-11-03': 'info',
  '2026-11-06': ['accent', 'success'],
  '2026-11-12': [{ tone: 'accent', label: 'Architecture note' }, { tone: 'warning', label: 'Review' }],
  '2026-11-18': ['success', 'accent', 'info'],
  '2026-11-21': 'danger',
  '2026-11-25': 2,
} as const;

const sizeDates = reactive<{
  sm: string | null;
  md: string | null;
  lg: string | null;
  invalid: string | null;
}>({
  sm: '2026-11-05',
  md: '2026-11-12',
  lg: '2026-11-24',
  invalid: null,
});

const html = `<div class="j-date-picker" data-mode="single" data-placeholder="Select release date" style="max-width:280px">
  <button type="button" class="j-date-picker__trigger" popovertarget="dp-pop">
    <span class="j-date-picker__icon" aria-hidden="true">📅</span>
    <span class="j-date-picker__value" data-placeholder>Select release date</span>
  </button>
  <button type="button" class="j-date-picker__clear" aria-label="Clear" hidden>×</button>
</div>
<div id="dp-pop" class="j-date-picker__popover" popover="auto">
  <div class="j-calendar" data-mode="single"></div>
</div>`;
</script>

<template>
  <DemoSection
    title="Anchored Date & Range Pickers"
    description="Opens a CSS-anchored calendar popover with Escape/light-dismiss, keyboard grid navigation, and Today/Clear actions."
  >
    <JInline gap="group" wrap style="width: 100%; align-items: flex-start">
      <JField label="Target release date" hint="Single YYYY-MM-DD selection" style="width: 260px">
        <JDatePicker v-model="dueDate" placeholder="Choose release date" />
      </JField>

      <JField label="Sprint window" hint="Click start and end dates" style="width: 300px">
        <JDatePicker v-model="sprintWindow" mode="range" :week-starts-on="1" />
      </JField>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Standalone Calendar Grids"
    description="Inline single and range calendars with live hover preview strip, Monday week start, and tabular numerals."
  >
    <JInline gap="group" wrap style="align-items: flex-start">
      <JStack gap="related">
        <JInline gap="related">
          <JBadge variant="soft" tone="accent">Single</JBadge>
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted); font-variant-numeric: tabular-nums">
            {{ inlineSingle ?? 'None' }}
          </span>
        </JInline>
        <JCalendar v-model="inlineSingle" />
      </JStack>

      <JStack gap="related">
        <JInline gap="related">
          <JBadge variant="soft" tone="success">Range · Mon start</JBadge>
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted); font-variant-numeric: tabular-nums">
            {{ inlineRange?.start ?? '…' }} → {{ inlineRange?.end ?? '…' }}
          </span>
        </JInline>
        <JCalendar v-model="inlineRange" mode="range" :week-starts-on="1" tone="success" />
      </JStack>

      <JStack gap="related">
        <JInline gap="related">
          <JBadge variant="soft" tone="info">Notebook Activity Dots</JBadge>
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted); font-variant-numeric: tabular-nums">
            {{ notebookDate ?? 'None' }}
          </span>
        </JInline>
        <JCalendar v-model="notebookDate" :markers="notebookMarkers" />
      </JStack>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Bounds, Sizes & States"
    description="Min/max date constraints, sm · md · lg control heights, invalid field ring, and disabled state."
  >
    <JInline gap="group" wrap style="width: 100%; align-items: flex-start">
      <JStack gap="field" style="width: 280px">
        <JField label="Bounded window (Nov 10 – Nov 22, 2026)" hint="Dates outside range are disabled">
          <JDatePicker v-model="boundedDate" min="2026-11-10" max="2026-11-22" />
        </JField>
        <JField label="Required deadline" :invalid="!sizeDates.invalid" error="Please pick a deadline date.">
          <JDatePicker v-model="sizeDates.invalid" :invalid="!sizeDates.invalid" placeholder="Missing deadline" />
        </JField>
      </JStack>

      <JStack gap="item" style="width: 280px">
        <JDatePicker v-model="sizeDates.sm" size="sm" aria-label="Small date picker" />
        <JDatePicker v-model="sizeDates.md" aria-label="Medium date picker" />
        <JDatePicker v-model="sizeDates.lg" size="lg" aria-label="Large date picker" />
        <JDatePicker model-value="2026-11-30" disabled aria-label="Disabled date picker" />
      </JStack>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Plain HTML"
    description="initDatePickers() hydrates both standalone .j-calendar grids and anchored .j-date-picker triggers."
  >
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
