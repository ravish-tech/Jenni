<script setup lang="ts">
import { computed, onMounted, provide, readonly, ref, useSlots, watch } from 'vue';
import JIcon from '../display/JIcon.vue';
import JContextMenu from '../overlay/JContextMenu.vue';
import JDropdownItem from '../overlay/JDropdownItem.vue';
import JTooltip from '../overlay/JTooltip.vue';
import JSplitHandle, { type SplitHandleDragPayload } from './JSplitHandle.vue';
import {
  JSidebarLayoutKey,
  type JSidebarLayoutExpose,
  type JSidebarLayoutProps,
  type JSidebarState,
} from './sidebar-layout-context';

export type { JSidebarState, JSidebarLayoutProps, JSidebarLayoutExpose };

const props = withDefaults(defineProps<JSidebarLayoutProps>(), {
  as: 'div',
  defaultWidth: 260,
  min: 180,
  max: 600,
  initialState: 'open',
  toggleLabel: 'sidebar',
  sidebarAriaLabel: 'Sidebar',
  bordered: false,
});

const emit = defineEmits<{
  'update:state': [state: JSidebarState];
  'update:width': [width: number];
  stateChange: [state: JSidebarState];
  widthChange: [width: number];
}>();

const slots = useSlots();
const rootRef = ref<HTMLElement | { $el?: unknown } | null>(null);
const edgeMenuRef = ref<InstanceType<typeof JContextMenu> | null>(null);
const isDragging = ref(false);

function resolveRootEl(): HTMLElement | null {
  const val = rootRef.value;
  if (!val) return null;
  if (typeof HTMLElement !== 'undefined' && val instanceof HTMLElement) return val;
  const maybeEl = (val as { $el?: unknown }).$el;
  return typeof HTMLElement !== 'undefined' && maybeEl instanceof HTMLElement ? maybeEl : null;
}

const clampNum = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const resolvedMin = computed(() => Math.max(80, Number(props.min) || 180));
const resolvedMax = computed(() => Math.max(resolvedMin.value, Number(props.max) || 600));
const hasRail = computed(() => Boolean(slots.rail));

function isValidState(val: unknown): val is JSidebarState {
  return val === 'open' || val === 'rail' || val === 'hidden';
}

function normalizeState(candidate: JSidebarState, allowRail = hasRail.value): JSidebarState {
  if (candidate === 'rail' && !allowRail) return 'hidden';
  return isValidState(candidate) ? candidate : 'open';
}

function clampWidth(raw: number): number {
  const n = Number.isFinite(raw) ? raw : props.defaultWidth;
  return Math.round(clampNum(n, resolvedMin.value, resolvedMax.value));
}

function readPersisted(key: string | undefined): { state?: JSidebarState; width?: number } | null {
  if (!key || typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: unknown; width?: unknown };
    if (!parsed || typeof parsed !== 'object') return null;
    const out: { state?: JSidebarState; width?: number } = {};
    if (isValidState(parsed.state)) out.state = parsed.state;
    if (typeof parsed.width === 'number' && Number.isFinite(parsed.width)) {
      out.width = parsed.width;
    }
    return out;
  } catch {
    return null;
  }
}

function writePersisted(key: string | undefined, nextState: JSidebarState, nextWidth: number) {
  if (!key || typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ state: nextState, width: nextWidth }));
  } catch {
    /* ignore storage quota or security restrictions */
  }
}

const innerState = ref<JSidebarState>(
  normalizeState(props.initialState, Boolean(slots.rail)),
);

const innerWidth = ref<number>(
  clampWidth(props.defaultWidth),
);

const currentState = computed<JSidebarState>(() =>
  normalizeState(props.state !== undefined ? props.state : innerState.value, hasRail.value),
);

const currentWidth = computed<number>(() =>
  clampWidth(props.width !== undefined ? props.width : innerWidth.value),
);

