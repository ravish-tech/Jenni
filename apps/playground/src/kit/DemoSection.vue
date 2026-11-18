<script setup lang="ts">
// Public API is fixed: props `title` (required), `description` (optional). Default slot = examples.
// Each section gets its own feedback thread keyed by component (from the page) + section title.
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { DEMO_CONTEXT, sectionId } from './context';
import { notesFor, sortNotes } from '@/lib/feedback';
import { prefs } from '@/lib/prefs';
import Icon from '@/ui/Icon.vue';
import NoteForm from '@/ui/NoteForm.vue';
import NoteItem from '@/ui/NoteItem.vue';

const props = defineProps<{ title: string; description?: string; flush?: boolean }>();

const ctx = inject(DEMO_CONTEXT, null);
const component = computed(() => ctx?.component.value ?? 'Unknown');
const open = ref(false);

const sectionNotes = computed(() => sortNotes(notesFor(component.value, props.title)));
const openNotes = computed(() => sectionNotes.value.filter((n) => n.status === 'open'));

onMounted(() => ctx?.register(props.title));
onBeforeUnmount(() => ctx?.unregister(props.title));
</script>

<template>
  <section :id="sectionId(title)" class="pg-section" :data-open="open">
    <header class="pg-section__head">
      <div class="pg-section__text">
        <h3 class="pg-section__title">{{ title }}</h3>
        <p v-if="description" class="pg-section__desc">{{ description }}</p>
      </div>
      <button
        class="pg-section__note-btn"
        :aria-expanded="open"
        :data-has="openNotes.length > 0"
        :title="open ? 'Close notes' : 'Add a note on this section'"
        @click="open = !open"
      >
        <Icon :name="open ? 'x' : 'message'" :size="14" />
        <span v-if="openNotes.length" class="pg-section__badge">{{ openNotes.length }}</span>
        <span v-else-if="!open" class="pg-section__note-label">Note</span>
      </button>
    </header>

    <div class="pg-stage" :data-bg="prefs.stage" :data-flush="flush ? '' : undefined">
      <slot />
    </div>

    <div v-if="open" class="pg-section__notes">
      <NoteForm :component="component" :section="title" autofocus compact @cancel="open = false" />
      <div v-if="sectionNotes.length" class="pg-note-list">
        <NoteItem v-for="n in sectionNotes" :key="n.id" :note="n" />
      </div>
    </div>
  </section>
</template>
