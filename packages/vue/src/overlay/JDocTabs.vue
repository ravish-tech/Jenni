<script setup lang="ts">
/// <reference path="./core.d.ts" />
/// <reference path="./doc-tabs-core.d.ts" />
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useSlots,
  watch,
} from 'vue';
import {
  createDocTabs,
  getDocTabElements,
  type DocTabsController,
  type DocTabsOverflowState,
} from 'jenni-core/behaviors/doc-tabs.js';
import { createMenu } from 'jenni-core/behaviors/menu.js';
import JIcon from '../display/JIcon.vue';

export type DocTabsVariant = 'workbench' | 'island' | 'minimal';
export type DocTabsSize = 'sm' | 'md';

export interface DocTabItem {
  id: string;
  label: string;
  icon?: string;
  dirty?: boolean;
  pinned?: boolean;
  closable?: boolean;
  disabled?: boolean;
  badge?: string | number;
  tooltip?: string;
  meta?: unknown;
}

export interface JDocTabsProps {
  tabs: DocTabItem[];
  defaultValue?: string;
  variant?: DocTabsVariant;
  size?: DocTabsSize;
  closable?: boolean;
  closablePinned?: boolean;
  addable?: boolean;
  reorderable?: boolean;
  middleClickClose?: boolean;
  showOverflowMenu?: boolean;
  /** Suppress the automatic trailing dirty dot and `×` close button when rendering custom `#tab` content. */
  hideTabTail?: boolean;
  ariaLabel?: string;
  addLabel?: string;
  overflowLabel?: string;
}

export interface DocTabRenderState {
  tab: DocTabItem;
  active: boolean;
  index: number;
  closable: boolean;
  close: (event?: MouseEvent) => void;
}

export interface JDocTabsHandle {
  scrollToTab: (id: string, instant?: boolean) => void;
  focusActiveTab: () => void;
  scrollActiveIntoView: (instant?: boolean) => void;
  sync: () => void;
  readonly el: HTMLDivElement | null;
}

const model = defineModel<string>();

const props = withDefaults(defineProps<JDocTabsProps>(), {
  variant: 'workbench',
  size: 'md',
  closable: true,
  closablePinned: false,
  addable: false,
  reorderable: false,
  middleClickClose: true,
  showOverflowMenu: true,
  hideTabTail: false,
  ariaLabel: 'Open documents',
  addLabel: 'New tab',
  overflowLabel: 'More tabs',
});

const emit = defineEmits<{
  'update:tabs': [tabs: DocTabItem[]];
  change: [id: string];
  close: [id: string, tab: DocTabItem];
  add: [];
  reorder: [nextTabs: DocTabItem[], fromIndex: number, toIndex: number];
  tabContextmenu: [tab: DocTabItem, event: MouseEvent];
}>();

const slots = useSlots();
const instance = getCurrentInstance();
const baseId = useId();
const overflowMenuId = `${baseId}-overflow`;

const rootRef = ref<HTMLDivElement | null>(null);
const overflowBtnRef = ref<HTMLButtonElement | null>(null);
const overflowMenuRef = ref<HTMLElement | null>(null);

const overflowState = ref<DocTabsOverflowState>({
  hasOverflow: false,
  overflowStart: false,
  overflowEnd: false,
  hiddenCount: 0,
});

let ctrl: DocTabsController | null = null;
let stopOverflowMenu: (() => void) | null = null;

if (model.value === undefined) {
  const initial = props.defaultValue ?? props.tabs.find((t) => !t.disabled)?.id;
  if (initial !== undefined) {
    model.value = initial;
  }
}

const activeId = computed(() => model.value);

const firstFocusableId = computed(() => {
  const active = props.tabs.find((t) => t.id === activeId.value && !t.disabled);
  if (active) return active.id;
  return props.tabs.find((t) => !t.disabled)?.id;
});

const showOverflowTrigger = computed(
  () => props.showOverflowMenu && overflowState.value.hasOverflow && props.tabs.length > 0,
);

const showActionsCluster = computed(
  () => props.addable || showOverflowTrigger.value || Boolean(slots.actions),
);

function isTabClosable(tab: DocTabItem): boolean {
  if (tab.disabled) return false;
  if (tab.pinned) {
    return Boolean(props.closablePinned && tab.closable !== false);
  }
  return tab.closable ?? props.closable;
}

function hasUpdateTabsListener(): boolean {
  const vnodeProps = instance?.vnode.props;
  return Boolean(vnodeProps && ('onUpdate:tabs' in vnodeProps || 'onUpdateTabs' in vnodeProps));
}

function selectTabById(id: string) {
  const tab = props.tabs.find((t) => t.id === id);
  if (!tab || tab.disabled) return;
  if (model.value !== id) {
    model.value = id;
    emit('change', id);
  }
}

