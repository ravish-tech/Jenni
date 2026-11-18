<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createShell, type ShellController } from '@jenni/core/behaviors/shell.js';
import { attr, type JAppShellHandle, type JAppShellProps, type JShellPane } from './types';

const props = withDefaults(defineProps<JAppShellProps>(), {
  layout: 'sidebar',
  variant: 'flat',
  sidebarSide: 'start',
  railLabel: 'Activity rail',
  subnavLabel: 'Secondary navigation',
  asideLabel: 'Inspector',
  dockLabel: 'Panel dock',
  bannerLabel: 'System announcement',
  masterLabel: 'Item list',
});

const sidebarOpen = defineModel<boolean>('sidebarOpen', { default: false });
const activePane = defineModel<JShellPane | undefined>('activePane', { default: undefined });
const dockOpen = defineModel<boolean>('dockOpen', { default: true });
const asideOpen = defineModel<boolean>('asideOpen', { default: true });
const asideDrawerOpen = ref(false);
const effectiveAsideOpen = ref<boolean>(asideOpen.value);

const rootEl = ref<HTMLElement | null>(null);
let ctrl: ShellController | null = null;

const mainTag = computed(() => (props.embedded ? 'div' : 'main'));
const statusTag = computed(() => (props.embedded ? 'div' : 'footer'));

const isColumnSimple = computed(
  () =>
    props.layout === 'centered' ||
    props.layout === 'bars' ||
    props.layout === 'topnav' ||
    props.layout === 'focus' ||
    props.layout === 'floating-dock',
);

const isGlobalHeaderWorkspace = computed(
  () =>
    props.layout === 'header-sidebar' ||
    props.layout === 'holy-grail' ||
    props.layout === 'ide' ||
    props.layout === 'command-center',
);

