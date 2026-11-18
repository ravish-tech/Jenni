<script setup lang="ts" generic="T extends object = Record<string, any>">
import { computed, ref, watch } from 'vue';
import JPagination from './JPagination.vue';
import type { JDataTableColumn, JDataTableProps, JTableSortDirection } from './types';

const props = withDefaults(defineProps<JDataTableProps<T>>(), {
  rowKey: 'id',
  selectable: false,
  searchable: false,
  searchPlaceholder: 'Filter rows…',
  variant: 'surface',
  size: 'md',
  hover: true,
  stickyHeader: false,
  pinFirst: false,
  pinLast: false,
  emptyTitle: 'No matching records',
  emptyDescription: 'Adjust your search or clear active filters.',
});

const selectedModel = defineModel<(string | number)[]>('selected');
const sortByModel = defineModel<string | undefined>('sortBy');
const sortDirModel = defineModel<JTableSortDirection>('sortDir', { default: 'asc' });
const searchModel = defineModel<string>('search', { default: '' });
const pageModel = defineModel<number>('page', { default: 1 });

const internalSelected = ref<(string | number)[]>([]);
const internalSortBy = ref<string | undefined>(undefined);
const internalSortDir = ref<JTableSortDirection>('asc');
const internalSearch = ref('');
const internalPage = ref(1);

const selectedKeys = computed(() => selectedModel.value ?? internalSelected.value);
const selectedSet = computed(() => new Set<string | number>(selectedKeys.value));
const activeSortBy = computed(() =>
  sortByModel.value !== undefined ? sortByModel.value : internalSortBy.value,
);
const activeSortDir = computed(() => sortDirModel.value ?? internalSortDir.value);
const activeSearch = computed(() => searchModel.value || internalSearch.value);

function getKey(row: T, index: number): string | number {
  if (typeof props.rowKey === 'function') return props.rowKey(row, index);
  const val = (row as Record<string, unknown>)[props.rowKey];
  return typeof val === 'string' || typeof val === 'number' ? val : index;
}

function getCellValue(row: T, col: JDataTableColumn<T>): unknown {
  return (row as Record<string, unknown>)[col.key];
}

function formatCell(row: T, col: JDataTableColumn<T>, index: number): string {
  const raw = getCellValue(row, col);
  if (col.format) return col.format(raw, row, index);
  return raw == null ? '' : String(raw);
}

const filteredRows = computed(() => {
  const q = activeSearch.value.trim().toLowerCase();
  if (!q) return props.rows;
  return props.rows.filter((row, idx) =>
    props.columns.some((col) => formatCell(row, col, idx).toLowerCase().includes(q)),
  );
});

const sortedRows = computed(() => {
  const key = activeSortBy.value;
  if (!key) return filteredRows.value;
  const col = props.columns.find((c) => c.key === key);
  if (!col) return filteredRows.value;
  const dir = activeSortDir.value === 'asc' ? 1 : -1;

  return [...filteredRows.value].sort((a, b) => {
    const va = getCellValue(a, col);
    const vb = getCellValue(b, col);
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true }) * dir;
  });
});

const pageCount = computed(() => {
  if (!props.pageSize || props.pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize));
});

const currentPage = computed(() => {
  const raw = pageModel.value ?? internalPage.value;
  return Math.min(Math.max(1, raw), pageCount.value);
});

watch(activeSearch, () => {
  internalPage.value = 1;
  pageModel.value = 1;
});

const pagedRows = computed(() => {
  if (!props.pageSize || props.pageSize <= 0) return sortedRows.value;
  const start = (currentPage.value - 1) * props.pageSize;
  return sortedRows.value.slice(start, start + props.pageSize);
});

const pagedKeys = computed(() =>
  pagedRows.value.map((row, idx) => {
    const baseIdx = props.pageSize && props.pageSize > 0 ? (currentPage.value - 1) * props.pageSize + idx : idx;
    return getKey(row, baseIdx);
  }),
);

const allPageSelected = computed(
  () => pagedKeys.value.length > 0 && pagedKeys.value.every((k) => selectedSet.value.has(k)),
);

const somePageSelected = computed(
  () => !allPageSelected.value && pagedKeys.value.some((k) => selectedSet.value.has(k)),
);

function updateSelected(next: (string | number)[]) {
  internalSelected.value = next;
  selectedModel.value = next;
}

function toggleSelectAll() {
  const current = new Set(selectedKeys.value);
  if (allPageSelected.value) {
    pagedKeys.value.forEach((k) => current.delete(k));
  } else {
    pagedKeys.value.forEach((k) => current.add(k));
  }
  updateSelected(Array.from(current));
}

function toggleRow(key: string | number) {
  const current = new Set(selectedKeys.value);
  if (current.has(key)) current.delete(key);
  else current.add(key);
  updateSelected(Array.from(current));
}

function toggleSort(col: JDataTableColumn<T>) {
  if (!col.sortable) return;
  if (activeSortBy.value === col.key) {
    const nextDir: JTableSortDirection = activeSortDir.value === 'asc' ? 'desc' : 'asc';
    internalSortDir.value = nextDir;
    sortDirModel.value = nextDir;
  } else {
    internalSortBy.value = col.key;
    sortByModel.value = col.key;
    internalSortDir.value = 'asc';
    sortDirModel.value = 'asc';
  }
}

function onSearchInput(event: Event) {
  const val = (event.target as HTMLInputElement).value;
  internalSearch.value = val;
  searchModel.value = val;
}

