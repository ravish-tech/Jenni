<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useSlots,
  watch,
} from 'vue';
import { lightDismiss } from 'jenni-core/behaviors/dialog.js';
import {
  bindCommandShortcut,
  createCommandPalette,
  type CommandPaletteController,
} from 'jenni-core/behaviors/command-palette.js';
import type { CommandGroup, CommandItem, JCommandPaletteProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<JCommandPaletteProps>(), {
  placeholder: 'Type a command or search…',
  emptyText: 'No matching commands found.',
  inline: false,
  closeOnSelect: true,
  dismissible: true,
  showFooter: true,
  showEsc: true,
  ariaLabel: 'Command palette',
});

const open = defineModel<boolean>('open', { default: false });
const query = defineModel<string>('query', { default: '' });

const emit = defineEmits<{
  select: [item: CommandItem];
  close: [];
  back: [];
  breadcrumbClick: [index: number];
}>();

const slots = useSlots();
const baseId = useId();
const listboxId = `${baseId}-list`;

const dialogRef = ref<HTMLDialogElement | null>(null);
const inlineRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

interface DrilldownPage {
  label: string;
  items: CommandItem[];
}

const pageStack = ref<DrilldownPage[]>([]);
const activeValue = ref<string | null>(null);

let stopDismiss: (() => void) | null = null;
let stopShortcut: (() => void) | null = null;
let slotCtrl: CommandPaletteController | null = null;

const ICON_PATHS: Record<string, string> = {
  search: 'M11.5 11.5 14 14M7.25 12.5a5.25 5.25 0 1 1 0-10.5 5.25 5.25 0 0 1 0 10.5Z',
  sparkles: 'M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14M4.2 4.2l1.6 1.6M10.2 10.2l1.6 1.6M11.8 4.2l-1.6 1.6M5.8 10.2l-1.6 1.6',
  sun: 'M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1 1M11.2 11.2l1 1M12.2 3.8l-1 1M4.8 11.2l-1 1',
  moon: 'M13.2 9.8A5.5 5.5 0 0 1 6.2 2.8a5.5 5.5 0 1 0 7 7Z',
  monitor: 'M2.5 3.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1ZM5.5 13.5h5M8 11.5v2',
  terminal: 'm3.5 5.5 3 2.5-3 2.5M8 10.5h4.5M2.5 3h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
  file: 'M4.5 2h4.8L12.5 5.2V13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm4.5.3V5.5h3.2',
  folder: 'M2 4.5a1 1 0 0 1 1-1h3.2l1.4 1.5H13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z',
  'git-branch': 'M5 4.5v7M11 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm6-6.5c0 2.5-2 3-6 3',
  layers: 'M8 2.2 14 5.5 8 8.8 2 5.5 8 2.2ZM2 8.5l6 3.3 6-3.3M2 11.2l6 3.3 6-3.3',
  palette: 'M8 2.2a5.8 5.8 0 1 0 0 11.6c.9 0 1.5-.6 1.5-1.4 0-.4-.2-.7-.4-1-.2-.3-.3-.6-.3-1 0-.8.6-1.4 1.4-1.4h1.1A2.5 2.5 0 0 0 13.8 6.5C13.8 4 11.2 2.2 8 2.2Z',
  layout: 'M2.5 3h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm0 3.5h12M6.5 6.5V13',
  settings: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm5.2-2a5.2 5.2 0 0 0-.1-1l1.2-1-1.2-2-1.4.5a5.2 5.2 0 0 0-1.7-1L9.7 2H6.3L6 3.5a5.2 5.2 0 0 0-1.7 1l-1.4-.5-1.2 2 1.2 1a5.2 5.2 0 0 0 0 2l-1.2 1 1.2 2 1.4-.5c.5.4 1.1.8 1.7 1L6.3 14h3.4l.3-1.5c.6-.2 1.2-.6 1.7-1l1.4.5 1.2-2-1.2-1c.1-.3.1-.7.1-1Z',
  bolt: 'M8.8 1.8 3.5 9h4.1l-.4 5.2L12.5 7H8.4l.4-5.2Z',
  user: 'M8 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.2 13.5a4.8 4.8 0 0 1 9.6 0',
  'arrow-right': 'M3 8h10m-4-4 4 4-4 4',
  globe: 'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM2.2 8h11.6M8 2c1.7 1.6 2.6 3.7 2.6 6S9.7 12.4 8 14c-1.7-1.6-2.6-3.7-2.6-6S6.3 3.6 8 2Z',
  copy: 'M5.5 5.5h6.5a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Zm-2 5H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h6.5a1 1 0 0 1 1 1v.5',
  plus: 'M8 3.2v9.6M3.2 8h9.6',
};