function handleTabClick(tab: DocTabItem) {
  if (tab.disabled) return;
  selectTabById(tab.id);
}

function handleTabClose(tab: DocTabItem, event?: MouseEvent) {
  event?.stopPropagation();
  if (!isTabClosable(tab)) return;
  const closedIndex = props.tabs.findIndex((t) => t.id === tab.id);
  emit('close', tab.id, tab);

  if (hasUpdateTabsListener() && closedIndex !== -1) {
    const nextTabs = props.tabs.filter((t) => t.id !== tab.id);
    emit('update:tabs', nextTabs);
    if (model.value === tab.id) {
      const nextCandidate =
        nextTabs.slice(closedIndex).find((t) => !t.disabled) ??
        [...nextTabs.slice(0, closedIndex)].reverse().find((t) => !t.disabled);
      if (nextCandidate) {
        model.value = nextCandidate.id;
        emit('change', nextCandidate.id);
      }
    }
  }
}

function handleCloseById(id: string) {
  const tab = props.tabs.find((t) => t.id === id);
  if (tab) handleTabClose(tab);
}

function handleReorder(fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= props.tabs.length ||
    toIndex >= props.tabs.length ||
    fromIndex === toIndex
  ) {
    return;
  }
  const nextTabs = [...props.tabs];
  const [moved] = nextTabs.splice(fromIndex, 1);
  if (!moved) return;
  nextTabs.splice(toIndex, 0, moved);
  emit('update:tabs', nextTabs);
  emit('reorder', nextTabs, fromIndex, toIndex);
}

function handleContextMenu(tab: DocTabItem, event: MouseEvent) {
  emit('tabContextmenu', tab, event);
}

function handleOverflowPick(tab: DocTabItem) {
  if (tab.disabled) return;
  selectTabById(tab.id);
  if (overflowMenuRef.value?.matches(':popover-open')) {
    try {
      overflowMenuRef.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
  nextTick(() => ctrl?.scrollActiveIntoView());
}

function setupDocTabs() {
  ctrl?.destroy();
  ctrl = null;
  if (!rootRef.value) return;
  ctrl = createDocTabs(rootRef.value, {
    reorderable: props.reorderable,
    middleClickClose: props.middleClickClose,
    onSelect: (id) => selectTabById(id),
    onClose: (id) => handleCloseById(id),
    onReorder: (from, to) => handleReorder(from, to),
    onOverflowChange: (next) => {
      overflowState.value = next;
    },
  });
}

function setupOverflowMenu() {
  stopOverflowMenu?.();
  stopOverflowMenu = null;
  if (showOverflowTrigger.value && overflowBtnRef.value && overflowMenuRef.value) {
    stopOverflowMenu = createMenu(overflowBtnRef.value, overflowMenuRef.value, {
      side: 'bottom',
      loop: true,
      manageChecked: false,
    });
  }
}

onMounted(() => {
  setupDocTabs();
  setupOverflowMenu();
});

watch(
  () => [props.reorderable, props.middleClickClose],
  () => setupDocTabs(),
  { flush: 'post' },
);

watch(
  () => props.tabs.length,
  () => {
    nextTick(() => ctrl?.sync());
  },
);

watch(activeId, () => {
  nextTick(() => ctrl?.scrollActiveIntoView());
});

watch(
  showOverflowTrigger,
  () => {
    nextTick(() => setupOverflowMenu());
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  stopOverflowMenu?.();
  ctrl?.destroy();
});

function scrollToTab(id: string, instant = false) {
  const scroller = rootRef.value?.querySelector<HTMLElement>(
    ':scope > .j-doc-tabs__scroller, :scope > [role="tablist"]',
  );
  if (!scroller) return;
  const target = getDocTabElements(scroller).find((t) => t.dataset.tabId === id);
  if (!target) return;
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: instant || reduced ? 'auto' : 'smooth',
  });
  ctrl?.sync();
}

function focusActiveTab() {
  const scroller = rootRef.value?.querySelector<HTMLElement>(
    ':scope > .j-doc-tabs__scroller, :scope > [role="tablist"]',
  );
  if (!scroller) return;
  const tabEls = getDocTabElements(scroller);
  const target =
    tabEls.find(
      (t) => t.getAttribute('aria-selected') === 'true' || t.hasAttribute('data-active'),
    ) ?? tabEls.find((t) => t.getAttribute('aria-disabled') !== 'true');
  target?.focus();
  ctrl?.scrollActiveIntoView();
}

defineExpose({
  scrollToTab,
  focusActiveTab,
  scrollActiveIntoView: (instant?: boolean) => ctrl?.scrollActiveIntoView(instant),
  sync: () => ctrl?.sync(),
  el: rootRef,
});
</script>

