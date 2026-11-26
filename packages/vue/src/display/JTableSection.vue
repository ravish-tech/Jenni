<script setup lang="ts">
import {
  cloneVNode,
  computed,
  defineComponent,
  Fragment,
  h,
  inject,
  isVNode,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  type InjectionKey,
  type VNode,
} from 'vue';

export interface JTableSectionProps {
  id: string;
  title?: string;
  colspan?: number;
  count?: number | string;
  defaultExpanded?: boolean;
  disabled?: boolean;
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

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<JTableSectionProps>(), {
  defaultExpanded: undefined,
  disabled: false,
});

const emit = defineEmits<{ toggle: [expanded: boolean] }>();
const slots = useSlots();

const ctx = inject(TABLE_SECTIONS_KEY, null);
const localExpanded = ref(props.defaultExpanded ?? true);
const rowEl = ref<HTMLTableRowElement | null>(null);
const detectedColspan = ref<number | undefined>(undefined);

if (ctx) {
  ctx.registerSection(props.id, props.defaultExpanded);
}

const expanded = computed(() =>
  ctx ? ctx.isSectionExpanded(props.id) : localExpanded.value,
);

const effectiveColspan = computed(() => props.colspan ?? detectedColspan.value ?? 99);

function toggle() {
  if (props.disabled) return;
  const next = !expanded.value;
  if (ctx) {
    ctx.toggleSection(props.id, next);
  } else {
    localExpanded.value = next;
  }
  emit('toggle', next);
}

function decorateRows(nodes: VNode[], isHidden: boolean, sectionId: string): VNode[] {
  return nodes.map((node) => {
    if (!isVNode(node)) return node;
    if (node.type === Fragment && Array.isArray(node.children)) {
      return h(
        Fragment,
        node.props,
        decorateRows(node.children as VNode[], isHidden, sectionId),
      );
    }
    if (typeof node.type === 'string' && node.type.toLowerCase() === 'tr') {
      const explicitHidden = Boolean(
        node.props && (node.props.hidden === '' || node.props.hidden === true),
      );
      return cloneVNode(node, {
        'data-section-parent': sectionId,
        hidden: isHidden || explicitHidden ? true : undefined,
      });
    }
    return node;
  });
}

const SectionRows = defineComponent({
  name: 'JTableSectionRows',
  setup() {
    return () => {
      const raw = slots.default?.() ?? [];
      return decorateRows(raw, !expanded.value, props.id);
    };
  },
});

onMounted(() => {
  if (props.colspan == null && rowEl.value) {
    const headCells = rowEl.value.closest('table')?.tHead?.rows[0]?.cells.length;
    if (headCells && headCells > 0) {
      detectedColspan.value = headCells;
    }
  }
});

onBeforeUnmount(() => {
  ctx?.unregisterSection(props.id);
});
</script>

<template>
  <tr
    ref="rowEl"
    v-bind="$attrs"
    class="j-table__section-row"
    :data-section-id="id"
    :data-expanded="expanded ? '' : undefined"
  >
    <th :colspan="effectiveColspan" class="j-table__section-cell">
      <div class="j-table__section-bar">
        <button
          type="button"
          class="j-table__section-btn"
          :aria-expanded="expanded ? 'true' : 'false'"
          :disabled="disabled || undefined"
          @click="toggle"
        >
          <svg
            class="j-table__section-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            shape-rendering="geometricPrecision"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span class="j-table__section-title">
            <slot name="title">{{ title }}</slot>
          </span>
          <span v-if="count !== undefined && count !== null" class="j-table__section-count">
            {{ count }}
          </span>
        </button>
        <div v-if="$slots.actions" class="j-table__section-actions">
          <slot name="actions" :expanded="expanded" :toggle="toggle" />
        </div>
      </div>
    </th>
  </tr>
  <SectionRows />
</template>