function resolveIconPath(icon?: string): string | null {
  if (!icon) return null;
  if (ICON_PATHS[icon]) return ICON_PATHS[icon]!;
  if (icon.startsWith('M') || icon.startsWith('m')) return icon;
  return null;
}

function parseKeys(shortcut?: string | string[]): string[] {
  if (!shortcut) return [];
  if (Array.isArray(shortcut)) return shortcut;
  if (shortcut.includes(' ')) return shortcut.split(/\s+/).filter(Boolean);
  return [shortcut];
}

const isSlotMode = computed(
  () =>
    Boolean(slots.default) &&
    (!props.items || props.items.length === 0) &&
    (!props.groups || props.groups.length === 0),
);

const activeBreadcrumbs = computed<string[]>(() => {
  if (props.breadcrumbs && props.breadcrumbs.length > 0) return props.breadcrumbs;
  return pageStack.value.map((p) => p.label);
});

const rawGroups = computed<CommandGroup[]>(() => {
  const topPage = pageStack.value[pageStack.value.length - 1];
  if (topPage) {
    return groupFlatItems(topPage.items, topPage.label);
  }
  if (props.groups && props.groups.length > 0) {
    return props.groups;
  }
  return groupFlatItems(props.items ?? []);
});

function groupFlatItems(list: CommandItem[], fallbackLabel = ''): CommandGroup[] {
  const buckets: CommandGroup[] = [];
  const map = new Map<string, CommandGroup>();
  for (const item of list) {
    const key = item.group ?? fallbackLabel;
    let bucket = map.get(key);
    if (!bucket) {
      bucket = { id: key || '__ungrouped', label: key, items: [] };
      map.set(key, bucket);
      buckets.push(bucket);
    }
    bucket.items.push(item);
  }
  return buckets;
}

const defaultFilter = (item: CommandItem, q: string, groupLabel?: string): boolean => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (item.label.toLowerCase().includes(needle)) return true;
  if (item.description?.toLowerCase().includes(needle)) return true;
  if ((groupLabel || item.group || '').toLowerCase().includes(needle)) return true;
  if (item.keywords?.some((kw) => kw.toLowerCase().includes(needle))) return true;
  return false;
};

const filteredGroups = computed<CommandGroup[]>(() => {
  const q = query.value;
  if (!q.trim()) return rawGroups.value;
  return rawGroups.value
    .map((g) => ({
      ...g,
      items: g.items.filter((item) =>
        props.filter ? props.filter(item, q) : defaultFilter(item, q, g.label),
      ),
    }))
    .filter((g) => g.items.length > 0);
});

const enabledItems = computed<CommandItem[]>(() =>
  filteredGroups.value.flatMap((g) => g.items.filter((i) => !i.disabled)),
);

const itemDomId = (val: string) =>
  `${baseId}-opt-${encodeURIComponent(val).replace(/%/g, '_')}`;

const activeDescendantId = computed(() =>
  !isSlotMode.value && activeValue.value ? itemDomId(activeValue.value) : undefined,
);

function syncActiveHighlight(preferFirst = false) {
  const list = enabledItems.value;
  if (!list.length) {
    activeValue.value = null;
    return;
  }
  if (preferFirst || !list.some((i) => i.value === activeValue.value)) {
    activeValue.value = list[0]!.value;
  }
}

