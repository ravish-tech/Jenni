<script lang="ts">
declare module 'jenni-core/behaviors/table.js' {
  export function bindTableRovingFocus(table: HTMLTableElement): () => void;
  export function createCollapsibleTable(
    root: HTMLElement,
    hooks?: { onToggle?: () => void },
  ): () => void;
  export function initCollapsibleTables(root?: ParentNode): () => void;
}
</script>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  type InjectionKey,
} from 'vue';
import { bindTableRovingFocus } from 'jenni-core/behaviors/table.js';
import type { JTableProps } from './types';

export interface JTableHandle {
  expandAll: () => void;
  collapseAll: () => void;
  toggleSection: (id: string, force?: boolean) => void;
  isSectionExpanded: (id: string) => boolean;
}

interface TableSectionsContext {
  isSectionExpanded: (id: string) => boolean;
  toggleSection: (id: string, force?: boolean) => void;
  registerSection: (id: string, defaultExpanded?: boolean) => void;
  unregisterSection: (id: string) => void;
}

const TABLE_SECTIONS_KEY = Symbol.for(
  'jenni:table-sections',
) as InjectionKey<TableSectionsContext>;

const props = withDefaults(
  defineProps<
    JTableProps & {
      expandedSections?: string[];
      defaultExpandedSections?: string[];
    }
  >(),
  {
    variant: 'surface',
    size: 'md',
    hover: false,
    stickyHeader: false,
    pinFirst: false,
    pinLast: false,
  },
);

const emit = defineEmits<{
  'update:expandedSections': [expandedSections: string[]];
}>();

const tableEl = ref<HTMLTableElement | null>(null);
const internalExpanded = ref<string[]>(
  props.defaultExpandedSections ? [...props.defaultExpandedSections] : [],
);
const registeredIds = ref<string[]>([]);
const seededIds = new Set<string>();
let stopRoving: (() => void) | null = null;

const activeExpanded = computed(() =>
  props.expandedSections !== undefined ? props.expandedSections : internalExpanded.value,
);

const activeExpandedSet = computed(() => new Set(activeExpanded.value));

function setExpanded(next: string[]) {
  if (props.expandedSections === undefined) {
    internalExpanded.value = next;
  }
  emit('update:expandedSections', next);
}

function isSectionExpanded(id: string): boolean {
  return activeExpandedSet.value.has(id);
}

function toggleSection(id: string, force?: boolean) {
  const current = new Set(activeExpanded.value);
  const shouldOpen = force !== undefined ? force : !current.has(id);
  if (shouldOpen) {
    current.add(id);
  } else {
    current.delete(id);
  }
  setExpanded(Array.from(current));
}

function collectAllSectionIds(): string[] {
  const ordered = [...registeredIds.value];
  if (tableEl.value) {
    tableEl.value.querySelectorAll('tr.j-table__section-row[data-section-id]').forEach((el) => {
      const sid = (el as HTMLElement).dataset.sectionId;
      if (sid && !ordered.includes(sid)) ordered.push(sid);
    });
  }
  return ordered;
}

function expandAll() {
  setExpanded(collectAllSectionIds());
}

function collapseAll() {
  setExpanded([]);
}

function registerSection(id: string, sectionDefaultExpanded?: boolean) {
  if (!registeredIds.value.includes(id)) {
    registeredIds.value = [...registeredIds.value, id];
  }
  if (!seededIds.has(id)) {
    seededIds.add(id);
    if (props.expandedSections === undefined && props.defaultExpandedSections === undefined) {
      if ((sectionDefaultExpanded ?? true) && !internalExpanded.value.includes(id)) {
        internalExpanded.value = [...internalExpanded.value, id];
      }
    }
  }
}

function unregisterSection(id: string) {
  registeredIds.value = registeredIds.value.filter((k) => k !== id);
  seededIds.delete(id);
}

provide(TABLE_SECTIONS_KEY, {
  isSectionExpanded,
  toggleSection,
  registerSection,
  unregisterSection,
});

const wrapStyle = computed(() => {
  if (props.maxHeight == null) return undefined;
  const val = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
  return { '--j-table-max-height': val };
});

onMounted(() => {
  if (tableEl.value) {
    stopRoving = bindTableRovingFocus(tableEl.value);
  }
});

onBeforeUnmount(() => {
  stopRoving?.();
  stopRoving = null;
});

defineExpose<JTableHandle>({
  expandAll,
  collapseAll,
  toggleSection,
  isSectionExpanded,
});
</script>

<template>
  <div
    class="j-table-wrap"
    :data-variant="variant === 'surface' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-hover="hover ? '' : undefined"
    :data-sticky-header="stickyHeader ? '' : undefined"
    :style="wrapStyle"
  >
    <table
      ref="tableEl"
      class="j-table"
      :data-j-managed="
        registeredIds.length > 0 || expandedSections !== undefined ? '' : undefined
      "
      :data-pin-first="pinFirst ? '' : undefined"
      :data-pin-last="pinLast ? '' : undefined"
    >
      <caption v-if="caption || $slots.caption">
        <slot name="caption">{{ caption }}</slot>
      </caption>
      <slot />
    </table>
  </div>
</template>
