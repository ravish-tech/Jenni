<script setup lang="ts">
/// <reference path="./core.d.ts" />
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
  createTabStrip,
  type TabStripController,
  type TabStripDetachDetail,
  type TabStripReorderDetail,
  type TabStripScrollState,
} from 'jenni-core/behaviors/tab-strip.js';
import { createContextMenu, type ContextMenuController } from 'jenni-core/behaviors/context-menu.js';
import { createPopover } from 'jenni-core/behaviors/popover.js';
import JIcon from '../display/JIcon.vue';

export type TabStripSize = 'sm' | 'md';
export type TabStripIndicatorTone =
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export interface TabStripItem {
  id: string;
  title: string;
  label?: string;
  icon?: string;
  closable?: boolean;
  pinned?: boolean;
  preview?: boolean;
  dirty?: boolean;
  loading?: boolean;
  indicator?: boolean | 'accent' | 'success' | 'warning' | 'danger' | 'info' | string;
  description?: string;
  disabled?: boolean;
}

export interface JTabStripProps {
  tabs: TabStripItem[];
  active?: string;
  modelValue?: string;
  defaultActive?: string;
  defaultValue?: string;
  size?: TabStripSize;
  closable?: boolean;
  closablePinned?: boolean;
  addable?: boolean;
  draggable?: boolean;
  detachable?: boolean;
  search?: boolean;
  titlebar?: boolean;
  contextMenu?: boolean;
  middleClickClose?: boolean;
  previewDelay?: number;
  ariaLabel?: string;
  newTabLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
}

export interface JTabStripHandle {
  scrollToTab: (id: string, instant?: boolean) => void;
  focusActiveTab: () => void;
  scrollActiveIntoView: (instant?: boolean) => void;
  closeContextMenu: () => void;
  closeSearch: () => void;
  sync: () => void;
  readonly el: HTMLDivElement | null;
}

const INDICATOR_TONES = new Set<string>([
  'accent',
  'success',
  'warning',
  'danger',
  'info',
  'neutral',
]);

const props = withDefaults(defineProps<JTabStripProps>(), {
  size: 'md',
  closable: true,
  closablePinned: false,
  addable: true,
  draggable: false,
  detachable: false,
  search: false,
  titlebar: false,
  contextMenu: true,
  middleClickClose: true,
  previewDelay: 380,
  ariaLabel: 'Open tabs',
  newTabLabel: 'New tab',
  searchLabel: 'Search tabs',
  searchPlaceholder: 'Search open tabs…',
});

const emit = defineEmits<{
  'update:active': [id: string];
  'update:modelValue': [id: string];
  'update:tabs': [tabs: TabStripItem[]];
  change: [id: string];
  close: [id: string];
  closeOthers: [id: string];
  closeRight: [id: string];
  dblclick: [id: string];
  reorder: [detail: TabStripReorderDetail];
  detach: [detail: TabStripDetachDetail];
  new: [afterId?: string];
}>();

const slots = useSlots();
const instance = getCurrentInstance();
const baseId = useId();
const searchPanelId = `${baseId}-search`;
const ctxMenuId = `${baseId}-ctx`;

const rootRef = ref<HTMLDivElement | null>(null);
const searchBtnRef = ref<HTMLButtonElement | null>(null);
const searchPanelRef = ref<HTMLDivElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchListRef = ref<HTMLDivElement | null>(null);
const ctxMenuRef = ref<HTMLDivElement | null>(null);

const internalActive = ref<string>(
  props.active ??
    props.modelValue ??
    props.defaultActive ??
    props.defaultValue ??
    props.tabs.find((t) => !t.disabled)?.id ??
    '',
);

watch(
  () => props.active,
  (val) => {
    if (val !== undefined) internalActive.value = val;
  },
);

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) internalActive.value = val;
  },
);

const activeId = computed(
  () => props.active ?? props.modelValue ?? internalActive.value,
);

