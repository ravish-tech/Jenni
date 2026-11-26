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
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z',
  sparkles:
    'M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0ZM20 3v4M22 5h-4',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  monitor:
    'M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 21h8M12 17v4',
  terminal:
    'm5 8 4 4-4 4M12 16h7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  file: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7L15 2ZM14 2v4a2 2 0 0 0 2 2h4',
  folder:
    'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16Z',
  'git-branch':
    'M6 9v6M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12-12c0 4.5-3 6-12 6',
  layers: 'M12 2 2 7l10 5 10-5-10-5ZM2 12l10 5 10-5M2 17l10 5 10-5',
  palette:
    'M12 2a10 10 0 0 0 0 20 1.7 1.7 0 0 0 1.7-1.7c0-.44-.18-.85-.46-1.15a1.67 1.67 0 0 1 1.24-2.8H16.5A5.5 5.5 0 0 0 22 10.85C22 5.96 17.52 2 12 2Zm-5.5 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
  layout: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM3 9h18M9 21V9',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.43-2.53c.04-.31.07-.64.07-.97s-.03-.66-.07-.97l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.3 7.3 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64L4.57 11.03c-.04.31-.07.64-.07.97s.03.66.07.97l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.22.39.3.61.22l2.49-1c.52.39 1.08.73 1.69.98l.38 2.65c.05.24.25.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.22.08.48 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65Z',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8Z',
  user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  'arrow-right': 'M5 12h14m-6-6 6 6-6 6',
  globe:
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z',
  copy: 'M10 9h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2ZM5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  close: 'M18 6 6 18M6 6l12 12',
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
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            shape-rendering="geometricPrecision"
          >
            <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
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
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    shape-rendering="geometricPrecision"
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
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  shape-rendering="geometricPrecision"
                >
                  <path d="M9 6l6 6-6 6" />
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