function setPage(next: number) {
  internalPage.value = next;
  pageModel.value = next;
}

function colStyle(col: JDataTableColumn<T>) {
  if (col.width == null) return undefined;
  const w = typeof col.width === 'number' ? `${col.width}px` : col.width;
  return { width: w };
}

const wrapStyle = computed(() => {
  if (props.maxHeight == null) return undefined;
  const val = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
  return { '--j-table-max-height': val };
});

const totalColSpan = computed(() => props.columns.length + (props.selectable ? 1 : 0));

const rangeText = computed(() => {
  const total = sortedRows.value.length;
  if (total === 0) return '0 results';
  if (!props.pageSize || props.pageSize <= 0) return `${total} ${total === 1 ? 'row' : 'rows'}`;
  const start = (currentPage.value - 1) * props.pageSize + 1;
  const end = Math.min(total, currentPage.value * props.pageSize);
  return `${start}–${end} of ${total}`;
});
</script>

<template>
  <div
    class="j-data-table"
    data-j-managed=""
    :data-variant="variant === 'surface' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-hover="hover ? '' : undefined"
  >
    <div v-if="searchable || $slots.toolbar || $slots.actions" class="j-data-table__toolbar">
      <slot name="toolbar">
        <label v-if="searchable" class="j-data-table__search">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <input
            type="search"
            :value="activeSearch"
            :placeholder="searchPlaceholder"
            aria-label="Filter table rows"
            @input="onSearchInput"
          />
        </label>
        <div v-if="$slots.actions || selectedKeys.length > 0" class="j-data-table__actions">
          <span v-if="selectable && selectedKeys.length > 0" class="j-data-table__meta">
            <strong>{{ selectedKeys.length }}</strong> selected
          </span>
          <slot name="actions" :selected="selectedKeys" />
        </div>
      </slot>
    </div>

    <div
      class="j-table-wrap"
      :data-variant="variant === 'surface' ? undefined : variant"
      :data-size="size === 'md' ? undefined : size"
      :data-hover="hover ? '' : undefined"
      :data-sticky-header="stickyHeader ? '' : undefined"
      :style="wrapStyle"
    >
      <table
        class="j-table"
        :data-pin-first="pinFirst ? '' : undefined"
        :data-pin-last="pinLast ? '' : undefined"
      >
        <caption v-if="caption">{{ caption }}</caption>
        <thead>
          <tr>
            <th
              v-if="selectable"
              scope="col"
              class="j-table__check"
              :data-pin="pinFirst ? 'start' : undefined"
            >
              <input
                type="checkbox"
                class="j-checkbox"
                data-size="sm"
                aria-label="Select all rows"
                :checked="allPageSelected"
                :indeterminate.prop="somePageSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :style="colStyle(col)"
              :data-align="col.align ?? (col.numeric ? 'end' : undefined)"
              :data-pin="col.pin"
              :aria-sort="
                col.sortable
                  ? activeSortBy === col.key
                    ? activeSortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined
              "
            >
              <button
                v-if="col.sortable"
                type="button"
                class="j-table__sort"
                @click="toggleSort(col)"
              >
                <span>
                  <slot :name="`header-${col.key}`" :column="col">{{ col.label }}</slot>
                </span>
                <span class="j-table__sort-icon" aria-hidden="true" />
              </button>
              <slot v-else :name="`header-${col.key}`" :column="col">{{ col.label }}</slot>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedRows.length === 0" data-empty="">
            <td :colspan="totalColSpan" class="j-table__empty">
              <slot name="empty">
                <span class="j-table__empty-title">{{ emptyTitle }}</span>
                <span class="j-table__empty-desc">{{ emptyDescription }}</span>
              </slot>
            </td>
          </tr>
          <tr
            v-for="(row, rIdx) in pagedRows"
            :key="pagedKeys[rIdx]"
            :data-selected="selectable && selectedSet.has(pagedKeys[rIdx]) ? '' : undefined"
            :aria-selected="selectable ? (selectedSet.has(pagedKeys[rIdx]) ? 'true' : 'false') : undefined"
          >
            <td
              v-if="selectable"
              class="j-table__check"
              :data-pin="pinFirst ? 'start' : undefined"
            >
              <input
                type="checkbox"
                class="j-checkbox"
                data-size="sm"
                :aria-label="`Select row ${rIdx + 1}`"
                :checked="selectedSet.has(pagedKeys[rIdx])"
                @change="toggleRow(pagedKeys[rIdx])"
              />
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              :data-align="col.align ?? (col.numeric ? 'end' : undefined)"
              :data-numeric="col.numeric ? '' : undefined"
              :data-pin="col.pin"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :value="getCellValue(row, col)"
                :column="col"
                :index="rIdx"
              >
                {{ formatCell(row, col, rIdx) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="(pageSize && pageSize > 0) || $slots.footer"
      class="j-data-table__footer"
    >
      <slot name="footer" :page="currentPage" :page-count="pageCount" :total="sortedRows.length">
        <span class="j-data-table__meta">
          {{ rangeText }}
          <template v-if="selectable && selectedKeys.length > 0">
            · <strong>{{ selectedKeys.length }}</strong> selected
          </template>
        </span>
        <JPagination
          v-if="pageSize && pageSize > 0 && pageCount > 1"
          :model-value="currentPage"
          size="sm"
          :total-pages="pageCount"
          @update:model-value="(val) => val != null && setPage(val)"
        />
      </slot>
    </div>
  </div>
</template>