function scrollActiveIntoView() {
  nextTick(() => {
    if (!activeValue.value || !listRef.value) return;
    const node = listRef.value.querySelector(
      `[data-value="${CSS.escape(activeValue.value)}"]`,
    );
    node?.scrollIntoView({ block: 'nearest' });
  });
}

function showModal() {
  if (props.inline) {
    inputRef.value?.focus();
    return;
  }
  const dlg = dialogRef.value;
  if (dlg && !dlg.open) {
    dlg.showModal();
  }
  open.value = true;
  syncActiveHighlight(true);
  nextTick(() => inputRef.value?.focus());
}

function closeModal() {
  if (props.inline) return;
  if (dialogRef.value?.open) {
    dialogRef.value.close();
  }
  open.value = false;
  pageStack.value = [];
  query.value = '';
}

function toggleModal() {
  if (open.value) closeModal();
  else showModal();
}

function popBreadcrumb(targetIndex?: number) {
  if (props.breadcrumbs && props.breadcrumbs.length > 0) {
    if (typeof targetIndex === 'number') emit('breadcrumbClick', targetIndex);
    else emit('back');
    query.value = '';
    nextTick(() => inputRef.value?.focus());
    return true;
  }
  if (pageStack.value.length > 0) {
    if (typeof targetIndex === 'number') {
      pageStack.value = pageStack.value.slice(0, targetIndex);
    } else {
      pageStack.value = pageStack.value.slice(0, -1);
    }
    query.value = '';
    syncActiveHighlight(true);
    emit('back');
    nextTick(() => inputRef.value?.focus());
    return true;
  }
  return false;
}

function handleSelectItem(item: CommandItem) {
  if (item.disabled) return;
  if (item.children && item.children.length > 0) {
    pageStack.value = [...pageStack.value, { label: item.label, items: item.children }];
    query.value = '';
    syncActiveHighlight(true);
    nextTick(() => inputRef.value?.focus());
    return;
  }
  item.onSelect?.(item);
  emit('select', item);
  if (!props.inline && props.closeOnSelect && !item.keepOpen) {
    closeModal();
  } else {
    inputRef.value?.focus();
  }
}

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value;
  if (!isSlotMode.value) {
    syncActiveHighlight(false);
    scrollActiveIntoView();
  }
}

function onInputKeyDown(e: KeyboardEvent) {
  if (isSlotMode.value) return;

  const list = enabledItems.value;
  const idx = list.findIndex((i) => i.value === activeValue.value);

  switch (e.key) {
    case 'ArrowDown': {
      e.preventDefault();
      if (!list.length) break;
      activeValue.value = list[idx < list.length - 1 ? idx + 1 : 0]!.value;
      scrollActiveIntoView();
      break;
    }
    case 'ArrowUp': {
      e.preventDefault();
      if (!list.length) break;
      activeValue.value = list[idx > 0 ? idx - 1 : list.length - 1]!.value;
      scrollActiveIntoView();
      break;
    }
    case 'Home': {
      if (list.length) {
        e.preventDefault();
        activeValue.value = list[0]!.value;
        scrollActiveIntoView();
      }
      break;
    }
    case 'End': {
      if (list.length) {
        e.preventDefault();
        activeValue.value = list[list.length - 1]!.value;
        scrollActiveIntoView();
      }
      break;
    }
    case 'Enter': {
      if (idx >= 0 && list[idx]) {
        e.preventDefault();
        handleSelectItem(list[idx]!);
      }
      break;
    }
    case 'Backspace': {
      if (!query.value && activeBreadcrumbs.value.length > 0) {
        e.preventDefault();
        popBreadcrumb();
      }
      break;
    }
    case 'Escape': {
      if (activeBreadcrumbs.value.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        popBreadcrumb();
      } else if (props.inline && query.value) {
        e.preventDefault();
        query.value = '';
      } else if (!props.inline && props.dismissible) {
        e.preventDefault();
        closeModal();
      }
      break;
    }
    default:
      break;
  }
}