const resolvedToggleLabel = computed(() => {
  const raw = props.toggleLabel ?? 'sidebar';
  return raw.trim() || 'sidebar';
});

const edgeTooltipText = computed(() =>
  currentState.value === 'open'
    ? `Hide ${resolvedToggleLabel.value}`
    : `Show ${resolvedToggleLabel.value}`,
);

function setState(next: JSidebarState) {
  const normalized = normalizeState(next, hasRail.value);
  const prev = currentState.value;
  if (props.state === undefined) {
    innerState.value = normalized;
  }
  writePersisted(props.storageKey, normalized, currentWidth.value);
  if (normalized !== prev || props.state !== undefined) {
    emit('update:state', normalized);
    emit('stateChange', normalized);
  }
}

function setWidth(next: number) {
  const clamped = clampWidth(next);
  const prev = currentWidth.value;
  if (props.width === undefined) {
    innerWidth.value = clamped;
  }
  writePersisted(props.storageKey, currentState.value, clamped);
  if (clamped !== prev || props.width !== undefined) {
    emit('update:width', clamped);
    emit('widthChange', clamped);
  }
}

function toggle() {
  if (currentState.value === 'open') {
    setState(hasRail.value ? 'rail' : 'hidden');
  } else {
    setState('open');
  }
}

function hydrateFromStorage(key: string | undefined) {
  const saved = readPersisted(key);
  if (!saved) return;
  if (saved.state !== undefined) {
    const restoredState = normalizeState(saved.state, hasRail.value);
    const prev = currentState.value;
    if (props.state === undefined) {
      innerState.value = restoredState;
    }
    if (restoredState !== prev) {
      emit('update:state', restoredState);
      emit('stateChange', restoredState);
    }
  }
  if (saved.width != null) {
    const restoredWidth = clampWidth(saved.width);
    const prevW = currentWidth.value;
    if (props.width === undefined) {
      innerWidth.value = restoredWidth;
    }
    if (restoredWidth !== prevW) {
      emit('update:width', restoredWidth);
      emit('widthChange', restoredWidth);
    }
  }
}

onMounted(() => {
  hydrateFromStorage(props.storageKey);
});

watch(
  () => props.storageKey,
  (nextKey) => {
    hydrateFromStorage(nextKey);
  },
);

watch(hasRail, (railAvailable) => {
  if (!railAvailable && innerState.value === 'rail') {
    innerState.value = 'hidden';
  }
});

watch([resolvedMin, resolvedMax], () => {
  innerWidth.value = clampWidth(innerWidth.value);
});

function onDragStart() {
  isDragging.value = true;
}

function onDrag(payload: SplitHandleDragPayload) {
  if (payload.source === 'keyboard') {
    setWidth(currentWidth.value + payload.delta);
    return;
  }
  const layoutEl = resolveRootEl();
  if (!layoutEl) return;
  const rect = layoutEl.getBoundingClientRect();
  const isRtl =
    typeof getComputedStyle === 'function' && getComputedStyle(layoutEl).direction === 'rtl';
  const rawWidth = isRtl ? rect.right - payload.clientX : payload.clientX - rect.left;
  setWidth(rawWidth);
}

function onDragEnd() {
  isDragging.value = false;
  writePersisted(props.storageKey, currentState.value, currentWidth.value);
}

function onEdgeContextMenu(e: MouseEvent) {
  edgeMenuRef.value?.openFromEvent(e);
}

function onEdgeKeydown(e: KeyboardEvent) {
  if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
    edgeMenuRef.value?.openFromEvent(e);
  }
}