<template>
  <div
    ref="rootRef"
    class="j-doc-tabs"
    :data-variant="variant === 'workbench' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-reorderable="reorderable ? '' : undefined"
  >
    <div
      class="j-doc-tabs__scroller"
      role="tablist"
      aria-orientation="horizontal"
      :aria-label="ariaLabel"
    >
      <template v-if="tabs.length > 0">
        <div
          v-for="(tab, index) in tabs"
          :id="`${baseId}-tab-${tab.id}`"
          :key="tab.id"
          class="j-doc-tabs__tab"
          role="tab"
          :tabindex="tab.id === firstFocusableId ? 0 : -1"
          :aria-selected="tab.id === activeId ? 'true' : 'false'"
          :aria-disabled="tab.disabled ? 'true' : undefined"
          :aria-keyshortcuts="isTabClosable(tab) ? 'Delete' : undefined"
          :data-tab-id="tab.id"
          :data-active="tab.id === activeId ? '' : undefined"
          :data-pinned="tab.pinned ? '' : undefined"
          :data-dirty="tab.dirty ? '' : undefined"
          :data-closable="isTabClosable(tab) ? 'true' : 'false'"
          :draggable="reorderable && !tab.disabled ? 'true' : undefined"
          :title="tab.tooltip ?? tab.label"
          @click="handleTabClick(tab)"
          @contextmenu="handleContextMenu(tab, $event)"
        >
          <slot
            name="tab"
            :tab="tab"
            :active="tab.id === activeId"
            :index="index"
            :closable="isTabClosable(tab)"
            :close="(e?: MouseEvent) => handleTabClose(tab, e)"
          >
            <span v-if="tab.pinned" class="j-doc-tabs__pin" aria-hidden="true">
              <JIcon name="pin" size="xs" />
            </span>

            <span v-if="tab.icon || slots.icon" class="j-doc-tabs__icon" aria-hidden="true">
              <slot name="icon" :tab="tab">
                <JIcon v-if="tab.icon" :name="tab.icon" size="sm" />
              </slot>
            </span>

            <span class="j-doc-tabs__label">
              <slot name="label" :tab="tab" :active="tab.id === activeId" :index="index">
                {{ tab.label }}
              </slot>
            </span>

            <span v-if="tab.badge != null" class="j-doc-tabs__badge">{{ tab.badge }}</span>
          </slot>

          <span v-if="!hideTabTail && (tab.dirty || isTabClosable(tab))" class="j-doc-tabs__tail">
            <span v-if="tab.dirty" class="j-doc-tabs__dirty" aria-hidden="true" />
            <button
              v-if="isTabClosable(tab)"
              type="button"
              tabindex="-1"
              class="j-doc-tabs__close"
              :aria-label="`Close ${tab.label}`"
              @click.stop="handleTabClose(tab, $event)"
            >
              <JIcon name="x" size="xs" />
            </button>
          </span>
        </div>
      </template>

      <div v-else-if="slots.empty" class="j-doc-tabs__empty">
        <slot name="empty" />
      </div>
    </div>

    <div v-if="showActionsCluster" class="j-doc-tabs__actions">
      <button
        v-if="addable"
        type="button"
        class="j-doc-tabs__add"
        :aria-label="addLabel"
        :title="addLabel"
        @click="emit('add')"
      >
        <JIcon name="plus" size="sm" />
      </button>

      <template v-if="showOverflowTrigger">
        <button
          ref="overflowBtnRef"
          type="button"
          class="j-doc-tabs__overflow-btn"
          :aria-label="overflowLabel"
          :title="overflowLabel"
        >
          <JIcon name="chevron-down" size="sm" />
          <span v-if="overflowState.hiddenCount > 0" class="j-doc-tabs__overflow-count">
            {{ overflowState.hiddenCount }}
          </span>
        </button>

        <div
          :id="overflowMenuId"
          ref="overflowMenuRef"
          class="j-menu"
          popover="auto"
          role="menu"
          data-align="end"
        >
          <button
            v-for="tab in tabs"
            :key="`ov-${tab.id}`"
            type="button"
            class="j-menu__item"
            role="menuitemradio"
            :aria-checked="tab.id === activeId ? 'true' : 'false'"
            :disabled="tab.disabled ? true : undefined"
            :aria-disabled="tab.disabled ? 'true' : undefined"
            @click="handleOverflowPick(tab)"
          >
            <JIcon v-if="tab.icon" :name="tab.icon" size="sm" class="j-menu__icon" />
            <span>{{ tab.label }}</span>
            <span v-if="tab.dirty" class="j-doc-tabs__dirty" aria-hidden="true" />
          </button>
        </div>
      </template>

      <slot name="actions" />
    </div>
  </div>
</template>
