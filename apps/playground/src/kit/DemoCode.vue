<script setup lang="ts">
// Public API is fixed: props `lang` ('html' | 'vue' | 'tsx'), `code` (string).
// When lang="html" the code is ALSO rendered live (v-html) above the code block to prove core works.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as core from '@jenni/core';
import { highlight } from './highlight';
import Icon from '@/ui/Icon.vue';

const props = defineProps<{ lang?: 'html' | 'vue' | 'tsx'; code: string; codeOnly?: boolean }>();

const lang = computed(() => props.lang ?? 'html');
const showPreview = computed(() => lang.value === 'html' && !props.codeOnly);
const source = computed(() => dedent(props.code));
const html = computed(() => highlight(source.value, lang.value));
const expanded = ref(Boolean(props.codeOnly));
const copied = ref(false);
const preview = ref<HTMLElement | null>(null);
let cleanups: (() => void)[] = [];

function dedent(s: string) {
  const lines = s.replace(/^\n+|\s+$/g, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length));
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0)).join('\n');
}

async function copy() {
  try {
    await navigator.clipboard.writeText(source.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1400);
  } catch { /* clipboard blocked */ }
}

/** Run every exported core behavior (initX(root) → cleanup) on the live HTML preview. */
function initBehaviors() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  if (!preview.value) return;
  for (const [key, fn] of Object.entries(core as Record<string, unknown>)) {
    if (!/^init[A-Z]/.test(key) || typeof fn !== 'function') continue;
    try {
      const cleanup = (fn as (root: Element) => unknown)(preview.value);
      if (typeof cleanup === 'function') cleanups.push(cleanup as () => void);
    } catch (err) {
      console.warn(`[DemoCode] ${key} failed`, err);
    }
  }
}

onMounted(() => { if (showPreview.value) initBehaviors(); });
watch([source, showPreview], () => nextTick(() => { if (showPreview.value) initBehaviors(); }));
onBeforeUnmount(() => cleanups.forEach((fn) => fn()));
</script>

<template>
  <div class="pg-code" :data-expanded="expanded">
    <div v-if="showPreview" ref="preview" class="pg-code__preview" v-html="source" />
    <div class="pg-code__bar">
      <button class="pg-code__toggle" :aria-expanded="expanded" @click="expanded = !expanded">
        <Icon :name="expanded ? 'chevron' : 'chevron-right'" :size="13" />
        <span class="pg-code__lang">{{ lang === 'html' ? 'Plain HTML' : lang === 'vue' ? 'Vue' : 'React' }}</span>
        <span class="pg-muted">{{ expanded ? 'Hide code' : 'Show code' }}</span>
      </button>
      <button class="pg-code__copy" :title="copied ? 'Copied' : 'Copy code'" @click="copy">
        <Icon :name="copied ? 'check' : 'copy'" :size="13" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <pre v-if="expanded" class="pg-code__pre"><code v-html="html" /></pre>
  </div>
</template>