const scrollState = ref<TabStripScrollState>({
  hasOverflow: false,
  canScrollStart: false,
  canScrollEnd: false,
});

const searchQuery = ref('');
const searchHighlightIndex = ref(0);
const contextTabId = ref<string | null>(null);

const contextTab = computed<TabStripItem | null>(
  () => props.tabs.find((t) => t.id === contextTabId.value) ?? null,
);

let stripCtrl: TabStripController | null = null;
let stopSearchPopover: (() => void) | null = null;
let ctxMenuCtrl: ContextMenuController | null = null;

function getTabTitle(tab: TabStripItem): string {
  return tab.title || tab.label || tab.id;
}

function resolveIndicator(
  indicator: TabStripItem['indicator'],
): { tone?: TabStripIndicatorTone; color?: string } | null {
  if (!indicator) return null;
  if (indicator === true) return { tone: 'accent' };
  if (typeof indicator === 'string') {
    if (INDICATOR_TONES.has(indicator)) {
      return { tone: indicator as TabStripIndicatorTone };
    }
    return { color: indicator };
  }
  return null;
}

function isTabClosable(tab: TabStripItem | null | undefined): boolean {
  if (!tab || tab.disabled) return false;
  if (tab.pinned) {
    return tab.closable === true || (props.closablePinned && tab.closable !== false);
  }
  return (tab.closable ?? props.closable) !== false;
}

function hasCustomIconSlot(): boolean {
  return Boolean(slots['tab-icon'] || slots.icon);
}

function shouldShowMedia(tab: TabStripItem): boolean {
  return Boolean(tab.loading || tab.icon || tab.pinned || hasCustomIconSlot());
}

function hasUpdateTabsListener(): boolean {
  const vnodeProps = instance?.vnode.props;
  return Boolean(vnodeProps && ('onUpdate:tabs' in vnodeProps || 'onUpdateTabs' in vnodeProps));
}

const firstFocusableId = computed(() => {
  const active = props.tabs.find((t) => t.id === activeId.value && !t.disabled);
  if (active) return active.id;
  return props.tabs.find((t) => !t.disabled)?.id;
});

const filteredTabs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.tabs;
  return props.tabs.filter((t) => {
    const title = getTabTitle(t).toLowerCase();
    const desc = (t.description ?? '').toLowerCase();
    return title.includes(q) || desc.includes(q);
  });
});

watch(filteredTabs, (list) => {
  if (list.length === 0) {
    searchHighlightIndex.value = -1;
    return;
  }
  if (searchHighlightIndex.value < 0 || searchHighlightIndex.value >= list.length) {
    const firstEnabled = list.findIndex((t) => !t.disabled);
    searchHighlightIndex.value = firstEnabled >= 0 ? firstEnabled : 0;
  }
});

const closableOtherTabs = computed(() => {
  const current = contextTab.value;
  if (!current) return [];
  return props.tabs.filter(
    (t) => t.id !== current.id && !t.pinned && isTabClosable(t),
  );
});

const closableRightTabs = computed(() => {
  const current = contextTab.value;
  if (!current) return [];
  const idx = props.tabs.findIndex((t) => t.id === current.id);
  if (idx < 0) return [];
  return props.tabs.slice(idx + 1).filter((t) => isTabClosable(t));
});

function selectTabById(id: string) {
  const tab = props.tabs.find((t) => t.id === id);
  if (!tab || tab.disabled) return;
  if (activeId.value !== id) {
    internalActive.value = id;
    emit('update:active', id);
    emit('update:modelValue', id);
    emit('change', id);
  }
}