const shellStyle = computed(() => {
  const styles: Record<string, string> = {};
  if (props.height != null) {
    styles['--j-shell-h'] = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  if (props.dockHeight != null) {
    styles['--j-dock-h'] = typeof props.dockHeight === 'number' ? `${props.dockHeight}px` : props.dockHeight;
  }
  if (props.asideWidth != null) {
    styles['--j-aside-w'] = typeof props.asideWidth === 'number' ? `${props.asideWidth}px` : props.asideWidth;
  }
  return Object.keys(styles).length ? styles : undefined;
});

function getAsideThreshold() {
  if (props.layout === 'floating-dock') return 760;
  if (props.layout === 'copilot' || props.layout === 'holy-grail') return 1024;
  return 960;
}

function toggleSidebar(next?: boolean) {
  if (ctrl) {
    ctrl.toggle(next);
    return;
  }
  const val = typeof next === 'boolean' ? next : !sidebarOpen.value;
  sidebarOpen.value = val;
}

function toggleDock(next?: boolean) {
  if (ctrl) {
    ctrl.toggleDock(next);
    return;
  }
  const val = typeof next === 'boolean' ? next : !dockOpen.value;
  dockOpen.value = val;
}

function toggleAside(next?: boolean) {
  if (ctrl) {
    ctrl.toggleAside(next);
    return;
  }
  const threshold = getAsideThreshold();
  const width = rootEl.value?.clientWidth ?? 1200;
  if (width > 0 && width < threshold) {
    const val = typeof next === 'boolean' ? next : !asideDrawerOpen.value;
    asideDrawerOpen.value = val;
    effectiveAsideOpen.value = val;
    return;
  }
  const val = typeof next === 'boolean' ? next : !asideOpen.value;
  asideOpen.value = val;
  effectiveAsideOpen.value = val;
}

function closeAside() {
  if (asideDrawerOpen.value || ctrl?.isAsideDrawerOpen()) {
    asideDrawerOpen.value = false;
    ctrl?.toggleAsideDrawer(false);
    return;
  }
  const width = rootEl.value?.clientWidth ?? 1200;
  if (width > 0 && width < getAsideThreshold()) return;
  asideOpen.value = false;
  ctrl?.toggleAside(false);
}

function setActivePane(pane: JShellPane) {
  activePane.value = pane;
}

onMounted(() => {
  if (!rootEl.value) return;
  ctrl = createShell(rootEl.value, {
    onOpenChange: (next) => {
      sidebarOpen.value = next;
    },
    onAsideOpenChange: (next) => {
      asideOpen.value = next;
    },
    onAsideDrawerChange: (next) => {
      asideDrawerOpen.value = next;
    },
    onDockOpenChange: (next) => {
      dockOpen.value = next;
    },
    onEffectiveAsideChange: (next) => {
      effectiveAsideOpen.value = next;
    },
  });
  if (sidebarOpen.value) ctrl.open();
});

watch(sidebarOpen, (v) => {
  if (ctrl && ctrl.isOpen() !== v) ctrl.toggle(v);
});

watch(dockOpen, (v) => {
  const domDockOpen = !rootEl.value?.hasAttribute('data-dock-collapsed');
  if (ctrl && domDockOpen !== v) ctrl.toggleDock(v);
});

watch(asideOpen, (v) => {
  const width = rootEl.value?.clientWidth ?? 0;
  if (width === 0 || width >= getAsideThreshold()) {
    effectiveAsideOpen.value = v;
  }
});

watch(
  () => props.layout,
  () => {
    asideDrawerOpen.value = false;
    ctrl?.toggleAsideDrawer(false);
  },
);

onBeforeUnmount(() => {
  ctrl?.destroy();
  ctrl = null;
});

defineExpose<JAppShellHandle>({
  openSidebar: () => toggleSidebar(true),
  closeSidebar: () => toggleSidebar(false),
  toggleSidebar,
  toggleDock,
  toggleAside,
  closeAside,
  setActivePane,
  get element() {
    return rootEl.value;
  },
});
</script>

<template>
  <div
    ref="rootEl"
    class="j-shell"
    :data-layout="attr(layout, 'sidebar')"
    :data-variant="attr(variant, 'flat')"
    :data-sidebar-side="attr(sidebarSide, 'start')"
    :data-active-pane="activePane"
    :data-embedded="embedded ? '' : undefined"
    :data-sidebar-open="sidebarOpen ? '' : undefined"
    :data-aside-open="asideDrawerOpen ? '' : undefined"
    :data-aside-collapsed="!asideOpen ? '' : undefined"
    :data-dock-collapsed="!dockOpen ? '' : undefined"
    :style="shellStyle"
  >
    <template v-if="isColumnSimple">
      <div v-if="$slots.banner" class="j-shell__banner" role="region" :aria-label="bannerLabel">
        <slot name="banner" />
      </div>
      <slot
        name="topbar"
        :sidebar-open="sidebarOpen"
        :toggle-sidebar="toggleSidebar"
        :dock-open="dockOpen"
        :toggle-dock="toggleDock"
        :aside-open="effectiveAsideOpen"
        :toggle-aside="toggleAside"
      />
      <div v-if="$slots.subbar" class="j-shell__subbar">
        <slot name="subbar" />
      </div>
      <component :is="mainTag" class="j-shell__main">
        <slot />
      </component>
      <aside v-if="$slots.aside" class="j-shell__aside" :aria-label="asideLabel">
        <slot
          name="aside"
          :aside-open="effectiveAsideOpen"
          :toggle-aside="toggleAside"
          :close-aside="closeAside"
        />
      </aside>
      <button
        v-if="$slots.aside"
        type="button"
        class="j-shell__backdrop"
        tabindex="-1"
        aria-label="Close panel"
      />
      <section
        v-if="$slots.dock"
        class="j-shell__dock"
        :aria-label="dockLabel"
        :data-collapsed="!dockOpen ? '' : undefined"
      >
        <slot name="dock" :dock-open="dockOpen" :toggle-dock="toggleDock" />
      </section>
      <slot name="bottombar" />
      <component :is="statusTag" v-if="$slots.statusbar" class="j-shell__statusbar">
        <slot name="statusbar" />
      </component>
    </template>

    <template v-else-if="isGlobalHeaderWorkspace">
      <div v-if="$slots.banner" class="j-shell__banner" role="region" :aria-label="bannerLabel">
        <slot name="banner" />
      </div>
      <slot
        name="topbar"
        :sidebar-open="sidebarOpen"
        :toggle-sidebar="toggleSidebar"
        :dock-open="dockOpen"
        :toggle-dock="toggleDock"
        :aside-open="effectiveAsideOpen"
        :toggle-aside="toggleAside"
      />
      <div v-if="$slots.subbar && layout === 'command-center'" class="j-shell__subbar">
        <slot name="subbar" />
      </div>

      <div class="j-shell__workspace">
        <nav v-if="$slots.rail" class="j-shell__rail" :aria-label="railLabel">
          <slot name="rail" />
        </nav>
        <slot name="sidebar" :sidebar-open="sidebarOpen" :close-sidebar="() => toggleSidebar(false)" />
        <nav v-if="$slots.subnav" class="j-shell__subnav" :aria-label="subnavLabel">
          <slot name="subnav" />
        </nav>
        <button
          v-if="$slots.sidebar || $slots.rail || $slots.subnav || $slots.aside"
          type="button"
          class="j-shell__backdrop"
          tabindex="-1"
          aria-label="Close panel"
        />

        <div class="j-shell__body">
          <div v-if="$slots.subbar && layout !== 'command-center'" class="j-shell__subbar">
            <slot name="subbar" />
          </div>

          <div v-if="$slots.master" class="j-shell__stage">
            <section class="j-shell__master" :aria-label="masterLabel">
              <slot name="master" :active-pane="activePane" :set-active-pane="setActivePane" />
            </section>
            <component :is="mainTag" class="j-shell__detail">
              <slot :active-pane="activePane" :set-active-pane="setActivePane" />
            </component>
          </div>

          <div v-else-if="$slots.aside || $slots.dock" class="j-shell__stage">
            <div class="j-shell__center">
              <component :is="mainTag" class="j-shell__main">
                <slot />
              </component>
              <section
                v-if="$slots.dock"
                class="j-shell__dock"
                :aria-label="dockLabel"
                :data-collapsed="!dockOpen ? '' : undefined"
              >
                <slot name="dock" :dock-open="dockOpen" :toggle-dock="toggleDock" />
              </section>
            </div>
            <aside v-if="$slots.aside" class="j-shell__aside" :aria-label="asideLabel">
              <slot
                name="aside"
                :aside-open="effectiveAsideOpen"
                :toggle-aside="toggleAside"
                :close-aside="closeAside"
              />
            </aside>
          </div>

          <component :is="mainTag" v-else class="j-shell__main">
            <slot />
          </component>
        </div>
      </div>

      <slot name="bottombar" />
      <component :is="statusTag" v-if="$slots.statusbar" class="j-shell__statusbar">
        <slot name="statusbar" />
      </component>
    </template>

    <template v-else>
      <nav v-if="$slots.rail" class="j-shell__rail" :aria-label="railLabel">
        <slot name="rail" />
      </nav>
      <slot name="sidebar" :sidebar-open="sidebarOpen" :close-sidebar="() => toggleSidebar(false)" />
      <nav v-if="$slots.subnav" class="j-shell__subnav" :aria-label="subnavLabel">
        <slot name="subnav" />
      </nav>
      <button
        v-if="$slots.sidebar || $slots.rail || $slots.subnav || $slots.aside"
        type="button"
        class="j-shell__backdrop"
        tabindex="-1"
        aria-label="Close navigation"
      />

      <div class="j-shell__body">
        <div v-if="$slots.banner" class="j-shell__banner" role="region" :aria-label="bannerLabel">
          <slot name="banner" />
        </div>
        <slot
          name="topbar"
          :sidebar-open="sidebarOpen"
          :toggle-sidebar="toggleSidebar"
          :dock-open="dockOpen"
          :toggle-dock="toggleDock"
          :aside-open="effectiveAsideOpen"
          :toggle-aside="toggleAside"
        />
        <div v-if="$slots.subbar" class="j-shell__subbar">
          <slot name="subbar" />
        </div>

        <div v-if="layout === 'split' || layout === 'three-pane' || $slots.master" class="j-shell__stage">
          <section v-if="$slots.master" class="j-shell__master" :aria-label="masterLabel">
            <slot name="master" :active-pane="activePane" :set-active-pane="setActivePane" />
          </section>
          <component :is="mainTag" class="j-shell__detail">
            <slot :active-pane="activePane" :set-active-pane="setActivePane" />
          </component>
        </div>

        <div
          v-else-if="layout === 'workspace' || layout === 'studio' || layout === 'copilot' || $slots.aside || $slots.dock"
          class="j-shell__stage"
        >
          <div class="j-shell__center">
            <component :is="mainTag" class="j-shell__main">
              <slot />
            </component>
            <section
              v-if="$slots.dock"
              class="j-shell__dock"
              :aria-label="dockLabel"
              :data-collapsed="!dockOpen ? '' : undefined"
            >
              <slot name="dock" :dock-open="dockOpen" :toggle-dock="toggleDock" />
            </section>
          </div>
          <aside v-if="$slots.aside" class="j-shell__aside" :aria-label="asideLabel">
            <slot
              name="aside"
              :aside-open="effectiveAsideOpen"
              :toggle-aside="toggleAside"
              :close-aside="closeAside"
            />
          </aside>
        </div>

        <component :is="mainTag" v-else class="j-shell__main">
          <slot />
        </component>

        <slot name="bottombar" />
        <component :is="statusTag" v-if="$slots.statusbar" class="j-shell__statusbar">
          <slot name="statusbar" />
        </component>
      </div>
    </template>
  </div>
</template>
