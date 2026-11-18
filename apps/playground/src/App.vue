<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Sidebar from './ui/Sidebar.vue';
import TopBar from './ui/TopBar.vue';
import FeedbackPanel from './ui/FeedbackPanel.vue';
import ComponentPage from './ui/ComponentPage.vue';
import OverviewPage from './ui/OverviewPage.vue';
import LayoutSystemPage from './ui/LayoutSystemPage.vue';
import ScreenLayoutsPage from './ui/ScreenLayoutsPage.vue';
import BenchmarksPage from './ui/BenchmarksPage.vue';
import AllFeedbackPage from './ui/AllFeedbackPage.vue';
import { route } from './lib/router';
import { findDemo, findPlanned } from './lib/registry';
import { prefs } from './lib/prefs';

const navOpen = ref(false);

const demo = computed(() => (route.value.name === 'component' ? findDemo(route.value.slug) : null));
const planned = computed(() => (route.value.name === 'component' ? findPlanned(route.value.slug) : null));
const componentName = computed(() => {
  if (route.value.name === 'layout') return 'Layout System';
  if (route.value.name === 'screens') return 'Screen Layouts';
  if (route.value.name === 'benchmarks') return 'Benchmarks';
  return demo.value?.name ?? planned.value?.name ?? null;
});
const showRail = computed(() => !!componentName.value && prefs.rail);

watch(
  route,
  () => {
    navOpen.value = false;
  },
  { deep: true },
);

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && navOpen.value) {
    navOpen.value = false;
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

const crumbs = computed(() => {
  if (route.value.name === 'overview') return ['Overview'];
  if (route.value.name === 'layout') return ['Foundations', 'Layout system'];
  if (route.value.name === 'screens') return ['Foundations', 'Screen layouts'];
  if (route.value.name === 'benchmarks') return ['Foundations', 'Benchmarks'];
  if (route.value.name === 'feedback') return ['All feedback'];
  if (demo.value) return [demo.value.group, demo.value.name];
  if (planned.value) return [planned.value.group, planned.value.name];
  return ['Not found'];
});
</script>

<template>
  <div class="pg-shell" :data-rail="showRail" :data-nav-open="navOpen ? '' : undefined">
    <Sidebar />
    <button
      v-if="navOpen"
      type="button"
      class="pg-scrim"
      aria-label="Close navigation"
      @click="navOpen = false"
    />
    <div class="pg-center">
      <TopBar
        :crumbs="crumbs"
        :show-rail-toggle="!!componentName && !prefs.rail"
        :nav-open="navOpen"
        @toggle-nav="navOpen = !navOpen"
      />
      <main class="pg-main">
        <OverviewPage v-if="route.name === 'overview'" />
        <LayoutSystemPage v-else-if="route.name === 'layout'" />
        <ScreenLayoutsPage v-else-if="route.name === 'screens'" />
        <BenchmarksPage v-else-if="route.name === 'benchmarks'" />
        <AllFeedbackPage v-else-if="route.name === 'feedback'" />
        <ComponentPage v-else :key="route.slug" :slug="route.slug" :demo="demo" :planned="planned" />
      </main>
    </div>
    <Transition name="pg-rail">
      <FeedbackPanel v-if="showRail && componentName" :component="componentName" />
    </Transition>
  </div>
</template>
