import { computed, reactive, ref } from 'vue';

export type NoteType = 'feel' | 'bug' | 'idea' | 'todo';
export type NoteStatus = 'open' | 'done';

export interface Note {
  id: string;
  component: string;
  section: string | null;
  type: NoteType;
  rating: number | null;
  text: string;
  status: NoteStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewNote {
  component: string;
  section?: string | null;
  type: NoteType;
  rating?: number | null;
  text: string;
}

export const NOTE_TYPES: { value: NoteType; label: string; hint: string }[] = [
  { value: 'feel', label: 'Feel', hint: 'How does it feel? Taste, motion, weight.' },
  { value: 'bug', label: 'Bug', hint: 'Something is broken.' },
  { value: 'idea', label: 'Idea', hint: 'A possible improvement.' },
  { value: 'todo', label: 'Todo', hint: 'Work that must be done.' },
];

const API = '/__jenni/feedback';
const LOCAL_STORAGE_KEY = 'jenni.playground.notes.v1';
const IS_DEV = import.meta.env.DEV;

const state = reactive({
  notes: [] as Note[],
  loaded: false,
  offline: false,
});

export const feedbackError = ref<string | null>(null);

function readLocalNotes(): Note[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalNotes(list: Note[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function setNotes(notes: Note[]) {
  state.notes = Array.isArray(notes) ? notes : [];
  state.loaded = true;
}

export async function loadNotes() {
  if (!IS_DEV) {
    setNotes(readLocalNotes());
    state.offline = false;
    feedbackError.value = null;
    return;
  }
  try {
    const data = await call<{ notes: Note[] }>(API);
    setNotes(data.notes);
    state.offline = false;
    feedbackError.value = null;
  } catch {
    setNotes(readLocalNotes());
    state.offline = true;
    feedbackError.value = null;
  }
}

export async function addNote(input: NewNote) {
  if (!IS_DEV || state.offline) {
    const now = new Date().toISOString();
    const note: Note = {
      id: `local-${Date.now().toString(36)}`,
      component: input.component,
      section: input.section ?? null,
      type: input.type,
      rating: input.rating ?? null,
      text: input.text,
      status: 'open',
      resolution: null,
      createdAt: now,
      updatedAt: now,
    };
    state.notes.push(note);
    writeLocalNotes(state.notes);
    return note;
  }
  const note = await call<Note>(API, { method: 'POST', body: JSON.stringify(input) });
  if (!state.notes.some((n) => n.id === note.id)) state.notes.push(note);
  return note;
}

export async function updateNote(id: string, patch: Partial<Pick<Note, 'text' | 'type' | 'rating' | 'status' | 'resolution'>>) {
  if (!IS_DEV || state.offline) {
    const i = state.notes.findIndex((n) => n.id === id);
    if (i === -1) throw new Error('Note not found');
    const updated: Note = { ...state.notes[i]!, ...patch, updatedAt: new Date().toISOString() };
    state.notes[i] = updated;
    writeLocalNotes(state.notes);
    return updated;
  }
  const note = await call<Note>(`${API}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
  const i = state.notes.findIndex((n) => n.id === id);
  if (i !== -1) state.notes[i] = note;
  return note;
}

export async function deleteNote(id: string) {
  if (!IS_DEV || state.offline) {
    state.notes = state.notes.filter((n) => n.id !== id);
    writeLocalNotes(state.notes);
    return;
  }
  await call<Note>(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  state.notes = state.notes.filter((n) => n.id !== id);
}

let started = false;
/** Load notes and subscribe to server pushes (external edits to notes.json). */
export function startFeedbackSync() {
  if (started) return;
  started = true;
  loadNotes();
  if (import.meta.hot) {
    import.meta.hot.on('jenni:feedback', (data: { notes: Note[] }) => setNotes(data.notes));
  }
  if (IS_DEV) {
    window.addEventListener('focus', () => loadNotes());
  }
}

export const notes = computed(() => state.notes);
export const feedbackReady = computed(() => state.loaded);
export const feedbackOffline = computed(() => state.offline);

export function notesFor(component: string, section?: string | null) {
  return state.notes.filter(
    (n) => n.component === component && (section === undefined || (n.section ?? null) === (section ?? null)),
  );
}

export function openCount(component: string, section?: string | null) {
  return notesFor(component, section).filter((n) => n.status === 'open').length;
}

export function sortNotes(list: Note[]) {
  return [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.round(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
