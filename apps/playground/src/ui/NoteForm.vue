<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { addNote, NOTE_TYPES, type NoteType } from '@/lib/feedback';

const props = defineProps<{ component: string; section?: string | null; autofocus?: boolean; compact?: boolean }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const type = ref<NoteType>('feel');
const text = ref('');
const rating = ref<number | null>(null);
const hover = ref<number | null>(null);
const busy = ref(false);
const error = ref<string | null>(null);
const area = ref<HTMLTextAreaElement | null>(null);

onMounted(() => { if (props.autofocus) nextTick(() => area.value?.focus()); });

function setRating(n: number) {
  rating.value = rating.value === n ? null : n;
}

async function submit() {
  if (!text.value.trim() || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    await addNote({ component: props.component, section: props.section ?? null, type: type.value, rating: rating.value, text: text.value });
    text.value = '';
    rating.value = null;
    emit('saved');
  } catch (err: any) {
    error.value = err?.message ?? 'Could not save';
  } finally {
    busy.value = false;
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
  if (e.key === 'Escape') { e.preventDefault(); emit('cancel'); }
}

const placeholders: Record<NoteType, string> = {
  feel: 'How does it feel? Too heavy, too soft, just right…',
  bug: 'What broke, and how to reproduce it?',
  idea: 'What could make this better?',
  todo: 'What needs to be done?',
};
</script>

<template>
  <form class="pg-note-form" :class="{ 'is-compact': compact }" @submit.prevent="submit">
    <div class="pg-note-form__types" role="radiogroup" aria-label="Note type">
      <button
        v-for="t in NOTE_TYPES"
        :key="t.value"
        type="button"
        role="radio"
        class="pg-type-chip"
        :data-type="t.value"
        :aria-checked="type === t.value"
        :title="t.hint"
        @click="type = t.value"
      >
        <span class="pg-type-dot" />{{ t.label }}
      </button>
    </div>

    <textarea
      ref="area"
      v-model="text"
      class="pg-textarea"
      :placeholder="placeholders[type]"
      rows="3"
      @keydown="onKey"
    />

    <div class="pg-note-form__foot">
      <div class="pg-rating" role="group" aria-label="Feel rating (optional)" @mouseleave="hover = null">
        <span class="pg-rating__label">Feel</span>
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="pg-rating__pip"
          :data-on="(hover ?? rating ?? 0) >= n"
          :aria-label="`${n} of 5`"
          :aria-pressed="rating === n"
          @mouseenter="hover = n"
          @click="setRating(n)"
        />
      </div>
      <div class="pg-note-form__actions">
        <span class="pg-kbd-hint">⌘↵</span>
        <button v-if="compact" type="button" class="pg-btn" data-variant="ghost" @click="emit('cancel')">Cancel</button>
        <button type="submit" class="pg-btn" data-variant="solid" :disabled="!text.trim() || busy">Add note</button>
      </div>
    </div>
    <p v-if="error" class="pg-error">{{ error }}</p>
  </form>
</template>
