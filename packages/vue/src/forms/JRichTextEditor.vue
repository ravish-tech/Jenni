<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from 'vue';
import {
  DEFAULT_TOOLBAR_GROUPS,
  TOOLBAR_META,
  applyLinkAtRange,
  countProseStats,
  execRichTextAction,
  isEditorEmpty,
  readActiveFormats,
  removeLinkAtRange,
  restoreSelectionRange,
  saveSelectionRange,
  type ActiveFormats,
} from 'jenni-core/behaviors/rich-text.js';
import {
  splitAttrs,
  useFieldAttrs,
  type RichTextAction,
  type Tone,
} from './types';

defineOptions({ inheritAttrs: false });

const model = defineModel<string>({ default: '' });

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    minRows?: number;
    minHeight?: string | number;
    toolbar?: RichTextAction[][] | RichTextAction[];
    showFooter?: boolean;
    tone?: Tone;
    readonly?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    name?: string;
  }>(),
  {
    placeholder: 'Write something…',
    minRows: 5,
    showFooter: true,
  },
);

const emit = defineEmits<{
  change: [value: string];
}>();

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
const parts = computed(() => splitAttrs(attrs));

const linkUrlPlaceholder = 'https://example.com';

const editorEl = useTemplateRef<HTMLDivElement>('editorEl');
const linkInputEl = useTemplateRef<HTMLInputElement>('linkInputEl');

const isDisabled = computed(() => !!(props.disabled || field.value.disabled));
const isInvalid = computed(() => !!(props.invalid || field.value['aria-invalid']));

const toolbarGroups = computed<RichTextAction[][]>(() => {
  if (!props.toolbar) return DEFAULT_TOOLBAR_GROUPS;
  if (props.toolbar.length === 0) return [];
  if (Array.isArray(props.toolbar[0])) return props.toolbar as RichTextAction[][];
  return [props.toolbar as RichTextAction[]];
});

const formats = ref<ActiveFormats>({
  block: 'p',
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
  bulletList: false,
  orderedList: false,
  link: false,
  linkHref: '',
});

const empty = ref(!model.value);
const stats = ref(countProseStats(model.value || ''));
const linkBarOpen = ref(false);
const linkDraft = ref('');
let savedRange: Range | null = null;

const contentStyle = computed(() => {
  const styles: Record<string, string> = {
    '--_rte-rows': String(props.minRows),
  };
  if (props.minHeight != null) {
    styles['--_rte-min-h'] =
      typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight;
  }
  return styles;
});

function isActionActive(act: RichTextAction): boolean {
  if (act === 'p' || act === 'h2' || act === 'h3' || act === 'blockquote') {
    return formats.value.block === act;
  }
  if (
    act === 'bold' ||
    act === 'italic' ||
    act === 'underline' ||
    act === 'strike' ||
    act === 'code' ||
    act === 'bulletList' ||
    act === 'orderedList' ||
    act === 'link'
  ) {
    return formats.value[act];
  }
  return false;
}

function isToggleable(act: RichTextAction): boolean {
  return act !== 'clear' && act !== 'undo' && act !== 'redo';
}

function syncEditorMetrics() {
  const el = editorEl.value;
  if (!el) return;
  empty.value = isEditorEmpty(el);
  formats.value = readActiveFormats(el);
  stats.value = countProseStats(el);
}

function emitEditorHtml() {
  const el = editorEl.value;
  if (!el) return;
  syncEditorMetrics();
  const nextHtml = empty.value ? '' : el.innerHTML;
  if (nextHtml !== model.value) {
    model.value = nextHtml;
    emit('change', nextHtml);
  }
}

function openLinkBar() {
  const el = editorEl.value;
  if (!el || isDisabled.value || props.readonly) return;
  savedRange = saveSelectionRange(el);
  const f = readActiveFormats(el);
  linkDraft.value = f.linkHref || '';
  linkBarOpen.value = true;
  nextTick(() => {
    linkInputEl.value?.focus();
    linkInputEl.value?.select();
  });
}

function closeLinkBar(restore = true) {
  linkBarOpen.value = false;
  if (restore && editorEl.value) {
    restoreSelectionRange(editorEl.value, savedRange);
    syncEditorMetrics();
  }
}

function applyLink() {
  if (!editorEl.value) return;
  applyLinkAtRange(editorEl.value, savedRange, linkDraft.value);
  linkBarOpen.value = false;
  emitEditorHtml();
}

function removeLink() {
  if (!editorEl.value) return;
  removeLinkAtRange(editorEl.value, savedRange);
  linkBarOpen.value = false;
  emitEditorHtml();
}

function triggerAction(act: RichTextAction) {
  const el = editorEl.value;
  if (!el || isDisabled.value || props.readonly) return;
  if (act === 'link') {
    if (linkBarOpen.value) closeLinkBar(true);
    else openLinkBar();
    return;
  }
  execRichTextAction(el, act);
  emitEditorHtml();
}

function onEditorKeydown(e: KeyboardEvent) {
  if (isDisabled.value || props.readonly || !editorEl.value) return;
  const mod = e.metaKey || e.ctrlKey;
  if (!mod || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'b') {
    e.preventDefault();
    triggerAction('bold');
  } else if (k === 'i') {
    e.preventDefault();
    triggerAction('italic');
  } else if (k === 'u') {
    e.preventDefault();
    triggerAction('underline');
  } else if (k === 'e') {
    e.preventDefault();
    triggerAction('code');
  } else if (k === 'k') {
    e.preventDefault();
    openLinkBar();
  }
}