function onDialogClose() {
  open.value = false;
  pageStack.value = [];
  query.value = '';
  emit('close');
}

function onDialogCancel(e: Event) {
  if (activeBreadcrumbs.value.length > 0) {
    e.preventDefault();
    popBreadcrumb();
    return;
  }
  if (!props.dismissible) {
    e.preventDefault();
  }
}

function bindModalBehaviors() {
  stopDismiss?.();
  stopDismiss =
    !props.inline && dialogRef.value && props.dismissible
      ? lightDismiss(dialogRef.value)
      : null;

  stopShortcut?.();
  stopShortcut =
    !props.inline && props.shortcut
      ? bindCommandShortcut(props.shortcut, () => toggleModal())
      : null;

  slotCtrl?.destroy();
  slotCtrl = null;
  const host = props.inline ? inlineRef.value : dialogRef.value;
  if (isSlotMode.value && host) {
    slotCtrl = createCommandPalette(host, {
      shortcut: false,
      dismissible: false,
      closeOnSelect: props.closeOnSelect,
      onSelect: (detail) => {
        emit('select', { value: detail.value, label: detail.label });
      },
      onQueryChange: (q) => {
        query.value = q;
      },
    });
  }
}

onMounted(() => {
  syncActiveHighlight(true);
  bindModalBehaviors();
  if (!props.inline && open.value) showModal();
});

watch(open, (val) => {
  if (props.inline) return;
  if (val) showModal();
  else closeModal();
});

watch(
  () => [props.dismissible, props.shortcut, props.inline, isSlotMode.value],
  () => bindModalBehaviors(),
  { flush: 'post' },
);

watch(
  enabledItems,
  () => {
    syncActiveHighlight(false);
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  stopDismiss?.();
  stopShortcut?.();
  slotCtrl?.destroy();
  if (dialogRef.value?.open) dialogRef.value.close();
});

defineExpose({
  open: showModal,
  close: closeModal,
  toggle: toggleModal,
  popBreadcrumb,
});
</script>