function handleTabClose(tab: TabStripItem, event?: MouseEvent) {
  event?.stopPropagation();
  if (!isTabClosable(tab)) return;
  const closedIndex = props.tabs.findIndex((t) => t.id === tab.id);
  emit('close', tab.id);

  if (hasUpdateTabsListener() && closedIndex !== -1) {
    const nextTabs = props.tabs.filter((t) => t.id !== tab.id);
    emit('update:tabs', nextTabs);
    if (activeId.value === tab.id) {
      const nextCandidate =
        nextTabs.slice(closedIndex).find((t) => !t.disabled) ??
        [...nextTabs.slice(0, closedIndex)].reverse().find((t) => !t.disabled);
      if (nextCandidate) {
        selectTabById(nextCandidate.id);
      }
    }
  }
}

function handleCloseById(id: string) {
  const tab = props.tabs.find((t) => t.id === id);
  if (tab) handleTabClose(tab);
}

function handleCloseOthers(keepTab: TabStripItem) {
  const targets = props.tabs.filter(
    (t) => t.id !== keepTab.id && !t.pinned && isTabClosable(t),
  );
  for (const t of targets) {
    emit('close', t.id);
  }
  emit('closeOthers', keepTab.id);

  if (hasUpdateTabsListener() && targets.length > 0) {
    const removeIds = new Set(targets.map((t) => t.id));
    const nextTabs = props.tabs.filter((t) => !removeIds.has(t.id));
    emit('update:tabs', nextTabs);
    if (removeIds.has(activeId.value) && !keepTab.disabled) {
      selectTabById(keepTab.id);
    }
  }
  closeContextMenu();
}

function handleCloseRight(anchorTab: TabStripItem) {
  const idx = props.tabs.findIndex((t) => t.id === anchorTab.id);
  if (idx < 0) return;
  const targets = props.tabs.slice(idx + 1).filter((t) => isTabClosable(t));
  for (const t of targets) {
    emit('close', t.id);
  }
  emit('closeRight', anchorTab.id);

  if (hasUpdateTabsListener() && targets.length > 0) {
    const removeIds = new Set(targets.map((t) => t.id));
    const nextTabs = props.tabs.filter((t) => !removeIds.has(t.id));
    emit('update:tabs', nextTabs);
    if (removeIds.has(activeId.value)) {
      const candidate = !anchorTab.disabled
        ? anchorTab
        : nextTabs.find((t) => !t.disabled);
      if (candidate) selectTabById(candidate.id);
    }
  }
  closeContextMenu();
}

function handleReorder(detail: TabStripReorderDetail) {
  const { from, to } = detail;
  if (
    from < 0 ||
    to < 0 ||
    from >= props.tabs.length ||
    to >= props.tabs.length ||
    from === to
  ) {
    return;
  }
  const nextTabs = [...props.tabs];
  const [moved] = nextTabs.splice(from, 1);
  if (!moved) return;
  nextTabs.splice(to, 0, moved);
  emit('update:tabs', nextTabs);
  emit('reorder', { from, to });
}

function handleNewTab(afterId?: string) {
  emit('new', afterId);
  closeContextMenu();
}

function closeContextMenu() {
  ctxMenuCtrl?.close();
}

function closeSearch() {
  if (searchPanelRef.value?.matches(':popover-open')) {
    try {
      searchPanelRef.value.hidePopover();
    } catch {
      /* ignore */
    }
  }
}

function openTabContextMenu(
  id: string,
  tabEl: HTMLElement,
  event: MouseEvent | KeyboardEvent,
) {
  if (!props.contextMenu || !ctxMenuCtrl) return;
  event.preventDefault();
  contextTabId.value = id;

  const isKeyboard =
    event instanceof KeyboardEvent ||
    ('clientX' in event && event.clientX === 0 && event.clientY === 0);
  const clientX = 'clientX' in event ? event.clientX : 0;
  const clientY = 'clientY' in event ? event.clientY : 0;

  nextTick(() => {
    if (!ctxMenuCtrl) return;
    if (isKeyboard) {
      ctxMenuCtrl.openFor(tabEl, {
        keyboard: true,
        align: 'bottom-start',
        returnFocusTo: tabEl,
      });
    } else {
      ctxMenuCtrl.openAt(clientX, clientY, {
        keyboard: false,
        anchor: tabEl,
        returnFocusTo: tabEl,
      });
    }
  });
}

