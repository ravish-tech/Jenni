<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import NoteItem from './NoteItem.vue';
import { feedbackError, NOTE_TYPES, notes, type Note, type NoteType } from '@/lib/feedback';
import { href } from '@/lib/router';
import { slugify } from '@/lib/registry';

const type = ref<NoteType | 'all'>('all');
const showDone = ref(false);

function group(list: Note[]) {
  const map = new Map<string, Note[]>();
  for (const n of list) {
    if (!map.has(n.component)) map.set(n.component, []);
    map.get(n.component)!.push(n);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([component, items]) => ({ component, items: items.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }));
}

const filtered = computed(() => notes.value.filter((n) => type.value === 'all' || n.type === type.value));
const openGroups = computed(() => group(filtered.value.filter((n) => n.status === 'open')));
const doneList = computed(() =>
  filtered.value.filter((n) => n.status === 'done').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
);
const openTotal = computed(() => openGroups.value.reduce((s, g) => s + g.items.length, 0));
const typeCount = (t: NoteType) => notes.value.filter((n) => n.status === 'open' && n.type === t).length;
</script>

<template>
  <div class="pg-page">
    <header class="pg-page__head">
      <p class="pg-eyebrow">Inbox</p>
      <div class="pg-page__title-row">
        <h1 class="pg-page__title">All feedback</h1>
        <span class="pg-pill is-notes">{{ openTotal }} open</span>
      </div>
      <p class="pg-page__lede">
        Every open note across components. Ask the agent to “work on feedback” — it reads
        <code>feedback/TODO.md</code>, fixes, and marks items done.
      </p>
    </header>

    <p v-if="feedbackError" class="pg-callout">{{ feedbackError }}</p>

    <div class="pg-filter-row">
      <div class="pg-tabs" role="tablist">
        <button role="tab" class="pg-tab" :aria-selected="type === 'all'" @click="type = 'all'">all</button>
        <button
          v-for="t in NOTE_TYPES"
          :key="t.value"
          role="tab"
          class="pg-tab"
          :aria-selected="type === t.value"
          @click="type = t.value"
        >
          <span class="pg-type-dot" :data-type="t.value" /> {{ t.value }}
          <span class="pg-count">{{ typeCount(t.value) }}</span>
        </button>
      </div>
    </div>

    <div v-if="!openGroups.length" class="pg-empty">
      <Icon name="check" :size="20" />
      <p>Inbox zero. Nothing open{{ type !== 'all' ? ` for “${type}”` : '' }}.</p>
    </div>

    <section v-for="g in openGroups" :key="g.component" class="pg-inbox-group">
      <h2 class="pg-section-title">
        <a :href="href(slugify(g.component))">{{ g.component }}</a>
        <span class="pg-muted">{{ g.items.length }}</span>
      </h2>
      <div class="pg-note-list">
        <NoteItem v-for="n in g.items" :key="n.id" :note="n" show-section />
      </div>
    </section>

    <section v-if="doneList.length" class="pg-inbox-group">
      <button class="pg-section-title is-toggle" :aria-expanded="showDone" @click="showDone = !showDone">
        <Icon :name="showDone ? 'chevron' : 'chevron-right'" :size="14" /> Done
        <span class="pg-muted">{{ doneList.length }}</span>
      </button>
      <div v-if="showDone" class="pg-note-list">
        <NoteItem v-for="n in doneList" :key="n.id" :note="n" show-component show-section />
      </div>
    </section>
  </div>
</template>
