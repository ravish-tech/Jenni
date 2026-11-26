<script setup lang="ts">
import { computed, useSlots } from 'vue';
import {
  normalizeCodeLanguage,
  tokenizeCodeLines,
} from 'jenni-core/behaviors/code-block.js';
import JCopyButton from './JCopyButton.vue';

export type CodeBlockVariant = 'surface' | 'outline' | 'contrast';

export interface JCodeBlockProps {
  /** Source code string rendered inside the block. */
  code: string;
  /** Syntax language identifier (`ts`, `tsx`, `js`, `jsx`, `vue`, `html`, `css`, `json`, `sql`, `sh`, `bash`, `diff`, `python`, `yaml`, or `plain`). */
  language?: string;
  /** Optional file path or title displayed in the header bar. */
  filename?: string;
  /** Render a tabular-numeral line number gutter. */
  lineNumbers?: boolean;
  /** Starting 1-based line number when `lineNumbers` or `highlightLines` is used. */
  startLine?: number;
  /** Line numbers to emphasize with `--j-code-line-highlight`. */
  highlightLines?: readonly number[];
  /** Enable unified diff line parsing (`+`, `-`, `@@`). Enabled automatically when `language === 'diff'`. */
  diff?: boolean;
  /** Soft-wrap long lines instead of scrolling horizontally. */
  wrap?: boolean;
  /** Show a copy-to-clipboard button for the raw `code`. */
  copyable?: boolean;
  /** Constrain scrollable viewport height (number in px or CSS length). */
  maxHeight?: string | number;
  /** Container surface and border treatment. */
  variant?: CodeBlockVariant;
}

defineOptions({ name: 'JCodeBlock' });

const props = withDefaults(defineProps<JCodeBlockProps>(), {
  language: 'plain',
  lineNumbers: false,
  startLine: 1,
  wrap: false,
  copyable: true,
  variant: 'outline',
});

const emit = defineEmits<{
  copy: [value: string];
}>();

const slots = useSlots();

const normalizedLang = computed(() => normalizeCodeLanguage(props.language));

const displayLanguage = computed(() => {
  const raw = (props.language ?? '').trim().toLowerCase();
  if (!raw || raw === 'plain' || raw === 'plaintext' || raw === 'text') return '';
  return raw;
});

const isDiff = computed(() =>
  props.diff !== undefined ? props.diff : normalizedLang.value === 'diff',
);

const highlightSet = computed(() => new Set<number>(props.highlightLines ?? []));

const lines = computed(() =>
  tokenizeCodeLines(props.code, props.language ?? 'plain', {
    startLine: props.startLine,
    diff: isDiff.value,
  }),
);

const showHeader = computed(() =>
  Boolean(props.filename || displayLanguage.value || slots.actions),
);

const blockStyle = computed<Record<string, string> | undefined>(() => {
  if (props.maxHeight == null) return undefined;
  const val = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
  return { '--j-code-max-h': val };
});
</script>

<template>
  <div
    class="j-code-block"
    data-j-managed=""
    :data-variant="variant === 'outline' ? undefined : variant"
    :data-lang="normalizedLang"
    :data-line-numbers="lineNumbers ? '' : undefined"
    :data-wrap="wrap ? '' : undefined"
    :style="blockStyle"
  >
    <div v-if="showHeader" class="j-code-block__header">
      <div class="j-code-block__meta">
        <span v-if="filename" class="j-code-block__filename">{{ filename }}</span>
        <span v-if="displayLanguage" class="j-code-block__lang">{{ displayLanguage }}</span>
      </div>
      <div v-if="$slots.actions || copyable" class="j-code-block__actions">
        <slot name="actions" />
        <JCopyButton
          v-if="copyable"
          :value="code"
          size="xs"
          variant="ghost"
          aria-label="Copy code"
          @copy="emit('copy', $event)"
        />
      </div>
    </div>

    <div class="j-code-block__body">
      <div
        v-if="!showHeader && copyable"
        class="j-code-block__floating-actions"
      >
        <JCopyButton
          :value="code"
          size="xs"
          variant="ghost"
          aria-label="Copy code"
          @copy="emit('copy', $event)"
        />
      </div>

      <pre
        class="j-code-block__pre"
        :tabindex="maxHeight != null ? 0 : undefined"
      ><code class="j-code-block__code"><span
        v-for="line in lines"
        :key="line.lineNumber"
        class="j-code-block__line"
        :data-highlighted="highlightSet.has(line.lineNumber) ? '' : undefined"
        :data-diff="line.diff ?? undefined"
      ><span
        v-if="lineNumbers"
        class="j-code-block__gutter"
        aria-hidden="true"
      >{{ line.lineNumber }}</span><span class="j-code-block__content"><span
        v-for="(tok, ti) in line.tokens"
        :key="ti"
        class="j-code-tok"
        :data-tok="tok.type"
      >{{ tok.text }}</span></span></span></code></pre>
    </div>
  </div>
</template>