const layoutStyle = computed(() => {
  const styles: Record<string, string> = {
    '--_sidebar-w': `${currentWidth.value}px`,
  };
  if (props.height != null) {
    styles['--j-sidebar-layout-h'] =
      typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  return styles;
});

provide(JSidebarLayoutKey, {
  state: readonly(currentState),
  width: readonly(currentWidth),
  hasRail: readonly(hasRail),
  toggleLabel: readonly(resolvedToggleLabel),
  toggle,
  setState,
  setWidth,
});

defineExpose({
  state: currentState,
  toggle,
  setState,
  width: currentWidth,
  setWidth,
});
</script>

<template>
  <component
    :is="as"
    ref="rootRef"
    class="j-sidebar-layout"
    :data-state="currentState"
    :data-bordered="bordered ? '' : undefined"
    :data-dragging="isDragging ? '' : undefined"
    :style="layoutStyle"
  >
    <aside
      class="j-sidebar-layout__sidebar"
      :aria-label="sidebarAriaLabel"
      :inert="currentState === 'hidden' ? true : undefined"
      :aria-hidden="currentState === 'hidden' ? 'true' : undefined"
    >
      <div v-if="hasRail && currentState === 'rail'" class="j-sidebar-layout__rail">
        <slot
          name="rail"
          :state="currentState"
          :width="currentWidth"
          :toggle="toggle"
          :set-state="setState"
          :set-width="setWidth"
        />
      </div>
      <div v-else class="j-sidebar-layout__sidebar-pane">
        <header v-if="$slots['sidebar-header']" class="j-sidebar-layout__sidebar-header">
          <slot
            name="sidebar-header"
            :state="currentState"
            :width="currentWidth"
            :toggle="toggle"
            :set-state="setState"
            :set-width="setWidth"
          />
        </header>
        <div class="j-sidebar-layout__sidebar-body">
          <slot
            name="sidebar"
            :state="currentState"
            :width="currentWidth"
            :toggle="toggle"
            :set-state="setState"
            :set-width="setWidth"
          />
        </div>
      </div>
    </aside>

    <div
      class="j-sidebar-layout__edge"
      @contextmenu="onEdgeContextMenu"
      @keydown="onEdgeKeydown"
    >
      <JSplitHandle
        v-if="currentState === 'open'"
        orientation="horizontal"
        :aria-label="`Resize ${resolvedToggleLabel}`"
        :value-now="currentWidth"
        :value-min="resolvedMin"
        :value-max="resolvedMax"
        @drag-start="onDragStart"
        @drag="onDrag"
        @drag-end="onDragEnd"
      />
      <div v-else class="j-sidebar-layout__edge-zone" aria-hidden="true" />

      <JTooltip :content="edgeTooltipText" side="right">
        <button
          type="button"
          class="j-sidebar-layout__edge-btn"
          :aria-label="edgeTooltipText"
          @pointerdown.stop
          @click="toggle"
        >
          <JIcon
            :name="currentState === 'open' ? 'chevron-left' : 'chevron-right'"
            size="xs"
          />
        </button>
      </JTooltip>
    </div>

    <div class="j-sidebar-layout__main">
      <header v-if="$slots['main-header']" class="j-sidebar-layout__main-header">
        <slot
          name="main-header"
          :state="currentState"
          :width="currentWidth"
          :toggle="toggle"
          :set-state="setState"
          :set-width="setWidth"
        />
      </header>
      <div class="j-sidebar-layout__content">
        <slot
          :state="currentState"
          :width="currentWidth"
          :toggle="toggle"
          :set-state="setState"
          :set-width="setWidth"
        />
      </div>
    </div>

    <JContextMenu ref="edgeMenuRef">
      <JDropdownItem
        role="menuitemradio"
        :checked="currentState === 'open'"
        @select="setState('open')"
      >
        Show sidebar
      </JDropdownItem>
      <JDropdownItem
        v-if="hasRail"
        role="menuitemradio"
        :checked="currentState === 'rail'"
        @select="setState('rail')"
      >
        Rail
      </JDropdownItem>
      <JDropdownItem
        role="menuitemradio"
        :checked="currentState === 'hidden'"
        @select="setState('hidden')"
      >
        Hide sidebar
      </JDropdownItem>
    </JContextMenu>
  </component>
</template>
