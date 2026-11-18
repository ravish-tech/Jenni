<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import Icon from './Icon.vue';
import { demos, GROUP_ORDER, groupDemos, planned } from '@/lib/registry';
import { notes, openCount } from '@/lib/feedback';
import { href, route } from '@/lib/router';

const query = ref('');
const search = ref<HTMLInputElement | null>(null);
const showPlanned = ref(true);

const q = computed(() => query.value.trim().toLowerCase());
const match = (s: string) => !q.value || s.toLowerCase().includes(q.value);

const groups = computed(() =>
  groupDemos(demos.filter((d) => match(d.name) || match(d.group))),
);
const plannedGroups = computed(() => {
  const map = new Map<string, typeof planned>();
  for (const p of planned) {
    if (!match(p.name)) continue;
    if (!map.has(p.group)) map.set(p.group, []);
    map.get(p.group)!.push(p);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    })
    .map(([group, items]) => ({ group, items }));
});
const totalOpen = computed(() => notes.value.filter((n) => n.status === 'open').length);
const current = computed(() => (route.value.name === 'component' ? route.value.slug : null));

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if (e.key === '/' && !typing) { e.preventDefault(); search.value?.focus(); }
  if (e.key === 'Escape' && t === search.value) { query.value = ''; search.value?.blur(); }
}
function onSearchEnter() {
  const first = groups.value[0]?.items[0] ?? plannedGroups.value[0]?.items[0];
  if (first) location.hash = `/${first.slug}`;
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <nav class="pg-sidebar" aria-label="Components">
    <a class="pg-brand" :href="href('')">
      <span class="pg-brand__mark" aria-hidden="true" />
      <span class="pg-brand__word">jenni</span>
      <span class="pg-brand__tag">lab</span>
    </a>

    <label class="pg-search">
      <Icon name="search" :size="14" />
      <input ref="search" v-model="query" type="search" placeholder="Search components" @keydown.enter="onSearchEnter" />
      <kbd class="pg-kbd">/</kbd>
    </label>

    <div class="pg-sidebar__scroll">
      <div class="pg-nav-group">
        <a class="pg-nav-item" :href="href('')" :aria-current="route.name === 'overview' ? 'page' : undefined">
          <Icon name="home" :size="15" /> Overview
        </a>
        <a class="pg-nav-item" :href="href('layout')" :aria-current="route.name === 'layout' ? 'page' : undefined">
          <Icon name="layout" :size="15" />
          <span class="pg-nav-item__name">Layout system</span>
          <span v-if="openCount('Layout System')" class="pg-count">{{ openCount('Layout System') }}</span>
        </a>
        <a class="pg-nav-item" :href="href('screens')" :aria-current="route.name === 'screens' ? 'page' : undefined">
          <Icon name="screens" :size="15" />
          <span class="pg-nav-item__name">Screen layouts</span>
          <span v-if="openCount('Screen Layouts')" class="pg-count">{{ openCount('Screen Layouts') }}</span>
        </a>
        <a class="pg-nav-item" :href="href('benchmarks')" :aria-current="route.name === 'benchmarks' ? 'page' : undefined">
          <Icon name="gauge" :size="15" />
          <span class="pg-nav-item__name">Benchmarks</span>
          <span v-if="openCount('Benchmarks')" class="pg-count">{{ openCount('Benchmarks') }}</span>
        </a>
        <a class="pg-nav-item" :href="href('feedback')" :aria-current="route.name === 'feedback' ? 'page' : undefined">
          <Icon name="inbox" :size="15" /> All feedback
          <span v-if="totalOpen" class="pg-count is-accent">{{ totalOpen }}</span>
        </a>
      </div>

      <div v-for="g in groups" :key="g.group" class="pg-nav-group">
        <p class="pg-nav-label">{{ g.group }}</p>
        <a
          v-for="d in g.items"
          :key="d.slug"
          class="pg-nav-item"
          :href="href(d.slug)"
          :aria-current="current === d.slug ? 'page' : undefined"
        >
          <span class="pg-status-dot" :data-status="d.status" :title="d.status" />
          <span class="pg-nav-item__name">{{ d.name }}</span>
          <span v-if="openCount(d.name)" class="pg-count">{{ openCount(d.name) }}</span>
        </a>
      </div>

      <div v-if="!demos.length && !q" class="pg-nav-empty">
        No demos yet. Add <code>src/demos/&lt;group&gt;/&lt;Name&gt;.demo.vue</code>.
      </div>
      <div v-else-if="!groups.length && !plannedGroups.length" class="pg-nav-empty">No match for “{{ query }}”.</div>

      <div v-if="plannedGroups.length" class="pg-nav-group is-planned">
        <button class="pg-nav-label is-toggle" :aria-expanded="showPlanned" @click="showPlanned = !showPlanned">
          <Icon :name="showPlanned ? 'chevron' : 'chevron-right'" :size="12" /> Planned
        </button>
        <template v-if="showPlanned || q">
          <template v-for="g in plannedGroups" :key="g.group">
            <p class="pg-nav-sublabel">{{ g.group }}</p>
            <a
              v-for="p in g.items"
              :key="p.slug"
              class="pg-nav-item is-planned"
              :href="href(p.slug)"
              :aria-current="current === p.slug ? 'page' : undefined"
            >
              <span class="pg-status-dot" data-status="planned" />
              <span class="pg-nav-item__name">{{ p.name }}</span>
              <span v-if="openCount(p.name)" class="pg-count">{{ openCount(p.name) }}</span>
            </a>
          </template>
        </template>
      </div>
    </div>
  </nav>
</template>