function onSearchToggle(event: Event) {
  const opened = (event as ToggleEvent).newState === 'open';
  if (!opened) return;
  searchQuery.value = '';
  const activeIdx = props.tabs.findIndex((t) => t.id === activeId.value && !t.disabled);
  const fallbackIdx = props.tabs.findIndex((t) => !t.disabled);
  searchHighlightIndex.value = activeIdx >= 0 ? activeIdx : Math.max(0, fallbackIdx);
  requestAnimationFrame(() => {
    searchInputRef.value?.focus({ preventScroll: true });
    scrollHighlightedSearchItemIntoView();
  });
}

function scrollHighlightedSearchItemIntoView() {
  const listEl = searchListRef.value;
  if (!listEl) return;
  const item = listEl.children[searchHighlightIndex.value] as HTMLElement | undefined;
  item?.scrollIntoView?.({ block: 'nearest' });
}

function stepSearchHighlight(delta: 1 | -1) {
  const list = filteredTabs.value;
  if (list.length === 0) return;
  let idx = searchHighlightIndex.value;
  for (let count = 0; count < list.length; count += 1) {
    idx = (idx + delta + list.length) % list.length;
    if (!list[idx]?.disabled) {
      searchHighlightIndex.value = idx;
      nextTick(scrollHighlightedSearchItemIntoView);
      return;
    }
  }
}

function activateSearchTab(tab: TabStripItem) {
  if (tab.disabled) return;
  selectTabById(tab.id);
  closeSearch();
  nextTick(() => stripCtrl?.scrollToTab(tab.id));
}

function onSearchKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    stepSearchHighlight(1);
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    stepSearchHighlight(-1);
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    const picked = filteredTabs.value[searchHighlightIndex.value];
    if (picked && !picked.disabled) {
      activateSearchTab(picked);
    }
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeSearch();
    searchBtnRef.value?.focus({ preventScroll: true });
  }
}

function setupStrip() {
  stripCtrl?.destroy();
  stripCtrl = null;
  if (!rootRef.value) return;
  stripCtrl = createTabStrip(rootRef.value, {
    draggable: props.draggable,
    detachable: props.detachable,
    middleClickClose: props.middleClickClose,
    previewDelay: props.previewDelay,
    onSelect: (id) => selectTabById(id),
    onClose: (id) => handleCloseById(id),
    onDoubleClick: (id) => emit('dblclick', id),
    onReorder: (detail) => handleReorder(detail),
    onDetach: (detail) => emit('detach', detail),
    onTabContextMenu: (id, tabEl, ev) => openTabContextMenu(id, tabEl, ev),
    onScrollStateChange: (next) => {
      scrollState.value = next;
    },
  });
}

function setupSearchPopover() {
  stopSearchPopover?.();
  stopSearchPopover = null;
  if (props.search && searchBtnRef.value && searchPanelRef.value) {
    stopSearchPopover = createPopover(searchBtnRef.value, searchPanelRef.value, {
      side: 'bottom',
    });
  }
}

function setupContextMenu() {
  ctxMenuCtrl?.destroy();
  ctxMenuCtrl = null;
  if (props.contextMenu && ctxMenuRef.value) {
    ctxMenuCtrl = createContextMenu(null, ctxMenuRef.value, {
      loop: true,
      manageChecked: false,
    });
  }
}

onMounted(() => {
  setupStrip();
  setupSearchPopover();
  setupContextMenu();
});

watch(
  () => [props.draggable, props.detachable, props.middleClickClose, props.previewDelay],
  () => setupStrip(),
  { flush: 'post' },
);

watch(
  () => props.search,
  () => setupSearchPopover(),
  { flush: 'post' },
);

watch(
  () => props.contextMenu,
  () => setupContextMenu(),
  { flush: 'post' },
);

