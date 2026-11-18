<script setup lang="ts">
import { ref } from 'vue';
import Icon from './Icon.vue';
import { deleteNote, timeAgo, updateNote, type Note } from '@/lib/feedback';
import { href } from '@/lib/router';
import { slugify } from '@/lib/registry';

const props = defineProps<{ note: Note; showComponent?: boolean; showSection?: boolean }>();

const confirming = ref(false);
const resolving = ref(false);
const resolution = ref('');
const error = ref<string | null>(null);
let confirmTimer: number | undefined;

async function run(fn: () => Promise<unknown>) {
  error.value = null;
  try { await fn(); } catch (err: any) { error.value = err?.message ?? 'Failed'; }
}

function markDone() {
  return run(async () => {
    await updateNote(props.note.id, { status: 'done', resolution: resolution.value.trim() || null });
    resolving.value = false;
    resolution.value = '';
  });
}
const reopen = () => run(() => updateNote(props.note.id, { status: 'open' }));

function remove() {
  if (!confirming.value) {
    confirming.value = true;
    clearTimeout(confirmTimer);
    confirmTimer = window.setTimeout(() => (confirming.value = false), 2500);
    return;
  }
  run(() => deleteNote(props.note.id));
}

function onResKey(e: KeyboardEvent) {
  if (e.key === 'Enter') { e.preventDefault(); markDone(); }
  if (e.key === 'Escape') { resolving.value = false; }
}
</script>

<template>
  <article class="pg-note" :data-status="note.status" :data-type="note.type">
    <header class="pg-note__head">
      <span class="pg-type-tag" :data-type="note.type"><span class="pg-type-dot" />{{ note.type }}</span>
      <a v-if="showComponent" class="pg-note__where" :href="href(slugify(note.component))">{{ note.component }}</a>
      <span v-if="showSection && note.section" class="pg-note__where is-section">{{ note.section }}</span>
      <span v-if="note.rating" class="pg-note__rating" :title="`Feel ${note.rating}/5`">
        <span v-for="n in 5" :key="n" :data-on="n <= note.rating" />
      </span>
      <time class="pg-note__time" :datetime="note.createdAt" :title="new Date(note.createdAt).toLocaleString()">{{ timeAgo(note.createdAt) }}</time>
    </header>

    <p class="pg-note__text">{{ note.text }}</p>

    <p v-if="note.status === 'done' && note.resolution" class="pg-note__resolution">
      <Icon name="check" :size="13" /> {{ note.resolution }}
    </p>

    <div v-if="resolving" class="pg-note__resolve">
      <input
        v-model="resolution"
        class="pg-input"
        placeholder="Resolution (optional) — Enter to confirm"
        autofocus
        @keydown="onResKey"
      />
      <button class="pg-btn" data-size="sm" data-variant="solid" @click="markDone">Done</button>
    </div>

    <footer class="pg-note__actions">
      <template v-if="note.status === 'open'">
        <button class="pg-btn" data-size="sm" data-variant="ghost" @click="resolving ? markDone() : (resolving = true)">
          <Icon name="check" :size="14" /> Mark done
        </button>
      </template>
      <button v-else class="pg-btn" data-size="sm" data-variant="ghost" @click="reopen">
        <Icon name="undo" :size="14" /> Reopen
      </button>
      <button class="pg-btn" data-size="sm" data-variant="ghost" :data-danger="confirming" @click="remove">
        <Icon name="trash" :size="14" /> {{ confirming ? 'Confirm delete' : 'Delete' }}
      </button>
      <span class="pg-note__id" title="Note id (referenced in TODO.md)">{{ note.id }}</span>
    </footer>
    <p v-if="error" class="pg-error">{{ error }}</p>
  </article>
</template>
