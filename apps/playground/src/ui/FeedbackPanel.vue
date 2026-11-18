<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import NoteForm from './NoteForm.vue';
import NoteItem from './NoteItem.vue';
import { feedbackError, notesFor, sortNotes } from '@/lib/feedback';
import { prefs } from '@/lib/prefs';

const props = defineProps<{ component: string }>();

type Filter = 'open' | 'done' | 'all';
const filter = ref<Filter>('open');

const all = computed(() => notesFor(props.component));
const counts = computed(() => ({
  open: all.value.filter((n) => n.status === 'open').length,
  done: all.value.filter((n) => n.status === 'done').length,
  all: all.value.length,
}));
const list = computed(() => sortNotes(filter.value === 'all' ? all.value : all.value.filter((n) => n.status === filter.value)));
const avgFeel = computed(() => {
  const r = all.value.map((n) => n.rating).filter((x): x is number => !!x);
  return r.length ? (r.reduce((a, b) => a + b, 0) / r.length).toFixed(1) : null;
});
</script>

<template>
  <aside class="pg-rail" aria-label="Feedback">
    <header class="pg-rail__head">
      <div>
        <p class="pg-eyebrow">Feedback</p>
        <h2 class="pg-rail__title">{{ component }}</h2>
      </div>
      <span v-if="avgFeel" class="pg-rail__feel" title="Average feel rating">feel {{ avgFeel }}<small>/5</small></span>
      <button class="pg-icon-btn" title="Hide feedback panel" @click="prefs.rail = false">
        <Icon name="panel" />
      </button>
    </header>

    <div class="pg-rail__body">
      <p v-if="feedbackError" class="pg-callout">{{ feedbackError }}</p>
      <NoteForm :component="component" :section="null" />

      <div class="pg-tabs" role="tablist">
        <button
          v-for="f in (['open', 'done', 'all'] as Filter[])"
          :key="f"
          role="tab"
          class="pg-tab"
          :aria-selected="filter === f"
          @click="filter = f"
        >
          {{ f }} <span class="pg-count">{{ counts[f] }}</span>
        </button>
      </div>

      <div class="pg-note-list">
        <NoteItem v-for="n in list" :key="n.id" :note="n" show-section />
        <div v-if="!list.length" class="pg-empty is-small">
          <Icon name="message" :size="18" />
          <p v-if="filter === 'open'">No open notes. Use it, then say how it feels.</p>
          <p v-else>Nothing here yet.</p>
        </div>
      </div>
    </div>
  </aside>
</template>