watch(
  () => props.tabs,
  () => {
    nextTick(() => stripCtrl?.sync());
  },
  { deep: true },
);

watch(activeId, () => {
  nextTick(() => stripCtrl?.scrollActiveIntoView());
});

onBeforeUnmount(() => {
  stopSearchPopover?.();
  ctxMenuCtrl?.destroy();
  stripCtrl?.destroy();
});

function focusActiveTab() {
  const scroller = rootRef.value?.querySelector<HTMLElement>('.j-tab-strip__scroller');
  if (!scroller) return;
  const activeEl =
    scroller.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ??
    scroller.querySelector<HTMLElement>('[role="tab"]:not([aria-disabled="true"])');
  activeEl?.focus();
  stripCtrl?.scrollActiveIntoView();
}

defineExpose<JTabStripHandle>({
  scrollToTab: (id: string, instant?: boolean) => stripCtrl?.scrollToTab(id, instant),
  focusActiveTab,
  scrollActiveIntoView: (instant?: boolean) => stripCtrl?.scrollActiveIntoView(instant),
  closeContextMenu,
  closeSearch,
  sync: () => stripCtrl?.sync(),
  get el() {
    return rootRef.value;
  },
});
</script>

<template>
  <div
    ref="rootRef"
    class="j-tab-strip"
    :data-size="size === 'md' ? undefined : size"
    :data-titlebar="titlebar ? '' : undefined"
    :data-draggable="draggable ? '' : undefined"
    :data-detachable="detachable ? '' : undefined"
  >
    <div v-if="slots.start" class="j-tab-strip__start">
      <slot name="start" />
    </div>

    <template v-if="search">
      <button
        ref="searchBtnRef"
        type="button"
        class="j-tab-strip__search-btn"
        :aria-label="searchLabel"
        :title="searchLabel"
      >
        <JIcon name="chevron-down" size="xs" />
      </button>

      <div
        :id="searchPanelId"
        ref="searchPanelRef"
        class="j-tab-strip__search-panel"
        popover="auto"
        data-side="bottom"
        data-align="start"
        role="dialog"
        :aria-label="searchLabel"
        @toggle="onSearchToggle"
        @keydown="onSearchKeyDown"
      >
        <div class="j-tab-strip__search-header">
          <JIcon name="search" size="sm" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            :aria-expanded="filteredTabs.length > 0 ? 'true' : 'false'"
            :aria-controls="filteredTabs.length > 0 ? `${searchPanelId}-listbox` : undefined"
            :aria-activedescendant="
              filteredTabs[searchHighlightIndex]
                ? `${searchPanelId}-opt-${filteredTabs[searchHighlightIndex].id}`
                : undefined
            "
            class="j-tab-strip__search-input"
            :placeholder="searchPlaceholder"
            :aria-label="searchPlaceholder"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div
          v-if="filteredTabs.length > 0"
          :id="`${searchPanelId}-listbox`"
          ref="searchListRef"
          class="j-tab-strip__search-list"
          role="listbox"
          :aria-label="ariaLabel"
        >
          <div
            v-for="(tab, sIdx) in filteredTabs"
            :id="`${searchPanelId}-opt-${tab.id}`"
            :key="`search-${tab.id}`"
            class="j-tab-strip__search-item"
            role="option"
            :aria-selected="tab.id === activeId ? 'true' : 'false'"
            :data-active="tab.id === activeId ? '' : undefined"
            :data-highlighted="sIdx === searchHighlightIndex ? '' : undefined"
            :data-preview="tab.preview ? '' : undefined"
            :data-disabled="tab.disabled ? '' : undefined"
            @pointerenter="searchHighlightIndex = sIdx"
            @click="activateSearchTab(tab)"
          >
            <span v-if="shouldShowMedia(tab)" class="j-tab-strip__media" aria-hidden="true">
              <span v-if="tab.loading" class="j-spinner" data-size="sm" aria-hidden="true">
                <svg
                  class="j-spinner__svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  shape-rendering="geometricPrecision"
                  aria-hidden="true"
                >
                  <circle class="j-spinner__track" cx="12" cy="12" r="9.5" stroke="currentColor" />
                  <circle
                    class="j-spinner__arc"
                    cx="12"
                    cy="12"
                    r="9.5"
                    stroke="currentColor"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <slot v-else-if="hasCustomIconSlot()" name="tab-icon" :tab="tab">
                <slot name="icon" :tab="tab">
                  <JIcon v-if="tab.icon" :name="tab.icon" size="sm" />
                  <JIcon v-else-if="tab.pinned" name="pin" size="xs" />
                </slot>
              </slot>
              <JIcon v-else-if="tab.icon" :name="tab.icon" size="sm" />
              <JIcon v-else-if="tab.pinned" name="pin" size="xs" />
            </span>

            <div class="j-tab-strip__search-item-main">
              <span class="j-tab-strip__search-item-title">{{ getTabTitle(tab) }}</span>
              <span v-if="tab.description" class="j-tab-strip__search-item-desc">
                {{ tab.description }}
              </span>
            </div>

            <span
              v-if="resolveIndicator(tab.indicator)"
              class="j-tab-strip__indicator"
              :data-tone="resolveIndicator(tab.indicator)?.tone"
              :data-indicator-color="resolveIndicator(tab.indicator)?.color"
              aria-hidden="true"
            />
            <span v-if="tab.dirty" class="j-tab-strip__dirty" aria-hidden="true" />

            <button
              v-if="isTabClosable(tab)"
              type="button"
              tabindex="-1"
              class="j-tab-strip__search-close"
              :aria-label="`Close ${getTabTitle(tab)}`"
              @click.stop="handleTabClose(tab, $event)"
            >
              <JIcon name="x" size="xs" />
            </button>
          </div>
        </div>

        <div v-else class="j-tab-strip__search-empty">
          No matching open tabs
        </div>
      </div>
    </template>

    <div class="j-tab-strip__viewport">
      <div
        class="j-tab-strip__scroller"
        role="tablist"
        aria-orientation="horizontal"
        :aria-label="ariaLabel"
      >
        <div
          v-for="tab in tabs"
          :id="`${baseId}-tab-${tab.id}`"
          :key="tab.id"
          class="j-tab-strip__tab"
          role="tab"
          :tabindex="tab.id === firstFocusableId ? 0 : -1"
          :aria-selected="tab.id === activeId ? 'true' : 'false'"
          :aria-disabled="tab.disabled ? 'true' : undefined"
          :aria-label="tab.pinned ? getTabTitle(tab) : undefined"
          :aria-keyshortcuts="isTabClosable(tab) ? 'Delete' : undefined"
          :data-tab-id="tab.id"
          :data-title="getTabTitle(tab)"
          :data-description="tab.description || undefined"
          :data-active="tab.id === activeId ? '' : undefined"
          :data-pinned="tab.pinned ? '' : undefined"
          :data-preview="tab.preview ? '' : undefined"
          :data-dirty="tab.dirty ? '' : undefined"
          :data-loading="tab.loading ? '' : undefined"
          :data-closable="isTabClosable(tab) ? 'true' : 'false'"
          :title="tab.description ? undefined : getTabTitle(tab)"
        >
          <div class="j-tab-strip__tab-surface">
            <span v-if="shouldShowMedia(tab)" class="j-tab-strip__media" aria-hidden="true">
              <span v-if="tab.loading" class="j-spinner" data-size="sm" aria-hidden="true">
                <svg
                  class="j-spinner__svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  shape-rendering="geometricPrecision"
                  aria-hidden="true"
                >
                  <circle class="j-spinner__track" cx="12" cy="12" r="9.5" stroke="currentColor" />
                  <circle
                    class="j-spinner__arc"
                    cx="12"
                    cy="12"
                    r="9.5"
                    stroke="currentColor"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <slot v-else-if="hasCustomIconSlot()" name="tab-icon" :tab="tab">
                <slot name="icon" :tab="tab">
                  <JIcon v-if="tab.icon" :name="tab.icon" size="sm" />
                  <JIcon v-else-if="tab.pinned" name="pin" size="xs" />
                </slot>
              </slot>
              <JIcon v-else-if="tab.icon" :name="tab.icon" size="sm" />
              <JIcon v-else-if="tab.pinned" name="pin" size="xs" />
            </span>

            <span class="j-tab-strip__title">{{ getTabTitle(tab) }}</span>

            <span
              v-if="resolveIndicator(tab.indicator)"
              class="j-tab-strip__indicator"
              :data-tone="resolveIndicator(tab.indicator)?.tone"
              :data-indicator-color="resolveIndicator(tab.indicator)?.color"
              aria-hidden="true"
            />

            <span v-if="tab.dirty || isTabClosable(tab)" class="j-tab-strip__tail">
              <span v-if="tab.dirty" class="j-tab-strip__dirty" aria-hidden="true" />
              <button
                v-if="isTabClosable(tab)"
                type="button"
                tabindex="-1"
                class="j-tab-strip__close"
                :aria-label="`Close ${getTabTitle(tab)}`"
                @click.stop="handleTabClose(tab, $event)"
              >
                <JIcon name="x" size="xs" />
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <button
      v-if="addable"
      type="button"
      class="j-tab-strip__new-btn"
      :aria-label="newTabLabel"
      :title="newTabLabel"
      @click="handleNewTab(undefined)"
    >
      <JIcon name="plus" size="sm" />
    </button>

    <div class="j-tab-strip__spacer" aria-hidden="true" />

    <div v-if="slots.end" class="j-tab-strip__end">
      <slot name="end" />
    </div>

    <!-- Shared anchored hover preview card (~380ms delay for tabs with description) -->
    <div
      class="j-hover-card j-tab-strip__preview-card"
      popover="manual"
      data-side="bottom"
      data-align="start"
      role="tooltip"
    >
      <div class="j-tab-strip__preview-title" />
      <div class="j-tab-strip__preview-desc" />
    </div>

    <!-- Built-in + extensible per-tab context menu -->
    <div
      v-if="contextMenu"
      :id="ctxMenuId"
      ref="ctxMenuRef"
      class="j-menu"
      popover="auto"
      role="menu"
    >
      <template v-if="contextTab">
        <button
          type="button"
          class="j-menu__item"
          role="menuitem"
          @click="handleNewTab(contextTab.id)"
        >
          <span>New tab to the right</span>
        </button>

        <slot name="context-menu" :tab="contextTab" :close="closeContextMenu" />

        <hr class="j-menu__separator" role="separator" />

        <button
          type="button"
          class="j-menu__item"
          role="menuitem"
          :disabled="!isTabClosable(contextTab) ? true : undefined"
          :aria-disabled="!isTabClosable(contextTab) ? 'true' : undefined"
          @click="handleTabClose(contextTab)"
        >
          <span>Close</span>
        </button>

        <button
          type="button"
          class="j-menu__item"
          role="menuitem"
          :disabled="closableOtherTabs.length === 0 ? true : undefined"
          :aria-disabled="closableOtherTabs.length === 0 ? 'true' : undefined"
          @click="handleCloseOthers(contextTab)"
        >
          <span>Close others</span>
        </button>

        <button
          type="button"
          class="j-menu__item"
          role="menuitem"
          :disabled="closableRightTabs.length === 0 ? true : undefined"
          :aria-disabled="closableRightTabs.length === 0 ? 'true' : undefined"
          @click="handleCloseRight(contextTab)"
        >
          <span>Close tabs to the right</span>
        </button>
      </template>
    </div>
  </div>
</template>