<template>
  <slot name="trigger" :open="showModal" :toggle="toggleModal" />

  <component
    :is="inline ? 'div' : 'dialog'"
    :ref="(el: unknown) => {
      if (inline) inlineRef = el as HTMLElement | null;
      else dialogRef = el as HTMLDialogElement | null;
    }"
    class="j-command-palette"
    :data-inline="inline ? '' : undefined"
    :role="inline ? 'region' : undefined"
    :aria-label="ariaLabel"
    v-bind="$attrs"
    @close="inline ? undefined : onDialogClose()"
    @cancel="inline ? undefined : onDialogCancel($event)"
  >
    <div class="j-command-palette__header">
      <slot name="header">
        <span class="j-command-palette__search-icon" aria-hidden="true">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M11.5 11.5 14 14M7.25 12.5a5.25 5.25 0 1 1 0-10.5 5.25 5.25 0 0 1 0 10.5Z" />
          </svg>
        </span>

        <span v-if="activeBreadcrumbs.length" class="j-command-palette__breadcrumbs">
          <button
            type="button"
            class="j-command-palette__breadcrumb"
            title="Return to root commands"
            @click="popBreadcrumb(0)"
          >
            Root
          </button>
          <button
            v-for="(crumb, cIdx) in activeBreadcrumbs"
            :key="`${crumb}-${cIdx}`"
            type="button"
            class="j-command-palette__breadcrumb"
            @click="popBreadcrumb(cIdx)"
          >
            {{ crumb }}
          </button>
        </span>

        <input
          ref="inputRef"
          type="text"
          class="j-command-palette__input"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="inline || open ? 'true' : 'false'"
          :aria-controls="listboxId"
          :aria-activedescendant="activeDescendantId"
          :aria-label="ariaLabel"
          :placeholder="placeholder"
          :value="query"
          @input="onInput"
          @keydown="onInputKeyDown"
        />

        <button
          v-if="showEsc && (!inline || query)"
          type="button"
          tabindex="-1"
          class="j-command-palette__close"
          :aria-label="inline ? 'Clear query' : 'Close command palette'"
          @pointerdown.prevent
          @click="inline ? (query = '') : closeModal()"
        >
          <kbd class="j-kbd" data-size="sm">Esc</kbd>
        </button>
      </slot>
    </div>

    <div
      :id="listboxId"
      ref="listRef"
      class="j-command-palette__list"
      role="listbox"
      :aria-label="ariaLabel"
      @pointerdown="(e) => { if (!isSlotMode) e.preventDefault(); }"
    >
      <template v-if="isSlotMode">
        <slot />
      </template>

      <template v-else-if="filteredGroups.length">
        <div
          v-for="(group, gIdx) in filteredGroups"
          :key="group.id ?? `${group.label}-${gIdx}`"
          class="j-command-palette__group"
          role="group"
          :aria-label="group.label || undefined"
        >
          <div v-if="group.label" class="j-command-palette__group-label">
            {{ group.label }}
          </div>

          <div
            v-for="item in group.items"
            :id="itemDomId(item.value)"
            :key="item.id ?? item.value"
            class="j-command-palette__item"
            role="option"
            :data-value="item.value"
            :data-highlighted="activeValue === item.value ? '' : undefined"
            :aria-selected="activeValue === item.value ? 'true' : 'false'"
            :aria-disabled="item.disabled ? 'true' : undefined"
            @pointerenter="item.disabled ? undefined : (activeValue = item.value)"
            @click="handleSelectItem(item)"
          >
            <slot name="item" :item="item" :active="activeValue === item.value">
              <span v-if="item.icon || slots['item-icon']" class="j-command-palette__item-icon" aria-hidden="true">
                <slot name="item-icon" :item="item">
                  <svg
                    v-if="resolveIconPath(item.icon)"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path :d="resolveIconPath(item.icon) ?? ''" />
                  </svg>
                </slot>
              </span>

              <span class="j-command-palette__item-body">
                <span class="j-command-palette__item-title">{{ item.label }}</span>
                <span v-if="item.description" class="j-command-palette__item-description">
                  {{ item.description }}
                </span>
              </span>

              <span v-if="item.shortcut" class="j-command-palette__item-shortcut" aria-hidden="true">
                <kbd
                  v-for="(k, kIdx) in parseKeys(item.shortcut)"
                  :key="`${k}-${kIdx}`"
                  class="j-kbd"
                  data-size="sm"
                >
                  {{ k }}
                </kbd>
              </span>
              <span
                v-else-if="item.children && item.children.length"
                class="j-command-palette__item-chevron"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m6 4 4 4-4 4" />
                </svg>
              </span>
            </slot>
          </div>
        </div>
      </template>

      <div v-else class="j-command-palette__empty">
        <slot name="empty" :query="query">{{ emptyText }}</slot>
      </div>
    </div>

    <footer v-if="showFooter || slots.footer" class="j-command-palette__footer">
      <slot name="footer">
        <div class="j-command-palette__hints">
          <span class="j-command-palette__hint">
            <kbd class="j-kbd" data-size="sm">↑</kbd>
            <kbd class="j-kbd" data-size="sm">↓</kbd>
            <span>Navigate</span>
          </span>
          <span class="j-command-palette__hint">
            <kbd class="j-kbd" data-size="sm">↵</kbd>
            <span>{{ activeBreadcrumbs.length ? 'Select' : 'Run' }}</span>
          </span>
          <span v-if="activeBreadcrumbs.length" class="j-command-palette__hint">
            <kbd class="j-kbd" data-size="sm">⌫</kbd>
            <span>Back</span>
          </span>
          <span v-if="!inline" class="j-command-palette__hint">
            <kbd class="j-kbd" data-size="sm">Esc</kbd>
            <span>{{ activeBreadcrumbs.length ? 'Back' : 'Close' }}</span>
          </span>
        </div>
      </slot>
    </footer>
  </component>
</template>