function onSelectionChange() {
  const el = editorEl.value;
  if (!el) return;
  const sel = document.getSelection();
  if (sel?.anchorNode && el.contains(sel.anchorNode)) {
    formats.value = readActiveFormats(el);
  }
}

watch(
  () => model.value,
  (val) => {
    const el = editorEl.value;
    if (!el) return;
    const currentHtml = isEditorEmpty(el) ? '' : el.innerHTML;
    if ((val || '') !== currentHtml) {
      el.innerHTML = val || '';
      syncEditorMetrics();
    }
  },
);

onMounted(() => {
  if (editorEl.value) {
    editorEl.value.innerHTML = model.value || '';
    syncEditorMetrics();
  }
  document.addEventListener('selectionchange', onSelectionChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange);
});

defineExpose({ focus: () => editorEl.value?.focus(), editor: editorEl });
</script>

<template>
  <div
    class="j-rich-text"
    data-j-managed=""
    :data-tone="tone"
    :data-readonly="readonly ? '' : undefined"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-invalid="isInvalid ? 'true' : undefined"
    v-bind="parts.root"
  >
    <input v-if="name" type="hidden" :name="name" :value="model" />

    <div
      v-if="!readonly && toolbarGroups.length"
      class="j-rich-text__toolbar"
      role="toolbar"
      aria-label="Text formatting"
      @mousedown.prevent
    >
      <template v-for="(group, gIdx) in toolbarGroups" :key="gIdx">
        <span v-if="gIdx > 0" class="j-rich-text__sep" aria-hidden="true" />
        <div class="j-rich-text__group">
          <button
            v-for="act in group"
            :key="act"
            type="button"
            class="j-rich-text__btn"
            :data-action="act"
            :title="TOOLBAR_META[act].label"
            :aria-label="TOOLBAR_META[act].label"
            :aria-pressed="isToggleable(act) ? (isActionActive(act) ? 'true' : 'false') : undefined"
            :disabled="isDisabled || undefined"
            @click="triggerAction(act)"
          >
            <strong v-if="act === 'bold'">B</strong>
            <em v-else-if="act === 'italic'" style="font-family: Georgia, serif">I</em>
            <span v-else-if="act === 'underline'" style="text-decoration: underline">U</span>
            <span v-else-if="act === 'strike'" style="text-decoration: line-through">S</span>
            <span v-else-if="act === 'code'" style="font-family: var(--j-font-mono); font-size: 11px">&lt;/&gt;</span>
            <svg
              v-else-if="act === 'link'"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M6.5 9.5a3 3 0 0 0 4.24 0l2-2a3 3 0 0 0-4.24-4.24l-1.1 1.1" />
              <path d="M9.5 6.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 0 0 4.24 4.24l1.1-1.1" />
            </svg>
            <svg
              v-else-if="act === 'bulletList'"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="3" cy="4.5" r="0.8" fill="currentColor" />
              <circle cx="3" cy="8" r="0.8" fill="currentColor" />
              <circle cx="3" cy="11.5" r="0.8" fill="currentColor" />
              <path d="M6 4.5h7.5M6 8h7.5M6 11.5h7.5" />
            </svg>
            <svg
              v-else-if="act === 'orderedList'"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h7M2.5 3.5v2.5M2.2 8.2h1.6l-1.6 2h1.6" />
            </svg>
            <span v-else>{{ TOOLBAR_META[act].short }}</span>
          </button>
        </div>
      </template>
    </div>

    <div v-if="linkBarOpen && !readonly" class="j-rich-text__link-bar">
      <input
        ref="linkInputEl"
        v-model="linkDraft"
        type="url"
        class="j-rich-text__link-input"
        aria-label="Link URL"
        :placeholder="linkUrlPlaceholder"
        @keydown.enter.prevent="applyLink"
        @keydown.esc.prevent="closeLinkBar(true)"
      />
      <button
        type="button"
        class="j-rich-text__link-btn"
        data-primary=""
        @click="applyLink"
      >
        Apply
      </button>
      <button
        v-if="formats.link"
        type="button"
        class="j-rich-text__link-btn"
        data-danger=""
        @click="removeLink"
      >
        Remove
      </button>
      <button
        type="button"
        class="j-rich-text__link-btn"
        @click="closeLinkBar(true)"
      >
        Cancel
      </button>
    </div>

    <div
      :id="field.id"
      ref="editorEl"
      class="j-rich-text__content"
      role="textbox"
      aria-multiline="true"
      :contenteditable="!isDisabled && !readonly ? 'true' : 'false'"
      :aria-readonly="readonly ? 'true' : undefined"
      :aria-describedby="field['aria-describedby']"
      :aria-invalid="field['aria-invalid']"
      :data-placeholder="placeholder"
      :data-empty="empty ? '' : undefined"
      :style="contentStyle"
      v-bind="parts.control"
      @input="emitEditorHtml"
      @keydown="onEditorKeydown"
      @keyup="syncEditorMetrics"
      @mouseup="syncEditorMetrics"
    />

    <div v-if="showFooter" class="j-rich-text__footer">
      <span>{{ readonly ? 'Read-only' : 'Rich text' }}</span>
      <span class="j-rich-text__counts">
        {{ stats.words }} {{ stats.words === 1 ? 'word' : 'words' }} · {{ stats.chars }}
        {{ stats.chars === 1 ? 'char' : 'chars' }}
      </span>
    </div>
  </div>
</template>
